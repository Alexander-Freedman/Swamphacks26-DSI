import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// GitHub Pages serves the site under /Swamphacks26-DSI/. Override with
// VITE_BASE=/ for a root deploy (e.g. a custom domain later).
// Use import.meta.env.BASE_URL for asset and data paths, and as the router basename.
export default defineConfig({
  base: process.env.VITE_BASE ?? '/Swamphacks26-DSI/',
  plugins: [react()],
  server: {
    proxy: { '/api': 'http://localhost:8000' },
    // Showcase rounds are bundled from ../data/rounds.
    fs: { allow: ['..'] },
  },
})
