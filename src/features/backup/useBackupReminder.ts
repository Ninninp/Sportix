// Faut-il afficher la pastille de rappel sur l'onglet Réglages ? (règle : src/lib/backup.ts)
import { needsBackup } from '../../lib/backup.ts'
import { useFinishedSessions } from '../sessions/useSession.ts'
import { useSettings } from '../settings/useSettings.ts'
import { useNowOnResume } from '../timer/useNow.ts'

export function useBackupReminder(): boolean {
  const settings = useSettings()
  const sessions = useFinishedSessions()
  const now = useNowOnResume()
  if (!settings || !sessions) return false
  return needsBackup(settings.lastBackupAt, sessions, now)
}
