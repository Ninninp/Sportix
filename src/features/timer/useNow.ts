// Heure courante pour un chrono affiché à la seconde. Le composant se remet à jour EXACTEMENT
// quand la seconde affichée change (calée sur `anchor` : début de séance ou fin du repos),
// et pas toutes les x ms : sinon certaines secondes restent affichées plus longtemps que
// d'autres, voire sautent (retour du test sur iPhone, 21/09/2026).
// Rien ne se décompte ici : le temps affiché se recalcule toujours depuis l'horodatage enregistré.
import { useEffect, useState } from 'react'
import { msUntilNextSecond } from '../../lib/rest.ts'

/** `anchor` undefined : pas de chrono, pas de rafraîchissement. */
export function useNow(anchor: number | undefined): number {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (anchor === undefined) return
    let timer: number | undefined
    const tick = () => {
      window.clearTimeout(timer)
      const t = Date.now()
      setNow(t)
      timer = window.setTimeout(tick, msUntilNextSecond(t, anchor))
    }
    tick()
    // Au retour de veille (écran verrouillé), mise à jour immédiate
    document.addEventListener('visibilitychange', tick)
    return () => {
      window.clearTimeout(timer)
      document.removeEventListener('visibilitychange', tick)
    }
  }, [anchor])
  return now
}
