// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import why from './why.json'
import { STEP_NAME, WhyPane, WithWhy, type WhyStage } from './WhyPane'

const WHY_STAGES = Object.keys(why) as WhyStage[]

afterEach(cleanup)

describe('why rail', () => {
  it('the current step is open with its three lines', () => {
    render(<WhyPane stage="stress" />)
    const now = document.querySelector('.why-step.is-now')!
    expect(now.getAttribute('aria-current')).toBe('step')
    expect(now.textContent).toContain(why.stress.doing)
    expect(now.textContent).toContain(why.stress.why)
    expect(now.textContent).toContain(why.stress.source)
  })

  it('past steps keep their reason, folded; future steps are names only', () => {
    render(<WhyPane stage="stress" />)
    const past = document.querySelectorAll('.why-step.is-past')
    const next = document.querySelectorAll('.why-step.is-next')
    expect(past.length).toBe(3) // guess, anchor, contrast
    expect(next.length).toBe(4) // draw, neighbor, transfer, done
    const guess = past[0].querySelector('details')!
    expect(guess.open).toBe(false)
    expect(guess.textContent).toContain(STEP_NAME.guess)
    expect(guess.textContent).toContain(why.guess.why) // kept, just folded
    expect(next[0].textContent).not.toContain(why.draw.why)
  })

  it('every stage in why.json renders, within the copy limits in docs/why-pane.md', () => {
    const words = (s: string) => s.trim().split(/\s+/).length
    expect(WHY_STAGES).toEqual(['guess', 'anchor', 'contrast', 'stress', 'draw', 'neighbor', 'transfer', 'done'])
    for (const s of WHY_STAGES) {
      expect(words(why[s].doing)).toBeLessThanOrEqual(12)
      expect(words(why[s].why)).toBeLessThanOrEqual(25)
      expect(why[s].source.length).toBeGreaterThan(0)
      expect(STEP_NAME[s].length).toBeGreaterThan(0)
      render(<WhyPane stage={s} />)
      cleanup()
    }
  })

  it('the phone line says where you are and opens the list', () => {
    render(<WhyPane stage="contrast" />)
    const toggle = screen.getByRole('button', { name: /Step 3 of 8 · Compare two cases/ })
    expect(toggle.getAttribute('aria-expanded')).toBe('false')
    fireEvent.click(toggle)
    expect(toggle.getAttribute('aria-expanded')).toBe('true')
    expect(screen.getByRole('complementary', { name: 'why this step' }).className).toContain('open')
  })

  it('WithWhy puts the rail on the left of the screen', () => {
    render(
      <WithWhy stage="draw">
        <p>the screen</p>
      </WithWhy>,
    )
    const layout = document.querySelector('.why-layout')!
    expect(layout.children[0].getAttribute('aria-label')).toBe('why this step')
    expect(layout.children[1].textContent).toBe('the screen')
  })
})
