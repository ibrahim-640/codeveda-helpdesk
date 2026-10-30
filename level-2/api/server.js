require("dotenv").config();

const path = require("path");
const express = require("express");
const mongoose = require("mongoose");
const Ticket = require("./models/Ticket");
const Comment = require("./models/Comment");

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI;

app.use(express.json());
app.use(express.static(path.join(__dirname, "..", "frontend")));

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

// Create a ticket
app.post(
  "/tickets",
  asyncHandler(async (req, res) => {
    const { title, description, priority } = req.body ?? {};
    const ticket = await Ticket.create({ title, description, priority });
    res.status(201).json(ticket);
  })
);

// Read all tickets (newest first), optional ?status= and ?priority= filters
app.get(
  "/tickets",
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

    const tickets = await Ticket.find(filter).sort({ createdAt: -1 });
    res.json(tickets);
  })
);
// Read one ticket
app.get(
  "/tickets/:id",
  asyncHandler(async (req, res) => {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ error: "Ticket not found" });
    res.json(ticket);
  })
);
// Update a ticket (send only the fields you want to change)
app.put(
  "/tickets/:id",
  asyncHandler(async (req, res) => {
    const { title, description, priority, status } = req.body ?? {};

    const updates = {};
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (priority !== undefined) updates.priority = priority;
    if (status !== undefined) updates.status = status;

    const ticket = await Ticket.findByIdAndUpdate(req.params.id, updates, {
      new: true, // return the updated document
      runValidators: true, // apply schema rules to updates too
    });
    if (!ticket) return res.status(404).json({ error: "Ticket not found" });
    res.json(ticket);
  })
);

// Delete a ticket and its comments
app.delete(
  "/tickets/:id",
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
  asyncHandler(async (req, res) => {
    const exists = await Ticket.exists({ _id: req.params.id });
    if (!exists) return res.status(404).json({ error: "Ticket not found" });

    const comments = await Comment.find({ ticket: req.params.id }).sort({
      createdAt: 1,
    });
    res.json(comments);
  })
);

// Add a comment to a ticket
app.post(
  "/tickets/:id/comments",
  asyncHandler(async (req, res) => {
    const exists = await Ticket.exists({ _id: req.params.id });
    if (!exists) return res.status(404).json({ error: "Ticket not found" });

    const { authorName, text } = req.body ?? {};
    const comment = await Comment.create({
      ticket: req.params.id,
      authorName,
      text,
    });
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
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

// Connect to the database first, then start listening
async function start() {
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