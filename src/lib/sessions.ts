// Séances et séries : types et calculs purs (sans base de données ni affichage).
import type { Variant } from './exercises.ts'
import type { Rest } from './rest.ts'

export type Session = {
  id: string
  /** Horodatage du début (Date.now()) : le chrono de la séance en découle. */
  startedAt: number
  /** Absent tant que la séance est en cours. */
  endedAt?: number
  note?: string
  /** Repos en cours (après une série validée) ; absent hors repos. Voir src/lib/rest.ts. */
  rest?: Rest
  /** Jour de programme d'où vient la séance (J5) ; absent pour une séance libre. */
  programDayId?: string
  /** Nom affiché (celui du jour au démarrage : il reste même si le programme change ensuite). */
  title?: string
  /** Bloc en cours au démarrage (J6), recalculé si les dates des blocs changent ; absent hors bloc. */
  blockId?: string
  /** Séance commencée pendant une semaine de deload (J6), recalculée comme `blockId`. */
  deload?: boolean
}

export type SessionSet = {
  id: string
  sessionId: string
  exerciseId: string
  /** Variante utilisée (null pour un exercice au poids du corps ou au temps). */
  variant: Variant | null
  /** Rang de l'exercice dans la séance (ordre des pastilles). */
  exerciseOrder: number
  /** Rang de la série dans son exercice (1, 2, 3…). */
  order: number
  /** Charge en kg (pour les haltères : celle d'un seul haltère). */
  weight: number
  reps: number
  /** Objectif de reps en vigueur pour cette série (double progression). */
  targetRepsMin?: number
  targetRepsMax?: number
  done: boolean
  doneAt?: number
  /** Repos après cette série, en secondes (celui du programme) ; absent : le repos des Réglages. */
  restSeconds?: number
  /** false : double progression désactivée pour cet exercice (jamais de proposition de charge). */
  progression?: boolean
  /**
   * Série d'une séance de deload (même valeur que `session.deload`, recopiée ici pour que
   * `lastPerformance` puisse l'écarter sans relire les séances).
   */
  deload?: boolean
  /**
   * Série d'échauffement (J9), ajoutée à la main avant les séries de travail. Elle ne compte nulle
   * part : ni volume, ni records, ni « dernière fois », ni stats, ni progression de la séance.
   * Son `order` est son rang parmi les échauffements de l'exercice (1, 2…).
   */
  warmup?: boolean
  /**
   * Superset (J9) : cet exercice est relié au suivant de la séance (porté par toutes ses séries).
   * Les exercices reliés alternent (A1 → B1 → repos → A2…), voir `sessionSequence`.
   */
  supersetNext?: boolean
}

/** Série de travail : tout sauf l'échauffement. */
export const isWorkSet = (s: SessionSet) => !s.warmup

export type ExerciseBlock = {
  exerciseId: string
  variant: Variant | null
  exerciseOrder: number
  /** Échauffements d'abord (dans leur ordre), puis séries de travail. */
  sets: SessionSet[]
  /** Séries de travail faites (les échauffements ne comptent pas). */
  doneCount: number
  /** Nombre de séries de travail. */
  workCount: number
  /** Relié à l'exercice suivant de la séance (superset). */
  supersetNext: boolean
}

/** Regroupe les séries par exercice, dans l'ordre d'ajout, séries triées. */
export function groupSetsByExercise(sets: SessionSet[]): ExerciseBlock[] {
  const blocks = new Map<string, ExerciseBlock>()
  for (const set of sets) {
    const key = `${set.exerciseId}|${set.variant ?? ''}|${set.exerciseOrder}`
    const block = blocks.get(key) ?? {
      exerciseId: set.exerciseId,
      variant: set.variant,
      exerciseOrder: set.exerciseOrder,
      sets: [],
      doneCount: 0,
      workCount: 0,
      supersetNext: false,
    }
    block.sets.push(set)
    blocks.set(key, block)
  }
  return [...blocks.values()]
    .map((b) => {
      const work = b.sets.filter(isWorkSet)
      return {
        ...b,
        sets: b.sets.sort((x, y) => Number(isWorkSet(x)) - Number(isWorkSet(y)) || x.order - y.order),
        doneCount: work.filter((s) => s.done).length,
        workCount: work.length,
        supersetNext: b.sets.some((s) => s.supersetNext),
      }
    })
    .sort((a, b) => a.exerciseOrder - b.exerciseOrder)
}

/**
 * Exercices de la séance rangés par superset : chaque groupe est un exercice seul, ou plusieurs
 * exercices qui se suivent et sont reliés (`supersetNext`). Le dernier exercice de la séance ne
 * peut être relié à rien : son `supersetNext` est ignoré.
 */
export function supersetGroups(blocks: ExerciseBlock[]): ExerciseBlock[][] {
  const groups: ExerciseBlock[][] = []
  blocks.forEach((b, i) => {
    const previous = blocks[i - 1]
    if (previous?.supersetNext && groups.length > 0) groups[groups.length - 1].push(b)
    else groups.push([b])
  })
  return groups
}

/**
 * Les séries d'un groupe dans l'ordre où on les fait : les échauffements de chaque exercice, puis
 * les séries de travail en alternant (A1, B1, A2, B2…). Un exercice qui a plus de séries que les
 * autres finit seul.
 */
export function groupSequence(group: ExerciseBlock[]): SessionSet[] {
  const warmups = group.flatMap((b) => b.sets.filter((s) => s.warmup))
  const work = group.map((b) => b.sets.filter(isWorkSet))
  const rounds = Math.max(0, ...work.map((w) => w.length))
  const alternated = Array.from({ length: rounds }, (_, r) => work.flatMap((w) => (w[r] ? [w[r]] : []))).flat()
  return [...warmups, ...alternated]
}

/** Toutes les séries de la séance dans l'ordre où on les fait (supersets alternés). */
export function sessionSequence(sets: SessionSet[]): SessionSet[] {
  return supersetGroups(groupSetsByExercise(sets)).flatMap(groupSequence)
}

/** La première série non faite de la séance (celle que le pavé de saisie modifie). */
export function currentSet(sets: SessionSet[]): SessionSet | undefined {
  return sessionSequence(sets).find((s) => !s.done)
}

/** Le groupe (superset, ou exercice seul) qui contient cet exercice. */
export function groupOf(blocks: ExerciseBlock[], exerciseOrder: number): ExerciseBlock[] | undefined {
  return supersetGroups(blocks).find((g) => g.some((b) => b.exerciseOrder === exerciseOrder))
}

/**
 * Après avoir validé `set`, faut-il un repos ? Pas après un échauffement ; pas au milieu d'un tour
 * de superset : tant qu'un autre exercice du groupe a encore sa série du même tour à faire, on
 * enchaîne. Le repos vient donc après le dernier exercice du tour.
 */
export function restFollows(sets: SessionSet[], set: SessionSet): boolean {
  if (set.warmup) return false
  const blocks = groupSetsByExercise(sets)
  const group = groupOf(blocks, set.exerciseOrder)
  const own = group?.find((b) => b.exerciseOrder === set.exerciseOrder)
  if (!group || !own) return true
  const round = own.sets.filter(isWorkSet).findIndex((s) => s.id === set.id)
  return !group.some((b) => b !== own && b.sets.filter(isWorkSet)[round]?.done === false)
}

/**
 * Ce qui suit `set` dans un superset, pour le pavé de saisie : « repos », ou la série de l'autre
 * exercice qu'on enchaîne. null hors superset et pour un échauffement (rien à annoncer).
 */
export function supersetFollow(sets: SessionSet[], set: SessionSet): 'rest' | SessionSet | null {
  if (set.warmup) return null
  const group = groupOf(groupSetsByExercise(sets), set.exerciseOrder)
  if (!group || group.length < 2) return null
  if (restFollows(sets, set)) return 'rest'
  const sequence = groupSequence(group)
  return sequence.slice(sequence.findIndex((s) => s.id === set.id) + 1).find((s) => !s.done) ?? 'rest'
}

/** Rang de `set` parmi les séries de travail de son exercice (0, 1…) ; -1 pour un échauffement. */
export function workIndex(block: ExerciseBlock, set: SessionSet): number {
  return block.sets.filter(isWorkSet).findIndex((s) => s.id === set.id)
}

/** Progression de la séance : séries de travail faites / prévues. */
export function sessionProgress(sets: SessionSet[]): { done: number; total: number } {
  const work = sets.filter(isWorkSet)
  return { done: work.filter((s) => s.done).length, total: work.length }
}

/**
 * Volume total soulevé (kg) : somme de charge × reps des séries faites (hors échauffement).
 * Haltères : la charge saisie est celle d'un haltère, le volume compte donc double.
 */
export function sessionVolume(sets: SessionSet[]): number {
  return sets
    .filter((s) => s.done && isWorkSet(s))
    .reduce((total, s) => total + s.weight * s.reps * (s.variant === 'halteres' ? 2 : 1), 0)
}

export function sessionDuration(session: Session, now = Date.now()): number {
  return (session.endedAt ?? now) - session.startedAt
}

/** « 24:10 » (minutes:secondes) ou « 1:02:33 » au-delà d'une heure. */
export function formatDuration(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  const pad = (n: number) => String(n).padStart(2, '0')
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`
}

/** « 9 240 kg » : espace insécable fine entre les milliers, comme en français. */
export function formatWeight(kg: number): string {
  return `${new Intl.NumberFormat('fr-FR').format(Math.round(kg))} kg`
}

/** « 102,5 » : virgule décimale, sans zéro inutile. */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 }).format(value)
}

/**
 * Nom d'une séance libre dans l'historique : ses deux premiers exercices, puis « +N ».
 * (Au J5, une séance rattachée à un programme portera le nom de son jour.)
 */
export function describeSessionExercises(sets: SessionSet[], nameOf: (exerciseId: string) => string | undefined): string {
  const names = groupSetsByExercise(sets).map((b) => nameOf(b.exerciseId) ?? 'Exercice')
  if (names.length === 0) return 'Séance libre'
  const shown = names.slice(0, 2).join(', ')
  return names.length > 2 ? `${shown} +${names.length - 2}` : shown
}

export type SessionSummary = { durationMs: number; volume: number; setCount: number; exerciseCount: number }

export function sessionSummary(session: Session, sets: SessionSet[], now = Date.now()): SessionSummary {
  return {
    durationMs: sessionDuration(session, now),
    volume: sessionVolume(sets),
    setCount: sets.filter((s) => s.done && isWorkSet(s)).length,
    exerciseCount: groupSetsByExercise(sets).length,
  }
}

/** Objectif de reps affiché : « 8–12 », « 5 » (valeur unique), ou null sans objectif. */
export function formatTarget(min?: number, max?: number): string | null {
  if (!min) return null
  return max && max !== min ? `${min}–${max}` : String(min)
}
