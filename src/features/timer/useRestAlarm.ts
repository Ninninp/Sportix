// Surveille le repos de la séance en cours, où que l'on soit dans l'app (monté dans App.tsx) :
// son et vibration à la fin, écran gardé allumé pendant le repos.
import { useEffect } from 'react'
import { shouldRing, type Rest } from '../../lib/rest.ts'
import { playRestEnd, vibrateRestEnd } from './sound.ts'
import { useWakeLock } from './useWakeLock.ts'

export function useRestAlarm(rest: Rest | undefined, sound: boolean) {
  const endsAt = rest?.endsAt

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

  // L'écran reste allumé pendant le repos ET sur l'écran de fin, jusqu'à « C'est parti »
  useWakeLock(rest !== undefined)
}
