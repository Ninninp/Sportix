// Blocs de spécialisation (J6) : un objectif sur quelques semaines (« Force, 5 semaines »),
// auquel les séances se rattachent pour comparer un bloc à l'autre (J7).
//
// Règle retenue le 21/09/2026 (design/README.md) : **un bloc commence un lundi et dure un nombre
// entier de semaines**. La semaine du bloc et la semaine du calendrier sont donc la même chose,
// ce qui rend justes la barre S1…S5, le « semaine 2 sur 5 » et les comparaisons du J7.
//
// Comme partout dans l'app, les dates se calculent en jours de calendrier (`setDate`) et jamais en
// multiples de 24 h : aux changements d'heure une semaine dure 167 ou 169 heures.
import { mondayOf } from './week.ts'

/** Objectif réutilisable (« Force », « Hypertrophie ») : c'est l'utilisateur qui les crée. */
export type BlockGoal = { id: string; name: string; createdAt: number }

export type Block = {
  id: string
  name: string
  /** Objectif choisi, ou null : deux blocs du même objectif se comparent au J7. */
  goalId: string | null
  /** Lundi 0 h du premier jour du bloc (heure locale). */
  startsOn: number
  /** Durée en semaines, semaines de deload comprises. */
  weeks: number
  /** Numéros des semaines allégées (1 = première semaine du bloc). */
  deloadWeeks: number[]
  /** Programme suivi pendant le bloc, ou null. */
  programId: string | null
  notes?: string
  createdAt: number
}

export type BlockDraft = Omit<Block, 'id' | 'createdAt'>

export const MIN_WEEKS = 1
export const MAX_WEEKS = 24

/** Le même instant `n` semaines plus tard (en jours de calendrier). */
export function addWeeks(time: number, n: number): number {
  const d = new Date(time)
  d.setDate(d.getDate() + n * 7)
  return d.getTime()
}

/** Premier instant APRÈS le bloc (le lundi qui suit sa dernière semaine). */
export function blockEnd(block: Block): number {
  return addWeeks(block.startsOn, block.weeks)
}

/** Dernier jour du bloc (le dimanche), pour l'affichage des dates. */
export function blockLastDay(block: Block): number {
  const d = new Date(addWeeks(block.startsOn, block.weeks))
  d.setDate(d.getDate() - 1)
  return d.getTime()
}

/** Numéro de la semaine du bloc (1 = la première) à cet instant, ou null si on est en dehors. */
export function weekIndexAt(block: Block, time: number): number | null {
  if (time < block.startsOn || time >= blockEnd(block)) return null
  // On compte les lundis écoulés plutôt que les millisecondes : juste aux changements d'heure.
  let n = 1
  while (addWeeks(block.startsOn, n) <= time) n++
  return n
}

export function isDeload(block: Block, weekIndex: number): boolean {
  return block.deloadWeeks.includes(weekIndex)
}

/** Le bloc en cours à cet instant (le plus récemment commencé si plusieurs se chevauchent). */
export function activeBlock(blocks: Block[], now = Date.now()): Block | undefined {
  return blocks.filter((b) => weekIndexAt(b, now) !== null).sort((a, b) => b.startsOn - a.startsOn)[0]
}

/** Le bloc auquel rattacher une séance commencée à cet instant (le bloc en cours, s'il y en a un). */
export function blockIdFor(blocks: Block[], time: number): string | undefined {
  return activeBlock(blocks, time)?.id
}

export type BlockWeek = { index: number; start: number; end: number; deload: boolean }

/** Les semaines du bloc, du lundi au dimanche (`end` = dernier jour, inclus). */
export function blockWeeks(block: Block): BlockWeek[] {
  return Array.from({ length: block.weeks }, (_, i) => {
    const start = addWeeks(block.startsOn, i)
    const last = new Date(addWeeks(start, 1))
    last.setDate(last.getDate() - 1)
    return { index: i + 1, start, end: last.getTime(), deload: isDeload(block, i + 1) }
  })
}

/** Blocs qui mordent sur celui-ci (dates qui se croisent). Sert à prévenir, jamais à interdire. */
export function overlapping(block: Block, others: Block[]): Block[] {
  const start = block.startsOn
  const end = blockEnd(block)
  return others
    .filter((o) => o.id !== block.id && o.startsOn < end && blockEnd(o) > start)
    .sort((a, b) => a.startsOn - b.startsOn)
}

/** Ajoute une semaine de deload après `after` : le bloc s'allonge et les deloads suivants décalent. */
export function withDeloadWeek(block: Block, after: number): BlockDraft & { id: string; createdAt: number } {
  // Déjà à la durée maximale : pas de place pour une semaine de plus.
  if (block.weeks >= MAX_WEEKS) return block
  const week = after + 1
  return {
    ...block,
    weeks: block.weeks + 1,
    deloadWeeks: [...block.deloadWeeks.map((n) => (n >= week ? n + 1 : n)), week].sort((a, b) => a - b),
  }
}

/** Lundi de la semaine d'une date choisie dans un formulaire (un bloc commence toujours un lundi). */
export function normalizeStart(time: number): number {
  return mondayOf(time)
}

// ---------- Formats français ----------

const MONTHS_SHORT = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.']

/** « 14 sept. » */
export function formatDayMonth(time: number): string {
  const d = new Date(time)
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`
}

/** « 14 sept. → 18 oct. » ; l'année n'apparaît que si elle diffère de l'année en cours. */
export function formatSpan(from: number, to: number, now = Date.now()): string {
  const year = new Date(to).getFullYear()
  const suffix = year === new Date(now).getFullYear() ? '' : ` ${year}`
  return `${formatDayMonth(from)} → ${formatDayMonth(to)}${suffix}`
}

/** « Du 14 septembre au 18 octobre 2026 » */
export function formatLongSpan(from: number, to: number): string {
  const long = (t: number) => new Date(t).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })
  return `Du ${long(from)} au ${long(to)} ${new Date(to).getFullYear()}`
}

/** « Septembre 2026 », pour l'en-tête du mois. */
export function formatMonth(time: number): string {
  const s = new Date(time).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
  return s.charAt(0).toUpperCase() + s.slice(1)
}
