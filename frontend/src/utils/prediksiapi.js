import apiClient from "./api"

export const prediksiAPI = {
  getAll: async () => {
    try {
      console.log("📊 Getting all prediksi...")
      const response = await apiClient.get("/api/prediksi")
      console.log("✅ Prediksi retrieved from backend")
      return response
    } catch (error) {
      console.error("❌ Failed to get prediksi:", error)
      throw error
    }
  },

  getLatest: async () => {
    try {
      console.log("📊 Getting latest prediksi...")
      const response = await apiClient.get("/api/prediksi/latest")
      console.log("✅ Latest prediksi retrieved")
      return response
    } catch (error) {
      console.error("❌ Failed to get latest prediksi:", error)
      throw error
    }
  },

  getByTanaman: async (tanaman) => {
    try {
      console.log(`📊 Getting prediksi for tanaman: ${tanaman}`)
      const response = await apiClient.get(`/api/prediksi/tanaman/${tanaman}`)
      console.log("✅ Prediksi by tanaman retrieved")
      return response
    } catch (error) {
      console.error("❌ Failed to get prediksi by tanaman:", error)
      throw error
    }
  },

  create: async (prediksiData) => {
    try {
      console.log("➕ Creating new prediksi...")
      console.log("📝 Prediksi data:", prediksiData)

      const response = await apiClient.post("/api/prediksi", prediksiData)
      console.log("✅ Prediksi created successfully")
      return response
    } catch (error) {
      console.error("❌ Failed to create prediksi:", error)
      throw error
    }
  },

  generate: async (generateData) => {
    try {
      console.log("🤖 Generating prediksi...")
      console.log("📝 Generate data:", generateData)

      // Pastikan format data sesuai dengan yang diharapkan backend
      const requestData = {
        tanaman: generateData.tanaman,
        waktu_tanam: generateData.waktu_tanam,
      }

      console.log("📤 Sending request to backend:", requestData)

      const response = await apiClient.post("/api/prediksi/generate", requestData)
      console.log("✅ Prediksi generated successfully")
      console.log("📊 Generated prediksi data:", response)
      return response
    } catch (error) {
      console.error("❌ Failed to generate prediksi:", error)
      throw error
    }
  },

  update: async (id, prediksiData) => {
    try {
      console.log(`📝 Updating prediksi ID: ${id}`)
      console.log("📝 Update data:", prediksiData)

      const response = await apiClient.put(`/api/prediksi/${id}`, prediksiData)
      console.log("✅ Prediksi updated successfully")
      return response
    } catch (error) {
      console.error("❌ Failed to update prediksi:", error)
      throw error
    }
  },

  delete: async (id) => {
    try {
      console.log(`🗑️ Deleting prediksi ID: ${id}`)
      const response = await apiClient.delete(`/api/prediksi/${id}`)
      console.log("✅ Prediksi deleted successfully")
      return response
    } catch (error) {
      console.error("❌ Failed to delete prediksi:", error)
      throw error
    }
  },
}

export default prediksiAPI
