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
