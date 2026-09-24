import dotenv from "dotenv";

dotenv.config();

import express from "express";
import { connectDB } from "./config/db.js";

const app = express();

const PORT = 5000;

// Middleware
app.use(express.json());

// Home route
app.get("/", (req, res) => {
    res.json({
        message: "Backend server is running successfully!"
    });
});

connectDB();



// Start server
app.listen(PORT, () => {
    console.log(`http://localhost:${PORT}`);
});