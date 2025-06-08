const jwt = require("jsonwebtoken")
const { User } = require("../models")
require("dotenv").config()

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers["authorization"]
  const token = authHeader && authHeader.split(" ")[1] // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: "Token akses diperlukan" })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    // Verifikasi user masih ada dan aktif
    const user = await User.findByPk(decoded.id)
    if (!user || !user.isActive) {
      return res.status(401).json({ error: "Token tidak valid atau user tidak aktif" })
    }

    req.user = decoded
    next()
  } catch (err) {
    console.error("Token verification error:", err)
    return res.status(403).json({ error: "Token tidak valid" })
  }
}

module.exports = authenticateToken
