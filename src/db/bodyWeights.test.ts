// Tests des pesées en base (fausse IndexedDB en mémoire).
import 'fake-indexeddb/auto'
import Dexie from 'dexie'
import { afterEach, describe, expect, it } from 'vitest'
import { deleteBodyWeight, listBodyWeights, saveBodyWeight } from './bodyWeights.ts'
import { SportixDB } from './schema.ts'

let db: SportixDB
let n = 0
const freshDb = () => (db = new SportixDB(`test-pesees-${++n}`))

afterEach(async () => {
  db.close()
  await Dexie.delete(db.name)
})

const at = (d: number, h: number) => new Date(2026, 8, d, h).getTime()

describe('pesées', () => {
  it('enregistre la pesée au jour (0 h), triées par date', async () => {
    freshDb()
    await saveBodyWeight('b', at(24, 7), 78.4, db)
    await saveBodyWeight('a', at(22, 8), 79, db)
    const list = await listBodyWeights(db)
    expect(list.map((w) => [w.id, w.date, w.kg])).toEqual([
      ['a', new Date(2026, 8, 22).getTime(), 79],
      ['b', new Date(2026, 8, 24).getTime(), 78.4],
    ])
  })

  it('une deuxième pesée le même jour remplace la première', async () => {
    freshDb()
    await saveBodyWeight('a', at(24, 7), 78.4, db)
    await saveBodyWeight('b', at(24, 20), 79.1, db)
    expect((await listBodyWeights(db)).map((w) => [w.id, w.kg])).toEqual([['b', 79.1]])
  })

  it('deux appuis sur « Enregistrer » (même identifiant) ne font qu’une pesée', async () => {
    freshDb()
    await Promise.all([saveBodyWeight('a', at(24, 7), 78.4, db), saveBodyWeight('a', at(24, 7), 78.4, db)])
    expect(await listBodyWeights(db)).toHaveLength(1)
  })

  it('supprime une pesée', async () => {
    freshDb()
    await saveBodyWeight('a', at(24, 7), 78.4, db)
    await deleteBodyWeight('a', db)
    expect(await listBodyWeights(db)).toEqual([])
  })

  it('une base en version 5 passe en version 6 sans rien perdre', async () => {
    const name = `test-pesees-migration-${++n}`
    const v5 = new Dexie(name)
    v5.version(5).stores({
      exercises: 'id, name, muscleGroup, deletedAt',
      sessions: 'id, startedAt, endedAt',
      sets: 'id, sessionId, exerciseId, doneAt, [sessionId+order]',
      settings: 'id',
      programs: 'id',
      programDays: 'id, programId',
      programExercises: 'id, dayId',
      blocks: 'id, startsOn',
      blockGoals: 'id',
    })
    await v5.table('sessions').add({ id: 's', startedAt: 1, endedAt: 2 })
    v5.close()

    db = new SportixDB(name)
    expect(await db.sessions.get('s')).toEqual({ id: 's', startedAt: 1, endedAt: 2 })
    await saveBodyWeight('a', at(24, 7), 78.4, db)
    expect(await listBodyWeights(db)).toHaveLength(1)
  })
})
