// Génération des icônes de l'app à partir de public/icon.svg (lu par vite-plugin-pwa au build).
// Le preset « minimal-2023 » produit : favicon, icônes 64/192/512, icône « maskable » (Android)
// et apple-touch-icon 180 px (écran d'accueil de l'iPhone). On retire les marges et le fond blanc
// par défaut : notre icône a déjà son fond encre, et iOS arrondit lui-même les coins.
import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config'

const encre = '#1A1030'

export default defineConfig({
  headLinkOptions: { preset: '2023' },
  preset: {
    ...minimal2023Preset,
    transparent: { ...minimal2023Preset.transparent, padding: 0 },
    maskable: { ...minimal2023Preset.maskable, padding: 0, resizeOptions: { background: encre } },
    apple: { ...minimal2023Preset.apple, padding: 0, resizeOptions: { background: encre } },
  },
  images: ['public/icon.svg'],
})
