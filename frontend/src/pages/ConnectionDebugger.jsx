"use client"

import { useState } from "react"

export default function DebugConnection() {
  const [results, setResults] = useState([])
  const [isLoading, setIsLoading] = useState(false)

  const addResult = (message, type = "info") => {
    const timestamp = new Date().toLocaleTimeString()
    setResults((prev) => [...prev, { message, type, timestamp }])
  }

  const testDirectConnection = async () => {
    setIsLoading(true)
    setResults([])

    const baseUrl = import.meta.env.VITE_API_URL || "https://monitoring-greenhouse-production.up.railway.app"
    addResult(`🔍 Testing connection to: ${baseUrl}`)

    // Test 1: Basic fetch to root
    try {
      addResult("📡 Test 1: Fetching root endpoint...")
      const response = await fetch(baseUrl)
      const data = await response.json()
      addResult(`✅ Root endpoint OK: ${response.status}`, "success")
      addResult(`📄 Response: ${JSON.stringify(data, null, 2)}`)
    } catch (error) {
      addResult(`❌ Root endpoint failed: ${error.message}`, "error")
    }

    // Test 2: Health check
    try {
      addResult("📡 Test 2: Fetching health endpoint...")
      const response = await fetch(`${baseUrl}/api/health`)
      const data = await response.json()
      addResult(`✅ Health endpoint OK: ${response.status}`, "success")
      addResult(`📄 Health data: ${JSON.stringify(data, null, 2)}`)
    } catch (error) {
      addResult(`❌ Health endpoint failed: ${error.message}`, "error")
    }

    // Test 3: Login endpoint (POST with dummy data)
    try {
      addResult("📡 Test 3: Testing login endpoint...")
      const response = await fetch(`${baseUrl}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "test",
          password: "test",
        }),
      })
      const data = await response.json()
      addResult(`📡 Login endpoint response: ${response.status}`)
      addResult(`📄 Login response: ${JSON.stringify(data, null, 2)}`)

      if (response.status === 401) {
        addResult("✅ Login endpoint working (401 expected for wrong credentials)", "success")
      } else if (response.status === 200) {
        addResult("✅ Login endpoint working (200 - credentials accepted)", "success")
      } else {
        addResult(`⚠️ Login endpoint returned: ${response.status}`, "warning")
      }
    } catch (error) {
      addResult(`❌ Login endpoint failed: ${error.message}`, "error")
    }

    // Test 4: CORS preflight
    try {
      addResult("📡 Test 4: Testing CORS preflight...")
      const response = await fetch(`${baseUrl}/api/auth/login`, {
        method: "OPTIONS",
        headers: {
          "Access-Control-Request-Method": "POST",
          "Access-Control-Request-Headers": "Content-Type",
        },
      })
      addResult(`✅ CORS preflight OK: ${response.status}`, "success")
    } catch (error) {
      addResult(`❌ CORS preflight failed: ${error.message}`, "error")
    }

    setIsLoading(false)
  }

  const testWithAxios = async () => {
    setIsLoading(true)
    setResults([])

    try {
      // Import axios dynamically
      const axios = (await import("axios")).default

      const baseUrl = import.meta.env.VITE_API_URL || "https://monitoring-greenhouse-production.up.railway.app"
      addResult(`🔍 Testing with Axios to: ${baseUrl}`)

      const client = axios.create({
        baseURL: baseUrl,
        timeout: 10000,
        headers: {
          "Content-Type": "application/json",
        },
      })

      // Test login with axios
      try {
        addResult("📡 Testing login with Axios...")
        const response = await client.post("/api/auth/login", {
          username: "test",
          password: "test",
        })
        addResult(`✅ Axios login OK: ${response.status}`, "success")
        addResult(`📄 Axios response: ${JSON.stringify(response.data, null, 2)}`)
      } catch (error) {
        if (error.response) {
          addResult(`📡 Axios got response: ${error.response.status}`)
          addResult(`📄 Axios error data: ${JSON.stringify(error.response.data, null, 2)}`)
          if (error.response.status === 401) {
            addResult("✅ Axios login endpoint working (401 expected)", "success")
          }
        } else {
          addResult(`❌ Axios request failed: ${error.message}`, "error")
        }
      }
    } catch (error) {
      addResult(`❌ Axios test failed: ${error.message}`, "error")
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

  return (
    <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
      <h2>🔧 Debug Koneksi Backend</h2>

      <div style={{ marginBottom: "20px" }}>
        <p>
          <strong>Backend URL:</strong>{" "}
          {import.meta.env.VITE_API_URL || "https://monitoring-greenhouse-production.up.railway.app"}
        </p>
        <p>
          <strong>Environment:</strong> {import.meta.env.DEV ? "Development" : "Production"}
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
          {isLoading ? "Testing..." : "Test Direct Fetch"}
        </button>

        <button
          onClick={testWithAxios}
          disabled={isLoading}
          style={{
            padding: "10px 20px",
            backgroundColor: "#4CAF50",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: isLoading ? "not-allowed" : "pointer",
          }}
        >
          {isLoading ? "Testing..." : "Test with Axios"}
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
