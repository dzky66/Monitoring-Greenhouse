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
const PORT = process.env.PORT || 8080

// Debug CORS configuration
console.log("🔍 CORS Configuration Debug:")
console.log("NODE_ENV:", process.env.NODE_ENV)
console.log("PORT:", PORT)

// PERBAIKAN CORS - Tambahkan pattern untuk semua URL Vercel
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

  // Railway URLs
  "https://monitoring-greenhouse-production.up.railway.app",
  "https://*.up.railway.app",
  "https://*.railway.app",
]

// Fungsi untuk check apakah origin diizinkan
const isOriginAllowed = (origin) => {
  if (!origin) return true // Allow requests with no origin (mobile apps, curl, etc.)

  // Check exact matches first
  if (allowedOrigins.includes(origin)) {
    return true
  }

  // Check Vercel patterns - semua subdomain vercel.app
  if (origin.includes(".vercel.app")) {
    console.log("✅ CORS: Allowing Vercel domain:", origin)
    return true
  }

  // Check Railway patterns
  if (origin.includes(".railway.app") || origin.includes(".up.railway.app")) {
    console.log("✅ CORS: Allowing Railway domain:", origin)
    return true
  }

  // Check localhost patterns
  if (origin.includes("localhost") || origin.includes("127.0.0.1")) {
    console.log("✅ CORS: Allowing localhost:", origin)
    return true
  }

  return false
}

console.log("✅ CORS will allow:")
console.log("- All *.vercel.app domains")
console.log("- All *.railway.app domains")
console.log("- All localhost/127.0.0.1 domains")
console.log("- Specific allowed origins:", allowedOrigins)

app.use(
  cors({
    origin: (origin, callback) => {
      console.log("🔍 CORS Check for origin:", origin)

      if (isOriginAllowed(origin)) {
        console.log("✅ CORS: Allowed origin:", origin)
        callback(null, true)
      } else {
        console.log("❌ CORS: Blocked origin:", origin)
        console.log("💡 To allow this origin, add it to the allowedOrigins list or update the pattern matching")
        callback(new Error("Not allowed by CORS"))
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept", "Origin"],
    exposedHeaders: ["Content-Range", "X-Content-Range"],
    preflightContinue: false,
    optionsSuccessStatus: 204,
  }),
)

// Add preflight handling untuk semua routes
app.options("*", cors())

app.use(express.json({ limit: "10mb" }))
app.use(express.urlencoded({ extended: true, limit: "10mb" }))

// Request logging middleware untuk debugging
app.use((req, res, next) => {
  const timestamp = new Date().toISOString()
  console.log(`📡 ${timestamp} - ${req.method} ${req.path}`)
  console.log("- Origin:", req.get("Origin") || "No Origin")
  console.log("- User-Agent:", req.get("User-Agent") || "No User-Agent")
  console.log("- Referer:", req.get("Referer") || "No Referer")

  // Log semua headers untuk debugging
  if (req.method === "OPTIONS") {
    console.log("🔍 PREFLIGHT REQUEST HEADERS:")
    console.log(JSON.stringify(req.headers, null, 2))
  }

  next()
})

// API Routes
app.use("/api/auth", authRoutes)
app.use("/api/data-sensor", dataSensorRoutes)
app.use("/api/penjadwalan", penjadwalanRoutes)
app.use("/api/device", deviceRoutes)
app.use("/api/monitoring", monitoringRoutes)
app.use("/api/prediksi", prediksiRoutes)

// Health check endpoint yang lebih robust
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
      cors: {
        enabled: true,
        requestOrigin: req.get("Origin"),
        allowsVercel: true,
        allowsRailway: true,
        allowsLocalhost: true,
      },
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

// Root endpoint
app.get("/", async (req, res) => {
  try {
    await sequelize.authenticate()

    res.json({
      message: "🌱 Greenhouse Monitoring API",
      status: "✅ Running",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || "development",
      database: "✅ Connected",
      port: PORT,
      requestInfo: {
        origin: req.get("Origin"),
        userAgent: req.get("User-Agent"),
        method: req.method,
        path: req.path,
      },
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
        allowsAllVercelDomains: true,
        allowsAllRailwayDomains: true,
        allowsLocalhost: true,
        requestOrigin: req.get("Origin"),
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
    requestOrigin: req.get("Origin"),
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
      allowsAllVercelDomains: true,
      allowsAllRailwayDomains: true,
      allowsLocalhost: true,
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
      solution: "This origin is not in the allowed list. Contact the API administrator to add this domain.",
      allowedPatterns: ["*.vercel.app", "*.railway.app", "localhost:*", "127.0.0.1:*"],
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
  console.log(`- Origin: ${req.get("Origin")}`)

  res.status(404).json({
    error: "Route not found",
    path: req.originalUrl,
    method: req.method,
    origin: req.get("Origin"),
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
    console.log("🚀 Starting sensor simulation...")

    sensorInterval = setInterval(async () => {
      try {
        const currentHour = new Date().getHours()
        const isDay = currentHour >= 6 && currentHour <= 18

        const sensorData = {
          suhu: isDay ? 22 + Math.random() * 8 : 18 + Math.random() * 4,
          cahaya: isDay ? 400 + Math.random() * 600 : 0 + Math.random() * 50,
          kelembapan_udara: 60 + Math.random() * 30,
          kelembapan_tanah: 30 + Math.random() * 40,
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
    }, 30000)
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
    console.log("🔍 Railway MySQL Connection Debug:")
    console.log("MYSQL_URL:", process.env.MYSQL_URL ? "Found" : "Not found")
    console.log("DATABASE_URL:", process.env.DATABASE_URL ? "Found" : "Not found")

    console.log("🔄 Connecting to database...")
    await sequelize.authenticate()
    console.log("✅ Database connection established successfully")

    console.log("🔄 Synchronizing database models...")
    await sequelize.sync({
      alter: process.env.NODE_ENV === "development",
      force: false,
    })
    console.log("✅ Database models synchronized")

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Server running on port ${PORT}`)
      console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`)
      console.log(`🌱 Greenhouse Monitoring API started successfully`)
      console.log(`📡 Local URL: http://localhost:${PORT}`)
      console.log(`🔗 External URL: https://monitoring-greenhouse-production.up.railway.app`)
      console.log(`✅ CORS configured to allow all *.vercel.app domains`)

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

process.on("unhandledRejection", (err) => {
  console.error("❌ Unhandled Promise Rejection:", err)
  stopSensorSimulation()
  sequelize.close().then(() => {
    process.exit(1)
  })
})

// Start the server
startServer()
