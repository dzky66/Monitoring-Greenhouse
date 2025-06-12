// API khusus untuk monitoring - STANDALONE tanpa import apiClient
import axios from "axios"

// Fungsi untuk mendapatkan base URL API
const getApiBaseUrl = () => {
  console.log("🔍 Monitoring API Environment check:")
  console.log("- VITE_API_URL:", import.meta.env.VITE_API_URL)
  console.log("- Current hostname:", window.location.hostname)

  if (import.meta.env.VITE_API_URL) {
    console.log("✅ Monitoring API using VITE_API_URL:", import.meta.env.VITE_API_URL)
    return import.meta.env.VITE_API_URL
  }

  if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
    console.log("🏠 Monitoring API using localhost fallback")
    return "http://localhost:8080"
  }

  const railwayUrl = "https://monitoring-greenhouse-production.up.railway.app"
  console.log("🚂 Monitoring API using Railway URL:", railwayUrl)
  return railwayUrl
}

// Konfigurasi axios instance khusus untuk monitoring
const monitoringClient = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
})

// Request interceptor untuk monitoring API
monitoringClient.interceptors.request.use(
  (config) => {
    console.log("🚀 Monitoring API Request:")
    console.log("- Method:", config.method?.toUpperCase())
    console.log("- URL:", `${config.baseURL}${config.url}`)

    // Log request body untuk debugging
    if (config.data) {
      console.log("- Data:", config.data)
    }

    // Tambahkan token jika ada
    const token = localStorage.getItem("token")
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
      console.log("🔑 Monitoring API Token added")
    }

    return config
  },
  (error) => {
    console.error("❌ Monitoring API Request Error:", error)
    return Promise.reject(error)
  },
)

// Response interceptor untuk monitoring API
monitoringClient.interceptors.response.use(
  (response) => {
    console.log("✅ Monitoring API Response:")
    console.log("- Status:", response.status)
    console.log("- Data:", response.data)
    return response.data
  },
  (error) => {
    console.error("❌ Monitoring API Error:")
    console.error("- Error:", error.message)

    if (error.response) {
      console.error("- Status:", error.response.status)
      console.error("- Data:", error.response.data)

      const status = error.response.status
      const message = error.response.data?.message || error.response.data?.error || "Terjadi kesalahan pada server"

      if (status === 404) {
        throw new Error(`Monitoring endpoint tidak ditemukan: ${error.config.url}`)
      } else if (status === 401) {
        // Hapus token yang tidak valid
        localStorage.removeItem("token")
        localStorage.removeItem("user")

        // Redirect ke login jika bukan di halaman login
        if (window.location.pathname !== "/login") {
          setTimeout(() => {
            window.location.href = "/login"
          }, 1000)
        }

        throw new Error("Sesi Anda telah berakhir. Silakan login kembali.")
      } else if (status === 403) {
        throw new Error("Akses ditolak untuk monitoring API.")
      } else if (status >= 500) {
        throw new Error("Terjadi kesalahan pada server monitoring.")
      }

      throw new Error(message)
    } else if (error.request) {
      throw new Error("Tidak dapat terhubung ke server monitoring. Periksa koneksi internet.")
    } else {
      throw new Error("Terjadi kesalahan monitoring API: " + error.message)
    }
  },
)

// Fungsi untuk menganalisis data sensor dan memberikan rekomendasi
const analyzeData = (sensorData) => {
  console.log("🔍 Analyzing sensor data:", sensorData)

  const suhu = sensorData.suhu
  const kelembapan_udara = sensorData.kelembapan_udara || sensorData.kelembapan // fallback untuk data lama
  const kelembapan_tanah = sensorData.kelembapan_tanah || sensorData.kelembapan // fallback untuk data lama
  const cahaya = sensorData.cahaya

  const status = []
  const rekomendasi = []

  // Analisis Suhu (Range optimal: 20-30°C)
  if (suhu < 15) {
    status.push("Suhu terlalu rendah")
    rekomendasi.push("Aktifkan pemanas atau tutup ventilasi")
  } else if (suhu > 35) {
    status.push("Suhu terlalu tinggi")
    rekomendasi.push("Buka ventilasi atau aktifkan kipas")
  } else if (suhu >= 20 && suhu <= 30) {
    status.push("Suhu optimal")
  } else {
    status.push("Suhu dalam batas normal")
  }

  // Analisis Kelembapan Udara (Range optimal: 50-70%)
  if (kelembapan_udara < 40) {
    status.push("Kelembapan udara terlalu rendah")
    rekomendasi.push("Aktifkan humidifier untuk meningkatkan kelembapan udara")
  } else if (kelembapan_udara > 85) {
    status.push("Kelembapan udara terlalu tinggi")
    rekomendasi.push("Buka ventilasi dan aktifkan kipas untuk mengurangi kelembapan")
  } else if (kelembapan_udara >= 50 && kelembapan_udara <= 70) {
    status.push("Kelembapan udara optimal")
  } else {
    status.push("Kelembapan udara dalam batas normal")
  }

  // Analisis Kelembapan Tanah (Range optimal: 40-60%)
  if (kelembapan_tanah < 30) {
    status.push("Kelembapan tanah terlalu rendah")
    rekomendasi.push("Lakukan penyiraman segera")
    rekomendasi.push("Periksa sistem irigasi")
  } else if (kelembapan_tanah > 75) {
    status.push("Kelembapan tanah terlalu tinggi")
    rekomendasi.push("Kurangi frekuensi penyiraman")
    rekomendasi.push("Periksa sistem drainase")
  } else if (kelembapan_tanah >= 40 && kelembapan_tanah <= 60) {
    status.push("Kelembapan tanah optimal")
  } else {
    status.push("Kelembapan tanah dalam batas normal")
  }

  // Analisis Cahaya (Range optimal: 800-1200 lux)
  const hour = new Date().getHours()
  const isDayTime = hour >= 6 && hour <= 18

  if (isDayTime) {
    // Analisis untuk siang hari
    if (cahaya < 500) {
      status.push("Cahaya kurang untuk siang hari")
      rekomendasi.push("Aktifkan lampu tambahan")
    } else if (cahaya >= 800 && cahaya <= 1200) {
      status.push("Cahaya optimal")
    } else if (cahaya > 1200) {
      status.push("Cahaya terlalu terang")
      rekomendasi.push("Gunakan shade cloth atau kurangi intensitas lampu")
    } else {
      status.push("Cahaya cukup")
    }
  } else {
    // Analisis untuk malam hari
    if (cahaya > 200) {
      status.push("Cahaya terlalu terang untuk malam hari")
      rekomendasi.push("Matikan lampu yang tidak perlu")
    } else {
      status.push("Cahaya malam normal")
    }
  }

  // Jika tidak ada rekomendasi, berarti kondisi baik
  if (rekomendasi.length === 0) {
    rekomendasi.push("Kondisi greenhouse dalam keadaan baik")
  }

  const result = {
    suhu,
    kelembapan_udara,
    kelembapan_tanah,
    cahaya,
    waktu: sensorData.waktu || sensorData.createdAt || new Date().toISOString(),
    status,
    rekomendasi,
  }

  console.log("✅ Analysis completed:", result)
  return result
}

export const monitoringAPI = {
  // Fungsi utama untuk mendapatkan data monitoring
  getMonitoringData: async () => {
    try {
      console.log("📊 Getting monitoring data...")

      const endpoints = ["/api/monitoring", "/api/monitoring/latest", "/api/data-sensor/latest", "/api/sensor/latest"]

      let lastError = null

      for (const endpoint of endpoints) {
        try {
          console.log(`🔄 Trying monitoring endpoint: ${endpoint}`)
          const response = await monitoringClient.get(endpoint)
          console.log(`✅ Monitoring data retrieved from: ${endpoint}`)

          // Jika data dari endpoint monitoring (sudah ada analisis)
          if (response.status && response.rekomendasi) {
            // Pastikan status dan rekomendasi dalam bentuk array
            if (!Array.isArray(response.status)) {
              response.status = response.status.split("; ")
            }
            if (!Array.isArray(response.rekomendasi)) {
              response.rekomendasi = response.rekomendasi.split("; ")
            }

            return {
              success: true,
              data: response,
              source: "monitoring_endpoint",
              endpoint: endpoint,
            }
          } else {
            // Jika data dari data sensor, buat analisis sendiri
            const analysisData = analyzeData(response)
            return {
              success: true,
              data: analysisData,
              source: "sensor_analysis",
              endpoint: endpoint,
            }
          }
        } catch (error) {
          console.log(`❌ Failed with monitoring endpoint: ${endpoint} - ${error.message}`)
          lastError = error
          continue
        }
      }

      throw lastError || new Error("Semua endpoint monitoring gagal")
    } catch (error) {
      console.error("❌ Failed to get monitoring data:", error)
      throw error
    }
  },

  // Fungsi khusus untuk mendapatkan data monitoring dengan fallback fetch API
  getMonitoringDataWithFallback: async () => {
    try {
      console.log("🔍 Fetching monitoring data with fallback...")

      // Dapatkan token dari localStorage
      const token = localStorage.getItem("token")
      const headers = token ? { Authorization: `Bearer ${token}` } : {}

      // Coba endpoint monitoring terlebih dahulu, jika gagal gunakan data sensor
      const baseUrl = getApiBaseUrl()

      const endpoints = [
        `${baseUrl}/api/monitoring`,
        `${baseUrl}/api/data-sensor/latest`,
        "/api/monitoring",
        "/api/data-sensor/latest",
      ]

      let response = null
      let fetchedData = null
      let workingEndpoint = null

      // Coba setiap endpoint sampai ada yang berhasil
      for (const endpoint of endpoints) {
        try {
          console.log(`🔍 Mencoba endpoint monitoring: ${endpoint}`)

          // Menggunakan fetch API dengan timeout
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 5000)

          response = await fetch(endpoint, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              ...headers,
            },
            signal: controller.signal,
          })

          clearTimeout(timeoutId)

          if (response.ok) {
            fetchedData = await response.json()
            workingEndpoint = endpoint
            console.log(`✅ Berhasil mengambil data dari: ${endpoint}`)
            console.log("📊 Data:", fetchedData)
            break
          }
        } catch (err) {
          console.log(`❌ Gagal endpoint: ${endpoint} - ${err.message}`)
          continue
        }
      }

      if (fetchedData && workingEndpoint) {
        // Jika data dari endpoint monitoring (sudah ada analisis)
        if (fetchedData.status && fetchedData.rekomendasi) {
          // Pastikan status dan rekomendasi dalam bentuk array
          if (!Array.isArray(fetchedData.status)) {
            fetchedData.status = fetchedData.status.split("; ")
          }
          if (!Array.isArray(fetchedData.rekomendasi)) {
            fetchedData.rekomendasi = fetchedData.rekomendasi.split("; ")
          }

          return {
            success: true,
            data: fetchedData,
            source: "monitoring_endpoint",
            endpoint: workingEndpoint,
          }
        } else {
          // Jika data dari data sensor, buat analisis sendiri
          const analysisData = analyzeData(fetchedData)
          return {
            success: true,
            data: analysisData,
            source: "sensor_analysis",
            endpoint: workingEndpoint,
          }
        }
      } else {
        throw new Error("Tidak ada endpoint yang tersedia")
      }
    } catch (error) {
      console.error("❌ Error mengambil data monitoring:", error)
      throw error
    }
  },

  // Fungsi untuk mendapatkan riwayat monitoring
  getMonitoringHistory: async (limit = 50) => {
    try {
      console.log(`📈 Getting monitoring history (limit: ${limit})...`)

      const endpoints = [
        `/api/monitoring/history?limit=${limit}`,
        `/api/monitoring?limit=${limit}`,
        `/api/data-sensor/history?limit=${limit}`,
        `/api/data-sensor?limit=${limit}`,
      ]

      for (const endpoint of endpoints) {
        try {
          console.log(`🔄 Trying monitoring history endpoint: ${endpoint}`)
          const response = await monitoringClient.get(endpoint)
          console.log(`✅ Monitoring history retrieved from: ${endpoint}`)

          // Jika data dari endpoint monitoring, return langsung
          if (Array.isArray(response) && response.length > 0 && response[0].status) {
            return response
          }

          // Jika data dari sensor, analisis setiap item
          if (Array.isArray(response)) {
            const analyzedData = response.map((item) => analyzeData(item))
            return analyzedData
          }

          return response
        } catch (error) {
          console.log(`❌ Failed with monitoring history endpoint: ${endpoint} - ${error.message}`)
          continue
        }
      }

      throw new Error("Semua endpoint monitoring history gagal")
    } catch (error) {
      console.error("❌ Failed to get monitoring history:", error)
      throw error
    }
  },

  // Fungsi untuk mendapatkan statistik monitoring
  getMonitoringStats: async (period = "day") => {
    try {
      console.log(`📈 Getting monitoring statistics for period: ${period}...`)

      const endpoints = [
        `/api/monitoring/stats?period=${period}`,
        `/api/monitoring/statistics?period=${period}`,
        `/api/data-sensor/stats?period=${period}`,
      ]

      for (const endpoint of endpoints) {
        try {
          console.log(`🔄 Trying monitoring stats endpoint: ${endpoint}`)
          const response = await monitoringClient.get(endpoint)
          console.log(`✅ Monitoring statistics retrieved from: ${endpoint}`)
          return response
        } catch (error) {
          console.log(`❌ Failed with monitoring stats endpoint: ${endpoint} - ${error.message}`)
          continue
        }
      }

      throw new Error("Semua endpoint monitoring stats gagal")
    } catch (error) {
      console.error("❌ Failed to get monitoring statistics:", error)
      throw error
    }
  },

  // Fungsi untuk analisis manual data sensor
  analyzeSensorData: (sensorData) => {
    return analyzeData(sensorData)
  },

  // Fungsi untuk mendapatkan rekomendasi berdasarkan kondisi tertentu
  getRecommendations: async (conditions) => {
    try {
      console.log("💡 Getting recommendations for conditions:", conditions)

      const endpoints = ["/api/monitoring/recommendations", "/api/recommendations"]

      for (const endpoint of endpoints) {
        try {
          const response = await monitoringClient.post(endpoint, conditions)
          console.log(`✅ Recommendations retrieved from: ${endpoint}`)
          return response
        } catch (error) {
          console.log(`❌ Failed with recommendations endpoint: ${endpoint} - ${error.message}`)
          continue
        }
      }

      // Jika tidak ada endpoint, buat rekomendasi manual
      console.log("📝 Generating manual recommendations...")
      const analysisData = analyzeData(conditions)
      return {
        rekomendasi: analysisData.rekomendasi,
        status: analysisData.status,
      }
    } catch (error) {
      console.error("❌ Failed to get recommendations:", error)
      throw error
    }
  },

  // Fungsi untuk test koneksi monitoring API
  testConnection: async () => {
    try {
      console.log("🔍 Testing monitoring API connection...")

      const response = await monitoringClient.get("/api/monitoring")
      console.log("✅ Monitoring API connection successful")
      return { success: true, message: "Monitoring API terhubung", data: response }
    } catch (error) {
      console.error("❌ Monitoring API connection failed:", error)
      return { success: false, message: "Monitoring API tidak terhubung", error: error.message }
    }
  },

  // Fungsi untuk mendapatkan alert/peringatan
  getAlerts: async () => {
    try {
      console.log("🚨 Getting monitoring alerts...")

      const endpoints = ["/api/monitoring/alerts", "/api/alerts", "/api/monitoring/warnings"]

      for (const endpoint of endpoints) {
        try {
          const response = await monitoringClient.get(endpoint)
          console.log(`✅ Alerts retrieved from: ${endpoint}`)
          return response
        } catch (error) {
          console.log(`❌ Failed with alerts endpoint: ${endpoint} - ${error.message}`)
          continue
        }
      }

      // Jika tidak ada endpoint alerts, ambil dari data monitoring terbaru
      console.log("📊 Generating alerts from latest monitoring data...")
      const monitoringResult = await monitoringAPI.getMonitoringData()

      if (monitoringResult.success) {
        const alerts = []
        const status = monitoringResult.data.status || []

        status.forEach((statusItem) => {
          if (statusItem.toLowerCase().includes("terlalu") || statusItem.toLowerCase().includes("kurang")) {
            alerts.push({
              type: "warning",
              message: statusItem,
              timestamp: new Date().toISOString(),
            })
          } else if (statusItem.toLowerCase().includes("error")) {
            alerts.push({
              type: "error",
              message: statusItem,
              timestamp: new Date().toISOString(),
            })
          }
        })

        return alerts
      }

      return []
    } catch (error) {
      console.error("❌ Failed to get alerts:", error)
      throw error
    }
  },
}

export default monitoringAPI
