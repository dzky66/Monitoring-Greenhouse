// API khusus untuk device - STANDALONE tanpa import apiClient
import axios from "axios"

// Fungsi untuk mendapatkan base URL API
const getApiBaseUrl = () => {
  console.log("🔍 Device API Environment check:")
  console.log("- VITE_API_URL:", import.meta.env.VITE_API_URL)
  console.log("- Current hostname:", window.location.hostname)

  if (import.meta.env.VITE_API_URL) {
    console.log("✅ Device API using VITE_API_URL:", import.meta.env.VITE_API_URL)
    return import.meta.env.VITE_API_URL
  }

  if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
    console.log("🏠 Device API using localhost fallback")
    return "http://localhost:8080"
  }

  const railwayUrl = "https://monitoring-greenhouse-production.up.railway.app"
  console.log("🚂 Device API using Railway URL:", railwayUrl)
  return railwayUrl
}

// Konfigurasi axios instance khusus untuk device
const deviceClient = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
})

// Request interceptor untuk device API
deviceClient.interceptors.request.use(
  (config) => {
    console.log("🚀 Device API Request:")
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
      console.log("🔑 Device API Token added")
    }

    return config
  },
  (error) => {
    console.error("❌ Device API Request Error:", error)
    return Promise.reject(error)
  },
)

// Response interceptor untuk device API
deviceClient.interceptors.response.use(
  (response) => {
    console.log("✅ Device API Response:")
    console.log("- Status:", response.status)
    console.log("- Data:", response.data)
    return response.data
  },
  (error) => {
    console.error("❌ Device API Error:")
    console.error("- Error:", error.message)

    if (error.response) {
      console.error("- Status:", error.response.status)
      console.error("- Data:", error.response.data)

      const status = error.response.status
      const message = error.response.data?.message || error.response.data?.error || "Terjadi kesalahan pada server"

      if (status === 404) {
        throw new Error(`Device endpoint tidak ditemukan: ${error.config.url}`)
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
        throw new Error("Akses ditolak untuk device API.")
      } else if (status >= 500) {
        throw new Error("Terjadi kesalahan pada server device.")
      }

      throw new Error(message)
    } else if (error.request) {
      throw new Error("Tidak dapat terhubung ke server device. Periksa koneksi internet.")
    } else {
      throw new Error("Terjadi kesalahan device API: " + error.message)
    }
  },
)

export const deviceAPI = {
  getAll: async () => {
    try {
      console.log("🔧 Getting all devices...")

      const response = await deviceClient.get("/api/device")
      console.log("✅ Devices retrieved from backend")
      console.log("🔧 Raw device data:", response)

      // Backend mengembalikan array devices langsung
      if (Array.isArray(response)) {
        console.log(`📊 Found ${response.length} devices`)
        return response
      }

      // Jika response bukan array, wrap dalam array
      return response ? [response] : []
    } catch (error) {
      console.error("❌ Failed to get devices:", error)
      throw error
    }
  },

  getById: async (deviceId) => {
    try {
      console.log(`🔍 Getting device by ID: ${deviceId}`)
      const response = await deviceClient.get(`/api/device/${deviceId}`)
      console.log("✅ Device retrieved by ID")
      console.log("🔧 Device data:", response)
      return response
    } catch (error) {
      console.error("❌ Failed to get device by ID:", error)
      throw error
    }
  },

  create: async (deviceData = {}) => {
    try {
      console.log("➕ Creating new device...")

      // Data default untuk device baru
      const defaultData = {
        lampu: false,
        ventilasi: "tutup",
        humidifier: false,
        kipas: false,
        pemanas: false,
        ...deviceData, // Override dengan data yang diberikan
      }

      console.log("📝 Creating device with data:", defaultData)

      const response = await deviceClient.post("/api/device", defaultData)
      console.log("✅ Device created successfully")
      console.log("📊 Created device:", response)

      // Backend mengembalikan { message: "...", data: device }
      return response
    } catch (error) {
      console.error("❌ Failed to create device:", error)
      throw error
    }
  },

  update: async (deviceId, deviceData) => {
    try {
      console.log(`📝 Updating device ID: ${deviceId}`)
      console.log("📝 Update data:", deviceData)

      const response = await deviceClient.put(`/api/device/${deviceId}`, deviceData)
      console.log("✅ Device updated successfully")
      console.log("📊 Updated device:", response)

      // Backend mengembalikan { message: "...", data: device }
      return response
    } catch (error) {
      console.error("❌ Failed to update device:", error)
      throw error
    }
  },

  delete: async (deviceId) => {
    try {
      console.log(`🗑️ Deleting device ID: ${deviceId}`)
      const response = await deviceClient.delete(`/api/device/${deviceId}`)
      console.log("✅ Device deleted successfully")
      console.log("📊 Delete response:", response)
      return response
    } catch (error) {
      console.error("❌ Failed to delete device:", error)
      throw error
    }
  },

  // Fungsi untuk update semua device sekaligus
  updateAll: async (controls) => {
    try {
      console.log("💾 Updating all device controls...")
      console.log("📝 Controls to update:", controls)

      // Ambil device yang ada untuk mendapatkan ID
      const devices = await deviceAPI.getAll()
      if (devices.length === 0) {
        throw new Error("Tidak ada device yang ditemukan. Buat device terlebih dahulu.")
      }

      // Ambil device pertama (biasanya cuma ada satu)
      const deviceId = devices[0].id
      console.log(`🎯 Updating device ID: ${deviceId}`)

      // Update device dengan controls yang baru
      const response = await deviceAPI.update(deviceId, controls)
      console.log("✅ All device controls updated successfully")
      return response
    } catch (error) {
      console.error("❌ Failed to update all device controls:", error)
      throw error
    }
  },

  // Fungsi untuk kontrol individual device (untuk kompatibilitas)
  control: async (deviceType, action) => {
    try {
      console.log(`🎛️ Controlling device type: ${deviceType}, action: ${action}`)

      // Ambil device yang ada
      const devices = await deviceAPI.getAll()
      if (devices.length === 0) {
        throw new Error("Tidak ada device yang ditemukan")
      }

      const deviceId = devices[0].id
      const currentDevice = devices[0]

      // Siapkan data update berdasarkan deviceType dan action
      const updateData = { ...currentDevice }

      if (deviceType === "lampu") {
        updateData.lampu = action === "on"
      } else if (deviceType === "ventilasi") {
        updateData.ventilasi = action === "on" ? "buka" : "tutup"
      } else if (deviceType === "humidifier") {
        updateData.humidifier = action === "on"
      } else if (deviceType === "kipas") {
        updateData.kipas = action === "on"
      } else if (deviceType === "pemanas") {
        updateData.pemanas = action === "on"
      } else {
        throw new Error(`Device type tidak dikenal: ${deviceType}`)
      }

      // Hapus fields yang tidak perlu untuk update
      delete updateData.id
      delete updateData.createdAt
      delete updateData.updatedAt
      delete updateData.logs

      console.log(`📝 Updating device with:`, updateData)

      const response = await deviceAPI.update(deviceId, updateData)
      console.log("✅ Device controlled successfully")
      return response
    } catch (error) {
      console.error("❌ Failed to control device:", error)
      throw error
    }
  },

  // Fungsi untuk toggle device (on/off)
  toggle: async (deviceType) => {
    try {
      console.log(`🔄 Toggling device type: ${deviceType}`)

      // Ambil device yang ada untuk melihat status saat ini
      const devices = await deviceAPI.getAll()
      if (devices.length === 0) {
        throw new Error("Tidak ada device yang ditemukan")
      }

      const currentDevice = devices[0]
      let currentStatus = false

      // Tentukan status saat ini berdasarkan device type
      if (deviceType === "lampu") {
        currentStatus = currentDevice.lampu
      } else if (deviceType === "ventilasi") {
        currentStatus = currentDevice.ventilasi === "buka"
      } else if (deviceType === "humidifier") {
        currentStatus = currentDevice.humidifier
      } else if (deviceType === "kipas") {
        currentStatus = currentDevice.kipas
      } else if (deviceType === "pemanas") {
        currentStatus = currentDevice.pemanas
      }

      // Toggle status
      const newAction = currentStatus ? "off" : "on"
      console.log(`🔄 Current status: ${currentStatus}, new action: ${newAction}`)

      return await deviceAPI.control(deviceType, newAction)
    } catch (error) {
      console.error("❌ Failed to toggle device:", error)
      throw error
    }
  },

  // Fungsi untuk mendapatkan status semua device
  getStatus: async () => {
    try {
      console.log("📊 Getting device status...")

      const devices = await deviceAPI.getAll()
      if (devices.length === 0) {
        console.log("⚠️ No devices found")
        return {
          lampu: false,
          ventilasi: "tutup",
          humidifier: false,
          kipas: false,
          pemanas: false,
        }
      }

      const device = devices[0]
      const status = {
        lampu: device.lampu || false,
        ventilasi: device.ventilasi || "tutup",
        humidifier: device.humidifier || false,
        kipas: device.kipas || false,
        pemanas: device.pemanas || false,
      }

      console.log("✅ Device status retrieved:", status)
      return status
    } catch (error) {
      console.error("❌ Failed to get device status:", error)
      throw error
    }
  },

  // Fungsi untuk reset semua device ke kondisi default
  resetAll: async () => {
    try {
      console.log("🔄 Resetting all devices to default state...")

      const defaultState = {
        lampu: false,
        ventilasi: "tutup",
        humidifier: false,
        kipas: false,
        pemanas: false,
      }

      const response = await deviceAPI.updateAll(defaultState)
      console.log("✅ All devices reset to default state")
      return response
    } catch (error) {
      console.error("❌ Failed to reset devices:", error)
      throw error
    }
  },

  // Fungsi untuk test koneksi device API
  testConnection: async () => {
    try {
      console.log("🔍 Testing device API connection...")

      const response = await deviceClient.get("/api/device")
      console.log("✅ Device API connection successful")
      return { success: true, message: "Device API terhubung", data: response }
    } catch (error) {
      console.error("❌ Device API connection failed:", error)
      return { success: false, message: "Device API tidak terhubung", error: error.message }
    }
  },
}

export default deviceAPI
