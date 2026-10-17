// VITE_API=mock serves fixtures from src/mocks/ so the UI never waits on the backend.
const fixtures = import.meta.glob<{ default: unknown }>('./mocks/*.json')

export const usingMock = import.meta.env.VITE_API === 'mock'

export async function get<T>(path: string): Promise<T> {
  if (usingMock) {
    const name = path.replace(/^\/api\//, '').replace(/[/?=&]+/g, '_')
    const load = fixtures[`./mocks/${name}.json`]
    if (!load) throw new Error(`no mock for ${path} (add src/mocks/${name}.json)`)
    return (await load()).default as T
  }
  const res = await fetch(path)
  if (!res.ok) throw new Error(`${path}: ${res.status} ${await res.text()}`)
  return res.json() as Promise<T>
}
