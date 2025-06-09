const express = require("express");
const cors = require("cors");
const serverless = require("serverless-http");

// ... import semua yang diperlukan ...

const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/data-sensor", dataSensorRoutes);
app.use("/api/penjadwalan", penjadwalanRoutes);
app.use("/api/device", deviceRoutes);
app.use("/api/monitoring", monitoringRoutes);
app.use("/api/prediksi", prediksiRoutes);

// Root endpoint
app.get("/", async (req, res) => {
  try {
    res.json({
      message: "Greenhouse Monitoring API",
      status: "running",
      timestamp: new Date().toISOString(),
      endpoints: [
        "/api/auth",
        "/api/data-sensor", 
        "/api/penjadwalan",
        "/api/device",
        "/api/monitoring",
        "/api/prediksi"
      ]
    });
  } catch (err) {
    res.status(500).json({ error: "Server error", detail: err.message });
  }
});

// Export untuk Vercel
export default serverless(app);