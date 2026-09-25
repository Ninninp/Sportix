// Lectures des écrans Stats (J7).
import { useLiveQuery } from 'dexie-react-hooks'
import { useSearchParams } from 'react-router'
import { listBodyWeights } from '../../db/bodyWeights.ts'
import { parsePeriod, type Period } from '../../lib/stats.ts'

/** Toutes les pesées (mises à jour en direct après « Enregistrer »). */
export function useBodyWeights() {
  return useLiveQuery(() => listBodyWeights(), [])
}

/**
 * Période affichée (4 sem. / 3 mois / 1 an), gardée dans l'adresse (`?periode=1a`) : elle vaut pour
 * toutes les cartes et suit quand on ouvre un exercice, sans rien enregistrer en base.
 */
export function usePeriod(): [Period, (p: Period) => void] {
  const [params, setParams] = useSearchParams()
  const period = parsePeriod(params.get('periode'))
  const setPeriod = (p: Period) =>
    setParams(
      (current) => {
        const next = new URLSearchParams(current)
        next.set('periode', p)
        return next
      },
      { replace: true },
    )
  return [period, setPeriod]
}

/** Ajoute la période à une adresse, pour qu'elle suive d'un écran à l'autre. */
export function withPeriod(path: string, period: Period): string {
  return `${path}${path.includes('?') ? '&' : '?'}periode=${period}`
}
