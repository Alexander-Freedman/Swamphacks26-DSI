// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('./replies.json', () => ({
  default: {
    'derivative/guess': { request: { text: 'The derivative is how much a function changes overall.' }, reply: { classification: 'concrete', misconceptionId: 'x', message: 'saved' } },
    'derivative/stress/1': { request: { caseIndex: 1 }, reply: { verdict: 'survives', critique: 'case 2' } },
    'help/derivative/Can you give me a hint?': { answer: 'a saved hint', hint_only: true },
  },
}))
const { demoHelp, demoOn, demoReply, fillStep } = await import('./demo')

const at = (search: string) => history.replaceState(null, '', `/${search}`)
afterEach(() => {
  sessionStorage.clear()
  document.body.innerHTML = ''
})

describe('demo mode', () => {
  it('is off unless ?demo=1, then stays on for the tab until ?demo=0', () => {
    at('?learn=derivative')
    expect(demoOn()).toBe(false)
    expect(demoReply('derivative', 'guess', { text: 'The derivative is how much a function changes overall.' })).toBeNull()
    at('?demo=1')
    expect(demoOn()).toBe(true)
    at('?learn=derivative')
    expect(demoOn()).toBe(true)
    at('?demo=0')
    expect(demoOn()).toBe(false)
  })

  it('replays the saved reply only for the scripted answer', async () => {
    at('?demo=1')
    await expect(demoReply('derivative', 'guess', { text: ' the derivative is how much a function  changes overall. ' })).resolves.toMatchObject({ message: 'saved' })
    expect(demoReply('derivative', 'guess', { text: 'something else' })).toBeNull()
    await expect(demoReply('derivative', 'stress', { caseIndex: 1, fix: 'any rule', history: [] })).resolves.toMatchObject({ critique: 'case 2' })
    expect(demoReply('derivative', 'stress', { caseIndex: 0, fix: 'any rule', history: [] })).toBeNull()
    expect(demoHelp('derivative', 'Can you give me a hint?')).toEqual({ answer: 'a saved hint', hintOnly: true, fallback: false })
    expect(demoHelp('derivative', 'another question')).toBeNull()
  })

  it('fills the empty boxes of the current step from the script and leaves typed ones alone', () => {
    at('?demo=1')
    at('?learn=derivative')
    document.body.innerHTML = `<div class="learn-card is-now">
      <input aria-label="rule When" /><input aria-label="rule then" value="mine" /><input aria-label="rule because" />
    </div>`
    const seen: string[] = []
    document.body.addEventListener('input', (e) => seen.push((e.target as HTMLInputElement).getAttribute('aria-label')!))
    expect(fillStep()).toBe(2)
    const v = (l: string) => (document.querySelector(`[aria-label="${l}"]`) as HTMLInputElement).value
    expect(v('rule When')).toBe('you shrink the interval around one moment')
    expect(v('rule then')).toBe('mine')
    expect(v('rule because')).toBe('the derivative is the local rate, not the total change')
    expect(seen).toEqual(['rule When', 'rule because'])
  })

  it('on Home, fills the topic box', () => {
    at('?demo=1')
    at('')
    document.body.innerHTML = '<input aria-label="topic to learn" />'
    expect(fillStep()).toBe(1)
    expect((document.querySelector('input') as HTMLInputElement).value).toBe('false positives')
  })
})
