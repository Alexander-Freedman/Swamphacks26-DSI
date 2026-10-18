import type { BioMistake } from './mistakes'

// The anatomy topics as a list of predictions. Each answer moves the picture one stage on.
// Facts are standard intro-physiology; the kidney numbers are sourced next to them.

export type WalkQ = {
  ask: string
  choices: { value: string; label: string; sub?: string }[]
  answer: string
  why: string
  traps: Partial<Record<string, BioMistake>>
  retry: string
}

export const HEART: WalkQ[] = [
  {
    ask: 'Oxygen-poor blood comes back from the body. Which chamber does it enter first?',
    choices: [
      { value: 'RA', label: 'Right atrium' },
      { value: 'LA', label: 'Left atrium' },
      { value: 'RV', label: 'Right ventricle' },
      { value: 'LV', label: 'Left ventricle' },
    ],
    answer: 'RA',
    why: 'Blood from the body comes back through the venae cavae into the right atrium. The right side handles oxygen-poor blood.',
    traps: { LA: 'heart-sides-swapped', RV: 'enters-ventricle', LV: 'enters-ventricle' },
    retry: '',
  },
  {
    ask: 'The right atrium squeezes. Through which valve, and into where?',
    choices: [
      { value: 'tri', label: 'Tricuspid valve', sub: 'into the right ventricle' },
      { value: 'mit', label: 'Mitral valve', sub: 'into the left ventricle' },
      { value: 'pul', label: 'Pulmonary valve', sub: 'straight to the lungs' },
    ],
    answer: 'tri',
    why: 'The tricuspid valve opens into the right ventricle, then snaps shut so blood can’t flow back.',
    traps: { mit: 'valve-mixup', pul: 'skips-ventricle' },
    retry: '',
  },
  {
    ask: 'The right ventricle squeezes. Where does it send the blood?',
    choices: [
      { value: 'lungs', label: 'To the lungs', sub: 'pulmonary artery' },
      { value: 'body', label: 'To the body', sub: 'aorta' },
    ],
    answer: 'lungs',
    why: 'Through the pulmonary valve into the pulmonary artery, to the lungs. It’s an artery that carries oxygen-poor blood: arteries carry blood away from the heart, whatever its oxygen.',
    traps: { body: 'right-pumps-to-body' },
    retry: '',
  },
  {
    ask: 'In the lungs, what happens to the blood?',
    choices: [
      { value: 'pick', label: 'It picks up O₂', sub: 'and drops off CO₂' },
      { value: 'drop', label: 'It drops off O₂', sub: 'and picks up CO₂' },
    ],
    answer: 'pick',
    why: 'Air in the lungs has more O₂ than the blood, so O₂ moves in and CO₂ moves out. The blood turns bright red.',
    traps: { drop: 'lungs-remove-oxygen' },
    retry: '',
  },
  {
    ask: 'Oxygen-rich blood comes back from the lungs. Which chamber does it enter?',
    choices: [
      { value: 'LA', label: 'Left atrium' },
      { value: 'RA', label: 'Right atrium' },
      { value: 'LV', label: 'Left ventricle' },
    ],
    answer: 'LA',
    why: 'The pulmonary veins bring it into the left atrium. The left side handles oxygen-rich blood.',
    traps: { RA: 'heart-sides-swapped', LV: 'enters-ventricle' },
    retry: '',
  },
  {
    ask: 'The left atrium squeezes. Through which valve, and into where?',
    choices: [
      { value: 'mit', label: 'Mitral valve', sub: 'into the left ventricle' },
      { value: 'tri', label: 'Tricuspid valve', sub: 'into the right ventricle' },
      { value: 'aor', label: 'Aortic valve', sub: 'straight to the body' },
    ],
    answer: 'mit',
    why: 'The mitral (bicuspid) valve opens into the left ventricle.',
    traps: { tri: 'valve-mixup', aor: 'skips-ventricle' },
    retry: '',
  },
  {
    ask: 'The left ventricle pumps blood through the aorta to the whole body. Compared with the right ventricle, its wall is…',
    choices: [
      { value: 'thick', label: 'Thicker' },
      { value: 'same', label: 'The same' },
      { value: 'thin', label: 'Thinner' },
    ],
    answer: 'thick',
    why: 'Thicker: it has to push blood around the whole body at a much higher pressure than the short trip to the lungs.',
    traps: { same: 'equal-ventricles', thin: 'equal-ventricles' },
    retry: '',
  },
]

// Renal physiology: about 180 L of filtrate a day, about 1.5 L of urine; glucose is reabsorbed in the
// proximal tubule; about half the filtered urea is excreted (https://en.wikipedia.org/wiki/Renal_physiology).
export const KIDNEY: WalkQ[] = [
  {
    ask: 'Blood is pushed through the filter in the glomerulus. Which of these is too big to get through, so it stays in the blood?',
    choices: [
      { value: 'protein', label: 'Proteins' },
      { value: 'glucose', label: 'Glucose' },
      { value: 'water', label: 'Water' },
      { value: 'salt', label: 'Salt (Na⁺)' },
    ],
    answer: 'protein',
    why: 'Proteins and blood cells are too big for the filter, so they stay in the blood. Water, salt, glucose and urea all go through into the tubule.',
    traps: { glucose: 'glucose-not-filtered' },
    retry: 'Water and salt are tiny: they go straight through.',
  },
  {
    ask: 'The filtrate now has glucose in it. Where does almost all of it go back into the blood?',
    choices: [
      { value: 'pct', label: 'Proximal tubule', sub: 'right after the filter' },
      { value: 'loop', label: 'Loop of Henle' },
      { value: 'duct', label: 'Collecting duct' },
      { value: 'urine', label: 'It doesn’t', sub: 'it leaves in the urine' },
    ],
    answer: 'pct',
    why: 'Pumps in the proximal tubule take nearly all the glucose back. Glucose in urine means there was more than the pumps could handle, as in untreated diabetes.',
    traps: { urine: 'glucose-in-urine' },
    retry: 'Think earlier: it’s taken back almost as soon as it’s filtered.',
  },
  {
    ask: 'Your kidneys filter about 180 liters of fluid a day. About how much leaves as urine?',
    choices: [
      { value: '1.5', label: 'About 1.5 L' },
      { value: '90', label: 'About 90 L' },
      { value: '180', label: 'About 180 L' },
    ],
    answer: '1.5',
    why: 'About 99% of the water is taken back along the tubule (the loop of Henle and the collecting duct do a lot of it), so only about 1.5 L a day leaves.',
    traps: { '180': 'urine-is-all-filtrate', '90': 'urine-is-all-filtrate' },
    retry: '',
  },
  {
    ask: 'Urea is the waste the kidney is there to remove. What happens to the urea in the filtrate?',
    choices: [
      { value: 'half', label: 'About half leaves in urine', sub: 'some leaks back' },
      { value: 'all-back', label: 'All of it goes back into the blood' },
      { value: 'none', label: 'None of it was filtered' },
    ],
    answer: 'half',
    why: 'Urea is small, so it’s filtered. Some leaks back across the tubule, and about half of it leaves in urine.',
    traps: { 'all-back': 'waste-all-reabsorbed', none: 'urea-not-filtered' },
    retry: '',
  },
  {
    ask: 'You’re dehydrated, so your body releases ADH, which opens water channels in the collecting duct. Your urine becomes…',
    choices: [
      { value: 'less', label: 'Less, and darker', sub: 'more concentrated' },
      { value: 'more', label: 'More, and paler', sub: 'more dilute' },
    ],
    answer: 'less',
    why: 'Open water channels let more water leave the duct and go back into the blood, so less, more concentrated urine is left.',
    traps: { more: 'adh-backwards' },
    retry: '',
  },
]

export const MUSCLE: WalkQ[] = [
  {
    ask: 'Your biceps contracts. What happens inside each sarcomere?',
    choices: [
      { value: 'slide', label: 'Thin and thick filaments slide past each other' },
      { value: 'shrink', label: 'The filaments themselves get shorter' },
      { value: 'fold', label: 'The filaments fold up' },
    ],
    answer: 'slide',
    why: 'Myosin heads pull the thin actin filaments toward the middle, so the Z lines come closer together. No filament changes length.',
    traps: { shrink: 'filaments-shrink' },
    retry: 'They stay straight. Watch what moves.',
  },
  {
    ask: 'Compare relaxed and contracted. Which part keeps the same length?',
    choices: [
      { value: 'A', label: 'The A band', sub: 'as long as myosin' },
      { value: 'I', label: 'The I band', sub: 'actin only' },
      { value: 'H', label: 'The H zone', sub: 'myosin only' },
      { value: 'S', label: 'The whole sarcomere' },
    ],
    answer: 'A',
    why: 'The A band is exactly myosin’s length, and myosin doesn’t shrink. The I band and H zone shrink as the filaments overlap more.',
    traps: { I: 'bands-all-shrink', H: 'bands-all-shrink' },
    retry: 'The Z lines moved closer, so the sarcomere got shorter.',
  },
  {
    ask: 'Before myosin can grab actin, something has to uncover actin’s binding sites. What is it?',
    choices: [
      { value: 'ca', label: 'Ca²⁺ binding to troponin' },
      { value: 'atp', label: 'ATP' },
      { value: 'na', label: 'Na⁺' },
    ],
    answer: 'ca',
    why: 'The nerve signal releases Ca²⁺. Ca²⁺ binds troponin, which pulls tropomyosin off the binding sites, so the myosin heads can attach.',
    traps: { atp: 'atp-uncovers-sites' },
    retry: 'Na⁺ is part of the nerve signal, but it doesn’t act on the filaments.',
  },
  {
    ask: 'A myosin head has pulled (the power stroke). What does a new ATP do next?',
    choices: [
      { value: 'release', label: 'Lets the head let go and re-cock' },
      { value: 'grab', label: 'Makes the head grab actin' },
      { value: 'nothing', label: 'Nothing, ATP isn’t needed' },
    ],
    answer: 'release',
    why: 'ATP releases the head from actin, and splitting it re-cocks the head for the next pull. With no ATP, the heads stay stuck: that’s rigor mortis.',
    traps: { grab: 'atp-makes-grab', nothing: 'atp-makes-grab' },
    retry: '',
  },
]
