// Séances et séries : types et calculs purs (sans base de données ni affichage).
import type { Variant } from './exercises.ts'

export type Session = {
  id: string
  /** Horodatage du début (Date.now()) : le chrono de la séance en découle. */
  startedAt: number
  /** Absent tant que la séance est en cours. */
  endedAt?: number
  note?: string
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
}

export type ExerciseBlock = {
  exerciseId: string
  variant: Variant | null
  exerciseOrder: number
  sets: SessionSet[]
  doneCount: number
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
    }
    block.sets.push(set)
    blocks.set(key, block)
  }
  return [...blocks.values()]
    .map((b) => ({
      ...b,
      sets: b.sets.sort((x, y) => x.order - y.order),
      doneCount: b.sets.filter((s) => s.done).length,
    }))
    .sort((a, b) => a.exerciseOrder - b.exerciseOrder)
}

/** La première série non faite de la séance (celle que le pavé de saisie modifie). */
export function currentSet(sets: SessionSet[]): SessionSet | undefined {
  return groupSetsByExercise(sets)
    .flatMap((b) => b.sets)
    .find((s) => !s.done)
}

export function sessionProgress(sets: SessionSet[]): { done: number; total: number } {
  return { done: sets.filter((s) => s.done).length, total: sets.length }
}

/**
 * Volume total soulevé (kg) : somme de charge × reps des séries faites.
 * Haltères : la charge saisie est celle d'un haltère, le volume compte donc double.
 */
export function sessionVolume(sets: SessionSet[]): number {
  return sets
    .filter((s) => s.done)
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
    setCount: sets.filter((s) => s.done).length,
    exerciseCount: groupSetsByExercise(sets).length,
  }
}
