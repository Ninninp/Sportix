// Tests des séances en base (fausse IndexedDB en mémoire).
import 'fake-indexeddb/auto'
import { afterEach, describe, expect, it } from 'vitest'
import { groupSetsByExercise } from '../lib/sessions.ts'
import {
  addExerciseToSession,
  addSet,
  changeVariant,
  endSession,
  getActiveSession,
  getSessionSets,
  listFinishedSessions,
  removeExercise,
  replaceExercise,
  startSession,
  validateSet,
} from './sessions.ts'
import { SportixDB } from './schema.ts'

let db: SportixDB
let n = 0
const freshDb = () => (db = new SportixDB(`test-seances-${++n}`))

afterEach(async () => {
  await db.delete()
})

/** Raccourci : une séance avec un exercice, dont on valide les séries aux reps données. */
async function seance(reps: number[], weight = 80, target: [number, number] = [8, 12]) {
  const id = await startSession(db)
  await addExerciseToSession(id, 'developpe', 'barre', db)
  let sets = await getSessionSets(id, db)
  // Le premier passage ne crée qu'une série : on complète pour en avoir autant que de reps données
  for (let i = sets.length; i < reps.length; i++) await addSet(id, 1, db)
  sets = (await getSessionSets(id, db)).sort((a, b) => a.order - b.order)
  for (const [i, r] of reps.entries()) {
    await db.sets.update(sets[i].id, { targetRepsMin: target[0], targetRepsMax: target[1] })
    await validateSet(sets[i].id, { weight, reps: r }, db)
  }
  await endSession(id, db)
  return id
}

describe('séance en cours', () => {
  it('ne démarre pas deux séances à la fois', async () => {
    freshDb()
    const a = await startSession(db)
    const b = await startSession(db)
    expect(b).toBe(a)
    expect((await getActiveSession(db))?.id).toBe(a)
  })

  it('garde la séance et ses séries après fermeture de la base (app fermée en salle)', async () => {
    freshDb()
    const id = await startSession(db)
    await addExerciseToSession(id, 'squat', 'barre', db)
    const [set] = await getSessionSets(id, db)
    await validateSet(set.id, { weight: 100, reps: 5 }, db)
    db.close()
    await db.open()
    expect((await getActiveSession(db))?.id).toBe(id)
    expect((await getSessionSets(id, db))[0]).toMatchObject({ weight: 100, reps: 5, done: true })
  })

  it('termine la séance en retirant les séries non faites', async () => {
    freshDb()
    const id = await startSession(db)
    await addExerciseToSession(id, 'squat', 'barre', db)
    await addSet(id, 1, db)
    const sets = (await getSessionSets(id, db)).sort((a, b) => a.order - b.order)
    await validateSet(sets[0].id, { weight: 100, reps: 5 }, db)
    await endSession(id, db)
    expect(await getSessionSets(id, db)).toHaveLength(1)
    expect(await getActiveSession(db)).toBeUndefined()
    expect(await listFinishedSessions(db)).toHaveLength(1)
  })
})

describe('pré-remplissage d’une séance à l’autre', () => {
  it('reprend les charges de la dernière fois', async () => {
    freshDb()
    await seance([12, 11, 10])
    const id = await startSession(db)
    await addExerciseToSession(id, 'developpe', 'barre', db)
    const sets = (await getSessionSets(id, db)).sort((a, b) => a.order - b.order)
    expect(sets.map((s) => [s.weight, s.reps])).toEqual([
      [80, 12],
      [80, 11],
      [80, 10],
    ])
  })

  it('propose +2,5 kg quand toutes les séries ont atteint le haut de la fourchette', async () => {
    freshDb()
    await seance([12, 12, 12])
    const id = await startSession(db)
    await addExerciseToSession(id, 'developpe', 'barre', db)
    const sets = (await getSessionSets(id, db)).sort((a, b) => a.order - b.order)
    expect(sets.map((s) => [s.weight, s.reps])).toEqual([
      [82.5, 8],
      [82.5, 8],
      [82.5, 8],
    ])
  })

  it('une variante différente ne reprend pas les charges de l’autre', async () => {
    freshDb()
    await seance([12, 12, 12])
    const id = await startSession(db)
    await addExerciseToSession(id, 'developpe', 'machine', db)
    expect((await getSessionSets(id, db)).map((s) => s.weight)).toEqual([0])
  })
})

describe('menu de l’exercice', () => {
  it('changer de variante reprend les charges de cette variante (sans toucher au nombre de séries)', async () => {
    freshDb()
    await seance([10, 10], 60)
    const id = await startSession(db)
    await addExerciseToSession(id, 'developpe', 'machine', db) // jamais fait à la machine : 1 série vide
    await changeVariant(id, 1, 'barre', db)
    const sets = await getSessionSets(id, db)
    expect(sets.map((s) => s.weight)).toEqual([60])
    expect(sets.map((s) => s.variant)).toEqual(['barre'])
  })

  it('remplacer un exercice garde les séries déjà faites sur l’ancien', async () => {
    freshDb()
    const id = await startSession(db)
    await addExerciseToSession(id, 'presse', 'machine', db)
    await addSet(id, 1, db)
    const sets = (await getSessionSets(id, db)).sort((a, b) => a.order - b.order)
    await validateSet(sets[0].id, { weight: 140, reps: 10 }, db)

    await replaceExercise(id, 1, 'hack-squat', 'machine', db)
    const blocks = groupSetsByExercise(await getSessionSets(id, db))
    expect(blocks).toHaveLength(2)
    expect(blocks[0]).toMatchObject({ exerciseId: 'presse', doneCount: 1 })
    expect(blocks[1]).toMatchObject({ exerciseId: 'hack-squat', doneCount: 0 })
  })

  it('retire un exercice de la séance', async () => {
    freshDb()
    const id = await startSession(db)
    await addExerciseToSession(id, 'squat', 'barre', db)
    await addExerciseToSession(id, 'presse', 'machine', db)
    await removeExercise(id, 1, db)
    expect(groupSetsByExercise(await getSessionSets(id, db)).map((b) => b.exerciseId)).toEqual(['presse'])
  })

  it('un exercice ajouté après un retrait ne se confond pas avec un autre (rangs distincts)', async () => {
    freshDb()
    const id = await startSession(db)
    await addExerciseToSession(id, 'squat', 'barre', db)
    await addExerciseToSession(id, 'presse', 'machine', db)
    await addExerciseToSession(id, 'developpe', 'barre', db)
    await removeExercise(id, 2, db) // rangs restants : 1 et 3
    await addExerciseToSession(id, 'hack-squat', 'machine', db) // doit prendre le rang 4, pas 3

    const blocks = groupSetsByExercise(await getSessionSets(id, db))
    expect(blocks.map((b) => b.exerciseId)).toEqual(['squat', 'developpe', 'hack-squat'])
    expect(new Set(blocks.map((b) => b.exerciseOrder)).size).toBe(3)

    // Retirer le dernier ne doit supprimer que lui
    await removeExercise(id, blocks[2].exerciseOrder, db)
    expect(groupSetsByExercise(await getSessionSets(id, db)).map((b) => b.exerciseId)).toEqual([
      'squat',
      'developpe',
    ])
  })
})
