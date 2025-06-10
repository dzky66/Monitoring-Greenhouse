"use client"

import { useState } from "react"
import { testRailwayConnection, testConnection } from "../utils/api"

export default function ConnectionDebugger() {
  const [debugInfo, setDebugInfo] = useState("")
  const [testing, setTesting] = useState(false)

  const runConnectionTest = async () => {
    setTesting(true)
    setDebugInfo("🔍 Memulai test koneksi...\n")

    try {
      // Test 1: Environment variables
      setDebugInfo((prev) => prev + "\n📋 Environment Check:\n")
      setDebugInfo((prev) => prev + `- VITE_API_URL: ${import.meta.env.VITE_API_URL || "NOT SET"}\n`)
      setDebugInfo((prev) => prev + `- Current URL: ${window.location.href}\n`)
      setDebugInfo((prev) => prev + `- Hostname: ${window.location.hostname}\n`)

      // Test 2: Direct Railway connection
      setDebugInfo((prev) => prev + "\n🚂 Testing Railway connection...\n")
      const railwayTest = await testRailwayConnection()
      setDebugInfo((prev) => prev + `- Railway direct test: ${railwayTest ? "✅ SUCCESS" : "❌ FAILED"}\n`)

      // Test 3: API client connection
      setDebugInfo((prev) => prev + "\n🔧 Testing API client...\n")
      try {
        await testConnection()
        setDebugInfo((prev) => prev + "- API client test: ✅ SUCCESS\n")
      } catch (error) {
        setDebugInfo((prev) => prev + `- API client test: ❌ FAILED - ${error.message}\n`)
      }

      // Test 4: CORS test
      setDebugInfo((prev) => prev + "\n🌐 Testing CORS...\n")
      try {
        const corsResponse = await fetch("https://monitoring-greenhouse-production.up.railway.app/api/health", {
          method: "GET",
          mode: "cors",
          headers: {
            "Content-Type": "application/json",
          },
        })
        setDebugInfo((prev) => prev + `- CORS test: ${corsResponse.ok ? "✅ SUCCESS" : "❌ FAILED"}\n`)
      } catch (error) {
        setDebugInfo((prev) => prev + `- CORS test: ❌ FAILED - ${error.message}\n`)
      }
    } catch (error) {
      setDebugInfo((prev) => prev + `\n❌ Test error: ${error.message}\n`)
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
        maxWidth: "400px",
        zIndex: 9999,
        fontSize: "12px",
      }}
    >
      <button
        onClick={runConnectionTest}
        disabled={testing}
        style={{
          background: "#007bff",
          color: "white",
          border: "none",
          padding: "5px 10px",
          borderRadius: "3px",
          cursor: testing ? "not-allowed" : "pointer",
        }}
      >
        {testing ? "Testing..." : "Debug Connection"}
      </button>

      {debugInfo && (
        <pre
          style={{
            marginTop: "10px",
            background: "#f8f9fa",
            padding: "10px",
            borderRadius: "3px",
            whiteSpace: "pre-wrap",
            maxHeight: "300px",
            overflow: "auto",
          }}
        >
          {debugInfo}
        </pre>
      )}
    </div>
  )
}
