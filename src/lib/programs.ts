// Programmes (J5) : types et règles pures (sans base de données ni affichage).
// Un programme = des jours dans un ordre (ex. « Force A — Jambes », « Force B — Haut du corps ») ;
// chaque jour = des exercices avec variante, séries, reps, repos et double progression.
import type { Variant } from './exercises.ts'
import { lastPerformance, minWeight, WEIGHT_STEPS, weightStep, type WeightSteps } from './progression.ts'
import type { Session, SessionSet } from './sessions.ts'
import { dayStart } from './week.ts'

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
  /**
   * Superset avec l'exercice suivant du jour (J9) : on enchaîne sans repos, le repos du tour est
   * celui du dernier exercice relié. Champ facultatif, non indexé : pas de nouvelle version du schéma.
   */
  supersetNext?: boolean
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
 * Quand ce jour a été fait pour la dernière fois, en quelques lettres à côté de son nom
 * (maquette J5) : « aujourd’hui », « hier », le jour de la semaine sur les 6 derniers jours
 * (« jeudi »), sinon la date (« 12 sept. »). null s'il n'a jamais été fait.
 */
export function lastDoneLabel(dayId: string, sessions: Session[], now = Date.now()): string | null {
  const last = Math.max(...sessions.filter((s) => s.programDayId === dayId).map((s) => s.startedAt))
  if (!Number.isFinite(last)) return null
  // Écart en jours de calendrier (arrondi : juste aux changements d'heure)
  const days = Math.round((dayStart(now) - dayStart(last)) / 86_400_000)
  if (days <= 0) return 'aujourd’hui'
  if (days === 1) return 'hier'
  const date = new Date(last)
  if (days < 7) return date.toLocaleDateString('fr-FR', { weekday: 'long' })
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

/**
 * La prochaine fois, la charge de cet exercice augmente-t-elle d'un pas ? Oui si la double
 * progression est activée et que toutes les séries de la dernière fois (même variante) ont atteint
 * le haut de la fourchette du programme. Sert au pré-remplissage et au badge ↑ de l'accueil.
 */
export function increaseSuggested(pe: ProgramExercise, history: SessionSet[], deload = false): boolean {
  if (deload) return false // semaine de deload : jamais de hausse (parcours.md § 2.1)
  const last = lastPerformance(history, pe.exerciseId, pe.variant)
  return pe.doubleProgression && last !== null && last.sets.length > 0 && last.sets.every((s) => s.reps >= pe.repsMax)
}

/**
 * Exercices d'un jour (déjà triés) rangés par superset, comme `supersetGroups` en séance : un
 * exercice seul, ou plusieurs qui se suivent et sont reliés. Le lien du dernier est ignoré.
 */
export function programSupersetGroups(exercises: ProgramExercise[]): ProgramExercise[][] {
  const groups: ProgramExercise[][] = []
  exercises.forEach((pe, i) => {
    if (exercises[i - 1]?.supersetNext && groups.length > 0) groups[groups.length - 1].push(pe)
    else groups.push([pe])
  })
  return groups
}

/** Une série à créer au démarrage d'une séance de programme. */
export type PlannedSet = Pick<
  SessionSet,
  | 'exerciseId'
  | 'variant'
  | 'exerciseOrder'
  | 'order'
  | 'weight'
  | 'reps'
  | 'targetRepsMin'
  | 'targetRepsMax'
  | 'restSeconds'
  | 'progression'
  | 'deload'
  | 'supersetNext'
>

/**
 * Toutes les séries d'un jour, pré-remplies (parcours.md § 2) :
 * - nombre de séries, objectif et repos : ceux du programme ;
 * - charge : celle de la dernière fois (même exercice, même variante), + un pas si la double
 *   progression est activée et que toutes les séries ont atteint le haut de la fourchette ;
 * - reps : celles de la dernière fois (le score à battre), ou le bas de la fourchette quand la
 *   charge augmente ; sans double progression, le nombre fixe du programme ;
 * - première fois sur l'exercice : 0 rep, comme en séance libre. Les séries suivantes, encore
 *   vides, reprennent alors ce qui est saisi sur la première (validateSetAndRest).
 */
export function planDaySets(
  exercises: ProgramExercise[],
  history: SessionSet[],
  steps: WeightSteps = WEIGHT_STEPS,
  /** Séance de deload : charges de la dernière séance normale, sans hausse. */
  deload = false,
): PlannedSet[] {
  return [...exercises]
    .sort((a, b) => a.order - b.order)
    .flatMap((pe, index, ordered) => {
      const last = lastPerformance(history, pe.exerciseId, pe.variant)
      // Le dernier exercice du jour n'a pas de suivant : son lien éventuel est ignoré
      const superset = pe.supersetNext === true && index < ordered.length - 1
      const increase = increaseSuggested(pe, history, deload)
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
          reps: !previous ? 0 : !pe.doubleProgression || increase ? pe.repsMin : previous.reps,
          targetRepsMin: pe.repsMin,
          targetRepsMax: pe.repsMax,
          restSeconds: pe.restSeconds,
          progression: pe.doubleProgression,
          ...(deload ? { deload: true } : {}),
          ...(superset ? { supersetNext: true } : {}),
        }
      })
    })
}
