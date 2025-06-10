import axios from "axios"

// Fungsi untuk mendapatkan base URL API
const getApiBaseUrl = () => {
  // Coba ambil dari environment variable (jika tersedia)
  if (typeof process !== "undefined" && process.env && process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL
  }

  // Fallback ke URL default berdasarkan environment
  if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
    return "http://localhost:5000/api"
  }

  // Untuk production, gunakan URL relatif atau URL production
  // Untuk production, gunakan URL backend Railway
return "https://monitoring-greenhouse-production.up.railway.app/api"

}

// Konfigurasi base axios instance
const apiClient = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 10000, // Timeout 10 detik
  headers: {
    "Content-Type": "application/json",
  },
})

// Request interceptor untuk menambahkan token otomatis
apiClient.interceptors.request.use(
  (config) => {
    // Ambil token dari localStorage
    const token = localStorage.getItem("token")
    if (token) {
      // Tambahkan token ke header Authorization
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

// Response interceptor untuk handle error secara global
apiClient.interceptors.response.use(
  (response) => {
    // Return data langsung dari response
    return response.data
  },
  (error) => {
    console.error("API Error:", error)

    // Handle berbagai jenis error
    if (error.response) {
      // Server merespon dengan status error
      const message = error.response.data?.message || error.response.data?.error || "Terjadi kesalahan pada server"
      throw new Error(message)
    } else if (error.request) {
      // Request dibuat tapi tidak ada response
      throw new Error("Tidak dapat terhubung ke server. Periksa koneksi internet Anda.")
    } else {
      // Error lainnya
      throw new Error("Terjadi kesalahan yang tidak terduga")
    }
  },
)

// Helper functions untuk authentication
export const isAuthenticated = () => {
  // Cek apakah user sudah login dengan memeriksa token dan user data
  const token = localStorage.getItem("token")
  const user = localStorage.getItem("user")
  return !!(token && user)
}

export const getCurrentUser = () => {
  try {
    // Ambil data user dari localStorage
    const user = localStorage.getItem("user")
    return user ? JSON.parse(user) : null
  } catch (error) {
    console.error("Error parsing user data:", error)
    return null
  }
}

export const clearAuthData = () => {
  // Hapus semua data authentication dari localStorage
  localStorage.removeItem("token")
  localStorage.removeItem("user")
}

// Auth API functions - Fungsi-fungsi untuk authentication
export const authAPI = {
  // Fungsi login
  login: async (credentials) => {
    try {
      console.log("🔐 Mencoba login dengan username:", credentials.username)

      // Kirim request login ke server
      const response = await apiClient.post("/auth/login", credentials)

      console.log("✅ Login berhasil:", response)
      return response
    } catch (error) {
      console.error("❌ Login gagal:", error)
      throw error
    }
  },

  // Fungsi register
  register: async (userData) => {
    try {
      console.log("📝 Mencoba registrasi dengan username:", userData.username)

      // Kirim request registrasi ke server
      const response = await apiClient.post("/auth/register", userData)

      console.log("✅ Registrasi berhasil:", response)
      return response
    } catch (error) {
      console.error("❌ Registrasi gagal:", error)
      throw error
    }
  },

  // Fungsi untuk mengambil data profil
  getProfile: async () => {
    try {
      console.log("👤 Mengambil data profil pengguna")

      // Kirim request untuk ambil profil
      const response = await apiClient.get("/auth/profile")

      console.log("✅ Data profil berhasil diambil:", response)
      return response
    } catch (error) {
      console.error("❌ Gagal mengambil data profil:", error)
      throw error
    }
  },

  // Fungsi untuk update profil
  updateProfile: async (profileData) => {
    try {
      console.log("📝 Memperbarui profil pengguna:", profileData)

      // Kirim request update profil
      const response = await apiClient.put("/auth/profile", profileData)

      console.log("✅ Profil berhasil diperbarui:", response)
      return response
    } catch (error) {
      console.error("❌ Gagal memperbarui profil:", error)
      throw error
    }
  },

  // Fungsi untuk ubah password
  changePassword: async (passwordData) => {
    try {
      console.log("🔒 Mengubah password pengguna")

      // Kirim request ubah password
      const response = await apiClient.put("/auth/change-password", passwordData)

      console.log("✅ Password berhasil diubah")
      return response
    } catch (error) {
      console.error("❌ Gagal mengubah password:", error)
      throw error
    }
  },

  // Fungsi logout
  logout: async () => {
    try {
      // Kirim request logout ke server
      await apiClient.post("/auth/logout")

      // Hapus data authentication dari localStorage
      clearAuthData()

      console.log("✅ Logout berhasil")
    } catch (error) {
      console.error("❌ Logout error:", error)
      // Tetap hapus data lokal meskipun API call gagal
      clearAuthData()
    }
  },

  // Fungsi untuk verifikasi token
  verifyToken: async () => {
    try {
      // Kirim request verifikasi token
      const response = await apiClient.get("/auth/verify")
      return response
    } catch (error) {
      console.error("❌ Token verification failed:", error)
      throw error
    }
  },
}

// Sensor API functions - Fungsi-fungsi untuk data sensor
export const sensorAPI = {
  // Ambil data sensor terbaru
  getLatest: async () => {
    try {
      // Kirim request untuk data sensor terbaru
      const response = await apiClient.get("/data-sensor/latest")
      return response
    } catch (error) {
      console.error("❌ Error mengambil data sensor:", error)
      throw error
    }
  },

  // Ambil riwayat data sensor
  getHistory: async (limit = 50) => {
    try {
      // Kirim request untuk riwayat data sensor dengan limit
      const response = await apiClient.get(`/data-sensor/history?limit=${limit}`)
      return response
    } catch (error) {
      console.error("❌ Error mengambil riwayat sensor:", error)
      throw error
    }
  },
}

// Device API functions - Fungsi-fungsi untuk kontrol device
export const deviceAPI = {
  // Ambil semua data device
  getAll: async () => {
    try {
      // Kirim request untuk ambil semua device
      const response = await apiClient.get("/device")
      return response
    } catch (error) {
      console.error("❌ Error mengambil data device:", error)
      throw error
    }
  },

  // Update device
  update: async (deviceId, deviceData) => {
    try {
      // Kirim request update device berdasarkan ID
      const response = await apiClient.put(`/device/${deviceId}`, deviceData)
      return response
    } catch (error) {
      console.error("❌ Error update device:", error)
      throw error
    }
  },

  // Buat device baru
  create: async (deviceData) => {
    try {
      // Kirim request untuk buat device baru
      const response = await apiClient.post("/device", deviceData)
      return response
    } catch (error) {
      console.error("❌ Error membuat device:", error)
      throw error
    }
  },
}

// Export default untuk apiClient
export default apiClient
