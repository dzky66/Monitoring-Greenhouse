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

// Test koneksi dan cek endpoint yang tersedia
const discoverAvailableEndpoints = async () => {
  const railwayUrl = "https://monitoring-greenhouse-production.up.railway.app"

  try {
    console.log("🔍 Discovering available endpoints...")

    // Test root endpoint untuk mendapatkan info API
    const response = await fetch(`${railwayUrl}/`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (response.ok) {
      const data = await response.json()
      console.log("✅ API Info received:", data)

      if (data.endpoints) {
        console.log("📋 Available endpoints:", data.endpoints)
        return data.endpoints
      }
    }

    // Jika root tidak memberikan info, coba /api
    const apiResponse = await fetch(`${railwayUrl}/api`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (apiResponse.ok) {
      const apiData = await apiResponse.json()
      console.log("✅ API endpoints info:", apiData)
      return apiData.endpoints || []
    }

    return null
  } catch (error) {
    console.error("❌ Failed to discover endpoints:", error)
    return null
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

// Request interceptor dengan debugging
apiClient.interceptors.request.use(
  (config) => {
    console.log("🚀 API Request Details:")
    console.log("- Method:", config.method?.toUpperCase())
    console.log("- Base URL:", config.baseURL)
    console.log("- Endpoint:", config.url)
    console.log("- Full URL:", `${config.baseURL}${config.url}`)

    const token = localStorage.getItem("token")
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
      console.log("🔑 Token added to request")
    }

    return config
  },
  (error) => {
    console.error("❌ Request Error:", error)
    return Promise.reject(error)
  },
)

// Response interceptor untuk handle error
apiClient.interceptors.response.use(
  (response) => {
    console.log("✅ API Response Details:")
    console.log("- Status:", response.status)
    console.log("- URL:", response.config.url)
    console.log("- Data:", response.data)

    return response.data
  },
  (error) => {
    console.error("❌ API Error Details:")
    console.error("- Error:", error)

    if (error.response) {
      console.error("- Response status:", error.response.status)
      console.error("- Response data:", error.response.data)

      const status = error.response.status
      const message = error.response.data?.message || error.response.data?.error || "Terjadi kesalahan pada server"

      if (status === 404) {
        console.error("❌ 404 Error - Endpoint not found!")
        console.error("- Requested URL:", error.config.url)
        console.error("- Available endpoints might be different")
        throw new Error(`Endpoint tidak ditemukan: ${error.config.url}. Periksa konfigurasi backend.`)
      } else if (status === 401) {
        clearAuthData()
        if (window.location.pathname !== "/login") {
          window.location.href = "/login"
        }
        throw new Error("Sesi Anda telah berakhir. Silakan login kembali.")
      } else if (status === 403) {
        throw new Error("Anda tidak memiliki akses untuk melakukan tindakan ini.")
      } else if (status >= 500) {
        throw new Error("Terjadi kesalahan pada server. Silakan coba lagi nanti.")
      }

      throw new Error(message)
    } else if (error.request) {
      console.error("- Network Error:", error.request)
      throw new Error("Tidak dapat terhubung ke server. Periksa koneksi internet dan konfigurasi backend.")
    } else {
      console.error("- Setup Error:", error.message)
      throw new Error("Terjadi kesalahan yang tidak terduga: " + error.message)
    }
  },
)

// Helper functions untuk authentication
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

// Auth API functions dengan endpoint discovery
export const authAPI = {
  login: async (credentials) => {
    try {
      console.log("🔐 Login attempt started")
      console.log("- Username:", credentials.username)

      // Discover available endpoints first
      const endpoints = await discoverAvailableEndpoints()
      console.log("📋 Discovered endpoints:", endpoints)

      // Coba berbagai kemungkinan endpoint login
      const possibleLoginEndpoints = [
        "/api/auth/login",
        "/auth/login",
        "/login",
        "/api/login",
        "/api/user/login", // Berdasarkan routes yang ada
      ]

      let response = null
      let lastError = null

      for (const endpoint of possibleLoginEndpoints) {
        try {
          console.log(`🔄 Trying login endpoint: ${endpoint}`)
          response = await apiClient.post(endpoint, credentials)
          console.log(`✅ Success with login endpoint: ${endpoint}`)
          break
        } catch (error) {
          console.log(`❌ Failed with login endpoint: ${endpoint}`)
          console.log("- Error:", error.message)
          lastError = error
          continue
        }
      }

      if (!response) {
        console.error("❌ All login endpoints failed")
        console.error("💡 Available endpoints from backend:", endpoints)
        throw lastError || new Error("Semua endpoint login gagal. Periksa konfigurasi backend.")
      }

      console.log("✅ Login response received:", response)

      // Simpan token dan user data jika login berhasil
      if (response.token) {
        localStorage.setItem("token", response.token)
        console.log("🔑 Token saved to localStorage")
      }
      if (response.user) {
        localStorage.setItem("user", JSON.stringify(response.user))
        console.log("👤 User data saved to localStorage")
      }

      return response
    } catch (error) {
      console.error("❌ Login gagal:", error)
      throw error
    }
  },

  register: async (userData) => {
    try {
      console.log("📝 Register attempt started")

      // Coba berbagai kemungkinan endpoint register
      const possibleRegisterEndpoints = [
        "/api/auth/register",
        "/auth/register",
        "/register",
        "/api/register",
        "/api/user/register", // Berdasarkan routes yang ada
      ]

      let response = null
      let lastError = null

      for (const endpoint of possibleRegisterEndpoints) {
        try {
          console.log(`🔄 Trying register endpoint: ${endpoint}`)
          response = await apiClient.post(endpoint, userData)
          console.log(`✅ Success with register endpoint: ${endpoint}`)
          break
        } catch (error) {
          console.log(`❌ Failed with register endpoint: ${endpoint}`)
          lastError = error
          continue
        }
      }

      if (!response) {
        throw lastError || new Error("Semua endpoint register gagal")
      }

      console.log("✅ Registrasi berhasil")
      return response
    } catch (error) {
      console.error("❌ Registrasi gagal:", error)
      throw error
    }
  },

  getProfile: async () => {
    try {
      console.log("👤 Mengambil data profil pengguna")
      const response = await apiClient.get("/api/auth/profile")
      console.log("✅ Data profil berhasil diambil")
      return response
    } catch (error) {
      console.error("❌ Gagal mengambil data profil:", error)
      throw error
    }
  },

  updateProfile: async (profileData) => {
    try {
      console.log("📝 Memperbarui profil pengguna")
      const response = await apiClient.put("/api/auth/profile", profileData)
      console.log("✅ Profil berhasil diperbarui")
      return response
    } catch (error) {
      console.error("❌ Gagal memperbarui profil:", error)
      throw error
    }
  },

  changePassword: async (passwordData) => {
    try {
      console.log("🔒 Mengubah password pengguna")
      const response = await apiClient.put("/api/auth/change-password", passwordData)
      console.log("✅ Password berhasil diubah")
      return response
    } catch (error) {
      console.error("❌ Gagal mengubah password:", error)
      throw error
    }
  },

  logout: async () => {
    try {
      await apiClient.post("/api/auth/logout")
      clearAuthData()
      console.log("✅ Logout berhasil")
    } catch (error) {
      console.error("❌ Logout error:", error)
      clearAuthData()
    }
  },

  verifyToken: async () => {
    try {
      const response = await apiClient.get("/api/auth/verify")
      return response
    } catch (error) {
      console.error("❌ Token verification failed:", error)
      throw error
    }
  },
}

// Sensor API functions dengan endpoint discovery
export const sensorAPI = {
  getLatest: async () => {
    try {
      console.log("📊 Mengambil data sensor terbaru")

      const possibleSensorEndpoints = [
        "/api/data-sensor/latest",
        "/api/sensor/latest",
        "/sensor/latest",
        "/api/sensors/latest",
        "/api/data-sensor", // Mungkin endpoint ini mengembalikan data terbaru
        "/data-sensor/latest",
      ]

      for (const endpoint of possibleSensorEndpoints) {
        try {
          console.log(`🔄 Trying sensor endpoint: ${endpoint}`)
          const response = await apiClient.get(endpoint)
          console.log(`✅ Success getting sensor data from: ${endpoint}`)
          return response
        } catch (error) {
          console.log(`❌ Failed with sensor endpoint: ${endpoint}`)
          continue
        }
      }

      throw new Error("Semua endpoint sensor gagal")
    } catch (error) {
      console.error("❌ Error mengambil data sensor:", error)
      throw error
    }
  },

  getHistory: async (limit = 50) => {
    try {
      console.log(`📈 Mengambil riwayat sensor (limit: ${limit})`)

      const possibleHistoryEndpoints = [
        `/api/data-sensor/history?limit=${limit}`,
        `/api/sensor/history?limit=${limit}`,
        `/api/data-sensor?limit=${limit}`,
        `/data-sensor/history?limit=${limit}`,
      ]

      for (const endpoint of possibleHistoryEndpoints) {
        try {
          const response = await apiClient.get(endpoint)
          console.log(`✅ Success getting sensor history from: ${endpoint}`)
          return response
        } catch (error) {
          continue
        }
      }

      throw new Error("Semua endpoint sensor history gagal")
    } catch (error) {
      console.error("❌ Error mengambil riwayat sensor:", error)
      throw error
    }
  },
}

// Device API functions dengan endpoint discovery
export const deviceAPI = {
  getAll: async () => {
    try {
      console.log("🔧 Mengambil semua data device")

      const possibleDeviceEndpoints = ["/api/device", "/api/devices", "/device", "/devices"]

      for (const endpoint of possibleDeviceEndpoints) {
        try {
          console.log(`🔄 Trying device endpoint: ${endpoint}`)
          const response = await apiClient.get(endpoint)
          console.log(`✅ Success getting devices from: ${endpoint}`)
          return response
        } catch (error) {
          console.log(`❌ Failed with device endpoint: ${endpoint}`)
          continue
        }
      }

      throw new Error("Semua endpoint device gagal")
    } catch (error) {
      console.error("❌ Error mengambil data device:", error)
      throw error
    }
  },

  control: async (deviceId, action) => {
    try {
      console.log(`🎛️ Kontrol device ID: ${deviceId} - Action: ${action}`)

      const possibleControlEndpoints = [
        `/api/device/${deviceId}/control`,
        `/api/devices/${deviceId}/control`,
        `/device/${deviceId}/control`,
        `/api/device/${deviceId}`, // PUT request dengan action di body
      ]

      for (const endpoint of possibleControlEndpoints) {
        try {
          const response = await apiClient.post(endpoint, { action })
          console.log(`✅ Success controlling device via: ${endpoint}`)
          return response
        } catch (error) {
          continue
        }
      }

      throw new Error("Semua endpoint device control gagal")
    } catch (error) {
      console.error("❌ Error kontrol device:", error)
      throw error
    }
  },
}

// Fungsi untuk test koneksi dan discover endpoints
export const testConnection = async () => {
  try {
    console.log("🔍 Testing connection to backend...")

    // Test berbagai health check endpoints
    const healthEndpoints = ["/api/health", "/health", "/", "/api", "/api/status"]

    for (const endpoint of healthEndpoints) {
      try {
        console.log(`🔄 Testing endpoint: ${endpoint}`)
        const response = await apiClient.get(endpoint)
        console.log(`✅ Backend connection successful via: ${endpoint}`)
        console.log("📋 Response data:", response)
        return response
      } catch (error) {
        console.log(`❌ Failed health check: ${endpoint}`)
        continue
      }
    }

    throw new Error("Semua health check endpoints gagal")
  } catch (error) {
    console.error("❌ Backend connection failed:", error)
    throw error
  }
}

// Export semua yang diperlukan
export { discoverAvailableEndpoints }
export default apiClient
