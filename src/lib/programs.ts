// Programmes (J5) : types et règles pures (sans base de données ni affichage).
// Un programme = des jours dans un ordre (ex. « Force A — Jambes », « Force B — Haut du corps ») ;
// chaque jour = des exercices avec variante, séries, reps, repos et double progression.
import type { Variant } from './exercises.ts'
import { lastPerformance, minWeight, WEIGHT_STEPS, weightStep, type WeightSteps } from './progression.ts'
import type { Session, SessionSet } from './sessions.ts'

export type Program = {
  id: string
  name: string
  createdAt: number
}

export type ProgramDay = {
  id: string
  programId: string
  name: string
  /** Rang du jour dans le programme (1, 2, 3…) : l'ordre de la rotation. */
  order: number
}

export type ProgramExercise = {
  id: string
  dayId: string
  exerciseId: string
  variant: Variant | null
  /** Rang de l'exercice dans le jour. */
  order: number
  sets: number
  /** Fourchette de reps. Sans double progression, repsMin = repsMax : un nombre fixe. */
  repsMin: number
  repsMax: number
  /** Proposer + un pas de charge quand toutes les séries atteignent repsMax (vrai par défaut). */
  doubleProgression: boolean
  /** Repos après chaque série de cet exercice, en secondes. */
  restSeconds: number
}

/** Valeurs d'un exercice ajouté à un jour (modifiables ensuite dans son panneau). */
export const DEFAULT_PROGRAM_EXERCISE = { sets: 3, repsMin: 8, repsMax: 12, doubleProgression: true }

/**
 * Séance du jour : le jour qui suit, dans l'ordre du programme, le dernier jour fait (A → B → A…).
 * Aucun jour encore fait : le premier.
 */
export function nextDay(days: ProgramDay[], sessions: Session[]): ProgramDay | undefined {
  const ordered = [...days].sort((a, b) => a.order - b.order)
  if (ordered.length === 0) return undefined
  const ids = new Set(ordered.map((d) => d.id))
  const last = sessions
    .filter((s) => s.programDayId && ids.has(s.programDayId))
    .sort((a, b) => b.startedAt - a.startedAt)[0]
  if (!last) return ordered[0]
  const index = ordered.findIndex((d) => d.id === last.programDayId)
  return ordered[(index + 1) % ordered.length]
}

/**
 * La prochaine fois, la charge de cet exercice augmente-t-elle d'un pas ? Oui si la double
 * progression est activée et que toutes les séries de la dernière fois (même variante) ont atteint
 * le haut de la fourchette du programme. Sert au pré-remplissage et au badge ↑ de l'accueil.
 */
export function increaseSuggested(pe: ProgramExercise, history: SessionSet[]): boolean {
  const last = lastPerformance(history, pe.exerciseId, pe.variant)
  return pe.doubleProgression && last !== null && last.sets.length > 0 && last.sets.every((s) => s.reps >= pe.repsMax)
}

/** Une série à créer au démarrage d'une séance de programme. */
export type PlannedSet = Pick<
  SessionSet,
  'exerciseId' | 'variant' | 'exerciseOrder' | 'order' | 'weight' | 'reps' | 'targetRepsMin' | 'targetRepsMax' | 'restSeconds' | 'progression'
>

/**
 * Toutes les séries d'un jour, pré-remplies (parcours.md § 2) :
 * - nombre de séries, objectif et repos : ceux du programme ;
 * - charge : celle de la dernière fois (même exercice, même variante), + un pas si la double
 *   progression est activée et que toutes les séries ont atteint le haut de la fourchette ;
 * - reps : celles de la dernière fois (le score à battre), ou le bas de la fourchette quand la
 *   charge augmente ; sans double progression, le nombre fixe du programme.
 */
export function planDaySets(
  exercises: ProgramExercise[],
  history: SessionSet[],
  steps: WeightSteps = WEIGHT_STEPS,
): PlannedSet[] {
  return [...exercises]
    .sort((a, b) => a.order - b.order)
    .flatMap((pe, index) => {
      const last = lastPerformance(history, pe.exerciseId, pe.variant)
      const increase = increaseSuggested(pe, history)
      const step = increase ? weightStep(pe.variant, steps) : 0
      const min = minWeight(pe.variant)
      return Array.from({ length: pe.sets }, (_, i) => {
        const previous = last?.sets[i] ?? last?.sets.at(-1)
        return {
          exerciseId: pe.exerciseId,
          variant: pe.variant,
          exerciseOrder: index + 1,
          order: i + 1,
          weight: Math.max(min, (previous?.weight ?? min) + step),
          reps: !pe.doubleProgression || increase || !previous ? pe.repsMin : previous.reps,
          targetRepsMin: pe.repsMin,
          targetRepsMax: pe.repsMax,
          restSeconds: pe.restSeconds,
          progression: pe.doubleProgression,
        }
      })
    })
}
