"use client"

import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import "../styles/PrediksiHasil.css"
import { prediksiAPI } from "../utils/prediksiapi"
import {
  FiArrowLeft,
  FiBarChart2,
  FiCalendar,
  FiClock,
  FiDroplet,
  FiPlusCircle,
  FiRefreshCw,
  FiSun,
  FiThermometer,
  FiTrendingUp,
  FiWifi,
  FiWifiOff,
  FiCheckCircle,
  FiAlertTriangle,
  FiXCircle,
  FiInfo,
  FiTrash2,
} from "react-icons/fi"

const PrediksiHasil = () => {
  const navigate = useNavigate()
  const [prediksi, setPrediksi] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isOnline, setIsOnline] = useState(true)
  const [lastUpdate, setLastUpdate] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    tanaman: "",
    waktu_tanam: new Date().toISOString().split("T")[0],
  })
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState(null)

  // Daftar tanaman yang tersedia untuk prediksi (sesuai dengan backend)
  const daftarTanaman = [
    { id: "tomat", nama: "Tomat", icon: "🍅" },
    { id: "selada", nama: "Selada", icon: "🥬" },
    { id: "cabai", nama: "Cabai", icon: "🌶️" },
    { id: "mentimun", nama: "Mentimun", icon: "🥒" },
    { id: "bayam", nama: "Bayam", icon: "🍃" },
    { id: "lainnya", nama: "Lainnya", icon: "🌱" },
  ]

  useEffect(() => {
    document.title = "Prediksi Hasil - Smart Greenhouse"

    // Cek apakah user sudah login
    const user = JSON.parse(localStorage.getItem("user"))
    if (!user) {
      alert("Anda harus login terlebih dahulu.")
      navigate("/login")
      return
    }

    // Ambil data prediksi saat komponen dimount
    fetchPrediksi()
  }, [navigate])

  // Fungsi untuk mengambil data prediksi terbaru dari server
  const fetchPrediksi = async () => {
    try {
      setLoading(true)
      setError(null)
      console.log("🔍 Mengambil data prediksi hasil panen...")

      // Coba ambil prediksi terbaru terlebih dahulu
      try {
        const latestPrediksi = await prediksiAPI.getLatest()
        if (latestPrediksi) {
          setPrediksi(latestPrediksi)
          setIsOnline(true)
          setLastUpdate(new Date())
          console.log("✅ Data prediksi terbaru berhasil dimuat:", latestPrediksi)
          return
        }
      } catch (err) {
        console.log("❌ Gagal mengambil prediksi terbaru:", err.message)
      }

      // Jika tidak ada prediksi terbaru, coba ambil semua prediksi
      try {
        const allPrediksi = await prediksiAPI.getAll()
        if (allPrediksi && Array.isArray(allPrediksi) && allPrediksi.length > 0) {
          setPrediksi(allPrediksi[0]) // Ambil yang pertama
          setIsOnline(true)
          setLastUpdate(new Date())
          console.log("✅ Data prediksi berhasil dimuat:", allPrediksi[0])
          return
        }
      } catch (err) {
        console.log("❌ Gagal mengambil semua prediksi:", err.message)
      }

      // Jika tidak ada prediksi sama sekali, tampilkan form
      console.log("ℹ️ Tidak ada prediksi yang tersedia, menampilkan form")
      setPrediksi(null)
      setShowForm(true)
      setIsOnline(true)
    } catch (err) {
      console.error("❌ Error mengambil data prediksi:", err)
      setError("Gagal memuat data prediksi: " + err.message)
      setIsOnline(false)
      setShowForm(true)
    } finally {
      setLoading(false)
    }
  }

  // Fungsi untuk handle perubahan input form
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value,
    })
  }

  // Fungsi untuk generate prediksi baru berdasarkan input user
  const handleGeneratePrediksi = async (e) => {
    e.preventDefault()

    // Validasi input form
    if (!formData.tanaman) {
      setError("Silakan pilih jenis tanaman terlebih dahulu")
      return
    }

    try {
      setIsGenerating(true)
      setError(null)
      console.log("🤖 Membuat prediksi hasil panen untuk:", formData)

      const response = await prediksiAPI.generate(formData)

      if (response && response.data) {
        setPrediksi(response.data)
        setIsOnline(true)
        setLastUpdate(new Date())
        setShowForm(false)
        console.log("✅ Prediksi berhasil dibuat:", response.data)
      } else {
        throw new Error("Response tidak valid dari server")
      }
    } catch (err) {
      console.error("❌ Error membuat prediksi:", err)
      setError("Gagal membuat prediksi: " + err.message)
    } finally {
      setIsGenerating(false)
    }
  }

  // Fungsi untuk menghapus prediksi yang ada
  const handleDeletePrediksi = async () => {
    if (!prediksi || !prediksi.id) return

    // Konfirmasi sebelum menghapus
    if (!window.confirm("Apakah Anda yakin ingin menghapus prediksi ini?")) {
      return
    }

    try {
      setLoading(true)
      setError(null)
      console.log(`🗑️ Menghapus prediksi dengan ID: ${prediksi.id}`)

      await prediksiAPI.delete(prediksi.id)
      setPrediksi(null)
      setShowForm(true)
      console.log("✅ Prediksi berhasil dihapus")
    } catch (err) {
      console.error("❌ Error menghapus prediksi:", err)
      setError("Gagal menghapus prediksi: " + err.message)
    } finally {
      setLoading(false)
    }
  }

  // Fungsi untuk format tanggal ke bahasa Indonesia
  const formatDate = (dateString) => {
    const options = { weekday: "long", year: "numeric", month: "long", day: "numeric" }
    return new Date(dateString).toLocaleDateString("id-ID", options)
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

  // Fungsi untuk mendapatkan ikon berdasarkan kualitas prediksi
  const getKualitasIcon = (kualitas) => {
    switch (kualitas) {
      case "tinggi":
        return <FiCheckCircle className="kualitas-icon tinggi" />
      case "sedang":
        return <FiInfo className="kualitas-icon sedang" />
      case "rendah":
        return <FiAlertTriangle className="kualitas-icon rendah" />
      default:
        return <FiInfo className="kualitas-icon" />
    }
  }

  // Fungsi untuk mendapatkan class CSS berdasarkan skor kesehatan
  const getSkorKesehatanClass = (skor) => {
    if (skor >= 80) return "sangat-baik"
    if (skor >= 60) return "baik"
    if (skor >= 40) return "sedang"
    if (skor >= 20) return "buruk"
    return "sangat-buruk"
  }

  // Fungsi untuk mendapatkan lebar progress bar
  const getProgressBarWidth = (skor) => {
    return `${skor}%`
  }

  // Fungsi untuk mendapatkan emoji tanaman berdasarkan jenis
  const getTanamanIcon = (tanaman) => {
    if (!tanaman) return "🌱" // Return default jika tanaman undefined/null

    const found = daftarTanaman.find(
      (item) => item.id === tanaman.toLowerCase() || item.nama.toLowerCase() === tanaman.toLowerCase(),
    )
    return found ? found.icon : "🌱"
  }

  // Render konten prediksi hasil (jika ada data prediksi)
  const renderPrediksiContent = () => {
    if (!prediksi) return null

    // Parse data string menjadi array untuk tampilan yang lebih baik
    const faktorPendukung = prediksi.faktor_pendukung
      ? Array.isArray(prediksi.faktor_pendukung)
        ? prediksi.faktor_pendukung
        : prediksi.faktor_pendukung
            .split(";")
            .map((item) => item.trim())
            .filter((item) => item)
      : []

    const faktorPenghambat = prediksi.faktor_penghambat
      ? Array.isArray(prediksi.faktor_penghambat)
        ? prediksi.faktor_penghambat
        : prediksi.faktor_penghambat
            .split(";")
            .map((item) => item.trim())
            .filter((item) => item)
      : []

    const rekomendasi = prediksi.rekomendasi
      ? Array.isArray(prediksi.rekomendasi)
        ? prediksi.rekomendasi
        : prediksi.rekomendasi
            .split(";")
            .map((item) => item.trim())
            .filter((item) => item)
      : []

    const dataHistoris = prediksi.data_historis || {}

    return (
      <div className="prediksi-content">
        {/* Header Prediksi dengan Info Tanaman */}
        <div className="prediksi-header">
          <div className="tanaman-info">
            <div className="tanaman-icon">{getTanamanIcon(prediksi.tanaman)}</div>
            <div className="tanaman-details">
              <h3>{prediksi.tanaman}</h3>
              <div className="tanaman-dates">
                <div className="date-item">
                  <FiCalendar />
                  <span>Ditanam: {formatDate(prediksi.waktu_tanam)}</span>
                </div>
                <div className="date-item">
                  <FiCalendar />
                  <span>Estimasi Panen: {formatDate(prediksi.estimasi_waktu_panen)}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="prediksi-actions">
            <button className="refresh-btn" onClick={fetchPrediksi} disabled={loading}>
              <FiRefreshCw className={loading ? "spinning" : ""} />
              <span>{loading ? "Memuat..." : "Refresh"}</span>
            </button>
            <button className="delete-btn" onClick={handleDeletePrediksi} disabled={loading}>
              <FiTrash2 />
              <span>Hapus</span>
            </button>
          </div>
        </div>

        {/* Cards Utama - Estimasi dan Kesehatan */}
        <div className="prediksi-cards">
          {/* Card Estimasi Hasil Panen */}
          <div className="prediksi-card estimasi">
            <div className="card-header">
              <FiBarChart2 className="card-icon" />
              <h4>Estimasi Hasil Panen</h4>
            </div>
            <div className="card-body">
              <div className="estimasi-value">{prediksi.estimasi_panen} kg/m²</div>
              <div className="kualitas-badge">
                {getKualitasIcon(prediksi.kualitas_prediksi)}
                <span>Kualitas Prediksi: {prediksi.kualitas_prediksi}</span>
              </div>
            </div>
          </div>

          {/* Card Skor Kesehatan Tanaman */}
          <div className="prediksi-card kesehatan">
            <div className="card-header">
              <FiTrendingUp className="card-icon" />
              <h4>Skor Kesehatan Tanaman</h4>
            </div>
            <div className="card-body">
              <div className={`kesehatan-score ${getSkorKesehatanClass(prediksi.skor_kesehatan)}`}>
                {prediksi.skor_kesehatan}
              </div>
              <div className="progress-bar">
                <div
                  className={`progress ${getSkorKesehatanClass(prediksi.skor_kesehatan)}`}
                  style={{ width: getProgressBarWidth(prediksi.skor_kesehatan) }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Detail Analisis - Faktor dan Rekomendasi */}
        <div className="prediksi-details">
          {/* Faktor Pendukung */}
          <div className="detail-section">
            <h4>
              <FiCheckCircle className="section-icon positive" />
              Faktor Pendukung
            </h4>
            <ul className="detail-list positive">
              {faktorPendukung.length > 0 ? (
                faktorPendukung.map((faktor, index) => <li key={index}>{faktor}</li>)
              ) : (
                <li className="empty-list">Tidak ada faktor pendukung yang teridentifikasi</li>
              )}
            </ul>
          </div>

          {/* Faktor Penghambat */}
          <div className="detail-section">
            <h4>
              <FiXCircle className="section-icon negative" />
              Faktor Penghambat
            </h4>
            <ul className="detail-list negative">
              {faktorPenghambat.length > 0 ? (
                faktorPenghambat.map((faktor, index) => <li key={index}>{faktor}</li>)
              ) : (
                <li className="empty-list">Tidak ada faktor penghambat yang teridentifikasi</li>
              )}
            </ul>
          </div>

          {/* Rekomendasi Tindakan */}
          <div className="detail-section">
            <h4>
              <FiInfo className="section-icon info" />
              Rekomendasi
            </h4>
            <ul className="detail-list info">
              {rekomendasi.length > 0 ? (
                rekomendasi.map((item, index) => <li key={index}>{item}</li>)
              ) : (
                <li className="empty-list">Tidak ada rekomendasi khusus</li>
              )}
            </ul>
          </div>
        </div>

        {/* Data Historis yang Digunakan untuk Prediksi */}
        {dataHistoris && Object.keys(dataHistoris).length > 0 && (
          <div className="data-historis">
            <h4>
              <FiBarChart2 className="section-icon" />
              Data Historis yang Digunakan
            </h4>
            <div className="historis-grid">
              <div className="historis-item">
                <FiThermometer className="historis-icon suhu" />
                <div className="historis-content">
                  <div className="historis-label">Rata-rata Suhu</div>
                  <div className="historis-value">{dataHistoris.avg_suhu}°C</div>
                </div>
              </div>
              <div className="historis-item">
                <FiDroplet className="historis-icon kelembapan-udara" />
                <div className="historis-content">
                  <div className="historis-label">Rata-rata Kelembapan Udara</div>
                  <div className="historis-value">{dataHistoris.avg_kelembapan_udara}%</div>
                </div>
              </div>
              <div className="historis-item">
                <FiDroplet className="historis-icon kelembapan-tanah" />
                <div className="historis-content">
                  <div className="historis-label">Rata-rata Kelembapan Tanah</div>
                  <div className="historis-value">{dataHistoris.avg_kelembapan_tanah}%</div>
                </div>
              </div>
              <div className="historis-item">
                <FiSun className="historis-icon cahaya" />
                <div className="historis-content">
                  <div className="historis-label">Rata-rata Cahaya</div>
                  <div className="historis-value">{dataHistoris.avg_cahaya} lux</div>
                </div>
              </div>
              <div className="historis-item">
                <FiBarChart2 className="historis-icon data" />
                <div className="historis-content">
                  <div className="historis-label">Jumlah Data</div>
                  <div className="historis-value">{dataHistoris.jumlah_data} sampel</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Render form untuk membuat prediksi baru
  const renderPrediksiForm = () => {
    return (
      <div className="prediksi-form-container">
        <div className="form-header">
          <h3>
            <FiPlusCircle className="form-icon" />
            Buat Prediksi Hasil Baru
          </h3>
          <p>Masukkan informasi tanaman untuk membuat prediksi hasil panen</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="error-message">
            <FiAlertTriangle />
            <span>{error}</span>
          </div>
        )}

        {/* Form Input */}
        <form onSubmit={handleGeneratePrediksi} className="prediksi-form">
          {/* Pilihan Jenis Tanaman */}
          <div className="form-group">
            <label htmlFor="tanaman">Jenis Tanaman</label>
            <select id="tanaman" name="tanaman" value={formData.tanaman} onChange={handleInputChange} required>
              <option value="">-- Pilih Tanaman --</option>
              {daftarTanaman.map((tanaman) => (
                <option key={tanaman.id} value={tanaman.id}>
                  {tanaman.icon} {tanaman.nama}
                </option>
              ))}
            </select>
          </div>

          {/* Input Tanggal Tanam */}
          <div className="form-group">
            <label htmlFor="waktu_tanam">Tanggal Tanam</label>
            <input
              type="date"
              id="waktu_tanam"
              name="waktu_tanam"
              value={formData.waktu_tanam}
              onChange={handleInputChange}
              required
            />
          </div>

          {/* Tombol Submit */}
          <div className="form-actions">
            <button type="submit" className="generate-btn" disabled={isGenerating}>
              {isGenerating ? (
                <>
                  <FiRefreshCw className="spinning" />
                  <span>Membuat Prediksi...</span>
                </>
              ) : (
                <>
                  <FiBarChart2 />
                  <span>Buat Prediksi</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Informasi Tambahan */}
        <div className="form-info">
          <h4>
            <FiInfo className="info-icon" />
            Informasi
          </h4>
          <p>
            Prediksi hasil panen dibuat berdasarkan data sensor yang telah dikumpulkan oleh sistem. Semakin banyak data
            yang tersedia, semakin akurat prediksi yang dihasilkan.
          </p>
          <p>Faktor yang mempengaruhi prediksi:</p>
          <ul>
            <li>Suhu greenhouse</li>
            <li>Kelembapan udara</li>
            <li>Kelembapan tanah</li>
            <li>Intensitas cahaya</li>
            <li>Jenis tanaman</li>
            <li>Waktu tanam</li>
          </ul>
        </div>
      </div>
    )
  }

  return (
    <div className="prediksi-body">
      {/* Header */}
      <header className="prediksi-header">
        <button className="back-button" onClick={() => navigate("/dashboard")}>
          <FiArrowLeft className="back-icon" />
          <span>Kembali ke Dashboard</span>
        </button>

        <div className="header-content">
          <div className="header-title">
            <FiBarChart2 className="header-icon" />
            <h1>Prediksi Hasil Panen</h1>
          </div>
          <p>Analisis dan estimasi hasil panen berdasarkan data sensor</p>
        </div>

        <div className="header-status">
          <div className="connection-status">
            <div className={`status-indicator ${isOnline ? "online" : "offline"}`}>
              {isOnline ? <FiWifi /> : <FiWifiOff />}
              <span>{isOnline ? "Terhubung" : "Offline"}</span>
            </div>
          </div>
          {lastUpdate && (
            <div className="last-update">
              <FiClock />
              <span>Update: {formatLastUpdate(lastUpdate)}</span>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="prediksi-main">
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Memuat data prediksi...</p>
          </div>
        ) : (
          <>
            {/* Tampilkan konten prediksi jika ada data */}
            {prediksi ? renderPrediksiContent() : renderPrediksiForm()}

            {/* Tombol untuk membuat prediksi baru (jika sudah ada prediksi) */}
            {!showForm && prediksi && (
              <div className="new-prediksi-button-container">
                <button className="new-prediksi-button" onClick={() => setShowForm(true)}>
                  <FiPlusCircle />
                  <span>Buat Prediksi Baru</span>
                </button>
              </div>
            )}

            {/* Modal form untuk prediksi baru (jika sudah ada prediksi) */}
            {showForm && prediksi && (
              <div className="prediksi-form-overlay">
                <div className="prediksi-form-modal">
                  <div className="modal-header">
                    <h3>Buat Prediksi Baru</h3>
                    <button className="close-modal" onClick={() => setShowForm(false)}>
                      ×
                    </button>
                  </div>
                  {renderPrediksiForm()}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}

export default PrediksiHasil
