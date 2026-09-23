// Tests des blocs en base (fausse IndexedDB en mémoire).
import 'fake-indexeddb/auto'
import Dexie from 'dexie'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { BlockDraft } from '../lib/blocks.ts'
import { createBlock, createGoal, saveBlock, deleteBlock, getBlock, listBlocks, listGoals, updateBlock } from './blocks.ts'
import { createProgram, listDays, startProgramSession } from './programs.ts'
import { SportixDB } from './schema.ts'
import { addExerciseToSession, endSession, getSessionSets, startSession } from './sessions.ts'

let db: SportixDB
let n = 0
const freshDb = () => (db = new SportixDB(`test-blocs-${++n}`))

afterEach(async () => {
  vi.useRealTimers()
  db.close()
  await Dexie.delete(db.name)
})

const day = (m: number, d: number, h = 0) => new Date(2026, m, d, h).getTime()
const draft = (over: Partial<BlockDraft> = {}): BlockDraft => ({
  name: 'Force',
  goalId: null,
  startsOn: day(8, 14),
  weeks: 5,
  deloadWeeks: [4],
  programId: null,
  ...over,
})

/** Une séance commencée (puis terminée) à cette date. */
async function sessionAt(time: number): Promise<string> {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(time)
  const id = await startSession(db)
  await endSession(id, db)
  vi.useRealTimers()
  return id
}

describe('migration vers la version 5', () => {
  it('garde les séances d’une base en version 4 et ajoute l’objectif « Force »', async () => {
    freshDb()
    // Base telle qu'elle est sur le téléphone avant le J6 (schéma de la version 4, avec une séance).
    const old = new Dexie(db.name)
    old.version(4).stores({
      exercises: 'id, name, muscleGroup, deletedAt',
      sessions: 'id, startedAt, endedAt',
      sets: 'id, sessionId, exerciseId, doneAt, [sessionId+order]',
      settings: 'id',
      programs: 'id',
      programDays: 'id, programId',
      programExercises: 'id, dayId',
    })
    await old.table('sessions').add({ id: 's1', startedAt: day(8, 1, 18), endedAt: day(8, 1, 19) })
    old.close()

    expect(await db.sessions.get('s1')).toMatchObject({ startedAt: day(8, 1, 18) })
    expect((await listGoals(db)).map((g) => g.name)).toEqual(['Force'])
    expect(await listBlocks(db)).toEqual([])
  })
})

describe('objectifs', () => {
  it('fournit « Force » en exemple, puis garde ceux qu’on crée', async () => {
    freshDb()
    expect((await listGoals(db)).map((g) => g.name)).toEqual(['Force'])
    await createGoal('  Hypertrophie ', db)
    expect((await listGoals(db)).map((g) => g.name)).toEqual(['Force', 'Hypertrophie'])
  })
})

describe('enregistrement d’un bloc', () => {
  it('ramène le début au lundi et garde les deloads dans la durée', async () => {
    freshDb()
    const id = await createBlock(draft({ name: ' Force ', startsOn: day(8, 17, 15), deloadWeeks: [6, 4, 4] }), false, db)
    const block = await getBlock(id, db)
    expect(block).toMatchObject({ name: 'Force', startsOn: day(8, 14), deloadWeeks: [4] })
  })

  it('un double appui sur « Créer le bloc » ne crée qu’un bloc', async () => {
    freshDb()
    await Promise.all([saveBlock('nouveau', draft(), false, db), saveBlock('nouveau', draft(), false, db)])
    expect(await listBlocks(db)).toHaveLength(1)
  })

  it('liste les blocs par date de début', async () => {
    freshDb()
    await createBlock(draft({ name: 'B', startsOn: day(9, 19) }), false, db)
    await createBlock(draft({ name: 'A' }), false, db)
    expect((await listBlocks(db)).map((b) => b.name)).toEqual(['A', 'B'])
  })
})

describe('rattachement des séances', () => {
  it('rattache une séance au bloc en cours à son démarrage', async () => {
    freshDb()
    const blockId = await createBlock(draft(), false, db)
    const inside = await sessionAt(day(8, 22, 18))
    const outside = await sessionAt(day(10, 2, 18))
    expect((await db.sessions.get(inside))?.blockId).toBe(blockId)
    expect((await db.sessions.get(outside))?.blockId).toBeUndefined()
  })

  it('rattache aussi une séance de programme', async () => {
    freshDb()
    const blockId = await createBlock(draft(), false, db)
    const programId = await createProgram('Force A/B', 'A', db)
    const [dayA] = await listDays(programId, db)
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(day(8, 15, 18))
    const id = await startProgramSession(dayA.id, db)
    expect((await db.sessions.get(id))?.blockId).toBe(blockId)
  })

  it('rattrape les séances passées quand on crée, modifie ou supprime un bloc', async () => {
    freshDb()
    const before = await sessionAt(day(8, 10, 18)) // la semaine avant le bloc
    const blockId = await createBlock(draft(), false, db)
    expect((await db.sessions.get(before))?.blockId).toBeUndefined()

    await updateBlock(blockId, draft({ startsOn: day(8, 7) }), false, db) // le bloc commence une semaine plus tôt
    expect((await db.sessions.get(before))?.blockId).toBe(blockId)

    await deleteBlock(blockId, db)
    expect((await db.sessions.get(before))?.blockId).toBeUndefined()
  })
})

describe('semaines de deload', () => {
  it('étiquette la séance et ses séries, et suit les changements de bloc', async () => {
    freshDb()
    // Bloc de 5 semaines à partir du 14 septembre, sans deload pour l'instant.
    const id = await createBlock(draft({ deloadWeeks: [] }), false, db)
    const exerciseId = (await db.exercises.toArray())[0].id
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(day(8, 22, 18)) // mardi de la semaine 2
    const session = await startSession(db)
    await addExerciseToSession(session, exerciseId, 'barre', db)
    vi.useRealTimers()
    expect(await db.sessions.get(session)).not.toHaveProperty('deload')

    // La semaine 2 devient une semaine de deload : la séance et ses séries suivent.
    await updateBlock(id, draft({ deloadWeeks: [2] }), false, db)
    expect((await db.sessions.get(session))?.deload).toBe(true)
    expect((await getSessionSets(session, db)).every((s) => s.deload)).toBe(true)

    // Le deload est retiré : les étiquettes disparaissent.
    await updateBlock(id, draft({ deloadWeeks: [] }), false, db)
    expect(await db.sessions.get(session)).not.toHaveProperty('deload')
    expect((await getSessionSets(session, db)).every((s) => s.deload === undefined)).toBe(true)
  })

  it('une séance commencée en deload naît étiquetée', async () => {
    freshDb()
    await createBlock(draft({ deloadWeeks: [2] }), false, db)
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(day(8, 23, 18)) // mercredi de la semaine 2 (deload)
    const session = await startSession(db)
    vi.useRealTimers()
    expect((await db.sessions.get(session))?.deload).toBe(true)
  })
})

describe('allonger un bloc (deload ajouté dans « Modifier »)', () => {
  it('rattache la semaine ajoutée', async () => {
    freshDb()
    const id = await createBlock(draft(), false, db) // 14 sept. → 18 oct.
    const late = await sessionAt(day(9, 20, 18)) // mardi 20 octobre : juste après
    await updateBlock(id, draft({ weeks: 6, deloadWeeks: [6] }), false, db)
    expect(await getBlock(id, db)).toMatchObject({ weeks: 6, deloadWeeks: [6] })
    expect((await db.sessions.get(late))?.blockId).toBe(id)
  })

  it('décale les blocs suivants si on le demande', async () => {
    freshDb()
    const force = await createBlock(draft(), false, db)
    const hyper = await createBlock(draft({ name: 'Hypertrophie', startsOn: day(9, 19), weeks: 4 }), false, db)
    const apres = await createBlock(draft({ name: 'Sèche', startsOn: day(10, 16), weeks: 4 }), false, db)
    await updateBlock(force, draft({ weeks: 6 }), true, db)
    expect((await getBlock(hyper, db))?.startsOn).toBe(day(9, 26))
    expect((await getBlock(apres, db))?.startsOn).toBe(day(10, 23))
  })

  it('laisse le chevauchement sinon', async () => {
    freshDb()
    const force = await createBlock(draft(), false, db)
    const hyper = await createBlock(draft({ name: 'Hypertrophie', startsOn: day(9, 19), weeks: 4 }), false, db)
    await updateBlock(force, draft({ weeks: 6 }), false, db)
    expect((await getBlock(hyper, db))?.startsOn).toBe(day(9, 19))
  })
})
