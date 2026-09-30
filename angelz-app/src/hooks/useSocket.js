import { useEffect, useRef } from "react";
import { io } from "socket.io-client";
import useUserProfile from "./useUserProfile";
import { SERVER_URL } from "../utils/envConfig";

export function useSocket(onNotification) {
  const socketRef = useRef(null);
  const { token } = useUserProfile();

  useEffect(() => {
    if (!token || socketRef.current) return;

    const socket = io(SERVER_URL, {
      auth: { token },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on("notification", (data) => onNotification?.(data));

    return () => socket.disconnect();
  }, [token]);

  return socketRef.current;
}
