"use client"

import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { sensorAPI } from "../utils/api"
import {
  FiArrowLeft,
  FiThermometer,
  FiDroplet,
  FiSun,
  FiClock,
  FiActivity,
  FiAlertTriangle,
  FiCheckCircle,
  FiRefreshCw,
  FiWifi,
  FiWifiOff,
  FiMinus,
  FiAlertCircle,
} from "react-icons/fi"

export default function Monitoring() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isOnline, setIsOnline] = useState(true)
  const [lastUpdate, setLastUpdate] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    document.title = "Monitoring - Smart Greenhouse"

    // Cek apakah user sudah login
    const user = JSON.parse(localStorage.getItem("user"))
    if (!user) {
      alert("Anda harus login terlebih dahulu.")
      navigate("/login")
      return
    }

    // Ambil data monitoring pertama kali
    fetchMonitoringData()

    // Auto-refresh setiap 15 detik
    const interval = setInterval(fetchMonitoringData, 15000)
    return () => clearInterval(interval)
  }, [navigate])

  const fetchMonitoringData = async () => {
    try {
      setLoading(true)
      console.log("🔍 Fetching monitoring data...")

      // Gunakan sensorAPI yang sudah berjalan
      const sensorData = await sensorAPI.getLatest()
      console.log("✅ Sensor data received:", sensorData)

      if (sensorData) {
        // Buat analisis dari data sensor
        const analysisData = analyzeData(sensorData)
        setData(analysisData)
        setIsOnline(true)
        setLastUpdate(new Date())
      } else {
        throw new Error("Tidak ada data sensor")
      }
    } catch (error) {
      console.error("❌ Error mengambil data monitoring:", error)
      setIsOnline(false)

      // Set data error untuk ditampilkan
      setData({
        suhu: "❌",
        kelembapan_udara: "❌",
        kelembapan_tanah: "❌",
        cahaya: "❌",
        waktu: "Gagal memuat",
        status: ["Error: Tidak dapat terhubung ke server"],
        rekomendasi: ["Periksa koneksi internet dan server"],
      })
    } finally {
      setLoading(false)
    }
  }

  // Fungsi untuk menganalisis data sensor dan memberikan rekomendasi
  const analyzeData = (sensorData) => {
    const suhu = sensorData.suhu
    const kelembapan_udara = sensorData.kelembapan_udara
    const kelembapan_tanah = sensorData.kelembapan_tanah
    const cahaya = sensorData.cahaya

    const status = []
    const rekomendasi = []

    // Analisis Suhu (Range optimal: 20-30°C)
    if (suhu < 15) {
      status.push("Suhu terlalu rendah")
      rekomendasi.push("Aktifkan pemanas atau tutup ventilasi")
    } else if (suhu > 35) {
      status.push("Suhu terlalu tinggi")
      rekomendasi.push("Buka ventilasi atau aktifkan kipas")
    } else if (suhu >= 20 && suhu <= 30) {
      status.push("Suhu optimal")
    } else {
      status.push("Suhu dalam batas normal")
    }

    // Analisis Kelembapan Udara (Range optimal: 50-70%)
    if (kelembapan_udara < 40) {
      status.push("Kelembapan udara terlalu rendah")
      rekomendasi.push("Aktifkan humidifier untuk meningkatkan kelembapan udara")
    } else if (kelembapan_udara > 85) {
      status.push("Kelembapan udara terlalu tinggi")
      rekomendasi.push("Buka ventilasi dan aktifkan kipas untuk mengurangi kelembapan")
    } else if (kelembapan_udara >= 50 && kelembapan_udara <= 70) {
      status.push("Kelembapan udara optimal")
    } else {
      status.push("Kelembapan udara dalam batas normal")
    }

    // Analisis Kelembapan Tanah (Range optimal: 40-60%)
    if (kelembapan_tanah < 30) {
      status.push("Kelembapan tanah terlalu rendah")
      rekomendasi.push("Lakukan penyiraman segera")
      rekomendasi.push("Periksa sistem irigasi")
    } else if (kelembapan_tanah > 75) {
      status.push("Kelembapan tanah terlalu tinggi")
      rekomendasi.push("Kurangi frekuensi penyiraman")
      rekomendasi.push("Periksa sistem drainase")
    } else if (kelembapan_tanah >= 40 && kelembapan_tanah <= 60) {
      status.push("Kelembapan tanah optimal")
    } else {
      status.push("Kelembapan tanah dalam batas normal")
    }

    // Analisis Cahaya (Range optimal: 800-1200 lux)
    const hour = new Date().getHours()
    const isDayTime = hour >= 6 && hour <= 18

    if (isDayTime) {
      if (cahaya < 500) {
        status.push("Cahaya kurang untuk siang hari")
        rekomendasi.push("Aktifkan lampu tambahan")
      } else if (cahaya >= 800 && cahaya <= 1200) {
        status.push("Cahaya optimal")
      } else if (cahaya > 1200) {
        status.push("Cahaya terlalu terang")
        rekomendasi.push("Gunakan shade cloth atau kurangi intensitas lampu")
      } else {
        status.push("Cahaya cukup")
      }
    } else {
      if (cahaya > 200) {
        status.push("Cahaya terlalu terang untuk malam hari")
        rekomendasi.push("Matikan lampu yang tidak perlu")
      } else {
        status.push("Cahaya malam normal")
      }
    }

    // Jika tidak ada rekomendasi, berarti kondisi baik
    if (rekomendasi.length === 0) {
      rekomendasi.push("Kondisi greenhouse dalam keadaan baik")
    }

    return {
      suhu,
      kelembapan_udara,
      kelembapan_tanah,
      cahaya,
      waktu: sensorData.waktu || sensorData.createdAt || new Date().toISOString(),
      status,
      rekomendasi,
    }
  }

  // Fungsi untuk mendapatkan ikon status berdasarkan teks
  const getStatusIcon = (statusText) => {
    const text = statusText.toLowerCase()
    if (text.includes("optimal")) return <FiCheckCircle className="text-green-500" />
    if (text.includes("terlalu") || text.includes("kurang")) return <FiAlertTriangle className="text-yellow-500" />
    if (text.includes("error")) return <FiAlertCircle className="text-red-500" />
    return <FiMinus className="text-gray-500" />
  }

  // Fungsi untuk format waktu update terakhir
  const formatLastUpdate = (date) => {
    if (!date) return "Tidak ada data"

    const now = new Date()
    const diffMs = now - date
    const diffSecs = Math.floor(diffMs / 1000)
    const diffMins = Math.floor(diffSecs / 60)

    if (diffSecs < 30) return "Baru saja"
    if (diffSecs < 60) return `${diffSecs} detik yang lalu`
    if (diffMins < 60) return `${diffMins} menit yang lalu`

    return date.toLocaleTimeString("id-ID")
  }

  // Loading state
  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Memuat data monitoring...</p>
        </div>
      </div>
    )
  }

  // Pastikan status dan rekomendasi dalam bentuk array
  const statusList = Array.isArray(data.status) ? data.status : [data.status]
  const rekomendasiList = Array.isArray(data.rekomendasi) ? data.rekomendasi : [data.rekomendasi]

  // Tentukan status keseluruhan untuk styling
  const hasAlert = statusList.some((s) => s.toLowerCase().includes("terlalu") || s.toLowerCase().includes("kurang"))
  const hasError = statusList.some((s) => s.toLowerCase().includes("error"))
  const hasOptimal = statusList.some((s) => s.toLowerCase().includes("optimal"))

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate("/dashboard")}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
              >
                <FiArrowLeft />
                <span>Kembali ke Dashboard</span>
              </button>
            </div>

            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <FiActivity className="mr-2" />
                Monitoring Greenhouse
              </h1>
              <p className="text-gray-600">Analisis kondisi dan rekomendasi real-time</p>
            </div>

            <div className="flex items-center space-x-4">
              <div className={`flex items-center space-x-2 ${isOnline ? "text-green-600" : "text-red-600"}`}>
                {isOnline ? <FiWifi /> : <FiWifiOff />}
                <span className="text-sm">{isOnline ? "Online" : "Offline"}</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-600">
                <FiClock />
                <span className="text-sm">Update: {formatLastUpdate(lastUpdate)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4">
        {/* Sensor Data Cards */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <FiThermometer className="mr-2" />
            Data Sensor Terkini
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Card Suhu */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <FiThermometer className="text-red-500 text-2xl" />
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900">{data.suhu}°C</div>
                  <div className="text-sm text-gray-500">Optimal: 20-30°C</div>
                </div>
              </div>
              <h3 className="font-medium text-gray-900">Suhu</h3>
            </div>

            {/* Card Kelembapan Udara */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <FiDroplet className="text-blue-500 text-2xl" />
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900">{data.kelembapan_udara}%</div>
                  <div className="text-sm text-gray-500">Optimal: 50-70%</div>
                </div>
              </div>
              <h3 className="font-medium text-gray-900">Kelembapan Udara</h3>
            </div>

            {/* Card Kelembapan Tanah */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <FiDroplet className="text-green-500 text-2xl" />
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900">{data.kelembapan_tanah}%</div>
                  <div className="text-sm text-gray-500">Optimal: 40-60%</div>
                </div>
              </div>
              <h3 className="font-medium text-gray-900">Kelembapan Tanah</h3>
            </div>

            {/* Card Cahaya */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <FiSun className="text-yellow-500 text-2xl" />
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900">{data.cahaya} lux</div>
                  <div className="text-sm text-gray-500">Optimal: 800-1200 lux</div>
                </div>
              </div>
              <h3 className="font-medium text-gray-900">Cahaya</h3>
            </div>
          </div>
        </div>

        {/* Status Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <FiActivity className="mr-2" />
                Analisis Status
              </h3>
              <button
                onClick={fetchMonitoringData}
                disabled={loading}
                className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                <FiRefreshCw className={loading ? "animate-spin" : ""} />
                <span>{loading ? "Memuat..." : "Refresh"}</span>
              </button>
            </div>

            <div className="space-y-3">
              {statusList.map((status, index) => (
                <div key={index} className="flex items-center space-x-3">
                  {getStatusIcon(status)}
                  <span className="text-gray-700">{status}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Waktu Update */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <FiClock className="mr-2" />
              Waktu Update
            </h3>
            <div className="space-y-2">
              <div className="text-2xl font-bold text-gray-900">
                {data.waktu ? new Date(data.waktu).toLocaleTimeString("id-ID") : "Tidak ada data"}
              </div>
              <div className="text-gray-500">
                {data.waktu ? new Date(data.waktu).toLocaleDateString("id-ID") : "Tidak ada data"}
              </div>
            </div>
          </div>
        </div>

        {/* Recommendations */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <FiCheckCircle className="mr-2" />
            Rekomendasi Tindakan
          </h3>

          <div className="space-y-3">
            {rekomendasiList.map((rekomendasi, index) => (
              <div key={index} className="flex items-start space-x-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                  {index + 1}
                </span>
                <span className="text-gray-700">{rekomendasi}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
