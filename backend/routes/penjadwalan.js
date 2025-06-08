const express = require('express');
const router = express.Router();
const Penjadwalan = require('../models/penjadwalan');

// Create - Simpan pengaturan penjadwalan baru
router.post('/', async (req, res) => {
  try {
    const { frekuensiPenyiraman, jamPenyiraman } = req.body;

    if (frekuensiPenyiraman == null || !jamPenyiraman || !Array.isArray(jamPenyiraman)) {
      return res.status(400).json({ error: 'frekuensiPenyiraman dan jamPenyiraman (array) wajib diisi.' });
    }

    const data = await Penjadwalan.create({
      frekuensiPenyiraman,
      jamPenyiraman, // langsung array, jangan stringify
    });

    res.json({ message: 'Pengaturan berhasil disimpan', data });
  } catch (err) {
    console.error('Terjadi error:', err);
    res.status(500).json({ error: 'Gagal menyimpan data', detail: err.message });
  }
});

// Read - Ambil semua data penjadwalan
router.get('/', async (req, res) => {
  try {
    const data = await Penjadwalan.findAll();
    res.json(data);
  } catch (err) {
    console.error('Gagal mengambil data:', err);
    res.status(500).json({ error: 'Gagal mengambil data' });
  }
});

// Update - Edit data penjadwalan berdasarkan id
router.put('/:id', async (req, res) => {
  try {
    const { frekuensiPenyiraman, jamPenyiraman } = req.body;
    const id = req.params.id;

    if (frekuensiPenyiraman == null || !jamPenyiraman || !Array.isArray(jamPenyiraman)) {
      return res.status(400).json({ error: 'frekuensiPenyiraman dan jamPenyiraman (array) wajib diisi.' });
    }

    const jadwal = await Penjadwalan.findByPk(id);
    if (!jadwal) {
      return res.status(404).json({ error: 'Jadwal tidak ditemukan' });
    }

    await jadwal.update({
      frekuensiPenyiraman,
      jamPenyiraman, // langsung array
    });

    res.json({ message: 'Jadwal berhasil diupdate', jadwal });
  } catch (err) {
    console.error('Gagal mengupdate data:', err);
    res.status(500).json({ error: 'Gagal mengupdate data' });
  }
});

// Delete - Hapus data penjadwalan berdasarkan id
router.delete('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const jadwal = await Penjadwalan.findByPk(id);
    if (!jadwal) {
      return res.status(404).json({ error: 'Jadwal tidak ditemukan' });
    }

    await jadwal.destroy();
    res.json({ message: 'Jadwal berhasil dihapus' });
  } catch (err) {
    console.error('Gagal menghapus data:', err);
    res.status(500).json({ error: 'Gagal menghapus data' });
  }
});

module.exports = router;
