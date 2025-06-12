import axios from "axios"

// Fungsi untuk mendapatkan base URL API
const getApiBaseUrl = () => {
  console.log("🔍 Environment check:")
  console.log("- VITE_API_URL:", import.meta.env.VITE_API_URL)
  console.log("- Current hostname:", window.location.hostname)

  if (import.meta.env.VITE_API_URL) {
    console.log("✅ Using VITE_API_URL:", import.meta.env.VITE_API_URL)
    return import.meta.env.VITE_API_URL
  }

  if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
    console.log("🏠 Using localhost fallback")
    return "http://localhost:8080" // Port yang benar sesuai backend
  }

  const railwayUrl = "https://monitoring-greenhouse-production.up.railway.app"
  console.log("🚂 Using Railway URL:", railwayUrl)
  return railwayUrl
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
    console.log("🚀 API Request:")
    console.log("- Method:", config.method?.toUpperCase())
    console.log("- URL:", `${config.baseURL}${config.url}`)

    // Log request body untuk debugging (kecuali password)
    if (config.data) {
      const logData = { ...config.data }
      if (logData.password) logData.password = "[HIDDEN]"
      console.log("- Data:", logData)
    }

    const token = localStorage.getItem("token")
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
      console.log("🔑 Token added")
    }

    return config
  },
  (error) => {
    console.error("❌ Request Error:", error)
    return Promise.reject(error)
  },
)

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    console.log("✅ API Response:")
    console.log("- Status:", response.status)
    console.log("- Data:", response.data)
    return response.data
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

        if (!isLoginRequest) {
          clearAuthData()
        }

        if (!isLoginRequest && window.location.pathname !== "/login") {
          setTimeout(() => {
            window.location.href = "/login"
          }, 1000)
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
  const token = localStorage.getItem("token")
  const user = localStorage.getItem("user")
  return !!(token && user)
}

export const getCurrentUser = () => {
  try {
    const user = localStorage.getItem("user")
    return user ? JSON.parse(user) : null
  } catch (error) {
    console.error("Error parsing user data:", error)
    return null
  }
}

export const clearAuthData = () => {
  localStorage.removeItem("token")
  localStorage.removeItem("user")
}

// Auth API functions dengan fallback endpoints
export const authAPI = {
  login: async (credentials) => {
    try {
      console.log("🔐 Attempting login...")
      console.log("- Credentials:", { username: credentials.username, password: "[HIDDEN]" })

      // Pastikan format data sesuai dengan yang diharapkan backend
      // Backend mengharapkan { username, password } langsung
      const loginData = {
        username: credentials.username,
        password: credentials.password,
      }

      console.log("- Request format:", JSON.stringify({ username: loginData.username, password: "[HIDDEN]" }))

      // Coba login dengan endpoint utama
      try {
        const response = await apiClient.post("/api/auth/login", loginData)
        console.log("✅ Login successful with /api/auth/login")

        if (response.token) {
          localStorage.setItem("token", response.token)
          console.log("🔑 Token saved")
        }
        if (response.user) {
          localStorage.setItem("user", JSON.stringify(response.user))
          console.log("👤 User data saved")
        }

        return response
      } catch (error) {
        console.log("❌ Login failed with /api/auth/login:", error.message)
        throw error
      }
    } catch (error) {
      console.error("❌ Login failed:", error)
      throw error
    }
  },

  register: async (userData) => {
    try {
      console.log("📝 Attempting registration...")
      console.log("- User data:", { ...userData, password: "[HIDDEN]" })

      // Pastikan format data sesuai dengan yang diharapkan backend
      const registerData = {
        username: userData.username,
        password: userData.password,
        name: userData.name,
        email: userData.email,
      }

      const response = await apiClient.post("/api/auth/register", registerData)
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
      console.log("👤 Profile data:", response)
      return response
    } catch (error) {
      console.error("❌ Failed to get profile:", error)
      throw error
    }
  },

  updateProfile: async (userData) => {
    try {
      console.log("📝 Updating user profile...")
      console.log("- User data:", userData)

      const response = await apiClient.put("/api/auth/profile", userData)
      console.log("✅ Profile updated successfully")
      console.log("👤 Updated profile:", response)
      return response
    } catch (error) {
      console.error("❌ Failed to update profile:", error)
      throw error
    }
  },

  changePassword: async (passwords) => {
    try {
      console.log("🔑 Changing password...")
      console.log("- Passwords:", { ...passwords, newPassword: "[HIDDEN]", oldPassword: "[HIDDEN]" })

      const response = await apiClient.put("/api/auth/change-password", passwords)
      console.log("✅ Password changed successfully")
      console.log("🔑 Password change response:", response)
      return response
    } catch (error) {
      console.error("❌ Failed to change password:", error)
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

// Device API functions - DISESUAIKAN DENGAN BACKEND ROUTES YANG SEBENARNYA
export const deviceAPI = {
  getAll: async () => {
    try {
      console.log("🔧 Getting all devices...")

      const response = await apiClient.get("/api/device")
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

      const response = await apiClient.post("/api/device", defaultData)
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

      const response = await apiClient.put(`/api/device/${deviceId}`, deviceData)
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
      const response = await apiClient.delete(`/api/device/${deviceId}`)
      console.log("✅ Device deleted successfully")
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
}

// Test connection function
export const testConnection = async () => {
  try {
    console.log("🔍 Testing backend connection...")

    const response = await apiClient.get("/")
    console.log("✅ Backend connection successful")
    return response
  } catch (error) {
    console.error("❌ Backend connection failed:", error)

    const alternatives = ["/api", "/api/health", "/health"]

    for (const endpoint of alternatives) {
      try {
        const response = await apiClient.get(endpoint)
        console.log(`✅ Backend connected via: ${endpoint}`)
        return response
      } catch (altError) {
        continue
      }
    }

    throw error
  }
}

export default apiClient
