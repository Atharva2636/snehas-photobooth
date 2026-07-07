import { useEffect, useRef, useState } from "react";
import { Landing } from "./components/Landing";
import { WaitingRoom } from "./components/WaitingRoom";
import { Studio } from "./components/Studio";
import { ExportScreen } from "./components/ExportScreen";
import { Toaster } from "./components/ui/sonner";
import { makeRoomId, readRoomFromUrl, type Filter, type Template } from "./lib/booth";
import { usePeerBooth, type BoothMessage } from "./lib/usePeerBooth";
import type { Pair } from "./lib/compose";

const HOST_KEY = "snehas-hosted-room";

interface RoomState {
  roomId: string;
  isHost: boolean;
}

function Room({ roomId, isHost, onExit }: RoomState & { onExit: () => void }) {
  const onMessageRef = useRef<((m: BoothMessage) => void) | undefined>(undefined);
  const [restart, setRestart] = useState(0);
  const { status, localStream, remoteStream, sendData, placeholder, shutdown } = usePeerBooth({
    roomId,
    isHost,
    restart,
    onMessage: (m) => onMessageRef.current?.(m),
  });

  const [entered, setEntered] = useState(false);
  const [result, setResult] = useState<{ template: Template; filter: Filter; pairs: Pair[] } | null>(null);

  // Auto-advance into the studio once connected.
  useEffect(() => {
    if (status === "connected") setEntered(true);
  }, [status]);

  if (result) {
    return (
      <ExportScreen
        template={result.template}
        filter={result.filter}
        pairs={result.pairs}
        onHome={onExit}
        onRetake={() => {
          setResult(null);
          setRestart((r) => r + 1); // re-acquire camera + reconnect for another round
        }}
      />
    );
  }

  if (!entered) {
    return (
      <div className="min-h-screen bg-background">
        <WaitingRoom roomId={roomId} isHost={isHost} status={status} localStream={localStream} onHome={onExit} />
        <div className="mx-auto max-w-lg px-6 pb-12 text-center">
          <button
            onClick={() => setEntered(true)}
            className="text-ink-soft underline underline-offset-4 transition-colors hover:text-ink"
            style={{ fontSize: "0.85rem" }}
          >
            Skip &amp; enter studio solo
          </button>
        </div>
      </div>
    );
  }

  return (
    <Studio
      isHost={isHost}
      connected={status === "connected"}
      localStream={localStream}
      remoteStream={remoteStream}
      placeholder={placeholder}
      sendData={sendData}
      onMessageRef={onMessageRef}
      onHome={onExit}
      onComplete={(_c, template, filter, pairs) => {
        shutdown(); // release the hardware webcam once we leave the studio
        setResult({ template, filter, pairs });
      }}
    />
  );
}

export default function App() {
  const [room, setRoom] = useState<RoomState | null>(null);

  // On load, join the room in the URL. If this tab created the room, rejoin as
  // host (survives refresh); otherwise join as guest.
  useEffect(() => {
    const r = readRoomFromUrl();
    if (r) setRoom({ roomId: r, isHost: sessionStorage.getItem(HOST_KEY) === r });
  }, []);

  const createRoom = () => {
    const id = makeRoomId();
    sessionStorage.setItem(HOST_KEY, id);
    window.history.pushState({}, "", `/room/${id}`);
    setRoom({ roomId: id, isHost: true });
  };

  const exit = () => {
    sessionStorage.removeItem(HOST_KEY);
    window.history.pushState({}, "", "/");
    setRoom(null);
  };

  return (
    <>
      {room ? <Room key={room.roomId} {...room} onExit={exit} /> : <Landing onCreate={createRoom} />}
      <Toaster position="bottom-center" />
    </>
  );
}
