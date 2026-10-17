// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import App from './App'

afterEach(cleanup)

describe('coin streak on Home', () => {
  it('shows one coin entry, and it opens the coin session', () => {
    render(<App />)
    // the old "Streaks in coin flips" round shares the coin-streak slug, so the session replaces it
    expect(screen.queryByText('Streaks in coin flips')).toBeNull()
    expect(screen.getAllByText('Be a coin')).toHaveLength(1)
    expect(screen.getByText(/Tap out 20 flips/)).toBeTruthy()
    fireEvent.click(screen.getByText('Be a coin'))
    expect(screen.getByText('Be a coin. Tap out 20 flips.')).toBeTruthy()
    expect((screen.getByText('Lock it in') as HTMLButtonElement).disabled).toBe(true)
  })
})
