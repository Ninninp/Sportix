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

/**
 * Comment la page arrive quand l'adresse change (J10) :
 * - `seance` : on entre dans la séance depuis ailleurs (elle monte du bas) ;
 * - `fondu` : changement d'onglet (la première partie de l'adresse change) ;
 * - `droite` : on descend d'un niveau (détail d'un programme, stats d'un exercice…) ;
 * - `gauche` : on remonte (flèche retour, qui est un lien vers la page parente) ;
 * - null : rien (même page, premier affichage, ou sortie de séance, déjà animée par « Réduire »).
 */
export type PageAnimation = 'seance' | 'fondu' | 'droite' | 'gauche'

export function pageAnimation(from: string | null, to: string): PageAnimation | null {
  if (from === null || from === to) return null
  const parts = (path: string) => path.split('/').filter(Boolean)
  const a = parts(from)
  const b = parts(to)
  const inSession = (p: string[]) => p[0] === 'seance'
  if (inSession(b) && !inSession(a)) return 'seance'
  if (inSession(a) && !inSession(b)) return null
  if (a[0] !== b[0]) return 'fondu'
  if (b.length > a.length) return 'droite'
  if (b.length < a.length) return 'gauche'
  return 'fondu'
}

/**
 * Moment (ms) où une courbe qui se trace en `duration` ms avec la courbe `easeOut` atteint la
 * fraction `fraction` (0 à 1) de sa longueur : un point y apparaît quand le trait passe dessus.
 */
export function traceDelay(fraction: number, duration: number): number {
  const f = Math.min(1, Math.max(0, fraction))
  return duration * (1 - Math.pow(1 - f, 1 / 4))
}
