import axios from "axios"

// Fungsi untuk mendapatkan base URL API
const getApiBaseUrl = () => {
  try {
    console.log("🔍 Environment check:")

    const viteApiUrl = import.meta.env?.VITE_API_URL
    console.log("- VITE_API_URL:", viteApiUrl)

    if (viteApiUrl) {
      console.log("✅ Using VITE_API_URL:", viteApiUrl)
      return viteApiUrl
    }

    if (typeof window !== "undefined") {
      const hostname = window.location.hostname
      console.log("- Current hostname:", hostname)

      if (hostname === "localhost" || hostname === "127.0.0.1") {
        console.log("🏠 Using localhost fallback")
        return "http://localhost:8080"
      }
    }

    const railwayUrl = "https://monitoring-greenhouse-production.up.railway.app"
    console.log("🚂 Using Railway URL:", railwayUrl)
    return railwayUrl
  } catch (error) {
    console.error("Error getting API base URL:", error)
    return "https://monitoring-greenhouse-production.up.railway.app"
  }
}

// Konfigurasi base axios instance
const apiClient = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
})

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    try {
      console.log("🚀 API Request:")
      console.log("- Method:", config.method?.toUpperCase())
      console.log("- URL:", `${config.baseURL}${config.url}`)

      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
        console.log("🔑 Token added")
      }

      return config
    } catch (error) {
      console.error("Request interceptor error:", error)
      return config
    }
  },
  (error) => {
    console.error("❌ Request Error:", error)
    return Promise.reject(error)
  },
)

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    try {
      console.log("✅ API Response:")
      console.log("- Status:", response.status)
      console.log("- Data:", response.data)
      return response.data
    } catch (error) {
      console.error("Response interceptor error:", error)
      return response.data
    }
  },
  (error) => {
    console.error("❌ API Error:")
    console.error("- Error:", error.message)

    if (error.response) {
      console.error("- Status:", error.response.status)
      console.error("- Data:", error.response.data)

      const status = error.response.status
      const message = error.response.data?.message || error.response.data?.error || "Terjadi kesalahan pada server"

      if (status === 404) {
        throw new Error(`Endpoint tidak ditemukan: ${error.config.url}`)
      } else if (status === 401) {
        const isLoginRequest = error.config.url?.includes("/login") || error.config.url?.includes("/auth/login")

        if (!isLoginRequest && typeof window !== "undefined") {
          clearAuthData()
        }

        throw new Error(
          isLoginRequest ? "Username atau password salah" : "Sesi Anda telah berakhir. Silakan login kembali.",
        )
      } else if (status === 403) {
        throw new Error("Akses ditolak. Periksa konfigurasi CORS.")
      } else if (status >= 500) {
        throw new Error("Terjadi kesalahan pada server.")
      }

      throw new Error(message)
    } else if (error.request) {
      throw new Error("Tidak dapat terhubung ke server. Periksa koneksi internet.")
    } else {
      throw new Error("Terjadi kesalahan: " + error.message)
    }
  },
)

// Helper functions
export const isAuthenticated = () => {
  try {
    if (typeof window === "undefined") return false
    const token = localStorage.getItem("token")
    const user = localStorage.getItem("user")
    return !!(token && user)
  } catch (error) {
    console.error("Error checking authentication:", error)
    return false
  }
}

export const getCurrentUser = () => {
  try {
    if (typeof window === "undefined") return null
    const user = localStorage.getItem("user")
    return user ? JSON.parse(user) : null
  } catch (error) {
    console.error("Error parsing user data:", error)
    return null
  }
}

export const clearAuthData = () => {
  try {
    if (typeof window !== "undefined") {
      localStorage.removeItem("token")
      localStorage.removeItem("user")
    }
  } catch (error) {
    console.error("Error clearing auth data:", error)
  }
}

// Auth API functions
export const authAPI = {
  login: async (credentials) => {
    try {
      console.log("🔐 Attempting login...")
      console.log("- Credentials:", { username: credentials.username, password: "[HIDDEN]" })

      const response = await apiClient.post("/api/auth/login", credentials)
      console.log("✅ Login successful")

      if (response.token && typeof window !== "undefined") {
        localStorage.setItem("token", response.token)
        console.log("🔑 Token saved")
      }
      if (response.user && typeof window !== "undefined") {
        localStorage.setItem("user", JSON.stringify(response.user))
        console.log("👤 User data saved")
      }

      return response
    } catch (error) {
      console.error("❌ Login failed:", error)
      throw error
    }
  },

  register: async (userData) => {
    try {
      console.log("📝 Attempting registration...")
      console.log("- User data:", { ...userData, password: "[HIDDEN]" })

      const response = await apiClient.post("/api/auth/register", userData)
      console.log("✅ Registration successful")
      return response
    } catch (error) {
      console.error("❌ Registration failed:", error)
      throw error
    }
  },

  logout: async () => {
    try {
      await apiClient.post("/api/auth/logout")
    } catch (error) {
      console.error("❌ Logout error:", error)
    } finally {
      clearAuthData()
      console.log("✅ Logout completed")
    }
  },

  getProfile: async () => {
    try {
      console.log("👤 Getting user profile...")
      const response = await apiClient.get("/api/auth/profile")
      console.log("✅ Profile retrieved successfully")
      return response
    } catch (error) {
      console.error("❌ Failed to get profile:", error)
      throw error
    }
  },
}

// Device API functions - TAMBAHAN YANG HILANG
export const deviceAPI = {
  getAll: async () => {
    try {
      console.log("🔧 Getting all devices...")
      const response = await apiClient.get("/api/device")
      console.log("✅ Devices retrieved from backend")
      console.log("🔧 Raw device data:", response)

      if (Array.isArray(response)) {
        console.log(`📊 Found ${response.length} devices`)
        return response
      }

      return response ? [response] : []
    } catch (error) {
      console.error("❌ Failed to get devices:", error)
      throw error
    }
  },

  getById: async (deviceId) => {
    try {
      console.log(`🔍 Getting device by ID: ${deviceId}`)
      const response = await apiClient.get(`/api/device/${deviceId}`)
      console.log("✅ Device retrieved by ID")
      return response
    } catch (error) {
      console.error("❌ Failed to get device by ID:", error)
      throw error
    }
  },

  create: async (deviceData = {}) => {
    try {
      console.log("➕ Creating new device...")

      const defaultData = {
        lampu: false,
        ventilasi: "tutup",
        humidifier: false,
        kipas: false,
        pemanas: false,
        ...deviceData,
      }

      console.log("📝 Creating device with data:", defaultData)

      const response = await apiClient.post("/api/device", defaultData)
      console.log("✅ Device created successfully")
      console.log("📊 Created device:", response)

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

      const response = await apiClient.put(`/api/device/${deviceId}`, deviceData)
      console.log("✅ Device updated successfully")
      console.log("📊 Updated device:", response)

      return response
    } catch (error) {
      console.error("❌ Failed to update device:", error)
      throw error
    }
  },

  delete: async (deviceId) => {
    try {
      console.log(`🗑️ Deleting device ID: ${deviceId}`)
      const response = await apiClient.delete(`/api/device/${deviceId}`)
      console.log("✅ Device deleted successfully")
      return response
    } catch (error) {
      console.error("❌ Failed to delete device:", error)
      throw error
    }
  },

  updateAll: async (controls) => {
    try {
      console.log("💾 Updating all device controls...")
      console.log("📝 Controls to update:", controls)

      const devices = await deviceAPI.getAll()
      if (devices.length === 0) {
        throw new Error("Tidak ada device yang ditemukan. Buat device terlebih dahulu.")
      }

      const deviceId = devices[0].id
      console.log(`🎯 Updating device ID: ${deviceId}`)

      const response = await deviceAPI.update(deviceId, controls)
      console.log("✅ All device controls updated successfully")
      return response
    } catch (error) {
      console.error("❌ Failed to update all device controls:", error)
      throw error
    }
  },

  control: async (deviceType, action) => {
    try {
      console.log(`🎛️ Controlling device type: ${deviceType}, action: ${action}`)

      const devices = await deviceAPI.getAll()
      if (devices.length === 0) {
        throw new Error("Tidak ada device yang ditemukan")
      }

      const deviceId = devices[0].id
      const currentDevice = devices[0]

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
}

// Sensor API functions
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
          const response = await apiClient.get(endpoint)
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
          const response = await apiClient.get(endpoint)
          console.log(`✅ Sensor history retrieved from: ${endpoint}`)
          return response
        } catch (error) {
          continue
        }
      }

      throw new Error("Semua endpoint sensor history gagal")
    } catch (error) {
      console.error("❌ Failed to get sensor history:", error)
      throw error
    }
  },
}

// Test connection function
export const testConnection = async () => {
  try {
    console.log("🔍 Testing backend connection...")
    const response = await apiClient.get("/api/health")
    console.log("✅ Backend connection successful")
    return response
  } catch (error) {
    console.error("❌ Backend connection failed:", error)
    throw error
  }
}

// Default export
export default apiClient
