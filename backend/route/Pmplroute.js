import express from "express";

import {
  getAllBusRoutes,
  getBusRouteByNumber,
  searchBusRoute,
  getTrips,
  getStops,
  createBusRoute
} from "../controller/Pmplcontroller.js";

const router = express.Router();

//create pmpl routes
router.post("/createpmpl",createBusRoute);
// Get all bus routes
router.get("/getallpmpl", getAllBusRoutes);


// Search by source and destination
router.get("/search", searchBusRoute);


// Get route by route number
router.get("/:routeNumber", getBusRouteByNumber);


// Get trips
router.get("/:routeNumber/trips", getTrips);


// Get stops
router.get("/:routeNumber/stops", getStops);


export default router;