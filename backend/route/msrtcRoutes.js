import express from "express";

import {
  createBus,
  getAllBuses,
  getBusById,
  updateBus,
  deleteBus,
  getStops,
  getBusTime,
  searchBus,
} from "../controller/msrtcController.js";

const router = express.Router();


// Create bus
router.post("/createbus", createBus);


// Get all buses
router.get("/getallbus", getAllBuses);


// Search bus
router.get("/search", searchBus);


// Get bus by ID
router.get("/:busId", getBusById);


// Update bus
router.put("/:busId", updateBus);


// Delete bus
router.delete("/:busId", deleteBus);


// Get stops
router.get("/:busId/stops", getStops);


// Get departure/arrival time
router.get("/:busId/time", getBusTime);


export default router;