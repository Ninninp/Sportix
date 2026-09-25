// Export et import de toutes les données (J8). Voir src/lib/backup.ts pour le format et les règles.
import { BACKUP_TABLES, lostSessions, parseBackup, summarize, type Backup, type BackupSummary, type ParseResult } from '../lib/backup.ts'
import { db as defaultDb, type SportixDB } from './schema.ts'

const tablesOf = (db: SportixDB) => BACKUP_TABLES.map((name) => db.table(name))

/** Toutes les données de l'app, lues en une seule fois (une lecture cohérente, même si une écriture arrive). */
export async function exportBackup(db: SportixDB = defaultDb, now = Date.now()): Promise<Backup> {
  return db.transaction('r', tablesOf(db), async () => {
    const tables = {} as Backup['tables']
    for (const name of BACKUP_TABLES) tables[name] = await db.table(name).toArray()
    return { app: 'sportix', format: 1, schemaVersion: db.verno, exportedAt: now, tables }
  })
}

/**
 * Remplace TOUTES les données du téléphone par celles de la sauvegarde, dans une seule transaction :
 * si quelque chose échoue en route, rien n'est changé (jamais une base à moitié effacée).
 * Les données du téléphone correspondent ensuite à la sauvegarde : c'est sa date qui devient celle
 * de la dernière sauvegarde (le rappel ne se déclenche pas aussitôt après un import).
 */
export async function importBackup(backup: Backup, db: SportixDB = defaultDb): Promise<void> {
  await db.transaction('rw', tablesOf(db), async () => {
    for (const name of BACKUP_TABLES) {
      const table = db.table(name)
      await table.clear()
      await table.bulkPut(backup.tables[name])
    }
    // Sauvegarde d'avant une version de la base : on refait ce que la mise à niveau aurait fait
    // (voir src/db/schema.ts). Version 5 (J6) : l'objectif de bloc d'exemple « Force ».
    if (backup.schemaVersion < 5 && (await db.blockGoals.count()) === 0) {
      await db.blockGoals.add({ id: crypto.randomUUID(), name: 'Force', createdAt: Date.now() })
    }
    const settings = (await db.settings.get('app')) ?? { id: 'app' as const }
    await db.settings.put({ ...settings, id: 'app', lastBackupAt: backup.exportedAt })
  })
}

/** Note la date de la dernière sauvegarde (après un partage réussi du fichier). */
export async function markBackupDone(time = Date.now(), db: SportixDB = defaultDb): Promise<void> {
  await db.transaction('rw', db.settings, async () => {
    const settings = (await db.settings.get('app')) ?? { id: 'app' as const }
    await db.settings.put({ ...settings, id: 'app', lastBackupAt: time })
  })
}

/**
 * Séances terminées qui comptent pour le rappel : toutes (sans sauvegarde), ou celles commencées
 * après la dernière sauvegarde. Un simple compte par index, pas la lecture de toute la table.
 */
export function finishedSessionsSince(lastBackupAt: number | undefined, db: SportixDB = defaultDb): Promise<number> {
  return db.sessions
    .where('startedAt')
    .above(lastBackupAt ?? -Infinity)
    .filter((s) => s.endedAt !== undefined)
    .count()
}

/** Vérifie le texte d'un fichier choisi pour l'import, par rapport à la version de CETTE base. */
export function readBackupFile(text: string, db: SportixDB = defaultDb): ParseResult {
  return parseBackup(text, db.verno)
}

/** Ce qu'il y a sur le téléphone, et combien de séances la sauvegarde ferait perdre. */
export async function compareWithDevice(backup: Backup, db: SportixDB = defaultDb): Promise<{ device: BackupSummary; lost: number }> {
  const [sessions, programs, blocks, bodyWeights] = await Promise.all([
    db.sessions.toArray(),
    db.programs.toArray(),
    db.blocks.toArray(),
    db.bodyWeights.toArray(),
  ])
  return { device: summarize({ sessions, programs, blocks, bodyWeights }), lost: lostSessions(backup, sessions) }
}
