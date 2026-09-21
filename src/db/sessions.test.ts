// Tests des séances en base (fausse IndexedDB en mémoire).
import 'fake-indexeddb/auto'
import Dexie from 'dexie'
import { afterEach, describe, expect, it } from 'vitest'
import { groupSetsByExercise } from '../lib/sessions.ts'
import {
  addExerciseToSession,
  addSet,
  changeVariant,
  clearSessionRest,
  endSession,
  extendSessionRest,
  getActiveSession,
  getSessionSets,
  listFinishedSessions,
  removeExercise,
  replaceExercise,
  startSession,
  validateSet,
  validateSetAndRest,
} from './sessions.ts'
import { SportixDB } from './schema.ts'
import { getSettings, updateSettings } from './settings.ts'

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

describe('repos (J4)', () => {
  it('valider une série lance le repos des réglages, en même temps', async () => {
    freshDb()
    await updateSettings({ restSeconds: 180 }, db)
    const id = await startSession(db)
    await addExerciseToSession(id, 'squat', 'barre', db)
    const [set] = await getSessionSets(id, db)
    const before = Date.now()
    await validateSetAndRest(id, set.id, { weight: 100, reps: 5 }, db)

    const session = await getActiveSession(db)
    expect(session?.rest?.duration).toBe(180)
    expect(session!.rest!.endsAt).toBeGreaterThanOrEqual(before + 180_000)
    expect((await getSessionSets(id, db))[0]).toMatchObject({ done: true, weight: 100, reps: 5 })
  })

  it('+15 s, passer, et fin de séance sans repos qui traîne', async () => {
    freshDb()
    const id = await startSession(db)
    await addExerciseToSession(id, 'squat', 'barre', db)
    const [set] = await getSessionSets(id, db)
    await validateSetAndRest(id, set.id, { weight: 100, reps: 5 }, db)
    await extendSessionRest(id, db)
    expect((await getActiveSession(db))?.rest?.duration).toBe(135) // 2:00 par défaut + 15 s
    await clearSessionRest(id, db)
    expect((await getActiveSession(db))?.rest).toBeUndefined()

    await validateSetAndRest(id, set.id, { weight: 100, reps: 5 }, db)
    await endSession(id, db)
    expect((await listFinishedSessions(db))[0].rest).toBeUndefined()
  })
})

describe('séries prévues à l’avance', () => {
  it('les séries suivantes encore vides reprennent les valeurs de la série validée', async () => {
    freshDb()
    const id = await startSession(db)
    await addExerciseToSession(id, 'squat', 'barre', db) // exercice nouveau : 1 série vide
    await addSet(id, 1, db)
    await addSet(id, 1, db)
    const sets = (await getSessionSets(id, db)).sort((a, b) => a.order - b.order)
    await db.sets.update(sets[2].id, { reps: 6 }) // la 3ᵉ a déjà été réglée à la main : on n'y touche pas
    await validateSetAndRest(id, sets[0].id, { weight: 100, reps: 5 }, db)

    const after = (await getSessionSets(id, db)).sort((a, b) => a.order - b.order)
    expect(after.map((s) => [s.weight, s.reps, s.done])).toEqual([
      [100, 5, true],
      [100, 5, false],
      [20, 6, false],
    ])
  })
})

describe('réglages', () => {
  it('le pas de charge des réglages sert à la proposition de charge', async () => {
    freshDb()
    await updateSettings({ weightSteps: { ...(await getSettings(db)).weightSteps, barre: 5 } }, db)
    await seance([12, 12, 12]) // objectif atteint : +1 pas la prochaine fois
    const id = await startSession(db)
    await addExerciseToSession(id, 'developpe', 'barre', db)
    expect((await getSessionSets(id, db)).map((s) => s.weight)).toEqual([85, 85, 85])
  })

  it('modifier un réglage garde les autres', async () => {
    freshDb()
    await updateSettings({ restSeconds: 90 }, db)
    await updateSettings({ restSound: false }, db)
    expect(await getSettings(db)).toMatchObject({ restSeconds: 90, restSound: false })
  })
})

describe('migration vers la version 3 (J4)', () => {
  it('garde les séances et séries enregistrées avec la version 2', async () => {
    const name = `test-migration-${++n}`
    // Base telle qu'installée sur le téléphone avant le J4 (versions 1 et 2 seulement)
    const old = new Dexie(name)
    old.version(1).stores({ exercises: 'id, name, muscleGroup, deletedAt' })
    old.version(2).stores({ sessions: 'id, startedAt, endedAt', sets: 'id, sessionId, exerciseId, doneAt, [sessionId+order]' })
    await old.table('sessions').add({ id: 's1', startedAt: 1, endedAt: 2 })
    await old.table('sets').add({ id: 'x1', sessionId: 's1', exerciseId: 'squat', variant: 'barre', exerciseOrder: 1, order: 1, weight: 100, reps: 5, done: true, doneAt: 2 })
    old.close()

    db = new SportixDB(name)
    expect(await listFinishedSessions(db)).toHaveLength(1)
    expect(await getSessionSets('s1', db)).toHaveLength(1)
    expect((await getSettings(db)).restSeconds).toBe(120)
  })
})
