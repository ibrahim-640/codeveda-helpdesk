require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const User = require("../models/User");

async function main() {
  const { ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD, MONGODB_URI } = process.env;

  if (!ADMIN_NAME || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.error("Set ADMIN_NAME, ADMIN_EMAIL and ADMIN_PASSWORD in .env");
    process.exit(1);
  }
  if (ADMIN_PASSWORD.length < 8 || ADMIN_PASSWORD.length > 72) {
    console.error("ADMIN_PASSWORD must be between 8 and 72 characters");
    process.exit(1);
  }

  await mongoose.connect(MONGODB_URI);
  const email = ADMIN_EMAIL.toLowerCase().trim();
  const existing = await User.findOne({ email });

  if (existing) {
    if (existing.role === "admin") {
      console.log(`${email} is already an admin`);
    } else {
      await User.updateOne({ _id: existing._id }, { role: "admin" });
      console.log(`${email} promoted to admin`);
    }
  } else {
    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);
    await User.create({
      name: ADMIN_NAME,
      email,
      passwordHash,
      role: "admin",
    });
    console.log(`Admin created: ${email}`);
  }

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("Seed failed:", err.message);
  process.exit(1);
});