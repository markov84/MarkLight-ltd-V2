import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: Number(process.env.VITE_PORT || 5173),
    hmr: {
      protocol: process.env.VITE_HMR_PROTOCOL || (process.env.HTTPS ? 'wss' : 'ws'),
      host: process.env.VITE_HMR_HOST || undefined,
      clientPort: Number(process.env.VITE_HMR_CLIENT_PORT || process.env.VITE_PORT || 5173),
      port: Number(process.env.VITE_HMR_PORT || process.env.VITE_PORT || 5173)
    }
  }
})
