
import express from "express";
import TransitStop from "../model/TransitStop.js";

const router = express.Router();

// GET: All transit stops
router.get("/", async (req, res) => {
  try {
    const stops = await TransitStop.find();
    res.status(200).json({
      success: true,
      count: stops.length,
      data: stops,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// POST: Insert one or multiple transit stops
router.post("/bulk", async (req, res) => {
  try {
    const stops = Array.isArray(req.body)
      ? req.body
      : req.body.stops;

    if (!Array.isArray(stops) || stops.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Send a non-empty JSON array of stops.",
      });
    }

    const operations = stops.map((stop) => ({
      updateOne: {
        filter: { id: stop.id },
        update: { $set: stop },
        upsert: true,
      },
    }));

    const result = await TransitStop.bulkWrite(operations);

    res.status(200).json({
      success: true,
      message: "Transit stops imported successfully",
      received: stops.length,
      inserted: result.upsertedCount,
      modified: result.modifiedCount,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

export default router;
