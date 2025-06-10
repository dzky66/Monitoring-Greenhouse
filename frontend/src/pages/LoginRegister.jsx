"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import "../styles/LoginRegister.css"
import { authAPI } from "../utils/api"
import {
  FiUser,
  FiLock,
  FiEye,
  FiEyeOff,
  FiLogIn,
  FiUserPlus,
  FiHome,
  FiSun,
  FiDroplet,
  FiActivity,
  FiShield,
  FiCheckCircle,
  FiAlertCircle,
  FiMail,
} from "react-icons/fi"

export default function LoginRegister() {
  const navigate = useNavigate()
  const [isLogin, setIsLogin] = useState(true)
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    confirmPassword: "",
    name: "",
    email: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [successMessage, setSuccessMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    document.title = isLogin ? "Login - Smart Greenhouse" : "Register - Smart Greenhouse"

    // Update waktu setiap detik
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [isLogin])

  const toggleMode = () => {
    setIsLogin(!isLogin)
    setErrorMessage("")
    setSuccessMessage("")
    setFormData({
      username: "",
      password: "",
      confirmPassword: "",
      name: "",
      email: "",
    })
    setShowPassword(false)
    setShowConfirmPassword(false)
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
    // Clear error ketika user mulai mengetik
    if (errorMessage) setErrorMessage("")
    if (successMessage) setSuccessMessage("")
  }

  const validateForm = () => {
    if (!formData.username.trim()) {
      setErrorMessage("Username tidak boleh kosong")
      return false
    }

    if (formData.username.length < 3) {
      setErrorMessage("Username minimal 3 karakter")
      return false
    }

    if (!formData.password) {
      setErrorMessage("Password tidak boleh kosong")
      return false
    }

    if (formData.password.length < 6) {
      setErrorMessage("Password minimal 6 karakter")
      return false
    }

    if (!isLogin) {
      if (!formData.name.trim()) {
        setErrorMessage("Nama tidak boleh kosong")
        return false
      }

      if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
        setErrorMessage("Format email tidak valid")
        return false
      }

      if (formData.password !== formData.confirmPassword) {
        setErrorMessage("Konfirmasi password tidak cocok")
        return false
      }
    }

    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) return

    setLoading(true)
    setErrorMessage("")
    setSuccessMessage("")

    try {
      if (isLogin) {
        // Login menggunakan authAPI yang sudah diperbaiki
        console.log("🔐 Attempting login to Railway backend...")
        const response = await authAPI.login({
          username: formData.username,
          password: formData.password,
        })

        // Response sudah dihandle di interceptor, token dan user sudah disimpan
        setSuccessMessage("Login berhasil! Mengalihkan ke dashboard...")

        // Log untuk debugging
        console.log("✅ Login successful, redirecting to dashboard...")

        setTimeout(() => {
          navigate("/dashboard")
        }, 1500)
      } else {
        // Register menggunakan authAPI yang sudah diperbaiki
        console.log("📝 Attempting registration to Railway backend...")
        const registerData = {
          username: formData.username,
          password: formData.password,
          name: formData.name,
        }

        // Tambahkan email hanya jika diisi
        if (formData.email.trim()) {
          registerData.email = formData.email
        }

        await authAPI.register(registerData)

        setSuccessMessage("Registrasi berhasil! Silakan login.")
        console.log("✅ Registration successful, switching to login mode...")

        setTimeout(() => {
          setIsLogin(true)
          setFormData({
            username: "",
            password: "",
            confirmPassword: "",
            name: "",
            email: "",
          })
          setSuccessMessage("")
        }, 2000)
      }
    } catch (error) {
      console.error("❌ Auth error:", error)

      // Handle specific error messages dari backend
      let errorMsg = error.message || "Terjadi kesalahan pada server"

      // Customize error messages untuk user experience yang lebih baik
      if (errorMsg.includes("User not found") || errorMsg.includes("Invalid credentials")) {
        errorMsg = "Username atau password salah"
      } else if (errorMsg.includes("User already exists")) {
        errorMsg = "Username sudah digunakan, silakan pilih username lain"
      } else if (errorMsg.includes("tidak dapat terhubung")) {
        errorMsg = "Tidak dapat terhubung ke server. Periksa koneksi internet Anda."
      }

      setErrorMessage(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (date) => {
    return date.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
  }

  const formatDate = (date) => {
    return date.toLocaleDateString("id-ID", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  return (
    <div className="auth-body">
      {/* Background Elements */}
      <div className="auth-background">
        <div className="floating-element element-1">
          <FiHome />
        </div>
        <div className="floating-element element-2">
          <FiSun />
        </div>
        <div className="floating-element element-3">
          <FiDroplet />
        </div>
        <div className="floating-element element-4">
          <FiActivity />
        </div>
      </div>

      {/* Header */}
      <header className="auth-header">
        <div className="brand">
          <FiHome className="brand-icon" />
          <h1>Smart Greenhouse</h1>
        </div>
        <div className="time-display">
          <div className="current-time">{formatTime(currentTime)}</div>
          <div className="current-date">{formatDate(currentTime)}</div>
        </div>
      </header>

      {/* Main Content */}
      <main className="auth-main">
        <div className="auth-container">
          <div className="auth-card">
            {/* Card Header */}
            <div className="card-header">
              <div className="card-icon">{isLogin ? <FiLogIn /> : <FiUserPlus />}</div>
              <h2>{isLogin ? "Masuk ke Sistem" : "Daftar Akun Baru"}</h2>
              <p>
                {isLogin
                  ? "Masuk untuk mengakses dashboard monitoring greenhouse"
                  : "Buat akun baru untuk mulai menggunakan sistem"}
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="auth-form">
              {/* Name Field (Register only) */}
              {!isLogin && (
                <div className="form-group">
                  <label htmlFor="name">
                    <FiUser className="label-icon" />
                    Nama Lengkap
                  </label>
                  <div className="input-container">
                    <input
                      type="text"
                      id="name"
                      name="name"
                      placeholder="Masukkan nama lengkap"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="form-input"
                      disabled={loading}
                    />
                  </div>
                </div>
              )}

              {/* Email Field (Register only) */}
              {!isLogin && (
                <div className="form-group">
                  <label htmlFor="email">
                    <FiMail className="label-icon" />
                    Email (Opsional)
                  </label>
                  <div className="input-container">
                    <input
                      type="email"
                      id="email"
                      name="email"
                      placeholder="Masukkan email (opsional)"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="form-input"
                      disabled={loading}
                    />
                  </div>
                </div>
              )}

              {/* Username Field */}
              <div className="form-group">
                <label htmlFor="username">
                  <FiUser className="label-icon" />
                  Username
                </label>
                <div className="input-container">
                  <input
                    type="text"
                    id="username"
                    name="username"
                    placeholder="Masukkan username"
                    value={formData.username}
                    onChange={handleInputChange}
                    className="form-input"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="form-group">
                <label htmlFor="password">
                  <FiLock className="label-icon" />
                  Password
                </label>
                <div className="input-container">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    placeholder="Masukkan password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="form-input"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                  >
                    {showPassword ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
              </div>

              {/* Confirm Password Field (Register only) */}
              {!isLogin && (
                <div className="form-group">
                  <label htmlFor="confirmPassword">
                    <FiShield className="label-icon" />
                    Konfirmasi Password
                  </label>
                  <div className="input-container">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      id="confirmPassword"
                      name="confirmPassword"
                      placeholder="Ulangi password"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className="form-input"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      disabled={loading}
                    >
                      {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                    </button>
                  </div>
                </div>
              )}

              {/* Messages */}
              {errorMessage && (
                <div className="message error-message">
                  <FiAlertCircle className="message-icon" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {successMessage && (
                <div className="message success-message">
                  <FiCheckCircle className="message-icon" />
                  <span>{successMessage}</span>
                </div>
              )}

              {/* Submit Button */}
              <button type="submit" className="submit-button" disabled={loading}>
                {loading ? (
                  <>
                    <div className="loading-spinner"></div>
                    <span>{isLogin ? "Masuk..." : "Mendaftar..."}</span>
                  </>
                ) : (
                  <>
                    {isLogin ? <FiLogIn /> : <FiUserPlus />}
                    <span>{isLogin ? "Masuk" : "Daftar"}</span>
                  </>
                )}
              </button>
            </form>

            {/* Toggle Mode */}
            <div className="auth-toggle">
              <p>
                {isLogin ? "Belum punya akun?" : "Sudah punya akun?"}
                <button type="button" onClick={toggleMode} className="toggle-button" disabled={loading}>
                  {isLogin ? "Daftar di sini" : "Masuk di sini"}
                </button>
              </p>
            </div>
          </div>

          {/* Features Info - Enhanced */}
          <div className="features-info">
            <div className="features-header">
              <FiActivity className="features-icon" />
              <h3>Fitur Smart Greenhouse</h3>
            </div>
            <div className="features-list">
              <div className="feature-item">
                <div className="feature-icon-wrapper">
                  <FiActivity className="feature-icon" />
                </div>
                <div className="feature-content">
                  <span className="feature-title">Monitoring Real-time</span>
                  <span className="feature-desc">Pantau kondisi greenhouse 24/7</span>
                </div>
              </div>
              <div className="feature-item">
                <div className="feature-icon-wrapper">
                  <FiSun className="feature-icon" />
                </div>
                <div className="feature-content">
                  <span className="feature-title">Kontrol Otomatis</span>
                  <span className="feature-desc">Kontrol jarak jauh</span>
                </div>
              </div>
              <div className="feature-item">
                <div className="feature-icon-wrapper">
                  <FiDroplet className="feature-icon" />
                </div>
                <div className="feature-content">
                  <span className="feature-title">Penjadwalan Penyiraman</span>
                  <span className="feature-desc">Atur jadwal penyiraman otomatis</span>
                </div>
              </div>
              <div className="feature-item">
                <div className="feature-icon-wrapper">
                  <FiHome className="feature-icon" />
                </div>
                <div className="feature-content">
                  <span className="feature-title">Analisis Kondisi</span>
                  <span className="feature-desc">Laporan dan rekomendasi cerdas</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="auth-footer">
        <p>© 2024 Smart Greenhouse System - Teknologi IoT untuk Pertanian Modern</p>
      </footer>
    </div>
  )
}
