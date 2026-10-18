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
      expect(h.hint).not.toBe(h.title) // a real nudge, not the step name
      expect(h.hint.includes(T.rubric.coreRule)).toBe(false)
      const leaked = h.facts.some((f) => f.includes(T.rubric.coreRule))
      expect(leaked).toBe(stage === 'done')
    }
  })

  describe('in the app', () => {
    const BASE = import.meta.env.BASE_URL
    beforeEach(() => {
      vi.stubEnv('VITE_LEARN_MOCK', '1')
    vi.stubEnv('VITE_API_BASE', 'https://api.test') // Ask Onion needs a live server
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

describe('Ask Onion docks on the right on Learn pages', () => {
  const BASE = import.meta.env.BASE_URL
  beforeEach(() => {
    vi.stubEnv('VITE_LEARN_MOCK', '1')
    vi.stubEnv('VITE_API_BASE', 'https://api.test') // Ask Onion needs a live server
    history.replaceState(null, '', `${BASE}?learn=compound-interest`)
  })
  afterEach(() => {
    vi.unstubAllEnvs()
    cleanup()
    history.replaceState(null, '', BASE)
  })
  it('opens as a docked panel and the page makes room until it closes', async () => {
    const { fireEvent } = await import('@testing-library/react')
    render(<App />)
    await screen.findByRole('region', { name: 'guess' })
    fireEvent.click(screen.getByRole('button', { name: 'Ask Onion' }))
    expect(document.querySelector('.ask-panel.ask-docked')).toBeTruthy()
    expect(document.body.classList.contains('onion-docked')).toBe(true)
    fireEvent.click(screen.getByRole('button', { name: 'Close Ask Onion' }))
    expect(document.body.classList.contains('onion-docked')).toBe(false)
  })
})
