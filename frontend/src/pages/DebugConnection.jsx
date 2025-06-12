"use client"

import { useState } from "react"

const DebugConnection = () => {
  const [results, setResults] = useState([])
  const [isLoading, setIsLoading] = useState(false)

  const addResult = (message, type = "info") => {
    const timestamp = new Date().toLocaleTimeString()
    setResults((prev) => [...prev, { message, type, timestamp }])
  }

  const testDirectConnection = async () => {
    setIsLoading(true)
    setResults([])

    // Safe environment variable access
    const baseUrl = import.meta.env?.VITE_API_URL || "https://monitoring-greenhouse-production.up.railway.app"
    addResult(`🔍 Testing connection to: ${baseUrl}`)

    // Test endpoints
    const endpoints = [
      { name: "Root", path: "" },
      { name: "Health", path: "/api/health" },
      { name: "Login", path: "/api/auth/login", method: "POST" },
    ]

    for (const endpoint of endpoints) {
      try {
        addResult(`📡 Testing ${endpoint.name} endpoint...`)

        const options = {
          method: endpoint.method || "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }

        if (endpoint.method === "POST") {
          options.body = JSON.stringify({
            username: "test",
            password: "test",
          })
        }

        const response = await fetch(`${baseUrl}${endpoint.path}`, options)
        const data = await response.json()

        addResult(`✅ ${endpoint.name} endpoint OK: ${response.status}`, "success")
        addResult(`📄 Response: ${JSON.stringify(data, null, 2)}`)
      } catch (error) {
        addResult(`❌ ${endpoint.name} endpoint failed: ${error.message}`, "error")
      }
    }

    setIsLoading(false)
  }

  const getResultColor = (type) => {
    switch (type) {
      case "success":
        return "#4CAF50"
      case "error":
        return "#f44336"
      case "warning":
        return "#ff9800"
      default:
        return "#333"
    }
  }

  // Hanya tampil di development
  if (import.meta.env?.PROD) return null

  return (
    <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
      <h2>🔧 Debug Koneksi Backend</h2>

      <div style={{ marginBottom: "20px" }}>
        <p>
          <strong>Backend URL:</strong>{" "}
          {import.meta.env?.VITE_API_URL || "https://monitoring-greenhouse-production.up.railway.app"}
        </p>
        <p>
          <strong>Environment:</strong> {import.meta.env?.DEV ? "Development" : "Production"}
        </p>
      </div>

      <div style={{ marginBottom: "20px", display: "flex", gap: "10px" }}>
        <button
          onClick={testDirectConnection}
          disabled={isLoading}
          style={{
            padding: "10px 20px",
            backgroundColor: "#2196F3",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: isLoading ? "not-allowed" : "pointer",
          }}
        >
          {isLoading ? "Testing..." : "Test Connection"}
        </button>

        <button
          onClick={() => setResults([])}
          style={{
            padding: "10px 20px",
            backgroundColor: "#757575",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          Clear Results
        </button>
      </div>

      <div
        style={{
          border: "1px solid #ddd",
          borderRadius: "5px",
          padding: "15px",
          backgroundColor: "#f9f9f9",
          maxHeight: "500px",
          overflowY: "auto",
        }}
      >
        <h3>Test Results:</h3>
        {results.length === 0 ? (
          <p style={{ color: "#666" }}>Klik tombol di atas untuk mulai testing...</p>
        ) : (
          results.map((result, index) => (
            <div
              key={index}
              style={{
                marginBottom: "8px",
                padding: "8px",
                backgroundColor: "white",
                borderRadius: "3px",
                borderLeft: `4px solid ${getResultColor(result.type)}`,
              }}
            >
              <span style={{ fontSize: "12px", color: "#666" }}>[{result.timestamp}]</span>
              <div style={{ color: getResultColor(result.type), fontFamily: "monospace", fontSize: "14px" }}>
                {result.message}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default DebugConnection
