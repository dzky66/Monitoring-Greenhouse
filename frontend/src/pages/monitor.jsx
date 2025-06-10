"use client"

import { useEffect, useState } from "react"
import "../styles/Monitoring.css"
import { useNavigate } from "react-router-dom"
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
  FiTrendingUp,
  FiTrendingDown,
  FiMinus,
  FiAlertCircle,
} from "react-icons/fi"

const Monitoring = () => {
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

      // Dapatkan token dari localStorage
      const token = localStorage.getItem("token")
      const headers = token ? { Authorization: `Bearer ${token}` } : {}

      // Coba endpoint monitoring terlebih dahulu, jika gagal gunakan data sensor
      const baseUrl = import.meta.env.VITE_API_URL || "https://monitoring-greenhouse-production.up.railway.app"

      const endpoints = [
        `${baseUrl}/api/monitoring`,
        `${baseUrl}/api/data-sensor/latest`,
        "/api/monitoring",
        "/api/data-sensor/latest",
      ]

      let response = null
      let fetchedData = null

      // Coba setiap endpoint sampai ada yang berhasil
      for (const endpoint of endpoints) {
        try {
          console.log(`🔍 Mencoba endpoint monitoring: ${endpoint}`)

          // Menggunakan fetch API dengan timeout
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 5000)

          response = await fetch(endpoint, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              ...headers,
            },
            signal: controller.signal,
          })

          clearTimeout(timeoutId)

          if (response.ok) {
            fetchedData = await response.json()
            console.log(`✅ Berhasil mengambil data dari: ${endpoint}`)
            console.log("📊 Data:", fetchedData)
            break
          }
        } catch (err) {
          console.log(`❌ Gagal endpoint: ${endpoint} - ${err.message}`)
          continue
        }
      }

      if (fetchedData) {
        // Jika data dari endpoint monitoring (sudah ada analisis)
        if (fetchedData.status && fetchedData.rekomendasi) {
          // Pastikan status dan rekomendasi dalam bentuk array
          if (!Array.isArray(fetchedData.status)) {
            fetchedData.status = fetchedData.status.split("; ")
          }
          if (!Array.isArray(fetchedData.rekomendasi)) {
            fetchedData.rekomendasi = fetchedData.rekomendasi.split("; ")
          }

          setData(fetchedData)
        } else {
          // Jika data dari data sensor, buat analisis sendiri
          const analysisData = analyzeData(fetchedData)
          setData(analysisData)
        }
        setIsOnline(true)
        setLastUpdate(new Date())
      } else {
        throw new Error("Tidak ada endpoint yang tersedia")
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
    const kelembapan_udara = sensorData.kelembapan_udara || sensorData.kelembapan // fallback untuk data lama
    const kelembapan_tanah = sensorData.kelembapan_tanah || sensorData.kelembapan // fallback untuk data lama
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
      // Analisis untuk siang hari
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
      // Analisis untuk malam hari
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
    if (text.includes("optimal")) return <FiCheckCircle className="status-icon optimal" />
    if (text.includes("terlalu") || text.includes("kurang")) return <FiAlertTriangle className="status-icon warning" />
    if (text.includes("error")) return <FiAlertCircle className="status-icon error" />
    return <FiMinus className="status-icon normal" />
  }

  // Fungsi untuk mendapatkan class CSS berdasarkan status
  const getStatusClass = (statusText) => {
    const text = statusText.toLowerCase()
    if (text.includes("optimal")) return "optimal"
    if (text.includes("terlalu") || text.includes("kurang")) return "warning"
    if (text.includes("error")) return "error"
    return "normal"
  }

  // Fungsi untuk mendapatkan ikon trend berdasarkan nilai
  const getTrendIcon = (value, type) => {
    // Simulasi trend berdasarkan nilai (bisa diganti dengan data historis)
    if (type === "suhu") {
      if (value > 28) return <FiTrendingUp className="trend-up" />
      if (value < 22) return <FiTrendingDown className="trend-down" />
    } else if (type === "kelembapan_udara") {
      if (value > 75) return <FiTrendingUp className="trend-up" />
      if (value < 45) return <FiTrendingDown className="trend-down" />
    } else if (type === "kelembapan_tanah") {
      if (value > 65) return <FiTrendingUp className="trend-up" />
      if (value < 35) return <FiTrendingDown className="trend-down" />
    } else if (type === "cahaya") {
      if (value > 1000) return <FiTrendingUp className="trend-up" />
      if (value < 600) return <FiTrendingDown className="trend-down" />
    }
    return <FiMinus className="trend-stable" />
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
      <div className="monitoring-body">
        <div className="loading-container">
          <div className="loading-spinner"></div>
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
    <div className="monitoring-body">
      {/* Header */}
      <header className="monitoring-header">
        <button className="back-button" onClick={() => navigate("/dashboard")}>
          <FiArrowLeft className="back-icon" />
          <span>Kembali ke Dashboard</span>
        </button>

        <div className="header-content">
          <div className="header-title">
            <FiActivity className="header-icon" />
            <h1>Monitoring Greenhouse</h1>
          </div>
          <p>Analisis kondisi dan rekomendasi real-time</p>
        </div>

        <div className="header-status">
          <div className="connection-status">
            <div className={`status-indicator ${isOnline ? "online" : "offline"}`}>
              {isOnline ? <FiWifi /> : <FiWifiOff />}
              <span>{isOnline ? "Terhubung" : "Offline"}</span>
            </div>
          </div>
          <div className="last-update">
            <FiClock />
            <span>Update: {formatLastUpdate(lastUpdate)}</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="monitoring-main">
        {/* Sensor Data Cards */}
        <section className="sensor-section">
          <h2>
            <FiThermometer className="section-icon" />
            Data Sensor Terkini
          </h2>

          <div className="sensor-grid">
            {/* Card Suhu */}
            <div className="sensor-card temperature">
              <div className="card-header">
                <FiThermometer className="card-icon" />
                <div className="card-trend">{getTrendIcon(data.suhu, "suhu")}</div>
              </div>
              <div className="card-body">
                <h3>Suhu</h3>
                <div className="card-value">{data.suhu}°C</div>
                <div className="card-range">Optimal: 20-30°C</div>
              </div>
            </div>

            {/* Card Kelembapan Udara */}
            <div className="sensor-card humidity-air">
              <div className="card-header">
                <FiDroplet className="card-icon" />
                <div className="card-trend">{getTrendIcon(data.kelembapan_udara, "kelembapan_udara")}</div>
              </div>
              <div className="card-body">
                <h3>Kelembapan Udara</h3>
                <div className="card-value">{data.kelembapan_udara}%</div>
                <div className="card-range">Optimal: 50-70%</div>
              </div>
            </div>

            {/* Card Kelembapan Tanah */}
            <div className="sensor-card humidity-soil">
              <div className="card-header">
                <FiDroplet className="card-icon" />
                <div className="card-trend">{getTrendIcon(data.kelembapan_tanah, "kelembapan_tanah")}</div>
              </div>
              <div className="card-body">
                <h3>Kelembapan Tanah</h3>
                <div className="card-value">{data.kelembapan_tanah}%</div>
                <div className="card-range">Optimal: 40-60%</div>
              </div>
            </div>

            {/* Card Cahaya */}
            <div className="sensor-card light">
              <div className="card-header">
                <FiSun className="card-icon" />
                <div className="card-trend">{getTrendIcon(data.cahaya, "cahaya")}</div>
              </div>
              <div className="card-body">
                <h3>Cahaya</h3>
                <div className="card-value">{data.cahaya} lux</div>
                <div className="card-range">Optimal: 800-1200 lux</div>
              </div>
            </div>

            {/* Card Waktu Update */}
            <div className="sensor-card time">
              <div className="card-header">
                <FiClock className="card-icon" />
              </div>
              <div className="card-body">
                <h3>Waktu Update</h3>
                <div className="card-value">{new Date(data.waktu).toLocaleTimeString("id-ID")}</div>
                <div className="card-range">{new Date(data.waktu).toLocaleDateString("id-ID")}</div>
              </div>
            </div>
          </div>
        </section>

        {/* Status Analysis */}
        <section className="status-section">
          <h2>
            <FiActivity className="section-icon" />
            Analisis Status
          </h2>

          <div
            className={`status-container ${
              hasError ? "status-error" : hasAlert ? "status-warning" : hasOptimal ? "status-optimal" : "status-normal"
            }`}
          >
            <div className="status-header">
              <div className="status-title">
                {hasError ? (
                  <FiAlertCircle className="status-main-icon error" />
                ) : hasAlert ? (
                  <FiAlertTriangle className="status-main-icon warning" />
                ) : hasOptimal ? (
                  <FiCheckCircle className="status-main-icon optimal" />
                ) : (
                  <FiMinus className="status-main-icon normal" />
                )}
                <h3>
                  {hasError
                    ? "Sistem Error"
                    : hasAlert
                      ? "Perlu Perhatian"
                      : hasOptimal
                        ? "Kondisi Optimal"
                        : "Kondisi Normal"}
                </h3>
              </div>
              <button className="refresh-btn" onClick={fetchMonitoringData} disabled={loading}>
                <FiRefreshCw className={loading ? "spinning" : ""} />
                <span>{loading ? "Memuat..." : "Refresh"}</span>
              </button>
            </div>

            <div className="status-list">
              {statusList.map((status, index) => (
                <div key={index} className={`status-item ${getStatusClass(status)}`}>
                  {getStatusIcon(status)}
                  <span>{status}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Recommendations */}
        <section className="recommendation-section">
          <h2>
            <FiCheckCircle className="section-icon" />
            Rekomendasi Tindakan
          </h2>

          <div className="recommendation-container">
            {rekomendasiList.map((rekomendasi, index) => (
              <div key={index} className="recommendation-item">
                <div className="recommendation-number">{index + 1}</div>
                <div className="recommendation-content">
                  <p>{rekomendasi}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}

export default Monitoring
