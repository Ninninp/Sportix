// Réglage « Apparence » (J9) : Auto / Clair / Sombre.
//
// Le thème est posé sur <html> (`data-theme`), que lisent les couleurs de src/index.css.
// Les réglages sont en base (Dexie), donc lus après un court délai : sans rien d'autre, l'app
// s'afficherait un instant dans le mauvais thème à chaque ouverture. On garde donc aussi une copie
// du choix dans le stockage local du navigateur, lue tout de suite au démarrage (main.tsx).
// La base reste la référence : c'est elle que l'export / import transporte.
import type { Theme } from '../../lib/settings.ts'

const STORAGE_KEY = 'sportix-theme'

/** Couleur de la barre du navigateur (meta theme-color) pour chaque thème : le fond de l'app. */
const THEME_COLORS = { clair: '#FFF4E8', sombre: '#0E0F0C' }

export function applyTheme(theme: Theme) {
  const root = document.documentElement
  if (theme === 'auto') delete root.dataset.theme
  else root.dataset.theme = theme

  // index.html a deux balises theme-color, une par réglage de l'iPhone. Thème imposé : toutes deux
  // prennent sa couleur ; Auto : chacune reprend celle de son réglage.
  document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]').forEach((meta) => {
    const dark = meta.media.includes('dark')
    meta.content = THEME_COLORS[theme === 'auto' ? (dark ? 'sombre' : 'clair') : theme]
  })

  try {
    localStorage.setItem(STORAGE_KEY, theme)
  } catch {
    // Stockage local indisponible (navigation privée) : le thème s'appliquera après la lecture de la base.
  }
}

/** Au démarrage, avant le premier affichage : le dernier thème choisi sur ce téléphone. */
export function applyStoredTheme() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'clair' || stored === 'sombre') applyTheme(stored)
  } catch {
    // Rien de stocké ou stockage indisponible : Auto.
  }
}
