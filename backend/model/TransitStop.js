
import mongoose from "mongoose";

const transitStopSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    shortName: String,
    type: {
      type: String,
      enum: ["train", "msrtc", "pmpl", "metro"],
      required: true,
    },
    category: String,
    lat: Number,
    lng: Number,
    lines: [String],
    address: String,
    platforms: Number,
    facilities: [String],
  },
  { timestamps: true }
);

export default mongoose.model("TransitStop", transitStopSchema);
