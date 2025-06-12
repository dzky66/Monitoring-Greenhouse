import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true,
  },
  build: {
    outDir: "dist",
    sourcemap: false,
    minify: "terser",
    rollupOptions: {
      output: {
        manualChunks: undefined, // Disable manual chunking yang bisa menyebabkan error
      },
      external: [], // Pastikan tidak ada external dependencies yang bermasalah
    },
    // Tambahan untuk mengatasi build issues
    commonjsOptions: {
      include: [/node_modules/],
    },
  },
  resolve: {
    alias: {
      "@": "/src",
    },
  },
  // Pastikan environment variables tersedia
  define: {
    "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV || "production"),
  },
})
