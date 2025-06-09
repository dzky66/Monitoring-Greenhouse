const express = require("express");
const cors = require("cors");
const serverless = require("serverless-http");
require("dotenv").config();

// Import models (tanpa background process)
const DataSensor = require("../models/datasensor");
const Monitoring = require("../models/monitoring");

const app = express();
app.use(cors());
app.use(express.json());

// API endpoint untuk mendapatkan data sensor terbaru
app.get("/api/sensor/latest", async (req, res) => {
  try {
    const data = await DataSensor.findAll({
      order: [["waktu", "DESC"]],
      limit: 1,
    });
    
    if (data.length === 0) {
      return res.status(404).json({ message: "Data sensor tidak ditemukan" });
    }
    
    res.json(data[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API endpoint untuk monitoring
app.get("/api/monitoring", async (req, res) => {
  try {
    const data = await DataSensor.findAll({
      order: [["waktu", "DESC"]],
      limit: 1,
    });

    if (data.length === 0) {
      return res.status(404).json({ message: "Data sensor tidak ditemukan" });
    }

    const latest = data[0];
    const status = [];
    const rekomendasi = [];

    // Logic monitoring Anda
    if (latest.suhu < 18) {
      status.push("Suhu Rendah");
      rekomendasi.push("Tutup ventilasi");
    } else if (latest.suhu > 30) {
      status.push("Suhu Tinggi");
      rekomendasi.push("Buka ventilasi");
    }

    // ... logic lainnya

    if (status.length === 0) {
      status.push("Normal");
      rekomendasi.push("Kondisi optimal");
    }

    res.json({
      suhu: latest.suhu,
      kelembapan_udara: latest.kelembapan_udara,
      kelembapan_tanah: latest.kelembapan_tanah,
      cahaya: latest.cahaya,
      waktu: latest.waktu,
      status,
      rekomendasi,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    message: "Greenhouse Monitoring API",
    status: "running",
    endpoints: [
      "/api/sensor/latest",
      "/api/monitoring"
    ]
  });
});

// Export untuk Vercel (TANPA background process)
module.exports = serverless(app);