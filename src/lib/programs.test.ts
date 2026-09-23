import { describe, expect, it } from 'vitest'
import { increaseSuggested, nextDay, planDaySets, type ProgramDay, type ProgramExercise } from './programs.ts'
import type { Session, SessionSet } from './sessions.ts'

const days: ProgramDay[] = [
  { id: 'A', programId: 'p', name: 'Force A — Jambes', order: 1 },
  { id: 'B', programId: 'p', name: 'Force B — Haut du corps', order: 2 },
]
const session = (id: string, startedAt: number, programDayId?: string): Session => ({ id, startedAt, endedAt: startedAt + 1, programDayId })

describe('nextDay (rotation A → B → A)', () => {
  it('aucun jour fait : le premier', () => {
    expect(nextDay(days, [])?.id).toBe('A')
  })
  it('le jour qui suit le dernier fait, en boucle', () => {
    expect(nextDay(days, [session('s1', 1, 'A')])?.id).toBe('B')
    expect(nextDay(days, [session('s1', 1, 'A'), session('s2', 2, 'B')])?.id).toBe('A')
  })
  it('ignore les séances libres et celles d’autres programmes', () => {
    expect(nextDay(days, [session('s1', 1, 'A'), session('s2', 5), session('s3', 6, 'autre')])?.id).toBe('B')
  })
  it('programme sans jour : rien à proposer', () => {
    expect(nextDay([], [])).toBeUndefined()
  })
})

const squat: ProgramExercise = {
  id: 'pe1', dayId: 'A', exerciseId: 'squat', variant: 'barre', order: 1,
  sets: 3, repsMin: 4, repsMax: 6, doubleProgression: true, restSeconds: 180,
}
const past = (reps: number[], weight = 100): SessionSet[] =>
  reps.map((r, i) => ({
    id: `x${i}`, sessionId: 'old', exerciseId: 'squat', variant: 'barre', exerciseOrder: 1, order: i + 1,
    weight, reps: r, done: true, doneAt: 10 + i,
  }))

describe('planDaySets pendant un deload', () => {
  it('garde la charge de la dernière séance normale, sans hausse ni objectif rehaussé', () => {
    const atteint = past([6, 6, 6]) // objectif atteint : +2,5 kg hors deload
    expect(planDaySets([squat], atteint)[0]).toMatchObject({ weight: 102.5, reps: 4 })
    const enDeload = planDaySets([squat], atteint, undefined, true)
    expect(enDeload[0]).toMatchObject({ weight: 100, reps: 6, deload: true })
  })

  it('ignore une séance de deload pour la prochaine séance normale', () => {
    const history = [...past([6, 6, 6]), ...past([6, 6, 6], 70).map((s) => ({ ...s, sessionId: 'deload', deload: true, doneAt: 99 }))]
    expect(planDaySets([squat], history)[0]).toMatchObject({ weight: 102.5 })
    expect(increaseSuggested(squat, history)).toBe(true)
    expect(increaseSuggested(squat, history, true)).toBe(false) // pendant le deload
  })
})

describe('planDaySets', () => {
  it('première fois : le nombre de séries du programme, barre à vide, 0 rep (les séries suivront la première)', () => {
    const sets = planDaySets([squat], [])
    expect(sets).toHaveLength(3)
    expect(sets[0]).toMatchObject({ weight: 20, reps: 0, targetRepsMin: 4, targetRepsMax: 6, restSeconds: 180, exerciseOrder: 1, order: 1 })
  })

  it('reprend charges et reps de la dernière fois', () => {
    const sets = planDaySets([squat], past([6, 5, 5]))
    expect(sets.map((s) => [s.weight, s.reps])).toEqual([[100, 6], [100, 5], [100, 5]])
  })

  it('toutes les séries au haut de la fourchette : + un pas, reps au bas', () => {
    const sets = planDaySets([squat], past([6, 6, 6]))
    expect(sets.map((s) => [s.weight, s.reps])).toEqual([[102.5, 4], [102.5, 4], [102.5, 4]])
  })

  it('sans double progression : jamais d’augmentation, reps fixes', () => {
    const fixed = { ...squat, doubleProgression: false, repsMin: 5, repsMax: 5 }
    const sets = planDaySets([fixed], past([8, 8, 8]))
    expect(sets.map((s) => [s.weight, s.reps])).toEqual([[100, 5], [100, 5], [100, 5]])
    expect(sets[0].progression).toBe(false)
  })

  it('plus de séries que la dernière fois : les dernières reprennent la dernière série faite', () => {
    const sets = planDaySets([{ ...squat, sets: 4 }], past([6, 5]))
    expect(sets.map((s) => s.reps)).toEqual([6, 5, 5, 5])
  })

  it('range les exercices dans l’ordre du jour', () => {
    const presse = { ...squat, id: 'pe2', exerciseId: 'presse', variant: 'machine' as const, order: 2, sets: 1 }
    const sets = planDaySets([presse, squat], [])
    expect(sets.map((s) => [s.exerciseId, s.exerciseOrder])).toEqual([['squat', 1], ['squat', 1], ['squat', 1], ['presse', 2]])
  })
})
