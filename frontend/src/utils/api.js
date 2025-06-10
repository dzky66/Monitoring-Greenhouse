import axios from "axios"

// Fungsi untuk mendapatkan base URL dari environment
const getApiBaseUrl = () => {
  if (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL
  }

  if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
    return "http://localhost:5000/api"
  }

  return "https://monitoring-greenhouse-production.up.railway.app/api"
}

const apiClient = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
})

// Interceptor request tanpa token
apiClient.interceptors.request.use(
  (config) => config,
  (error) => Promise.reject(error)
)

// Interceptor response
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.error("API Error:", error)
    if (error.response) {
      const message = error.response.data?.message || error.response.data?.error || "Terjadi kesalahan pada server"
      throw new Error(message)
    } else if (error.request) {
      throw new Error("Tidak dapat terhubung ke server. Periksa koneksi internet Anda.")
    } else {
      throw new Error("Terjadi kesalahan yang tidak terduga")
    }
  }
)

// Auth API
export const authAPI = {
  login: async (credentials) => {
    const response = await apiClient.post("/auth/login", credentials)
    return response
  },
  register: async (userData) => {
    const response = await apiClient.post("/auth/register", userData)
    return response
  },
  getProfile: async () => {
    const response = await apiClient.get("/auth/profile")
    return response
  },
  updateProfile: async (profileData) => {
    const response = await apiClient.put("/auth/profile", profileData)
    return response
  },
  changePassword: async (passwordData) => {
    const response = await apiClient.put("/auth/change-password", passwordData)
    return response
  },
  logout: async () => {
    await apiClient.post("/auth/logout")
  },
  verifyToken: async () => {
    const response = await apiClient.get("/auth/verify")
    return response
  },
}

// Sensor API
export const sensorAPI = {
  getLatest: async () => {
    const response = await apiClient.get("/data-sensor/latest")
    return response
  },
  getHistory: async (limit = 50) => {
    const response = await apiClient.get(`/data-sensor/history?limit=${limit}`)
    return response
  },
}

// Device API
export const deviceAPI = {
  getAll: async () => {
    const response = await apiClient.get("/device")
    return response
  },
  update: async (deviceId, deviceData) => {
    const response = await apiClient.put(`/device/${deviceId}`, deviceData)
    return response
  },
  create: async (deviceData) => {
    const response = await apiClient.post("/device", deviceData)
    return response
  },
}

export default apiClient
