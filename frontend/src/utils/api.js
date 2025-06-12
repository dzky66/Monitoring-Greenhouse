import axios from "axios"

// Helper function
const clearAuthData = () => {
  try {
    if (typeof window !== "undefined") {
      localStorage.removeItem("token")
      localStorage.removeItem("user")
    }
  } catch (error) {
    console.error("Error clearing auth data:", error)
  }
}

// Fungsi untuk mendapatkan base URL API
const getApiBaseUrl = () => {
  try {
    const viteApiUrl = import.meta.env?.VITE_API_URL
    if (viteApiUrl) {
      console.log("✅ Using VITE_API_URL:", viteApiUrl)
      return viteApiUrl
    }

    if (typeof window !== "undefined") {
      const hostname = window.location.hostname
      if (hostname === "localhost" || hostname === "127.0.0.1") {
        return "http://localhost:8080"
      }
    }

    return "https://monitoring-greenhouse-production.up.railway.app"
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

// ✅ RESPONSE INTERCEPTOR YANG DIPERBAIKI
apiClient.interceptors.response.use(
  (response) => {
    try {
      console.log("✅ API Response:")
      console.log("- Status:", response.status)
      console.log("- URL:", response.config.url)
      console.log("- Data:", response.data)
      return response.data // Return data untuk axios
    } catch (error) {
      console.error("Response interceptor error:", error)
      return response.data
    }
  },
  (error) => {
    console.error("❌ API Error:")
    console.error("- Error:", error.message)

    // 🔧 PERBAIKAN 1: Handle network errors
    if (!error.response) {
      // Network error, timeout, atau server tidak dapat dijangkau
      if (error.code === "ECONNABORTED") {
        throw new Error("Request timeout. Server terlalu lama merespons.")
      } else if (error.code === "ERR_NETWORK") {
        throw new Error("Network error. Periksa koneksi internet atau server mungkin down.")
      } else {
        throw new Error("Tidak dapat terhubung ke server. Periksa koneksi internet.")
      }
    }

    // Server responded with error status
    console.error("- Status:", error.response.status)
    console.error("- Data:", error.response.data)

    const status = error.response.status
    const message = error.response.data?.message || error.response.data?.error || "Terjadi kesalahan pada server"

    // 🔧 PERBAIKAN 2: Improved status handling
    if (status === 404) {
      throw new Error(`Endpoint tidak ditemukan: ${error.config.url}`)
    } else if (status === 401) {
      // 🔧 PERBAIKAN 3: Better login request detection
      const isLoginRequest =
        error.config.url?.includes("/auth/login") ||
        error.config.url?.includes("/login") ||
        error.config.url?.endsWith("/login")

      if (!isLoginRequest) {
        clearAuthData()

        // 🔧 PERBAIKAN 4: Better redirect handling
        if (typeof window !== "undefined" && window.location.pathname !== "/login") {
          console.log("🔄 Redirecting to login due to expired session")
          setTimeout(() => {
            window.location.href = "/login"
          }, 1000)
        }
      }

      throw new Error(
        isLoginRequest ? "Username atau password salah" : "Sesi Anda telah berakhir. Silakan login kembali.",
      )
    } else if (status === 403) {
      throw new Error("Akses ditolak. Anda tidak memiliki izin untuk mengakses resource ini.")
    } else if (status === 422) {
      // Validation errors
      throw new Error(message || "Data yang dikirim tidak valid.")
    } else if (status >= 500) {
      throw new Error("Terjadi kesalahan pada server. Silakan coba lagi nanti.")
    } else if (status >= 400) {
      // Other client errors
      throw new Error(message || `Client error: ${status}`)
    }

    // 🔧 PERBAIKAN 5: Default error handling
    throw new Error(message || `HTTP Error: ${status}`)
  },
)

// Auth API functions
export const authAPI = {
  login: async (credentials) => {
    try {
      console.log("🔐 Attempting login...")
      console.log("- Credentials:", { username: credentials.username, password: "[HIDDEN]" })

      // 🎯 GUNAKAN ENDPOINT YANG BENAR
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
}

// Test connection function
export const testConnection = async () => {
  try {
    console.log("🔍 Testing backend connection...")

    // Try multiple endpoints
    const endpoints = ["/api/health", "/", "/api"]

    for (const endpoint of endpoints) {
      try {
        const response = await apiClient.get(endpoint)
        console.log(`✅ Backend connected via: ${endpoint}`)
        return response
      } catch (error) {
        console.log(`❌ Failed: ${endpoint} - ${error.message}`)
        continue
      }
    }

    throw new Error("All connection attempts failed")
  } catch (error) {
    console.error("❌ Backend connection failed:", error)
    throw error
  }
}

export default apiClient
