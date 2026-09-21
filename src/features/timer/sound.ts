// Son de fin de repos, fabriqué par le navigateur (Web Audio) : pas de fichier à télécharger.
//
// iPhone : Safari n'accepte de jouer un son qu'après un geste de l'utilisateur. On « déverrouille »
// donc le son à l'appui sur « Valider la série » (unlockAudio), et c'est ce même canal qui sonnera
// à la fin du repos. Limites d'iOS, sans solution côté web :
// - pas de son si l'écran est verrouillé ou l'app en arrière-plan (d'où l'écran gardé allumé) ;
// - le son suit le bouton silencieux de l'iPhone ; il se mêle à la musique sans la couper.
let context: AudioContext | null = null

export function unlockAudio() {
  try {
    context ??= new AudioContext()
    if (context.state !== 'running') void context.resume()
    // Un son vide joué pendant le geste finit de déverrouiller le canal sur iOS
    const source = context.createBufferSource()
    source.buffer = context.createBuffer(1, 1, 22050)
    source.connect(context.destination)
    source.start(0)
  } catch {
    // Pas de Web Audio : l'écran de fin de repos reste le signal principal.
  }
}

/** Trois bips montants, bien audibles dans une salle bruyante (≈ 0,7 s). */
export function playRestEnd() {
  if (!context) return
  if (context.state !== 'running') void context.resume()
  const start = context.currentTime + 0.05
  ;[880, 880, 1320].forEach((frequency, i) => {
    const osc = context!.createOscillator()
    const gain = context!.createGain()
    const t = start + i * 0.25
    osc.type = 'square'
    osc.frequency.value = frequency
    gain.gain.setValueAtTime(0, t)
    gain.gain.linearRampToValueAtTime(0.25, t + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.001, t + (i === 2 ? 0.35 : 0.16))
    osc.connect(gain).connect(context!.destination)
    osc.start(t)
    osc.stop(t + 0.4)
  })
}

/** Vibration : Android seulement (iOS n'autorise pas la vibration depuis le web). */
export function vibrateRestEnd() {
  navigator.vibrate?.([300, 150, 300])
}
