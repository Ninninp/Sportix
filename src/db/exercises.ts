// Accès aux exercices dans la base. Chaque fonction écrit immédiatement :
// l'app peut être fermée à tout moment, rien ne doit rester « en attente ».
import type { Exercise, ExerciseDraft } from '../lib/exercises.ts'
import { db as defaultDb, type SportixDB } from './schema.ts'

/** Nettoie ce que l'utilisateur a saisi (espaces en trop dans le nom). */
function clean(draft: ExerciseDraft): ExerciseDraft {
  return { ...draft, name: draft.name.trim().replace(/\s+/g, ' ') }
}

export async function addExercise(draft: ExerciseDraft, db: SportixDB = defaultDb): Promise<string> {
  const id = crypto.randomUUID()
  await db.exercises.add({ ...clean(draft), id, createdAt: Date.now() })
  return id
}

export async function updateExercise(id: string, draft: ExerciseDraft, db: SportixDB = defaultDb): Promise<void> {
  await db.exercises.update(id, clean(draft))
}

/** Suppression « douce » : l'exercice n'est plus proposé mais reste lisible pour l'historique. */
export async function softDeleteExercise(id: string, db: SportixDB = defaultDb): Promise<void> {
  await db.exercises.update(id, { deletedAt: Date.now() })
}

export function getExercise(id: string, db: SportixDB = defaultDb): Promise<Exercise | undefined> {
  return db.exercises.get(id)
}

/** Tous les exercices non supprimés (l'ordre d'affichage est géré par src/lib/exercises.ts). */
export async function listActiveExercises(db: SportixDB = defaultDb): Promise<Exercise[]> {
  return (await db.exercises.toArray()).filter((e) => !e.deletedAt)
}
