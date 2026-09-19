// Dit si Sportix tourne comme une app installée (ouverte depuis l'écran d'accueil)
// plutôt que dans un onglet de Safari. Sert à masquer l'encart « Installer Sportix ».
// - Norme web : la media query (display-mode: standalone).
// - Safari iOS : l'ancienne propriété navigator.standalone (absente des types standard,
//   d'où le `navigator` typé de façon large et la vérification `in`).
// La fenêtre est passée en paramètre pour pouvoir tester la fonction sans navigateur.

type WindowLike = {
  matchMedia?: (query: string) => { matches: boolean }
  navigator?: object
}

export function isStandalone(win: WindowLike): boolean {
  const nav = win.navigator
  if (nav && 'standalone' in nav && nav.standalone === true) return true
  return win.matchMedia?.('(display-mode: standalone)').matches ?? false
}
