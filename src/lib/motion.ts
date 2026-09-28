// Calculs des animations (J10), sans affichage : le hook `useCountUp` s'en sert à chaque image.

/** Durée d'un compteur qui défile (les chiffres de la semaine sur l'accueil, le récap). */
export const COUNT_UP_MS = 700

/**
 * Courbe « ease-out » : rapide au départ, qui se pose en douceur à l'arrivée (comme `--ease-out`
 * des tokens). `t` va de 0 (début) à 1 (fin).
 */
export function easeOut(t: number): number {
  const clamped = Math.min(1, Math.max(0, t))
  return 1 - Math.pow(1 - clamped, 4)
}

/**
 * Valeur affichée par un compteur à l'instant `elapsed` (ms depuis son départ) : de 0 à `target`,
 * exactement `target` une fois la durée écoulée (jamais d'arrondi qui laisserait 9 999 au lieu de 10 000).
 */
export function countUpValue(target: number, elapsed: number, duration = COUNT_UP_MS): number {
  if (elapsed >= duration) return target
  return target * easeOut(elapsed / duration)
}

/** Décalage d'entrée du n-ième élément d'une liste qui apparaît en cascade (0, 60, 120… ms, plafonné). */
export function staggerDelay(index: number, step = 60, max = 360): number {
  return Math.min(max, Math.max(0, index) * step)
}
