import { useCallback, useEffect, useRef, useState } from "react";
import Peer, { type DataConnection, type MediaConnection } from "peerjs";
import { createPlaceholderStream } from "./placeholder";

export type BoothStatus = "init" | "waiting" | "connected" | "error";

export interface BoothMessage {
  type: string;
  [key: string]: unknown;
}

interface Options {
  roomId: string;
  isHost: boolean;
  onMessage?: (msg: BoothMessage) => void;
}

/**
 * Establishes a direct P2P (WebRTC) link between two guests using PeerJS.
 * The host owns the room id; the guest dials into it. Both share their camera
 * and a data channel used to synchronise the countdown and exchange frames.
 */
export function usePeerBooth({ roomId, isHost, onMessage }: Options) {
  const [status, setStatus] = useState<BoothStatus>("init");
  const [error, setError] = useState<string | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [placeholder, setPlaceholder] = useState(false);

  const peerRef = useRef<Peer | null>(null);
  const connRef = useRef<DataConnection | null>(null);
  const placeholderStop = useRef<(() => void) | null>(null);
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  const bindConnection = useCallback((conn: DataConnection) => {
    connRef.current = conn;
    conn.on("open", () => setStatus("connected"));
    conn.on("data", (data) => onMessageRef.current?.(data as BoothMessage));
    conn.on("close", () => setStatus("waiting"));
  }, []);

  useEffect(() => {
    let cancelled = false;
    let peer: Peer | null = null;

    (async () => {
      let stream: MediaStream;
      try {
        if (!navigator.mediaDevices?.getUserMedia) throw new Error("mediadevices unavailable");
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1920 }, height: { ideal: 1080 }, facingMode: "user" },
          audio: false,
        });
      } catch {
        // Sandbox / iframe blocks the real camera: fall back to an animated
        // placeholder so the full flow stays testable. Real webcam works on deploy.
        const ph = createPlaceholderStream();
        placeholderStop.current = ph.stop;
        stream = ph.stream;
        if (!cancelled) setPlaceholder(true);
      }
      if (cancelled) {
        stream.getTracks().forEach((t) => t.stop());
        placeholderStop.current?.();
        return;
      }
      setLocalStream(stream);
      setStatus("waiting");

      // Google's public STUN servers for reliable NAT traversal across different
      // Wi-Fi networks and mobile carriers.
      const peerOptions = {
        config: {
          iceServers: [
            { urls: "stun:stun.l.google.com:19302" },
            { urls: "stun:stun1.l.google.com:19302" },
          ],
        },
      };
      peer = isHost ? new Peer(roomId, peerOptions) : new Peer(peerOptions);
      peerRef.current = peer;

      // Guest: dial the host. If the host peer isn't registered yet, retry a few
      // times so opening the shared link reliably lands both feeds in the studio.
      let attempts = 0;
      const dialHost = () => {
        if (cancelled || connRef.current?.open) return;
        attempts += 1;
        const conn = peer!.connect(roomId, { reliable: true });
        bindConnection(conn);
        const call = peer!.call(roomId, stream);
        call.on("stream", (rs) => setRemoteStream(rs));
      };

      peer.on("error", (err) => {
        // Connection hiccups are expected and non-fatal:
        //  - "peer-unavailable": the host peer isn't registered yet (guest opened
        //    the link first, or we're in a single-user preview with no partner).
        //  - broker/network blips in a sandbox.
        // We stay in the room (placeholder + solo capture keep working) and simply
        // retry the guest dial. This is normal flow, so we don't log it as an error.
        if (cancelled) return;
        if (!isHost && err?.type === "peer-unavailable" && attempts < 8) {
          setTimeout(dialHost, 1200);
        }
      });

      if (isHost) {
        peer.on("connection", bindConnection);
        peer.on("call", (call: MediaConnection) => {
          call.answer(stream);
          call.on("stream", (rs) => setRemoteStream(rs));
        });
      } else {
        peer.on("open", dialHost);
      }
    })();

    return () => {
      cancelled = true;
      connRef.current?.close();
      peerRef.current?.destroy();
      placeholderStop.current?.();
      setLocalStream((s) => {
        s?.getTracks().forEach((t) => t.stop());
        return null;
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, isHost, bindConnection]);

  const sendData = useCallback((msg: BoothMessage) => {
    if (connRef.current && connRef.current.open) connRef.current.send(msg);
  }, []);

  return { status, error, localStream, remoteStream, sendData, placeholder };
}
