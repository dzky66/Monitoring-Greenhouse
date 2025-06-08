import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import Login from "./pages/LoginRegister"
import Dashboard from "./pages/Dashboard"
import KontrolCepat from "./pages/KontrolCepat"
import Penjadwalan from "./pages/Penjadwalan"
import Monitoring from "./pages/monitor"
import PrediksiHasil from "./pages/PrediksiHasil"
import Profile from "./pages/profile"


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/kontrol-cepat" element={<KontrolCepat />} />
        <Route path="/penjadwalan" element={<Penjadwalan />} />
        <Route path="/monitoring" element={<Monitoring />} />
        <Route path="/prediksi-hasil" element={<PrediksiHasil />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </Router>
  )
}

export default App
