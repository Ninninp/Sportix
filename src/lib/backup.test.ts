import { describe, expect, it } from 'vitest'
import {
  BACKUP_TABLES,
  backupFileName,
  describeImported,
  describeLastBackup,
  describeLost,
  formatFileSize,
  lostSessions,
  needsBackup,
  parseBackup,
  summarize,
  type Backup,
} from './backup.ts'

const NOW = new Date(2026, 8, 25, 18).getTime()
const day = (m: number, d: number, h = 18) => new Date(2026, m, d, h).getTime()

const emptyTables = () => Object.fromEntries(BACKUP_TABLES.map((t) => [t, []])) as unknown as Backup['tables']
const backup = (over: Partial<Backup> = {}): Backup => ({ app: 'sportix', format: 1, schemaVersion: 6, exportedAt: day(8, 13), tables: emptyTables(), ...over })

describe('parseBackup', () => {
  it('accepte une sauvegarde Sportix de la même version ou d’une plus ancienne', () => {
    const text = JSON.stringify(backup({ tables: { ...emptyTables(), sessions: [{ id: 's', startedAt: 1, endedAt: 2 }] } }))
    const result = parseBackup(text, 6)
    expect(result.ok && result.backup.tables.sessions).toEqual([{ id: 's', startedAt: 1, endedAt: 2 }])
    expect(parseBackup(JSON.stringify(backup({ schemaVersion: 4 })), 6).ok).toBe(true)
  })

  it('une sauvegarde ancienne sans certaines tables : elles sont lues comme vides', () => {
    const old = { app: 'sportix', format: 1, schemaVersion: 3, exportedAt: 1, tables: { exercises: [{ id: 'e' }] } }
    const result = parseBackup(JSON.stringify(old), 6)
    expect(result.ok && result.backup.tables.blocks).toEqual([])
    expect(result.ok && result.backup.tables.exercises).toHaveLength(1)
  })

  it('refuse un fichier illisible, un autre fichier JSON, ou une version plus récente', () => {
    expect(parseBackup('pas du json', 6)).toEqual({ ok: false, reason: 'illisible' })
    expect(parseBackup('{"nom":"autre chose"}', 6)).toEqual({ ok: false, reason: 'pas-sportix' })
    expect(parseBackup('[1, 2]', 6)).toEqual({ ok: false, reason: 'pas-sportix' })
    expect(parseBackup(JSON.stringify(backup({ schemaVersion: 7 })), 6)).toEqual({ ok: false, reason: 'trop-recent' })
  })

  it('refuse des lignes sans identifiant (fichier abîmé ou modifié à la main)', () => {
    const broken = { ...backup(), tables: { ...emptyTables(), sets: [{ weight: 100 }] } }
    expect(parseBackup(JSON.stringify(broken), 6)).toEqual({ ok: false, reason: 'pas-sportix' })
  })
})

describe('contenu et comparaison', () => {
  const b = backup({
    tables: {
      ...emptyTables(),
      sessions: [{ id: 'a', endedAt: 1 }, { id: 'b', endedAt: 2 }, { id: 'en-cours' }],
      programs: [{ id: 'p' }],
      bodyWeights: [{ id: 'w1' }, { id: 'w2' }],
    },
  })

  it('compte les séances terminées, programmes, blocs et pesées', () => {
    expect(summarize(b.tables)).toEqual({ sessions: 2, programs: 1, blocks: 0, bodyWeights: 2 })
  })

  it('séances du téléphone absentes de la sauvegarde = perdues', () => {
    expect(lostSessions(b, [{ id: 'a', endedAt: 1 }, { id: 'c', endedAt: 3 }, { id: 'd' }])).toBe(1)
  })
})

describe('formats', () => {
  it('nom du fichier, taille, date de la dernière sauvegarde', () => {
    expect(backupFileName(NOW)).toBe('sportix-2026-09-25.json')
    expect(formatFileSize(184_300)).toBe('184 Ko')
    expect(formatFileSize(1_240_000)).toBe('1,2 Mo')
    expect(describeLastBackup(undefined, NOW)).toBe('Jamais sauvegardé')
    expect(describeLastBackup(day(8, 25, 8), NOW)).toBe('Dernière sauvegarde : aujourd’hui')
    expect(describeLastBackup(day(8, 24, 23), NOW)).toBe('Dernière sauvegarde : hier')
    expect(describeLastBackup(day(8, 13), NOW)).toBe('Dernière sauvegarde : il y a 12 jours')
  })
})

describe('phrases de l’import', () => {
  it('séances perdues et données importées, singulier et pluriel', () => {
    expect(describeLost(14)).toBe('14 séances de ce téléphone ne sont pas dans la sauvegarde : elles seront perdues.')
    expect(describeLost(1)).toBe('1 séance de ce téléphone n’est pas dans la sauvegarde : elle sera perdue.')
    expect(describeImported({ sessions: 128, programs: 3, blocks: 3, bodyWeights: 30 })).toBe('128 séances, 3 programmes, 3 blocs et 30 pesées sont sur ce téléphone.')
    expect(describeImported({ sessions: 1, programs: 0, blocks: 0, bodyWeights: 0 })).toBe('1 séance est sur ce téléphone.')
    expect(describeImported({ sessions: 0, programs: 0, blocks: 0, bodyWeights: 0 })).toBe('La sauvegarde était vide : ce téléphone repart de zéro.')
  })
})

describe('needsBackup (pastille de l’onglet Réglages)', () => {
  const session = (startedAt: number, done = true) => ({ startedAt, ...(done && { endedAt: startedAt + 3_600_000 }) })

  it('jamais sauvegardé : à partir de 10 séances terminées', () => {
    expect(needsBackup(undefined, Array.from({ length: 9 }, (_, i) => session(day(8, i + 1))), NOW)).toBe(false)
    expect(needsBackup(undefined, Array.from({ length: 10 }, (_, i) => session(day(8, i + 1))), NOW)).toBe(true)
  })

  it('plus de 30 jours ET des séances depuis', () => {
    const last = day(7, 20) // 36 jours avant
    expect(needsBackup(last, [session(day(8, 1))], NOW)).toBe(true)
    expect(needsBackup(last, [session(day(7, 1))], NOW)).toBe(false) // rien de nouveau depuis
    expect(needsBackup(day(8, 1), [session(day(8, 20))], NOW)).toBe(false) // 24 jours seulement
  })
})
