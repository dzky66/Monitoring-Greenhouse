const express = require("express")
const router = express.Router()
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const { User, UserProfile } = require("../models")
const authenticateToken = require("../middleware/auth")
require("dotenv").config()

// Register
router.post("/register", async (req, res) => {
  const { username, password, name, email } = req.body

  try {
    // Cek username sudah terdaftar atau belum
    const existingUser = await User.findOne({ where: { username } })
    if (existingUser) {
      return res.status(400).json({ error: "Username sudah digunakan" })
    }

    // Cek email sudah terdaftar atau belum (jika ada)
    if (email) {
      const existingProfile = await UserProfile.findOne({ where: { email } })
      if (existingProfile) {
        return res.status(400).json({ error: "Email sudah digunakan" })
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Buat user baru
    const user = await User.create({
      username,
      password: hashedPassword,
    })

    // Buat profil user
    const userProfile = await UserProfile.create({
      userId: user.id,
      name: name || username,
      email: email || null,
    })

    res.status(201).json({
      message: "Registrasi berhasil",
      user: {
        id: user.id,
        username: user.username,
        profile: {
          name: userProfile.name,
          email: userProfile.email,
        },
        createdAt: user.createdAt,
      },
    })
  } catch (err) {
    console.error("Registration error:", err)
    res.status(500).json({ error: "Gagal registrasi pengguna", detail: err.message })
  }
})

// Login
router.post("/login", async (req, res) => {
  const { username, password } = req.body

  try {
    const user = await User.findOne({
      where: { username },
      include: [
        {
          model: UserProfile,
          as: "userProfile",
        },
      ],
    })

    if (!user) {
      return res.status(401).json({ error: "Username atau password salah" })
    }

    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Username atau password salah" })
    }

    // Update last login
    await user.update({ lastLogin: new Date() })

    // Generate JWT token
    const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET, { expiresIn: "24h" })

    res.json({
      message: "Login berhasil",
      user: {
        id: user.id,
        username: user.username,
        profile: user.userProfile,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
      },
      token,
    })
  } catch (err) {
    console.error("Login error:", err)
    res.status(500).json({ error: "Gagal login", detail: err.message })
  }
})

// Get user profile
router.get("/profile", authenticateToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ["password"] },
      include: [
        {
          model: UserProfile,
          as: "userProfile",
        },
      ],
    })

    if (!user) {
      return res.status(404).json({ error: "Pengguna tidak ditemukan" })
    }

    res.json({
      message: "Data profil berhasil diambil",
      user: user,
    })
  } catch (err) {
    console.error("Profile fetch error:", err)
    res.status(500).json({ error: "Gagal mengambil data profil", detail: err.message })
  }
})

// Update user profile
router.put("/profile", authenticateToken, async (req, res) => {
  const { name, email, phone, address, bio } = req.body

  try {
    const user = await User.findByPk(req.user.id, {
      include: [
        {
          model: UserProfile,
          as: "userProfile",
        },
      ],
    })

    if (!user) {
      return res.status(404).json({ error: "Pengguna tidak ditemukan" })
    }

    // Check if email is already used by another user
    if (email && email !== user.userProfile?.email) {
      const existingProfile = await UserProfile.findOne({
        where: {
          email,
          userId: { [require("sequelize").Op.ne]: user.id },
        },
      })
      if (existingProfile) {
        return res.status(400).json({ error: "Email sudah digunakan oleh pengguna lain" })
      }
    }

    // Update atau buat profil jika belum ada
    if (user.userProfile) {
      await user.userProfile.update({
        name: name || user.userProfile.name,
        email: email || user.userProfile.email,
        phone: phone || user.userProfile.phone,
        address: address || user.userProfile.address,
        bio: bio || user.userProfile.bio,
      })
    } else {
      await UserProfile.create({
        userId: user.id,
        name: name || user.username,
        email: email || null,
        phone: phone || null,
        address: address || null,
        bio: bio || null,
      })
    }

    // Ambil data terbaru
    const updatedUser = await User.findByPk(req.user.id, {
      attributes: { exclude: ["password"] },
      include: [
        {
          model: UserProfile,
          as: "userProfile",
        },
      ],
    })

    res.json({
      message: "Profil berhasil diperbarui",
      user: updatedUser,
    })
  } catch (err) {
    console.error("Profile update error:", err)
    res.status(500).json({ error: "Gagal memperbarui profil", detail: err.message })
  }
})

// Change password
router.put("/change-password", authenticateToken, async (req, res) => {
  const { currentPassword, newPassword } = req.body

  try {
    const user = await User.findByPk(req.user.id)
    if (!user) {
      return res.status(404).json({ error: "Pengguna tidak ditemukan" })
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password)
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ error: "Password saat ini salah" })
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10)

    await user.update({ password: hashedNewPassword })

    res.json({ message: "Password berhasil diubah" })
  } catch (err) {
    console.error("Password change error:", err)
    res.status(500).json({ error: "Gagal mengubah password", detail: err.message })
  }
})

// Logout
router.post("/logout", authenticateToken, (req, res) => {
  res.json({ message: "Logout berhasil" })
})

module.exports = router
