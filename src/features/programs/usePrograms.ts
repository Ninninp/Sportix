// Lectures réactives des programmes (useLiveQuery) : un changement dans un panneau se voit aussitôt.
import { useLiveQuery } from 'dexie-react-hooks'
import { getProgram, listDayExercises, listDays, listPrograms } from '../../db/programs.ts'
import type { Program, ProgramDay, ProgramExercise } from '../../lib/programs.ts'

export type DayWithExercises = { day: ProgramDay; exercises: ProgramExercise[] }
export type ProgramWithDays = { program: Program; days: DayWithExercises[] }

async function withDays(program: Program): Promise<ProgramWithDays> {
  const days = await listDays(program.id)
  return { program, days: await Promise.all(days.map(async (day) => ({ day, exercises: await listDayExercises(day.id) }))) }
}

/** Tous les programmes avec leurs jours et exercices. `undefined` tant que la base n'a pas répondu. */
export function usePrograms(): ProgramWithDays[] | undefined {
  return useLiveQuery(async () => Promise.all((await listPrograms()).map(withDays)), [])
}

/** Un programme avec ses jours ; `null` s'il n'existe pas (supprimé), `undefined` pendant le chargement. */
export function useProgram(id: string | undefined): ProgramWithDays | null | undefined {
  const result = useLiveQuery(async () => {
    const program = id ? await getProgram(id) : undefined
    return { value: program ? await withDays(program) : null }
  }, [id])
  return result?.value
}
