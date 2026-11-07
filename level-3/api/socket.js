const { Server } = require("socket.io");
const { parse } = require("cookie");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const User = require("./models/User");
const Ticket = require("./models/Ticket");

let io = null;

// Origins allowed to open a socket besides "same host as the server"
const allowedOrigins = (
  process.env.ALLOWED_ORIGINS || "http://localhost:5173,http://localhost:3000"
)
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

function reply(ack, payload) {
  if (typeof ack === "function") ack(payload);
}

// Checks the current role from the database, so a demoted user can't join new rooms
async function canAccessTicket(userId, ticketId) {
  const [user, ticket] = await Promise.all([
    User.findById(userId),
    Ticket.findById(ticketId).select("createdBy"),
  ]);
  if (!user || !ticket) return false;
  return (
    user.role !== "customer" || String(ticket.createdBy) === String(user._id)
  );
}

function initSockets(server) {
  io = new Server(server, {
    // Defense in depth on top of SameSite cookies
    allowRequest: (req, callback) => {
      const origin = req.headers.origin;
      if (!origin) return callback(null, true); // non-browser clients
      try {
        const sameHost = new URL(origin).host === req.headers.host;
        callback(null, sameHost || allowedOrigins.includes(origin));
      } catch {
        callback(null, false);
      }
    },
  });

  // Authenticate every socket with the same cookie the REST API uses
  io.use(async (socket, next) => {
    try {
      const token = parse(socket.handshake.headers.cookie || "").token;
      if (!token) return next(new Error("Authentication required"));

      let payload;
      try {
        payload = jwt.verify(token, process.env.JWT_SECRET);
      } catch {
        return next(new Error("Invalid or expired token"));
      }

      const user = await User.findById(payload.id);
      if (!user) return next(new Error("Invalid or expired token"));

      socket.data.user = user;
      next();
    } catch (err) {
      next(err);
    }
  });

  io.on("connection", (socket) => {
    const user = socket.data.user;

    // Private room: only this user's sockets (any number of tabs) are in it
    socket.join(`user:${user.id}`);

    // Client -> server: "I'm looking at this ticket, send me live updates"
    socket.on("ticket:join", async (ticketId, ack) => {
      try {
        if (!mongoose.isValidObjectId(ticketId)) {
          return reply(ack, { ok: false, error: "Invalid ticket id" });
        }
        if (!(await canAccessTicket(user._id, ticketId))) {
          return reply(ack, { ok: false, error: "Ticket not found" });
        }
        socket.join(`ticket:${ticketId}`);
        reply(ack, { ok: true });
      } catch {
        reply(ack, { ok: false, error: "Server error" });
      }
    });

    socket.on("ticket:leave", (ticketId) => {
      if (typeof ticketId === "string") socket.leave(`ticket:${ticketId}`);
    });
  });

  return io;
}

// JSON round-trip turns ObjectIds into plain strings
const plain = (payload) => JSON.parse(JSON.stringify(payload));

function emitToUser(userId, event, payload) {
  if (io) io.to(`user:${userId}`).emit(event, plain(payload));
}

function emitToTicket(ticketId, event, payload) {
  if (io) io.to(`ticket:${ticketId}`).emit(event, plain(payload));
}

module.exports = { initSockets, emitToUser, emitToTicket };