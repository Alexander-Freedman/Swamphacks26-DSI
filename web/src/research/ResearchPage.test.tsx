// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import data from './research.json'
import { ResearchPage } from './ResearchPage'
import App from '../App'

afterEach(cleanup)
const ids = new Set(data.sources.map((s) => s.id))

describe('research page data', () => {
  it('every cited id is a listed source, and every source has a checkable https link', () => {
    for (const d of [...data.decisions, ...data.faq]) for (const id of d.sources) expect(ids.has(id), `${id} is listed`).toBe(true)
    for (const s of data.sources) {
      expect(s.url).toMatch(/^https:\/\//)
      expect(s.title.length).toBeGreaterThan(3)
      expect(s.year).toBeGreaterThan(1900)
    }
    expect(new Set(data.sources.map((s) => s.id)).size).toBe(data.sources.length)
  })

  it('covers the no-points question in the FAQ', () => {
    expect(data.faq.some((f) => /points|XP|streak/i.test(f.q))).toBe(true)
  })
})

describe('research page', () => {
  it('lists every step, the questions and the sources, with outbound links', () => {
    render(<ResearchPage />)
    expect(screen.getByRole('heading', { name: 'The research behind Onionskin' })).toBeTruthy()
    expect(document.querySelectorAll('.rs-step').length).toBe(data.decisions.length)
    expect(document.querySelectorAll('.rs-q').length).toBe(data.faq.length)
    const links = [...document.querySelectorAll('.rs-sources a')] as HTMLAnchorElement[]
    expect(links.length).toBe(data.sources.length)
    expect(links.every((a) => a.target === '_blank' && a.rel.includes('noopener'))).toBe(true)
  })

  it('Home links to it and ?research=1 opens it', () => {
    history.replaceState(null, '', import.meta.env.BASE_URL)
    render(<App />)
    expect(screen.getByText('The research behind it').closest('a')?.getAttribute('href')).toBe(`${import.meta.env.BASE_URL}?research=1`)
    cleanup()
    history.replaceState(null, '', `${import.meta.env.BASE_URL}?research=1`)
    render(<App />)
    expect(screen.getByRole('heading', { name: 'The research behind Onionskin' })).toBeTruthy()
    history.replaceState(null, '', import.meta.env.BASE_URL)
  })
})
