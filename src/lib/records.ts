// Records (PR). Règle retenue au J3 : un record, c'est une CHARGE jamais soulevée sur cet
// exercice et cette variante (au moins 1 rep). Pour les exercices sans charge (poids du corps,
// temps), c'est le plus grand nombre de reps.
import type { SessionSet } from './sessions.ts'

export type Record_ = {
  set: SessionSet
  /** Ce qui a été battu : l'ancien meilleur (absent si c'est la première fois). */
  previous?: number
}

const key = (s: SessionSet) => `${s.exerciseId}|${s.variant ?? ''}`
/** Valeur comparée : la charge, ou les reps quand l'exercice se fait sans charge. */
const value = (s: SessionSet) => (s.weight > 0 ? s.weight : s.reps)

/**
 * Records battus pendant la séance `sets`, au vu de `history` (les séries des séances passées).
 * Une seule ligne par exercice et variante : la meilleure série de la séance.
 */
export function findRecords(sets: SessionSet[], history: SessionSet[]): Record_[] {
  const best = new Map<string, number>()
  for (const s of history) {
    if (!s.done || s.reps < 1) continue
    best.set(key(s), Math.max(best.get(key(s)) ?? 0, value(s)))
  }

  const bySession = new Map<string, SessionSet>()
  for (const s of sets) {
    if (!s.done || s.reps < 1) continue
    const current = bySession.get(key(s))
    if (!current || value(s) > value(current)) bySession.set(key(s), s)
  }

  const records: Record_[] = []
  for (const [k, set] of bySession) {
    const previous = best.get(k)
    if (previous === undefined || value(set) > previous) records.push({ set, previous })
  }
  return records
}

/**
 * Séances (identifiants) qui ont battu au moins un record, calculées en une passe :
 * on parcourt les séances de la plus ancienne à la plus récente en gardant les meilleurs.
 */
export function sessionsWithRecords(
  sessions: { id: string; startedAt: number }[],
  allSets: SessionSet[],
): Set<string> {
  const best = new Map<string, number>()
  const withRecords = new Set<string>()

  for (const session of [...sessions].sort((a, b) => a.startedAt - b.startedAt)) {
    const sets = allSets.filter((s) => s.sessionId === session.id && s.done && s.reps >= 1)
    for (const s of sets) {
      const previous = best.get(key(s))
      if (previous === undefined || value(s) > previous) withRecords.add(session.id)
    }
    // Les meilleurs de cette séance comptent pour les suivantes
    for (const s of sets) best.set(key(s), Math.max(best.get(key(s)) ?? 0, value(s)))
  }
  return withRecords
}
