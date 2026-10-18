// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { learnHelp } from './learnHelp'
import { initialState } from './state'
import { STAGES, type Topic } from './types'
import App from '../App'
import topic from '../../../data/learn/why-we-have-seasons.json'

const T = topic as unknown as Topic

describe('Ask Onion on Learn steps', () => {
  it('knows the topic and step, and never the rule before the done card', () => {
    for (const stage of STAGES) {
      const h = learnHelp(T, { ...initialState(), stage, fix: 'tilt decides' })
      expect(h.topic).toBe('why we have seasons')
      expect(h.onScreen.length).toBeGreaterThan(10)
      const leaked = h.facts.some((f) => f.includes(T.rubric.coreRule))
      expect(leaked).toBe(stage === 'done')
    }
  })

  describe('in the app', () => {
    const BASE = import.meta.env.BASE_URL
    beforeEach(() => {
      vi.stubEnv('VITE_LEARN_MOCK', '1')
      history.replaceState(null, '', `${BASE}?learn=compound-interest`)
    })
    afterEach(() => {
      vi.unstubAllEnvs()
      cleanup()
      history.replaceState(null, '', BASE)
    })
    it('a Learn session has the Ask Onion button in its top bar', async () => {
      render(<App />)
      await screen.findByRole('region', { name: 'guess' })
      expect(document.querySelector('.topbar .topbar-actions button')).toBeTruthy()
      expect(screen.getByRole('button', { name: 'Ask Onion' })).toBeTruthy()
    })
  })
})
