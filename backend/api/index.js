const express = require("express");
const cors = require("cors");
const serverless = require("serverless-http");
require("dotenv").config();

const sequelize = require("../config/db");

// Import models
const { User, UserProfile } = require("../models");
const DataSensor = require("../models/datasensor");
const Penjadwalan = require("../models/penjadwalan");
const Device = require("../models/device");
const DeviceLog = require("../models/devicelog");
const monitoring = require("../models/monitoring");
const prediksi = require("../models/prediksi");

// Import routes
const authRoutes = require("../routes/user");
const dataSensorRoutes = require("../routes/datasensor");
const penjadwalanRoutes = require("../routes/penjadwalan");
const deviceRoutes = require("../routes/device");
const monitoringRoutes = require("../routes/monitoring");
const prediksiRoutes = require("../routes/prediksi");

const app = express();
app.use(cors());
app.use(express.json());

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/data-sensor", dataSensorRoutes);
app.use("/api/penjadwalan", penjadwalanRoutes);
app.use("/api/device", deviceRoutes);
app.use("/api/monitoring", monitoringRoutes);
app.use("/api/prediksi", prediksiRoutes);

// Root route untuk cek API dan test koneksi DB
app.get("/", async (req, res) => {
  try {
    const [users, userProfiles, dataSensor, penjadwalan, devices] = await Promise.all([
      User.findAll({ include: [{ model: UserProfile, as: "userProfile" }] }),
      UserProfile.findAll(),
      DataSensor.findAll({ order: [["waktu", "DESC"]], limit: 10 }),
      Penjadwalan.findAll(),
      Device.findAll(),
    ]);

    res.json({
      users,
      userProfiles,
      dataSensor,
      penjadwalan,
      monitoring,
      prediksi,
      devices,
    });
  } catch (err) {
    res.status(500).json({ error: "Gagal mengambil data", detail: err.message });
  }
});

// Jangan jalankan sequelize.sync di serverless environment jika tidak perlu
// sequelize.sync({ alter: true }).then(() => {
//   console.log("Database sinkron (Vercel)");
// }).catch((err) => {
//   console.error("DB Error:", err);
// });

module.exports = app;
module.exports.handler = serverless(app);
