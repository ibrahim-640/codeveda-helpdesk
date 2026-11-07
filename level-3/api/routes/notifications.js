const express = require("express");
const mongoose = require("mongoose");
const Notification = require("../models/Notification");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

router.use(requireAuth);

// My 20 newest notifications plus the unread total
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const [items, unreadCount] = await Promise.all([
      Notification.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(20),
      Notification.countDocuments({ user: req.user._id, read: false }),
    ]);
    res.json({ items, unreadCount });
  })
);

// Mark everything read
router.post(
  "/read-all",
  asyncHandler(async (req, res) => {
    await Notification.updateMany(
      { user: req.user._id, read: false },
      { read: true }
    );
    res.json({ unreadCount: 0 });
  })
);

// Mark one read (the filter includes the owner, so nobody can touch others')
router.patch(
  "/:id/read",
  asyncHandler(async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: "Invalid notification id" });
    }
    await Notification.updateOne(
      { _id: req.params.id, user: req.user._id },
      { read: true }
    );
    res.status(204).send();
  })
);

module.exports = router;