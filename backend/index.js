import dotenv from "dotenv";

dotenv.config();

import express from "express";
import { connectDB } from "./config/db.js";
import trainRoutes from "./route/trainRoutes.js";
import Pmplroute from "./route/Pmplroute.js";
import msrtcRoutes from "./route/msrtcRoutes.js";
import TransitRoutes from "./route/TransitRoutes.js";
import routePlannerRoutes from "./route/routePlannerRoutes.js";
import cors from "cors";

const app = express();

app.use(cors());

app.use(express.json());



// Middleware
app.use(express.json());
connectDB();

// Routes
app.use("/api/trains", trainRoutes);
app.use("/api/pmpl", Pmplroute);
app.use("/api/msrtcbus",msrtcRoutes);
app.use("/api/transit-stops",TransitRoutes);
app.use("/api/route-planner", routePlannerRoutes);
app.get("/", (req, res) => {
  res.send("TransitHub Backend is Running");
});


const PORT = process.env.PORT ||5000;

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});