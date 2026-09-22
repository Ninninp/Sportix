// Lectures réactives des blocs (useLiveQuery) : un bloc créé ou modifié se voit aussitôt partout.
import { useLiveQuery } from 'dexie-react-hooks'
import { getBlock, listBlocks, listGoals } from '../../db/blocks.ts'
import type { Block } from '../../lib/blocks.ts'

/** Tous les blocs, par date de début. `undefined` tant que la base n'a pas répondu. */
export function useBlocks() {
  return useLiveQuery(() => listBlocks(), [])
}

/** Un bloc ; `null` s'il n'existe pas (supprimé), `undefined` pendant le chargement. */
export function useBlock(id: string | undefined): Block | null | undefined {
  const result = useLiveQuery(async () => ({ value: (id ? await getBlock(id) : undefined) ?? null }), [id])
  return result?.value
}

export function useGoals() {
  return useLiveQuery(() => listGoals(), [])
}
