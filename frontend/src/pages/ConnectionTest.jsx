"use client"

import { useState, useEffect } from "react"
import { testConnection } from "../utils/api"

export default function ConnectionTest() {
  const [status, setStatus] = useState("pending")
  const [message, setMessage] = useState("Memeriksa koneksi ke backend...")
  const [details, setDetails] = useState(null)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    const checkConnection = async () => {
      try {
        const response = await testConnection()
        setStatus("success")
        setMessage("Terhubung ke backend!")
        setDetails(response)
      } catch (error) {
        setStatus("error")
        setMessage(`Gagal terhubung: ${error.message}`)
        setDetails(error)
      }
    }

    checkConnection()
  }, [])

  return (
    <div
      style={{
        position: "fixed",
        bottom: "20px",
        right: "20px",
        padding: "10px 15px",
        borderRadius: "8px",
        backgroundColor:
          status === "success"
            ? "rgba(0, 128, 0, 0.8)"
            : status === "error"
              ? "rgba(220, 0, 0, 0.8)"
              : "rgba(0, 0, 0, 0.7)",
        color: "white",
        fontSize: "14px",
        zIndex: 9999,
        boxShadow: "0 2px 10px rgba(0, 0, 0, 0.2)",
        maxWidth: expanded ? "500px" : "300px",
        transition: "all 0.3s ease",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {status === "pending" && (
            <div
              style={{
                width: "16px",
                height: "16px",
                borderRadius: "50%",
                border: "2px solid rgba(255, 255, 255, 0.3)",
                borderTopColor: "white",
                animation: "spin 1s linear infinite",
              }}
            />
          )}
          {status === "success" && (
            <div
              style={{
                width: "16px",
                height: "16px",
                borderRadius: "50%",
                backgroundColor: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "12px",
              }}
            >
              ✓
            </div>
          )}
          {status === "error" && (
            <div
              style={{
                width: "16px",
                height: "16px",
                borderRadius: "50%",
                backgroundColor: "white",
                color: "red",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "12px",
              }}
            >
              !
            </div>
          )}
          <span>{message}</span>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          style={{
            background: "none",
            border: "none",
            color: "white",
            cursor: "pointer",
            fontSize: "12px",
            marginLeft: "10px",
          }}
        >
          {expanded ? "▲" : "▼"}
        </button>
      </div>

      {expanded && details && (
        <div
          style={{
            marginTop: "10px",
            padding: "10px",
            backgroundColor: "rgba(0, 0, 0, 0.3)",
            borderRadius: "4px",
            fontSize: "12px",
            maxHeight: "300px",
            overflow: "auto",
          }}
        >
          <pre style={{ margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
            {JSON.stringify(details, null, 2)}
          </pre>
        </div>
      )}

      <style jsx>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  )
}
