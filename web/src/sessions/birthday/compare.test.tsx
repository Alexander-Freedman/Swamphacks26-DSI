// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { KEY } from '../../notebook'
import { Compare } from './Compare'
import { PRINCIPLE } from './compareData'
import { session } from './index'

afterEach(cleanup)
// jsdom has no canvas: the ring just stays blank here
HTMLCanvasElement.prototype.getContext = (() => null) as unknown as HTMLCanvasElement['getContext']

describe('compare screen', () => {
  it('shows both cases at their coin-flip point and reveals the shared idea after a pick', () => {
    const onPick = vi.fn()
    const onNext = vi.fn()
    render(<Compare onPick={onPick} onNext={onNext} />)
    // the naming step waits until the crowd has been moved
    expect(screen.queryByText("What's the same about how these work?")).toBeNull()
    fireEvent.click(screen.getByText('23 & 120'))
    expect(screen.getByText("What's the same about how these work?")).toBeTruthy()
    expect(screen.getByText('23')).toBeTruthy()
    expect(screen.getByText('120')).toBeTruthy()
    expect(screen.getByText('253 pairs')).toBeTruthy()
    expect(screen.getByText('7,140 pairs')).toBeTruthy()
    expect(screen.getByText('50.7%')).toBeTruthy()
    expect(screen.getByText('51.2%')).toBeTruthy()
    // the slider moves both crowds together
    fireEvent.change(screen.getByLabelText('crowd size: moves both crowds together'), { target: { value: '40' } })
    expect(screen.getByText('209')).toBeTruthy()
    expect(screen.queryByText(PRINCIPLE)).toBeNull()
    fireEvent.click(screen.getByText(/pairs grow much faster than people/))
    expect(onPick).toHaveBeenCalledWith('pairs')
    expect(screen.getByText('spot on')).toBeTruthy()
    expect(screen.getByText(/Coin flip at/).textContent).toMatch(/119 people \(7,021 pairs, 70% of 10,000\)/)
    expect(screen.getByText(PRINCIPLE)).toBeTruthy()
    fireEvent.click(screen.getByText('Try it on a new one →'))
    expect(onNext).toHaveBeenCalled()
  })

  it('takes the user own words and shows them next to the principle', () => {
    const onPick = vi.fn()
    render(<Compare onPick={onPick} onNext={() => {}} />)
    fireEvent.click(screen.getByText('5 & 26'))
    fireEvent.change(screen.getByLabelText('say it in your own words'), { target: { value: 'lots of pairs' } })
    fireEvent.click(screen.getByText("That's it"))
    expect(onPick).toHaveBeenCalledWith('own')
    expect(screen.getByText('“lots of pairs”')).toBeTruthy()
    expect(screen.getByText(PRINCIPLE)).toBeTruthy()
  })

  it('a wrong pick says why, then the principle', () => {
    render(<Compare onPick={() => {}} onNext={() => {}} />)
    fireEvent.click(screen.getByText('40 & 209'))
    fireEvent.click(screen.getByText(/about half as many people/))
    expect(screen.getByText('not quite')).toBeTruthy()
    expect(screen.getByText(/Half would be 183 people/)).toBeTruthy()
    expect(screen.getByText(PRINCIPLE)).toBeTruthy()
  })

  it('sits between the mistake card and the rematch, and the pick is saved', () => {
    vi.useFakeTimers()
    window.scrollTo = vi.fn() as unknown as typeof window.scrollTo
    localStorage.clear()
    const C = session.Component
    render(<C onDone={() => {}} />)
    fireEvent.change(screen.getByLabelText('your guess, people in the room'), { target: { value: '180' } })
    fireEvent.click(screen.getByText('pretty sure'))
    fireEvent.click(screen.getByText('Lock it in'))
    act(() => vi.advanceTimersByTime(400))
    for (let k = 0; k < 5; k++) fireEvent.click(screen.getByLabelText('add 5 people'))
    fireEvent.click(screen.getByText('Next: draw your curve →'))
    fireEvent.click(screen.getByText(/skip: draw a straight line/))
    fireEvent.click(screen.getByText(/What did I get wrong/))
    fireEvent.click(screen.getByText('Got it →'))
    expect(screen.getByText('Same idea, new place')).toBeTruthy()
    expect(screen.getByText('7 of 8')).toBeTruthy()
    fireEvent.click(screen.getByText('23 & 120'))
    fireEvent.click(screen.getByText(/pairs grow much faster than people/))
    fireEvent.click(screen.getByText('Try it on a new one →'))
    expect(screen.getByText('Rematch')).toBeTruthy()
    expect(screen.getByText('8 of 8')).toBeTruthy()
    fireEvent.click(screen.getByText('More likely than not'))
    const saved = JSON.parse(localStorage.getItem(KEY) ?? '[]')
    expect(saved.at(-1).compare).toBe('pairs')
    vi.useRealTimers()
  }, 90000)
})
