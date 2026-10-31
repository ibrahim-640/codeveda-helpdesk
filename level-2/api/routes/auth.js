const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

const SALT_ROUNDS = 12;
const COOKIE_MAX_AGE = 24 * 60 * 60 * 1000; // 1 day, matches JWT_EXPIRES_IN=1d

// Compared against when the email doesn't exist, so login takes the
// same time either way and doesn't reveal which emails are registered
const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", SALT_ROUNDS);

const cookieOptions = {
  httpOnly: true, // JavaScript can't read it
  sameSite: "lax", // blocks most cross-site request forgery
  secure: process.env.NODE_ENV === "production", // HTTPS only in production
  maxAge: COOKIE_MAX_AGE,
};
const { maxAge, ...clearCookieOptions } = cookieOptions;

const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// Sign up: always creates a "customer", whatever the request says
router.post(
  "/signup",
  asyncHandler(async (req, res) => {
    const { name, email, password } = req.body ?? {};

    // Must be strings: blocks objects like {"$ne": ""} from reaching MongoDB
    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string"
    ) {
      return res
        .status(400)
        .json({ error: "name, email and password are required" });
    }
    // bcrypt only uses the first 72 bytes, so longer passwords are rejected
    if (password.length < 8 || password.length > 72) {
      return res
        .status(400)
        .json({ error: "password must be between 8 and 72 characters" });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    // role is deliberately not read from the request
    const user = await User.create({ name, email, passwordHash });

    res.status(201).json(user);
  })
);

// Log in: checks the password, sets the cookie
router.post(
  "/login",
  asyncHandler(async (req, res) => {
    const { email, password } = req.body ?? {};

    if (typeof email !== "string" || typeof password !== "string") {
      return res.status(400).json({ error: "email and password are required" });
    }

    const user = await User.findOne({
      email: email.toLowerCase().trim(),
    }).select("+passwordHash");

    const passwordOk = await bcrypt.compare(
      password,
      user ? user.passwordHash : DUMMY_HASH
    );

    // Same message for "no such user" and "wrong password"
    if (!user || !passwordOk) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "1d" }
    );

    res.cookie("token", token, cookieOptions);
    res.json(user);
  })
);

// Who am I? (protected)
router.get("/me", requireAuth, (req, res) => {
  res.json(req.user);
});

// Log out: clear the cookie
router.post("/logout", (req, res) => {
  res.clearCookie("token", clearCookieOptions);
  res.json({ message: "Logged out" });
});

module.exports = router;