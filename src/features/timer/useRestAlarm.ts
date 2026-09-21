// Surveille le repos de la séance en cours, où que l'on soit dans l'app (monté dans App.tsx) :
// son et vibration à la fin, écran gardé allumé pendant le repos.
import { useEffect, useState } from 'react'
import { shouldRing, type Rest } from '../../lib/rest.ts'
import { playRestEnd, unlockAudio, vibrateRestEnd } from './sound.ts'
import { useWakeLock } from './useWakeLock.ts'

/** L'écran reste allumé jusqu'à 2 min après la fin du repos, pas indéfiniment si on oublie « C'est parti ». */
const AWAKE_AFTER_END = 2 * 60 * 1000

export function useRestAlarm(rest: Rest | undefined, sound: boolean) {
  const endsAt = rest?.endsAt
  // Fin de repos (endsAt) dont le délai « écran allumé » est écoulé
  const [asleepFor, setAsleepFor] = useState<number | null>(null)

  useEffect(() => {
    if (endsAt === undefined) return
    const delay = endsAt - Date.now()
    if (delay < 0) return // déjà terminé (app rouverte après la fin) : pas de son surprise
    // Si l'iPhone met l'app en pause, ce minuteur se déclenche en retard au réveil :
    // shouldRing le vérifie et ne sonne que si la fin est vue « en direct ».
    const timer = window.setTimeout(() => {
      if (!shouldRing({ endsAt, duration: 0 })) return
      if (sound) playRestEnd()
      vibrateRestEnd()
    }, delay)
    return () => window.clearTimeout(timer)
  }, [endsAt, sound])

  useEffect(() => {
    if (endsAt === undefined) return
    const timer = window.setTimeout(() => setAsleepFor(endsAt), Math.max(0, endsAt + AWAKE_AFTER_END - Date.now()))
    return () => window.clearTimeout(timer)
  }, [endsAt])

  // L'écran reste allumé pendant le repos et sur l'écran de fin, 2 min au plus après la fin
  useWakeLock(endsAt !== undefined && asleepFor !== endsAt)

  // Le son doit être déverrouillé par un geste. « Valider la série » le fait, mais après un
  // rechargement de l'app en plein repos (mise à jour, iOS qui relance l'app), il faut un
  // nouveau geste : n'importe quel appui sur l'écran suffit.
  useEffect(() => {
    document.addEventListener('pointerdown', unlockAudio)
    return () => document.removeEventListener('pointerdown', unlockAudio)
  }, [])
}
