"use client"

import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import "../styles/KontrolCepat.css"
import {
  FiZap,
  FiWind,
  FiDroplet,
  FiThermometer,
  FiRefreshCw,
  FiSave,
  FiArrowLeft,
  FiActivity,
  FiAlertCircle,
  FiCheckCircle,
  FiClock,
  FiSettings,
} from "react-icons/fi"

const KontrolCepat = () => {
  const navigate = useNavigate()
  const [devices, setDevices] = useState([])
  const [currentDevice, setCurrentDevice] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [lastUpdate, setLastUpdate] = useState(null)
  const [message, setMessage] = useState({ type: "", text: "" })

  // State untuk kontrol device
  const [controls, setControls] = useState({
    lampu: false,
    ventilasi: "tutup",
    humidifier: false,
    kipas: false,
    pemanas: false,
  })

  useEffect(() => {
    document.title = "Kontrol Cepat - Smart Greenhouse"

    // Cek user login
    const userData = JSON.parse(localStorage.getItem("user"))
    if (!userData) {
      alert("Anda harus login terlebih dahulu.")
      navigate("/")
      return
    }

    fetchDeviceData()
  }, [navigate])

  const fetchDeviceData = async () => {
    try {
      setLoading(true)

      // Coba berbagai endpoint
      const endpoints = [`${window.location.origin}/api/device`, "http://localhost:5000/api/device", "/api/device"]

      let response = null
      let data = null

      for (const endpoint of endpoints) {
        try {
          console.log(`🔍 Mencoba endpoint: ${endpoint}`)

          // Menggunakan axios dengan konfigurasi timeout
          response = await axios({
            method: "GET",
            url: endpoint,
            headers: { "Content-Type": "application/json" },
            timeout: 5000,
          })

          if (response.status === 200 && response.data) {
            data = response.data
            console.log(`✅ Berhasil dengan endpoint: ${endpoint}`, data)
            break
          }
        } catch (err) {
          console.log(`❌ Error endpoint: ${endpoint} - ${err.message}`)
          continue
        }
      }

      if (data && Array.isArray(data) && data.length > 0) {
        setDevices(data)
        const latestDevice = data[0] // Ambil device terbaru
        setCurrentDevice(latestDevice)
        setControls({
          lampu: latestDevice.lampu || false,
          ventilasi: latestDevice.ventilasi || "tutup",
          humidifier: latestDevice.humidifier || false,
          kipas: latestDevice.kipas || false,
          pemanas: latestDevice.pemanas || false,
        })
        setLastUpdate(new Date(latestDevice.updatedAt || latestDevice.createdAt))
      } else {
        // Jika tidak ada data, buat device default
        await createDefaultDevice()
      }
    } catch (error) {
      console.error("❌ Error mengambil data device:", error)
      showMessage("error", "Gagal mengambil data device. Menggunakan mode demo.")

      // Set default values untuk demo
      setControls({
        lampu: false,
        ventilasi: "tutup",
        humidifier: false,
        kipas: false,
        pemanas: false,
      })
      setLastUpdate(new Date())
    } finally {
      setLoading(false)
    }
  }

  const createDefaultDevice = async () => {
    try {
      const defaultData = {
        lampu: false,
        ventilasi: "tutup",
        humidifier: false,
        kipas: false,
        pemanas: false,
      }

      // Menggunakan axios untuk POST request
      const response = await axios({
        method: "POST",
        url: "/api/device",
        headers: { "Content-Type": "application/json" },
        data: defaultData,
        timeout: 5000,
      })

      if (response.status === 200 || response.status === 201) {
        const newDevice = response.data
        setCurrentDevice(newDevice.data)
        setControls(defaultData)
        setLastUpdate(new Date())
        showMessage("success", "Device default berhasil dibuat")
      }
    } catch (error) {
      console.error("Error membuat device default:", error)
    }
  }

  const handleControlChange = (deviceName, value) => {
    setControls((prev) => ({
      ...prev,
      [deviceName]: value,
    }))
  }

  const saveChanges = async () => {
    if (!currentDevice && devices.length === 0) {
      showMessage("error", "Tidak ada device yang tersedia")
      return
    }

    try {
      setSaving(true)

      const deviceId = currentDevice?.id || 1 // Default ID jika tidak ada
      const endpoint = `/api/device/${deviceId}`

      console.log("🔄 Menyimpan perubahan:", controls)

      // Menggunakan axios untuk PUT request
      const response = await axios({
        method: "PUT",
        url: endpoint,
        headers: { "Content-Type": "application/json" },
        data: controls,
        timeout: 10000, // Timeout lebih lama untuk save operation
      })

      if (response.status === 200) {
        const result = response.data
        console.log("✅ Berhasil menyimpan:", result)

        setCurrentDevice(result.data)
        setLastUpdate(new Date())
        showMessage("success", "Pengaturan device berhasil disimpan!")

        // Refresh data setelah 1 detik
        setTimeout(() => {
          fetchDeviceData()
        }, 1000)
      } else {
        throw new Error(`HTTP ${response.status}`)
      }
    } catch (error) {
      console.error("❌ Error menyimpan:", error)
      showMessage("error", "Gagal menyimpan pengaturan. Mode demo aktif.")

      // Simulasi berhasil untuk demo
      setLastUpdate(new Date())
      setTimeout(() => {
        showMessage("success", "Pengaturan tersimpan (mode demo)")
      }, 500)
    } finally {
      setSaving(false)
    }
  }

  const showMessage = (type, text) => {
    setMessage({ type, text })
    setTimeout(() => {
      setMessage({ type: "", text: "" })
    }, 3000)
  }

  const formatLastUpdate = (date) => {
    if (!date) return "Tidak ada data"

    const now = new Date()
    const diffMs = now - date
    const diffSecs = Math.floor(diffMs / 1000)
    const diffMins = Math.floor(diffSecs / 60)

    if (diffSecs < 30) return "Baru saja"
    if (diffSecs < 60) return `${diffSecs} detik yang lalu`
    if (diffMins < 60) return `${diffMins} menit yang lalu`

    return date.toLocaleString("id-ID")
  }

  // Konfigurasi device
  const deviceConfigs = [
    {
      key: "lampu",
      title: "Lampu LED",
      icon: FiZap,
      color: "#ffc107",
      type: "toggle",
      description: "Kontrol pencahayaan greenhouse",
    },
    {
      key: "ventilasi",
      title: "Ventilasi",
      icon: FiWind,
      color: "#2196f3",
      type: "select",
      options: [
        { value: "tutup", label: "Tutup" },
        { value: "buka", label: "Buka" },
      ],
      description: "Kontrol sirkulasi udara",
    },
    {
      key: "humidifier",
      title: "Humidifier",
      icon: FiDroplet,
      color: "#00bcd4",
      type: "toggle",
      description: "Kontrol kelembapan udara",
    },
    {
      key: "kipas",
      title: "Kipas",
      icon: FiWind,
      color: "#4caf50", // Warna hijau, beda dengan ventilasi yang biru
      type: "toggle",
      description: "Kontrol sirkulasi udara internal",
    },
    {
      key: "pemanas",
      title: "Pemanas",
      icon: FiThermometer,
      color: "#ff5722",
      type: "toggle",
      description: "Kontrol suhu greenhouse",
    },
  ]

  if (loading) {
    return (
      <div className="kontrol-cepat">
        <div className="loading-container">
          <div className="loading-spinner">
            <FiRefreshCw className="spinning" />
          </div>
          <p>Memuat data device...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="kontrol-cepat">
      {/* Header */}
      <header className="kontrol-header">
        <div className="header-left">
          <button onClick={() => navigate("/dashboard")} className="back-btn">
            <FiArrowLeft />
            <span>Kembali</span>
          </button>
          <div className="header-title">
            <h1>
              <FiZap className="title-icon" />
              Kontrol Cepat
            </h1>
            <p>Kontrol manual semua perangkat greenhouse</p>
          </div>
        </div>

        <div className="header-right">
          <div className="status-info">
            <div className="last-update">
              <FiClock className="clock-icon" />
              <span>Update: {formatLastUpdate(lastUpdate)}</span>
            </div>
            <button onClick={fetchDeviceData} className={`refresh-btn ${loading ? "loading" : ""}`} disabled={loading}>
              <FiRefreshCw className={loading ? "spinning" : ""} />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </header>

      {/* Message Alert */}
      {message.text && (
        <div className={`message-alert ${message.type}`}>
          {message.type === "success" ? <FiCheckCircle /> : <FiAlertCircle />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Main Content */}
      <main className="kontrol-main">
        {/* Device Status Overview */}
        <section className="status-overview">
          <h2>
            <FiActivity className="section-icon" />
            Status Perangkat Saat Ini
          </h2>
          <div className="status-grid">
            {deviceConfigs.map((device) => (
              <div key={device.key} className="status-card" style={{ "--device-color": device.color }}>
                <div className="status-header">
                  <device.icon className="status-icon" />
                  <div
                    className={`status-indicator ${
                      device.type === "toggle"
                        ? controls[device.key]
                          ? "active"
                          : "inactive"
                        : controls[device.key] === "buka"
                          ? "active"
                          : "inactive"
                    }`}
                  >
                    {device.type === "toggle"
                      ? controls[device.key]
                        ? "ON"
                        : "OFF"
                      : controls[device.key].toUpperCase()}
                  </div>
                </div>
                <h3>{device.title}</h3>
                <p>{device.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Control Panel */}
        <section className="control-panel">
          <div className="panel-header">
            <h2>
              <FiSettings className="section-icon" />
              Panel Kontrol
            </h2>
            <p>Ubah pengaturan perangkat sesuai kebutuhan</p>
          </div>

          <div className="control-grid">
            {deviceConfigs.map((device) => (
              <div key={device.key} className="control-card" style={{ "--device-color": device.color }}>
                <div className="control-header">
                  <div className="device-info">
                    <device.icon className="device-icon" />
                    <div>
                      <h3>{device.title}</h3>
                      <p>{device.description}</p>
                    </div>
                  </div>
                  <div
                    className={`current-status ${
                      device.type === "toggle"
                        ? controls[device.key]
                          ? "active"
                          : "inactive"
                        : controls[device.key] === "buka"
                          ? "active"
                          : "inactive"
                    }`}
                  >
                    {device.type === "toggle"
                      ? controls[device.key]
                        ? "ON"
                        : "OFF"
                      : controls[device.key].toUpperCase()}
                  </div>
                </div>

                <div className="control-input">
                  {device.type === "toggle" ? (
                    <div className="toggle-container">
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={controls[device.key]}
                          onChange={(e) => handleControlChange(device.key, e.target.checked)}
                        />
                        <span className="toggle-slider"></span>
                      </label>
                      <span className="toggle-label">{controls[device.key] ? "Aktif" : "Nonaktif"}</span>
                    </div>
                  ) : (
                    <div className="select-container">
                      <select
                        value={controls[device.key]}
                        onChange={(e) => handleControlChange(device.key, e.target.value)}
                        className="control-select"
                      >
                        {device.options.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Save Button */}
          <div className="save-section">
            <button onClick={saveChanges} className={`save-btn ${saving ? "saving" : ""}`} disabled={saving}>
              {saving ? (
                <>
                  <FiRefreshCw className="spinning" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <FiSave />
                  <span>Simpan Pengaturan</span>
                </>
              )}
            </button>
            <p className="save-note">Perubahan akan diterapkan secara real-time ke semua perangkat</p>
          </div>
        </section>
      </main>
    </div>
  )
}

export default KontrolCepat
