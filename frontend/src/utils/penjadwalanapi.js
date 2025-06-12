// API khusus untuk penjadwalan - STANDALONE tanpa import apiClient
import axios from "axios"

// Fungsi untuk mendapatkan base URL API
const getApiBaseUrl = () => {
  console.log("🔍 Penjadwalan API Environment check:")
  console.log("- VITE_API_URL:", import.meta.env.VITE_API_URL)
  console.log("- Current hostname:", window.location.hostname)

  if (import.meta.env.VITE_API_URL) {
    console.log("✅ Penjadwalan API using VITE_API_URL:", import.meta.env.VITE_API_URL)
    return import.meta.env.VITE_API_URL
  }

  if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
    console.log("🏠 Penjadwalan API using localhost fallback")
    return "http://localhost:8080"
  }

  const railwayUrl = "https://monitoring-greenhouse-production.up.railway.app"
  console.log("🚂 Penjadwalan API using Railway URL:", railwayUrl)
  return railwayUrl
}

// Konfigurasi axios instance khusus untuk penjadwalan
const penjadwalanClient = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
})

// Request interceptor untuk penjadwalan API
penjadwalanClient.interceptors.request.use(
  (config) => {
    console.log("🚀 Penjadwalan API Request:")
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
      console.log("🔑 Penjadwalan API Token added")
    }

    return config
  },
  (error) => {
    console.error("❌ Penjadwalan API Request Error:", error)
    return Promise.reject(error)
  },
)

// Response interceptor untuk penjadwalan API
penjadwalanClient.interceptors.response.use(
  (response) => {
    console.log("✅ Penjadwalan API Response:")
    console.log("- Status:", response.status)
    console.log("- Data:", response.data)
    return response.data
  },
  (error) => {
    console.error("❌ Penjadwalan API Error:")
    console.error("- Error:", error.message)

    if (error.response) {
      console.error("- Status:", error.response.status)
      console.error("- Data:", error.response.data)

      const status = error.response.status
      const message = error.response.data?.message || error.response.data?.error || "Terjadi kesalahan pada server"

      if (status === 404) {
        throw new Error(`Penjadwalan endpoint tidak ditemukan: ${error.config.url}`)
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
        throw new Error("Akses ditolak untuk penjadwalan API.")
      } else if (status >= 500) {
        throw new Error("Terjadi kesalahan pada server penjadwalan.")
      }

      throw new Error(message)
    } else if (error.request) {
      throw new Error("Tidak dapat terhubung ke server penjadwalan. Periksa koneksi internet.")
    } else {
      throw new Error("Terjadi kesalahan penjadwalan API: " + error.message)
    }
  },
)

// Fungsi helper untuk memproses data jadwal
const processJadwalData = (jadwal) => {
  return {
    ...jadwal,
    jamPenyiraman: Array.isArray(jadwal.jamPenyiraman)
      ? jadwal.jamPenyiraman
      : typeof jadwal.jamPenyiraman === "string"
        ? JSON.parse(jadwal.jamPenyiraman)
        : [jadwal.jamPenyiraman].filter(Boolean),
  }
}

export const penjadwalanAPI = {
  // Fungsi untuk mendapatkan semua jadwal penjadwalan
  getAll: async () => {
    try {
      console.log("📅 Getting all penjadwalan data...")

      const endpoints = ["/api/penjadwalan", "/api/jadwal", "/api/schedule"]

      let lastError = null

      for (const endpoint of endpoints) {
        try {
          console.log(`🔄 Trying penjadwalan endpoint: ${endpoint}`)
          const response = await penjadwalanClient.get(endpoint)
          console.log(`✅ Penjadwalan data retrieved from: ${endpoint}`)

          // Proses data untuk memastikan jamPenyiraman dalam format array
          const processedData = Array.isArray(response)
            ? response.map(processJadwalData)
            : [processJadwalData(response)]

          console.log("📅 Processed penjadwalan data:", processedData)
          return processedData
        } catch (error) {
          console.log(`❌ Failed with penjadwalan endpoint: ${endpoint} - ${error.message}`)
          lastError = error
          continue
        }
      }

      throw lastError || new Error("Semua endpoint penjadwalan gagal")
    } catch (error) {
      console.error("❌ Failed to get penjadwalan data:", error)
      throw error
    }
  },

  // Fungsi untuk mendapatkan jadwal berdasarkan ID
  getById: async (id) => {
    try {
      console.log(`🔍 Getting penjadwalan by ID: ${id}`)

      const endpoints = [`/api/penjadwalan/${id}`, `/api/jadwal/${id}`, `/api/schedule/${id}`]

      for (const endpoint of endpoints) {
        try {
          console.log(`🔄 Trying penjadwalan by ID endpoint: ${endpoint}`)
          const response = await penjadwalanClient.get(endpoint)
          console.log(`✅ Penjadwalan by ID retrieved from: ${endpoint}`)

          const processedData = processJadwalData(response)
          return processedData
        } catch (error) {
          console.log(`❌ Failed with penjadwalan by ID endpoint: ${endpoint} - ${error.message}`)
          continue
        }
      }

      throw new Error("Semua endpoint penjadwalan by ID gagal")
    } catch (error) {
      console.error("❌ Failed to get penjadwalan by ID:", error)
      throw error
    }
  },

  // Fungsi untuk membuat jadwal penjadwalan baru
  create: async (jadwalData) => {
    try {
      console.log("➕ Creating new penjadwalan...")
      console.log("📝 Penjadwalan data:", jadwalData)

      // Validasi data sebelum dikirim
      if (!jadwalData.frekuensiPenyiraman || !jadwalData.jamPenyiraman || !Array.isArray(jadwalData.jamPenyiraman)) {
        throw new Error("frekuensiPenyiraman dan jamPenyiraman (array) wajib diisi")
      }

      const endpoints = ["/api/penjadwalan", "/api/jadwal", "/api/schedule"]

      for (const endpoint of endpoints) {
        try {
          console.log(`🔄 Trying create penjadwalan endpoint: ${endpoint}`)
          const response = await penjadwalanClient.post(endpoint, jadwalData)
          console.log(`✅ Penjadwalan created via: ${endpoint}`)

          return response
        } catch (error) {
          console.log(`❌ Failed with create penjadwalan endpoint: ${endpoint} - ${error.message}`)
          continue
        }
      }

      throw new Error("Semua endpoint create penjadwalan gagal")
    } catch (error) {
      console.error("❌ Failed to create penjadwalan:", error)
      throw error
    }
  },

  // Fungsi untuk update jadwal penjadwalan
  update: async (id, jadwalData) => {
    try {
      console.log(`📝 Updating penjadwalan ID: ${id}`)
      console.log("📝 Update data:", jadwalData)

      // Validasi data sebelum dikirim
      if (!jadwalData.frekuensiPenyiraman || !jadwalData.jamPenyiraman || !Array.isArray(jadwalData.jamPenyiraman)) {
        throw new Error("frekuensiPenyiraman dan jamPenyiraman (array) wajib diisi")
      }

      const endpoints = [`/api/penjadwalan/${id}`, `/api/jadwal/${id}`, `/api/schedule/${id}`]

      for (const endpoint of endpoints) {
        try {
          console.log(`🔄 Trying update penjadwalan endpoint: ${endpoint}`)
          const response = await penjadwalanClient.put(endpoint, jadwalData)
          console.log(`✅ Penjadwalan updated via: ${endpoint}`)

          return response
        } catch (error) {
          console.log(`❌ Failed with update penjadwalan endpoint: ${endpoint} - ${error.message}`)
          continue
        }
      }

      throw new Error("Semua endpoint update penjadwalan gagal")
    } catch (error) {
      console.error("❌ Failed to update penjadwalan:", error)
      throw error
    }
  },

  // Fungsi untuk menghapus jadwal penjadwalan
  delete: async (id) => {
    try {
      console.log(`🗑️ Deleting penjadwalan ID: ${id}`)

      const endpoints = [`/api/penjadwalan/${id}`, `/api/jadwal/${id}`, `/api/schedule/${id}`]

      for (const endpoint of endpoints) {
        try {
          console.log(`🔄 Trying delete penjadwalan endpoint: ${endpoint}`)
          const response = await penjadwalanClient.delete(endpoint)
          console.log(`✅ Penjadwalan deleted via: ${endpoint}`)

          return response
        } catch (error) {
          console.log(`❌ Failed with delete penjadwalan endpoint: ${endpoint} - ${error.message}`)
          continue
        }
      }

      throw new Error("Semua endpoint delete penjadwalan gagal")
    } catch (error) {
      console.error("❌ Failed to delete penjadwalan:", error)
      throw error
    }
  },

  // Fungsi untuk validasi data jadwal
  validateJadwal: (jadwalData) => {
    const errors = {}

    // Validasi frekuensi penyiraman
    if (!jadwalData.frekuensiPenyiraman || jadwalData.frekuensiPenyiraman < 1) {
      errors.frekuensiPenyiraman = "Frekuensi harus minimal 1 kali"
    }

    // Validasi jumlah jam sesuai frekuensi
    if (!jadwalData.jamPenyiraman || !Array.isArray(jadwalData.jamPenyiraman)) {
      errors.jamPenyiraman = "jamPenyiraman harus berupa array"
    } else if (jadwalData.jamPenyiraman.length !== jadwalData.frekuensiPenyiraman) {
      errors.jamPenyiraman = `Jumlah jam penyiraman harus sesuai dengan frekuensi (${jadwalData.frekuensiPenyiraman} jam)`
    } else {
      // Validasi format jam (HH:MM)
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
      const invalidTimes = jadwalData.jamPenyiraman.filter((jam) => !timeRegex.test(jam))
      if (invalidTimes.length > 0) {
        errors.jamPenyiraman = "Format jam tidak valid (gunakan HH:MM)"
      }

      // Validasi jam duplikat
      const uniqueTimes = new Set(jadwalData.jamPenyiraman)
      if (uniqueTimes.size !== jadwalData.jamPenyiraman.length) {
        errors.jamPenyiraman = "Jam penyiraman tidak boleh duplikat"
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors: errors,
    }
  },

  // Fungsi untuk mendapatkan jadwal aktif hari ini
  getTodaySchedule: async () => {
    try {
      console.log("📅 Getting today's schedule...")

      const endpoints = ["/api/penjadwalan/today", "/api/jadwal/today", "/api/schedule/today"]

      for (const endpoint of endpoints) {
        try {
          console.log(`🔄 Trying today schedule endpoint: ${endpoint}`)
          const response = await penjadwalanClient.get(endpoint)
          console.log(`✅ Today schedule retrieved from: ${endpoint}`)

          const processedData = Array.isArray(response)
            ? response.map(processJadwalData)
            : [processJadwalData(response)]

          return processedData
        } catch (error) {
          console.log(`❌ Failed with today schedule endpoint: ${endpoint} - ${error.message}`)
          continue
        }
      }

      // Jika tidak ada endpoint khusus, ambil semua jadwal
      console.log("📅 Fallback: Getting all schedules for today...")
      const allSchedules = await penjadwalanAPI.getAll()
      return allSchedules
    } catch (error) {
      console.error("❌ Failed to get today's schedule:", error)
      throw error
    }
  },

  // Fungsi untuk mendapatkan jadwal berikutnya
  getNextSchedule: async () => {
    try {
      console.log("⏰ Getting next schedule...")

      const endpoints = ["/api/penjadwalan/next", "/api/jadwal/next", "/api/schedule/next"]

      for (const endpoint of endpoints) {
        try {
          console.log(`🔄 Trying next schedule endpoint: ${endpoint}`)
          const response = await penjadwalanClient.get(endpoint)
          console.log(`✅ Next schedule retrieved from: ${endpoint}`)

          return processJadwalData(response)
        } catch (error) {
          console.log(`❌ Failed with next schedule endpoint: ${endpoint} - ${error.message}`)
          continue
        }
      }

      // Jika tidak ada endpoint khusus, hitung dari jadwal yang ada
      console.log("⏰ Fallback: Calculating next schedule from existing data...")
      const allSchedules = await penjadwalanAPI.getAll()

      if (allSchedules.length === 0) {
        return null
      }

      // Ambil jadwal pertama sebagai contoh (bisa diperbaiki dengan logic yang lebih kompleks)
      const now = new Date()
      const currentTime = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`

      for (const jadwal of allSchedules) {
        for (const jam of jadwal.jamPenyiraman) {
          if (jam > currentTime) {
            return {
              ...jadwal,
              nextTime: jam,
            }
          }
        }
      }

      // Jika tidak ada jadwal hari ini, return jadwal pertama besok
      return {
        ...allSchedules[0],
        nextTime: allSchedules[0].jamPenyiraman[0],
        nextDay: true,
      }
    } catch (error) {
      console.error("❌ Failed to get next schedule:", error)
      throw error
    }
  },

  // Fungsi untuk test koneksi penjadwalan API
  testConnection: async () => {
    try {
      console.log("🔍 Testing penjadwalan API connection...")

      const response = await penjadwalanClient.get("/api/penjadwalan")
      console.log("✅ Penjadwalan API connection successful")
      return { success: true, message: "Penjadwalan API terhubung", data: response }
    } catch (error) {
      console.error("❌ Penjadwalan API connection failed:", error)
      return { success: false, message: "Penjadwalan API tidak terhubung", error: error.message }
    }
  },
}

export default penjadwalanAPI
