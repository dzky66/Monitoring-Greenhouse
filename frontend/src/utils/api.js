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
    return "http://localhost:5000"
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
        // PERBAIKAN: Jangan auto-clear auth data untuk login request
        const isLoginRequest = error.config.url?.includes("/login") || error.config.url?.includes("/auth/login")

        if (!isLoginRequest) {
          clearAuthData()
        }

        // Jangan auto-redirect jika sedang di halaman login
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

      // Coba endpoint utama dulu
      let response
      try {
        response = await apiClient.post("/api/auth/login", credentials)
        console.log("✅ Login successful with /api/auth/login")
      } catch (mainError) {
        console.log("❌ Main endpoint failed:", mainError.message)

        // Coba endpoint alternatif berdasarkan backend routes
        const alternatives = [
          "/api/user/login", // Berdasarkan app.use("/api/auth", authRoutes) di backend
          "/auth/login",
          "/login",
          "/api/login",
        ]

        let lastError = mainError
        for (const endpoint of alternatives) {
          try {
            console.log(`🔄 Trying alternative: ${endpoint}`)
            response = await apiClient.post(endpoint, credentials)
            console.log(`✅ Login successful with: ${endpoint}`)
            break
          } catch (altError) {
            console.log(`❌ Failed: ${endpoint} - ${altError.message}`)
            lastError = altError
          }
        }

        if (!response) {
          throw lastError
        }
      }

      console.log("✅ Login response:", response)

      // Simpan data jika login berhasil
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
      console.error("❌ Login failed:", error)
      throw error
    }
  },

  register: async (userData) => {
    try {
      console.log("📝 Attempting registration...")
      console.log("- User data:", { ...userData, password: "[HIDDEN]" })

      // Coba endpoint utama dulu
      let response
      try {
        response = await apiClient.post("/api/auth/register", userData)
        console.log("✅ Registration successful with /api/auth/register")
      } catch (mainError) {
        console.log("❌ Main register endpoint failed:", mainError.message)

        // Coba endpoint alternatif
        const alternatives = ["/api/user/register", "/auth/register", "/register", "/api/register"]

        let lastError = mainError
        for (const endpoint of alternatives) {
          try {
            console.log(`🔄 Trying alternative: ${endpoint}`)
            response = await apiClient.post(endpoint, userData)
            console.log(`✅ Registration successful with: ${endpoint}`)
            break
          } catch (altError) {
            console.log(`❌ Failed: ${endpoint} - ${altError.message}`)
            lastError = altError
          }
        }

        if (!response) {
          throw lastError
        }
      }

      console.log("✅ Registration response:", response)
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
}

// Sensor API functions dengan multiple endpoint fallbacks
export const sensorAPI = {
  getLatest: async () => {
    try {
      console.log("📊 Getting latest sensor data...")

      // Coba berbagai endpoint yang mungkin ada
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

          // Jika response adalah array, ambil yang terbaru
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

// Device API functions dengan multiple endpoint fallbacks
export const deviceAPI = {
  getAll: async () => {
    try {
      console.log("🔧 Getting all devices...")

      const endpoints = ["/api/device", "/api/devices", "/device", "/devices", "/api/perangkat"]

      let lastError = null

      for (const endpoint of endpoints) {
        try {
          console.log(`🔄 Trying device endpoint: ${endpoint}`)
          const response = await apiClient.get(endpoint)
          console.log(`✅ Devices retrieved from: ${endpoint}`)
          console.log("🔧 Device data:", response)

          return Array.isArray(response) ? response : []
        } catch (error) {
          console.log(`❌ Failed with device endpoint: ${endpoint} - ${error.message}`)
          lastError = error
          continue
        }
      }

      // Jika semua endpoint gagal, return empty array (bukan throw error)
      console.log("⚠️ No device endpoints available, returning empty array")
      return []
    } catch (error) {
      console.error("❌ Failed to get devices:", error)
      return [] // Return empty array instead of throwing
    }
  },

  control: async (deviceId, action) => {
    try {
      console.log(`🎛️ Controlling device ${deviceId}: ${action}`)

      const endpoints = [
        `/api/device/${deviceId}/control`,
        `/api/devices/${deviceId}/control`,
        `/device/${deviceId}/control`,
        `/api/device/${deviceId}`, // PUT request dengan action di body
      ]

      for (const endpoint of endpoints) {
        try {
          const response = await apiClient.post(endpoint, { action })
          console.log(`✅ Device controlled via: ${endpoint}`)
          return response
        } catch (error) {
          continue
        }
      }

      throw new Error("Semua endpoint device control gagal")
    } catch (error) {
      console.error("❌ Failed to control device:", error)
      throw error
    }
  },

  create: async (deviceData) => {
    try {
      console.log(`➕ Creating new device...`)
      console.log("Device data:", deviceData)

      const response = await apiClient.post(`/api/device`, deviceData)
      console.log("✅ Device created successfully")
      return response
    } catch (error) {
      console.error("❌ Failed to create device:", error)

      // Coba endpoint alternatif
      const alternatives = [`/api/devices`, `/device`, `/devices`]

      for (const endpoint of alternatives) {
        try {
          const response = await apiClient.post(endpoint, deviceData)
          console.log(`✅ Device created via: ${endpoint}`)
          return response
        } catch (altError) {
          continue
        }
      }

      throw error
    }
  },
}

// Test connection function
export const testConnection = async () => {
  try {
    console.log("🔍 Testing backend connection...")

    // Test endpoint utama
    const response = await apiClient.get("/")
    console.log("✅ Backend connection successful")
    return response
  } catch (error) {
    console.error("❌ Backend connection failed:", error)

    // Coba endpoint alternatif
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
