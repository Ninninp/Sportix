// Blocs de spécialisation (J6) : un objectif sur quelques semaines (« Force, 5 semaines »),
// auquel les séances se rattachent pour comparer un bloc à l'autre (J7).
//
// Règle retenue le 21/09/2026 (design/README.md) : **un bloc commence un lundi et dure un nombre
// entier de semaines**. La semaine du bloc et la semaine du calendrier sont donc la même chose,
// ce qui rend justes la barre S1…S5, le « semaine 2 sur 5 » et les comparaisons du J7.
//
// Comme partout dans l'app, les dates se calculent en jours de calendrier (`setDate`) et jamais en
// multiples de 24 h : aux changements d'heure une semaine dure 167 ou 169 heures.
import { sessionVolume, type Session, type SessionSet } from './sessions.ts'
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
  /**
   * Séances prévues chaque semaine (ajouté le 22/09/2026, d'où le `?` : un bloc créé avant ne l'a
   * pas encore). Champ non indexé : pas de nouvelle version du schéma Dexie.
   */
  weeklySessions?: number
  /** Couleur du bloc dans le calendrier (ajoutée le 22/09/2026 ; absente = « sable »). */
  color?: BlockColor
  notes?: string
  createdAt: number
}

export type BlockDraft = Omit<Block, 'id' | 'createdAt'>

/** Couleurs des blocs, dans l'ordre de la palette (tokens `block-*` de design/tokens.md). */
export const BLOCK_COLORS = ['sable', 'orange', 'jaune', 'vert', 'bleu', 'violet', 'rose'] as const
export type BlockColor = (typeof BLOCK_COLORS)[number]
export const BLOCK_COLOR_LABELS: Record<BlockColor, string> = {
  sable: 'Sable',
  orange: 'Orange',
  jaune: 'Jaune',
  vert: 'Vert',
  bleu: 'Bleu',
  violet: 'Violet',
  rose: 'Rose',
}

export function blockColor(block: Pick<Block, 'color'>): BlockColor {
  return block.color ?? 'sable'
}

/**
 * Couleur proposée pour un nouveau bloc : celle qui suit, dans la palette, la couleur du dernier
 * bloc (le plus tard commencé). Deux blocs qui s'enchaînent ont ainsi des couleurs différentes
 * sans que l'utilisateur ait à y penser.
 */
export function suggestColor(blocks: Block[]): BlockColor {
  const last = [...blocks].sort((a, b) => b.startsOn - a.startsOn)[0]
  if (!last) return 'orange'
  return BLOCK_COLORS[(BLOCK_COLORS.indexOf(blockColor(last)) + 1) % BLOCK_COLORS.length]
}

export const MIN_WEEKS = 1
export const MAX_WEEKS = 24
export const MIN_WEEKLY_SESSIONS = 1
export const MAX_WEEKLY_SESSIONS = 14

/** Séances par semaine proposées : une par jour du programme suivi, sinon 3. */
export function defaultWeeklySessions(programDays: number): number {
  return programDays > 0 ? Math.min(programDays, MAX_WEEKLY_SESSIONS) : 3
}

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

/** Une séance commencée à cet instant tombe-t-elle dans une semaine de deload (du bloc en cours) ? */
export function isDeloadAt(blocks: Block[], time: number): boolean {
  const block = activeBlock(blocks, time)
  const week = block ? weekIndexAt(block, time) : null
  return block !== undefined && week !== null && isDeload(block, week)
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

/** Nombre de semaines entières d'un lundi à un autre (en jours de calendrier). */
export function weeksBetween(from: number, to: number): number {
  let n = 0
  while (addWeeks(from, n) < to) n++
  return n
}

/**
 * Décalage des blocs suivants quand un bloc s'allonge (ou avance) et mord sur eux : le premier bloc
 * touché repart juste après celui-ci, et tous ceux qui venaient après lui reculent d'autant, pour
 * garder l'enchaînement prévu. Seuls les blocs qui commencent APRÈS celui-ci sont déplacés.
 * Renvoie les nouvelles dates de début (vide s'il n'y a rien à décaler).
 */
export function shiftNextBlocks(block: Block, others: Block[]): { id: string; startsOn: number }[] {
  const end = blockEnd(block)
  const hit = others.filter((o) => o.id !== block.id && o.startsOn > block.startsOn && o.startsOn < end)
  if (hit.length === 0) return []
  const first = Math.min(...hit.map((o) => o.startsOn))
  const weeks = weeksBetween(first, end)
  return others
    .filter((o) => o.id !== block.id && o.startsOn >= first)
    .map((o) => ({ id: o.id, startsOn: addWeeks(o.startsOn, weeks) }))
}

/** Lundi de la semaine d'une date choisie dans un formulaire (un bloc commence toujours un lundi). */
export function normalizeStart(time: number): number {
  return mondayOf(time)
}

/**
 * Premier jour proposé pour un nouveau bloc : le lundi de cette semaine, ou la fin du dernier
 * bloc s'il court encore (on enchaîne les blocs sans les faire se chevaucher).
 */
export function suggestStart(blocks: Block[], now = Date.now()): number {
  return Math.max(mondayOf(now), ...blocks.map(blockEnd))
}

// ---------- Suivi d'un bloc ----------

export type WeekState = 'past' | 'current' | 'future'
export type WeekSegment = { index: number; state: WeekState; deload: boolean }

/** La barre S1…S5 : semaines passées, semaine en cours, semaines à venir (deload repéré). */
export function weekSegments(block: Block, now = Date.now()): WeekSegment[] {
  const current = weekIndexAt(block, now)
  const finished = now >= blockEnd(block)
  return blockWeeks(block).map(({ index, deload }) => ({
    index,
    deload,
    state: finished || (current !== null && index < current) ? 'past' : index === current ? 'current' : 'future',
  }))
}

/** Phrase lue par les lecteurs d'écran à la place de la barre : « semaine 2 sur 5, deload en semaine 4 ». */
export function describeWeeks(segments: WeekSegment[]): string {
  const current = segments.find((s) => s.state === 'current')
  const deloads = segments.filter((s) => s.deload).map((s) => s.index)
  const where = current
    ? `semaine ${current.index} sur ${segments.length}`
    : segments.every((s) => s.state === 'past')
      ? 'terminé'
      : `${segments.length} semaines, à venir`
  return deloads.length > 0 ? `${where}, deload en semaine ${deloads.join(' et ')}` : where
}

/** Séances terminées rattachées au bloc. */
export function blockSessions(block: Block, sessions: Session[]): Session[] {
  return sessions.filter((s) => s.blockId === block.id && s.endedAt !== undefined)
}

/** Nombre de séances faites dans chaque semaine du bloc (index 0 = semaine 1). */
export function sessionsPerWeek(block: Block, sessions: Session[]): number[] {
  const counts = Array.from({ length: block.weeks }, () => 0)
  for (const s of blockSessions(block, sessions)) {
    const week = weekIndexAt(block, s.startedAt)
    if (week !== null) counts[week - 1]++
  }
  return counts
}

/** Volume total (kg) des séances du bloc. */
export function blockVolume(block: Block, sessions: Session[], sets: SessionSet[]): number {
  const ids = new Set(blockSessions(block, sessions).map((s) => s.id))
  return sessionVolume(sets.filter((set) => ids.has(set.sessionId)))
}

/**
 * Séances prévues sur tout le bloc : séances par semaine × semaines (deload compris : on s'entraîne
 * aussi pendant un deload, plus léger). null pour un bloc qui n'a pas encore ce réglage.
 */
export function plannedSessions(block: Block): number | null {
  return block.weeklySessions ? block.weeks * block.weeklySessions : null
}

// ---------- Grille du mois (onglet Calendrier) ----------

export type CalendarDay = {
  time: number
  date: number
  /** Faux pour les jours du mois d'avant ou d'après qui complètent la première et la dernière ligne. */
  inMonth: boolean
  /** Bloc affiché pour ce jour (le plus tard commencé si plusieurs) : il s'ouvre au toucher. */
  blockId?: string
  /** Couleurs de tous les blocs de ce jour, du plus ancien au plus récent (2 = chevauchement). */
  colors: BlockColor[]
  deload: boolean
  /** Au moins une séance commencée ce jour-là. */
  done: boolean
  today: boolean
}
/** Une ligne de la grille = une semaine, du lundi au dimanche, avec son libellé « S2 » ou « D ». */
export type CalendarWeek = { label: string; blockId?: string; days: CalendarDay[] }

/** Premier jour du mois (0 h) qui contient cette date. */
export function monthStart(time: number): number {
  const d = new Date(time)
  return new Date(d.getFullYear(), d.getMonth(), 1).getTime()
}

/** Premier jour du mois décalé de `n` mois. */
export function addMonths(time: number, n: number): number {
  const d = new Date(time)
  return new Date(d.getFullYear(), d.getMonth() + n, 1).getTime()
}

export function monthGrid(month: number, blocks: Block[], sessions: Session[], now = Date.now()): CalendarWeek[] {
  const first = new Date(monthStart(month))
  const nextMonth = addMonths(first.getTime(), 1)
  const todayStart = new Date(now).setHours(0, 0, 0, 0)
  const doneDays = new Set(sessions.map((s) => new Date(s.startedAt).setHours(0, 0, 0, 0)))
  const weeks: CalendarWeek[] = []
  for (let monday = mondayOf(first.getTime()); monday < nextMonth; monday = addWeeks(monday, 1)) {
    const block = activeBlock(blocks, monday)
    const index = block ? weekIndexAt(block, monday) : null
    const deload = block !== undefined && index !== null && isDeload(block, index)
    // Tous les blocs qui couvrent cette semaine (un bloc commence un lundi : même liste pour les 7 jours).
    const colors = blocks
      .filter((b) => weekIndexAt(b, monday) !== null)
      .sort((a, b) => a.startsOn - b.startsOn)
      .map(blockColor)
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday)
      d.setDate(d.getDate() + i)
      const time = d.getTime()
      return {
        time,
        date: d.getDate(),
        inMonth: d.getMonth() === first.getMonth(),
        blockId: block?.id,
        colors,
        deload,
        done: doneDays.has(time),
        today: time === todayStart,
      }
    })
    weeks.push({ label: block && index !== null ? (deload ? 'D' : `S${index}`) : '', blockId: block?.id, days })
  }
  return weeks
}

// ---------- Formats français ----------

const MONTHS_SHORT = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.']

/** « 14 sept. » */
export function formatDayMonth(time: number): string {
  const d = new Date(time)
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`
}

/** Dates d'une semaine : « 14 → 20 sept. », ou « 28 sept. → 4 oct. » à cheval sur deux mois. */
export function formatWeekDates(start: number, end: number): string {
  const a = new Date(start)
  const b = new Date(end)
  return a.getMonth() === b.getMonth() ? `${a.getDate()} → ${formatDayMonth(end)}` : `${formatDayMonth(start)} → ${formatDayMonth(end)}`
}

/** Volume en tonnes au-delà d'une tonne : « 850 kg », « 38 t », « 1,5 t ». */
export function formatTonnage(kg: number): string {
  if (kg < 1000) return `${Math.round(kg)} kg`
  const t = kg >= 10000 ? Math.round(kg / 1000) : Math.round(kg / 100) / 10
  return `${String(t).replace('.', ',')} t`
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
