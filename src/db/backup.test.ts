// Tests de l'export et de l'import en base (fausse IndexedDB en mémoire).
import 'fake-indexeddb/auto'
import Dexie from 'dexie'
import { afterEach, describe, expect, it } from 'vitest'
import { parseBackup } from '../lib/backup.ts'
import { exportBackup, finishedSessionsSince, importBackup, markBackupDone } from './backup.ts'
import { saveBodyWeight } from './bodyWeights.ts'
import { SportixDB } from './schema.ts'
import { endSession, startSession } from './sessions.ts'
import { getSettings, updateSettings } from './settings.ts'

const dbs: SportixDB[] = []
let n = 0
const freshDb = () => {
  const db = new SportixDB(`test-sauvegarde-${++n}`)
  dbs.push(db)
  return db
}

afterEach(async () => {
  for (const db of dbs.splice(0)) {
    db.close()
    await Dexie.delete(db.name)
  }
})

describe('sauvegarde', () => {
  it('export puis import sur un autre téléphone : les mêmes données, rien de plus', async () => {
    const phone = freshDb()
    const id = await startSession(phone)
    await endSession(id, phone)
    await saveBodyWeight('w', Date.now(), 78.4, phone)
    await updateSettings({ restSeconds: 180 }, phone)
    const backup = await exportBackup(phone, 1000)
    expect(backup.schemaVersion).toBe(phone.verno)

    // Le nouveau téléphone a déjà ses propres données (exercices de base, une séance à lui)
    const other = freshDb()
    const own = await startSession(other)
    await endSession(own, other)

    // Passage par le texte du fichier, comme en vrai
    const parsed = parseBackup(JSON.stringify(backup), other.verno)
    if (!parsed.ok) throw new Error(parsed.reason)
    await importBackup(parsed.backup, other)

    expect((await other.sessions.toArray()).map((s) => s.id)).toEqual([id])
    expect(await other.bodyWeights.count()).toBe(1)
    expect(await other.exercises.count()).toBe(await phone.exercises.count())
    const settings = await getSettings(other)
    expect(settings.restSeconds).toBe(180)
    expect(settings.lastBackupAt).toBe(1000)
  })

  it('un import qui échoue en route ne change rien', async () => {
    const db = freshDb()
    const id = await startSession(db)
    await endSession(id, db)
    const exported = await exportBackup(db)
    exported.tables.sessions = []
    exported.tables.bodyWeights = [{ id: 'w', date: 1, kg: 80, createdAt: 1 }]
    // Panne simulée au milieu de l'import (comme un stockage plein) : les séances sont déjà
    // effacées quand l'écriture des pesées échoue.
    db.bodyWeights.hook('creating', () => {
      throw new Error('stockage plein')
    })
    await expect(importBackup(exported, db)).rejects.toThrow('stockage plein')
    expect((await db.sessions.toArray()).map((s) => s.id)).toEqual([id])
  })

  it('une sauvegarde d’avant le J6 retrouve l’objectif d’exemple « Force », comme une mise à niveau', async () => {
    const db = freshDb()
    const old = await exportBackup(db)
    old.schemaVersion = 4
    old.tables.blockGoals = []
    await importBackup(old, db)
    expect((await db.blockGoals.toArray()).map((g) => g.name)).toEqual(['Force'])
  })

  it('compte les séances terminées depuis la dernière sauvegarde', async () => {
    const db = freshDb()
    await db.sessions.bulkPut([
      { id: 'a', startedAt: 100, endedAt: 200 },
      { id: 'b', startedAt: 500, endedAt: 600 },
      { id: 'en-cours', startedAt: 700 },
    ])
    expect(await finishedSessionsSince(undefined, db)).toBe(2)
    expect(await finishedSessionsSince(300, db)).toBe(1)
  })

  it('note la date de la dernière sauvegarde', async () => {
    const db = freshDb()
    await markBackupDone(1234, db)
    expect((await getSettings(db)).lastBackupAt).toBe(1234)
  })
})
