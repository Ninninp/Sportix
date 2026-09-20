// Lecture réactive de la bibliothèque : dès qu'un exercice est ajouté, modifié ou supprimé,
// les écrans qui utilisent ce hook se réaffichent tout seuls (useLiveQuery de Dexie).
import { useLiveQuery } from 'dexie-react-hooks'
import { listActiveExercises } from '../../db/exercises.ts'
import type { Exercise } from '../../lib/exercises.ts'

/** `undefined` tant que la base n'a pas répondu (premier affichage). */
export function useActiveExercises(): Exercise[] | undefined {
  return useLiveQuery(() => listActiveExercises(), [])
}
