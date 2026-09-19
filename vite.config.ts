import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
// Numéro de version affiché dans Réglages : identifiant court du commit (fourni par GitHub Actions)
// + date du build. En local, « dev ».
const commit = process.env.GITHUB_SHA?.slice(0, 7) ?? 'dev'
const buildDate = new Date().toLocaleDateString('fr-FR', { timeZone: 'Europe/Paris' })

export default defineConfig({
  // GitHub Pages sert l'app dans un sous-dossier : https://ninninp.github.io/Sportix/
  base: '/Sportix/',
  define: {
    __APP_VERSION__: JSON.stringify(`${commit} · ${buildDate}`),
  },
  plugins: [
    react(),
    tailwindcss(),
    // Transforme le site en PWA : manifest (nom, icônes, plein écran) + service worker,
    // qui garde tous les fichiers de l'app en cache pour qu'elle s'ouvre hors connexion.
    VitePWA({
      // Une nouvelle version déployée est installée toute seule au lancement suivant.
      registerType: 'autoUpdate',
      // L'enregistrement est fait par src/pwa.ts (seulement avec du réseau, voir ce fichier).
      injectRegister: false,
      // Icônes générées depuis public/icon.svg (voir pwa-assets.config.ts).
      pwaAssets: { config: true, overrideManifestIcons: true, injectThemeColor: false },
      manifest: {
        name: 'Sportix',
        short_name: 'Sportix',
        description: "Carnet d'entraînement en salle, hors connexion",
        lang: 'fr',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#0E0F0C',
        theme_color: '#0E0F0C',
      },
      workbox: {
        // Toute adresse de l'app (ex. /Sportix/reglages) s'ouvre hors ligne avec index.html.
        navigateFallback: 'index.html',
        // Fichiers mis en cache. Pas de « webmanifest » ici : le plugin l'ajoute déjà lui-même,
        // et un doublon fait échouer toute la mise en cache (plus de hors-ligne).
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
      },
    }),
  ],
})
