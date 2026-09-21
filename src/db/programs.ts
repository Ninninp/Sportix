// Accès aux programmes (J5) : programmes, jours, exercices de chaque jour, et démarrage d'une
// séance à partir d'un jour. Chaque modification est enregistrée aussitôt (pas de bouton « Enregistrer »).
import type { Variant } from '../lib/exercises.ts'
import {
  DEFAULT_PROGRAM_EXERCISE,
  planDaySets,
  type Program,
  type ProgramDay,
  type ProgramExercise,
} from '../lib/programs.ts'
import { db as defaultDb, type SportixDB } from './schema.ts'
import { getActiveSession, getHistorySets } from './sessions.ts'
import { getSettings, updateSettings } from './settings.ts'

/** Programmes, du plus ancien au plus récent. */
export async function listPrograms(db: SportixDB = defaultDb): Promise<Program[]> {
  return (await db.programs.toArray()).sort((a, b) => a.createdAt - b.createdAt)
}

export function getProgram(id: string, db: SportixDB = defaultDb): Promise<Program | undefined> {
  return db.programs.get(id)
}

/** Jours d'un programme, dans l'ordre. */
export async function listDays(programId: string, db: SportixDB = defaultDb): Promise<ProgramDay[]> {
  const days = await db.programDays.where('programId').equals(programId).toArray()
  return days.sort((a, b) => a.order - b.order)
}

/** Exercices d'un jour, dans l'ordre. */
export async function listDayExercises(dayId: string, db: SportixDB = defaultDb): Promise<ProgramExercise[]> {
  const exercises = await db.programExercises.where('dayId').equals(dayId).toArray()
  return exercises.sort((a, b) => a.order - b.order)
}

/**
 * Crée un programme avec son premier jour. S'il n'y a pas encore de programme actif, celui-ci le
 * devient : l'accueil propose tout de suite sa première séance.
 */
export async function createProgram(name: string, firstDayName: string, db: SportixDB = defaultDb): Promise<string> {
  const id = crypto.randomUUID()
  await db.transaction('rw', db.programs, db.programDays, async () => {
    await db.programs.add({ id, name: name.trim(), createdAt: Date.now() })
    await db.programDays.add({ id: crypto.randomUUID(), programId: id, name: firstDayName.trim(), order: 1 })
  })
  if (!(await getSettings(db)).activeProgramId) await updateSettings({ activeProgramId: id }, db)
  return id
}

export async function renameProgram(id: string, name: string, db: SportixDB = defaultDb): Promise<void> {
  await db.programs.update(id, { name: name.trim() })
}

/** Supprime un programme, ses jours et leurs exercices. Les séances passées restent (avec leur nom). */
export async function deleteProgram(id: string, db: SportixDB = defaultDb): Promise<void> {
  await db.transaction('rw', db.programs, db.programDays, db.programExercises, async () => {
    const days = await db.programDays.where('programId').equals(id).toArray()
    await db.programExercises.where('dayId').anyOf(days.map((d) => d.id)).delete()
    await db.programDays.bulkDelete(days.map((d) => d.id))
    await db.programs.delete(id)
  })
  if ((await getSettings(db)).activeProgramId === id) await updateSettings({ activeProgramId: undefined }, db)
}

/** Rend un programme actif (ou aucun, avec null). Un seul programme actif à la fois. */
export async function setActiveProgram(id: string | null, db: SportixDB = defaultDb): Promise<void> {
  await updateSettings({ activeProgramId: id ?? undefined }, db)
}

export async function addDay(programId: string, name: string, db: SportixDB = defaultDb): Promise<string> {
  const days = await listDays(programId, db)
  const id = crypto.randomUUID()
  await db.programDays.add({ id, programId, name: name.trim(), order: (days.at(-1)?.order ?? 0) + 1 })
  return id
}

export async function renameDay(id: string, name: string, db: SportixDB = defaultDb): Promise<void> {
  await db.programDays.update(id, { name: name.trim() })
}

export async function deleteDay(id: string, db: SportixDB = defaultDb): Promise<void> {
  await db.transaction('rw', db.programDays, db.programExercises, async () => {
    await db.programExercises.where('dayId').equals(id).delete()
    await db.programDays.delete(id)
  })
}

/** Ajoute un exercice à la fin d'un jour, avec les valeurs par défaut et le repos des Réglages. */
export async function addDayExercise(
  dayId: string,
  exerciseId: string,
  variant: Variant | null,
  db: SportixDB = defaultDb,
): Promise<string> {
  const [exercises, settings] = await Promise.all([listDayExercises(dayId, db), getSettings(db)])
  const id = crypto.randomUUID()
  await db.programExercises.add({
    id,
    dayId,
    exerciseId,
    variant,
    order: (exercises.at(-1)?.order ?? 0) + 1,
    ...DEFAULT_PROGRAM_EXERCISE,
    restSeconds: settings.restSeconds,
  })
  return id
}

export async function updateDayExercise(
  id: string,
  changes: Partial<Omit<ProgramExercise, 'id' | 'dayId'>>,
  db: SportixDB = defaultDb,
): Promise<void> {
  await db.programExercises.update(id, changes)
}

/**
 * Modification calculée à partir de la ligne **en base**, et non de celle affichée à l'écran.
 * Indispensable pour les boutons − / + : l'affichage ne se met à jour qu'après l'aller-retour
 * avec la base, donc deux appuis rapprochés partiraient sinon tous les deux de l'ancienne valeur
 * (« 8 → 9 » deux fois au lieu de « 8 → 10 »). Dexie exécute ces transactions l'une après l'autre.
 */
export async function changeDayExercise(
  id: string,
  changes: (current: ProgramExercise) => Partial<Omit<ProgramExercise, 'id' | 'dayId'>>,
  db: SportixDB = defaultDb,
): Promise<void> {
  await db.transaction('rw', db.programExercises, async () => {
    const current = await db.programExercises.get(id)
    if (current) await db.programExercises.update(id, changes(current))
  })
}

export async function removeDayExercise(id: string, db: SportixDB = defaultDb): Promise<void> {
  await db.programExercises.delete(id)
}

/** Dans combien de jours de programme cet exercice figure-t-il ? (prévenir avant de le supprimer) */
export async function countExerciseInPrograms(exerciseId: string, db: SportixDB = defaultDb): Promise<number> {
  return (await db.programExercises.toArray()).filter((pe) => pe.exerciseId === exerciseId).length
}

/**
 * Démarre la séance d'un jour : la séance et toutes ses séries, pré-remplies, en une seule écriture.
 * S'il y a déjà une séance en cours, on la reprend (jamais deux séances à la fois).
 */
export async function startProgramSession(dayId: string, db: SportixDB = defaultDb): Promise<string> {
  const [day, exercises, history, settings] = await Promise.all([
    db.programDays.get(dayId),
    listDayExercises(dayId, db),
    getHistorySets(undefined, db),
    getSettings(db),
  ])
  if (!day) throw new Error('Jour de programme introuvable')
  const id = crypto.randomUUID()
  const planned = planDaySets(exercises, history, settings.weightSteps)
  // Le test « y a-t-il déjà une séance en cours ? » est **dans** la transaction d'écriture : sinon,
  // deux appuis rapprochés sur « Démarrer la séance » (les lectures ci-dessus prennent un instant)
  // répondraient tous les deux « non » et créeraient deux séances, dont une invisible à jamais.
  return db.transaction('rw', db.sessions, db.sets, async () => {
    const existing = await getActiveSession(db)
    if (existing) return existing.id
    await db.sessions.add({ id, startedAt: Date.now(), programDayId: dayId, title: day.name })
    await db.sets.bulkAdd(planned.map((p) => ({ ...p, id: crypto.randomUUID(), sessionId: id, done: false })))
    return id
  })
}
