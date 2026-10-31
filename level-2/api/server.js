require("dotenv").config();

const path = require("path");
const express = require("express");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");

const Ticket = require("./models/Ticket");
const Comment = require("./models/Comment");
const User = require("./models/User");
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const { requireAuth, requireRole } = require("./middleware/auth");

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI;

app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "..", "frontend")));

app.use("/auth", authRoutes);
app.use("/users", userRoutes);

// Wraps async handlers so any error goes to the error handler
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// Reject malformed ids before they reach the database
app.param("id", (req, res, next, id) => {
  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ error: "Invalid ticket id" });
  }
  next();
});

const POPULATE_TICKET = [
  { path: "createdBy", select: "name email" },
  { path: "assignedTo", select: "name email" },
];

const isStaff = (user) => user.role === "agent" || user.role === "admin";

// Loads a ticket if the current user may see it; otherwise sends a 404
async function findAccessibleTicket(req, res) {
  const ticket = await Ticket.findById(req.params.id);
  const owns = ticket && String(ticket.createdBy) === String(req.user._id);
  if (!ticket || (!isStaff(req.user) && !owns)) {
    res.status(404).json({ error: "Ticket not found" });
    return null;
  }
  return ticket;
}

// Read tickets (newest first). Customers only see their own.
// Optional ?status= and ?priority= filters.
app.get(
  "/tickets",
  requireAuth,
  asyncHandler(async (req, res) => {
    const filter = {};

    for (const field of ["status", "priority"]) {
      const value = req.query[field];
      if (value === undefined) continue;

      // Must be a plain string: blocks tricks like ?status[$ne]=open
      const allowed = Ticket.schema.path(field).enumValues;
      if (typeof value !== "string" || !allowed.includes(value)) {
        return res
          .status(400)
          .json({ error: `${field} must be one of: ${allowed.join(", ")}` });
      }
      filter[field] = value;
    }

    if (!isStaff(req.user)) filter.createdBy = req.user._id;

    const tickets = await Ticket.find(filter)
      .sort({ createdAt: -1 })
      .populate(POPULATE_TICKET);
    res.json(tickets);
  })
);

// Create a ticket (any logged-in user). The owner comes from the login,
// never from the request body.
app.post(
  "/tickets",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { title, description, priority } = req.body ?? {};
    const ticket = await Ticket.create({
      title,
      description,
      priority,
      createdBy: req.user._id,
    });
    await ticket.populate(POPULATE_TICKET);
    res.status(201).json(ticket);
  })
);

// Read one ticket
app.get(
  "/tickets/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    const ticket = await findAccessibleTicket(req, res);
    if (!ticket) return;
    await ticket.populate(POPULATE_TICKET);
    res.json(ticket);
  })
);

// Update a ticket (agents and admins). Only admins can assign.
app.put(
  "/tickets/:id",
  requireAuth,
  requireRole("agent", "admin"),
  asyncHandler(async (req, res) => {
    const { title, description, priority, status, assignedTo } =
      req.body ?? {};

    const updates = {};
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (priority !== undefined) updates.priority = priority;
    if (status !== undefined) updates.status = status;

    if (assignedTo !== undefined) {
      if (req.user.role !== "admin") {
        return res
          .status(403)
          .json({ error: "Only admins can assign tickets" });
      }
      if (assignedTo === null) {
        updates.assignedTo = null; // unassign
      } else {
        if (
          typeof assignedTo !== "string" ||
          !mongoose.isValidObjectId(assignedTo)
        ) {
          return res.status(400).json({ error: "Invalid assignedTo id" });
        }
        const assignee = await User.findById(assignedTo);
        if (!assignee || assignee.role === "customer") {
          return res
            .status(400)
            .json({ error: "assignedTo must be an agent or admin" });
        }
        updates.assignedTo = assignee._id;
      }
    }

    const ticket = await Ticket.findByIdAndUpdate(req.params.id, updates, {
      new: true, // return the updated document
      runValidators: true, // apply schema rules to updates too
    }).populate(POPULATE_TICKET);
    if (!ticket) return res.status(404).json({ error: "Ticket not found" });
    res.json(ticket);
  })
);

// Delete a ticket and its comments (admins only)
app.delete(
  "/tickets/:id",
  requireAuth,
  requireRole("admin"),
  asyncHandler(async (req, res) => {
    const ticket = await Ticket.findByIdAndDelete(req.params.id);
    if (!ticket) return res.status(404).json({ error: "Ticket not found" });
    await Comment.deleteMany({ ticket: ticket._id });
    res.status(204).send();
  })
);

// List comments for a ticket (oldest first)
app.get(
  "/tickets/:id/comments",
  requireAuth,
  asyncHandler(async (req, res) => {
    const ticket = await findAccessibleTicket(req, res);
    if (!ticket) return;

    const comments = await Comment.find({ ticket: ticket._id })
      .sort({ createdAt: 1 })
      .populate("author", "name role");
    res.json(comments);
  })
);

// Add a comment to a ticket. The author comes from the login.
app.post(
  "/tickets/:id/comments",
  requireAuth,
  asyncHandler(async (req, res) => {
    const ticket = await findAccessibleTicket(req, res);
    if (!ticket) return;

    const { text } = req.body ?? {};
    const comment = await Comment.create({
      ticket: ticket._id,
      author: req.user._id,
      text,
    });
    await comment.populate("author", "name role");
    res.status(201).json(comment);
  })
);

// Unknown routes
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Central error handler (must be last)
app.use((err, req, res, next) => {
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ error: "Invalid JSON in request body" });
  }
  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ error: messages.join(", ") });
  }
  if (err.code === 11000) {
    return res.status(409).json({ error: "That email is already registered" });
  }
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

// Connect to the database first, then start listening
async function start() {
  if (!process.env.JWT_SECRET) {
    console.error("JWT_SECRET is missing from .env");
    process.exit(1);
  }
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB");
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("Failed to connect to MongoDB:", err.message);
    process.exit(1);
  }
}

start();