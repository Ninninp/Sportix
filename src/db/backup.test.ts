// Tests de l'export et de l'import en base (fausse IndexedDB en mémoire).
import 'fake-indexeddb/auto'
import Dexie from 'dexie'
import { afterEach, describe, expect, it } from 'vitest'
import { parseBackup } from '../lib/backup.ts'
import { exportBackup, importBackup, markBackupDone } from './backup.ts'
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
    expect(backup.schemaVersion).toBe(6)

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
    const backup = await exportBackup(db)
    // Deux lignes avec le même identifiant dans une table… et une ligne invalide pour la clé
    backup.tables.bodyWeights = [{ id: 'w', date: 1, kg: 80, createdAt: 1 }, { id: undefined as unknown as string }]
    const before = await db.sessions.count()
    await expect(importBackup(backup, db)).rejects.toThrow()
    expect(await db.sessions.count()).toBe(before)
  })

  it('note la date de la dernière sauvegarde', async () => {
    const db = freshDb()
    await markBackupDone(1234, db)
    expect((await getSettings(db)).lastBackupAt).toBe(1234)
  })
})
