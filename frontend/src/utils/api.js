import axios from "axios"

// Fungsi untuk mendapatkan base URL API - PERBAIKAN
const getApiBaseUrl = () => {
  // Gunakan try-catch untuk menghindari error saat build
  try {
    console.log("🔍 Environment check:")

    // Periksa environment variable dengan fallback yang aman
    const viteApiUrl = import.meta.env?.VITE_API_URL
    console.log("- VITE_API_URL:", viteApiUrl)

    if (viteApiUrl) {
      console.log("✅ Using VITE_API_URL:", viteApiUrl)
      return viteApiUrl
    }

    // Fallback untuk development - hanya jika window tersedia
    if (typeof window !== "undefined") {
      const hostname = window.location.hostname
      console.log("- Current hostname:", hostname)

      if (hostname === "localhost" || hostname === "127.0.0.1") {
        console.log("🏠 Using localhost fallback")
        return "http://localhost:8080"
      }
    }

    // Default fallback
    const railwayUrl = "https://monitoring-greenhouse-production.up.railway.app"
    console.log("🚂 Using Railway URL:", railwayUrl)
    return railwayUrl
  } catch (error) {
    console.error("Error getting API base URL:", error)
    // Fallback yang aman jika ada error
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

// Request interceptor dengan error handling yang lebih baik
apiClient.interceptors.request.use(
  (config) => {
    try {
      console.log("🚀 API Request:")
      console.log("- Method:", config.method?.toUpperCase())
      console.log("- URL:", `${config.baseURL}${config.url}`)

      // Safely get token
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

// Response interceptor dengan error handling yang lebih baik
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

// Helper functions dengan safe checks
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
