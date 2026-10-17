import react from '@vitejs/plugin-react'
import { readFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineConfig, type Plugin } from 'vite'

// Dev only: serve data/rounds/extra/ at <base>rounds/extra/ the way scripts/deploy-pages.sh
// publishes it on Pages, so "Try any topic" works the same with no backend running.
function extraRounds(): Plugin {
  const dir = resolve(import.meta.dirname, '../data/rounds/extra')
  return {
    name: 'extra-rounds',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const m = /\/rounds\/extra\/([a-z0-9-]+)\.json$/.exec((req.url ?? '').split('?')[0])
        if (!m) return next()
        const files = readdirSync(dir).filter((f) => f.endsWith('.json'))
        const rounds = files.map((f) => JSON.parse(readFileSync(resolve(dir, f), 'utf8')))
        const body =
          m[1] === 'index'
            ? rounds.filter((d) => d.reviewed).map((d) => ({ slug: d.slug, topic: d.topic, aliases: d.aliases ?? [] }))
            : rounds.find((d) => d.slug === m[1])
        if (!body) return next()
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify(body))
      })
    },
  }
}

// GitHub Pages serves the site under /Swamphacks26-DSI/. Override with
// VITE_BASE=/ for a root deploy (e.g. a custom domain later).
// Use import.meta.env.BASE_URL for asset and data paths, and as the router basename.
export default defineConfig({
  base: process.env.VITE_BASE ?? '/Swamphacks26-DSI/',
  plugins: [react(), extraRounds()],
  server: {
    proxy: { '/api': 'http://localhost:8000' },
    // Showcase rounds are bundled from ../data/rounds.
    fs: { allow: ['..'] },
  },
})
