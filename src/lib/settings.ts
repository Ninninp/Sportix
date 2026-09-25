// Réglages de l'app (onglet Réglages, J4) : valeurs par défaut et règles de saisie.
// Enregistrés en base (table `settings`, voir src/db/settings.ts) ; ce fichier ne fait que calculer.
import { BODY_WEIGHT_MAX, BODY_WEIGHT_MIN } from './bodyWeight.ts'
import { WEIGHT_STEPS, type WeightSteps } from './progression.ts'

export type Settings = {
  /** Repos par défaut entre deux séries, en secondes (au J5, un programme pourra le fixer par exercice). */
  restSeconds: number
  /** Son joué à la fin du repos. */
  restSound: boolean
  /** Pas de charge des boutons − / + pour chaque variante. */
  weightSteps: WeightSteps
  /** Programme actif (J5) : c'est sa prochaine séance que l'accueil propose. */
  activeProgramId?: string
  /** Objectifs des Stats (J7) : ils ne servent qu'à tracer une ligne en pointillés sur un graphique. */
  goalBodyWeight?: number
  goalWeeklySessions?: number
  /** Date du dernier export réussi (J8), pour « Dernière sauvegarde » et la pastille de rappel. */
  lastBackupAt?: number
}

export const DEFAULT_SETTINGS: Settings = {
  restSeconds: 120, // 2:00, valeur des maquettes D5
  restSound: true,
  weightSteps: WEIGHT_STEPS,
}

/** Bornes et pas du réglage « Repos par défaut » : de 0:15 à 10:00, de 15 s en 15 s. */
export const REST_MIN = 15
export const REST_MAX = 600
export const REST_STEP = 15

/** Pas de charge proposés dans Réglages (disques courants), en kg. */
export const WEIGHT_STEP_CHOICES = [0.5, 1, 1.25, 2, 2.5, 5] as const

/**
 * Réglages complets à partir de ce qui est enregistré : un réglage jamais modifié (ou ajouté par
 * une version plus récente de l'app) prend sa valeur par défaut.
 */
export function withDefaults(stored?: Partial<Settings>): Settings {
  return {
    ...DEFAULT_SETTINGS,
    ...stored,
    weightSteps: { ...DEFAULT_SETTINGS.weightSteps, ...stored?.weightSteps },
  }
}

/** Repos après un appui sur − / + dans Réglages : 15 s de plus ou de moins, dans les bornes. */
export function stepRest(seconds: number, direction: 1 | -1): number {
  return Math.min(REST_MAX, Math.max(REST_MIN, seconds + direction * REST_STEP))
}

/** Bornes de l'objectif « séances par semaine » (comme le réglage « Par semaine » d'un bloc). */
export const GOAL_SESSIONS_MIN = 1
export const GOAL_SESSIONS_MAX = 14
/** Pas de l'objectif de poids : un demi-kilo. */
export const GOAL_WEIGHT_STEP = 0.5

/** Objectif de séances par semaine après − / + : sous 1, plus d'objectif (undefined). */
export function stepGoalSessions(current: number | undefined, direction: 1 | -1): number | undefined {
  if (current === undefined) return direction === 1 ? GOAL_SESSIONS_MIN : undefined
  const next = current + direction
  return next < GOAL_SESSIONS_MIN ? undefined : Math.min(GOAL_SESSIONS_MAX, next)
}

/**
 * Objectif de poids après − / + : le premier appui part de `start` (le poids actuel), arrondi au
 * demi-kilo dans le sens du bouton (78,3 kg : « − » donne 78, « + » donne 78,5).
 */
export function stepGoalWeight(current: number | undefined, direction: 1 | -1, start: number): number {
  const next =
    current === undefined
      ? (direction === 1 ? Math.ceil(start / GOAL_WEIGHT_STEP) : Math.floor(start / GOAL_WEIGHT_STEP)) * GOAL_WEIGHT_STEP
      : current + direction * GOAL_WEIGHT_STEP
  return Math.min(BODY_WEIGHT_MAX, Math.max(BODY_WEIGHT_MIN, next))
}
