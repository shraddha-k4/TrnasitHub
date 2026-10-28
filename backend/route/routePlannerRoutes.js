
import express from "express";
import { getRoutePlanner } from "../controller/routePlannerController.js";
import { getAllRoutesForC } from "../controller/allRoutesForCController.js";
const router = express.Router();

router.get("/", getRoutePlanner);
router.get("/all-for-c", getAllRoutesForC);

export default router;
