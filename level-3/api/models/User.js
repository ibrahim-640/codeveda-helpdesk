const mongoose = require("mongoose");

const ROLES = ["customer", "agent", "admin"];

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "name is required"],
      trim: true,
      minlength: [2, "name must be at least 2 characters"],
      maxlength: [50, "name must be at most 50 characters"],
    },
    email: {
      type: String,
      required: [true, "email is required"],
      unique: true, // creates a unique index
      lowercase: true, // "Sam@X.com" and "sam@x.com" are the same user
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "email is not valid"],
    },
    passwordHash: {
      type: String,
      required: true,
      select: false, // never returned by queries unless explicitly requested
    },
    role: {
      type: String,
      enum: {
        values: ROLES,
        message: `role must be one of: ${ROLES.join(", ")}`,
      },
      default: "customer",
    },
  },
  { timestamps: true }
);

userSchema.set("toJSON", {
  virtuals: true,
  versionKey: false,
  transform: (doc, ret) => {
    delete ret._id;
    delete ret.passwordHash; // second safety net: never serialize the hash
  },
});

module.exports = mongoose.model("User", userSchema);
module.exports.ROLES = ROLES;