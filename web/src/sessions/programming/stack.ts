// factorial(n) as a list of moments, so the picture can step through it one line at a time.
//
//   function fact(n) {
//     if (n <= 1) return 1        // line 2: the base case
//     return n * fact(n - 1)      // line 3: wait for the call above, then multiply
//   }

export type Frame = { n: number; /** set once this call has returned */ value: number | null }

export type Moment = {
  /** the stack, bottom first: frames[0] is fact(start) */
  frames: Frame[]
  /** the code line the top frame is on */
  line: 2 | 3
  /** a short plain sentence for what just happened */
  say: string
  /** the value just handed back down, while it travels */
  handing: number | null
}

export const fact = (n: number): number => (n <= 1 ? 1 : n * fact(n - 1))

/** Every moment of fact(start): calls going up, then returns coming back down. */
export function trace(start: number): Moment[] {
  const out: Moment[] = []
  const frames: Frame[] = []
  const snap = (line: 2 | 3, say: string, handing: number | null = null) =>
    out.push({ frames: frames.map((f) => ({ ...f })), line, say, handing })
  for (let n = start; n >= 1; n--) {
    frames.push({ n, value: null })
    snap(2, n === start ? `Call fact(${n}). Its frame goes on the stack.` : `fact(${n + 1}) can't finish yet: it calls fact(${n}). A new frame goes on top.`)
  }
  frames[frames.length - 1].value = 1
  snap(2, 'n is 1: the base case. This call returns 1 without calling anything.', 1)
  for (let i = frames.length - 2; i >= 0; i--) {
    const below = frames[i + 1].value!
    frames.pop()
    frames[i].value = frames[i].n * below
    snap(3, `fact(${frames[i].n}) gets ${below} back, so it returns ${frames[i].n} × ${below} = ${frames[i].value}.`, frames[i].value)
  }
  return out
}

/** The tallest the stack gets. */
export const depth = (start: number) => Math.max(...trace(start).map((m) => m.frames.length))

export type StackMistake = 'stack-depth-off' | 'returns-before-calls' | 'base-case-optional'

/** Named mistakes, saved to the notebook (labels mirrored in notebook.ts EXTRA_LABELS). */
export const STACK_MISTAKES: Record<StackMistake, { label: string; line: string }> = {
  'stack-depth-off': { label: 'Miscounting the call stack', line: 'Every call gets its own frame and waits for the one it called. fact(4), fact(3), fact(2), fact(1): four at once.' },
  'returns-before-calls': { label: 'The first call finishes first', line: 'The stack is last in, first out. The newest frame finishes first; fact(4), the oldest, finishes last.' },
  'base-case-optional': { label: 'A base case is optional', line: 'Without the base case nothing ever stops calling. Frames pile up until the stack runs out of room.' },
}
