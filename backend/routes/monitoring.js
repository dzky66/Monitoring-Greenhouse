const express = require("express")
const router = express.Router()
const DataSensor = require("../models/datasensor")
const Monitoring = require("../models/monitoring")

router.get("/", async (req, res) => {
  try {
    const data = await DataSensor.findAll({
      order: [["waktu", "DESC"]],
      limit: 1,
    })

    if (data.length === 0) {
      return res.status(404).json({ message: "Data sensor tidak ditemukan" })
    }

    const latest = data[0]

    const status = []
    const rekomendasi = []

    // Cek suhu
    if (latest.suhu < 18) {
      status.push("Suhu Rendah")
      rekomendasi.push("Tutup ventilasi")
      rekomendasi.push("Aktifkan pemanas")
    } else if (latest.suhu > 30) {
      status.push("Suhu Tinggi")
      rekomendasi.push("Buka ventilasi")
      rekomendasi.push("Aktifkan kipas")
    }

    // Cek kelembapan udara
    if (latest.kelembapan_udara < 40) {
      status.push("Kelembapan Udara Rendah")
      rekomendasi.push("Aktifkan humidifier")
    } else if (latest.kelembapan_udara > 80) {
      status.push("Kelembapan Udara Tinggi")
      rekomendasi.push("Matikan humidifier dan buka ventilasi")
    }

    // Cek kelembapan tanah
    if (latest.kelembapan_tanah < 30) {
      status.push("Kelembapan Tanah Rendah")
      rekomendasi.push("Lakukan penyiraman")
      rekomendasi.push("Periksa sistem irigasi")
    } else if (latest.kelembapan_tanah > 70) {
      status.push("Kelembapan Tanah Tinggi")
      rekomendasi.push("Kurangi penyiraman")
      rekomendasi.push("Periksa drainase")
    }

    // Cek cahaya, sesuaikan threshold lebih realistis untuk pola siang-malam
    if (latest.cahaya < 150) {
      status.push("Cahaya Kurang")
      rekomendasi.push("Nyalakan lampu tumbuh")
    } else if (latest.cahaya > 1000) {
      status.push("Cahaya Berlebih")
      rekomendasi.push("Gunakan shade cloth")
    }

    // Jika tidak ada masalah, set status normal
    if (status.length === 0) {
      status.push("Normal")
      rekomendasi.push("Kondisi optimal, tidak ada tindakan diperlukan")
    }

    // Simpan hasil monitoring ke DB
    await Monitoring.create({
      suhu: latest.suhu,
      kelembapan_udara: latest.kelembapan_udara,
      kelembapan_tanah: latest.kelembapan_tanah,
      cahaya: latest.cahaya,
      waktu: latest.waktu,
      status: status.join("; "),
      rekomendasi: rekomendasi.join("; "),
      dataSensorId: latest.id,
    })

    // Kirim response JSON dengan array status dan rekomendasi
    res.json({
      suhu: latest.suhu,
      kelembapan_udara: latest.kelembapan_udara,
      kelembapan_tanah: latest.kelembapan_tanah,
      cahaya: latest.cahaya,
      waktu: latest.waktu,
      status,
      rekomendasi,
    })
  } catch (err) {
    console.error("Gagal memproses monitoring:", err)
    res.status(500).json({ error: "Internal server error", detail: err.message })
  }
})

// GET endpoint untuk riwayat monitoring
router.get("/history", async (req, res) => {
  try {
    const { limit = 50, page = 1 } = req.query
    const offset = (page - 1) * limit

    const data = await Monitoring.findAndCountAll({
      order: [["waktu", "DESC"]],
      limit: Number.parseInt(limit),
      offset: Number.parseInt(offset),
      include: [
        {
          model: DataSensor,
          as: "dataSensor",
        },
      ],
    })

    res.json({
      data: data.rows,
      total: data.count,
      page: Number.parseInt(page),
      totalPages: Math.ceil(data.count / limit),
    })
  } catch (err) {
    console.error("Gagal mengambil riwayat monitoring:", err)
    res.status(500).json({ error: "Internal server error", detail: err.message })
  }
})

// GET endpoint untuk statistik monitoring
router.get("/stats", async (req, res) => {
  try {
    const { days = 7 } = req.query
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const data = await Monitoring.findAll({
      where: {
        waktu: {
          [require("sequelize").Op.gte]: startDate,
        },
      },
      order: [["waktu", "ASC"]],
    })

    // Hitung statistik
    const stats = {
      total_records: data.length,
      normal_count: data.filter((d) => d.status === "Normal").length,
      warning_count: data.filter((d) => d.status !== "Normal").length,
      avg_suhu: data.reduce((sum, d) => sum + d.suhu, 0) / data.length || 0,
      avg_kelembapan_udara: data.reduce((sum, d) => sum + d.kelembapan_udara, 0) / data.length || 0,
      avg_kelembapan_tanah: data.reduce((sum, d) => sum + d.kelembapan_tanah, 0) / data.length || 0,
      avg_cahaya: data.reduce((sum, d) => sum + d.cahaya, 0) / data.length || 0,
    }

    // Format angka
    stats.avg_suhu = Number.parseFloat(stats.avg_suhu.toFixed(1))
    stats.avg_kelembapan_udara = Number.parseFloat(stats.avg_kelembapan_udara.toFixed(1))
    stats.avg_kelembapan_tanah = Number.parseFloat(stats.avg_kelembapan_tanah.toFixed(1))
    stats.avg_cahaya = Number.parseFloat(stats.avg_cahaya.toFixed(0))

    res.json({
      period_days: days,
      stats,
      data: data.slice(-20), // 20 data terakhir untuk chart
    })
  } catch (err) {
    console.error("Gagal mengambil statistik monitoring:", err)
    res.status(500).json({ error: "Internal server error", detail: err.message })
  }
})

module.exports = router