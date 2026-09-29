let io;
const onlineUsers = {};

function initSocket(server, allowedOrigins) {
  const { Server } = require("socket.io");
  io = new Server(server, {
    cors: {
      origin: allowedOrigins,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);

    socket.on("register", (userId) => {
      onlineUsers[String(userId)] = socket.id;
      console.log(`User ${userId} registered with socket ${socket.id}`);
    });

    socket.on("disconnect", () => {
      for (const userId in onlineUsers) {
        if (onlineUsers[userId] === socket.id) {
          delete onlineUsers[userId];
          console.log(`User ${userId} disconnected`);
          break;
        }
      }
    });
  });
}

// Helper to send notification
function notifyUser(userId, notification) {
  console.log("Current onlineUsers:", onlineUsers);
  const socketId = onlineUsers[String(userId)];
  if (socketId && io) {
    io.to(socketId).emit("notification", notification);
    console.log(`📢 Sent notification to user ${userId}`);
  } else {
    console.log(`User ${userId} is offline, notification saved in DB`);
  }
}

module.exports = { initSocket, notifyUser };
