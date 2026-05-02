import { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { SOCKET_URL } from "../config";
import { UserData } from "./UserContext.jsx";

const SocketContext = createContext();
export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const { accessToken, isAuth } = UserData();
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!isAuth || !accessToken) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    const socketInstance = io(SOCKET_URL, {
      withCredentials: true,
      auth: {
        token: accessToken,
      },
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [accessToken, isAuth]);

  return <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>;
};
