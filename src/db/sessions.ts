// Accès aux séances et aux séries. Chaque geste de l'utilisateur écrit immédiatement :
// en salle, l'app peut être fermée ou tuée par le système à tout moment.
import { blockIdFor, isDeloadAt } from '../lib/blocks.ts'
import type { Variant } from '../lib/exercises.ts'
import { lastPerformance, prefillSets, WARMUP_REPS, warmupWeight } from '../lib/progression.ts'
import { extendRest, startRest } from '../lib/rest.ts'
import { groupSetsByExercise, isWorkSet, restFollows, type Session, type SessionSet } from '../lib/sessions.ts'
import { db as defaultDb, type SportixDB } from './schema.ts'
import { getSettings } from './settings.ts'

/**
 * Rang du prochain exercice de la séance. On repart du plus grand rang utilisé, jamais du
 * nombre d'exercices : après en avoir retiré un (rangs 1 et 3), « nombre + 1 » redonnerait 3,
 * déjà pris, et les deux exercices seraient confondus.
 */
function nextExerciseOrder(sets: SessionSet[]): number {
  return sets.reduce((max, s) => Math.max(max, s.exerciseOrder), 0) + 1
}

/** La séance en cours (sans date de fin), s'il y en a une. */
export async function getActiveSession(db: SportixDB = defaultDb): Promise<Session | undefined> {
  const sessions = await db.sessions.toArray()
  return sessions.filter((s) => s.endedAt === undefined).sort((a, b) => b.startedAt - a.startedAt)[0]
}

export async function startSession(db: SportixDB = defaultDb): Promise<string> {
  const id = crypto.randomUUID()
  // Vérification et création dans la même transaction : deux appuis rapprochés sur « Démarrer »
  // ne peuvent pas créer deux séances (la seconde transaction voit la première).
  return db.transaction('rw', db.sessions, db.blocks, async () => {
    const existing = await getActiveSession(db)
    if (existing) return existing.id // on ne démarre jamais deux séances à la fois
    const startedAt = Date.now()
    const blocks = await db.blocks.toArray()
    await db.sessions.add({
      id,
      startedAt,
      blockId: blockIdFor(blocks, startedAt),
      ...(isDeloadAt(blocks, startedAt) ? { deload: true } : {}),
    })
    return id
  })
}

export function getSessionSets(sessionId: string, db: SportixDB = defaultDb): Promise<SessionSet[]> {
  return db.sets.where('sessionId').equals(sessionId).toArray()
}

/**
 * Séries validées des séances passées : base du pré-remplissage et des records.
 * Sans les échauffements (J9), qui ne comptent nulle part hors de leur séance.
 */
export async function getHistorySets(exceptSessionId?: string, db: SportixDB = defaultDb): Promise<SessionSet[]> {
  const counts = (s: SessionSet) => s.done && !s.warmup
  if (exceptSessionId === undefined) return (await db.sets.toArray()).filter(counts)
  // « Toutes les séances sauf celle-ci » : deux lectures en bloc par l'index `sessionId`, avant et après
  // la séance exclue, plutôt qu'un filtre sur toute la table. Résultat identique (à l'ordre près),
  // mais Dexie sait alors que la requête ne concerne PAS les séries de la séance exclue : quand on
  // tape sur − / + en séance (une écriture par appui), l'historique n'est plus relu à chaque appui.
  // (Un `notEqual` seul, lui, relit les séries une par une : 5 fois plus lent à l'ouverture.)
  const [before, after] = await db.transaction('r', db.sets, () =>
    Promise.all([
      db.sets.where('sessionId').below(exceptSessionId).toArray(),
      db.sets.where('sessionId').above(exceptSessionId).toArray(),
    ]),
  )
  return [...before, ...after].filter(counts)
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
  const [current, history, settings, session] = await Promise.all([
    getSessionSets(sessionId, db),
    getHistorySets(sessionId, db),
    getSettings(db),
    db.sessions.get(sessionId),
  ])
  const exerciseOrder = nextExerciseOrder(current)
  const deload = session?.deload === true
  const prefilled = prefillSets(lastPerformance(history, exerciseId, variant), variant, settings.weightSteps, deload)

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
      ...(deload ? { deload: true } : {}),
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

/**
 * Valide la série ET lance le repos, en une seule écriture atomique : si l'app est tuée juste après
 * l'appui, on ne retrouve jamais une série faite sans son repos. Durée du repos : celle de
 * l'exercice dans le programme (J5), sinon le repos par défaut des Réglages.
 * Pas de repos après un échauffement, ni au milieu d'un tour de superset (J9, `restFollows`).
 */
export async function validateSetAndRest(
  sessionId: string,
  setId: string,
  values: { weight: number; reps: number },
  db: SportixDB = defaultDb,
): Promise<void> {
  const { restSeconds: defaultRest } = await getSettings(db)
  const now = Date.now()
  await db.transaction('rw', db.sets, db.sessions, async () => {
    const validated = await db.sets.get(setId)
    if (!validated) return
    const done = { ...validated, ...values, done: true, doneAt: now }
    await db.sets.update(setId, { ...values, done: true, doneAt: now })
    const sets = (await getSessionSets(sessionId, db)).map((s) => (s.id === setId ? done : s))
    // Séries de travail suivantes du même exercice encore vides (0 rep : jamais remplies, puisqu'on
    // ne peut pas valider 0 rep) : elles reprennent ces valeurs. Cas d'un exercice nouveau où l'on
    // a prévu ses séries avant de remplir la première.
    if (!validated.warmup) {
      const blanks = sets.filter(
        (s) =>
          s.exerciseOrder === validated.exerciseOrder && !s.warmup && s.order > validated.order && !s.done && s.reps === 0,
      )
      await Promise.all(blanks.map((s) => db.sets.update(s.id, values)))
    }
    if (restFollows(sets, done)) {
      await db.sessions.update(sessionId, { rest: startRest(validated.restSeconds ?? defaultRest, now) })
    }
  })
}

/** « +15 s » : recule la fin du repos, ou relance 15 s si le repos était terminé. */
export async function extendSessionRest(sessionId: string, db: SportixDB = defaultDb): Promise<void> {
  await db.transaction('rw', db.sessions, async () => {
    const session = await db.sessions.get(sessionId)
    if (session?.rest) await db.sessions.update(sessionId, { rest: extendRest(session.rest) })
  })
}

/** « Passer » ou « C'est parti » : fin du repos, retour à la saisie. */
export async function clearSessionRest(sessionId: string, db: SportixDB = defaultDb): Promise<void> {
  await db.sessions.update(sessionId, { rest: undefined })
}

/** Ajoute une série de travail à un exercice de la séance, copiée sur la dernière de cet exercice. */
export async function addSet(sessionId: string, exerciseOrder: number, db: SportixDB = defaultDb): Promise<void> {
  const sets = await getSessionSets(sessionId, db)
  const block = groupSetsByExercise(sets).find((b) => b.exerciseOrder === exerciseOrder)
  const last = block?.sets.filter(isWorkSet).at(-1)
  if (!last) return
  await db.sets.add({
    ...last,
    id: crypto.randomUUID(),
    order: last.order + 1,
    done: false,
    doneAt: undefined,
  })
}

/** « + Série » d'un superset : une série de plus à chaque exercice du groupe (un tour de plus). */
export async function addRound(sessionId: string, exerciseOrders: number[], db: SportixDB = defaultDb): Promise<void> {
  await db.transaction('rw', db.sets, async () => {
    for (const order of exerciseOrders) await addSet(sessionId, order, db)
  })
}

/**
 * « + Échauffement » (J9) : une série d'échauffement de plus, avant les séries de travail. La
 * première part de la moitié de la charge de travail (10 reps), les suivantes copient la précédente.
 */
export async function addWarmup(sessionId: string, exerciseOrder: number, db: SportixDB = defaultDb): Promise<void> {
  const [sets, settings] = await Promise.all([getSessionSets(sessionId, db), getSettings(db)])
  const block = groupSetsByExercise(sets).find((b) => b.exerciseOrder === exerciseOrder)
  const work = block?.sets.find(isWorkSet)
  if (!block || !work) return
  const lastWarmup = block.sets.filter((s) => s.warmup).at(-1)
  await db.sets.add({
    id: crypto.randomUUID(),
    sessionId,
    exerciseId: work.exerciseId,
    variant: work.variant,
    exerciseOrder,
    order: (lastWarmup?.order ?? 0) + 1,
    weight: lastWarmup?.weight ?? warmupWeight(work.weight, work.variant, settings.weightSteps),
    reps: lastWarmup?.reps ?? WARMUP_REPS,
    done: false,
    warmup: true,
    ...(work.supersetNext ? { supersetNext: true } : {}),
    ...(work.deload ? { deload: true } : {}),
  })
}

/** Relie (ou sépare) un exercice et le suivant de la séance : superset (J9). */
export async function setSuperset(
  sessionId: string,
  exerciseOrder: number,
  linked: boolean,
  db: SportixDB = defaultDb,
): Promise<void> {
  await db.transaction('rw', db.sets, async () => {
    const sets = (await getSessionSets(sessionId, db)).filter((s) => s.exerciseOrder === exerciseOrder)
    await Promise.all(sets.map((s) => db.sets.update(s.id, { supersetNext: linked ? true : undefined })))
  })
}

/**
 * Retire un exercice de la séance (toutes ses séries). S'il fermait un superset, l'exercice
 * d'avant n'est plus relié : sinon il se retrouverait relié à celui d'après.
 */
export async function removeExercise(sessionId: string, exerciseOrder: number, db: SportixDB = defaultDb): Promise<void> {
  await db.transaction('rw', db.sets, async () => {
    const sets = await getSessionSets(sessionId, db)
    const blocks = groupSetsByExercise(sets)
    const index = blocks.findIndex((b) => b.exerciseOrder === exerciseOrder)
    const removed = blocks[index]
    const previous = blocks[index - 1]
    if (removed && previous?.supersetNext && !removed.supersetNext) {
      await Promise.all(previous.sets.map((s) => db.sets.update(s.id, { supersetNext: undefined })))
    }
    await db.sets.bulkDelete(sets.filter((s) => s.exerciseOrder === exerciseOrder).map((s) => s.id))
  })
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
  const [sets, history, settings, session] = await Promise.all([
    getSessionSets(sessionId, db),
    getHistorySets(sessionId, db),
    getSettings(db),
    db.sessions.get(sessionId),
  ])
  const block = groupSetsByExercise(sets).find((b) => b.exerciseOrder === exerciseOrder)
  if (!block) return
  const prefilled = prefillSets(lastPerformance(history, block.exerciseId, variant), variant, settings.weightSteps, session?.deload === true)

  // Les échauffements changent de variante sans toucher à leurs valeurs (réglées à la main)
  const warmups = block.sets.filter((s) => s.warmup)
  await Promise.all([
    ...warmups.map((s) => db.sets.update(s.id, { variant })),
    ...block.sets.filter(isWorkSet).map((s, i) =>
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
  ])
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
  const [sets, history, settings, session] = await Promise.all([
    getSessionSets(sessionId, db),
    getHistorySets(sessionId, db),
    getSettings(db),
    db.sessions.get(sessionId),
  ])
  const block = groupSetsByExercise(sets).find((b) => b.exerciseOrder === exerciseOrder)
  if (!block) return

  const remaining = block.sets.filter((s) => !s.done && isWorkSet(s))
  if (remaining.length === 0) return
  const prefilled = prefillSets(lastPerformance(history, exerciseId, variant), variant, settings.weightSteps, session?.deload === true)
  // Le nouvel exercice prend la place suivante s'il reste des séries faites à l'ancien
  // (échauffements compris : ils ont eu lieu sur l'ancien exercice).
  const doneCount = block.sets.filter((s) => s.done).length
  const newOrder = doneCount > 0 ? nextExerciseOrder(sets) : exerciseOrder
  // Échauffements pas encore faits : prévus pour l'ancien exercice, ils sont retirés
  const pendingWarmups = block.sets.filter((s) => s.warmup && !s.done).map((s) => s.id)

  await Promise.all([
    db.sets.bulkDelete(pendingWarmups),
    ...remaining.map((s, i) =>
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
        // Déplacé en fin de séance : il n'est plus relié à l'exercice qui suivait l'ancien
        ...(newOrder !== exerciseOrder ? { supersetNext: undefined } : {}),
      }),
    ),
  ])
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
    block.sets
      .filter((s) => !s.done && isWorkSet(s))
      .map((s) => db.sets.update(s.id, { targetRepsMin: target.min, targetRepsMax: target.max })),
  )
}

/** Termine la séance. Les séries non faites sont retirées : elles n'ont pas eu lieu. */
export async function endSession(sessionId: string, db: SportixDB = defaultDb): Promise<void> {
  const sets = await getSessionSets(sessionId, db)
  await db.sets.bulkDelete(sets.filter((s) => !s.done).map((s) => s.id))
  await db.sessions.update(sessionId, { endedAt: Date.now(), rest: undefined })
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
