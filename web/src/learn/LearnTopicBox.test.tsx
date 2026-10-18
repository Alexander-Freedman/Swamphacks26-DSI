// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createMockLearnApi } from '../learnApi'
import { LearnTopicBox, matchLearnTopic } from './LearnTopicBox'
import type { Topic } from './types'

afterEach(cleanup)

const LIST = [
  { slug: 'compound-interest', topic: 'compound interest', checked: true },
  { slug: 'why-we-have-seasons', topic: 'why we have seasons', checked: true },
  { slug: 'ohm-s-law', topic: "Ohm's law", checked: true },
]

describe('matchLearnTopic', () => {
  it('matches exact names, slugs and close wording', () => {
    expect(matchLearnTopic('compound interest', LIST)).toBe('compound-interest')
    expect(matchLearnTopic('ohm-s-law', LIST)).toBe('ohm-s-law')
    expect(matchLearnTopic('how does compound interest work', LIST)).toBe('compound-interest')
    expect(matchLearnTopic('seasons', LIST)).toBe('why-we-have-seasons')
  })
  it('returns null for a new topic', () => {
    expect(matchLearnTopic('photosynthesis', LIST)).toBeNull()
    expect(matchLearnTopic('   ', LIST)).toBeNull()
  })
})

describe('LearnTopicBox', () => {
  it('shows the ready-made topics as chips and opens one', async () => {
    const onOpen = vi.fn()
    render(<LearnTopicBox onOpen={onOpen} api={createMockLearnApi()} />)
    fireEvent.click(await screen.findByRole('button', { name: 'compound interest' }))
    expect(onOpen).toHaveBeenCalledWith('compound-interest')
  })

  it('typing a ready-made topic opens it without building', async () => {
    const onOpen = vi.fn()
    const api = createMockLearnApi()
    const create = vi.spyOn(api, 'createTopic')
    render(<LearnTopicBox onOpen={onOpen} api={api} />)
    await screen.findByRole('button', { name: 'compound interest' })
    fireEvent.change(screen.getByLabelText('topic to learn'), { target: { value: 'Compound interest' } })
    fireEvent.click(screen.getByRole('button', { name: 'Learn it' }))
    expect(onOpen).toHaveBeenCalledWith('compound-interest')
    expect(create).not.toHaveBeenCalled()
  })

  it('a new topic is built, then opened', async () => {
    const onOpen = vi.fn()
    const api = createMockLearnApi()
    vi.spyOn(api, 'createTopic').mockResolvedValue({ slug: 'photosynthesis', topic: 'photosynthesis' } as unknown as Topic)
    render(<LearnTopicBox onOpen={onOpen} api={api} />)
    fireEvent.change(screen.getByLabelText('topic to learn'), { target: { value: 'photosynthesis' } })
    fireEvent.click(screen.getByRole('button', { name: 'Learn it' }))
    expect(await screen.findByText(/Building your lesson/)).toBeTruthy()
    await vi.waitFor(() => expect(onOpen).toHaveBeenCalledWith('photosynthesis'))
  })

  it('with no backend, says so and keeps the chips', async () => {
    const onOpen = vi.fn()
    render(<LearnTopicBox onOpen={onOpen} api={createMockLearnApi()} />)
    await screen.findByRole('button', { name: 'compound interest' })
    fireEvent.change(screen.getByLabelText('topic to learn'), { target: { value: 'photosynthesis' } })
    fireEvent.click(screen.getByRole('button', { name: 'Learn it' }))
    expect(await screen.findByText(/needs the live backend/)).toBeTruthy()
    expect(onOpen).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'compound interest' })).toBeTruthy()
  })
})
