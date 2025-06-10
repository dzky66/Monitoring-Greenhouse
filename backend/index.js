const express = require("express")
const cors = require("cors")
require("dotenv").config()

const sequelize = require("./config/db")

// Import models
const { User, UserProfile } = require("./models")
const DataSensor = require("./models/datasensor")
const Penjadwalan = require("./models/penjadwalan")
const Device = require("./models/device")
const DeviceLog = require("./models/devicelog")
const Monitoring = require("./models/monitoring")
const Prediksi = require("./models/prediksi")

// Import routes
const authRoutes = require("./routes/user")
const dataSensorRoutes = require("./routes/datasensor")
const penjadwalanRoutes = require("./routes/penjadwalan")
const deviceRoutes = require("./routes/device")
const monitoringRoutes = require("./routes/monitoring")
const prediksiRoutes = require("./routes/prediksi")

const app = express()
const PORT = process.env.PORT || 8080 // Railway menggunakan port 8080

// Debug CORS configuration
console.log("🔍 CORS Configuration Debug:")
console.log("NODE_ENV:", process.env.NODE_ENV)
console.log("PORT:", PORT)

// PERBAIKAN CORS - Tambahkan lebih banyak origin yang diizinkan
const allowedOrigins = [
  // Production URLs
  "https://monitoring-greenhouse-4ulk.vercel.app",
  "https://monitoring-greenhouse-production.up.railway.app",

  // Development URLs
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:5173", // Vite default port
  "http://localhost:4173", // Vite preview port
  "http://127.0.0.1:3000",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:4173",

  // Railway internal
  "https://*.up.railway.app",
  "https://*.railway.app",
]

console.log("✅ Allowed CORS origins:", allowedOrigins)

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, etc.)
      if (!origin) return callback(null, true)

      // Check if origin is in allowed list or matches pattern
      const isAllowed = allowedOrigins.some((allowedOrigin) => {
        if (allowedOrigin.includes("*")) {
          // Handle wildcard patterns
          const pattern = allowedOrigin.replace(/\*/g, ".*")
          const regex = new RegExp(pattern)
          return regex.test(origin)
        }
        return allowedOrigin === origin
      })

      if (isAllowed) {
        console.log("✅ CORS: Allowed origin:", origin)
        callback(null, true)
      } else {
        console.log("❌ CORS: Blocked origin:", origin)
        callback(new Error("Not allowed by CORS"))
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"],
    exposedHeaders: ["Content-Range", "X-Content-Range"],
  }),
)

// Add preflight handling
app.options("*", cors())

app.use(express.json({ limit: "10mb" }))
app.use(express.urlencoded({ extended: true, limit: "10mb" }))

// Request logging middleware untuk debugging
app.use((req, res, next) => {
  console.log(`📡 ${new Date().toISOString()} - ${req.method} ${req.path}`)
  console.log("- Origin:", req.get("Origin"))
  console.log("- User-Agent:", req.get("User-Agent"))
  console.log("- Headers:", JSON.stringify(req.headers, null, 2))
  next()
})

// API Routes
app.use("/api/auth", authRoutes)
app.use("/api/data-sensor", dataSensorRoutes)
app.use("/api/penjadwalan", penjadwalanRoutes)
app.use("/api/device", deviceRoutes)
app.use("/api/monitoring", monitoringRoutes)
app.use("/api/prediksi", prediksiRoutes)

// PERBAIKAN: Tambahkan health check endpoint yang lebih robust
app.get("/api/health", async (req, res) => {
  try {
    // Test database connection
    await sequelize.authenticate()

    res.json({
      status: "healthy",
      message: "🌱 Greenhouse Monitoring API is running",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || "development",
      database: "connected",
      port: PORT,
      uptime: process.uptime(),
      version: "1.0.0",
    })
  } catch (error) {
    res.status(500).json({
      status: "unhealthy",
      message: "❌ API Error",
      database: "disconnected",
      error: error.message,
      timestamp: new Date().toISOString(),
    })
  }
})

// Root endpoint - lebih informatif
app.get("/", async (req, res) => {
  try {
    // Test database connection
    await sequelize.authenticate()

    res.json({
      message: "🌱 Greenhouse Monitoring API",
      status: "✅ Running",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || "development",
      database: "✅ Connected",
      port: PORT,
      endpoints: {
        health: "/api/health",
        auth: "/api/auth",
        dataSensor: "/api/data-sensor",
        penjadwalan: "/api/penjadwalan",
        device: "/api/device",
        monitoring: "/api/monitoring",
        prediksi: "/api/prediksi",
      },
      cors: {
        enabled: true,
        allowedOrigins: allowedOrigins,
      },
      version: "1.0.0",
    })
  } catch (error) {
    res.status(500).json({
      message: "❌ API Error",
      status: "Error",
      database: "❌ Disconnected",
      error: error.message,
      timestamp: new Date().toISOString(),
    })
  }
})

// API info endpoint
app.get("/api", (req, res) => {
  res.json({
    message: "Greenhouse Monitoring API Endpoints",
    baseUrl: req.protocol + "://" + req.get("host"),
    endpoints: [
      { path: "/api/health", methods: ["GET"], description: "Health check" },
      { path: "/api/auth/login", methods: ["POST"], description: "User login" },
      { path: "/api/auth/register", methods: ["POST"], description: "User registration" },
      { path: "/api/data-sensor", methods: ["GET", "POST"], description: "Sensor data management" },
      { path: "/api/data-sensor/latest", methods: ["GET"], description: "Latest sensor data" },
      { path: "/api/penjadwalan", methods: ["GET", "POST", "PUT", "DELETE"], description: "Scheduling management" },
      { path: "/api/device", methods: ["GET", "POST", "PUT", "DELETE"], description: "Device management" },
      { path: "/api/monitoring", methods: ["GET"], description: "Monitoring and recommendations" },
      { path: "/api/prediksi", methods: ["GET", "POST"], description: "Prediction analysis" },
    ],
    cors: {
      enabled: true,
      allowedOrigins: allowedOrigins,
    },
    timestamp: new Date().toISOString(),
  })
})

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("❌ Error:", err.stack)

  // Handle CORS errors specifically
  if (err.message === "Not allowed by CORS") {
    return res.status(403).json({
      error: "CORS Error",
      message: "Origin not allowed by CORS policy",
      origin: req.get("Origin"),
      allowedOrigins: allowedOrigins,
      timestamp: new Date().toISOString(),
    })
  }

  res.status(500).json({
    error: "Internal Server Error",
    message: process.env.NODE_ENV === "development" ? err.message : "Something went wrong!",
    timestamp: new Date().toISOString(),
  })
})

// 404 handler
app.use("*", (req, res) => {
  console.log(`❌ 404 - Route not found: ${req.method} ${req.originalUrl}`)
  res.status(404).json({
    error: "Route not found",
    path: req.originalUrl,
    method: req.method,
    message: "The requested endpoint does not exist",
    availableEndpoints: [
      "/",
      "/api",
      "/api/health",
      "/api/auth/login",
      "/api/auth/register",
      "/api/data-sensor",
      "/api/data-sensor/latest",
      "/api/penjadwalan",
      "/api/device",
      "/api/monitoring",
      "/api/prediksi",
    ],
    timestamp: new Date().toISOString(),
  })
})

// Simulasi sensor (background process)
let sensorInterval

function startSensorSimulation() {
  if (process.env.ENABLE_SENSOR_SIMULATION !== "false") {
    // Default enabled
    console.log("🚀 Starting sensor simulation...")

    sensorInterval = setInterval(async () => {
      try {
        // Simulasi data sensor realistis
        const currentHour = new Date().getHours()
        const isDay = currentHour >= 6 && currentHour <= 18

        const sensorData = {
          suhu: isDay ? 22 + Math.random() * 8 : 18 + Math.random() * 4, // 22-30°C siang, 18-22°C malam
          cahaya: isDay ? 400 + Math.random() * 600 : 0 + Math.random() * 50, // Terang siang, gelap malam
          kelembapan_udara: 60 + Math.random() * 30, // 60-90%
          kelembapan_tanah: 30 + Math.random() * 40, // 30-70%
          waktu: new Date(),
        }

        await DataSensor.create(sensorData)
        console.log(`📊 [${sensorData.waktu.toLocaleTimeString()}] Sensor data saved:`, {
          suhu: `${sensorData.suhu.toFixed(1)}°C`,
          cahaya: `${Math.round(sensorData.cahaya)} lux`,
          kelembapan_udara: `${sensorData.kelembapan_udara.toFixed(1)}%`,
          kelembapan_tanah: `${sensorData.kelembapan_tanah.toFixed(1)}%`,
        })
      } catch (error) {
        console.error("❌ Sensor simulation error:", error.message)
      }
    }, 30000) // 30 detik
  } else {
    console.log("⏸️ Sensor simulation disabled")
  }
}

function stopSensorSimulation() {
  if (sensorInterval) {
    clearInterval(sensorInterval)
    console.log("🛑 Sensor simulation stopped")
  }
}

// Database connection and server startup
async function startServer() {
  try {
    // Debug MySQL connection
    console.log("🔍 Railway MySQL Connection Debug:")
    console.log("MYSQL_URL:", process.env.MYSQL_URL ? "Found" : "Not found")
    console.log("DATABASE_URL:", process.env.DATABASE_URL ? "Found" : "Not found")
    console.log("MYSQL_HOST:", process.env.MYSQL_HOST ? "Found" : "Not found")
    console.log("MYSQL_USER:", process.env.MYSQL_USER ? "Found" : "Not found")
    console.log("MYSQL_DATABASE:", process.env.MYSQL_DATABASE ? "Found" : "Not found")

    console.log("🔄 Connecting to database...")
    await sequelize.authenticate()
    console.log("✅ Database connection established successfully")

    // Sync database models
    console.log("🔄 Synchronizing database models...")
    await sequelize.sync({
      alter: process.env.NODE_ENV === "development",
      force: false, // NEVER use force: true in production
    })
    console.log("✅ Database models synchronized")

    // Start server
    app.listen(PORT, "0.0.0.0", () => {
      // Bind to all interfaces
      console.log(`🚀 Server running on port ${PORT}`)
      console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`)
      console.log(`🌱 Greenhouse Monitoring API started successfully`)
      console.log(`📡 API URL: http://localhost:${PORT}`)
      console.log(`🔗 External URL: https://monitoring-greenhouse-production.up.railway.app`)

      // Start sensor simulation if enabled
      startSensorSimulation()
    })
  } catch (error) {
    console.error("❌ Unable to start server:", error)
    console.error("💡 Check your database connection and environment variables")
    process.exit(1)
  }
}

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("🔄 SIGTERM received, shutting down gracefully...")
  stopSensorSimulation()
  sequelize.close().then(() => {
    console.log("✅ Database connection closed")
    process.exit(0)
  })
})

process.on("SIGINT", () => {
  console.log("🔄 SIGINT received, shutting down gracefully...")
  stopSensorSimulation()
  sequelize.close().then(() => {
    console.log("✅ Database connection closed")
    process.exit(0)
  })
})

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  console.error("❌ Unhandled Promise Rejection:", err)
  stopSensorSimulation()
  sequelize.close().then(() => {
    process.exit(1)
  })
})

// Start the server
startServer()
