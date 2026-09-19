// Enregistrement du service worker (le « gardien » qui met l'app en cache pour le hors-ligne).
//
// À chaque enregistrement, le navigateur va chercher sw.js sur Internet pour voir s'il existe une
// nouvelle version. En mode avion, iOS intercepte cette requête et affiche « Désactivez le mode Avion
// ou utilisez le Wi-Fi… ». On n'enregistre donc que si le téléphone a du réseau, sinon on attend
// qu'il revienne. Hors ligne, le service worker déjà installé continue de servir l'app normalement.
import { registerSW } from 'virtual:pwa-register'

export function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return
  const register = () => registerSW({ immediate: true })
  if (navigator.onLine) register()
  else window.addEventListener('online', register, { once: true })
}
