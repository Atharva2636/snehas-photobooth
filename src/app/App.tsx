import { useEffect, useRef, useState } from "react";
import { Landing } from "./components/Landing";
import { WaitingRoom } from "./components/WaitingRoom";
import { Studio } from "./components/Studio";
import { ExportScreen } from "./components/ExportScreen";
import { Toaster } from "./components/ui/sonner";
import { makeRoomId, readRoomFromUrl, type Filter, type Template } from "./lib/booth";
import { usePeerBooth, type BoothMessage } from "./lib/usePeerBooth";
import type { Pair } from "./lib/compose";

interface RoomState {
  roomId: string;
  isHost: boolean;
}

function Room({ roomId, isHost, onExit }: RoomState & { onExit: () => void }) {
  const onMessageRef = useRef<((m: BoothMessage) => void) | undefined>(undefined);
  const { status, error, localStream, remoteStream, sendData, placeholder } = usePeerBooth({
    roomId,
    isHost,
    onMessage: (m) => onMessageRef.current?.(m),
  });

  const [entered, setEntered] = useState(false);
  const [result, setResult] = useState<{ template: Template; filter: Filter; pairs: Pair[] } | null>(null);

  // Auto-advance into the studio once connected.
  useEffect(() => {
    if (status === "connected") setEntered(true);
  }, [status]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-6 text-center">
        <div className="max-w-md rounded-3xl border border-border bg-card p-8">
          <h1 className="text-ink" style={{ fontSize: "1.4rem" }}>Something went sideways</h1>
          <p className="mt-3 text-ink-soft">{error}</p>
          <button onClick={onExit} className="mt-6 rounded-full bg-primary px-6 py-3 text-primary-foreground">
            Back home
          </button>
        </div>
      </div>
    );
  }

  if (result) {
    return (
      <ExportScreen
        template={result.template}
        filter={result.filter}
        pairs={result.pairs}
        onRetake={() => setResult(null)}
      />
    );
  }

  if (!entered) {
    return (
      <div className="min-h-screen bg-background">
        <WaitingRoom roomId={roomId} isHost={isHost} status={status} localStream={localStream} />
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
      onComplete={(_c, template, filter, pairs) => setResult({ template, filter, pairs })}
    />
  );
}

export default function App() {
  const [room, setRoom] = useState<RoomState | null>(null);

  // On load, join as guest if a /room/<id> (or legacy ?room=) link was opened.
  useEffect(() => {
    const r = readRoomFromUrl();
    if (r) setRoom({ roomId: r, isHost: false });
  }, []);

  const createRoom = () => {
    const id = makeRoomId();
    window.history.pushState({}, "", `/room/${id}`);
    setRoom({ roomId: id, isHost: true });
  };

  const exit = () => {
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
