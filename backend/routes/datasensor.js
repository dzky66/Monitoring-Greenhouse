const express = require("express")
const router = express.Router()
const DataSensor = require("../models/datasensor")
const Device = require("../models/device")
const { Op } = require("sequelize")

// Konfigurasi simulasi
const simulationConfig = {
  isRunning: false,
  isFastMode: false,
  normalInterval: 30000, // 30 detik untuk data realistis
  fastInterval: 5000, // 5 detik untuk mode cepat
  currentInterval: null,
  startTime: Date.now(),
}

// Data sensor baseline (nilai tengah)
const sensorBaseline = {
  suhu: 25.0,
  cahaya: 400.0,
  kelembapan_udara: 60.0,
  kelembapan_tanah: 45.0,
}

// State untuk simulasi cuaca
const weatherState = {
  isRaining: false,
  rainDuration: 0,
  cloudCover: 0.3, // 0-1 (0 = cerah, 1 = mendung)
  season: "normal", // 'dry', 'normal', 'wet'
  windSpeed: 5, // km/h
  outsideTemp: 28, // suhu luar greenhouse
}

// State device terakhir 
let lastDeviceState = {
  lampu: false,
  ventilasi: "tutup",
  humidifier: false,
  kipas: false,
  pemanas: false,
  lastUpdate: Date.now(),
}

// GET semua data sensor dengan filter
router.get("/", async (req, res) => {
  try {
    const { limit = 100, page = 1, startDate, endDate, sensorType } = req.query

    const offset = (page - 1) * limit
    const whereClause = {}

    // Filter berdasarkan tanggal
    if (startDate || endDate) {
      whereClause.waktu = {}
      if (startDate) whereClause.waktu[Op.gte] = new Date(startDate)
      if (endDate) whereClause.waktu[Op.lte] = new Date(endDate)
    }

    const data = await DataSensor.findAndCountAll({
      where: whereClause,
      order: [["waktu", "DESC"]],
      limit: Number.parseInt(limit),
      offset: Number.parseInt(offset),
    })

    res.json({
      data: data.rows,
      total: data.count,
      page: Number.parseInt(page),
      totalPages: Math.ceil(data.count / limit),
      simulationStatus: {
        isRunning: simulationConfig.isRunning,
        isFastMode: simulationConfig.isFastMode,
        weatherState: weatherState,
        deviceState: lastDeviceState,
      },
    })
  } catch (err) {
    console.error("Error fetching sensor data:", err)
    res.status(500).json({ error: "Gagal mengambil data sensor" })
  }
})

// GET data sensor terbaru
router.get("/latest", async (req, res) => {
  try {
    const latest = await DataSensor.findOne({
      order: [["waktu", "DESC"]],
    })
    if (!latest) return res.status(404).json({ message: "Data sensor tidak ditemukan" })

    res.json({
      ...latest.toJSON(),
      weatherState: weatherState,
      deviceState: lastDeviceState,
      timeInfo: getTimeInfo(),
    })
  } catch (err) {
    res.status(500).json({ error: "Gagal mengambil data sensor terbaru" })
  }
})

// GET statistik harian
router.get("/daily-stats", async (req, res) => {
  try {
    const { date = new Date().toISOString().split("T")[0] } = req.query
    const startOfDay = new Date(date + "T00:00:00.000Z")
    const endOfDay = new Date(date + "T23:59:59.999Z")

    const data = await DataSensor.findAll({
      where: {
        waktu: {
          [Op.between]: [startOfDay, endOfDay],
        },
      },
      order: [["waktu", "ASC"]],
    })

    if (data.length === 0) {
      return res.json({ message: "Tidak ada data untuk tanggal tersebut" })
    }

    const stats = calculateDailyStats(data)
    res.json(stats)
  } catch (err) {
    res.status(500).json({ error: "Gagal mengambil statistik harian" })
  }
})

// GET status simulasi dan cuaca
router.get("/simulation/status", (req, res) => {
  const timeInfo = getTimeInfo()
  res.json({
    simulation: simulationConfig,
    weather: weatherState,
    device: lastDeviceState,
    time: timeInfo,
    baseline: sensorBaseline,
    expectedValues: calculateExpectedValues(timeInfo),
  })
})

// POST kontrol simulasi
router.post("/simulation/control", (req, res) => {
  const { action, fastMode, weather } = req.body

  try {
    switch (action) {
      case "start":
        startSimulation()
        res.json({ message: "Simulasi dimulai", status: simulationConfig })
        break

      case "stop":
        stopSimulation()
        res.json({ message: "Simulasi dihentikan", status: simulationConfig })
        break

      case "toggle_speed":
        toggleFastMode()
        res.json({
          message: `Mode ${simulationConfig.isFastMode ? "cepat" : "normal"} diaktifkan`,
          status: simulationConfig,
        })
        break

      case "set_fast_mode":
        if (typeof fastMode === "boolean") {
          setFastMode(fastMode)
          res.json({
            message: `Mode ${fastMode ? "cepat" : "normal"} diatur`,
            status: simulationConfig,
          })
        } else {
          res.status(400).json({ error: "Parameter fastMode harus boolean" })
        }
        break

      case "set_weather":
        if (weather) {
          setWeatherCondition(weather)
          res.json({
            message: "Kondisi cuaca diatur",
            weather: weatherState,
          })
        } else {
          res.status(400).json({ error: "Parameter weather diperlukan" })
        }
        break

      default:
        res.status(400).json({
          error: "Action tidak valid. Gunakan: start, stop, toggle_speed, set_fast_mode, set_weather",
        })
    }
  } catch (err) {
    res.status(500).json({ error: "Gagal mengontrol simulasi" })
  }
})

// POST data sensor manual
router.post("/", async (req, res) => {
  const { suhu, cahaya, kelembapan_udara, kelembapan_tanah } = req.body

  if (suhu == null || cahaya == null || kelembapan_udara == null || kelembapan_tanah == null) {
    return res.status(400).json({
      error: "Data suhu, cahaya, kelembapan_udara, dan kelembapan_tanah wajib diisi",
    })
  }

  try {
    const newData = await DataSensor.create({
      suhu,
      cahaya,
      kelembapan_udara,
      kelembapan_tanah,
    })
    res.status(201).json(newData)
  } catch (err) {
    res.status(500).json({ error: "Gagal menyimpan data sensor" })
  }
})

// Fungsi utilitas waktu
function getTimeInfo() {
  const now = new Date()
  const hour = now.getHours()
  const minute = now.getMinutes()
  const timeDecimal = hour + minute / 60

  return {
    hour,
    minute,
    timeDecimal,
    isDayTime: timeDecimal >= 6 && timeDecimal <= 18,
    isNight: timeDecimal < 6 || timeDecimal > 20,
    isTwilight: (timeDecimal >= 5 && timeDecimal < 7) || (timeDecimal >= 18 && timeDecimal <= 20),
    dayProgress: Math.max(0, Math.min(1, (timeDecimal - 6) / 12)), // 0-1 dari sunrise ke sunset
    isEarlyMorning: timeDecimal >= 5 && timeDecimal < 8,
    isMidDay: timeDecimal >= 11 && timeDecimal <= 15,
    isEvening: timeDecimal >= 17 && timeDecimal <= 19,
  }
}

// Ambil status device terbaru dari database
async function updateDeviceState() {
  try {
    const latestDevice = await Device.findOne({
      order: [["updatedAt", "DESC"]],
    })

    if (latestDevice) {
      const deviceData = latestDevice.toJSON()
      lastDeviceState = {
        ...deviceData,
        lastUpdate: Date.now(),
      }
    }
  } catch (err) {
    console.error("Error updating device state:", err)
  }
}

// Simulasi realistis berdasarkan waktu, cuaca, dan kontrol device
async function simulateRealisticSensorData() {
  // Update device state dari database
  await updateDeviceState()

  const timeInfo = getTimeInfo()
  const { hour, timeDecimal, isDayTime, dayProgress, isEarlyMorning, isMidDay } = timeInfo

  // Update kondisi cuaca secara random
  updateWeatherConditions()

  // === SIMULASI SUHU ===
  let targetSuhu = weatherState.outsideTemp

  // Pola harian suhu luar
  if (isDayTime) {
    const tempBoost = Math.sin(((timeDecimal - 6) * Math.PI) / 12) * 10
    targetSuhu += tempBoost
  } else {
    targetSuhu -= 8 // Malam lebih dingin
  }

  // Pengaruh cuaca
  if (weatherState.isRaining) targetSuhu -= 4
  if (weatherState.cloudCover > 0.7) targetSuhu -= 3

  // === PENGARUH DEVICE TERHADAP SUHU ===
  // Pemanas: +3-8°C tergantung suhu luar
  if (lastDeviceState.pemanas) {
    const heatingEffect = targetSuhu < 20 ? 8 : targetSuhu < 25 ? 5 : 3
    targetSuhu += heatingEffect
  }

  // Ventilasi buka: suhu mendekati suhu luar
  if (lastDeviceState.ventilasi === "buka") {
    const outsideInfluence = 0.3 // 30% pengaruh suhu luar
    targetSuhu = targetSuhu * (1 - outsideInfluence) + weatherState.outsideTemp * outsideInfluence
  }

  // Kipas: menurunkan suhu 1-2°C karena sirkulasi
  if (lastDeviceState.kipas) {
    targetSuhu -= 1.5
  }

  // === SIMULASI CAHAYA ===
  let targetCahaya = 0

  // Cahaya alami
  if (isDayTime) {
    let naturalLight = 800 + Math.sin(dayProgress * Math.PI) * 400
    naturalLight *= 1 - weatherState.cloudCover * 0.8
    targetCahaya = naturalLight
  } else if (timeInfo.isTwilight) {
    targetCahaya = 30 + Math.random() * 70
  } else {
    targetCahaya = 2 + Math.random() * 15 // Malam
  }

  // === PENGARUH DEVICE TERHADAP CAHAYA ===
  // Lampu LED: +200-500 lux
  if (lastDeviceState.lampu) {
    const lampEffect = isDayTime ? 200 : 500 // Lebih terasa di malam hari
    targetCahaya += lampEffect
  }

  // === SIMULASI KELEMBAPAN UDARA ===
  let targetKelembabanUdara = 90 - (targetSuhu - 15) * 1.8

  // Pengaruh cuaca
  if (weatherState.isRaining) {
    targetKelembabanUdara = Math.min(95, targetKelembabanUdara + 25)
  }

  // === PENGARUH DEVICE TERHADAP KELEMBAPAN UDARA ===
  // Humidifier: +15-25% kelembapan
  if (lastDeviceState.humidifier) {
    const humidifierEffect = targetKelembabanUdara < 50 ? 25 : 15
    targetKelembabanUdara += humidifierEffect
  }

  // Ventilasi buka: kelembapan mendekati luar
  if (lastDeviceState.ventilasi === "buka") {
    const outsideHumidity = weatherState.isRaining ? 85 : 65
    targetKelembabanUdara = targetKelembabanUdara * 0.7 + outsideHumidity * 0.3
  }

  // Pemanas: menurunkan kelembapan
  if (lastDeviceState.pemanas) {
    targetKelembabanUdara -= 10
  }

  // Kipas: sedikit menurunkan kelembapan karena sirkulasi
  if (lastDeviceState.kipas) {
    targetKelembabanUdara -= 3
  }

  targetKelembabanUdara = Math.max(25, Math.min(95, targetKelembabanUdara))

  // === SIMULASI KELEMBAPAN TANAH ===
  let targetKelembabanTanah = sensorBaseline.kelembapan_tanah

  // Perubahan alami
  if (weatherState.isRaining) {
    targetKelembabanTanah += 0.8 // Naik saat hujan
  } else {
    // Evaporasi berdasarkan suhu dan kelembapan udara
    const evaporationRate = (targetSuhu - 20) * 0.02 + (100 - targetKelembabanUdara) * 0.01
    targetKelembabanTanah -= Math.max(0.1, evaporationRate)
  }

  // === PENGARUH DEVICE TERHADAP KELEMBAPAN TANAH ===
  // Humidifier: sedikit meningkatkan kelembapan tanah
  if (lastDeviceState.humidifier) {
    targetKelembabanTanah += 0.3
  }

  // Pemanas: mempercepat penguapan dari tanah
  if (lastDeviceState.pemanas) {
    targetKelembabanTanah -= 0.5
  }

  // Ventilasi: mempercepat pengeringan tanah
  if (lastDeviceState.ventilasi === "buka") {
    targetKelembabanTanah -= 0.2
  }

  targetKelembabanTanah = Math.max(15, Math.min(85, targetKelembabanTanah))

  // === TAMBAHKAN NOISE REALISTIS ===
  const noise = simulationConfig.isFastMode ? 1.2 : 0.4

  const result = {
    suhu: addNoise(targetSuhu, noise * 0.8),
    cahaya: addNoise(targetCahaya, noise * 25),
    kelembapan_udara: addNoise(targetKelembabanUdara, noise * 1.2),
    kelembapan_tanah: addNoise(targetKelembabanTanah, noise * 0.6),
  }

  // Update baseline untuk kontinuitas
  sensorBaseline.kelembapan_tanah = result.kelembapan_tanah

  return {
    suhu: Number.parseFloat(result.suhu.toFixed(1)),
    cahaya: Number.parseFloat(Math.max(0, result.cahaya).toFixed(0)),
    kelembapan_udara: Number.parseFloat(result.kelembapan_udara.toFixed(1)),
    kelembapan_tanah: Number.parseFloat(result.kelembapan_tanah.toFixed(1)),
  }
}

// Fungsi untuk menambahkan noise realistis
function addNoise(value, noiseLevel) {
  const noise = (Math.random() - 0.5) * noiseLevel * 2
  return value + noise
}

// Update kondisi cuaca secara dinamis
function updateWeatherConditions() {
  const timeInfo = getTimeInfo()

  // Simulasi hujan (probabilitas berbeda berdasarkan waktu)
  const rainProbability = timeInfo.isEarlyMorning ? 0.08 : timeInfo.isEvening ? 0.06 : 0.03

  if (!weatherState.isRaining && Math.random() < rainProbability) {
    weatherState.isRaining = true
    weatherState.rainDuration = 0
    console.log("🌧️ Hujan dimulai")
  } else if (weatherState.isRaining) {
    weatherState.rainDuration++
    const stopProbability = weatherState.rainDuration > 30 ? 0.4 : 0.15
    if (Math.random() < stopProbability) {
      weatherState.isRaining = false
      weatherState.rainDuration = 0
      console.log("☀️ Hujan berhenti")
    }
  }

  // Update cloud cover
  if (weatherState.isRaining) {
    weatherState.cloudCover = Math.min(1, weatherState.cloudCover + 0.05)
  } else {
    weatherState.cloudCover += (Math.random() - 0.5) * 0.08
    weatherState.cloudCover = Math.max(0, Math.min(1, weatherState.cloudCover))
  }

  // Update suhu luar berdasarkan waktu
  const baseTemp = 28
  if (timeInfo.isDayTime) {
    weatherState.outsideTemp = baseTemp + Math.sin(timeInfo.dayProgress * Math.PI) * 8
  } else {
    weatherState.outsideTemp = baseTemp - 6
  }

  if (weatherState.isRaining) {
    weatherState.outsideTemp -= 3
  }
}

// Set kondisi cuaca manual
function setWeatherCondition(weather) {
  const { isRaining, cloudCover, season, outsideTemp } = weather

  if (typeof isRaining === "boolean") {
    weatherState.isRaining = isRaining
    weatherState.rainDuration = isRaining ? 1 : 0
  }

  if (typeof cloudCover === "number" && cloudCover >= 0 && cloudCover <= 1) {
    weatherState.cloudCover = cloudCover
  }

  if (typeof outsideTemp === "number" && outsideTemp >= 10 && outsideTemp <= 45) {
    weatherState.outsideTemp = outsideTemp
  }

  if (["dry", "normal", "wet"].includes(season)) {
    weatherState.season = season
    // Adjust baseline berdasarkan musim
    switch (season) {
      case "dry":
        sensorBaseline.kelembapan_udara = 45
        sensorBaseline.kelembapan_tanah = 25
        weatherState.outsideTemp += 3
        break
      case "wet":
        sensorBaseline.kelembapan_udara = 75
        sensorBaseline.kelembapan_tanah = 65
        weatherState.outsideTemp -= 2
        break
      default:
        sensorBaseline.kelembapan_udara = 60
        sensorBaseline.kelembapan_tanah = 45
    }
  }
}

// Hitung nilai yang diharapkan
function calculateExpectedValues(timeInfo) {
  const { isDayTime, dayProgress } = timeInfo

  let expectedSuhu = weatherState.outsideTemp
  if (isDayTime) {
    expectedSuhu += Math.sin(dayProgress * Math.PI) * 8
  } else {
    expectedSuhu -= 5
  }

  // Pengaruh device
  if (lastDeviceState.pemanas) expectedSuhu += 5
  if (lastDeviceState.kipas) expectedSuhu -= 1.5

  let expectedCahaya = 0
  if (isDayTime) {
    expectedCahaya = 800 + Math.sin(dayProgress * Math.PI) * 400
    expectedCahaya *= 1 - weatherState.cloudCover * 0.7
  }
  if (lastDeviceState.lampu) expectedCahaya += 300

  let expectedHumidity = 90 - (expectedSuhu - 15) * 2
  if (lastDeviceState.humidifier) expectedHumidity += 20
  if (lastDeviceState.pemanas) expectedHumidity -= 10

  return {
    suhu: expectedSuhu.toFixed(1),
    cahaya: Math.max(0, expectedCahaya).toFixed(0),
    kelembapan_udara: Math.max(25, Math.min(95, expectedHumidity)).toFixed(1),
    kelembapan_tanah: sensorBaseline.kelembapan_tanah.toFixed(1),
  }
}

// Hitung statistik harian
function calculateDailyStats(data) {
  const stats = {
    suhu: { min: Number.POSITIVE_INFINITY, max: Number.NEGATIVE_INFINITY, avg: 0, values: [] },
    cahaya: { min: Number.POSITIVE_INFINITY, max: Number.NEGATIVE_INFINITY, avg: 0, values: [] },
    kelembapan_udara: { min: Number.POSITIVE_INFINITY, max: Number.NEGATIVE_INFINITY, avg: 0, values: [] },
    kelembapan_tanah: { min: Number.POSITIVE_INFINITY, max: Number.NEGATIVE_INFINITY, avg: 0, values: [] },
  }

  data.forEach((record) => {
    ;["suhu", "cahaya", "kelembapan_udara", "kelembapan_tanah"].forEach((field) => {
      const value = record[field]
      stats[field].min = Math.min(stats[field].min, value)
      stats[field].max = Math.max(stats[field].max, value)
      stats[field].values.push(value)
    })
  })

  // Hitung rata-rata
  Object.keys(stats).forEach((field) => {
    const values = stats[field].values
    stats[field].avg = values.reduce((sum, val) => sum + val, 0) / values.length
    stats[field].count = values.length

    // Format angka
    stats[field].min = Number.parseFloat(stats[field].min.toFixed(1))
    stats[field].max = Number.parseFloat(stats[field].max.toFixed(1))
    stats[field].avg = Number.parseFloat(stats[field].avg.toFixed(1))
  })

  return {
    date: data[0].waktu.toISOString().split("T")[0],
    totalRecords: data.length,
    stats: stats,
  }
}

// Simpan data sensor ke database
async function saveSensorData() {
  const data = await simulateRealisticSensorData()
  try {
    await DataSensor.create({
      suhu: data.suhu,
      cahaya: data.cahaya,
      kelembapan_udara: data.kelembapan_udara,
      kelembapan_tanah: data.kelembapan_tanah,
    })

    const timeInfo = getTimeInfo()
    const weatherIcon = weatherState.isRaining ? "🌧️" : weatherState.cloudCover > 0.7 ? "☁️" : "☀️"

    const deviceStatus = [
      lastDeviceState.lampu ? "💡" : "",
      lastDeviceState.ventilasi === "buka" ? "🌬️" : "",
      lastDeviceState.humidifier ? "💧" : "",
      lastDeviceState.kipas ? "🌀" : "",
      lastDeviceState.pemanas ? "🔥" : "",
    ]
      .filter(Boolean)
      .join("")

    console.log(
      `[${simulationConfig.isFastMode ? "FAST" : "NORMAL"}] ${weatherIcon} ${timeInfo.hour}:${timeInfo.minute.toString().padStart(2, "0")} ${deviceStatus} - Sensor:`,
      data,
    )
  } catch (err) {
    console.error("Gagal menambahkan data sensor:", err)
  }
}

// Fungsi kontrol simulasi
function startSimulation() {
  if (simulationConfig.isRunning) {
    stopSimulation()
  }

  const interval = simulationConfig.isFastMode ? simulationConfig.fastInterval : simulationConfig.normalInterval

  simulationConfig.currentInterval = setInterval(saveSensorData, interval)
  simulationConfig.isRunning = true
  simulationConfig.startTime = Date.now()

  console.log(
    `🚀 Simulasi sensor realistis dimulai dengan interval ${interval}ms (${simulationConfig.isFastMode ? "Fast" : "Normal"} mode)`,
  )
}

function stopSimulation() {
  if (simulationConfig.currentInterval) {
    clearInterval(simulationConfig.currentInterval)
    simulationConfig.currentInterval = null
  }
  simulationConfig.isRunning = false
  console.log("⏹️ Simulasi dihentikan")
}

function toggleFastMode() {
  simulationConfig.isFastMode = !simulationConfig.isFastMode

  if (simulationConfig.isRunning) {
    startSimulation() // Restart dengan interval baru
  }
}

function setFastMode(fastMode) {
  simulationConfig.isFastMode = fastMode

  if (simulationConfig.isRunning) {
    startSimulation() // Restart dengan interval baru
  }
}

// Auto-start simulasi saat server dimulai
setTimeout(() => {
  startSimulation()
  console.log("🌱 Simulasi data sensor realistis dengan pengaruh device dimulai otomatis")
}, 3000)

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("🛑 Menghentikan simulasi...")
  stopSimulation()
  process.exit(0)
})

process.on("SIGTERM", () => {
  console.log("🛑 Menghentikan simulasi...")
  stopSimulation()
  process.exit(0)
})

module.exports = router