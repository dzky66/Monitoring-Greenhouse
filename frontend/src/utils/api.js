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
    console.log("- Headers:", config.headers)
    
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
      console.error("- Headers:", error.response.headers)

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

      // Tambahkan debugging untuk format data
      console.log("- Request format:", JSON.stringify(credentials))

      let response
      try {
        // Coba dengan format credentials langsung
        response = await apiClient.post("/api/auth/login", credentials)
        console.log("✅ Login successful with /api/auth/login")
      } catch (mainError) {
        console.log("❌ Main endpoint failed:", mainError.message)
        
        // Jika gagal, coba dengan format yang berbeda
        if (mainError.response && mainError.response.status === 401) {
          console.log("🔄 Trying with different request format...")
          
          try {
            // Format alternatif 1: { user: { username, password } }
            const altFormat1 = { user: { username: credentials.username, password: credentials.password } }
            console.log("- Trying format:", JSON.stringify({ user: { username: credentials.username, password: "[HIDDEN]" } }))
            response = await apiClient.post("/api/auth/login", altFormat1)
            console.log("✅ Login successful with alternative format 1")
            return response
          } catch (altError1) {
            console.log("❌ Alternative format 1 failed:", altError1.message)
            
            try {
              // Format alternatif 2: { email sebagai username }
              const altFormat2 = { email: credentials.username, password: credentials.password }
              console.log("- Trying format:", JSON.stringify({ email: credentials.username, password: "[HIDDEN]" }))
              response = await apiClient.post("/api/auth/login", altFormat2)
              console.log("✅ Login successful with alternative format 2")
              return response
            } catch (altError2) {
              console.log("❌ Alternative format 2 failed:", altError2.message)
            }
          }
        }

        // Jika semua format gagal, coba endpoint alternatif
        const alternatives = ["/api/user/login", "/auth/login", "/login"]

        let lastError = mainError
        for (const endpoint of alternatives) {
          try {
            console.log(`🔄 Trying alternative endpoint: ${endpoint}`)
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

      let response
      try {
        response = await apiClient.post("/api/auth/register", userData)
        console.log("✅ Registration successful with /api/auth/register")
      } catch (mainError) {
        console.log("❌ Main register endpoint failed:", mainError.message)

        const alternatives = ["/api/user/register", "/auth/register", "/register"]

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

// Fungsi untuk memeriksa format API yang diharapkan
export const checkApiFormat = async () => {
  try {
    console.log("🔍 Checking API format...")
    
    // Coba ambil info API untuk melihat format yang diharapkan
    const response = await apiClient.get("/api")
    console.log("✅ API info retrieved:", response)
    
    return response
  } catch (error) {
    console.error("❌ Failed to check API format:", error)
    throw error
  }
}

export default apiClient
