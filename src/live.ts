import { useEffect, useEffectEvent, useState } from "react";
import { io } from "socket.io-client";
import { readStored, store } from "./model";
import type { Room } from "./model";

const socket = io({ autoConnect: false });
type Credentials = {
  code: string;
  token: string;
  name?: string;
  sessionId?: string;
};
type Reply = {
  ok: boolean;
  error?: string;
  state?: Room;
  token?: string;
  submitted?: string[];
};

export async function request(event: string, payload: object): Promise<Reply> {
  if (!socket.connected)
    throw new Error("Not connected yet. Please try again in a moment.");
  let reply: Reply;
  try {
    reply = await socket.timeout(6000).emitWithAck(event, payload);
  } catch {
    throw new Error("The server did not respond. Please try again.");
  }
  if (!reply.ok) throw new Error(reply.error || "Something went wrong.");
  return reply;
}

/** Subscribe to hearts sent by participants (delivered to the host only). */
export function onHeart(handler: () => void) {
  socket.on("room:heart", handler);
  return () => {
    socket.off("room:heart", handler);
  };
}

export function useLive(
  role: "host" | "audience",
  code = "",
  onRestored?: (room: Room) => void,
) {
  const [room, setRoom] = useState<Room | null>(null);
  const [connected, setConnected] = useState(socket.connected);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState<string[]>([]);
  const key = role === "host" ? "pulse:host" : `pulse:participant:${code}`;
  const notifyRestored = useEffectEvent((restoredRoom: Room) =>
    onRestored?.(restoredRoom),
  );
  useEffect(() => {
    const restore = async () => {
      setConnected(true);
      const saved = readStored<Credentials | null>(key, null);
      if (!saved) return;
      try {
        const reply = await request(
          role === "host" ? "room:host" : "room:join",
          saved,
        );
        setRoom(reply.state!);
        setSubmitted(reply.submitted || []);
        notifyRestored(reply.state!);
      } catch (failure) {
        setError((failure as Error).message);
        setRoom(null);
        store(key, null);
      }
    };
    const disconnected = () => setConnected(false);
    const expired = () => {
      setRoom(null);
      store(key, null);
      setError("This room expired. Start or join a new session.");
    };
    const deleted = ({ code: deletedCode }: { code: string }) => {
      const saved = readStored<Credentials | null>(key, null);
      if (saved?.code !== deletedCode) return;
      setRoom(null);
      setSubmitted([]);
      store(key, null);
      if (role === "audience")
        setError("The host deleted this session. Join another room.");
    };
    socket.on("connect", restore);
    socket.on("disconnect", disconnected);
    socket.on("connect_error", disconnected);
    socket.on("room:state", setRoom);
    socket.on("room:expired", expired);
    socket.on("room:deleted", deleted);
    if (socket.connected) void restore();
    else socket.connect();
    return () => {
      socket.off("connect", restore);
      socket.off("disconnect", disconnected);
      socket.off("connect_error", disconnected);
      socket.off("room:state", setRoom);
      socket.off("room:expired", expired);
      socket.off("room:deleted", deleted);
    };
  }, [key, role]);
  return {
    room,
    setRoom,
    connected,
    error,
    setError,
    submitted,
    setSubmitted,
    credentials: () => readStored<Credentials | null>(key, null),
    saveCredentials: (credentials: Credentials | null) =>
      store(key, credentials),
  };
}
