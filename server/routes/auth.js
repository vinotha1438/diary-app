const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const createToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: "7d" });

const bad = (res, message) => res.status(400).json({ message });

// SIGNUP
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body || {};

    // Only plain strings are allowed (blocks objects like {"$gt": ""})
    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string"
    ) {
      return bad(res, "All fields are required");
    }

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanName || !cleanEmail || !password) {
      return bad(res, "All fields are required");
    }
    if (cleanName.length > 60) return bad(res, "Name is too long");
    if (cleanEmail.length > 254 || !EMAIL_RE.test(cleanEmail)) {
      return bad(res, "Please enter a valid email");
    }
    if (password.length < 6) {
      return bad(res, "Password must be at least 6 characters");
    }
    // bcrypt only uses the first 72 bytes of a password
    if (Buffer.byteLength(password, "utf8") > 72) {
      return bad(res, "Password is too long (max 72 characters)");
    }

    const existing = await User.findOne({ email: cleanEmail });
    if (existing) return bad(res, "Email already registered");

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({
      name: cleanName,
      email: cleanEmail,
      password: hashed,
    });

    res.status(201).json({
      token: createToken(user._id),
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (err) {
    // Two signups at the same moment can both pass the check above
    if (err.code === 11000) return bad(res, "Email already registered");
    console.error("Signup error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

// LOGIN
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (typeof email !== "string" || typeof password !== "string") {
      return bad(res, "Email and password are required");
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) return bad(res, "Invalid email or password");

    const match = await bcrypt.compare(password, user.password);
    if (!match) return bad(res, "Invalid email or password");

    res.json({
      token: createToken(user._id),
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (err) {
    console.error("Login error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;