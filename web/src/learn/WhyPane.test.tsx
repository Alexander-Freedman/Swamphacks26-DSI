// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import why from './why.json'
import { WhyPane, WithWhy, type WhyStage } from './WhyPane'

const WHY_STAGES = Object.keys(why) as WhyStage[]

afterEach(cleanup)

describe('why-pane', () => {
  it('shows the three lines for a stage', () => {
    render(<WhyPane stage="stress" />)
    const pane = screen.getByRole('complementary', { name: 'why this step' })
    expect(pane.textContent).toContain(why.stress.doing)
    expect(pane.textContent).toContain(why.stress.why)
    expect(pane.textContent).toContain(why.stress.source)
  })

  it('every stage in why.json renders, within the copy limits in docs/why-pane.md', () => {
    const words = (s: string) => s.trim().split(/\s+/).length
    expect(WHY_STAGES).toEqual(['guess', 'anchor', 'contrast', 'stress', 'draw', 'neighbor', 'transfer', 'done'])
    for (const s of WHY_STAGES) {
      expect(words(why[s].doing)).toBeLessThanOrEqual(12)
      expect(words(why[s].why)).toBeLessThanOrEqual(25)
      expect(why[s].source.length).toBeGreaterThan(0)
      render(<WhyPane stage={s} />)
      cleanup()
    }
  })

  it('the phone toggle opens and closes the strip', () => {
    render(<WhyPane stage="guess" />)
    const toggle = screen.getByRole('button', { name: /Why this step\?/ })
    expect(toggle.getAttribute('aria-expanded')).toBe('false')
    fireEvent.click(toggle)
    expect(toggle.getAttribute('aria-expanded')).toBe('true')
    expect(screen.getByRole('complementary').className).toContain('open')
  })

  it('WithWhy puts the screen and its pane side by side', () => {
    render(
      <WithWhy stage="draw">
        <p>the screen</p>
      </WithWhy>,
    )
    const layout = document.querySelector('.why-layout')!
    expect(layout.children[0].textContent).toBe('the screen')
    expect(layout.children[1].getAttribute('aria-label')).toBe('why this step')
  })
})
