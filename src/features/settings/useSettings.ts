// Réglages lus en direct : un changement dans l'onglet Réglages s'applique partout aussitôt.
import { useLiveQuery } from 'dexie-react-hooks'
import { getSettings } from '../../db/settings.ts'

/** `undefined` tant que la base n'a pas répondu. */
export function useSettings() {
  return useLiveQuery(() => getSettings(), [])
}
