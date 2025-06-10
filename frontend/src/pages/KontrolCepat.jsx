"use client"

import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { deviceAPI } from "../utils/api"
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
  FiPower,
  FiPlus,
} from "react-icons/fi"

const KontrolCepat = () => {
  const navigate = useNavigate()
  const [devices, setDevices] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [creating, setCreating] = useState(false)
  const [lastUpdate, setLastUpdate] = useState(null)
  const [message, setMessage] = useState({ type: "", text: "" })

  // State untuk kontrol device - menggunakan struktur yang lebih fleksibel
  const [controls, setControls] = useState({
    pump1: false,
    fan1: false,
    light1: false,
    heater1: false,
    ventilation1: false,
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
      console.log("🔧 Fetching device data...")

      const data = await deviceAPI.getAll()
      console.log("✅ Device data received:", data)

      if (data && Array.isArray(data) && data.length > 0) {
        setDevices(data)

        // Update controls berdasarkan data device yang diterima
        const newControls = {}
        data.forEach((device) => {
          newControls[device.id] = device.status === "on" || device.status === "aktif" || device.status === true
        })
        setControls(newControls)
        setLastUpdate(new Date())
        showMessage("success", `${data.length} device berhasil dimuat dari server`)
      } else {
        // Jika tidak ada data dari API, gunakan device default
        console.log("⚠️ No device data from API, using defaults")
        const defaultDevices = getDefaultDevices()
        setDevices(defaultDevices)

        // Set controls untuk default devices
        const defaultControls = {}
        defaultDevices.forEach((device) => {
          defaultControls[device.id] = false
        })
        setControls(defaultControls)
        setLastUpdate(new Date())
        showMessage("info", "Backend terhubung tapi belum ada device. Menggunakan device default.")
      }
    } catch (error) {
      console.error("❌ Error fetching device data:", error)

      // Fallback ke device default
      const defaultDevices = getDefaultDevices()
      setDevices(defaultDevices)

      const defaultControls = {}
      defaultDevices.forEach((device) => {
        defaultControls[device.id] = false
      })
      setControls(defaultControls)
      setLastUpdate(new Date())
      showMessage("warning", "Gagal mengambil data device. Menggunakan mode demo.")
    } finally {
      setLoading(false)
    }
  }

  const getDefaultDevices = () => {
    return [
      {
        id: "pump1",
        nama: "Pompa Air",
        jenis: "pump",
        status: "off",
        deskripsi: "Pompa penyiraman otomatis",
      },
      {
        id: "fan1",
        nama: "Kipas Ventilasi",
        jenis: "fan",
        status: "off",
        deskripsi: "Kipas sirkulasi udara",
      },
      {
        id: "light1",
        nama: "Lampu LED",
        jenis: "light",
        status: "off",
        deskripsi: "Lampu pertumbuhan tanaman",
      },
      {
        id: "heater1",
        nama: "Pemanas",
        jenis: "heater",
        status: "off",
        deskripsi: "Pemanas greenhouse",
      },
      {
        id: "ventilation1",
        nama: "Ventilasi",
        jenis: "ventilation",
        status: "off",
        deskripsi: "Sistem ventilasi otomatis",
      },
    ]
  }

  const createDevicesInBackend = async () => {
    try {
      setCreating(true)
      console.log("➕ Creating default devices in backend...")

      const defaultDevices = getDefaultDevices()
      let successCount = 0
      let errorCount = 0

      for (const device of defaultDevices) {
        try {
          console.log(`Creating device: ${device.nama}`)
          await deviceAPI.create({
            nama: device.nama,
            jenis: device.jenis,
            status: device.status,
            deskripsi: device.deskripsi,
          })
          successCount++
        } catch (error) {
          console.error(`Failed to create device ${device.nama}:`, error)
          errorCount++
        }
      }

      if (successCount > 0) {
        showMessage("success", `${successCount} device berhasil dibuat di backend`)
        // Refresh data setelah membuat device
        setTimeout(() => {
          fetchDeviceData()
        }, 1000)
      } else {
        showMessage("error", "Gagal membuat device di backend")
      }
    } catch (error) {
      console.error("❌ Error creating devices:", error)
      showMessage("error", "Gagal membuat device di backend")
    } finally {
      setCreating(false)
    }
  }

  const handleControlChange = async (deviceId, value) => {
    try {
      console.log(`🎛️ Changing device ${deviceId} to ${value ? "on" : "off"}`)

      // Update state lokal dulu untuk responsiveness
      setControls((prev) => ({
        ...prev,
        [deviceId]: value,
      }))

      // Coba kirim ke backend
      try {
        const action = value ? "on" : "off"
        await deviceAPI.control(deviceId, action)

        // Update devices state juga
        setDevices((prev) => prev.map((device) => (device.id === deviceId ? { ...device, status: action } : device)))

        showMessage("success", `${getDeviceName(deviceId)} berhasil ${value ? "dinyalakan" : "dimatikan"}`)
        setLastUpdate(new Date())
      } catch (error) {
        console.error("❌ Failed to control device:", error)
        showMessage("warning", `Kontrol ${getDeviceName(deviceId)} gagal. Mode demo aktif.`)
      }
    } catch (error) {
      console.error("❌ Error in handleControlChange:", error)
    }
  }

  const getDeviceName = (deviceId) => {
    const device = devices.find((d) => d.id === deviceId)
    return device?.nama || deviceId
  }

  const getDeviceIcon = (jenis) => {
    switch (jenis) {
      case "pump":
        return FiDroplet
      case "fan":
        return FiWind
      case "light":
        return FiZap
      case "heater":
        return FiThermometer
      case "ventilation":
        return FiWind
      default:
        return FiPower
    }
  }

  const getDeviceColor = (jenis) => {
    switch (jenis) {
      case "pump":
        return "#2196f3"
      case "fan":
        return "#4caf50"
      case "light":
        return "#ffc107"
      case "heater":
        return "#ff5722"
      case "ventilation":
        return "#00bcd4"
      default:
        return "#9e9e9e"
    }
  }

  const saveAllChanges = async () => {
    try {
      setSaving(true)
      console.log("💾 Saving all device changes...")

      let successCount = 0
      let errorCount = 0

      // Simpan semua perubahan
      for (const [deviceId, isOn] of Object.entries(controls)) {
        try {
          const action = isOn ? "on" : "off"
          await deviceAPI.control(deviceId, action)
          successCount++
        } catch (error) {
          console.error(`❌ Failed to save ${deviceId}:`, error)
          errorCount++
        }
      }

      if (successCount > 0) {
        showMessage("success", `${successCount} perangkat berhasil disimpan`)
      }
      if (errorCount > 0) {
        showMessage("warning", `${errorCount} perangkat gagal disimpan (mode demo)`)
      }

      setLastUpdate(new Date())

      // Refresh data setelah save
      setTimeout(() => {
        fetchDeviceData()
      }, 1000)
    } catch (error) {
      console.error("❌ Error saving changes:", error)
      showMessage("error", "Gagal menyimpan perubahan")
    } finally {
      setSaving(false)
    }
  }

  const showMessage = (type, text) => {
    setMessage({ type, text })
    setTimeout(() => {
      setMessage({ type: "", text: "" })
    }, 4000)
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

  // Check if we're using default devices (not from backend)
  const isUsingDefaults =
    devices.length > 0 &&
    devices.every((device) => ["pump1", "fan1", "light1", "heater1", "ventilation1"].includes(device.id))

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
            {isUsingDefaults && (
              <button
                onClick={createDevicesInBackend}
                className={`create-btn ${creating ? "loading" : ""}`}
                disabled={creating}
              >
                <FiPlus className={creating ? "spinning" : ""} />
                <span>{creating ? "Membuat..." : "Buat Device"}</span>
              </button>
            )}
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

      {/* Backend Status Info */}
      {isUsingDefaults && (
        <div className="backend-status-info">
          <div className="status-content">
            <FiAlertCircle className="status-icon" />
            <div className="status-text">
              <h3>Backend Terhubung - Device Kosong</h3>
              <p>
                API device berhasil terhubung tapi belum ada data device. Klik "Buat Device" untuk membuat device
                default di backend.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="kontrol-main">
        {/* Device Status Overview */}
        <section className="status-overview">
          <h2>
            <FiActivity className="section-icon" />
            Status Perangkat Saat Ini
            {isUsingDefaults && <span className="demo-badge">DEMO</span>}
          </h2>
          <div className="status-grid">
            {devices.map((device) => {
              const IconComponent = getDeviceIcon(device.jenis)
              const isActive = controls[device.id]

              return (
                <div key={device.id} className="status-card" style={{ "--device-color": getDeviceColor(device.jenis) }}>
                  <div className="status-header">
                    <IconComponent className="status-icon" />
                    <div className={`status-indicator ${isActive ? "active" : "inactive"}`}>
                      {isActive ? "ON" : "OFF"}
                    </div>
                  </div>
                  <h3>{device.nama}</h3>
                  <p>{device.deskripsi}</p>
                </div>
              )
            })}
          </div>
        </section>

        {/* Control Panel */}
        <section className="control-panel">
          <div className="panel-header">
            <h2>
              <FiSettings className="section-icon" />
              Panel Kontrol
              {isUsingDefaults && <span className="demo-badge">DEMO</span>}
            </h2>
            <p>Ubah pengaturan perangkat sesuai kebutuhan</p>
          </div>

          <div className="control-grid">
            {devices.map((device) => {
              const IconComponent = getDeviceIcon(device.jenis)
              const isActive = controls[device.id]

              return (
                <div
                  key={device.id}
                  className="control-card"
                  style={{ "--device-color": getDeviceColor(device.jenis) }}
                >
                  <div className="control-header">
                    <div className="device-info">
                      <IconComponent className="device-icon" />
                      <div>
                        <h3>{device.nama}</h3>
                        <p>{device.deskripsi}</p>
                      </div>
                    </div>
                    <div className={`current-status ${isActive ? "active" : "inactive"}`}>
                      {isActive ? "ON" : "OFF"}
                    </div>
                  </div>

                  <div className="control-input">
                    <div className="toggle-container">
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={isActive}
                          onChange={(e) => handleControlChange(device.id, e.target.checked)}
                        />
                        <span className="toggle-slider"></span>
                      </label>
                      <span className="toggle-label">{isActive ? "Aktif" : "Nonaktif"}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Save Button */}
          <div className="save-section">
            <button onClick={saveAllChanges} className={`save-btn ${saving ? "saving" : ""}`} disabled={saving}>
              {saving ? (
                <>
                  <FiRefreshCw className="spinning" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <FiSave />
                  <span>Simpan Semua Pengaturan</span>
                </>
              )}
            </button>
            <p className="save-note">
              {isUsingDefaults
                ? "Mode demo aktif - Buat device di backend untuk kontrol real-time"
                : "Perubahan akan diterapkan secara real-time ke semua perangkat"}
            </p>
          </div>
        </section>
      </main>
    </div>
  )
}

export default KontrolCepat
