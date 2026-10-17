import { DAYS, PINS, sizeForChanceIn } from './math'

/* Compare screen data: same structure, different situation (Gentner, Loewenstein & Thompson 2003). */

export type CompareChoice = 'rare' | 'pairs' | 'half' | 'own'

export type Case = { key: string; title: string; what: string; thing: string; options: number; xMax: number; ticks: number[] }

export const CASES: Case[] = [
  { key: 'bday', title: 'Birthdays in a room', what: `${DAYS} possible birthdays`, thing: 'people', options: DAYS, xMax: 60, ticks: [2, 20, 40, 60] },
  { key: 'pin', title: 'PINs in a crowd', what: `everyone picks a random 4-digit PIN · ${PINS.toLocaleString('en-US')} possible PINs`, thing: 'people', options: PINS, xMax: 314, ticks: [2, 100, 200, 300] },
]

/** Group size where a match becomes a coin flip, for each case (23 and 119). */
export const halfAt = (c: Case) => sizeForChanceIn(0.5, c.options)

export const CHOICES: { id: Exclude<CompareChoice, 'own'>; text: string; why: string }[] = [
  { id: 'rare', text: 'There are so many options that a match is a fluke', why: `Not a fluke: both hit a coin flip with only ${halfAt(CASES[0])} and ${halfAt(CASES[1])} people.` },
  { id: 'pairs', text: 'Matches come from pairs, and pairs grow much faster than people', why: 'Right: every new person can match everyone already there.' },
  { id: 'half', text: 'You need about half as many people as there are options', why: `Half would be ${Math.round(DAYS / 2)} people and ${(PINS / 2).toLocaleString('en-US')} people. It takes ${halfAt(CASES[0])} and ${halfAt(CASES[1])}.` },
]

export const PRINCIPLE = "Any time lots of things can pair up, matches show up long before you'd expect: pairs grow like n²/2."

/** The slider moves both crowds together: the PIN crowd is sqrt(10,000 / 365) ≈ 5.2x the room, so pairs per option match. */
export const SCALE = Math.sqrt(PINS / DAYS)
export const pinCrowd = (room: number) => Math.round(room * SCALE)
export const ROOM_LO = 2
export const ROOM_HI = 60
