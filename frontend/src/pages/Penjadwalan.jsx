"use client"

import "../styles/jadwal.css"
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import { FiArrowLeft, FiPlus, FiX, FiEdit2, FiTrash2, FiClock, FiCalendar, FiDroplet } from "react-icons/fi"

const Penjadwalan = () => {
  const navigate = useNavigate()
  const [jadwalList, setJadwalList] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [currentId, setCurrentId] = useState(null)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    frekuensiPenyiraman: 1,
    jamPenyiraman: ["08:00"],
  })
  const [errors, setErrors] = useState({})

  // Ambil data jadwal saat komponen dimount
  useEffect(() => {
    document.title = "Penjadwalan Penyiraman - Smart Greenhouse"
    fetchJadwal()
  }, [])

  // Fungsi untuk mengambil data jadwal dari server
  const fetchJadwal = async () => {
    try {
      setLoading(true)
      console.log("🔍 Mengambil data jadwal penyiraman...")

      // Menggunakan axios untuk GET request
      const response = await axios({
        method: "GET",
        url: "/api/penjadwalan",
        timeout: 5000,
        headers: {
          "Content-Type": "application/json",
        },
      })

      const data = response.data

      // Pastikan jamPenyiraman selalu dalam bentuk array
      const processedData = data.map((jadwal) => ({
        ...jadwal,
        jamPenyiraman: Array.isArray(jadwal.jamPenyiraman)
          ? jadwal.jamPenyiraman
          : typeof jadwal.jamPenyiraman === "string"
            ? JSON.parse(jadwal.jamPenyiraman)
            : [jadwal.jamPenyiraman].filter(Boolean),
      }))

      setJadwalList(processedData)
      console.log("✅ Data jadwal berhasil diambil:", processedData)
    } catch (error) {
      console.error("❌ Error mengambil data jadwal:", error)
      alert("Gagal mengambil data jadwal")
    } finally {
      setLoading(false)
    }
  }

  // Fungsi untuk validasi form input
  const validateForm = () => {
    const newErrors = {}

    // Validasi frekuensi penyiraman
    if (!formData.frekuensiPenyiraman || formData.frekuensiPenyiraman < 1) {
      newErrors.frekuensiPenyiraman = "Frekuensi harus minimal 1 kali"
    }

    // Validasi jumlah jam sesuai frekuensi
    if (formData.jamPenyiraman.length !== formData.frekuensiPenyiraman) {
      newErrors.jamPenyiraman = `Jumlah jam penyiraman harus sesuai dengan frekuensi (${formData.frekuensiPenyiraman} jam)`
    }

    // Validasi format jam (HH:MM)
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
    const invalidTimes = formData.jamPenyiraman.filter((jam) => !timeRegex.test(jam))
    if (invalidTimes.length > 0) {
      newErrors.jamPenyiraman = "Format jam tidak valid (gunakan HH:MM)"
    }

    // Validasi jam duplikat
    const uniqueTimes = new Set(formData.jamPenyiraman)
    if (uniqueTimes.size !== formData.jamPenyiraman.length) {
      newErrors.jamPenyiraman = "Jam penyiraman tidak boleh duplikat"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Fungsi untuk submit form (create/update)
  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validasi form sebelum submit
    if (!validateForm()) {
      return
    }

    try {
      setLoading(true)
      const url = editMode ? `/api/penjadwalan/${currentId}` : "/api/penjadwalan"
      const method = editMode ? "PUT" : "POST"

      console.log(`🔄 ${editMode ? "Mengupdate" : "Menyimpan"} jadwal penyiraman...`)

      // Menggunakan axios untuk POST/PUT request
      const response = await axios({
        method: method,
        url: url,
        data: formData,
        timeout: 10000,
        headers: {
          "Content-Type": "application/json",
        },
      })

      const result = response.data

      if (response.status === 200 || response.status === 201) {
        alert(editMode ? "Jadwal berhasil diupdate" : "Jadwal berhasil disimpan")
        console.log(`✅ Jadwal berhasil ${editMode ? "diupdate" : "disimpan"}:`, result)
        fetchJadwal() // Refresh data
        closeModal() // Tutup modal
      } else {
        alert(result.error || "Terjadi kesalahan")
      }
    } catch (error) {
      console.error("❌ Error menyimpan jadwal:", error)
      alert(error.response?.data?.error || "Gagal menyimpan data")
    } finally {
      setLoading(false)
    }
  }

  // Fungsi untuk menghapus jadwal
  const handleDelete = async (id) => {
    // Konfirmasi sebelum menghapus
    if (!window.confirm("Apakah Anda yakin ingin menghapus jadwal ini?")) {
      return
    }

    try {
      setLoading(true)
      console.log(`🗑️ Menghapus jadwal dengan ID: ${id}`)

      // Menggunakan axios untuk DELETE request
      const response = await axios({
        method: "DELETE",
        url: `/api/penjadwalan/${id}`,
        timeout: 5000,
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (response.status === 200) {
        alert("Jadwal berhasil dihapus")
        console.log("✅ Jadwal berhasil dihapus")
        fetchJadwal() // Refresh data
      } else {
        const result = response.data
        alert(result.error || "Gagal menghapus jadwal")
      }
    } catch (error) {
      console.error("❌ Error menghapus jadwal:", error)
      alert(error.response?.data?.error || "Gagal menghapus jadwal")
    } finally {
      setLoading(false)
    }
  }

  // Fungsi untuk membuka modal (tambah/edit)
  const openModal = (jadwal = null) => {
    if (jadwal) {
      // Mode edit - isi form dengan data jadwal yang dipilih
      setEditMode(true)
      setCurrentId(jadwal.id)
      setFormData({
        frekuensiPenyiraman: jadwal.frekuensiPenyiraman,
        jamPenyiraman: Array.isArray(jadwal.jamPenyiraman)
          ? jadwal.jamPenyiraman
          : typeof jadwal.jamPenyiraman === "string"
            ? JSON.parse(jadwal.jamPenyiraman)
            : [jadwal.jamPenyiraman].filter(Boolean),
      })
    } else {
      // Mode tambah - reset form ke default
      setEditMode(false)
      setCurrentId(null)
      setFormData({
        frekuensiPenyiraman: 1,
        jamPenyiraman: ["08:00"],
      })
    }
    setErrors({}) // Reset error
    setShowModal(true)
  }

  // Fungsi untuk menutup modal
  const closeModal = () => {
    setShowModal(false)
    setEditMode(false)
    setCurrentId(null)
    setFormData({
      frekuensiPenyiraman: 1,
      jamPenyiraman: ["08:00"],
    })
    setErrors({})
  }

  // Fungsi untuk update frekuensi dan menyesuaikan jumlah jam
  const updateFrekuensi = (newFrekuensi) => {
    const currentJam = formData.jamPenyiraman
    let newJam = [...currentJam]

    if (newFrekuensi > currentJam.length) {
      // Tambah jam baru jika frekuensi bertambah
      for (let i = currentJam.length; i < newFrekuensi; i++) {
        newJam.push("08:00")
      }
    } else if (newFrekuensi < currentJam.length) {
      // Kurangi jam jika frekuensi berkurang
      newJam = newJam.slice(0, newFrekuensi)
    }

    setFormData({
      frekuensiPenyiraman: newFrekuensi,
      jamPenyiraman: newJam,
    })
  }

  // Fungsi untuk update jam penyiraman tertentu
  const updateJam = (index, newTime) => {
    const newJamPenyiraman = [...formData.jamPenyiraman]
    newJamPenyiraman[index] = newTime
    setFormData({
      ...formData,
      jamPenyiraman: newJamPenyiraman,
    })
  }

  return (
    <div className="jadwal-container">
      {/* Header */}
      <div className="jadwal-header">
        <button className="back-button" onClick={() => navigate("/dashboard")}>
          <FiArrowLeft className="back-icon" />
          <span>Kembali ke Dashboard</span>
        </button>

        <div className="header-content">
          <div className="header-title">
            <FiDroplet className="header-icon" />
            <h1>Penjadwalan Penyiraman</h1>
          </div>
          <p>Sistem Monitoring Greenhouse - Kelola jadwal penyiraman otomatis</p>
        </div>

        <button className="add-button" onClick={() => openModal()}>
          <FiPlus className="add-icon" />
          <span>Tambah Jadwal</span>
        </button>
      </div>

      {/* Content */}
      <div className="jadwal-content">
        {/* Loading State */}
        {loading && (
          <div className="loading">
            <div className="loading-spinner"></div>
            <span>Memuat data jadwal...</span>
          </div>
        )}

        {/* Empty State - Tidak ada jadwal */}
        {!loading && jadwalList.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon-container">
              <FiCalendar className="empty-icon" />
              <FiDroplet className="empty-icon-overlay" />
            </div>
            <h3>Belum ada jadwal penyiraman</h3>
            <p>Mulai dengan membuat jadwal penyiraman pertama untuk greenhouse Anda</p>
            <button className="empty-add-button" onClick={() => openModal()}>
              <FiPlus className="empty-add-icon" />
              Buat Jadwal Pertama
            </button>
          </div>
        )}

        {/* Jadwal List - Ada data jadwal */}
        {!loading && jadwalList.length > 0 && (
          <div className="jadwal-grid">
            {jadwalList.map((jadwal) => (
              <div key={jadwal.id} className="jadwal-card">
                <div className="card-header">
                  <div className="frequency-badge">
                    <FiDroplet className="badge-icon" />
                    <span>{jadwal.frekuensiPenyiraman}x per hari</span>
                  </div>
                  <div className="card-actions">
                    <button className="edit-btn" onClick={() => openModal(jadwal)} title="Edit Jadwal">
                      <FiEdit2 />
                    </button>
                    <button className="delete-btn" onClick={() => handleDelete(jadwal.id)} title="Hapus Jadwal">
                      <FiTrash2 />
                    </button>
                  </div>
                </div>

                <div className="card-body">
                  <div className="card-title">
                    <FiClock className="card-title-icon" />
                    <h3>Jadwal Penyiraman</h3>
                  </div>
                  <div className="time-list">
                    {(Array.isArray(jadwal.jamPenyiraman) ? jadwal.jamPenyiraman : []).map((jam, index) => (
                      <div key={index} className="time-item">
                        <div className="time-number">{index + 1}</div>
                        <FiClock className="time-icon" />
                        <span className="time-text">{jam}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal untuk Tambah/Edit Jadwal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <div className="modal-title">
                <FiDroplet className="modal-icon" />
                <h2>{editMode ? "Edit Jadwal Penyiraman" : "Tambah Jadwal Baru"}</h2>
              </div>
              <button className="close-btn" onClick={closeModal}>
                <FiX />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="modal-form">
              {/* Input Frekuensi */}
              <div className="form-group">
                <label htmlFor="frekuensi">
                  <FiCalendar className="label-icon" />
                  Frekuensi Penyiraman (per hari)
                </label>
                <input
                  type="number"
                  id="frekuensi"
                  min="1"
                  max="10"
                  value={formData.frekuensiPenyiraman}
                  onChange={(e) => updateFrekuensi(Number.parseInt(e.target.value) || 1)}
                  className={errors.frekuensiPenyiraman ? "error" : ""}
                />
                {errors.frekuensiPenyiraman && <span className="error-text">{errors.frekuensiPenyiraman}</span>}
              </div>

              {/* Input Waktu Penyiraman */}
              <div className="form-group">
                <label>
                  <FiClock className="label-icon" />
                  Waktu Penyiraman
                </label>
                <div className="time-inputs">
                  {formData.jamPenyiraman.map((jam, index) => (
                    <div key={index} className="time-input-group">
                      <label htmlFor={`jam-${index}`} className="time-label">
                        <FiDroplet className="time-label-icon" />
                        Penyiraman ke-{index + 1}
                      </label>
                      <input
                        type="time"
                        id={`jam-${index}`}
                        value={jam}
                        onChange={(e) => updateJam(index, e.target.value)}
                        className={errors.jamPenyiraman ? "error" : ""}
                      />
                    </div>
                  ))}
                </div>
                {errors.jamPenyiraman && <span className="error-text">{errors.jamPenyiraman}</span>}
              </div>

              {/* Modal Actions */}
              <div className="modal-actions">
                <button type="button" className="cancel-btn" onClick={closeModal}>
                  <FiX className="btn-icon" />
                  Batal
                </button>
                <button type="submit" className="submit-btn" disabled={loading}>
                  <FiDroplet className="btn-icon" />
                  {loading ? "Menyimpan..." : editMode ? "Update Jadwal" : "Simpan Jadwal"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Penjadwalan
