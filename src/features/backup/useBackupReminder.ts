// Faut-il afficher la pastille de rappel sur l'onglet Réglages ? (règle : src/lib/backup.ts)
// Monté dans App.tsx : les réglages viennent de là (pas de seconde lecture), et la base ne fait
// qu'un compte par index, relu seulement quand les séances changent.
import { useLiveQuery } from 'dexie-react-hooks'
import { finishedSessionsSince } from '../../db/backup.ts'
import { needsBackup } from '../../lib/backup.ts'
import type { Settings } from '../../lib/settings.ts'
import { useNowOnResume } from '../timer/useNow.ts'

export function useBackupReminder(settings: Settings | undefined): boolean {
  const lastBackupAt = settings?.lastBackupAt
  const finished = useLiveQuery(() => finishedSessionsSince(lastBackupAt), [lastBackupAt])
  const now = useNowOnResume()
  if (!settings || finished === undefined) return false
  return needsBackup(lastBackupAt, finished, now)
}
