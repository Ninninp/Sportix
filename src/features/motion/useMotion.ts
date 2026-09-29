// Hooks des animations (J10).
import { useEffect, useRef, useState } from 'react'
import { COUNT_UP_MS, countUpValue } from '../../lib/motion.ts'

/** Réglage iOS « Réduire les animations » (Réglages → Accessibilité → Mouvement). */
export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true
}

/**
 * Chiffre qui défile de 0 à `target` à l'arrivée sur l'écran (les chiffres de la semaine, le
 * récap), pour que la page ne paraisse pas figée. Une seule fois : si la valeur change ensuite
 * (une séance terminée), elle s'affiche directement. Avec « Réduire les animations » : la valeur
 * finale tout de suite.
 */
export function useCountUp(target: number, duration = COUNT_UP_MS): number {
  const [shown, setShown] = useState(() => (prefersReducedMotion() ? target : 0))
  const [done, setDone] = useState(() => prefersReducedMotion())
  // Instant du départ, fixé une fois : si la cible change en cours de route, on la vise sans repartir de 0
  const start = useRef<number | null>(null)

  useEffect(() => {
    if (done) return
    let frame = 0
    const tick = (now: number) => {
      start.current ??= now
      const elapsed = now - start.current
      setShown(countUpValue(target, elapsed, duration))
      if (elapsed < duration) frame = requestAnimationFrame(tick)
      else setDone(true)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [done, target, duration])

  return done ? target : shown
}

/** Durée de sortie d'un panneau ou d'une page qui s'en va (duration-base de tokens.md), en ms. */
export const EXIT_MS = 200

/**
 * Garde affiché ce qui vient de disparaître, le temps de son animation de sortie (J10).
 * Un panneau construit avec `{ouvert && <Panneau />}` est retiré de la page à la seconde même où
 * `ouvert` devient faux : il n'a aucune chance de redescendre. Avec `usePresence`, `item` garde la
 * dernière valeur non vide jusqu'à la fin de la sortie, et `open` dit si le panneau doit être ouvert :
 *   const p = usePresence(exporting)
 *   {p.item && <ExportSheet key={p.key} open={p.open} … />}
 * `key` change à chaque ouverture : un panneau rouvert pendant qu'il redescend repart de zéro
 * (verrou anti double appui, identifiant tiré à l'ouverture), au lieu de reprendre l'ancien.
 * Avec « Réduire les animations » la sortie est immédiate.
 */
export function usePresence<T>(value: T | null | undefined | false): { item: T | undefined; open: boolean; key: number } {
  const [kept, setKept] = useState<T | undefined>(value || undefined)
  const [wasOpen, setWasOpen] = useState(Boolean(value))
  const [key, setKey] = useState(0)
  // Pendant un rendu, comme la doc de React le prévoit pour « retenir une valeur d'un rendu à l'autre »
  if (value && kept !== value) setKept(value)
  if (Boolean(value) !== wasOpen) {
    setWasOpen(Boolean(value))
    if (value) setKey((k) => k + 1)
  }
  useEffect(() => {
    if (value) return
    const timer = window.setTimeout(() => setKept(undefined), prefersReducedMotion() ? 0 : EXIT_MS + 60)
    return () => window.clearTimeout(timer)
  }, [value])
  return { item: value || kept, open: Boolean(value), key }
}
