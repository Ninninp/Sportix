// Stats et progression (J7) : calculs purs derrière l'onglet Stats. Les écrans ne font qu'afficher.
// La question à laquelle tout ceci répond : « ai-je progressé au squat pendant mon bloc Force ? »
//
// Règles communes (maquettes J7, validées le 25/09/2026) :
// - Une série compte si elle est faite avec au moins 1 rep.
// - Les stats d'un exercice sont séparées par variante (barre, haltères…), comme les records.
// - Les séances de deload restent affichées (points creux, gris) mais sont EXCLUES des courbes,
//   des moyennes et des comparaisons : une semaine allégée n'est pas une baisse de niveau.
// - Les records, eux, voient tout l'historique (même règle qu'en séance, src/lib/records.ts).
import { activeBlock, addWeeks, blockEnd, isDeloadAt, type Block } from './blocks.ts'
import { MUSCLE_GROUPS, type Exercise, type MuscleGroup, type Variant } from './exercises.ts'
import { formatNumber, type Session, type SessionSet } from './sessions.ts'
import { mondayOf } from './week.ts'

// ---------- Période ----------

export const PERIODS = ['4s', '3m', '1a'] as const
export type Period = (typeof PERIODS)[number]
export const PERIOD_LABELS: Record<Period, string> = { '4s': '4 sem.', '3m': '3 mois', '1a': '1 an' }
export const DEFAULT_PERIOD: Period = '3m'

/** Période lue dans l'adresse (`?periode=1a`), la valeur par défaut si elle manque ou est inconnue. */
export function parsePeriod(value: string | null): Period {
  return PERIODS.find((p) => p === value) ?? DEFAULT_PERIOD
}

/**
 * Premier jour (0 h) de la période qui finit maintenant. « 4 sem. » = cette semaine et les trois
 * d'avant, du lundi ; « 3 mois » et « 1 an » = le même jour, 3 mois ou 1 an plus tôt.
 */
export function periodStart(period: Period, now = Date.now()): number {
  if (period === '4s') return addWeeks(mondayOf(now), -3)
  const d = new Date(now)
  d.setHours(0, 0, 0, 0)
  if (period === '3m') d.setMonth(d.getMonth() - 3)
  else d.setFullYear(d.getFullYear() - 1)
  return d.getTime()
}

// ---------- 1RM estimé ----------

/**
 * 1RM estimé (formule d'Epley) : la charge qu'on soulèverait une seule fois, déduite d'une série.
 * charge × (1 + reps / 30) ; une série d'une seule rep donne sa propre charge.
 */
export function estimateOneRepMax(weight: number, reps: number): number | null {
  if (reps < 1 || weight <= 0) return null
  return reps === 1 ? weight : weight * (1 + reps / 30)
}

// ---------- Graduations ----------

export type Scale = { min: number; max: number; ticks: number[] }

/**
 * Graduations « rondes » (1, 2, 2,5 ou 5 × 10ⁿ) qui encadrent les valeurs, environ `count` traits.
 * Une seule valeur (ou toutes égales) : on ouvre un peu autour pour que la courbe ne colle pas au bord.
 */
export function niceScale(values: number[], count = 3): Scale {
  let lo = Math.min(...values)
  let hi = Math.max(...values)
  if (!Number.isFinite(lo)) return { min: 0, max: 1, ticks: [0, 1] }
  if (lo === hi) {
    const pad = Math.max(1, Math.abs(lo) * 0.05)
    lo -= pad
    hi += pad
  }
  const raw = (hi - lo) / count
  const power = 10 ** Math.floor(Math.log10(raw))
  const step = ([1, 2, 2.5, 5, 10].map((m) => m * power).find((s) => s >= raw) ?? 10 * power)
  const min = Math.floor(lo / step) * step
  const max = Math.ceil(hi / step) * step
  const ticks: number[] = []
  for (let v = min; v <= max + step / 2; v += step) ticks.push(Math.round(v * 1000) / 1000)
  return { min, max, ticks }
}

const MONTHS_SHORT = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.']

/**
 * Repères du bas d'un graphique entre `from` et `to` : les lundis (« 7 sept. ») sur 4 semaines,
 * sinon les débuts de mois (« sept. »), un sur deux sur un an pour que les libellés tiennent.
 */
export function timeLabels(from: number, to: number): { time: number; label: string }[] {
  const labels: { time: number; label: string }[] = []
  const days = (to - from) / 86_400_000
  if (days <= 35) {
    for (let t = mondayOf(from) < from ? addWeeks(mondayOf(from), 1) : mondayOf(from); t <= to; t = addWeeks(t, 1)) {
      const d = new Date(t)
      labels.push({ time: t, label: `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}` })
    }
    return labels
  }
  const d = new Date(from)
  let month = new Date(d.getFullYear(), d.getMonth() + (d.getDate() > 1 ? 1 : 0), 1)
  while (month.getTime() <= to) {
    labels.push({ time: month.getTime(), label: MONTHS_SHORT[month.getMonth()] })
    month = new Date(month.getFullYear(), month.getMonth() + 1, 1)
  }
  return labels.length > 6 ? labels.filter((_, i) => i % 2 === 0) : labels
}

// ---------- Un exercice ----------

/** Mesure affichée pour un exercice. Sans charge (poids du corps, temps) : les reps. */
export type Metric = 'oneRepMax' | 'maxWeight' | 'volume' | 'maxReps' | 'totalReps'
export const LOADED_METRICS: Metric[] = ['oneRepMax', 'maxWeight', 'volume']
export const UNLOADED_METRICS: Metric[] = ['maxReps', 'totalReps']
export const METRIC_LABELS: Record<Metric, string> = {
  oneRepMax: '1RM estimé',
  maxWeight: 'Charge max',
  volume: 'Volume',
  maxReps: 'Reps max',
  totalReps: 'Reps totales',
}

/** Un exercice « se fait avec une charge » : c'est son type qui le dit, pas les séries saisies. */
export function isLoaded(exercise: Pick<Exercise, 'type'>): boolean {
  return exercise.type === 'charge'
}

/** Variante choisie dans les stats : l'une des variantes, « sans variante » (null) ou toutes. */
export type VariantFilter = Variant | null | 'all'

export type Point = {
  sessionId: string
  time: number
  value: number
  /** Séance de deload : affichée à part, hors de la courbe et des comparaisons. */
  deload: boolean
  /** La meilleure série de la séance pour cette mesure (affichée dans la bulle : « 90 × 5 »). */
  best: SessionSet
}

const counts = (s: SessionSet) => s.done && s.reps >= 1

/** Séries faites de cet exercice (et de cette variante, sauf « toutes »). */
export function exerciseSets(exerciseId: string, variant: VariantFilter, sets: SessionSet[]): SessionSet[] {
  return sets.filter((s) => counts(s) && s.exerciseId === exerciseId && (variant === 'all' || s.variant === variant))
}

/** Valeur d'une série pour une mesure « par série » (la meilleure de la séance l'emporte). */
function setValue(s: SessionSet, metric: Metric): number {
  if (metric === 'oneRepMax') return estimateOneRepMax(s.weight, s.reps) ?? 0
  if (metric === 'maxWeight') return s.weight + s.reps / 1000 // à charge égale, la série la plus longue
  return s.reps
}

/** Volume d'une série : charge × reps (×2 aux haltères, la charge est celle d'un haltère). */
const setVolume = (s: SessionSet) => s.weight * s.reps * (s.variant === 'halteres' ? 2 : 1)

/**
 * Un point par séance (séances terminées seulement), du plus ancien au plus récent.
 * `sessions` sert à dater les séances et à savoir si elles sont de deload.
 */
export function exercisePoints(
  exerciseId: string,
  variant: VariantFilter,
  metric: Metric,
  sessions: Session[],
  sets: SessionSet[],
): Point[] {
  const bySession = new Map<string, SessionSet[]>()
  for (const s of exerciseSets(exerciseId, variant, sets)) {
    bySession.set(s.sessionId, [...(bySession.get(s.sessionId) ?? []), s])
  }
  const points: Point[] = []
  for (const session of sessions) {
    const own = bySession.get(session.id)
    if (!own || session.endedAt === undefined) continue
    const best = own.reduce((a, b) => (setValue(b, metric) > setValue(a, metric) ? b : a))
    const value =
      metric === 'volume'
        ? own.reduce((sum, s) => sum + setVolume(s), 0)
        : metric === 'totalReps'
          ? own.reduce((sum, s) => sum + s.reps, 0)
          : metric === 'maxWeight'
            ? best.weight
            : setValue(best, metric)
    points.push({ sessionId: session.id, time: session.startedAt, value, deload: session.deload === true || best.deload === true, best })
  }
  return points.sort((a, b) => a.time - b.time)
}

export type Progress = {
  /** Écart entre le dernier point et le point de départ (hors deload). */
  change: number
  /** Nom du bloc de référence, ou null : écart sur la période affichée. */
  blockName: string | null
}

/**
 * « ↑ 5 kg depuis le début du bloc Force » : écart entre le dernier point (hors deload) et le
 * niveau au début du bloc en cours — la dernière séance d'avant le bloc, sinon la première du bloc.
 * Hors bloc (ou sans séance dans le bloc), l'écart porte sur la période qui commence à `from`.
 */
export function progressOf(points: Point[], blocks: Block[], from: number, now = Date.now()): Progress | null {
  const kept = points.filter((p) => !p.deload)
  const last = kept[kept.length - 1]
  if (!last) return null
  const block = activeBlock(blocks, now)
  if (block && last.time >= block.startsOn) {
    const before = kept.filter((p) => p.time < block.startsOn)
    const start = before.length > 0 ? before[before.length - 1] : kept.find((p) => p.time >= block.startsOn)!
    if (start !== last) return { change: last.value - start.value, blockName: block.name }
  }
  const first = kept.find((p) => p.time >= from)
  return first && first !== last ? { change: last.value - first.value, blockName: null } : null
}

export type ExerciseRecords = {
  oneRepMax?: { value: number; time: number }
  maxWeight?: { set: SessionSet; time: number }
  volume?: { value: number; time: number }
  maxReps?: { set: SessionSet; time: number }
}

/** Meilleures marques de tout l'historique (deload compris : un record reste un record). */
export function exerciseRecords(
  exerciseId: string,
  variant: VariantFilter,
  loaded: boolean,
  sessions: Session[],
  sets: SessionSet[],
): ExerciseRecords {
  const best = (metric: Metric) =>
    exercisePoints(exerciseId, variant, metric, sessions, sets).reduce<Point | undefined>(
      (a, p) => (!a || p.value > a.value ? p : a),
      undefined,
    )
  if (!loaded) {
    const reps = best('maxReps')
    return reps ? { maxReps: { set: reps.best, time: reps.time } } : {}
  }
  const orm = best('oneRepMax')
  const max = best('maxWeight')
  const vol = best('volume')
  return {
    ...(orm && { oneRepMax: { value: orm.value, time: orm.time } }),
    ...(max && { maxWeight: { set: max.best, time: max.time } }),
    ...(vol && { volume: { value: vol.value, time: vol.time } }),
  }
}

export type ExerciseSummary = {
  exercise: Exercise
  /** Variante la plus utilisée sur la période (celle que la ligne résume). */
  variant: Variant | null
  metric: Metric
  /** Valeurs des séances de la période, hors deload (la courbe miniature). */
  values: number[]
  /** Dernière valeur (le niveau actuel). */
  latest: number
  sessionCount: number
}

/**
 * La liste « Tous les exercices » : chaque exercice travaillé depuis `from`, résumé par sa variante
 * la plus utilisée (1RM estimé, ou reps max sans charge). Les plus pratiqués d'abord.
 */
export function exerciseSummaries(
  exercises: Map<string, Exercise>,
  sessions: Session[],
  sets: SessionSet[],
  from: number,
): ExerciseSummary[] {
  const inPeriod = new Set(sessions.filter((s) => s.startedAt >= from && s.endedAt !== undefined).map((s) => s.id))
  const usage = new Map<string, Map<Variant | null, number>>()
  for (const s of sets) {
    if (!counts(s) || !inPeriod.has(s.sessionId)) continue
    const variants = usage.get(s.exerciseId) ?? new Map<Variant | null, number>()
    variants.set(s.variant, (variants.get(s.variant) ?? 0) + 1)
    usage.set(s.exerciseId, variants)
  }
  const recent = sessions.filter((s) => inPeriod.has(s.id))
  const summaries: ExerciseSummary[] = []
  for (const [exerciseId, variants] of usage) {
    const exercise = exercises.get(exerciseId)
    if (!exercise) continue
    const variant = [...variants].sort((a, b) => b[1] - a[1])[0][0]
    const metric: Metric = isLoaded(exercise) ? 'oneRepMax' : 'maxReps'
    const points = exercisePoints(exerciseId, variant, metric, recent, sets)
    const kept = points.filter((p) => !p.deload)
    const shown = kept.length > 0 ? kept : points
    summaries.push({
      exercise,
      variant,
      metric,
      values: shown.map((p) => p.value),
      latest: shown[shown.length - 1].value,
      sessionCount: points.length,
    })
  }
  return summaries.sort((a, b) => b.sessionCount - a.sessionCount || a.exercise.name.localeCompare(b.exercise.name, 'fr'))
}

// ---------- Vue d'ensemble ----------

export type WeekCount = {
  start: number
  count: number
  deload: boolean
  current: boolean
  /** Première semaine commencée avant le début de la période : on n'en voit qu'une partie. */
  partial: boolean
}

/** Séances terminées de chaque semaine (du lundi) depuis `from` jusqu'à la semaine en cours. */
export function sessionsByWeek(sessions: Session[], blocks: Block[], from: number, now = Date.now()): WeekCount[] {
  const thisWeek = mondayOf(now)
  const weeks: WeekCount[] = []
  for (let start = mondayOf(from); start <= thisWeek; start = addWeeks(start, 1)) {
    const end = addWeeks(start, 1)
    weeks.push({
      start,
      count: sessions.filter((s) => s.endedAt !== undefined && s.startedAt >= start && s.startedAt < end).length,
      deload: isDeloadAt(blocks, start),
      current: start === thisWeek,
      partial: start < from,
    })
  }
  return weeks
}

/**
 * Moyenne de séances par semaine, sans les semaines incomplètes (celle en cours, pas finie, et la
 * première si la période commence en milieu de semaine : elles tireraient la moyenne vers le bas)
 * ni les semaines de deload. null s'il ne reste aucune semaine.
 */
export function averagePerWeek(weeks: WeekCount[]): number | null {
  const kept = weeks.filter((w) => !w.current && !w.partial && !w.deload)
  return kept.length > 0 ? kept.reduce((sum, w) => sum + w.count, 0) / kept.length : null
}

/**
 * Séries faites par semaine et par groupe musculaire, en moyenne sur la période (hors deload).
 * On divise par le nombre de semaines réellement couvertes : depuis `from`, ou depuis la première
 * séance si l'historique est plus court que la période (sinon tout paraîtrait trop bas).
 */
export function setsPerMuscle(
  exercises: Map<string, Exercise>,
  sessions: Session[],
  sets: SessionSet[],
  from: number,
  now = Date.now(),
): { group: MuscleGroup; perWeek: number }[] {
  const kept = sessions.filter((s) => s.endedAt !== undefined && s.startedAt >= from && !s.deload)
  if (kept.length === 0) return []
  const ids = new Set(kept.map((s) => s.id))
  const totals = new Map<MuscleGroup, number>()
  for (const s of sets) {
    const group = exercises.get(s.exerciseId)?.muscleGroup
    if (!group || !counts(s) || !ids.has(s.sessionId)) continue
    totals.set(group, (totals.get(group) ?? 0) + 1)
  }
  const first = Math.max(from, mondayOf(Math.min(...kept.map((s) => s.startedAt))))
  const weeks = Math.max(1, (now - first) / (7 * 86_400_000))
  return MUSCLE_GROUPS.filter((g) => totals.has(g))
    .map((group) => ({ group, perWeek: totals.get(group)! / weeks }))
    .sort((a, b) => b.perWeek - a.perWeek)
}

export type RecordEvent = { set: SessionSet; time: number }

/**
 * Records battus depuis `from`, du plus récent au plus ancien : même règle qu'en séance
 * (src/lib/records.ts) — une charge jamais soulevée sur l'exercice et la variante, ou plus de reps
 * sans charge ; la toute première fois n'en est pas un. Une ligne par séance et par exercice.
 */
export function recentRecords(sessions: Session[], sets: SessionSet[], from: number, limit = 3): RecordEvent[] {
  const key = (s: SessionSet) => `${s.exerciseId}|${s.variant ?? ''}`
  const value = (s: SessionSet) => (s.weight > 0 ? s.weight : s.reps)
  const bySession = new Map<string, SessionSet[]>()
  for (const s of sets) if (counts(s)) bySession.set(s.sessionId, [...(bySession.get(s.sessionId) ?? []), s])

  const best = new Map<string, number>()
  const events: RecordEvent[] = []
  for (const session of [...sessions].filter((s) => s.endedAt !== undefined).sort((a, b) => a.startedAt - b.startedAt)) {
    const top = new Map<string, SessionSet>()
    for (const s of bySession.get(session.id) ?? []) {
      const current = top.get(key(s))
      if (!current || value(s) > value(current) || (value(s) === value(current) && s.reps > current.reps)) top.set(key(s), s)
    }
    for (const [k, s] of top) {
      const previous = best.get(k)
      if (previous !== undefined && value(s) > previous && session.startedAt >= from) events.push({ set: s, time: session.startedAt })
      best.set(k, Math.max(previous ?? 0, value(s)))
    }
  }
  return events.sort((a, b) => b.time - a.time).slice(0, limit)
}

// ---------- Comparer deux blocs ----------

/** Les deux blocs comparés par défaut : le dernier commencé et celui d'avant. */
export function defaultComparison(blocks: Block[], now = Date.now()): [Block, Block] | null {
  const started = blocks.filter((b) => b.startsOn <= now).sort((a, b) => a.startsOn - b.startsOn)
  return started.length >= 2 ? [started[started.length - 2], started[started.length - 1]] : null
}

export type BlockFigures = {
  /** Séances par semaine, hors semaines de deload, sur les semaines déjà commencées. */
  sessionsPerWeek: number
  /** Volume (kg) par semaine, même règle. */
  volumePerWeek: number
}

/** Semaines du bloc déjà commencées et qui ne sont pas des deloads. */
function countedWeeks(block: Block, now: number): number {
  let n = 0
  for (let i = 0; i < block.weeks; i++) {
    const start = addWeeks(block.startsOn, i)
    if (start <= now && !block.deloadWeeks.includes(i + 1)) n++
  }
  return n
}

const inBlock = (block: Block, sessions: Session[]) =>
  sessions.filter((s) => s.blockId === block.id && s.endedAt !== undefined && !s.deload)

export function blockFigures(block: Block, sessions: Session[], sets: SessionSet[], now = Date.now()): BlockFigures {
  const own = inBlock(block, sessions)
  const ids = new Set(own.map((s) => s.id))
  const weeks = Math.max(1, countedWeeks(block, Math.min(now, blockEnd(block) - 1)))
  const volume = sets.filter((s) => counts(s) && ids.has(s.sessionId)).reduce((sum, s) => sum + setVolume(s), 0)
  return { sessionsPerWeek: own.length / weeks, volumePerWeek: volume / weeks }
}

export type BlockGain = { exerciseId: string; variant: Variant | null; gains: [number, number] }

/**
 * 1RM estimé gagné pendant chacun des deux blocs, pour les exercices (et variantes) avec charge
 * travaillés dans les deux : dernière séance du bloc moins la première (deload exclu).
 * Les plus pratiqués d'abord, `limit` au plus.
 */
export function blockGains(a: Block, b: Block, sessions: Session[], sets: SessionSet[], limit = 6): BlockGain[] {
  const key = (s: SessionSet) => `${s.exerciseId}|${s.variant ?? ''}`
  const gainIn = (block: Block) => {
    const own = inBlock(block, sessions)
    const ids = new Set(own.map((s) => s.id))
    const time = new Map(own.map((s) => [s.id, s.startedAt]))
    // Pour chaque exercice : meilleur 1RM estimé de chaque séance
    const perKey = new Map<string, { sets: SessionSet[]; perSession: Map<string, number> }>()
    for (const s of sets) {
      if (!counts(s) || s.weight <= 0 || !ids.has(s.sessionId)) continue
      const entry = perKey.get(key(s)) ?? { sets: [], perSession: new Map<string, number>() }
      entry.sets.push(s)
      entry.perSession.set(s.sessionId, Math.max(entry.perSession.get(s.sessionId) ?? 0, estimateOneRepMax(s.weight, s.reps)!))
      perKey.set(key(s), entry)
    }
    const result = new Map<string, { gain: number; sessions: number; set: SessionSet }>()
    for (const [k, { sets: own, perSession }] of perKey) {
      const ordered = [...perSession].sort((x, y) => time.get(x[0])! - time.get(y[0])!)
      result.set(k, { gain: ordered[ordered.length - 1][1] - ordered[0][1], sessions: ordered.length, set: own[0] })
    }
    return result
  }
  const ga = gainIn(a)
  const gb = gainIn(b)
  return [...ga.keys()]
    .filter((k) => gb.has(k))
    .sort((x, y) => gb.get(y)!.sessions + ga.get(y)!.sessions - (gb.get(x)!.sessions + ga.get(x)!.sessions))
    .slice(0, limit)
    .map((k) => ({ exerciseId: ga.get(k)!.set.exerciseId, variant: ga.get(k)!.set.variant, gains: [ga.get(k)!.gain, gb.get(k)!.gain] }))
}

// ---------- Formats ----------

/** « 117 kg » : charge ou 1RM arrondi au demi-kilo. */
export function formatKg(kg: number): string {
  return `${formatNumber(Math.round(kg * 2) / 2)} kg`
}

/** « +5 kg », « −2,5 kg », « 0 kg » : écart arrondi au demi-kilo, avec son signe. */
export function formatKgChange(kg: number): string {
  const r = Math.round(kg * 2) / 2
  return `${r > 0 ? '+' : r < 0 ? '−' : ''}${formatNumber(Math.abs(r))} kg`
}

/** Valeur d'une mesure en deux morceaux, pour l'afficher en gros avec l'unité en petit. */
export function metricParts(metric: Metric, value: number): { number: string; unit: string } {
  if (metric === 'maxReps' || metric === 'totalReps') return { number: String(Math.round(value)), unit: 'reps' }
  if (metric === 'volume') return { number: new Intl.NumberFormat('fr-FR').format(Math.round(value)), unit: 'kg' }
  return { number: formatNumber(Math.round(value * 2) / 2), unit: 'kg' }
}

/** Valeur d'une mesure, avec son unité (« 117 kg », « 2 160 kg », « × 12 », « 45 reps »). */
export function formatMetric(metric: Metric, value: number): string {
  if (metric === 'maxReps') return `× ${Math.round(value)}`
  const { number, unit } = metricParts(metric, value)
  return `${number} ${unit}`
}

/** Une série : « 90 × 5 », ou « × 12 » sans charge. */
export function formatSet(s: Pick<SessionSet, 'weight' | 'reps'>): string {
  return s.weight > 0 ? `${formatNumber(s.weight)} × ${s.reps}` : `× ${s.reps}`
}

/** « lun. 27 juil. » */
export function formatShortDate(time: number): string {
  const d = new Date(time)
  const weekday = d.toLocaleDateString('fr-FR', { weekday: 'short' })
  return `${weekday} ${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`
}
