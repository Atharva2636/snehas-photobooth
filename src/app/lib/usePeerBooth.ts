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
  restart?: number;
  onMessage?: (msg: BoothMessage) => void;
}

const PEER_OPTIONS = {
  // Google's public STUN servers for reliable NAT traversal across networks.
  config: {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
    ],
  },
};

/**
 * Establishes a direct P2P (WebRTC) link between two people using PeerJS.
 * The host registers a peer under the room id; the guest dials into it and keeps
 * re-dialing until connected, so the link survives the host refreshing or the
 * guest arriving first. The single media call is inherently bidirectional: when
 * the host answers with its stream, both sides receive each other's video.
 */
export function usePeerBooth({ roomId, isHost, restart = 0, onMessage }: Options) {
  const [status, setStatus] = useState<BoothStatus>("init");
  const [error] = useState<string | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [placeholder, setPlaceholder] = useState(false);

  const peerRef = useRef<Peer | null>(null);
  const connRef = useRef<DataConnection | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
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
    let redial: ReturnType<typeof setInterval> | null = null;
    let pending: DataConnection | null = null;

    const answerCall = (call: MediaConnection, stream: MediaStream) => {
      call.answer(stream);
      call.on("stream", (rs) => setRemoteStream(rs));
    };

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
      streamRef.current = stream;
      setLocalStream(stream);
      setStatus("waiting");

      peer = isHost ? new Peer(roomId, PEER_OPTIONS) : new Peer(PEER_OPTIONS);
      peerRef.current = peer;

      // Both sides answer any incoming media call (reciprocal video).
      peer.on("call", (call: MediaConnection) => answerCall(call, stream));
      // Host (and guest, harmlessly) accept incoming data connections.
      peer.on("connection", bindConnection);

      peer.on("error", (err) => {
        // Non-fatal: unreachable host, sandbox broker blips, id-not-ready, etc.
        // The guest's periodic re-dial recovers automatically.
        if (cancelled) return;
        void err;
      });

      if (!isHost) {
        const dial = () => {
          if (cancelled || connRef.current?.open || !peer || peer.destroyed || !peer.open) return;
          try {
            pending?.close();
          } catch {
            /* noop */
          }
          pending = peer.connect(roomId, { reliable: true });
          bindConnection(pending);
          const call = peer.call(roomId, stream);
          call.on("stream", (rs) => setRemoteStream(rs));
        };
        peer.on("open", dial);
        // Keep re-dialing until connected so refresh / late-join reliably links up.
        redial = setInterval(() => {
          if (!connRef.current?.open) dial();
        }, 2500);
      }
    })();

    return () => {
      cancelled = true;
      if (redial) clearInterval(redial);
      try {
        connRef.current?.close();
      } catch {
        /* noop */
      }
      peerRef.current?.destroy();
      peerRef.current = null;
      connRef.current = null;
      placeholderStop.current?.();
      placeholderStop.current = null;
      setLocalStream((s) => {
        s?.getTracks().forEach((t) => t.stop());
        return null;
      });
      setRemoteStream(null);
      setStatus("init");
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, isHost, restart, bindConnection]);

  // Free the peer id promptly on tab close/refresh so a returning host can reclaim it.
  useEffect(() => {
    const onUnload = () => peerRef.current?.destroy();
    window.addEventListener("beforeunload", onUnload);
    return () => window.removeEventListener("beforeunload", onUnload);
  }, []);

  const sendData = useCallback((msg: BoothMessage) => {
    if (connRef.current && connRef.current.open) connRef.current.send(msg);
  }, []);

  // Fully release the hardware webcam and tear down the session (used on export).
  const shutdown = useCallback(() => {
    try {
      connRef.current?.close();
    } catch {
      /* noop */
    }
    peerRef.current?.destroy();
    peerRef.current = null;
    connRef.current = null;
    placeholderStop.current?.();
    placeholderStop.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setLocalStream(null);
    setRemoteStream(null);
  }, []);

  return { status, error, localStream, remoteStream, sendData, placeholder, shutdown };
}
