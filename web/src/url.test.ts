// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { HOME, onScreenChange, pushScreen, readScreen, replaceScreen, screenUrl } from './url'

const BASE = '/Swamphacks26-DSI/'

afterEach(() => history.replaceState(null, '', '/'))

describe('readScreen', () => {
  it('reads session, round, or home', () => {
    expect(readScreen('?session=boxes')).toEqual({ kind: 'session', slug: 'boxes' })
    expect(readScreen('?round=birthday')).toEqual({ kind: 'round', slug: 'birthday' })
    expect(readScreen('')).toEqual(HOME)
    expect(readScreen('?notebook=1')).toEqual({ kind: 'notebook' })
    expect(readScreen('?round=')).toEqual(HOME)
    expect(readScreen('?utm=x')).toEqual(HOME)
  })
})

describe('screenUrl', () => {
  it('keeps the base path', () => {
    expect(screenUrl(HOME, BASE)).toBe(BASE)
    expect(screenUrl({ kind: 'notebook' }, BASE)).toBe('/Swamphacks26-DSI/?notebook=1')
    expect(screenUrl({ kind: 'round', slug: 'birthday' }, BASE)).toBe('/Swamphacks26-DSI/?round=birthday')
    expect(screenUrl({ kind: 'session', slug: 'a b' }, '/')).toBe('/?session=a%20b')
  })
  it('defaults to the Vite base', () => {
    expect(screenUrl(HOME)).toBe(import.meta.env.BASE_URL)
  })
})

describe('pushScreen / replaceScreen', () => {
  it('pushes once per screen change', () => {
    const start = history.length
    pushScreen({ kind: 'round', slug: 'birthday' }, BASE)
    expect(location.pathname + location.search).toBe('/Swamphacks26-DSI/?round=birthday')
    pushScreen({ kind: 'round', slug: 'birthday' }, BASE)
    expect(history.length).toBe(start + 1)
    pushScreen(HOME, BASE)
    expect(location.pathname + location.search).toBe(BASE)
    expect(history.length).toBe(start + 2)
  })
  it('replace does not add an entry', () => {
    const start = history.length
    replaceScreen({ kind: 'session', slug: 'x' }, BASE)
    expect(location.search).toBe('?session=x')
    expect(history.length).toBe(start)
  })
})

describe('onScreenChange', () => {
  it('reports the URL screen on popstate and unsubscribes', () => {
    const cb = vi.fn()
    const off = onScreenChange(cb)
    history.replaceState(null, '', '/?session=boxes')
    window.dispatchEvent(new PopStateEvent('popstate'))
    expect(cb).toHaveBeenCalledWith({ kind: 'session', slug: 'boxes' })
    off()
    window.dispatchEvent(new PopStateEvent('popstate'))
    expect(cb).toHaveBeenCalledTimes(1)
  })
})
