// Lectures réactives autour des séances : dès qu'une série est validée, les écrans se remettent
// à jour tout seuls (useLiveQuery).
import { useLiveQuery } from 'dexie-react-hooks'
import { getActiveSession, getHistorySets, getSession, getSessionSets, listFinishedSessions } from '../../db/sessions.ts'
import { db } from '../../db/schema.ts'
import type { Exercise } from '../../lib/exercises.ts'

/** `undefined` = la base n'a pas encore répondu ; `null` = aucune séance en cours. */
export function useActiveSession() {
  const result = useLiveQuery(async () => ({ value: (await getActiveSession()) ?? null }), [])
  return result?.value
}

export function useSessionSets(sessionId: string | undefined) {
  return useLiveQuery(async () => (sessionId ? getSessionSets(sessionId) : []), [sessionId])
}

/** Séries validées des autres séances : base du pré-remplissage, des records et de l'accueil. */
export function useHistorySets(exceptSessionId?: string) {
  return useLiveQuery(async () => getHistorySets(exceptSessionId), [exceptSessionId])
}

export function useSession(sessionId: string | undefined) {
  const result = useLiveQuery(async () => ({ value: sessionId ? ((await getSession(sessionId)) ?? null) : null }), [sessionId])
  return result?.value
}

export function useFinishedSessions() {
  return useLiveQuery(() => listFinishedSessions(), [])
}

/** Toutes les séries enregistrées (historique complet, pour les résumés et les records). */
export function useAllSets() {
  return useLiveQuery(() => db.sets.toArray(), [])
}

/** Tous les exercices par identifiant (y compris supprimés : l'historique doit rester lisible). */
export function useExercisesById(): Map<string, Exercise> | undefined {
  return useLiveQuery(async () => new Map((await db.exercises.toArray()).map((e) => [e.id, e])), [])
}
