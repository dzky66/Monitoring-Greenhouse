const express = require("express")
const router = express.Router()
const Prediksi = require("../models/prediksi")
const DataSensor = require("../models/datasensor")
const { Op } = require("sequelize")

// GET semua prediksi
router.get("/", async (req, res) => {
  try {
    const prediksi = await Prediksi.findAll({
      order: [["createdAt", "DESC"]],
    })
    res.json(prediksi)
  } catch (err) {
    console.error("Error fetching prediksi:", err)
    res.status(500).json({ error: "Gagal mengambil data prediksi" })
  }
})

// GET prediksi terbaru
router.get("/latest", async (req, res) => {
  try {
    const prediksi = await Prediksi.findOne({
      order: [["createdAt", "DESC"]],
    })

    if (!prediksi) {
      return res.status(404).json({ message: "Belum ada prediksi yang tersedia" })
    }

    res.json(prediksi)
  } catch (err) {
    console.error("Error fetching latest prediksi:", err)
    res.status(500).json({ error: "Gagal mengambil data prediksi terbaru" })
  }
})

// GET prediksi berdasarkan tanaman
router.get("/tanaman/:tanaman", async (req, res) => {
  try {
    const { tanaman } = req.params
    const prediksi = await Prediksi.findAll({
      where: {
        tanaman: {
          [Op.like]: `%${tanaman}%`,
        },
      },
      order: [["createdAt", "DESC"]],
    })

    if (prediksi.length === 0) {
      return res.status(404).json({ message: `Tidak ada prediksi untuk tanaman ${tanaman}` })
    }

    res.json(prediksi)
  } catch (err) {
    console.error("Error fetching prediksi by tanaman:", err)
    res.status(500).json({ error: "Gagal mengambil data prediksi berdasarkan tanaman" })
  }
})

// POST buat prediksi baru
router.post("/", async (req, res) => {
  try {
    const {
      tanaman,
      waktu_tanam,
      estimasi_panen,
      estimasi_waktu_panen,
      skor_kesehatan,
      faktor_pendukung,
      faktor_penghambat,
      rekomendasi,
      kualitas_prediksi,
      data_historis,
    } = req.body

    // Validasi input
    if (!tanaman || !waktu_tanam || !estimasi_waktu_panen) {
      return res.status(400).json({
        error: "Data tanaman, waktu tanam, dan estimasi waktu panen wajib diisi",
      })
    }

    const newPrediksi = await Prediksi.create({
      tanaman,
      estimasi_panen: estimasi_panen || 0,
      kualitas_prediksi: kualitas_prediksi || "sedang",
      waktu_tanam,
      estimasi_waktu_panen,
      skor_kesehatan: skor_kesehatan || 50,
      faktor_pendukung,
      faktor_penghambat,
      rekomendasi,
      data_historis,
    })

    res.status(201).json({
      message: "Prediksi berhasil dibuat",
      data: newPrediksi,
    })
  } catch (err) {
    console.error("Error creating prediksi:", err)
    res.status(500).json({ error: "Gagal membuat prediksi baru" })
  }
})

// POST generate prediksi otomatis berdasarkan data sensor
router.post("/generate", async (req, res) => {
  try {
    const { tanaman, waktu_tanam } = req.body

    if (!tanaman || !waktu_tanam) {
      return res.status(400).json({
        error: "Data tanaman dan waktu tanam wajib diisi",
      })
    }

    // Ambil data sensor untuk analisis
    const sensorData = await DataSensor.findAll({
      order: [["waktu", "DESC"]],
      limit: 100, // Ambil 100 data terakhir untuk analisis
    })

    if (sensorData.length === 0) {
      return res.status(404).json({ message: "Data sensor tidak cukup untuk membuat prediksi" })
    }

    // Hitung rata-rata data sensor
    const avgSuhu = sensorData.reduce((sum, data) => sum + data.suhu, 0) / sensorData.length
    const avgKelembapanUdara = sensorData.reduce((sum, data) => sum + data.kelembapan_udara, 0) / sensorData.length
    const avgKelembapanTanah = sensorData.reduce((sum, data) => sum + data.kelembapan_tanah, 0) / sensorData.length
    const avgCahaya = sensorData.reduce((sum, data) => sum + data.cahaya, 0) / sensorData.length

    // Tentukan faktor pendukung dan penghambat
    const faktorPendukung = []
    const faktorPenghambat = []
    const rekomendasi = []

    // Analisis suhu
    if (avgSuhu >= 22 && avgSuhu <= 28) {
      faktorPendukung.push("Suhu optimal untuk pertumbuhan")
    } else if (avgSuhu < 22) {
      faktorPenghambat.push("Suhu rata-rata terlalu rendah")
      rekomendasi.push("Tingkatkan suhu greenhouse dengan pemanas")
    } else {
      faktorPenghambat.push("Suhu rata-rata terlalu tinggi")
      rekomendasi.push("Turunkan suhu dengan ventilasi atau kipas")
    }

    // Analisis kelembapan udara
    if (avgKelembapanUdara >= 50 && avgKelembapanUdara <= 70) {
      faktorPendukung.push("Kelembapan udara optimal")
    } else if (avgKelembapanUdara < 50) {
      faktorPenghambat.push("Kelembapan udara terlalu rendah")
      rekomendasi.push("Gunakan humidifier untuk meningkatkan kelembapan udara")
    } else {
      faktorPenghambat.push("Kelembapan udara terlalu tinggi")
      rekomendasi.push("Kurangi kelembapan dengan ventilasi yang baik")
    }

    // Analisis kelembapan tanah
    if (avgKelembapanTanah >= 40 && avgKelembapanTanah <= 60) {
      faktorPendukung.push("Kelembapan tanah optimal")
    } else if (avgKelembapanTanah < 40) {
      faktorPenghambat.push("Kelembapan tanah terlalu rendah")
      rekomendasi.push("Tingkatkan frekuensi penyiraman")
    } else {
      faktorPenghambat.push("Kelembapan tanah terlalu tinggi")
      rekomendasi.push("Kurangi frekuensi penyiraman dan periksa drainase")
    }

    // Analisis cahaya
    if (avgCahaya >= 800 && avgCahaya <= 1200) {
      faktorPendukung.push("Intensitas cahaya optimal")
    } else if (avgCahaya < 800) {
      faktorPenghambat.push("Intensitas cahaya kurang")
      rekomendasi.push("Tambahkan pencahayaan buatan")
    } else {
      faktorPenghambat.push("Intensitas cahaya terlalu tinggi")
      rekomendasi.push("Gunakan shade cloth untuk mengurangi intensitas cahaya")
    }

    // Hitung skor kesehatan berdasarkan kondisi
    let skorKesehatan = 50 // Nilai dasar
    skorKesehatan += faktorPendukung.length * 10
    skorKesehatan -= faktorPenghambat.length * 10
    skorKesehatan = Math.max(0, Math.min(100, skorKesehatan)) // Batasi antara 0-100

    // Tentukan kualitas prediksi berdasarkan jumlah data
    let kualitasPrediksi = "rendah"
    if (sensorData.length >= 50) kualitasPrediksi = "sedang"
    if (sensorData.length >= 100) kualitasPrediksi = "tinggi"

    // Estimasi hasil panen berdasarkan jenis tanaman dan skor kesehatan
    let estimasiPanen = 0
    let durasiTumbuh = 90 // Default 90 hari

    // Estimasi berdasarkan jenis tanaman (contoh sederhana)
    switch (tanaman.toLowerCase()) {
      case "tomat":
        estimasiPanen = (skorKesehatan / 100) * 15 // Maksimal 15kg per m²
        durasiTumbuh = 70 // 70 hari
        break
      case "selada":
        estimasiPanen = (skorKesehatan / 100) * 5 // Maksimal 5kg per m²
        durasiTumbuh = 35 // 35 hari
        break
      case "cabai":
        estimasiPanen = (skorKesehatan / 100) * 8 // Maksimal 8kg per m²
        durasiTumbuh = 90 // 90 hari
        break
      case "mentimun":
        estimasiPanen = (skorKesehatan / 100) * 12 // Maksimal 12kg per m²
        durasiTumbuh = 60 // 60 hari
        break
      case "bayam":
        estimasiPanen = (skorKesehatan / 100) * 3 // Maksimal 3kg per m²
        durasiTumbuh = 30 // 30 hari
        break
      default:
        estimasiPanen = (skorKesehatan / 100) * 10 // Default 10kg per m²
        durasiTumbuh = 60 // Default 60 hari
    }

    // Hitung estimasi waktu panen
    const waktuTanamDate = new Date(waktu_tanam)
    const estimasiWaktuPanen = new Date(waktuTanamDate)
    estimasiWaktuPanen.setDate(waktuTanamDate.getDate() + durasiTumbuh)

    // Buat prediksi baru
    const newPrediksi = await Prediksi.create({
      tanaman,
      estimasi_panen: parseFloat(estimasiPanen.toFixed(2)),
      kualitas_prediksi: kualitasPrediksi,
      waktu_tanam: waktuTanamDate,
      estimasi_waktu_panen: estimasiWaktuPanen,
      skor_kesehatan: skorKesehatan,
      faktor_pendukung: faktorPendukung.join("; "),
      faktor_penghambat: faktorPenghambat.join("; "),
      rekomendasi: rekomendasi.join("; "),
      data_historis: {
        avg_suhu: parseFloat(avgSuhu.toFixed(2)),
        avg_kelembapan_udara: parseFloat(avgKelembapanUdara.toFixed(2)),
        avg_kelembapan_tanah: parseFloat(avgKelembapanTanah.toFixed(2)),
        avg_cahaya: parseFloat(avgCahaya.toFixed(0)),
        jumlah_data: sensorData.length,
      },
    })

    res.status(201).json({
      message: "Prediksi berhasil dibuat",
      data: newPrediksi,
    })
  } catch (err) {
    console.error("Error generating prediksi:", err)
    res.status(500).json({ error: "Gagal membuat prediksi otomatis", detail: err.message })
  }
})

// PUT update prediksi
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params
    const {
      tanaman,
      estimasi_panen,
      kualitas_prediksi,
      waktu_tanam,
      estimasi_waktu_panen,
      skor_kesehatan,
      faktor_pendukung,
      faktor_penghambat,
      rekomendasi,
    } = req.body

    const prediksi = await Prediksi.findByPk(id)
    if (!prediksi) {
      return res.status(404).json({ message: "Prediksi tidak ditemukan" })
    }

    // Update fields
    if (tanaman) prediksi.tanaman = tanaman
    if (estimasi_panen) prediksi.estimasi_panen = estimasi_panen
    if (kualitas_prediksi) prediksi.kualitas_prediksi = kualitas_prediksi
    if (waktu_tanam) prediksi.waktu_tanam = waktu_tanam
    if (estimasi_waktu_panen) prediksi.estimasi_waktu_panen = estimasi_waktu_panen
    if (skor_kesehatan !== undefined) prediksi.skor_kesehatan = skor_kesehatan
    if (faktor_pendukung) prediksi.faktor_pendukung = faktor_pendukung
    if (faktor_penghambat) prediksi.faktor_penghambat = faktor_penghambat
    if (rekomendasi) prediksi.rekomendasi = rekomendasi

    await prediksi.save()

    res.json({
      message: "Prediksi berhasil diperbarui",
      data: prediksi,
    })
  } catch (err) {
    console.error("Error updating prediksi:", err)
    res.status(500).json({ error: "Gagal memperbarui prediksi" })
  }
})

// DELETE prediksi
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params
    const prediksi = await Prediksi.findByPk(id)

    if (!prediksi) {
      return res.status(404).json({ message: "Prediksi tidak ditemukan" })
    }

    await prediksi.destroy()
    res.json({ message: "Prediksi berhasil dihapus" })
  } catch (err) {
    console.error("Error deleting prediksi:", err)
    res.status(500).json({ error: "Gagal menghapus prediksi" })
  }
})

module.exports = router