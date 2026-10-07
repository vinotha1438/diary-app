const express = require("express");
const Entry = require("../models/Entry");
const auth = require("../middleware/auth");

const router = express.Router();

router.use(auth);

// CREATE
router.post("/", async (req, res) => {
  try {
    const { text, mood, tags, photos, date } = req.body;
    if (!text) {
      return res.status(400).json({ message: "Text is required" });
    }

    const cleanPhotos = Array.isArray(photos)
      ? photos
          .filter((p) => typeof p === "string" && p.startsWith("data:image/"))
          .slice(0, 4)
      : [];

    const data = {
      userId: req.userId,
      text,
      mood,
      tags,
      photos: cleanPhotos,
    };

    // Optional: choose the day and time the entry belongs to
    if (date) {
      const d = new Date(date);
      const now = new Date();
      const oldest = new Date();
      oldest.setFullYear(now.getFullYear() - 20);
      if (
        isNaN(d) ||
        d > new Date(now.getTime() + 5 * 60 * 1000) ||
        d < oldest
      ) {
        return res.status(400).json({ message: "Invalid date" });
      }
      data.createdAt = d;
    }

    const entry = await Entry.create(data);
    res.status(201).json(entry);
  } catch (err) {
    console.log("Create entry error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

// READ
router.get("/", async (req, res) => {
  try {
    const filter = { userId: req.userId };

    if (req.query.date) {
      const start = new Date(req.query.date + "T00:00:00");
      const end = new Date(req.query.date + "T23:59:59.999");
      filter.createdAt = { $gte: start, $lte: end };
    }

    const entries = await Entry.find(filter).sort({ createdAt: -1 });
    res.json(entries);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// UPDATE (text only, photos stay as they are)
router.put("/:id", async (req, res) => {
  try {
    const { text, mood, tags } = req.body;
    const entry = await Entry.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { text, mood, tags },
      { new: true, runValidators: true }
    );
    if (!entry) {
      return res.status(404).json({ message: "Entry not found" });
    }
    res.json(entry);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE
router.delete("/:id", async (req, res) => {
  try {
    const entry = await Entry.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId,
    });
    if (!entry) {
      return res.status(404).json({ message: "Entry not found" });
    }
    res.json({ message: "Entry deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;