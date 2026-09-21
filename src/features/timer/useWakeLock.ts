// Garde l'écran allumé pendant le repos (Screen Wake Lock, iOS 18.4+ en app installée).
// iOS relâche le verrou quand l'app passe en arrière-plan : on le redemande au retour.
import { useEffect } from 'react'

export function useWakeLock(active: boolean) {
  useEffect(() => {
    if (!active || !('wakeLock' in navigator)) return
    let sentinel: WakeLockSentinel | null = null
    let stopped = false

    const request = async () => {
      if (document.visibilityState !== 'visible') return
      try {
        const lock = await navigator.wakeLock.request('screen')
        if (stopped) void lock.release()
        else sentinel = lock
      } catch {
        // Refusé (batterie faible…) : le repos marche quand même, l'écran peut s'éteindre.
      }
    }
    const onVisibility = () => void request()

    void request()
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      stopped = true
      document.removeEventListener('visibilitychange', onVisibility)
      void sentinel?.release()
    }
  }, [active])
}
