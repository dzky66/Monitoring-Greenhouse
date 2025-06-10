import axios from "axios"

// Fungsi untuk mendapatkan base URL API - diperbaiki untuk debugging
const getApiBaseUrl = () => {
  // Log environment variables untuk debugging
  console.log("🔍 Environment check:")
  console.log("- VITE_API_URL:", import.meta.env.VITE_API_URL)
  console.log("- Current hostname:", window.location.hostname)
  console.log("- Current protocol:", window.location.protocol)

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

  // Untuk production, gunakan URL Railway yang sudah Anda berikan
  const railwayUrl = "https://monitoring-greenhouse-production.up.railway.app"
  console.log("🚂 Using Railway URL:", railwayUrl)
  return railwayUrl
}

// Test koneksi langsung ke Railway
const testRailwayConnection = async () => {
  const railwayUrl = "https://monitoring-greenhouse-production.up.railway.app"

  try {
    console.log("🔍 Testing direct connection to Railway...")

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
      return false
    }
  } catch (error) {
    console.error("❌ Railway connection test failed:", error)
    return false
  }
}

// Konfigurasi base axios instance dengan debugging
const apiClient = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 30000, // Increase timeout to 30 seconds
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
})

// Request interceptor dengan debugging yang lebih detail
apiClient.interceptors.request.use(
  (config) => {
    console.log("🚀 API Request Details:")
    console.log("- Method:", config.method?.toUpperCase())
    console.log("- Base URL:", config.baseURL)
    console.log("- Endpoint:", config.url)
    console.log("- Full URL:", `${config.baseURL}${config.url}`)
    console.log("- Headers:", config.headers)
    console.log("- Data:", config.data)

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

// Response interceptor untuk handle error secara global
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
    console.error("- Error object:", error)
    console.error("- Error message:", error.message)
    console.error("- Error code:", error.code)

    if (error.response) {
      console.error("- Response status:", error.response.status)
      console.error("- Response data:", error.response.data)
      console.error("- Response headers:", error.response.headers)

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
      console.error("- Request was made but no response received")
      console.error("- Request details:", error.request)

      // Check if it's a CORS error
      if (error.message.includes("Network Error")) {
        throw new Error(
          "CORS Error: Backend tidak mengizinkan akses dari domain ini. Periksa konfigurasi CORS di backend.",
        )
      }

      throw new Error("Tidak dapat terhubung ke server. Periksa koneksi internet dan konfigurasi backend.")
    } else {
      console.error("- Error in setting up request:", error.message)
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

// Auth API functions dengan debugging
export const authAPI = {
  login: async (credentials) => {
    try {
      console.log("🔐 Login attempt started")
      console.log("- Username:", credentials.username)
      console.log("- Password length:", credentials.password?.length)

      // Test Railway connection first
      const railwayConnected = await testRailwayConnection()
      if (!railwayConnected) {
        throw new Error("Backend Railway tidak dapat diakses. Periksa status backend.")
      }

      const response = await apiClient.post("/api/auth/login", credentials)

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
      console.log("- Name:", userData.name)
      console.log("- Email:", userData.email)

      // Test Railway connection first
      const railwayConnected = await testRailwayConnection()
      if (!railwayConnected) {
        throw new Error("Backend Railway tidak dapat diakses. Periksa status backend.")
      }

      const response = await apiClient.post("/api/auth/register", userData)
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

// Sensor API functions - diperbaiki endpoint paths
export const sensorAPI = {
  getLatest: async () => {
    try {
      console.log("📊 Mengambil data sensor terbaru")
      const response = await apiClient.get("/api/data-sensor/latest")
      return response
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

  getByDateRange: async (startDate, endDate) => {
    try {
      console.log(`📅 Mengambil data sensor dari ${startDate} sampai ${endDate}`)
      const response = await apiClient.get(`/api/data-sensor/range?start=${startDate}&end=${endDate}`)
      return response
    } catch (error) {
      console.error("❌ Error mengambil data sensor berdasarkan tanggal:", error)
      throw error
    }
  },
}

// Device API functions - diperbaiki endpoint paths
export const deviceAPI = {
  getAll: async () => {
    try {
      console.log("🔧 Mengambil semua data device")
      const response = await apiClient.get("/api/device")
      return response
    } catch (error) {
      console.error("❌ Error mengambil data device:", error)
      throw error
    }
  },

  getById: async (deviceId) => {
    try {
      console.log(`🔍 Mengambil data device ID: ${deviceId}`)
      const response = await apiClient.get(`/api/device/${deviceId}`)
      return response
    } catch (error) {
      console.error("❌ Error mengambil data device:", error)
      throw error
    }
  },

  update: async (deviceId, deviceData) => {
    try {
      console.log(`📝 Update device ID: ${deviceId}`)
      const response = await apiClient.put(`/api/device/${deviceId}`, deviceData)
      return response
    } catch (error) {
      console.error("❌ Error update device:", error)
      throw error
    }
  },

  create: async (deviceData) => {
    try {
      console.log("➕ Membuat device baru")
      const response = await apiClient.post("/api/device", deviceData)
      return response
    } catch (error) {
      console.error("❌ Error membuat device:", error)
      throw error
    }
  },

  delete: async (deviceId) => {
    try {
      console.log(`🗑️ Menghapus device ID: ${deviceId}`)
      const response = await apiClient.delete(`/api/device/${deviceId}`)
      return response
    } catch (error) {
      console.error("❌ Error menghapus device:", error)
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

// Fungsi untuk test koneksi ke backend dengan debugging
export const testConnection = async () => {
  try {
    console.log("🔍 Testing connection to backend...")

    // Test Railway connection first
    const railwayConnected = await testRailwayConnection()
    if (!railwayConnected) {
      throw new Error("Railway backend tidak dapat diakses")
    }

    const response = await apiClient.get("/api/health")
    console.log("✅ Backend connection successful!")
    return response
  } catch (error) {
    console.error("❌ Backend connection failed:", error)
    throw error
  }
}

// Export semua yang diperlukan
export { testRailwayConnection }
export default apiClient
