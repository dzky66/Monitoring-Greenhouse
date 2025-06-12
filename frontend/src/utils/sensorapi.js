// API khusus untuk sensor - STANDALONE tanpa import apiClient
import axios from "axios"

// Fungsi untuk mendapatkan base URL API
const getApiBaseUrl = () => {
  console.log("🔍 Sensor API Environment check:")
  console.log("- VITE_API_URL:", import.meta.env.VITE_API_URL)
  console.log("- Current hostname:", window.location.hostname)

  if (import.meta.env.VITE_API_URL) {
    console.log("✅ Sensor API using VITE_API_URL:", import.meta.env.VITE_API_URL)
    return import.meta.env.VITE_API_URL
  }

  if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
    console.log("🏠 Sensor API using localhost fallback")
    return "http://localhost:8080"
  }

  const railwayUrl = "https://monitoring-greenhouse-production.up.railway.app"
  console.log("🚂 Sensor API using Railway URL:", railwayUrl)
  return railwayUrl
}

// Konfigurasi axios instance khusus untuk sensor
const sensorClient = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
})

// Request interceptor untuk sensor API
sensorClient.interceptors.request.use(
  (config) => {
    console.log("🚀 Sensor API Request:")
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
      console.log("🔑 Sensor API Token added")
    }

    return config
  },
  (error) => {
    console.error("❌ Sensor API Request Error:", error)
    return Promise.reject(error)
  },
)

// Response interceptor untuk sensor API
sensorClient.interceptors.response.use(
  (response) => {
    console.log("✅ Sensor API Response:")
    console.log("- Status:", response.status)
    console.log("- Data:", response.data)
    return response.data
  },
  (error) => {
    console.error("❌ Sensor API Error:")
    console.error("- Error:", error.message)

    if (error.response) {
      console.error("- Status:", error.response.status)
      console.error("- Data:", error.response.data)

      const status = error.response.status
      const message = error.response.data?.message || error.response.data?.error || "Terjadi kesalahan pada server"

      if (status === 404) {
        throw new Error(`Sensor endpoint tidak ditemukan: ${error.config.url}`)
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
        throw new Error("Akses ditolak untuk sensor API.")
      } else if (status >= 500) {
        throw new Error("Terjadi kesalahan pada server sensor.")
      }

      throw new Error(message)
    } else if (error.request) {
      throw new Error("Tidak dapat terhubung ke server sensor. Periksa koneksi internet.")
    } else {
      throw new Error("Terjadi kesalahan sensor API: " + error.message)
    }
  },
)

export const sensorAPI = {
  getLatest: async () => {
    try {
      console.log("📊 Getting latest sensor data...")

      const endpoints = [
        "/api/data-sensor/latest",
        "/api/data-sensor",
        "/api/sensor/latest",
        "/api/sensors/latest",
        "/data-sensor/latest",
        "/sensor/latest",
      ]

      let lastError = null

      for (const endpoint of endpoints) {
        try {
          console.log(`🔄 Trying sensor endpoint: ${endpoint}`)
          const response = await sensorClient.get(endpoint)
          console.log(`✅ Sensor data retrieved from: ${endpoint}`)
          console.log("📊 Sensor data:", response)

          if (Array.isArray(response)) {
            return response[0] || null
          }

          return response
        } catch (error) {
          console.log(`❌ Failed with sensor endpoint: ${endpoint} - ${error.message}`)
          lastError = error
          continue
        }
      }

      throw lastError || new Error("Semua endpoint sensor gagal")
    } catch (error) {
      console.error("❌ Failed to get sensor data:", error)
      throw error
    }
  },

  getHistory: async (limit = 50) => {
    try {
      console.log(`📈 Getting sensor history (limit: ${limit})...`)

      const endpoints = [
        `/api/data-sensor/history?limit=${limit}`,
        `/api/data-sensor?limit=${limit}`,
        `/api/sensor/history?limit=${limit}`,
        `/data-sensor/history?limit=${limit}`,
      ]

      for (const endpoint of endpoints) {
        try {
          console.log(`🔄 Trying sensor history endpoint: ${endpoint}`)
          const response = await sensorClient.get(endpoint)
          console.log(`✅ Sensor history retrieved from: ${endpoint}`)
          console.log(`📊 Retrieved ${Array.isArray(response) ? response.length : 1} sensor records`)
          return response
        } catch (error) {
          console.log(`❌ Failed with sensor history endpoint: ${endpoint} - ${error.message}`)
          continue
        }
      }

      throw new Error("Semua endpoint sensor history gagal")
    } catch (error) {
      console.error("❌ Failed to get sensor history:", error)
      throw error
    }
  },

  getAll: async (limit = 100) => {
    try {
      console.log(`📊 Getting all sensor data (limit: ${limit})...`)

      const endpoints = [
        `/api/data-sensor?limit=${limit}`,
        `/api/data-sensor/all?limit=${limit}`,
        `/api/sensor?limit=${limit}`,
        `/api/sensors?limit=${limit}`,
      ]

      for (const endpoint of endpoints) {
        try {
          console.log(`🔄 Trying sensor endpoint: ${endpoint}`)
          const response = await sensorClient.get(endpoint)
          console.log(`✅ All sensor data retrieved from: ${endpoint}`)
          return response
        } catch (error) {
          console.log(`❌ Failed with sensor endpoint: ${endpoint} - ${error.message}`)
          continue
        }
      }

      throw new Error("Semua endpoint sensor gagal")
    } catch (error) {
      console.error("❌ Failed to get all sensor data:", error)
      throw error
    }
  },

  getByDateRange: async (startDate, endDate) => {
    try {
      console.log(`📅 Getting sensor data from ${startDate} to ${endDate}...`)

      const endpoints = [
        `/api/data-sensor/range?start=${startDate}&end=${endDate}`,
        `/api/data-sensor?start=${startDate}&end=${endDate}`,
        `/api/sensor/range?start=${startDate}&end=${endDate}`,
      ]

      for (const endpoint of endpoints) {
        try {
          console.log(`🔄 Trying sensor date range endpoint: ${endpoint}`)
          const response = await sensorClient.get(endpoint)
          console.log(`✅ Sensor data by date range retrieved from: ${endpoint}`)
          return response
        } catch (error) {
          console.log(`❌ Failed with sensor date range endpoint: ${endpoint} - ${error.message}`)
          continue
        }
      }

      throw new Error("Semua endpoint sensor date range gagal")
    } catch (error) {
      console.error("❌ Failed to get sensor data by date range:", error)
      throw error
    }
  },

  // Fungsi untuk mendapatkan statistik sensor
  getStats: async (period = "day") => {
    try {
      console.log(`📈 Getting sensor statistics for period: ${period}...`)

      const endpoints = [
        `/api/data-sensor/stats?period=${period}`,
        `/api/data-sensor/statistics?period=${period}`,
        `/api/sensor/stats?period=${period}`,
      ]

      for (const endpoint of endpoints) {
        try {
          console.log(`🔄 Trying sensor stats endpoint: ${endpoint}`)
          const response = await sensorClient.get(endpoint)
          console.log(`✅ Sensor statistics retrieved from: ${endpoint}`)
          return response
        } catch (error) {
          console.log(`❌ Failed with sensor stats endpoint: ${endpoint} - ${error.message}`)
          continue
        }
      }

      // Jika tidak ada endpoint stats, hitung manual dari data history
      console.log("📊 Calculating stats manually from history data...")
      const historyData = await sensorAPI.getHistory(100)

      if (!historyData || !Array.isArray(historyData) || historyData.length === 0) {
        throw new Error("Tidak ada data sensor untuk menghitung statistik")
      }

      // Hitung statistik manual
      const stats = {
        count: historyData.length,
        suhu: {
          avg: historyData.reduce((sum, item) => sum + (item.suhu || 0), 0) / historyData.length,
          min: Math.min(...historyData.map((item) => item.suhu || 0)),
          max: Math.max(...historyData.map((item) => item.suhu || 0)),
        },
        kelembapan_udara: {
          avg: historyData.reduce((sum, item) => sum + (item.kelembapan_udara || 0), 0) / historyData.length,
          min: Math.min(...historyData.map((item) => item.kelembapan_udara || 0)),
          max: Math.max(...historyData.map((item) => item.kelembapan_udara || 0)),
        },
        kelembapan_tanah: {
          avg: historyData.reduce((sum, item) => sum + (item.kelembapan_tanah || 0), 0) / historyData.length,
          min: Math.min(...historyData.map((item) => item.kelembapan_tanah || 0)),
          max: Math.max(...historyData.map((item) => item.kelembapan_tanah || 0)),
        },
        cahaya: {
          avg: historyData.reduce((sum, item) => sum + (item.cahaya || 0), 0) / historyData.length,
          min: Math.min(...historyData.map((item) => item.cahaya || 0)),
          max: Math.max(...historyData.map((item) => item.cahaya || 0)),
        },
      }

      console.log("✅ Manual sensor statistics calculated:", stats)
      return stats
    } catch (error) {
      console.error("❌ Failed to get sensor statistics:", error)
      throw error
    }
  },

  // Fungsi untuk mendapatkan rata-rata sensor dalam periode tertentu
  getAverage: async (hours = 24) => {
    try {
      console.log(`📊 Getting sensor average for last ${hours} hours...`)

      const historyData = await sensorAPI.getHistory(Math.min(hours * 6, 500)) // Asumsi 1 data per 10 menit

      if (!historyData || !Array.isArray(historyData) || historyData.length === 0) {
        throw new Error("Tidak ada data sensor untuk menghitung rata-rata")
      }

      // Filter data dalam periode yang diminta
      const now = new Date()
      const cutoffTime = new Date(now.getTime() - hours * 60 * 60 * 1000)

      const filteredData = historyData.filter((item) => {
        const itemTime = new Date(item.waktu || item.createdAt)
        return itemTime >= cutoffTime
      })

      if (filteredData.length === 0) {
        throw new Error(`Tidak ada data sensor dalam ${hours} jam terakhir`)
      }

      const average = {
        count: filteredData.length,
        period_hours: hours,
        suhu: filteredData.reduce((sum, item) => sum + (item.suhu || 0), 0) / filteredData.length,
        kelembapan_udara:
          filteredData.reduce((sum, item) => sum + (item.kelembapan_udara || 0), 0) / filteredData.length,
        kelembapan_tanah:
          filteredData.reduce((sum, item) => sum + (item.kelembapan_tanah || 0), 0) / filteredData.length,
        cahaya: filteredData.reduce((sum, item) => sum + (item.cahaya || 0), 0) / filteredData.length,
      }

      console.log("✅ Sensor average calculated:", average)
      return average
    } catch (error) {
      console.error("❌ Failed to get sensor average:", error)
      throw error
    }
  },

  // Fungsi khusus untuk dashboard dengan multiple endpoint fallback
  getLatestForDashboard: async () => {
    try {
      console.log("📊 Getting latest sensor data for dashboard...")

      // Endpoint yang akan dicoba secara berurutan
      const possibleEndpoints = [
        `${getApiBaseUrl()}/api/data-sensor/latest`,
        `${window.location.origin}/api/data-sensor/latest`,
        "https://monitoring-greenhouse-production.up.railway.app/api/data-sensor/latest",
      ]

      let response = null
      let data = null
      let workingEndpoint = null

      // Coba setiap endpoint sampai ada yang berhasil
      for (const endpoint of possibleEndpoints) {
        try {
          console.log(`🔄 Mencoba endpoint: ${endpoint}`)

          // Konfigurasi axios dengan timeout pendek untuk dashboard
          const axiosConfig = {
            method: "GET",
            url: endpoint,
            headers: {
              "Content-Type": "application/json",
            },
            timeout: 5000, // 5 detik timeout
          }

          response = await axios(axiosConfig)

          if (response.status === 200 && response.data) {
            data = response.data
            workingEndpoint = endpoint
            console.log(`✅ Berhasil dengan endpoint: ${endpoint}`, data)
            break
          } else {
            console.log(`❌ Gagal endpoint: ${endpoint} - Status: ${response.status}`)
          }
        } catch (err) {
          console.log(`❌ Error endpoint: ${endpoint} - ${err.message}`)
          continue
        }
      }

      if (data && workingEndpoint) {
        return {
          success: true,
          data: data,
          endpoint: workingEndpoint,
          timestamp: new Date(data.waktu || data.createdAt || new Date()),
        }
      } else {
        throw new Error("Tidak ada endpoint API yang berfungsi")
      }
    } catch (error) {
      console.error("❌ Error mengambil data sensor untuk dashboard:", error)
      throw error
    }
  },

  // Fungsi untuk test koneksi sensor API
  testConnection: async () => {
    try {
      console.log("🔍 Testing sensor API connection...")

      const response = await sensorClient.get("/api/data-sensor/latest")
      console.log("✅ Sensor API connection successful")
      return { success: true, message: "Sensor API terhubung", data: response }
    } catch (error) {
      console.error("❌ Sensor API connection failed:", error)
      return { success: false, message: "Sensor API tidak terhubung", error: error.message }
    }
  },
}

export default sensorAPI
