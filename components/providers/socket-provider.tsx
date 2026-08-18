"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { useSession } from "next-auth/react";

const SocketContext = createContext<Socket | null>(null);

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    if (status !== "authenticated") return;

    const nextSocket = io({ path: "/socket.io" });
    // Connecting to an external system (the socket) whose instance must be exposed
    // to descendants via context, so storing it in state here is unavoidable.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSocket(nextSocket);

    return () => {
      nextSocket.disconnect();
      setSocket(null);
    };
  }, [status]);

  return <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>;
}

export function useSocket() {
  return useContext(SocketContext);
}

/** Joins a room (project/workspace) for the lifetime of the component. */
export function useSocketRoom(kind: "project" | "workspace", id: string | undefined) {
  const socket = useSocket();
  useEffect(() => {
    if (!socket || !id) return;
    socket.emit(`${kind}:join`, id);
    return () => {
      socket.emit(`${kind}:leave`, id);
    };
  }, [socket, kind, id]);
}
