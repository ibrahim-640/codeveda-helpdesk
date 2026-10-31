const mongoose = require("mongoose");

const PRIORITIES = ["low", "medium", "high"];
const STATUSES = ["open", "in_progress", "resolved", "closed"];

const ticketSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "title is required"],
      trim: true,
      minlength: [3, "title must be at least 3 characters"],
      maxlength: [100, "title must be at most 100 characters"],
    },
    description: {
      type: String,
      required: [true, "description is required"],
      trim: true,
      minlength: [5, "description must be at least 5 characters"],
      maxlength: [2000, "description must be at most 2000 characters"],
    },
    priority: {
      type: String,
      enum: {
        values: PRIORITIES,
        message: `priority must be one of: ${PRIORITIES.join(", ")}`,
      },
      default: "medium",
    },
    status: {
      type: String,
      enum: {
        values: STATUSES,
        message: `status must be one of: ${STATUSES.join(", ")}`,
      },
      default: "open",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "createdBy is required"],
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true } // adds createdAt and updatedAt automatically
);

// Indexes: speed up filtering and sorting newest first
ticketSchema.index({ createdAt: -1 });
ticketSchema.index({ status: 1, createdAt: -1 });
ticketSchema.index({ createdBy: 1, createdAt: -1 });

// MongoDB uses _id. Expose it as "id" so the frontend keeps working.
ticketSchema.set("toJSON", {
  virtuals: true,
  versionKey: false,
  transform: (doc, ret) => {
    delete ret._id;
  },
});

module.exports = mongoose.model("Ticket", ticketSchema);