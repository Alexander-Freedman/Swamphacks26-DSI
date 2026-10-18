// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createMockLearnApi } from '../learnApi'
import { LearnSession } from './LearnSession'
import { STAGES } from './types'
import App from '../App'

afterEach(cleanup)

describe('LearnSession shell', () => {
  it('walks all eight stages with the stubs, and Back steps back', async () => {
    const onDone = vi.fn()
    render(<LearnSession slug="compound-interest" onDone={onDone} api={createMockLearnApi()} />)
    await screen.findByText('compound interest')
    for (const stage of STAGES.slice(0, -1)) {
      expect(screen.getByRole('region', { name: stage })).toBeTruthy()
      fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    }
    expect(screen.getByRole('region', { name: 'done' })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Back' }))
    expect(screen.getByRole('region', { name: 'transfer' })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    fireEvent.click(screen.getByRole('button', { name: 'Finish' }))
    expect(onDone).toHaveBeenCalled()
  })

  it('keeps typed answers in session state across stages', async () => {
    render(<LearnSession slug="compound-interest" onDone={() => {}} api={createMockLearnApi()} />)
    await screen.findByText('compound interest')
    fireEvent.change(screen.getByLabelText('guess answer'), { target: { value: 'my guess' } })
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    await screen.findByRole('region', { name: 'anchor' })
    expect(screen.queryByText('thinking…')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Back' }))
    expect((screen.getByLabelText('guess answer') as HTMLTextAreaElement).value).toBe('my guess')
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
