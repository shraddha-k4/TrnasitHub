import dotenv from "dotenv";

dotenv.config();

import express from "express";
import { connectDB } from "./config/db.js";
import trainRoutes from "./route/trainRoutes.js";
import Pmplroute from "./route/Pmplroute.js";
const app = express();



// Middleware
app.use(express.json());

// // Home route
// app.get("/", (req, res) => {
//     res.json({
//         message: "Backend server is running successfully!"
//     });
// });

connectDB();

// Routes
app.use("/api/trains", trainRoutes);
app.use("/api/pmpl", Pmplroute);


app.get("/", (req, res) => {
  res.send("TransitHub Backend is Running");
});


const PORT = process.env.PORT ||5000;

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});