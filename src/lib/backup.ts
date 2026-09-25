// Sauvegarde (J8) : le fichier qui contient toutes les données de l'app, et les règles autour.
// Tout reste sur le téléphone : ce fichier, que l'utilisateur range lui-même (Fichiers, mail…),
// est la seule copie de secours. Importer une sauvegarde REMPLACE toutes les données (pas de
// fusion : elle créerait des doublons et des conflits — maquettes J8, validées le 25/09/2026).
// Calculs purs ici ; lecture et écriture de la base dans src/db/backup.ts.
import { dayStart } from './bodyWeight.ts'

/** Les tables enregistrées dans une sauvegarde (toutes celles de la base). */
export const BACKUP_TABLES = [
  'exercises',
  'sessions',
  'sets',
  'settings',
  'programs',
  'programDays',
  'programExercises',
  'blocks',
  'blockGoals',
  'bodyWeights',
] as const
export type BackupTable = (typeof BACKUP_TABLES)[number]
type Row = { id: string } & Record<string, unknown>

export type Backup = {
  app: 'sportix'
  /** Format du fichier lui-même (s'il change un jour, l'import saura lire les anciens). */
  format: 1
  /** Version de la base au moment de l'export (`db.verno`, 6 au J7). */
  schemaVersion: number
  exportedAt: number
  /** Le contenu de chaque table ; une table absente (sauvegarde ancienne) est lue comme vide. */
  tables: Record<BackupTable, Row[]>
}

export type ParseResult =
  | { ok: true; backup: Backup }
  | { ok: false; reason: 'illisible' | 'pas-sportix' | 'trop-recent' }

const isRow = (value: unknown): value is Row =>
  typeof value === 'object' && value !== null && !Array.isArray(value) && typeof (value as Row).id === 'string'

/**
 * Lit le texte d'un fichier choisi pour l'import et vérifie que c'est bien une sauvegarde
 * Sportix que cette version de l'app sait lire. Rien n'est écrit : c'est l'étape d'avant la
 * confirmation. Une sauvegarde d'une version plus récente de la base est refusée (elle peut
 * contenir des données que cette version ne comprend pas) ; une plus ancienne est acceptée.
 */
export function parseBackup(text: string, currentSchemaVersion: number): ParseResult {
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    return { ok: false, reason: 'illisible' }
  }
  if (typeof data !== 'object' || data === null) return { ok: false, reason: 'pas-sportix' }
  const raw = data as Partial<Record<keyof Backup, unknown>>
  if (raw.app !== 'sportix' || raw.format !== 1 || typeof raw.tables !== 'object' || raw.tables === null || Array.isArray(raw.tables)) {
    return { ok: false, reason: 'pas-sportix' }
  }
  // La bibliothèque d'exercices existe depuis la toute première version : un fichier sans elle
  // est abîmé ou modifié à la main, pas une vraie sauvegarde (et l'importer effacerait tout).
  if (!Array.isArray((raw.tables as Record<string, unknown>).exercises)) return { ok: false, reason: 'pas-sportix' }
  if (typeof raw.schemaVersion !== 'number' || typeof raw.exportedAt !== 'number') return { ok: false, reason: 'pas-sportix' }
  if (raw.schemaVersion > currentSchemaVersion) return { ok: false, reason: 'trop-recent' }

  const source = raw.tables as Record<string, unknown>
  const tables = {} as Record<BackupTable, Row[]>
  for (const name of BACKUP_TABLES) {
    const rows = source[name] ?? []
    if (!Array.isArray(rows) || !rows.every(isRow)) return { ok: false, reason: 'pas-sportix' }
    tables[name] = rows
  }
  return { ok: true, backup: { app: 'sportix', format: 1, schemaVersion: raw.schemaVersion, exportedAt: raw.exportedAt, tables } }
}

export type BackupSummary = { sessions: number; programs: number; blocks: number; bodyWeights: number }

/** Ce qu'on montre d'une sauvegarde (ou du téléphone) : séances terminées, programmes, blocs, pesées. */
export function summarize(tables: { sessions: object[]; programs: unknown[]; blocks: unknown[]; bodyWeights: unknown[] }): BackupSummary {
  return {
    sessions: tables.sessions.filter((s) => typeof (s as { endedAt?: unknown }).endedAt === 'number').length,
    programs: tables.programs.length,
    blocks: tables.blocks.length,
    bodyWeights: tables.bodyWeights.length,
  }
}

/**
 * Séances du téléphone qui ne sont pas dans la sauvegarde : elles seraient perdues. La séance en
 * cours compte aussi (relecture du J8 : un import pendant une séance l'effaçait sans prévenir).
 */
export function lostSessions(backup: Backup, current: { id: string }[]): number {
  const kept = new Set(backup.tables.sessions.map((s) => s.id))
  return current.filter((s) => !kept.has(s.id)).length
}

/** « sportix-2026-09-25.json » */
export function backupFileName(time: number): string {
  const d = new Date(time)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `sportix-${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}.json`
}

/** « 184 Ko », « 1,2 Mo » */
export function formatFileSize(bytes: number): string {
  if (bytes < 1_000_000) return `${Math.max(1, Math.round(bytes / 1000))} Ko`
  return `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 }).format(bytes / 1_000_000)} Mo`
}

/** Jours de calendrier entre deux instants (aujourd'hui = 0, hier = 1), justes aux changements d'heure. */
export function daysBetween(from: number, to: number): number {
  return Math.round((dayStart(to) - dayStart(from)) / 86_400_000)
}

/** « Dernière sauvegarde : il y a 12 jours » (ou « jamais »). */
export function describeLastBackup(lastBackupAt: number | undefined, now = Date.now()): string {
  if (lastBackupAt === undefined) return 'Jamais sauvegardé'
  const days = daysBetween(lastBackupAt, now)
  const when = days <= 0 ? 'aujourd’hui' : days === 1 ? 'hier' : `il y a ${days} jours`
  return `Dernière sauvegarde : ${when}`
}

/** Délai après lequel la pastille de l'onglet Réglages rappelle de sauvegarder. */
export const BACKUP_REMINDER_DAYS = 30
/** Sans aucune sauvegarde, la pastille apparaît à partir de ce nombre de séances. */
export const BACKUP_REMINDER_SESSIONS = 10

/**
 * Faut-il rappeler de sauvegarder (pastille sur l'onglet Réglages) ? Oui si la dernière
 * sauvegarde date de plus de 30 jours et qu'il y a eu des séances depuis ; sans aucune
 * sauvegarde, à partir de 10 séances (inutile d'y penser le premier jour).
 */
export function needsBackup(
  lastBackupAt: number | undefined,
  /** Séances terminées : toutes (sans sauvegarde), ou commencées après la dernière sauvegarde. */
  finishedSessions: number,
  now = Date.now(),
): boolean {
  if (lastBackupAt === undefined) return finishedSessions >= BACKUP_REMINDER_SESSIONS
  return daysBetween(lastBackupAt, now) > BACKUP_REMINDER_DAYS && finishedSessions > 0
}

/**
 * « 14 séances de ce téléphone ne sont pas dans la sauvegarde : elles seront perdues. »
 * (Pas « faites depuis le … » : ce sont souvent les plus récentes, mais pas forcément — une
 * sauvegarde venue d'un autre téléphone peut ignorer des séances anciennes.)
 */
export function describeLost(count: number): string {
  return count > 1
    ? `${count} séances de ce téléphone ne sont pas dans la sauvegarde : elles seront perdues.`
    : '1 séance de ce téléphone n’est pas dans la sauvegarde : elle sera perdue.'
}

/** « 128 séances, 3 programmes, 3 blocs et 30 pesées sont sur ce téléphone. » */
export function describeImported(s: BackupSummary): string {
  const counts = ([
    [s.sessions, 'séance'],
    [s.programs, 'programme'],
    [s.blocks, 'bloc'],
    [s.bodyWeights, 'pesée'],
  ] as const).filter(([n]) => n > 0)
  if (counts.length === 0) return 'La sauvegarde était vide : ce téléphone repart de zéro.'
  const parts = counts.map(([n, word]) => `${n} ${word}${n > 1 ? 's' : ''}`)
  const list = parts.length > 1 ? `${parts.slice(0, -1).join(', ')} et ${parts[parts.length - 1]}` : parts[0]
  const plural = counts.length > 1 || counts[0][0] > 1
  return `${list} ${plural ? 'sont' : 'est'} sur ce téléphone.`
}
