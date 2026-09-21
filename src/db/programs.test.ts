// Tests des programmes en base (fausse IndexedDB en mémoire).
import 'fake-indexeddb/auto'
import Dexie from 'dexie'
import { afterEach, describe, expect, it } from 'vitest'
import {
  addDay,
  addDayExercise,
  createProgram,
  deleteDay,
  deleteProgram,
  listDayExercises,
  listDays,
  listPrograms,
  removeDayExercise,
  startProgramSession,
  updateDayExercise,
} from './programs.ts'
import { SportixDB } from './schema.ts'
import { endSession, getActiveSession, getSessionSets, listFinishedSessions, validateSetAndRest } from './sessions.ts'
import { getSettings, updateSettings } from './settings.ts'

let db: SportixDB
let n = 0
const freshDb = () => (db = new SportixDB(`test-programmes-${++n}`))

afterEach(async () => {
  await db.delete()
})

describe('programmes', () => {
  it('le premier programme créé devient actif, avec son premier jour', async () => {
    freshDb()
    const id = await createProgram('Force A/B', 'Force A — Jambes', db)
    expect((await getSettings(db)).activeProgramId).toBe(id)
    expect((await listDays(id, db)).map((d) => [d.name, d.order])).toEqual([['Force A — Jambes', 1]])

    // Un deuxième programme ne prend pas la place du premier
    await createProgram('PPL', 'Push', db)
    expect((await getSettings(db)).activeProgramId).toBe(id)
    expect((await listPrograms(db)).map((p) => p.name)).toEqual(['Force A/B', 'PPL'])
  })

  it('ajoute des jours et des exercices dans l’ordre, avec les valeurs par défaut', async () => {
    freshDb()
    await updateSettings({ restSeconds: 150 }, db)
    const id = await createProgram('Force A/B', 'A', db)
    await addDay(id, 'B', db)
    const [a] = await listDays(id, db)
    await addDayExercise(a.id, 'squat', 'barre', db)
    await addDayExercise(a.id, 'presse', 'machine', db)
    const exercises = await listDayExercises(a.id, db)
    expect((await listDays(id, db)).map((d) => d.name)).toEqual(['A', 'B'])
    expect(exercises.map((e) => e.exerciseId)).toEqual(['squat', 'presse'])
    expect(exercises[0]).toMatchObject({ sets: 3, repsMin: 8, repsMax: 12, doubleProgression: true, restSeconds: 150 })
  })

  it('supprimer un programme retire ses jours, ses exercices, et le rend inactif', async () => {
    freshDb()
    const id = await createProgram('Force A/B', 'A', db)
    const [a] = await listDays(id, db)
    await addDayExercise(a.id, 'squat', 'barre', db)
    await deleteProgram(id, db)
    expect(await listPrograms(db)).toEqual([])
    expect(await listDayExercises(a.id, db)).toEqual([])
    expect((await getSettings(db)).activeProgramId).toBeUndefined()
  })

  it('supprime un jour et ses exercices, retire un exercice', async () => {
    freshDb()
    const id = await createProgram('P', 'A', db)
    const bId = await addDay(id, 'B', db)
    const pe = await addDayExercise(bId, 'squat', 'barre', db)
    await addDayExercise(bId, 'presse', 'machine', db)
    await removeDayExercise(pe, db)
    expect((await listDayExercises(bId, db)).map((e) => e.exerciseId)).toEqual(['presse'])
    await deleteDay(bId, db)
    expect((await listDays(id, db)).map((d) => d.name)).toEqual(['A'])
    expect(await listDayExercises(bId, db)).toEqual([])
  })
})

describe('séance lancée depuis un jour', () => {
  it('crée d’un coup toutes les séries du jour, avec le nom du jour', async () => {
    freshDb()
    const id = await createProgram('Force A/B', 'Force A — Jambes', db)
    const [a] = await listDays(id, db)
    const squat = await addDayExercise(a.id, 'squat', 'barre', db)
    await updateDayExercise(squat, { sets: 3, repsMin: 4, repsMax: 6, restSeconds: 180 }, db)
    await addDayExercise(a.id, 'presse', 'machine', db)

    const sessionId = await startProgramSession(a.id, db)
    const session = await getActiveSession(db)
    expect(session).toMatchObject({ id: sessionId, programDayId: a.id, title: 'Force A — Jambes' })
    const sets = await getSessionSets(sessionId, db)
    expect(sets).toHaveLength(6)
    expect(sets.filter((s) => s.exerciseId === 'squat').every((s) => s.targetRepsMin === 4 && s.restSeconds === 180)).toBe(true)
  })

  it('première fois : les séries suivantes reprennent ce qui est saisi sur la première', async () => {
    freshDb()
    const id = await createProgram('P', 'A', db)
    const [a] = await listDays(id, db)
    await addDayExercise(a.id, 'squat', 'barre', db)
    const sessionId = await startProgramSession(a.id, db)
    const sets = (await getSessionSets(sessionId, db)).sort((x, y) => x.order - y.order)
    await validateSetAndRest(sessionId, sets[0].id, { weight: 60, reps: 10 }, db)
    const after = (await getSessionSets(sessionId, db)).sort((x, y) => x.order - y.order)
    expect(after.map((s) => [s.weight, s.reps])).toEqual([[60, 10], [60, 10], [60, 10]])
  })

  it('le repos après une série est celui de l’exercice dans le programme', async () => {
    freshDb()
    const id = await createProgram('P', 'A', db)
    const [a] = await listDays(id, db)
    const pe = await addDayExercise(a.id, 'squat', 'barre', db)
    await updateDayExercise(pe, { restSeconds: 200 }, db)
    const sessionId = await startProgramSession(a.id, db)
    const [first] = (await getSessionSets(sessionId, db)).sort((x, y) => x.order - y.order)
    await validateSetAndRest(sessionId, first.id, { weight: 100, reps: 8 }, db)
    expect((await getActiveSession(db))?.rest?.duration).toBe(200)
  })

  it('reprend la séance en cours au lieu d’en démarrer une deuxième', async () => {
    freshDb()
    const id = await createProgram('P', 'A', db)
    const [a] = await listDays(id, db)
    const first = await startProgramSession(a.id, db)
    expect(await startProgramSession(a.id, db)).toBe(first)
    await endSession(first, db)
    expect(await listFinishedSessions(db)).toHaveLength(1)
  })
})

describe('migration vers la version 4 (J5)', () => {
  it('garde les séances et les réglages de la version 3', async () => {
    const name = `test-migration-v4-${++n}`
    const old = new Dexie(name)
    old.version(1).stores({ exercises: 'id, name, muscleGroup, deletedAt' })
    old.version(2).stores({ sessions: 'id, startedAt, endedAt', sets: 'id, sessionId, exerciseId, doneAt, [sessionId+order]' })
    old.version(3).stores({ settings: 'id' })
    await old.table('sessions').add({ id: 's1', startedAt: 1, endedAt: 2 })
    await old.table('settings').put({ id: 'app', restSeconds: 90 })
    old.close()

    db = new SportixDB(name)
    expect(await listFinishedSessions(db)).toHaveLength(1)
    expect((await getSettings(db)).restSeconds).toBe(90)
    expect(await listPrograms(db)).toEqual([])
  })
})
