const dns = require("dns");
// Only needed on some home networks so Atlas (mongodb+srv) can be found
if (process.env.NODE_ENV !== "production") {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
}
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

if (!process.env.MONGO_URI || !process.env.JWT_SECRET) {
  console.error("Missing MONGO_URI or JWT_SECRET in the environment");
  process.exit(1);
}

const app = express();

// Render / Vercel-style hosts put one proxy in front of the app.
// Needed so the rate limiter sees each visitor's real IP.
app.set("trust proxy", 1);

// Which websites may call this API (comma separated list in CLIENT_URL)
const allowedOrigins = [
  "http://localhost:5173",
  ...(process.env.CLIENT_URL || "").split(","),
]
  .map((o) => o.trim().replace(/\/$/, ""))
  .filter(Boolean);

app.use(helmet());
app.use(
  cors({
    origin: (origin, cb) => {
      // no origin = Postman, curl or same-origin request
      if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
      cb(new Error("Not allowed by CORS"));
    },
  })
);
app.use(express.json({ limit: "1mb" }));

// Whole API: 600 requests per 15 minutes per IP
app.use(
  "/api",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 600,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Too many requests. Please slow down." },
  })
);

// Login / signup: only FAILED attempts count, 15 per 15 minutes
app.use(
  "/api/auth",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 15,
    skipSuccessfulRequests: true,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      message: "Too many failed attempts. Please try again in a few minutes.",
    },
  })
);

app.use("/api/auth", require("./routes/auth"));
app.use("/api/entries", require("./routes/entries"));

app.get("/", (req, res) => {
  res.send("Diary API is running");
});

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Last safety net: broken JSON, CORS errors, anything unexpected
app.use((err, req, res, next) => {
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ message: "Invalid JSON" });
  }
  if (err.type === "entity.too.large") {
    return res.status(413).json({ message: "Request is too large" });
  }
  if (err.message === "Not allowed by CORS") {
    return res.status(403).json({ message: "Origin not allowed" });
  }
  console.error("Unhandled error:", err.message);
  res.status(500).json({ message: "Server error" });
});

const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => console.error("MongoDB connection error:", err.message));