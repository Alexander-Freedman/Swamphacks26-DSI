import { GENERAL_HINT } from './helpHints'
import type { HelpSpot, LayerReport } from './session/helpSpot'

// The Ask panel's layer (#243): what it asks about on any session screen.

export const PRIVACY_LINE = "Questions go to Google's Gemini; don't type personal info."
export const DEFAULT_SUGGESTED = ['What am I looking at?', 'What should I do next?', 'Why does this matter?']

const domText = (sel: string) => (typeof document === 'undefined' ? '' : document.querySelector(sel)?.textContent?.replace(/\s+/g, ' ').trim() ?? '')

/**
 * The layer the panel asks about (#243): the screen's own LayerHelp when it reports one, otherwise
 * a minimal one from what the shell shows (the step title and the guidance line under it).
 */
export function layerFor(spot: HelpSpot | null, subject: string): Required<Omit<LayerReport, 'lastAction'>> & { lastAction?: string } {
  const chipTopic = spot?.chip?.split(' · ').slice(1).join(' · ')
  const given = spot?.layer
  const title = given?.title || domText('.ss-title') || spot?.label || 'this screen'
  const onScreen = given?.onScreen || domText('.ss-subtitle')
  return {
    subject: given?.subject || subject,
    topic: given?.topic || chipTopic || spot?.chip || subject,
    layerN: given?.layerN ?? spot?.step ?? 1,
    title,
    onScreen,
    facts: given?.facts ?? [],
    suggested: given?.suggested?.length ? given.suggested.slice(0, 3) : DEFAULT_SUGGESTED,
    hint: given?.hint || onScreen || GENERAL_HINT,
    lastAction: given?.lastAction,
  }
}

