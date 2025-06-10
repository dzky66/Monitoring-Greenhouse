"use client"

import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import "../styles/Profile.css"
import {
  FiUser,
  FiMail,
  FiPhone,
  FiMapPin,
  FiEdit,
  FiSave,
  FiX,
  FiLock,
  FiEye,
  FiEyeOff,
  FiRefreshCw,
  FiClock,
  FiArrowLeft,
  FiCheckCircle,
  FiAlertCircle,
  FiCalendar,
} from "react-icons/fi"

const Profile = () => {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    bio: "",
  })

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  })

  // Helper function untuk cek authentication
  const isAuthenticated = () => {
    const token = localStorage.getItem("token")
    const user = localStorage.getItem("user")
    return !!(token && user)
  }

  // Helper function untuk get current user
  const getCurrentUser = () => {
    try {
      const user = localStorage.getItem("user")
      return user ? JSON.parse(user) : null
    } catch (error) {
      console.error("Error parsing user data:", error)
      return null
    }
  }

  // API call functions
  const makeApiCall = async (endpoint, options = {}) => {
    const baseUrl = import.meta.env.VITE_API_URL || "https://monitoring-greenhouse-production.up.railway.app"
    const token = localStorage.getItem("token")

    const config = {
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      ...options,
    }

    try {
      const response = await fetch(`${baseUrl}${endpoint}`, config)

      if (!response.ok) {
        const errorData = await response.text()
        let errorMessage = "Terjadi kesalahan pada server"

        try {
          const parsedError = JSON.parse(errorData)
          errorMessage = parsedError.message || parsedError.error || errorMessage
        } catch (e) {
          // If not JSON, use the text as error message
          errorMessage = errorData || errorMessage
        }

        if (response.status === 401) {
          // Token expired or invalid
          localStorage.removeItem("token")
          localStorage.removeItem("user")
          navigate("/")
          throw new Error("Sesi Anda telah berakhir. Silakan login kembali.")
        }

        throw new Error(errorMessage)
      }

      return await response.json()
    } catch (error) {
      if (error.name === "TypeError" && error.message.includes("fetch")) {
        throw new Error("Tidak dapat terhubung ke server. Periksa koneksi internet.")
      }
      throw error
    }
  }

  useEffect(() => {
    // Cek authentication
    if (!isAuthenticated()) {
      alert("Anda harus login terlebih dahulu.")
      navigate("/")
      return
    }

    // Load user data
    loadUserProfile()

    // Update waktu setiap detik
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [navigate])

  const loadUserProfile = async () => {
    try {
      setRefreshing(true)
      setError("")

      console.log("👤 Loading user profile from backend...")

      // Coba ambil data fresh dari API
      const response = await makeApiCall("/api/auth/profile", {
        method: "GET",
      })

      console.log("✅ Profile data received:", response)

      // Handle different response formats from backend
      let userData
      if (response.user) {
        userData = response.user
      } else if (response.data) {
        userData = response.data
      } else {
        userData = response
      }

      setUser(userData)
      setFormData({
        name: userData.userProfile?.name || userData.name || "",
        email: userData.userProfile?.email || userData.email || "",
        phone: userData.userProfile?.phone || userData.phone || "",
        address: userData.userProfile?.address || userData.address || "",
        bio: userData.userProfile?.bio || userData.bio || "",
      })

      // Update localStorage dengan data fresh
      localStorage.setItem("user", JSON.stringify(userData))
    } catch (err) {
      console.error("❌ Error loading profile:", err)
      setError("Gagal memuat data profil dari server: " + err.message)

      // Fallback ke data localStorage
      const localUser = getCurrentUser()
      if (localUser) {
        setUser(localUser)
        setFormData({
          name: localUser.userProfile?.name || localUser.name || "",
          email: localUser.userProfile?.email || localUser.email || "",
          phone: localUser.userProfile?.phone || localUser.phone || "",
          address: localUser.userProfile?.address || localUser.address || "",
          bio: localUser.userProfile?.bio || localUser.bio || "",
        })
      } else {
        navigate("/")
      }
    } finally {
      setRefreshing(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
    if (error) setError("")
    if (success) setSuccess("")
  }

  const handlePasswordChange = (e) => {
    const { name, value } = e.target
    setPasswordData((prev) => ({
      ...prev,
      [name]: value,
    }))
    if (error) setError("")
    if (success) setSuccess("")
  }

  const handleEditToggle = () => {
    if (isEditing) {
      // Cancel editing - reset form data
      setFormData({
        name: user.userProfile?.name || user.name || "",
        email: user.userProfile?.email || user.email || "",
        phone: user.userProfile?.phone || user.phone || "",
        address: user.userProfile?.address || user.address || "",
        bio: user.userProfile?.bio || user.bio || "",
      })
      setError("")
      setSuccess("")
    }
    setIsEditing(!isEditing)
  }

  const validateProfileForm = () => {
    if (!formData.name.trim()) {
      setError("Nama tidak boleh kosong")
      return false
    }

    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      setError("Format email tidak valid")
      return false
    }

    if (formData.phone && !/^[0-9+\-\s()]+$/.test(formData.phone)) {
      setError("Format nomor telepon tidak valid")
      return false
    }

    return true
  }

  const validatePasswordForm = () => {
    if (!passwordData.currentPassword) {
      setError("Password saat ini harus diisi")
      return false
    }

    if (!passwordData.newPassword) {
      setError("Password baru harus diisi")
      return false
    }

    if (passwordData.newPassword.length < 6) {
      setError("Password baru minimal 6 karakter")
      return false
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError("Konfirmasi password tidak cocok")
      return false
    }

    if (passwordData.currentPassword === passwordData.newPassword) {
      setError("Password baru harus berbeda dari password saat ini")
      return false
    }

    return true
  }

  const handleSaveProfile = async () => {
    if (!validateProfileForm()) return

    setLoading(true)
    setError("")
    setSuccess("")

    try {
      console.log("📝 Updating user profile...")
      console.log("Profile data:", formData)

      // Update profil menggunakan backend API
      const response = await makeApiCall("/api/auth/profile", {
        method: "PUT",
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          bio: formData.bio,
        }),
      })

      console.log("✅ Profile updated successfully:", response)

      // Handle different response formats
      let updatedUser
      if (response.user) {
        updatedUser = response.user
      } else if (response.data) {
        updatedUser = response.data
      } else {
        // If backend doesn't return updated user, merge with existing data
        updatedUser = {
          ...user,
          userProfile: {
            ...user.userProfile,
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            address: formData.address,
            bio: formData.bio,
          },
        }
      }

      setUser(updatedUser)
      localStorage.setItem("user", JSON.stringify(updatedUser))

      setSuccess("Profil berhasil diperbarui!")
      setIsEditing(false)

      setTimeout(() => setSuccess(""), 3000)
    } catch (err) {
      console.error("❌ Error updating profile:", err)
      setError(err.message || "Gagal memperbarui profil. Silakan coba lagi.")
    } finally {
      setLoading(false)
    }
  }

  const handleChangePassword = async () => {
    if (!validatePasswordForm()) return

    setLoading(true)
    setError("")
    setSuccess("")

    try {
      console.log("🔒 Changing user password...")

      // Ubah password menggunakan backend API
      const response = await makeApiCall("/api/auth/change-password", {
        method: "PUT",
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      })

      console.log("✅ Password changed successfully:", response)

      setSuccess("Password berhasil diubah!")
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      })
      setShowPasswordForm(false)

      setTimeout(() => setSuccess(""), 3000)
    } catch (err) {
      console.error("❌ Error changing password:", err)
      setError(err.message || "Gagal mengubah password. Silakan coba lagi.")
    } finally {
      setLoading(false)
    }
  }

  const togglePasswordVisibility = (field) => {
    setShowPasswords((prev) => ({
      ...prev,
      [field]: !prev[field],
    }))
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

  const getInitials = (name) => {
    return name
      ? name
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase()
          .slice(0, 2)
      : "U"
  }

  if (!user) {
    return (
      <div className="profile-body">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Memuat profil pengguna...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="profile-body">
      {/* Header */}
      <header className="profile-header">
        <button className="back-button" onClick={() => navigate("/dashboard")}>
          <FiArrowLeft className="back-icon" />
          <span>Kembali ke Dashboard</span>
        </button>

        <div className="header-content">
          <div className="header-title">
            <FiUser className="header-icon" />
            <h1>Profil Pengguna</h1>
          </div>
          <p>Kelola informasi akun dan pengaturan profil Anda</p>
        </div>

        <div className="header-time">
          <div className="current-time">
            <FiClock className="time-icon" />
            <span>{formatTime(currentTime)}</span>
          </div>
          <div className="current-date">{formatDate(currentTime)}</div>
        </div>
      </header>

      {/* Main Content */}
      <main className="profile-main">
        <div className="profile-container">
          {/* Profile Card */}
          <div className="profile-card">
            {/* Profile Header */}
            <div className="profile-card-header">
              <div className="avatar-section">
                <div className="avatar">
                  <span className="avatar-text">
                    {getInitials(user.userProfile?.name || user.name || user.username)}
                  </span>
                  <button className="avatar-edit">
                    <FiEdit />
                  </button>
                </div>
                <div className="user-basic-info">
                  <h2>{user.userProfile?.name || user.name || user.username}</h2>
                  <p>@{user.username}</p>
                  <div className="user-status">
                    <div className="status-indicator active"></div>
                    <span>Aktif</span>
                  </div>
                </div>
              </div>

              <div className="profile-actions">
                <button className="refresh-button" onClick={loadUserProfile} disabled={refreshing}>
                  <FiRefreshCw className={refreshing ? "spinning" : ""} />
                  <span>{refreshing ? "Memuat..." : "Refresh"}</span>
                </button>

                {!isEditing ? (
                  <button className="edit-button" onClick={handleEditToggle}>
                    <FiEdit />
                    <span>Edit Profil</span>
                  </button>
                ) : (
                  <div className="edit-actions">
                    <button className="save-button" onClick={handleSaveProfile} disabled={loading}>
                      {loading ? (
                        <>
                          <div className="loading-spinner small"></div>
                          <span>Menyimpan...</span>
                        </>
                      ) : (
                        <>
                          <FiSave />
                          <span>Simpan</span>
                        </>
                      )}
                    </button>
                    <button className="cancel-button" onClick={handleEditToggle} disabled={loading}>
                      <FiX />
                      <span>Batal</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Messages */}
            {error && (
              <div className="message error-message">
                <FiAlertCircle className="message-icon" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="message success-message">
                <FiCheckCircle className="message-icon" />
                <span>{success}</span>
              </div>
            )}

            {/* Profile Form */}
            <div className="profile-form">
              <div className="form-section">
                <h3>Informasi Pribadi</h3>
                <div className="form-grid">
                  <div className="form-group">
                    <label htmlFor="name">
                      <FiUser className="label-icon" />
                      Nama Lengkap
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      disabled={!isEditing || loading}
                      className="form-input"
                      placeholder="Masukkan nama lengkap"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="username">
                      <FiUser className="label-icon" />
                      Username
                    </label>
                    <input
                      type="text"
                      id="username"
                      name="username"
                      value={user.username}
                      disabled={true} // Username tidak bisa diubah
                      className="form-input"
                      placeholder="Username tidak dapat diubah"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="email">
                      <FiMail className="label-icon" />
                      Email
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      disabled={!isEditing || loading}
                      className="form-input"
                      placeholder="Masukkan alamat email"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="phone">
                      <FiPhone className="label-icon" />
                      Nomor Telepon
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      disabled={!isEditing || loading}
                      className="form-input"
                      placeholder="Masukkan nomor telepon"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="address">
                    <FiMapPin className="label-icon" />
                    Alamat
                  </label>
                  <input
                    type="text"
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    disabled={!isEditing || loading}
                    className="form-input"
                    placeholder="Masukkan alamat lengkap"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="bio">
                    <FiEdit className="label-icon" />
                    Bio
                  </label>
                  <textarea
                    id="bio"
                    name="bio"
                    value={formData.bio}
                    onChange={handleInputChange}
                    disabled={!isEditing || loading}
                    className="form-textarea"
                    placeholder="Ceritakan sedikit tentang diri Anda"
                    rows="3"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Security Card */}
          <div className="security-card">
            <div className="security-header">
              <div className="security-title">
                <FiLock className="security-icon" />
                <h3>Keamanan Akun</h3>
              </div>
              <button
                className="change-password-button"
                onClick={() => setShowPasswordForm(!showPasswordForm)}
                disabled={loading}
              >
                <FiLock />
                <span>Ubah Password</span>
              </button>
            </div>

            {showPasswordForm && (
              <div className="password-form">
                <div className="form-group">
                  <label htmlFor="currentPassword">
                    <FiLock className="label-icon" />
                    Password Saat Ini
                  </label>
                  <div className="input-container">
                    <input
                      type={showPasswords.current ? "text" : "password"}
                      id="currentPassword"
                      name="currentPassword"
                      value={passwordData.currentPassword}
                      onChange={handlePasswordChange}
                      disabled={loading}
                      className="form-input"
                      placeholder="Masukkan password saat ini"
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => togglePasswordVisibility("current")}
                      disabled={loading}
                    >
                      {showPasswords.current ? <FiEyeOff /> : <FiEye />}
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="newPassword">
                    <FiLock className="label-icon" />
                    Password Baru
                  </label>
                  <div className="input-container">
                    <input
                      type={showPasswords.new ? "text" : "password"}
                      id="newPassword"
                      name="newPassword"
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                      disabled={loading}
                      className="form-input"
                      placeholder="Masukkan password baru"
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => togglePasswordVisibility("new")}
                      disabled={loading}
                    >
                      {showPasswords.new ? <FiEyeOff /> : <FiEye />}
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="confirmPassword">
                    <FiLock className="label-icon" />
                    Konfirmasi Password Baru
                  </label>
                  <div className="input-container">
                    <input
                      type={showPasswords.confirm ? "text" : "password"}
                      id="confirmPassword"
                      name="confirmPassword"
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordChange}
                      disabled={loading}
                      className="form-input"
                      placeholder="Ulangi password baru"
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => togglePasswordVisibility("confirm")}
                      disabled={loading}
                    >
                      {showPasswords.confirm ? <FiEyeOff /> : <FiEye />}
                    </button>
                  </div>
                </div>

                <div className="password-actions">
                  <button className="save-password-button" onClick={handleChangePassword} disabled={loading}>
                    {loading ? (
                      <>
                        <div className="loading-spinner small"></div>
                        <span>Mengubah...</span>
                      </>
                    ) : (
                      <>
                        <FiSave />
                        <span>Ubah Password</span>
                      </>
                    )}
                  </button>
                  <button
                    className="cancel-password-button"
                    onClick={() => {
                      setShowPasswordForm(false)
                      setPasswordData({
                        currentPassword: "",
                        newPassword: "",
                        confirmPassword: "",
                      })
                      setError("")
                    }}
                    disabled={loading}
                  >
                    <FiX />
                    <span>Batal</span>
                  </button>
                </div>
              </div>
            )}

            <div className="security-info">
              <div className="info-item">
                <FiCalendar className="info-icon" />
                <div className="info-content">
                  <span className="info-label">Bergabung sejak</span>
                  <span className="info-value">
                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString("id-ID") : "Tidak diketahui"}
                  </span>
                </div>
              </div>
              <div className="info-item">
                <FiRefreshCw className="info-icon" />
                <div className="info-content">
                  <span className="info-label">Login terakhir</span>
                  <span className="info-value">
                    {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString("id-ID") : "Sekarang"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default Profile
