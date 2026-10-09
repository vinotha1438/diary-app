const express = require("express");
const Entry = require("../models/Entry");
const auth = require("../middleware/auth");

const router = express.Router();

const MAX_TEXT = 5000;

// Only accept photo URLs that came from our own Cloudinary account
const photoPrefix = process.env.CLOUDINARY_CLOUD_NAME
  ? `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/`
  : "https://res.cloudinary.com/";
const isValidPhoto = (p) =>
  typeof p === "string" && p.length < 500 && p.startsWith(photoPrefix);

// Checks text / mood / tags. Fields that are missing are simply skipped.
const parseFields = (body) => {
  const { text, mood, tags } = body || {};
  const value = {};

  if (text != null) {
    if (typeof text !== "string" || !text.trim()) {
      return { error: "Text is required" };
    }
    if (text.length > MAX_TEXT) {
      return { error: `Text is too long (max ${MAX_TEXT} characters)` };
    }
    value.text = text;
  }
  if (mood != null) {
    if (typeof mood !== "string" || mood.length > 16) {
      return { error: "Invalid mood" };
    }
    value.mood = mood;
  }
  if (tags != null) {
    if (
      !Array.isArray(tags) ||
      tags.length > 10 ||
      tags.some((t) => typeof t !== "string" || t.length > 30)
    ) {
      return { error: "Invalid tags" };
    }
    value.tags = tags;
  }
  return { value };
};

// Runs for every route that has :id, so a bad id gives 400 instead of 500
router.param("id", (req, res, next, id) => {
  if (!/^[0-9a-fA-F]{24}$/.test(id)) {
    return res.status(400).json({ message: "Invalid entry id" });
  }
  next();
});

router.use(auth);

// CREATE
router.post("/", async (req, res) => {
  try {
    const { photos, date } = req.body || {};

    const { value, error } = parseFields(req.body);
    if (error) return res.status(400).json({ message: error });
    if (!value.text) {
      return res.status(400).json({ message: "Text is required" });
    }

    const cleanPhotos = Array.isArray(photos)
      ? photos.filter(isValidPhoto).slice(0, 4)
      : [];

    const data = { userId: req.userId, ...value, photos: cleanPhotos };

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
    console.error("Create entry error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

// READ
router.get("/", async (req, res) => {
  try {
    const filter = { userId: req.userId };

    if (req.query.date !== undefined) {
      const day = req.query.date;
      if (typeof day !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(day)) {
        return res.status(400).json({ message: "Invalid date" });
      }
      const start = new Date(day + "T00:00:00");
      const end = new Date(day + "T23:59:59.999");
      if (isNaN(start) || isNaN(end)) {
        return res.status(400).json({ message: "Invalid date" });
      }
      filter.createdAt = { $gte: start, $lte: end };
    }

    const entries = await Entry.find(filter).sort({ createdAt: -1 });
    res.json(entries);
  } catch (err) {
    console.error("Get entries error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

// UPDATE (text / mood / tags, photos stay as they are)
router.put("/:id", async (req, res) => {
  try {
    const { value, error } = parseFields(req.body);
    if (error) return res.status(400).json({ message: error });
    if (Object.keys(value).length === 0) {
      return res.status(400).json({ message: "Nothing to update" });
    }

    const entry = await Entry.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { $set: value },
      { new: true, runValidators: true }
    );
    if (!entry) {
      return res.status(404).json({ message: "Entry not found" });
    }
    res.json(entry);
  } catch (err) {
    console.error("Update entry error:", err.message);
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
    console.error("Delete entry error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;