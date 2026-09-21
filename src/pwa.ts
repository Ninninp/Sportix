// Enregistrement du service worker (le « gardien » qui met l'app en cache pour le hors-ligne)
// et mise à jour automatique de l'app.
//
// 1. Mode avion : à chaque vérification, le navigateur va chercher sw.js sur Internet. En mode avion,
//    iOS intercepte cette requête et affiche « Désactivez le mode Avion ou utilisez le Wi-Fi… ».
//    On n'enregistre donc le service worker que si le téléphone a du réseau. Limite connue (mesurée
//    le 21/09/2026) : le navigateur lui-même revérifie sw.js à CHAQUE ouverture de l'app, même sans
//    JavaScript (c'est la norme des service workers) ; le message reste donc possible en mode avion.
//    Il n'apparaît pas avec les données mobiles activées, même sans réseau, et l'app marche quand même.
// 2. Mises à jour : sur iPhone, une app installée est rarement relancée, iOS la « reprend » là où
//    elle était, sans rechargement, donc sans vérification. On vérifie donc aussi à chaque retour
//    au premier plan. Si une nouvelle version existe, elle s'installe et la page se recharge
//    toute seule (registerType « autoUpdate » dans vite.config.ts).
import { registerSW } from 'virtual:pwa-register'

function checkForUpdateWhenVisible(registration: ServiceWorkerRegistration) {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && navigator.onLine) {
      registration.update().catch(() => {
        // Réseau instable : on réessaiera au prochain retour dans l'app.
      })
    }
  })
}

export function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return
  const register = () =>
    registerSW({
      immediate: true,
      onRegisteredSW(_swUrl, registration) {
        if (registration) checkForUpdateWhenVisible(registration)
      },
    })
  if (navigator.onLine) register()
  else window.addEventListener('online', register, { once: true })
}
