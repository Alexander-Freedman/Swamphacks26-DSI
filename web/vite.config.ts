import react from '@vitejs/plugin-react'
import { readFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineConfig, type Plugin } from 'vite'

import { extraIndex } from './src/extraIndex.ts'

const extraDir = resolve(import.meta.dirname, '../data/rounds/extra')
const readExtras = (): { slug?: unknown }[] =>
  readdirSync(extraDir)
    .filter((f) => f.endsWith('.json'))
    .sort()
    .map((f) => JSON.parse(readFileSync(resolve(extraDir, f), 'utf8')))

// Dev: serve data/rounds/extra/ at <base>rounds/extra/ the way scripts/deploy-pages.sh
// publishes it on Pages, so "Try any topic" works the same with no backend running.
// Dev + build: `virtual:extra-index` is that same index baked into the bundle (names only, no
// round bodies) for a backend-only deploy with no static index next to the page.
function extraRounds(): Plugin {
  const id = 'virtual:extra-index'
  return {
    name: 'extra-rounds',
    resolveId: (src) => (src === id ? '\0' + id : undefined),
    load(resolved) {
      if (resolved !== '\0' + id) return
      for (const f of readdirSync(extraDir)) this.addWatchFile(resolve(extraDir, f))
      return `export default ${JSON.stringify(extraIndex(readExtras()))}`
    },
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const m = /\/rounds\/extra\/([a-z0-9-]+)\.json$/.exec((req.url ?? '').split('?')[0])
        if (!m) return next()
        const rounds = readExtras()
        const body = m[1] === 'index' ? extraIndex(rounds) : rounds.find((d) => d.slug === m[1])
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
