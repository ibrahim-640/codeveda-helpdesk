const express = require("express");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// In-memory storage (temporary)
let tickets = [];
let nextId = 1;

const PRIORITIES = ["low", "medium", "high"];
const STATUSES = ["open", "in_progress", "resolved", "closed"];

app.get("/", (req, res) => {
  res.json({ message: "HelpDesk API is running" });
});

// Read all tickets
app.get("/tickets", (req, res) => {
  res.json(tickets);
});

// Create a ticket
app.post("/tickets", (req, res) => {
  const { title, description, priority = "medium" } = req.body ?? {};

  if (!title || !description) {
    return res
      .status(400)
      .json({ error: "title and description are required" });
  }
  if (!PRIORITIES.includes(priority)) {
    return res
      .status(400)
      .json({ error: `priority must be one of: ${PRIORITIES.join(", ")}` });
  }

  const ticket = {
    id: nextId++,
    title,
    description,
    priority,
    status: "open",
    createdAt: new Date().toISOString(),
  };

  tickets.push(ticket);
  res.status(201).json(ticket);
});
// Read one ticket
app.get("/tickets/:id", (req, res) => {
  const ticket = tickets.find((t) => t.id === Number(req.params.id));
  if (!ticket) return res.status(404).json({ error: "Ticket not found" });
  res.json(ticket);
});

// Update a ticket (send only the fields you want to change)
app.put("/tickets/:id", (req, res) => {
  const ticket = tickets.find((t) => t.id === Number(req.params.id));
  if (!ticket) return res.status(404).json({ error: "Ticket not found" });

  const { title, description, priority, status } = req.body ?? {};

  if (priority !== undefined && !PRIORITIES.includes(priority)) {
    return res
      .status(400)
      .json({ error: `priority must be one of: ${PRIORITIES.join(", ")}` });
  }
  if (status !== undefined && !STATUSES.includes(status)) {
    return res
      .status(400)
      .json({ error: `status must be one of: ${STATUSES.join(", ")}` });
  }

  if (title !== undefined) ticket.title = title;
  if (description !== undefined) ticket.description = description;
  if (priority !== undefined) ticket.priority = priority;
  if (status !== undefined) ticket.status = status;
  ticket.updatedAt = new Date().toISOString();

  res.json(ticket);
});

// Delete a ticket
app.delete("/tickets/:id", (req, res) => {
  const index = tickets.findIndex((t) => t.id === Number(req.params.id));
  if (index === -1) return res.status(404).json({ error: "Ticket not found" });

  tickets.splice(index, 1);
  res.status(204).send();
});

// Unknown routes
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Central error handler (must be last)
app.use((err, req, res, next) => {
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ error: "Invalid JSON in request body" });
  }
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});