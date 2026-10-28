const express = require("express");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// In-memory storage (temporary)
let tickets = [];
let nextId = 1;

const PRIORITIES = ["low", "medium", "high"];

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

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});