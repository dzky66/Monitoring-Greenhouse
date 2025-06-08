// routes/perangkat.js
const express = require('express');
const router = express.Router();
const { Perangkat } = require('../backend/config/models/perangkat');

// Endpoint untuk mengontrol perangkat (nyalakan atau matikan perangkat)
router.post('/control-perangkat', async (req, res) => {
  const { device, status } = req.body;

  try {
    // Cek apakah perangkat ada di database
    const foundPerangkat = await Perangkat.findOne({ where: { name: device } });
    if (!foundPerangkat) {
      return res.status(404).json({ message: `Perangkat ${device} tidak ditemukan.` });
    }

    // Update status perangkat
    foundPerangkat.status = status;
    await foundPerangkat.save();

    return res.json({ message: `${device} berhasil diubah ke status: ${status}` });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ message: 'Terjadi kesalahan dalam mengubah status perangkat.' });
  }
});

// Endpoint untuk mendapatkan status perangkat
router.get('/perangkat', async (req, res) => {
  try {
    const perangkat = await Perangkat.findAll();
    return res.json(perangkat);
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ message: 'Terjadi kesalahan dalam mengambil data perangkat.' });
  }
});

module.exports = router;
