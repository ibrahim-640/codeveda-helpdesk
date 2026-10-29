require("dotenv").config();

const path = require("path");
const express = require("express");
const mongoose = require("mongoose");
const Ticket = require("./models/Ticket");

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

// Read all tickets (newest first)
app.get(
  "/tickets",
  asyncHandler(async (req, res) => {
    const tickets = await Ticket.find().sort({ createdAt: -1 });
    res.json(tickets);
  })
);

// Create a ticket
app.post(
  "/tickets",
  asyncHandler(async (req, res) => {
    const { title, description, priority } = req.body ?? {};
    const ticket = await Ticket.create({ title, description, priority });
    res.status(201).json(ticket);
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

// Delete a ticket
app.delete(
  "/tickets/:id",
  asyncHandler(async (req, res) => {
    const ticket = await Ticket.findByIdAndDelete(req.params.id);
    if (!ticket) return res.status(404).json({ error: "Ticket not found" });
    res.status(204).send();
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