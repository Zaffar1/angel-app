const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");

let io = null;
const onlineUsers = {}; // Map of userId -> Set of socket IDs

/**
 * Initialize Socket.IO with the existing HTTP server and CORS configuration
 */
function initSocket(server, allowedOrigins) {
  io = new Server(server, {
    cors: {
      origin: allowedOrigins,
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
      credentials: true,
    },
    // Connection State Recovery: enables seamless reconnection and replay of missed packets
    connectionStateRecovery: {
      maxDisconnectionDuration: 2 * 60 * 1000, // 2 minutes
      skipMiddlewares: true,
    },
    pingTimeout: 30000,
    pingInterval: 25000,
  });

  // Authentication Middleware
  io.use((socket, next) => {
    try {
      const rawToken =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization ||
        socket.handshake.query?.token;

      if (!rawToken) {
        // Allow unauthenticated guest connections for public broadcast channels
        socket.user = null;
        return next();
      }

      const token = rawToken.startsWith("Bearer ")
        ? rawToken.slice(7)
        : rawToken;

      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.user = decoded; // Contains id, email, type, isApproved, etc.
      } catch (err) {
        console.warn(`[Socket.IO Auth] Invalid or expired token: ${err.message}`);
        socket.user = null;
      }

      return next();
    } catch (err) {
      console.error("[Socket.IO Auth] Middleware error:", err);
      return next(err);
    }
  });

  // Connection Handler
  io.on("connection", (socket) => {
    // 1. Join public room by default
    socket.join("public");

    const user = socket.user;
    if (user && user.id) {
      const userIdStr = String(user.id);

      // Add to online tracking
      if (!onlineUsers[userIdStr]) {
        onlineUsers[userIdStr] = new Set();
      }
      onlineUsers[userIdStr].add(socket.id);

      // Join private user room
      socket.join(`user:${userIdStr}`);
      socket.join("authenticated");

      // Join role-based room
      if (user.type) {
        socket.join(`role:${user.type}`);
      }

      // Join organization room if available
      if (user.organization_id) {
        socket.join(`org:${user.organization_id}`);
      }

      console.log(`✅ [Socket.IO] Authenticated user connected: ID ${user.id} (${user.type || "user"}), Socket: ${socket.id}`);
    } else {
      console.log(`✅ [Socket.IO] Guest/Unauthenticated client connected, Socket: ${socket.id}`);
    }

    // Recovered connection notice
    if (socket.recovered) {
      console.log(`🔄 [Socket.IO] Socket ${socket.id} recovered previous session`);
    }

    // Backward compatibility: manual register event
    socket.on("register", (userId) => {
      if (!userId) return;
      const userIdStr = String(userId);
      if (!onlineUsers[userIdStr]) {
        onlineUsers[userIdStr] = new Set();
      }
      onlineUsers[userIdStr].add(socket.id);
      socket.join(`user:${userIdStr}`);
      socket.join("authenticated");
      console.log(`📌 [Socket.IO] User ${userIdStr} registered socket ${socket.id}`);
    });

    // Dynamic room subscription with permission validation
    socket.on("join_room", (roomName) => {
      if (!roomName || typeof roomName !== "string") return;

      // Prevent unauthorized clients from joining private rooms of others or admin rooms
      if (roomName.startsWith("role:admin") && socket.user?.type !== "admin") {
        return socket.emit("error", { message: "Unauthorized to join admin room" });
      }
      if (roomName.startsWith("user:") && roomName !== `user:${socket.user?.id}` && socket.user?.type !== "admin") {
        return socket.emit("error", { message: "Unauthorized to join user private room" });
      }

      socket.join(roomName);
      console.log(`🚪 [Socket.IO] Socket ${socket.id} joined room: ${roomName}`);
    });

    socket.on("leave_room", (roomName) => {
      if (roomName && typeof roomName === "string") {
        socket.leave(roomName);
        console.log(`🚪 [Socket.IO] Socket ${socket.id} left room: ${roomName}`);
      }
    });

    // Controlled synchronization request on reconnect
    socket.on("sync:request", ({ resource, lastSyncTime }) => {
      console.log(`🔄 [Socket.IO] Sync request received for resource: ${resource} since ${lastSyncTime}`);
      socket.emit("sync:acknowledged", {
        resource,
        serverTime: new Date().toISOString(),
        message: "Synchronized with server state",
      });
    });

    // Disconnect Handler
    socket.on("disconnect", (reason) => {
      if (user && user.id) {
        const userIdStr = String(user.id);
        if (onlineUsers[userIdStr]) {
          onlineUsers[userIdStr].delete(socket.id);
          if (onlineUsers[userIdStr].size === 0) {
            delete onlineUsers[userIdStr];
          }
        }
      } else {
        // Clean up from onlineUsers if manually registered
        for (const uId in onlineUsers) {
          if (onlineUsers[uId].has(socket.id)) {
            onlineUsers[uId].delete(socket.id);
            if (onlineUsers[uId].size === 0) {
              delete onlineUsers[uId];
            }
            break;
          }
        }
      }
      console.log(`❌ [Socket.IO] Client disconnected: ${socket.id} (Reason: ${reason})`);
    });
  });

  return io;
}

/**
 * Safely get the active IO instance
 */
function getIO() {
  return io;
}

/**
 * Universal Real-Time CRUD Event Emitter
 * 
 * Emits both:
 * 1) Specific resource event: `${resource}:${action}` (e.g., 'mission:created', 'user_post:updated', 'badge:deleted')
 * 2) Global synchronization channel: `crud:mutation` with full authoritative metadata
 *
 * @param {Object} options
 * @param {string} options.resource - Name of the resource (e.g. 'mission', 'user_post', 'badge', 'user', 'organization')
 * @param {'created'|'updated'|'deleted'|'bulk_assigned'} options.action - Mutation action type
 * @param {any} [options.data] - Authoritative record payload
 * @param {string|number} [options.id] - Primary ID of affected resource
 * @param {string|number} [options.actorId] - ID of user who initiated the mutation (for client deduplication)
 * @param {string|string[]} [options.room='public'] - Target room(s) to notify
 * @param {Object} [options.meta={}] - Any additional context
 */
function emitCrudEvent({
  resource,
  action,
  data = null,
  id = null,
  actorId = null,
  room = "public",
  meta = {},
}) {
  if (!io) {
    console.warn("⚠️ [Socket.IO] Cannot emit CRUD event: Server not initialized");
    return;
  }

  const primaryId = id !== null && id !== undefined ? id : data?.id || data?._id || null;

  const payload = {
    resource,
    action,
    id: primaryId,
    data,
    actorId: actorId ? String(actorId) : null,
    timestamp: new Date().toISOString(),
    meta,
  };

  const specificEvent = `${resource}:${action}`;
  const genericEvent = "crud:mutation";

  let broadcastTarget = io;

  if (room && room !== "public") {
    if (Array.isArray(room)) {
      // Chain rooms
      broadcastTarget = io;
      for (const r of room) {
        broadcastTarget = broadcastTarget.to(r);
      }
    } else {
      broadcastTarget = io.to(room);
    }
  }

  broadcastTarget.emit(specificEvent, payload);
  broadcastTarget.emit(genericEvent, payload);

  console.log(`📡 [Socket.IO] CRUD Emitted: ${specificEvent} -> room(s): ${JSON.stringify(room)} | ID: ${primaryId} | Actor: ${actorId || "System"}`);
}

/**
 * Dispatch real-time user notification
 * Emits to private user room and legacy socket tracking
 */
function notifyUser(userId, notification) {
  if (!io) return;
  const userRoom = `user:${userId}`;
  io.to(userRoom).emit("notification", notification);

  const userIdStr = String(userId);
  if (onlineUsers[userIdStr] && onlineUsers[userIdStr].size > 0) {
    console.log(`📢 [Socket.IO] Notification sent to user ${userId} (${onlineUsers[userIdStr].size} active socket(s))`);
  } else {
    console.log(`ℹ️ [Socket.IO] User ${userId} is currently offline. Notification stored in DB.`);
  }
}

/**
 * Emit directly to a specific user
 */
function emitToUser(userId, event, payload) {
  if (!io) return;
  io.to(`user:${userId}`).emit(event, payload);
}

/**
 * Emit directly to a room
 */
function emitToRoom(room, event, payload) {
  if (!io) return;
  io.to(room).emit(event, payload);
}

/**
 * Broadcast event to all connected clients
 */
function broadcast(event, payload) {
  if (!io) return;
  io.emit(event, payload);
}

module.exports = {
  initSocket,
  getIO,
  emitCrudEvent,
  notifyUser,
  emitToUser,
  emitToRoom,
  broadcast,
};

