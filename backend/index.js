const express = require("express");
const cors = require("cors");
require("dotenv").config();

const sequelize = require("./config/db");

// Import models
const { User, UserProfile } = require("./models");
const DataSensor = require("./models/datasensor");
const Penjadwalan = require("./models/penjadwalan");
const Device = require("./models/device");
const DeviceLog = require("./models/devicelog");
const Monitoring = require("./models/monitoring");
const Prediksi = require("./models/prediksi");

// Import routes
const authRoutes = require("./routes/user");
const dataSensorRoutes = require("./routes/datasensor");
const penjadwalanRoutes = require("./routes/penjadwalan");
const deviceRoutes = require("./routes/device");
const monitoringRoutes = require("./routes/monitoring");
const prediksiRoutes = require("./routes/prediksi");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-frontend-domain.com'] 
    : ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/data-sensor", dataSensorRoutes);
app.use("/api/penjadwalan", penjadwalanRoutes);
app.use("/api/device", deviceRoutes);
app.use("/api/monitoring", monitoringRoutes);
app.use("/api/prediksi", prediksiRoutes);

// Health check endpoint
app.get("/", async (req, res) => {
  try {
    // Test database connection
    await sequelize.authenticate();
    
    res.json({
      message: "🌱 Greenhouse Monitoring API",
      status: "✅ Running",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      database: "✅ Connected",
      endpoints: {
        auth: "/api/auth",
        dataSensor: "/api/data-sensor",
        penjadwalan: "/api/penjadwalan", 
        device: "/api/device",
        monitoring: "/api/monitoring",
        prediksi: "/api/prediksi"
      },
      version: "1.0.0"
    });
  } catch (error) {
    res.status(500).json({
      message: "❌ API Error",
      status: "Error",
      database: "❌ Disconnected",
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// API info endpoint
app.get("/api", (req, res) => {
  res.json({
    message: "Greenhouse Monitoring API Endpoints",
    endpoints: [
      { path: "/api/auth", methods: ["POST"], description: "Authentication" },
      { path: "/api/data-sensor", methods: ["GET", "POST"], description: "Sensor data management" },
      { path: "/api/penjadwalan", methods: ["GET", "POST", "PUT", "DELETE"], description: "Scheduling management" },
      { path: "/api/device", methods: ["GET", "POST", "PUT", "DELETE"], description: "Device management" },
      { path: "/api/monitoring", methods: ["GET"], description: "Monitoring and recommendations" },
      { path: "/api/prediksi", methods: ["GET", "POST"], description: "Prediction analysis" }
    ]
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.stack);
  res.status(500).json({
    error: "Internal Server Error",
    message: process.env.NODE_ENV === 'development' ? err.message : "Something went wrong!",
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    error: "Route not found",
    path: req.originalUrl,
    method: req.method,
    message: "The requested endpoint does not exist",
    availableEndpoints: ["/", "/api", "/api/auth", "/api/data-sensor", "/api/penjadwalan", "/api/device", "/api/monitoring", "/api/prediksi"]
  });
});

// Simulasi sensor (background process)
let sensorInterval;

function startSensorSimulation() {
  if (process.env.ENABLE_SENSOR_SIMULATION === 'true') {
    console.log('🚀 Starting sensor simulation...');
    
    sensorInterval = setInterval(async () => {
      try {
        // Simulasi data sensor realistis
        const currentHour = new Date().getHours();
        const isDay = currentHour >= 6 && currentHour <= 18;
        
        const sensorData = {
          suhu: isDay ? 22 + Math.random() * 8 : 18 + Math.random() * 4, // 22-30°C siang, 18-22°C malam
          cahaya: isDay ? 400 + Math.random() * 600 : 0 + Math.random() * 50, // Terang siang, gelap malam
          kelembapan_udara: 60 + Math.random() * 30, // 60-90%
          kelembapan_tanah: 30 + Math.random() * 40, // 30-70%
          waktu: new Date()
        };

        await DataSensor.create(sensorData);
        console.log(`📊 [${sensorData.waktu.toLocaleTimeString()}] Sensor data saved:`, {
          suhu: `${sensorData.suhu.toFixed(1)}°C`,
          cahaya: `${Math.round(sensorData.cahaya)} lux`,
          kelembapan_udara: `${sensorData.kelembapan_udara.toFixed(1)}%`,
          kelembapan_tanah: `${sensorData.kelembapan_tanah.toFixed(1)}%`
        });
      } catch (error) {
        console.error('❌ Sensor simulation error:', error.message);
      }
    }, 30000); // 30 detik
  }
}

function stopSensorSimulation() {
  if (sensorInterval) {
    clearInterval(sensorInterval);
    console.log('🛑 Sensor simulation stopped');
  }
}

// Database connection and server startup
async function startServer() {
  try {
    console.log('🔄 Connecting to database...');
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully');
    
    // Sync database models
    console.log('🔄 Synchronizing database models...');
    await sequelize.sync({ 
      alter: process.env.NODE_ENV === 'development',
      force: false // NEVER use force: true in production
    });
    console.log('✅ Database models synchronized');
    
    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🌱 Greenhouse Monitoring API started successfully`);
      console.log(`📡 API URL: http://localhost:${PORT}`);
      
      // Start sensor simulation if enabled
      startSensorSimulation();
    });
    
  } catch (error) {
    console.error('❌ Unable to start server:', error);
    console.error('💡 Check your database connection and environment variables');
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🔄 SIGTERM received, shutting down gracefully...');
  stopSensorSimulation();
  sequelize.close().then(() => {
    console.log('✅ Database connection closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🔄 SIGINT received, shutting down gracefully...');
  stopSensorSimulation();
  sequelize.close().then(() => {
    console.log('✅ Database connection closed');
    process.exit(0);
  });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Promise Rejection:', err);
  stopSensorSimulation();
  sequelize.close().then(() => {
    process.exit(1);
  });
});

// Start the server
startServer();