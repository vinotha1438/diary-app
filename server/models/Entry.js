const mongoose = require("mongoose");

const entrySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: { type: String, required: true, trim: true },
      mood: {
      type: String,
      default: "😌",
      trim: true,
      maxlength: 16,
    },
    tags: [{ type: String, trim: true }],
  },
  { timestamps: true } // createdAt = entry eluthuna time
);

module.exports = mongoose.model("Entry", entrySchema);