// One line for a finished Learn step, shown on its folded card in the stacked session.
import type { LearnState, Stage, Topic } from './types'

const VERDICT: Record<string, string> = {
  demonstrated: 'spot on',
  unresolved: 'not yet',
  correct: 'right',
  partial: 'partly',
  incorrect: 'not quite',
  maps: 'it maps',
  'too-abstract': 'too abstract',
  fails: "doesn't map",
}
const said = (s: string, max = 70) => {
  const t = s.trim()
  return t ? `“${t.length > max ? `${t.slice(0, max - 1)}…` : t}”` : ''
}
const verdict = (v: string | undefined) => (v ? VERDICT[v] ?? v : '')
const join = (...parts: string[]) => parts.filter(Boolean).join(' · ') || 'done'

export function summaryFor(stage: Stage, state: LearnState, topic: Topic): string {
  switch (stage) {
    case 'guess': {
      const m = topic.misconceptions.find((x) => x.id === state.misconceptionId)
      return join(said(state.guess), m ? `sounds like: ${m.label}` : '')
    }
    case 'anchor':
      return join(verdict(state.anchorResult?.verdict), said(state.anchorAnswer))
    case 'contrast':
      return join(state.fix.trim() ? `your rule: ${said(state.fix)}` : '')
    case 'stress': {
      const h = state.stressHistory
      if (state.revealResult) return 'rule revealed after three breaks'
      if (!h.length) return 'done'
      const ok = h.filter((x) => x.verdict === 'survives').length
      return `${ok} survived · ${h.length - ok} broke`
    }
    case 'draw': {
      const v = state.drawVerdicts
      if (!v.length) return join(said(state.drawRule))
      return `${v.filter((c) => c.verdict === 'demonstrated').length} of ${v.length} pieces right`
    }
    case 'neighbor':
      return join(verdict(state.neighborResult?.verdict), said(state.neighborAnswer))
    case 'transfer':
      return join(verdict(state.transferResult?.verdict), said(state.transferAnalogy))
    case 'done':
      return 'saved to your notebook'
  }
}
