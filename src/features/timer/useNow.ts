// Heure courante, rafraîchie régulièrement tant que `active` : les écrans de repos recalculent
// le temps restant à partir de l'horodatage de fin (jamais de décompte à la main).
import { useEffect, useState } from 'react'

export function useNow(active: boolean, intervalMs = 250): number {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!active) return
    const tick = () => setNow(Date.now())
    tick()
    const timer = window.setInterval(tick, intervalMs)
    // Au retour de veille, mise à jour immédiate plutôt qu'au prochain tic
    document.addEventListener('visibilitychange', tick)
    return () => {
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', tick)
    }
  }, [active, intervalMs])
  return now
}
