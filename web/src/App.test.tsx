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
    expect(screen.queryByText('Way off')).toBeNull() // no truth before the beat
    await act(async () => vi.advanceTimersByTime(500))
    expect(screen.getByText('Way off')).toBeTruthy()
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
