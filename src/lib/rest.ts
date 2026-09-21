// Minuteur de repos (J4). Règle d'or : le repos est un HORODATAGE DE FIN enregistré dans la séance,
// jamais un compte à rebours qu'on décrémente. Le temps restant se recalcule à chaque affichage
// (fin − maintenant) : il reste juste quand l'écran se verrouille, que l'iPhone met l'app en pause
// ou qu'iOS la ferme, puisque rien ne « tourne » en arrière-plan.

/** Repos en cours d'une séance (enregistré dans la séance elle-même). */
export type Rest = {
  /** Horodatage de fin (Date.now() + durée). */
  endsAt: number
  /** Durée totale en secondes, +15 s compris : « sur 3:00 ». */
  duration: number
  /** Repos relancé par « +15 s » alors qu'il était déjà terminé (écran « Repos prolongé »). */
  extended?: boolean
}

/** Ajout d'un appui sur « +15 s ». */
export const REST_EXTENSION = 15

export function startRest(durationSeconds: number, now = Date.now()): Rest {
  return { endsAt: now + durationSeconds * 1000, duration: durationSeconds }
}

/** Secondes restantes, arrondies au-dessus : on affiche 0:01 jusqu'à la dernière milliseconde. */
export function restRemaining(rest: Rest, now = Date.now()): number {
  return Math.max(0, Math.ceil((rest.endsAt - now) / 1000))
}

export function isRestFinished(rest: Rest, now = Date.now()): boolean {
  return now >= rest.endsAt
}

/** Part du repos qui reste, de 1 (début) à 0 (fin) : la barre se vide. */
export function restFraction(rest: Rest, now = Date.now()): number {
  if (rest.duration <= 0) return 0
  return Math.min(1, Math.max(0, (rest.endsAt - now) / (rest.duration * 1000)))
}

/**
 * « +15 s » : pendant le repos, la fin recule de 15 s. Une fois le repos terminé, un nouveau
 * repos de 15 s repart de maintenant (écran « Repos prolongé »).
 */
export function extendRest(rest: Rest, now = Date.now(), seconds = REST_EXTENSION): Rest {
  if (isRestFinished(rest, now)) return { endsAt: now + seconds * 1000, duration: seconds, extended: true }
  return { ...rest, endsAt: rest.endsAt + seconds * 1000, duration: rest.duration + seconds }
}

/**
 * Faut-il sonner ? Seulement si l'app voit la fin du repos « en direct » (à 3 s près). Si l'iPhone
 * était verrouillé et que l'app se réveille bien après la fin, un son tardif surprendrait :
 * l'écran « Repos terminé » suffit.
 */
export function shouldRing(rest: Rest, now = Date.now(), tolerance = 3000): boolean {
  return now >= rest.endsAt && now - rest.endsAt <= tolerance
}

/** « 2:00 », « 0:15 », « 10:00 » : durée de repos en minutes:secondes. */
export function formatRest(seconds: number): string {
  const s = Math.max(0, Math.round(seconds))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

/**
 * Délai avant le prochain changement de seconde d'un chrono dont les secondes « tombent » sur
 * `anchor` (début de la séance, fin du repos), + une petite marge pour être sûr d'être passé.
 * Rafraîchir à ce moment précis, et non toutes les x ms, évite les secondes qui durent 0,75 s
 * puis 1,25 s, ou qui sautent.
 */
export function msUntilNextSecond(now: number, anchor: number, margin = 15): number {
  const phase = (((now - anchor) % 1000) + 1000) % 1000 // position dans la seconde, toujours ≥ 0
  return 1000 - phase + margin
}
