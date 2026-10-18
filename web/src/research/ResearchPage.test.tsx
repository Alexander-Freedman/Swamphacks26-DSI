// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import data from './research.json'
import { ONION_FACTS, ResearchPage } from './ResearchPage'
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

  it('a "Research: why it works" tab next to the logo opens it, and ?research=1 opens it directly', async () => {
    const { fireEvent } = await import('@testing-library/react')
    history.replaceState(null, '', import.meta.env.BASE_URL)
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Research: why it works' }))
    expect(screen.getByRole('heading', { name: 'The research behind Onionskin' })).toBeTruthy()
    expect(location.search).toBe('?research=1')
    expect(screen.getAllByText('← Home').length).toBe(2) // top and bottom
    cleanup()
    history.replaceState(null, '', `${import.meta.env.BASE_URL}?research=1`)
    render(<App />)
    expect(screen.getByRole('heading', { name: 'The research behind Onionskin' })).toBeTruthy()
    history.replaceState(null, '', import.meta.env.BASE_URL)
  })
})


describe('research page: FAQ and Ask Onion', () => {
  it('questions start folded and open on tap', async () => {
    const { fireEvent } = await import('@testing-library/react')
    render(<ResearchPage />)
    const qs = [...document.querySelectorAll('details.rs-q')] as HTMLDetailsElement[]
    expect(qs.length).toBe(data.faq.length)
    expect(qs.every((q) => !q.open)).toBe(true)
    fireEvent.click(qs[0].querySelector('summary')!)
    expect(qs[0].open).toBe(true)
  })

  it("Onion's facts are only our research and fit the help request limits", () => {
    expect(ONION_FACTS[0]).toMatch(/Only answer from the research listed here/)
    expect(ONION_FACTS.slice(0, 12).every((f) => f.length <= 200)).toBe(true)
    expect(ONION_FACTS[1]).toMatch(/^Guess first \(Richland/) // the citation survives the cut
    expect(ONION_FACTS[0].length).toBeLessThanOrEqual(200)
  })

  it('the research page has Ask Onion in its top bar', () => {
    history.replaceState(null, '', `${import.meta.env.BASE_URL}?research=1`)
    render(<App />)
    expect(screen.getByRole('button', { name: 'Ask Onion' })).toBeTruthy()
    history.replaceState(null, '', import.meta.env.BASE_URL)
  })
})
