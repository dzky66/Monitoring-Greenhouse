const express = require("express")
const router = express.Router()
const Device = require("../models/device")
const DeviceLog = require("../models/devicelog")

// Get semua status device (biasanya cuma satu row saja)
router.get("/", async (req, res) => {
  try {
    const devices = await Device.findAll({
      include: [{ model: DeviceLog, as: "logs" }],
      order: [["createdAt", "DESC"]],
    })
    res.json(devices)
  } catch (err) {
    res.status(500).json({ message: "Gagal mengambil data device", error: err.message })
  }
})

// Get device by ID
router.get("/:id", async (req, res) => {
  try {
    const device = await Device.findByPk(req.params.id, {
      include: [{ model: DeviceLog, as: "logs" }],
    })
    if (!device) return res.status(404).json({ message: "Device tidak ditemukan" })
    res.json(device)
  } catch (err) {
    res.status(500).json({ message: "Gagal mengambil data device", error: err.message })
  }
})

// Create device baru (biasanya untuk inisialisasi)
router.post("/", async (req, res) => {
  const { lampu, ventilasi, humidifier, kipas, pemanas } = req.body

  // Validasi ventilasi
  if (ventilasi && !["buka", "tutup"].includes(ventilasi)) {
    return res.status(400).json({ message: 'Status ventilasi harus "buka" atau "tutup"' })
  }

  try {
    // Buat device baru dengan data yang diberikan
    const newDevice = await Device.create({
      lampu: lampu !== undefined ? lampu : false,
      ventilasi: ventilasi || "tutup",
      humidifier: humidifier !== undefined ? humidifier : false,
      kipas: kipas !== undefined ? kipas : false,
      pemanas: pemanas !== undefined ? pemanas : false,
    })

    // Simpan log perubahan
    await DeviceLog.create({
      lampu: newDevice.lampu,
      ventilasi: newDevice.ventilasi,
      humidifier: newDevice.humidifier,
      kipas: newDevice.kipas,
      pemanas: newDevice.pemanas,
      device_id: newDevice.id,
    })

    res.status(201).json({
      message: "Device berhasil dibuat",
      data: newDevice,
    })
  } catch (err) {
    console.error("Error creating device:", err)
    res.status(500).json({
      message: "Gagal membuat device",
      error: err.message,
    })
  }
})

// Update device (kontrol cepat)
router.put("/:id", async (req, res) => {
  const { lampu, ventilasi, humidifier, kipas, pemanas } = req.body

  // Validasi ventilasi
  if (ventilasi && !["buka", "tutup"].includes(ventilasi)) {
    return res.status(400).json({ message: 'Status ventilasi harus "buka" atau "tutup"' })
  }

  try {
    const device = await Device.findByPk(req.params.id)
    if (!device) return res.status(404).json({ message: "Device tidak ditemukan" })

    // Update fields jika dikirim
    if (lampu !== undefined) device.lampu = lampu
    if (ventilasi !== undefined) device.ventilasi = ventilasi
    if (humidifier !== undefined) device.humidifier = humidifier
    if (kipas !== undefined) device.kipas = kipas
    if (pemanas !== undefined) device.pemanas = pemanas

    await device.save()

    // Simpan log perubahan
    await DeviceLog.create({
      lampu: device.lampu,
      ventilasi: device.ventilasi,
      humidifier: device.humidifier,
      kipas: device.kipas,
      pemanas: device.pemanas,
      device_id: device.id,
    })

    res.json({
      message: "Device berhasil diperbarui",
      data: device,
    })
  } catch (err) {
    console.error("Error updating device:", err)
    res.status(500).json({
      message: "Gagal memperbarui device",
      error: err.message,
    })
  }
})

// Delete device (jika perlu)
router.delete("/:id", async (req, res) => {
  try {
    const device = await Device.findByPk(req.params.id)
    if (!device) return res.status(404).json({ message: "Device tidak ditemukan" })

    await device.destroy()
    res.json({ message: "Device berhasil dihapus" })
  } catch (err) {
    res.status(500).json({ message: "Gagal menghapus device", error: err.message })
  }
})

module.exports = router