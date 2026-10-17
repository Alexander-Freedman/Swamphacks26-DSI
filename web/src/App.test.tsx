// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from './App'

afterEach(cleanup)

describe('coin streak round', () => {
  it('plays predict → lock → reveal', async () => {
    vi.useFakeTimers()
    render(<App />)
    fireEvent.click(screen.getByText('Streaks in coin flips'))

    const lock = screen.getByText('Lock it in') as HTMLButtonElement
    expect(lock.disabled).toBe(true)
    fireEvent.change(screen.getByLabelText('your guess'), { target: { value: '3' } })
    fireEvent.click(screen.getByText('certain'))
    expect(lock.disabled).toBe(false)
    fireEvent.click(lock)

    expect(screen.getByText(/locked: 3 · certain/)).toBeTruthy()
    expect(screen.queryByText('Sure and wrong')).toBeNull() // no truth before the beat
    await act(async () => vi.advanceTimersByTime(500))
    expect(screen.getByText('Sure and wrong')).toBeTruthy()
    expect(screen.getByText(/Random means evenly mixed/)).toBeTruthy()
    expect(screen.getByLabelText(/average 7\.0/)).toBeTruthy()

    fireEvent.click(screen.getByText('Next'))
    fireEvent.click(screen.getByText('B (has runs of 4)'))
    fireEvent.click(screen.getByText('pretty sure'))
    fireEvent.click(screen.getByText('Lock it in'))
    await act(async () => vi.advanceTimersByTime(500))
    expect(screen.getByText('Called it')).toBeTruthy()
    vi.useRealTimers()
  })
})

describe('other showcases', () => {
  it('positive test reveals 9.2% with the icon array + card', async () => {
    vi.useFakeTimers()
    render(<App />)
    fireEvent.click(screen.getByText(/positive/i))
    fireEvent.change(screen.getByLabelText('your guess'), { target: { value: '90' } })
    fireEvent.click(screen.getByText('certain'))
    fireEvent.click(screen.getByText('Lock it in'))
    await act(async () => vi.advanceTimersByTime(500))
    expect(screen.getByLabelText(/of 1000 test positive; 9 of them are sick/)).toBeTruthy()
    expect(screen.getByText(/reality: 9\.2%/)).toBeTruthy()
    expect(screen.getByText('This looks like…')).toBeTruthy()
    vi.useRealTimers()
  })
  it('birthday reveals 23 on the curve', async () => {
    vi.useFakeTimers()
    render(<App />)
    fireEvent.click(screen.getByText(/birthday/i))
    fireEvent.change(screen.getByLabelText('your guess'), { target: { value: '183' } })
    fireEvent.click(screen.getByText('pretty sure'))
    fireEvent.click(screen.getByText('Lock it in'))
    await act(async () => vi.advanceTimersByTime(500))
    expect(screen.getByLabelText(/reaches 50% at 23/)).toBeTruthy()
    expect(screen.getByText('your guess: 183 →')).toBeTruthy()
    expect(screen.getByText('Way off')).toBeTruthy()
    vi.useRealTimers()
  })
})
