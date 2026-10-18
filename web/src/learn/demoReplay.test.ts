// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import seasons from '../../../data/demo/why-we-have-seasons.json'
import { demoOn, demoReplay, replayKey } from './demoReplay'

afterEach(() => sessionStorage.clear())

const fix = 'When a hemisphere is tilted toward the Sun, it has summer, because the noon Sun is higher in the sky.'

describe('demo links replay the recorded judging path', () => {
  it('?demo=1 turns it on for the tab, ?demo=0 turns it off', () => {
    expect(demoOn('')).toBe(false)
    expect(demoOn('?learn=why-we-have-seasons&demo=1')).toBe(true)
    expect(demoOn('?learn=why-we-have-seasons')).toBe(true)
    expect(demoOn('?demo=0')).toBe(false)
  })

  it('every recorded answer has the key the screens will ask for', () => {
    const keys = Object.keys(seasons.responses)
    expect(keys).toContain(replayKey('guess', { text: 'Summer is when Earth is closer to the Sun.' }))
    // the anchor screen puts the pencil value first; any pencil value matches
    expect(keys).toContain(
      replayKey('anchor', { answer: 'At day of the year 172 I predict about 70°. In June the northern half is tilted toward the Sun, so the noon Sun is high and the days are long.' }),
    )
    for (const caseIndex of [0, 1, 2]) expect(keys).toContain(replayKey('stress', { fix, caseIndex, history: [] }))
    expect(replayKey('draw', { rule: 'x', notes: '', image: null })).toBeNull()
  })

  it('replays only when demo mode is on and the answer was recorded', async () => {
    const body = { fix, caseIndex: 2, history: [] }
    expect(await demoReplay('why-we-have-seasons', 'stress', body, 0)).toBeNull()
    demoOn('?demo=1')
    expect(await demoReplay('why-we-have-seasons', 'stress', body, 0)).toMatchObject({ verdict: 'breaks' })
    // a judge's own answer goes live
    expect(await demoReplay('why-we-have-seasons', 'guess', { text: 'because of the tilt' }, 0)).toBeNull()
    expect(await demoReplay('compound-interest', 'stress', body, 0)).toBeNull()
  })
})

describe('a demo link through the real client and screens', () => {
  it('the scripted guess comes back from the recording, with no backend', async () => {
    const { render, screen, fireEvent, cleanup } = await import('@testing-library/react')
    const { createElement } = await import('react')
    const { LearnSession } = await import('./LearnSession')
    const { createLearnApi, createMockLearnApi } = await import('../learnApi')
    const topic = (await import('../../../data/learn/why-we-have-seasons.json')).default
    window.scrollTo = (() => {}) as typeof window.scrollTo
    demoOn('?demo=1')
    const api = createLearnApi(createMockLearnApi([topic as never]))
    render(createElement(LearnSession, { slug: 'why-we-have-seasons', onDone: () => {}, api }))
    const box = await screen.findByLabelText('guess answer')
    fireEvent.change(box, { target: { value: 'summer is when Earth is closer to the Sun' } })
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }))
    expect(await screen.findByText('sounds like: Summer is when Earth is closer', {}, { timeout: 2000 })).toBeTruthy()
    // the recorded message, not the offline keyword check
    expect(screen.getByText(/already names something we can test/)).toBeTruthy()
    cleanup()
  })
})
