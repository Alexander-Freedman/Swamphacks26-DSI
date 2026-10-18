// @vitest-environment jsdom
import { cleanup, render } from '@testing-library/react'
import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import type { CurveTruth } from '../types'
import { Curve } from './Curve'
import { labelFits } from './labelFits'

afterEach(cleanup)

// jsdom lays nothing out: measure text as 10 units per character so "too wide" can happen
beforeAll(() => {
  ;(window.SVGElement.prototype as unknown as { getComputedTextLength: () => number }).getComputedTextLength = function (this: SVGElement) {
    return [...this.childNodes].filter((n) => n.nodeType === Node.TEXT_NODE).reduce((s, n) => s + (n.textContent ?? '').length, 0) * 10
  }
})

const truth = (x_label: string, y_label: string): CurveTruth => ({ widget: 'curve', expr: 'x', x_min: 0, x_max: 10, x_label, y_label })

describe('axis labels fit the picture', () => {
  it('shortens a label: whole, without its unit, then fewer words', () => {
    expect(labelFits('source velocity toward observer (meters per second)')).toEqual([
      'source velocity toward observer (meters per second)',
      'source velocity toward observer',
      'source velocity toward…',
      'source velocity…',
      'source…',
    ])
    expect(labelFits('years')).toEqual(['years'])
  })

  it('a label that fits is drawn whole', () => {
    const { container } = render(<Curve t={truth('years', 'value ($)')} f={(x) => x} />)
    const shown = [...container.querySelectorAll('text')].map((t) => t.firstChild?.textContent)
    expect(shown).toContain('years')
    expect(shown).toContain('value ($)')
  })

  it('a long generated label drops its unit, then words, and keeps the whole label in its title', () => {
    // 640 wide: the x label gets 640 − 52 − 8 = 580 units, the y label 584 (58 characters at 10 each)
    const x = 'source velocity toward observer moving through still air (meters per second)'
    const y = 'observed frequency at the listener, counted in cycles each second (cycles per second)'
    const { container } = render(<Curve t={truth(x, y)} f={(v) => v} />)
    const shown = [...container.querySelectorAll('text')].map((t) => t.firstChild?.textContent ?? '')
    expect(shown).toContain('source velocity toward observer moving through still air')
    expect(shown).toContain('observed frequency at the listener, counted in cycles…')
    const titles = [...container.querySelectorAll('text title')].map((t) => t.textContent)
    expect(titles).toEqual([y, x])
  })
})
