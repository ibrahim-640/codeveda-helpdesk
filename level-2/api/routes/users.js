const express = require("express");
const mongoose = require("mongoose");
const User = require("../models/User");
const { requireAuth, requireRole } = require("../middleware/auth");

const { ROLES } = User;
const router = express.Router();

const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// Everything here is admin-only
router.use(requireAuth, requireRole("admin"));

// List all users
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const users = await User.find().sort({ createdAt: -1 });
    res.json(users);
  })
);

// Change a user's role
router.patch(
  "/:id/role",
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { role } = req.body ?? {};

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ error: "Invalid user id" });
    }
    if (typeof role !== "string" || !ROLES.includes(role)) {
      return res
        .status(400)
        .json({ error: `role must be one of: ${ROLES.join(", ")}` });
    }
    // Stops the last admin from locking everyone out
    if (id === req.user.id) {
      return res.status(400).json({ error: "You cannot change your own role" });
    }

    const user = await User.findByIdAndUpdate(
      id,
      { role },
      { new: true, runValidators: true }
    );
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  })
);

module.exports = router;