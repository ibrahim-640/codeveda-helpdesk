require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/User");
const Ticket = require("../models/Ticket");

const TOPICS = [
  "Cannot reset password",
  "Dashboard loads slowly",
  "Invoice shows wrong amount",
  "Export to CSV fails",
  "Typo on pricing page",
  "Two-factor code not arriving",
  "Mobile layout is broken",
  "Request to change account email",
  "Notification emails delayed",
  "Cannot upload profile photo",
];

const pick = (list) => list[Math.floor(Math.random() * list.length)];

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);

  const admin = await User.findOne({ role: "admin" });
  if (!admin) throw new Error("Create an admin first (npm run seed:admin)");
  const staff = await User.find({ role: { $in: ["agent", "admin"] } });

  const HOUR = 3600 * 1000;
  const now = Date.now();
  const docs = [];

  for (let i = 0; i < 30; i++) {
    const createdAt = new Date(now - Math.random() * 7 * 24 * HOUR);
    const status = pick([
      "open", "open", "in_progress", "in_progress", "resolved", "resolved", "closed",
    ]);
    const done = status === "resolved" || status === "closed";
    const resolvedAt = done
      ? new Date(Math.min(now, createdAt.getTime() + (1 + Math.random() * 47) * HOUR))
      : null;

    docs.push({
      title: `[Demo] ${pick(TOPICS)}`,
      description: "Sample ticket generated for the dashboard demo.",
      priority: pick(["low", "medium", "high"]),
      status,
      createdBy: admin._id,
      assignedTo: Math.random() < 0.6 ? pick(staff)._id : null,
      resolvedAt,
      createdAt,
      updatedAt: resolvedAt ?? createdAt,
    });
  }

  // The native driver keeps the timestamps exactly as written above
  await Ticket.collection.insertMany(docs);
  console.log(`Inserted ${docs.length} demo tickets`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("Demo seed failed:", err.message);
  process.exit(1);
});