const express = require("express")
const cors = require("cors")
const sequelize = require("./config/db")
require("dotenv").config()

// Import models
const { User, UserProfile } = require("./models")
const DataSensor = require("./models/datasensor")
const Penjadwalan = require("./models/penjadwalan")
const Device = require("./models/device")
const DeviceLog = require("./models/devicelog")
const monitoring = require("./models/monitoring")
const prediksi = require("./models/prediksi")

// Import routes
const authRoutes = require("./routes/user")
const dataSensorRoutes = require("./routes/datasensor")
const penjadwalanRoutes = require("./routes/penjadwalan")
const deviceRoutes = require("./routes/device")
const monitoringRoutes = require("./routes/monitoring")
const prediksiRoutes = require("./routes/prediksi")

const app = express()

// Middleware
app.use(cors())
app.use(express.json())

// API routes
app.use("/api/auth", authRoutes)
app.use("/api/data-sensor", dataSensorRoutes)
app.use("/api/penjadwalan", penjadwalanRoutes)
app.use("/api/device", deviceRoutes)
app.use("/api/monitoring", monitoringRoutes)
app.use("/api/prediksi", prediksiRoutes)

// Test route
app.get("/", async (req, res) => {
  try {
    const [users, userProfiles, dataSensor, penjadwalan, devices] = await Promise.all([
      User.findAll({
        include: [
          {
            model: UserProfile,
            as: "userProfile",
          },
        ],
      }),
      UserProfile.findAll(),
      DataSensor.findAll({ order: [["waktu", "DESC"]], limit: 10 }),
      Penjadwalan.findAll(),
      Device.findAll(),
    ])

    res.json({
      users,
      userProfiles,
      dataSensor,
      penjadwalan,
      monitoring,
      prediksi,
      devices,
    })
  } catch (err) {
    console.error("Gagal mengambil data:", err)
    res.status(500).json({ error: "Gagal mengambil data dari database", detail: err.message })
  }
})

// Sync database & start server
sequelize
  .sync({ alter: true })
  .then(() => {
    console.log("Database berhasil tersinkronisasi")

    app.listen(5000, () => {
      console.log("Server berjalan di http://localhost:5000")
    })
  })
  .catch((err) => {
    console.error("Gagal menyambungkan database:", err)
  })
