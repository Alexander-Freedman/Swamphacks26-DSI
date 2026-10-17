// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from '../../App'

afterEach(cleanup)

describe('positive test session', () => {
  it('guess → test everyone → you vs real → change the crowd → card', async () => {
    vi.useFakeTimers()
    const { container } = render(<App />)
    fireEvent.click(screen.getByText('What a positive test really means'))

    const lock = screen.getByText('Move the slider to guess') as HTMLButtonElement
    expect(lock.disabled).toBe(true)
    fireEvent.change(screen.getByLabelText("Chance you're actually sick?"), { target: { value: '21' } })
    fireEvent.click(screen.getByLabelText('ten more healthy positives'))
    fireEvent.click(screen.getByLabelText('one more sick positive'))
    expect(container.textContent).toContain('9.1% of positives are sick (1 of 11)')
    fireEvent.click(screen.getByText('Lock in 21%'))

    fireEvent.click(screen.getByText('Test everyone'))
    await act(async () => vi.advanceTimersByTime(5000))
    expect(screen.getByText('9 / 98')).toBeTruthy()
    expect(screen.getByText('9.2%')).toBeTruthy()
    expect(container.innerHTML).not.toContain('NaN')

    fireEvent.click(screen.getByText('Compare with my guess →'))
    expect(screen.getByText('real 9.2%')).toBeTruthy()
    expect(screen.getByText('these 89 were never sick')).toBeTruthy()

    fireEvent.click(screen.getByText('Now change the crowd →'))
    fireEvent.click(screen.getByText('common (50%)'))
    expect(screen.getByText('91%')).toBeTruthy()
    expect(screen.getByText('positive = probably sick')).toBeTruthy()
    expect(container.innerHTML).not.toContain('NaN')

    fireEvent.click(screen.getByText('What did I get wrong? →'))
    // 21% is 11.8 points from 9.2%: inside the 15-point "close" window, band → ignores-false-alarms.
    expect(screen.getByText('close')).toBeTruthy()
    expect(screen.getByText('False alarms are too rare to matter')).toBeTruthy()
    fireEvent.click(screen.getByText('Show me'))
    expect(screen.getByText('50%', { selector: 'b' })).toBeTruthy()
    vi.useRealTimers()
  }, 30000)
})
