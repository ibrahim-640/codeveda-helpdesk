const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema(
  {
    // The relationship: each comment points at one ticket
    ticket: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ticket",
      required: [true, "ticket is required"],
    },
      author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "author is required"],
    },
    text: {
      type: String,
      required: [true, "text is required"],
      trim: true,
      minlength: [1, "text cannot be empty"],
      maxlength: [1000, "text must be at most 1000 characters"],
    },
  },
  { timestamps: true }
);

// Index: "all comments for a ticket, oldest first" is the main query
commentSchema.index({ ticket: 1, createdAt: 1 });

commentSchema.set("toJSON", {
  virtuals: true,
  versionKey: false,
  transform: (doc, ret) => {
    delete ret._id;
  },
});

module.exports = mongoose.model("Comment", commentSchema);