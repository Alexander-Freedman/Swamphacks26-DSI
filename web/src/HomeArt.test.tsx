// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import App from './App'
import { sessions } from './sessions/registry'

afterEach(cleanup)

const cardArt = () => Array.from(document.querySelectorAll<HTMLImageElement>('.showcase img.card-art'))

describe('session card art on Home', () => {
  it('gives every session card art from BASE_URL with a 256/512 srcSet', () => {
    render(<App />)
    const imgs = cardArt()
    expect(imgs).toHaveLength(sessions.length)
    const base = import.meta.env.BASE_URL
    sessions.forEach((s, i) => {
      const img = imgs[i]
      expect(img.getAttribute('src')).toBe(`${base}art/session-${s.slug}-512.webp`)
      expect(img.getAttribute('srcset')).toBe(`${base}art/session-${s.slug}-256.webp 256w, ${base}art/session-${s.slug}-512.webp 512w`)
      expect(img.getAttribute('sizes')).toBeTruthy()
    })
  })

  it('is decorative, sized up front, and lazy after the first card', () => {
    render(<App />)
    const imgs = cardArt()
    for (const img of imgs) {
      expect(img.getAttribute('alt')).toBe('')
      expect(img.getAttribute('width')).toBe('512')
      expect(img.getAttribute('height')).toBe('512')
    }
    expect(imgs[0].getAttribute('loading')).toBe('eager')
    for (const img of imgs.slice(1)) expect(img.getAttribute('loading')).toBe('lazy')
  })

  it('keeps the cards opening their sessions', () => {
    render(<App />)
    for (const s of sessions) {
      fireEvent.click(screen.getByText(s.title))
      expect(document.querySelector('.showcases.sessions')).toBeNull()
      fireEvent.click(screen.getByText('Onionskin'))
      expect(document.querySelector('.showcases.sessions')).toBeTruthy()
    }
  })

  it('keeps the any-topic box below the cards', () => {
    render(<App />)
    const cards = document.querySelector('.showcases.sessions')!
    const forms = document.querySelectorAll('.home form, .home input')
    expect(forms.length).toBeGreaterThan(0)
    expect(cards.compareDocumentPosition(forms[0]) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })
})
