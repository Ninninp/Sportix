// Accès aux séances et aux séries. Chaque geste de l'utilisateur écrit immédiatement :
// en salle, l'app peut être fermée ou tuée par le système à tout moment.
import type { Variant } from '../lib/exercises.ts'
import { lastPerformance, prefillSets } from '../lib/progression.ts'
import { groupSetsByExercise, type Session, type SessionSet } from '../lib/sessions.ts'
import { db as defaultDb, type SportixDB } from './schema.ts'

/** La séance en cours (sans date de fin), s'il y en a une. */
export async function getActiveSession(db: SportixDB = defaultDb): Promise<Session | undefined> {
  const sessions = await db.sessions.toArray()
  return sessions.filter((s) => s.endedAt === undefined).sort((a, b) => b.startedAt - a.startedAt)[0]
}

export async function startSession(db: SportixDB = defaultDb): Promise<string> {
  const existing = await getActiveSession(db)
  if (existing) return existing.id // on ne démarre jamais deux séances à la fois
  const id = crypto.randomUUID()
  await db.sessions.add({ id, startedAt: Date.now() })
  return id
}

export function getSessionSets(sessionId: string, db: SportixDB = defaultDb): Promise<SessionSet[]> {
  return db.sets.where('sessionId').equals(sessionId).toArray()
}

/** Séries validées des séances passées : base du pré-remplissage et des records. */
export async function getHistorySets(exceptSessionId?: string, db: SportixDB = defaultDb): Promise<SessionSet[]> {
  const sets = await db.sets.toArray()
  return sets.filter((s) => s.done && s.sessionId !== exceptSessionId)
}

/**
 * Ajoute un exercice à la séance : ses séries sont créées pré-remplies avec la dernière fois
 * (même variante), charge augmentée d'un pas si la double progression le propose.
 */
export async function addExerciseToSession(
  sessionId: string,
  exerciseId: string,
  variant: Variant | null,
  db: SportixDB = defaultDb,
): Promise<void> {
  const [current, history] = await Promise.all([getSessionSets(sessionId, db), getHistorySets(sessionId, db)])
  const blocks = groupSetsByExercise(current)
  const exerciseOrder = blocks.length + 1
  const prefilled = prefillSets(lastPerformance(history, exerciseId, variant), variant)

  await db.sets.bulkAdd(
    prefilled.map((p, i) => ({
      id: crypto.randomUUID(),
      sessionId,
      exerciseId,
      variant,
      exerciseOrder,
      order: i + 1,
      weight: p.weight,
      reps: p.reps,
      targetRepsMin: p.targetRepsMin,
      targetRepsMax: p.targetRepsMax,
      done: false,
    })),
  )
}

export async function updateSet(setId: string, changes: Partial<SessionSet>, db: SportixDB = defaultDb): Promise<void> {
  await db.sets.update(setId, changes)
}

/** Valide la série en cours : charge et reps saisies, marquée faite et horodatée. */
export async function validateSet(
  setId: string,
  values: { weight: number; reps: number },
  db: SportixDB = defaultDb,
): Promise<void> {
  await db.sets.update(setId, { ...values, done: true, doneAt: Date.now() })
}

/** Ajoute une série à un exercice de la séance, copiée sur la dernière de cet exercice. */
export async function addSet(sessionId: string, exerciseOrder: number, db: SportixDB = defaultDb): Promise<void> {
  const sets = await getSessionSets(sessionId, db)
  const block = groupSetsByExercise(sets).find((b) => b.exerciseOrder === exerciseOrder)
  if (!block) return
  const last = block.sets[block.sets.length - 1]
  await db.sets.add({
    ...last,
    id: crypto.randomUUID(),
    order: last.order + 1,
    done: false,
    doneAt: undefined,
  })
}

export async function removeSet(setId: string, db: SportixDB = defaultDb): Promise<void> {
  await db.sets.delete(setId)
}

/** Retire un exercice de la séance (toutes ses séries). */
export async function removeExercise(sessionId: string, exerciseOrder: number, db: SportixDB = defaultDb): Promise<void> {
  const sets = await getSessionSets(sessionId, db)
  const ids = sets.filter((s) => s.exerciseOrder === exerciseOrder).map((s) => s.id)
  await db.sets.bulkDelete(ids)
}

/**
 * Change la variante d'un exercice de la séance : les séries non faites reprennent les charges
 * de la dernière fois avec la NOUVELLE variante (parcours.md § 2.4).
 */
export async function changeVariant(
  sessionId: string,
  exerciseOrder: number,
  variant: Variant | null,
  db: SportixDB = defaultDb,
): Promise<void> {
  const [sets, history] = await Promise.all([getSessionSets(sessionId, db), getHistorySets(sessionId, db)])
  const block = groupSetsByExercise(sets).find((b) => b.exerciseOrder === exerciseOrder)
  if (!block) return
  const prefilled = prefillSets(lastPerformance(history, block.exerciseId, variant), variant)

  await Promise.all(
    block.sets.map((s, i) =>
      s.done
        ? db.sets.update(s.id, { variant }) // une série déjà faite garde ses valeurs
        : db.sets.update(s.id, {
            variant,
            weight: prefilled[i]?.weight ?? prefilled[0]?.weight ?? s.weight,
            reps: prefilled[i]?.reps ?? s.reps,
            targetRepsMin: prefilled[i]?.targetRepsMin,
            targetRepsMax: prefilled[i]?.targetRepsMax,
          }),
    ),
  )
}

/**
 * Remplace un exercice (machine prise…) : les séries déjà faites restent sur l'exercice d'origine,
 * les autres passent au nouvel exercice, avec le même objectif et les charges de sa dernière fois.
 */
export async function replaceExercise(
  sessionId: string,
  exerciseOrder: number,
  exerciseId: string,
  variant: Variant | null,
  db: SportixDB = defaultDb,
): Promise<void> {
  const [sets, history] = await Promise.all([getSessionSets(sessionId, db), getHistorySets(sessionId, db)])
  const block = groupSetsByExercise(sets).find((b) => b.exerciseOrder === exerciseOrder)
  if (!block) return

  const remaining = block.sets.filter((s) => !s.done)
  if (remaining.length === 0) return
  const prefilled = prefillSets(lastPerformance(history, exerciseId, variant), variant)
  const doneCount = block.sets.length - remaining.length
  // Le nouvel exercice prend la place suivante s'il reste des séries faites à l'ancien.
  const newOrder = doneCount > 0 ? groupSetsByExercise(sets).length + 1 : exerciseOrder

  await Promise.all(
    remaining.map((s, i) =>
      db.sets.update(s.id, {
        exerciseId,
        variant,
        exerciseOrder: newOrder,
        order: i + 1,
        weight: prefilled[i]?.weight ?? prefilled[0]?.weight ?? 0,
        reps: prefilled[i]?.reps ?? 0,
        // L'objectif de reps du jour suit l'exercice remplacé.
        targetRepsMin: s.targetRepsMin,
        targetRepsMax: s.targetRepsMax,
      }),
    ),
  )
}

/** Modifie l'objectif de reps d'un exercice pour cette séance (menu ⋯). */
export async function setTargetReps(
  sessionId: string,
  exerciseOrder: number,
  target: { min?: number; max?: number },
  db: SportixDB = defaultDb,
): Promise<void> {
  const sets = await getSessionSets(sessionId, db)
  const block = groupSetsByExercise(sets).find((b) => b.exerciseOrder === exerciseOrder)
  if (!block) return
  await Promise.all(
    block.sets.filter((s) => !s.done).map((s) => db.sets.update(s.id, { targetRepsMin: target.min, targetRepsMax: target.max })),
  )
}

/** Termine la séance. Les séries non faites sont retirées : elles n'ont pas eu lieu. */
export async function endSession(sessionId: string, db: SportixDB = defaultDb): Promise<void> {
  const sets = await getSessionSets(sessionId, db)
  await db.sets.bulkDelete(sets.filter((s) => !s.done).map((s) => s.id))
  await db.sessions.update(sessionId, { endedAt: Date.now() })
}

/** Abandonne une séance : elle et ses séries sont effacées (rien n'a été fait). */
export async function discardSession(sessionId: string, db: SportixDB = defaultDb): Promise<void> {
  const sets = await getSessionSets(sessionId, db)
  await db.sets.bulkDelete(sets.map((s) => s.id))
  await db.sessions.delete(sessionId)
}

/** Séances terminées, de la plus récente à la plus ancienne. */
export async function listFinishedSessions(db: SportixDB = defaultDb): Promise<Session[]> {
  const sessions = await db.sessions.toArray()
  return sessions.filter((s) => s.endedAt !== undefined).sort((a, b) => b.startedAt - a.startedAt)
}

export function getSession(sessionId: string, db: SportixDB = defaultDb): Promise<Session | undefined> {
  return db.sessions.get(sessionId)
}
