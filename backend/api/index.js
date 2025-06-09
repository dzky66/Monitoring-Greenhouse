const express = require("express");
const cors = require("cors");
const serverless = require("serverless-http");
require("dotenv").config();

// Import routes dan models
const authRoutes = require("../routes/user");
const dataSensorRoutes = require("../routes/datasensor");
// ... import lainnya

const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/data-sensor", dataSensorRoutes);
// ... routes lainnya

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    message: "Greenhouse Monitoring API",
    status: "running",
    timestamp: new Date().toISOString()
  });
});

// Export untuk Vercel
module.exports = serverless(app);