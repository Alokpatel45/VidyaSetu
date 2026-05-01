export const initSocket = (server, io) => {
  io.on("connection", (socket) => {
    console.log("A user connected to chat");
    socket.on("disconnect", () => console.log("User disconnected"));
  });
};
