// Double progression et pré-remplissage des séries (règles de docs/design/parcours.md § 2).
//
// Principe : le programme (ou la dernière séance) fixe un nombre de séries et une fourchette de reps.
// On garde la même charge tant que TOUTES les séries n'ont pas atteint le haut de la fourchette.
// Quand c'est le cas, la fois suivante l'app propose la charge + un pas, et l'objectif de reps
// repart du bas de la fourchette.
import type { Variant } from './exercises.ts'
import type { SessionSet } from './sessions.ts'

/** Pas de charge (boutons − / +) pour chaque variante, en kg. « aucune » : exercice sans variante. */
export type WeightSteps = Record<Variant | 'aucune', number>

/** Pas de charge par variante, en kg (valeurs par défaut de parcours.md § 5, modifiables dans Réglages). */
export const WEIGHT_STEPS: WeightSteps = {
  barre: 2.5,
  smith: 2.5,
  halteres: 2,
  machine: 5,
  poulie: 2.5,
  aucune: 2.5,
}

export function weightStep(variant: Variant | null, steps: WeightSteps = WEIGHT_STEPS): number {
  return steps[variant ?? 'aucune']
}

/**
 * Charge minimale, en kg : à la barre libre, la barre olympique pèse déjà 20 kg à vide
 * (la charge saisie est le total, barre comprise). Pas de minimum pour les autres variantes :
 * la barre du Smith est souvent contrebalancée, et une machine ou une poulie part de 0.
 */
export function minWeight(variant: Variant | null): number {
  return variant === 'barre' ? 20 : 0
}

/** Charge après un appui sur − (-1) ou + (+1) : un pas de la variante, jamais sous le minimum. */
export function stepWeight(
  weight: number,
  variant: Variant | null,
  direction: 1 | -1,
  steps: WeightSteps = WEIGHT_STEPS,
): number {
  return Math.max(minWeight(variant), weight + direction * weightStep(variant, steps))
}

/** Ce qu'on sait de la dernière fois, pour un exercice et une variante donnés. */
export type LastPerformance = {
  sessionId: string
  sets: SessionSet[]
}

/**
 * Retrouve la dernière séance où cet exercice (et cette variante) a été travaillé.
 * Les séances de deload sont sautées (parcours.md § 2.1 et § 3.6) : elles ne déclenchent pas de
 * hausse de charge, et après un deload on reprend les charges d'avant, pas les charges allégées.
 */
export function lastPerformance(
  history: SessionSet[],
  exerciseId: string,
  variant: Variant | null,
): LastPerformance | null {
  const done = history.filter((s) => s.exerciseId === exerciseId && s.variant === variant && s.done && !s.deload)
  if (done.length === 0) return null
  // La série faite le plus récemment désigne la séance à reprendre.
  const latest = done.reduce((a, b) => ((b.doneAt ?? 0) > (a.doneAt ?? 0) ? b : a))
  return {
    sessionId: latest.sessionId,
    sets: done.filter((s) => s.sessionId === latest.sessionId).sort((a, b) => a.order - b.order),
  }
}

/** Toutes les séries de la dernière fois ont-elles atteint le haut de la fourchette ? */
export function suggestsWeightIncrease(last: LastPerformance | null): boolean {
  if (!last || last.sets.length === 0) return false
  return last.sets.every((s) => s.targetRepsMax !== undefined && s.reps >= s.targetRepsMax)
}

export type PrefilledSet = {
  weight: number
  reps: number
  targetRepsMin?: number
  targetRepsMax?: number
}

/**
 * Séries proposées quand on ajoute un exercice à la séance (parcours.md § 2.2) :
 * - nombre de séries et objectif : ceux de la dernière fois, sinon 1 série sans objectif
 * - charge : celle de la dernière fois, + un pas si la double progression le propose
 * - reps : les reps faites la dernière fois sur CETTE série (le score à battre),
 *   ou le bas de la fourchette quand la charge augmente.
 */
export function prefillSets(
  last: LastPerformance | null,
  variant: Variant | null,
  steps: WeightSteps = WEIGHT_STEPS,
  /** Séance de deload : jamais de hausse de charge (les charges se baissent à la main). */
  deload = false,
): PrefilledSet[] {
  const min = minWeight(variant)
  if (!last || last.sets.length === 0) return [{ weight: min, reps: 0 }]

  const increase = !deload && suggestsWeightIncrease(last)
  const step = increase ? weightStep(variant, steps) : 0

  return last.sets.map((s) => ({
    weight: Math.max(min, s.weight + step),
    reps: increase ? (s.targetRepsMin ?? s.reps) : s.reps,
    targetRepsMin: s.targetRepsMin,
    targetRepsMax: s.targetRepsMax,
  }))
}

/** Texte du badge « ↑ charge » affiché pendant la saisie, ou null s'il n'y a rien à proposer. */
export function increaseBadge(
  last: LastPerformance | null,
  variant: Variant | null,
  steps: WeightSteps = WEIGHT_STEPS,
): string | null {
  if (!suggestsWeightIncrease(last)) return null
  const step = weightStep(variant, steps)
  return `charge +${new Intl.NumberFormat('fr-FR').format(step)} kg`
}

/**
 * Charge tapée au clavier (« 62,5 », « 62.5 », « 60 kg »). Arrondie au quart de kg (plus petit
 * disque courant : 0,25 kg), jamais sous le minimum de la variante. null si ce n'est pas un nombre :
 * on garde alors l'ancienne valeur.
 */
export function parseWeight(text: string, variant: Variant | null): number | null {
  const n = Number.parseFloat(text.replace(',', '.').replace(/[^\d.]/g, ''))
  if (!Number.isFinite(n) || n > 999) return null
  return Math.max(minWeight(variant), Math.round(n * 4) / 4)
}

/** Reps tapées au clavier : un entier de 0 à 999, sinon null (on garde l'ancienne valeur). */
export function parseReps(text: string): number | null {
  const n = Number.parseInt(text.replace(/\D/g, ''), 10)
  return Number.isFinite(n) && n <= 999 ? n : null
}
