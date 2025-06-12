"use client"

import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import "../styles/Dashboard.css"
import { sensorAPI } from "../utils/sensorapi"
import {
  FiHome,
  FiActivity,
  FiCalendar,
  FiZap,
  FiLogOut,
  FiSettings,
  FiUser,
  FiClock,
  FiTrendingUp,
  FiHeart,
  FiRefreshCw,
  FiWifi,
  FiWifiOff,
  FiAlertTriangle,
  FiThermometer,
  FiDroplet,
  FiSun,
  FiBarChart2,
} from "react-icons/fi"

const Dashboard = () => {
  const navigate = useNavigate()
  const [currentTime, setCurrentTime] = useState(new Date())
  const [user, setUser] = useState(null)
  const [sensorData, setSensorData] = useState([])
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState(null)
  const [isOnline, setIsOnline] = useState(true)
  const [apiEndpoint, setApiEndpoint] = useState(null)

  useEffect(() => {
    document.title = "Dashboard - Smart Greenhouse"

    const userData = JSON.parse(localStorage.getItem("user"))
    if (!userData) {
      alert("Anda harus login terlebih dahulu.")
      navigate("/")
    } else {
      setUser(userData)
      console.log("User data:", userData)
    }

    // Update waktu setiap detik
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    // Ambil data sensor pertama kali
    fetchSensorData()

    // Auto-refresh data sensor setiap 10 detik
    const sensorTimer = setInterval(() => {
      fetchSensorData()
    }, 10000)

    return () => {
      clearInterval(timer)
      clearInterval(sensorTimer)
    }
  }, [navigate])

  const fetchSensorData = async () => {
    try {
      setLoading(true)

      // Gunakan fungsi khusus dashboard dari sensor API
      const result = await sensorAPI.getLatestForDashboard()

      if (result.success && result.data) {
        setApiEndpoint(result.endpoint)
        setIsOnline(true)
        setLastUpdate(result.timestamp)

        // Transform data sesuai format backend dengan kelembapan_udara dan kelembapan_tanah
        const transformedData = [
          {
            title: "Suhu",
            value: `${result.data.suhu}°C`,
            icon: FiThermometer,
            color: "#ff5722",
            rawValue: result.data.suhu,
          },
          {
            title: "Kelembapan Udara",
            value: `${result.data.kelembapan_udara}%`,
            icon: FiDroplet,
            color: "#2196f3",
            rawValue: result.data.kelembapan_udara,
          },
          {
            title: "Kelembapan Tanah",
            value: `${result.data.kelembapan_tanah}%`,
            icon: FiDroplet,
            color: "#8bc34a",
            rawValue: result.data.kelembapan_tanah,
          },
          {
            title: "Cahaya",
            value: `${result.data.cahaya} lux`,
            icon: FiSun,
            color: "#ffc107",
            rawValue: result.data.cahaya,
          },
          {
            title: "Sistem",
            value: "Online",
            icon: FiWifi,
            color: "#4caf50",
            rawValue: 100,
          },
        ]

        setSensorData(transformedData)
      } else {
        throw new Error("Tidak berhasil mengambil data sensor")
      }
    } catch (error) {
      console.error("❌ Error mengambil data sensor:", error)
      setIsOnline(false)
      setApiEndpoint(null)

      // Gunakan data mock yang realistis untuk development/demo
      const mockData = [
        {
          title: "Suhu",
          value: "26°C",
          icon: FiThermometer,
          color: "#ff5722",
          rawValue: 26,
        },
        {
          title: "Kelembapan Udara",
          value: "65%",
          icon: FiDroplet,
          color: "#2196f3",
          rawValue: 65,
        },
        {
          title: "Kelembapan Tanah",
          value: "45%",
          icon: FiDroplet,
          color: "#8bc34a",
          rawValue: 45,
        },
        {
          title: "Cahaya",
          value: "850 lux",
          icon: FiSun,
          color: "#ffc107",
          rawValue: 850,
        },
        {
          title: "Sistem",
          value: "Mode Demo",
          icon: FiWifiOff,
          color: "#ff9800",
          rawValue: 0,
        },
      ]

      setSensorData(mockData)
      setLastUpdate(new Date())
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    if (window.confirm("Apakah Anda yakin ingin logout?")) {
      localStorage.removeItem("user")
      navigate("/")
    }
  }

  const handleRefresh = () => {
    fetchSensorData()
  }

  const formatTime = (date) => {
    return date.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
  }

  const formatDate = (date) => {
    return date.toLocaleDateString("id-ID", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const formatLastUpdate = (date) => {
    if (!date) return "Tidak ada data"

    const now = new Date()
    const diffMs = now - date
    const diffSecs = Math.floor(diffMs / 1000)
    const diffMins = Math.floor(diffMs / 60000)

    if (diffSecs < 30) return "Baru saja"
    if (diffSecs < 60) return `${diffSecs} detik yang lalu`
    if (diffMins < 60) return `${diffMins} menit yang lalu`

    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours} jam yang lalu`

    return date.toLocaleDateString("id-ID")
  }

  const menuItems = [
    {
      title: "Monitoring",
      description: "Pantau kondisi greenhouse secara real-time",
      icon: FiActivity,
      path: "/monitoring",
      color: "#4caf50",
    },
    {
      title: "Prediksi Hasil",
      description: "Estimasi hasil panen berdasarkan data sensor",
      icon: FiBarChart2,
      path: "/prediksi-hasil",
      color: "#ff9800",
    },
    {
      title: "Penjadwalan",
      description: "Atur jadwal penyiraman dan perawatan",
      icon: FiCalendar,
      path: "/penjadwalan",
      color: "#2196f3",
    },
    {
      title: "Kontrol Cepat",
      description: "Kontrol manual perangkat greenhouse",
      icon: FiZap,
      path: "/kontrol-cepat",
      color: "#9c27b0",
    },
  ]

  const getUserName = () => {
    if (user) {
      return user.name || user.username || user.nama || "User"
    }
    return "User"
  }

  return (
    <div className="dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-left">
          <div className="logo">
            <FiTrendingUp className="logo-icon" />
            <h1>Smart Greenhouse</h1>
          </div>
          <div className="header-subtitle">
            <span>Sistem Monitoring Tanaman Greenhouse</span>
          </div>
        </div>

        <div className="header-right">
          <div className="time-display">
            <div className="current-time">
              <FiClock className="time-icon" />
              <span>{formatTime(currentTime)}</span>
            </div>
            <div className="current-date">{formatDate(currentTime)}</div>
          </div>

          <Link to="/profile" className="user-info">
            <FiUser className="user-icon" />
            <span>Selamat datang, {getUserName()}</span>
          </Link>

          <button onClick={handleLogout} className="logout-btn">
            <FiLogOut />
            <span>Logout</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="dashboard-main">
        {/* Welcome Section */}
        <section className="welcome-section">
          <div className="welcome-content">
            <h2>
              <FiHome className="welcome-icon" />
              Selamat Datang, {getUserName()}!
            </h2>
            <p>
              Sistem Monitoring Greenhouse siap membantu Anda memantau dan mengelola tanaman dengan teknologi IoT
              terdepan.
            </p>
            <div className="welcome-stats">
              <div className="stat-item">
                <FiActivity className="stat-icon" />
                <div className="stat-content">
                  <span className="stat-number">24/7</span>
                  <span className="stat-label">Monitoring</span>
                </div>
              </div>
              <div className="stat-item">
                <FiSettings className="stat-icon" />
                <div className="stat-content">
                  <span className="stat-number">5</span>
                  <span className="stat-label">Perangkat</span>
                </div>
              </div>
              <div className="stat-item">
                <FiTrendingUp className="stat-icon" />
                <div className="stat-content">
                  <span className="stat-number">Smart</span>
                  <span className="stat-label">Otomatis</span>
                </div>
              </div>
            </div>
          </div>

          <div className="greenhouse-visual">
            <div className="greenhouse-container">
              <div className="greenhouse-roof"></div>
              <div className="greenhouse-body">
                <div className="plant plant-1">
                  <FiTrendingUp />
                </div>
                <div className="plant plant-2">
                  <FiHeart />
                </div>
                <div className="plant plant-3">
                  <FiTrendingUp />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Sensor Overview */}
        <section className="sensor-overview">
          <div className="sensor-header">
            <h3>
              <FiActivity className="section-icon" />
              Data Sensor Real-time
            </h3>
            <div className="sensor-controls">
              <div className="last-update">
                <span>Update terakhir: {formatLastUpdate(lastUpdate)}</span>
              </div>
              <button className={`refresh-btn ${loading ? "loading" : ""}`} onClick={handleRefresh} disabled={loading}>
                <FiRefreshCw className={loading ? "spinning" : ""} />
                <span>{loading ? "Memuat..." : "Refresh"}</span>
              </button>
            </div>
          </div>

          <div className="connection-status">
            <div className={`status-indicator ${isOnline ? "online" : "offline"}`}>
              {isOnline ? <FiWifi /> : <FiWifiOff />}
              <span>
                {isOnline
                  ? `Terhubung ke Database${apiEndpoint ? ` (${apiEndpoint})` : ""}`
                  : "Mode Demo - Database tidak tersedia"}
              </span>
            </div>

            {!isOnline && (
              <div className="api-help">
                <FiAlertTriangle />
                <span>Pastikan backend server berjalan di port 8080 dan database terhubung</span>
              </div>
            )}
          </div>

          <div className="sensor-grid">
            {sensorData.map((sensor, index) => (
              <div key={index} className="sensor-card" style={{ "--accent-color": sensor.color }}>
                <div className="sensor-header">
                  <sensor.icon className="sensor-icon" />
                </div>
                <div className="sensor-body">
                  <h4>{sensor.title}</h4>
                  <div className="sensor-value">{sensor.value}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Info sistem monitoring */}
          {isOnline && (
            <div className="simulation-info">
              <div className="info-card">
                <FiActivity className="info-icon" />
                <div className="info-content">
                  <h4>Sistem Monitoring Aktif</h4>
                  <p>Data sensor yang ditampilkan diperbarui otomatis setiap 10 detik menggunakan Sensor API</p>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Menu Navigation */}
        <section className="menu-section">
          <div className="menu-header">
            <h3>
              <FiSettings className="section-icon" />
              Menu Utama
            </h3>
            <p className="menu-description">
              Akses fitur-fitur utama Smart Greenhouse System untuk monitoring dan kontrol optimal
            </p>
          </div>
          <div className="menu-grid">
            {menuItems.map((item, index) => (
              <Link key={index} to={item.path} className="menu-card" style={{ "--accent-color": item.color }}>
                <div className="menu-header">
                  <div className="menu-icon-wrapper">
                    <item.icon className="menu-icon" />
                  </div>
                  <div className="menu-badge">
                    {index === 0 && "Real-time"}
                    {index === 1 && "AI Prediksi"}
                    {index === 2 && "Otomatis"}
                    {index === 3 && "Manual"}
                  </div>
                </div>
                <div className="menu-body">
                  <h4>{item.title}</h4>
                  <p>{item.description}</p>
                  <div className="menu-features">
                    {index === 0 && (
                      <>
                        <span>• Data Live</span>
                        <span>• Analisis Kondisi</span>
                        <span>• Rekomendasi</span>
                      </>
                    )}
                    {index === 1 && (
                      <>
                        <span>• Estimasi Panen</span>
                        <span>• Analisis Kesehatan</span>
                        <span>• Prediksi AI</span>
                      </>
                    )}
                    {index === 2 && (
                      <>
                        <span>• Jadwal Fleksibel</span>
                        <span>• Pengingat</span>
                        <span>• Riwayat</span>
                      </>
                    )}
                    {index === 3 && (
                      <>
                        <span>• Kontrol Instan</span>
                        <span>• Semua Perangkat</span>
                        <span>• Status Real-time</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="menu-footer">
                  <span className="menu-action">Buka Menu</span>
                  <div className="menu-arrow">→</div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="dashboard-footer">
        <p>© 2024 Smart Greenhouse System - Teknologi IoT untuk Pertanian Modern</p>
      </footer>
    </div>
  )
}

export default Dashboard
