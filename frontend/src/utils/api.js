import axios from "axios"

// Fungsi untuk mendapatkan base URL API - diperbaiki untuk Railway yang sudah online
const getApiBaseUrl = () => {
  console.log("🔍 Environment check:")
  console.log("- VITE_API_URL:", import.meta.env.VITE_API_URL)
  console.log("- Current hostname:", window.location.hostname)

  // Untuk Vite, gunakan import.meta.env
  if (import.meta.env.VITE_API_URL) {
    console.log("✅ Using VITE_API_URL:", import.meta.env.VITE_API_URL)
    return import.meta.env.VITE_API_URL
  }

  // Fallback berdasarkan environment
  if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
    console.log("🏠 Using localhost fallback")
    return "http://localhost:5000"
  }

  // Backend Railway sudah online - gunakan URL yang benar
  const railwayUrl = "https://monitoring-greenhouse-production.up.railway.app"
  console.log("🚂 Using Railway URL:", railwayUrl)
  return railwayUrl
}

// Test koneksi langsung ke Railway yang sudah online
const testRailwayConnection = async () => {
  const railwayUrl = "https://monitoring-greenhouse-production.up.railway.app"

  try {
    console.log("🔍 Testing connection to Railway backend...")

    // Test dengan fetch biasa dulu
    const response = await fetch(`${railwayUrl}/api/health`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })

    console.log("✅ Railway connection test result:", response.status)

    if (response.ok) {
      const data = await response.json()
      console.log("✅ Railway response data:", data)
      return true
    } else {
      console.log("❌ Railway returned status:", response.status)

      // Jika endpoint /api/health tidak ada, coba endpoint lain
      if (response.status === 404) {
        console.log("🔄 Trying alternative endpoint...")
        const altResponse = await fetch(`${railwayUrl}/`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        })

        if (altResponse.ok) {
          console.log("✅ Railway backend is online (alternative endpoint)")
          return true
        }
      }

      return false
    }
  } catch (error) {
    console.error("❌ Railway connection test failed:", error)
    return false
  }
}

// Konfigurasi base axios instance
const apiClient = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 30000, // 30 seconds timeout
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

    // Ambil token dari localStorage
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

      if (status === 401) {
        clearAuthData()
        if (window.location.pathname !== "/login") {
          window.location.href = "/login"
        }
        throw new Error("Sesi Anda telah berakhir. Silakan login kembali.")
      } else if (status === 403) {
        throw new Error("Anda tidak memiliki akses untuk melakukan tindakan ini.")
      } else if (status === 404) {
        throw new Error("Endpoint tidak ditemukan. Periksa konfigurasi backend.")
      } else if (status >= 500) {
        throw new Error("Terjadi kesalahan pada server. Silakan coba lagi nanti.")
      }

      throw new Error(message)
    } else if (error.request) {
      console.error("- Network Error:", error.request)

      if (error.message.includes("Network Error")) {
        throw new Error(
          "CORS Error: Backend tidak mengizinkan akses dari domain ini. Periksa konfigurasi CORS di backend.",
        )
      }

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

// Auth API functions - sesuaikan dengan backend yang sudah online
export const authAPI = {
  login: async (credentials) => {
    try {
      console.log("🔐 Login attempt started")
      console.log("- Username:", credentials.username)

      // Test Railway connection first
      const railwayConnected = await testRailwayConnection()
      if (!railwayConnected) {
        throw new Error("Backend Railway tidak dapat diakses. Periksa status backend.")
      }

      // Coba beberapa endpoint yang mungkin ada
      const possibleEndpoints = ["/api/auth/login", "/auth/login", "/login", "/api/login"]

      let response = null
      let lastError = null

      for (const endpoint of possibleEndpoints) {
        try {
          console.log(`🔄 Trying endpoint: ${endpoint}`)
          response = await apiClient.post(endpoint, credentials)
          console.log(`✅ Success with endpoint: ${endpoint}`)
          break
        } catch (error) {
          console.log(`❌ Failed with endpoint: ${endpoint}`)
          lastError = error
          continue
        }
      }

      if (!response) {
        throw lastError || new Error("Semua endpoint login gagal")
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

      console.log("✅ Login berhasil")
      return response
    } catch (error) {
      console.error("❌ Login gagal:", error)
      throw error
    }
  },

  register: async (userData) => {
    try {
      console.log("📝 Register attempt started")
      console.log("- Username:", userData.username)

      // Test Railway connection first
      const railwayConnected = await testRailwayConnection()
      if (!railwayConnected) {
        throw new Error("Backend Railway tidak dapat diakses. Periksa status backend.")
      }

      // Coba beberapa endpoint yang mungkin ada
      const possibleEndpoints = ["/api/auth/register", "/auth/register", "/register", "/api/register"]

      let response = null
      let lastError = null

      for (const endpoint of possibleEndpoints) {
        try {
          console.log(`🔄 Trying endpoint: ${endpoint}`)
          response = await apiClient.post(endpoint, userData)
          console.log(`✅ Success with endpoint: ${endpoint}`)
          break
        } catch (error) {
          console.log(`❌ Failed with endpoint: ${endpoint}`)
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

// Sensor API functions
export const sensorAPI = {
  getLatest: async () => {
    try {
      console.log("📊 Mengambil data sensor terbaru")

      // Coba beberapa endpoint yang mungkin ada
      const possibleEndpoints = [
        "/api/data-sensor/latest",
        "/api/sensor/latest",
        "/sensor/latest",
        "/api/sensors/latest",
      ]

      for (const endpoint of possibleEndpoints) {
        try {
          const response = await apiClient.get(endpoint)
          console.log(`✅ Success getting sensor data from: ${endpoint}`)
          return response
        } catch (error) {
          console.log(`❌ Failed with endpoint: ${endpoint}`)
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
      const response = await apiClient.get(`/api/data-sensor/history?limit=${limit}`)
      return response
    } catch (error) {
      console.error("❌ Error mengambil riwayat sensor:", error)
      throw error
    }
  },
}

// Device API functions
export const deviceAPI = {
  getAll: async () => {
    try {
      console.log("🔧 Mengambil semua data device")

      // Coba beberapa endpoint yang mungkin ada
      const possibleEndpoints = ["/api/device", "/api/devices", "/device", "/devices"]

      for (const endpoint of possibleEndpoints) {
        try {
          const response = await apiClient.get(endpoint)
          console.log(`✅ Success getting devices from: ${endpoint}`)
          return response
        } catch (error) {
          console.log(`❌ Failed with endpoint: ${endpoint}`)
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
      const response = await apiClient.post(`/api/device/${deviceId}/control`, { action })
      return response
    } catch (error) {
      console.error("❌ Error kontrol device:", error)
      throw error
    }
  },
}

// Fungsi untuk test koneksi ke backend
export const testConnection = async () => {
  try {
    console.log("🔍 Testing connection to backend...")

    // Test Railway connection first
    const railwayConnected = await testRailwayConnection()
    if (!railwayConnected) {
      throw new Error("Railway backend tidak dapat diakses")
    }

    // Coba beberapa endpoint health check
    const healthEndpoints = ["/api/health", "/health", "/", "/api/status"]

    for (const endpoint of healthEndpoints) {
      try {
        const response = await apiClient.get(endpoint)
        console.log(`✅ Backend connection successful via: ${endpoint}`)
        return response
      } catch (error) {
        console.log(`❌ Failed health check: ${endpoint}`)
        continue
      }
    }

    // Jika semua health check gagal, tapi Railway connection berhasil
    console.log("✅ Backend is online but no health endpoint found")
    return { status: "online", message: "Backend is accessible" }
  } catch (error) {
    console.error("❌ Backend connection failed:", error)
    throw error
  }
}

// Export semua yang diperlukan
export { testRailwayConnection }
export default apiClient
