"use client"

import { useState } from "react"
import { testConnection } from "../utils/api"

export default function ConnectionTest() {
  const [testResult, setTestResult] = useState("")
  const [testing, setTesting] = useState(false)

  const runTest = async () => {
    setTesting(true)
    setTestResult("🔍 Testing connection...\n")

    try {
      // Test basic connection
      const response = await testConnection()
      setTestResult((prev) => prev + "✅ Connection successful!\n")
      setTestResult((prev) => prev + `📋 Response: ${JSON.stringify(response, null, 2)}\n`)

      // Test specific endpoints
      setTestResult((prev) => prev + "\n🧪 Testing specific endpoints...\n")

      const endpoints = [
        { path: "/", name: "Root" },
        { path: "/api", name: "API Info" },
        { path: "/api/health", name: "Health Check" },
        { path: "/api/auth", name: "Auth Routes" },
      ]

      for (const endpoint of endpoints) {
        try {
          const response = await fetch(`https://monitoring-greenhouse-production.up.railway.app${endpoint.path}`)
          setTestResult((prev) => prev + `✅ ${endpoint.name} (${endpoint.path}): ${response.status}\n`)
        } catch (error) {
          setTestResult((prev) => prev + `❌ ${endpoint.name} (${endpoint.path}): ${error.message}\n`)
        }
      }
    } catch (error) {
      setTestResult((prev) => prev + `❌ Connection failed: ${error.message}\n`)
    } finally {
      setTesting(false)
    }
  }

  return (
    <div
      style={{
        position: "fixed",
        top: "10px",
        left: "10px",
        background: "white",
        border: "1px solid #ccc",
        padding: "10px",
        borderRadius: "5px",
        maxWidth: "400px",
        maxHeight: "400px",
        overflow: "auto",
        zIndex: 9999,
        fontSize: "12px",
      }}
    >
      <button
        onClick={runTest}
        disabled={testing}
        style={{
          background: "#28a745",
          color: "white",
          border: "none",
          padding: "5px 10px",
          borderRadius: "3px",
          cursor: testing ? "not-allowed" : "pointer",
          marginBottom: "10px",
        }}
      >
        {testing ? "Testing..." : "Test Connection"}
      </button>

      {testResult && (
        <pre
          style={{
            background: "#f8f9fa",
            padding: "10px",
            borderRadius: "3px",
            whiteSpace: "pre-wrap",
            fontSize: "11px",
          }}
        >
          {testResult}
        </pre>
      )}
    </div>
  )
}
