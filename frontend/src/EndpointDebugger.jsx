"use client"

import { useState } from "react"
import { testConnection, discoverAvailableEndpoints } from "./utils/api"

export default function EndpointDebugger() {
  const [debugInfo, setDebugInfo] = useState("")
  const [testing, setTesting] = useState(false)
  const [availableEndpoints, setAvailableEndpoints] = useState([])

  const runEndpointDiscovery = async () => {
    setTesting(true)
    setDebugInfo("🔍 Memulai endpoint discovery...\n")

    try {
      // Test 1: Basic connection
      setDebugInfo((prev) => prev + "\n🔗 Testing basic connection...\n")
      try {
        const connectionResult = await testConnection()
        setDebugInfo((prev) => prev + "✅ Basic connection: SUCCESS\n")
        setDebugInfo((prev) => prev + `- Response: ${JSON.stringify(connectionResult, null, 2)}\n`)
      } catch (error) {
        setDebugInfo((prev) => prev + `❌ Basic connection: FAILED - ${error.message}\n`)
      }

      // Test 2: Discover endpoints
      setDebugInfo((prev) => prev + "\n📋 Discovering available endpoints...\n")
      try {
        const endpoints = await discoverAvailableEndpoints()
        if (endpoints) {
          setAvailableEndpoints(endpoints)
          setDebugInfo((prev) => prev + "✅ Endpoint discovery: SUCCESS\n")
          setDebugInfo((prev) => prev + `- Available endpoints: ${JSON.stringify(endpoints, null, 2)}\n`)
        } else {
          setDebugInfo((prev) => prev + "❌ Endpoint discovery: No endpoint info available\n")
        }
      } catch (error) {
        setDebugInfo((prev) => prev + `❌ Endpoint discovery: FAILED - ${error.message}\n`)
      }

      // Test 3: Test specific endpoints
      setDebugInfo((prev) => prev + "\n🧪 Testing specific endpoints...\n")
      const testEndpoints = ["/", "/api", "/api/health", "/api/auth", "/api/data-sensor", "/api/device"]

      for (const endpoint of testEndpoints) {
        try {
          const response = await fetch(`https://monitoring-greenhouse-production.up.railway.app${endpoint}`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
          })
          setDebugInfo((prev) => prev + `✅ ${endpoint}: ${response.status} ${response.statusText}\n`)
        } catch (error) {
          setDebugInfo((prev) => prev + `❌ ${endpoint}: ${error.message}\n`)
        }
      }
    } catch (error) {
      setDebugInfo((prev) => prev + `\n❌ Discovery error: ${error.message}\n`)
    } finally {
      setTesting(false)
    }
  }

  return (
    <div
      style={{
        position: "fixed",
        top: "10px",
        right: "10px",
        background: "white",
        border: "1px solid #ccc",
        padding: "10px",
        borderRadius: "5px",
        maxWidth: "500px",
        maxHeight: "80vh",
        overflow: "auto",
        zIndex: 9999,
        fontSize: "12px",
      }}
    >
      <button
        onClick={runEndpointDiscovery}
        disabled={testing}
        style={{
          background: "#007bff",
          color: "white",
          border: "none",
          padding: "5px 10px",
          borderRadius: "3px",
          cursor: testing ? "not-allowed" : "pointer",
          marginBottom: "10px",
        }}
      >
        {testing ? "Discovering..." : "Discover Endpoints"}
      </button>

      {availableEndpoints.length > 0 && (
        <div style={{ marginBottom: "10px" }}>
          <strong>Available Endpoints:</strong>
          <ul style={{ margin: "5px 0", paddingLeft: "20px" }}>
            {Object.entries(availableEndpoints).map(([key, value]) => (
              <li key={key}>
                <strong>{key}:</strong> {value}
              </li>
            ))}
          </ul>
        </div>
      )}

      {debugInfo && (
        <pre
          style={{
            background: "#f8f9fa",
            padding: "10px",
            borderRadius: "3px",
            whiteSpace: "pre-wrap",
            maxHeight: "400px",
            overflow: "auto",
          }}
        >
          {debugInfo}
        </pre>
      )}
    </div>
  )
}
