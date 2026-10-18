// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createMockLearnApi } from '../learnApi'
import { LearnSession } from './LearnSession'
import { STAGES } from './types'
import App from '../App'

afterEach(cleanup)

describe('LearnSession shell', () => {
  it('stacks each step under the last; finished ones fold to a summary, Home leaves', async () => {
    const onDone = vi.fn()
    render(<LearnSession slug="compound-interest" onDone={onDone} api={createMockLearnApi()} initial={{ stage: 'contrast' }} />)
    await screen.findByText('compound interest')
    const later = STAGES.slice(STAGES.indexOf('contrast'))
    for (const stage of later.slice(0, -1)) {
      expect(screen.getByRole('region', { name: stage })).toBeTruthy()
      fireEvent.click(screen.getByRole('button', { name: 'Next' }))
      expect(document.querySelectorAll('.learn-card').length).toBe(STAGES.indexOf(stage) + 2)
    }
    expect(screen.getByRole('region', { name: 'done' })).toBeTruthy()
    // finished steps are folded (their screens hidden) behind a one-line head
    const heads = document.querySelectorAll('.learn-card.is-past .learn-card-head')
    expect(heads.length).toBe(STAGES.length - 1)
    expect(screen.queryByRole('region', { name: 'transfer' })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Try another topic' }))
    expect(onDone).toHaveBeenCalledTimes(1)
    fireEvent.click(screen.getByRole('button', { name: 'Home' }))
    expect(onDone).toHaveBeenCalledTimes(2)
  })

  it('a finished step keeps your answer and opens read-only on tap', async () => {
    render(<LearnSession slug="compound-interest" onDone={() => {}} api={createMockLearnApi()} />)
    await screen.findByText('compound interest')
    fireEvent.change(screen.getByLabelText('guess answer'), { target: { value: 'my guess' } })
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Next' }))
    await screen.findByRole('region', { name: 'anchor' })
    const head = document.querySelector('.learn-card.is-past .learn-card-head') as HTMLButtonElement
    expect(head.textContent).toContain('Guess first')
    expect(head.textContent).toContain('my guess')
    expect(head.getAttribute('aria-expanded')).toBe('false')
    fireEvent.click(head)
    expect(head.getAttribute('aria-expanded')).toBe('true')
    const body = document.querySelector('.learn-card.is-past .learn-card-body') as HTMLElement
    expect(body.hidden).toBe(false)
    expect(body.hasAttribute('inert')).toBe(true)
    expect((body.querySelector('textarea[aria-label="guess answer"]') as HTMLTextAreaElement).value).toBe('my guess')
  })

  it('shows a why-pane for the stage', async () => {
    render(<LearnSession slug="compound-interest" onDone={() => {}} api={createMockLearnApi()} />)
    await screen.findByText('compound interest')
    expect(screen.getByRole('complementary', { name: 'Why this step' })).toBeTruthy()
  })

  it('an unknown topic offers a way home', async () => {
    const onDone = vi.fn()
    render(<LearnSession slug="nope" onDone={onDone} api={createMockLearnApi()} />)
    fireEvent.click(await screen.findByRole('button', { name: 'Back to Home' }))
    expect(onDone).toHaveBeenCalled()
  })
})

describe('?learn= routing', () => {
  const BASE = import.meta.env.BASE_URL
  beforeEach(() => {
    vi.stubEnv('VITE_LEARN_MOCK', '1')
    history.replaceState(null, '', BASE)
  })
  afterEach(() => vi.unstubAllEnvs())

  it('opens a Learn session from the URL, survives refresh, and the logo goes Home', async () => {
    history.replaceState(null, '', `${BASE}?learn=compound-interest`)
    const { unmount } = render(<App />)
    await screen.findByRole('region', { name: 'guess' })
    unmount()
    render(<App />) // refresh
    await screen.findByRole('region', { name: 'guess' })
    fireEvent.click(screen.getByRole('button', { name: 'Onionskin' }))
    expect(location.search).toBe('')
  })
})
