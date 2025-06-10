import axios from "axios"

// Fungsi untuk mendapatkan base URL API - diperbaiki untuk Vite
const getApiBaseUrl = () => {
  // Untuk Vite, gunakan import.meta.env
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL
  }

  // Fallback berdasarkan environment
  if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
    return "http://localhost:5000"
  }

  // Untuk production, gunakan URL Railway yang sudah Anda berikan
  return "https://monitoring-greenhouse-production.up.railway.app"
}

// Konfigurasi base axios instance
const apiClient = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 15000, // Timeout 15 detik untuk koneksi yang lebih stabil
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
})

// Request interceptor untuk menambahkan token otomatis
apiClient.interceptors.request.use(
  (config) => {
    // Log request untuk debugging
    console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`)

    // Ambil token dari localStorage
    const token = localStorage.getItem("token")
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
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
    // Log response untuk debugging
    console.log(`✅ API Response: ${response.status} ${response.config.url}`)

    // Return data langsung dari response
    return response.data
  },
  (error) => {
    console.error("❌ API Error:", error)

    // Handle berbagai jenis error
    if (error.response) {
      // Server merespon dengan status error
      const status = error.response.status
      const message = error.response.data?.message || error.response.data?.error || "Terjadi kesalahan pada server"

      // Handle specific status codes
      if (status === 401) {
        // Unauthorized - hapus token dan redirect ke login
        clearAuthData()
        if (window.location.pathname !== "/login") {
          window.location.href = "/login"
        }
        throw new Error("Sesi Anda telah berakhir. Silakan login kembali.")
      } else if (status === 403) {
        throw new Error("Anda tidak memiliki akses untuk melakukan tindakan ini.")
      } else if (status === 404) {
        throw new Error("Data yang diminta tidak ditemukan.")
      } else if (status >= 500) {
        throw new Error("Terjadi kesalahan pada server. Silakan coba lagi nanti.")
      }

      throw new Error(message)
    } else if (error.request) {
      // Request dibuat tapi tidak ada response
      console.error("Network Error - No Response:", error.request)
      throw new Error("Tidak dapat terhubung ke server. Periksa koneksi internet Anda.")
    } else {
      // Error lainnya
      console.error("Request Setup Error:", error.message)
      throw new Error("Terjadi kesalahan yang tidak terduga")
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

// Auth API functions - diperbaiki endpoint paths dan hapus type annotations
export const authAPI = {
  login: async (credentials) => {
    try {
      console.log("🔐 Mencoba login dengan username:", credentials.username)
      const response = await apiClient.post("/api/auth/login", credentials)

      // Simpan token dan user data jika login berhasil
      if (response.token) {
        localStorage.setItem("token", response.token)
      }
      if (response.user) {
        localStorage.setItem("user", JSON.stringify(response.user))
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
      console.log("📝 Mencoba registrasi dengan username:", userData.username)
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

// Fungsi untuk test koneksi ke backend
export const testConnection = async () => {
  try {
    console.log("🔍 Testing connection to backend...")
    const response = await apiClient.get("/api/health")
    console.log("✅ Backend connection successful!")
    return response
  } catch (error) {
    console.error("❌ Backend connection failed:", error)
    throw error
  }
}

// Export default untuk apiClient
export default apiClient
  