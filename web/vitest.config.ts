import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config'

// The jsdom flow tests are slow on a 1-CPU box; the 5 s default flakes there.
export default mergeConfig(viteConfig, defineConfig({
  test: { testTimeout: 30000, hookTimeout: 30000 },
}))
