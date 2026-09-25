// Panneau « Objectifs » (maquette J7, retouchée le 25/09/2026) : les objectifs ne servent qu'à tracer
// la ligne en pointillés d'un graphique, et le panneau le dit. Chaque réglage est rangé sous le nom
// de sa carte. « Aucun » : pas de ligne. Chaque appui est enregistré aussitôt (bouton « Fermer »).
// Ouvert depuis les Stats (libellé en pointillés d'une carte) et depuis les Réglages.
import Button from '../../components/Button.tsx'
import Card from '../../components/Card.tsx'
import MiniStepper from '../../components/MiniStepper.tsx'
import Sheet from '../../components/Sheet.tsx'
import { changeSettings, updateSettings } from '../../db/settings.ts'
import { BODY_WEIGHT_DEFAULT } from '../../lib/bodyWeight.ts'
import { formatNumber } from '../../lib/sessions.ts'
import { GOAL_SESSIONS_MAX, stepGoalSessions, stepGoalWeight } from '../../lib/settings.ts'
import { useSettings } from '../settings/useSettings.ts'

type Props = {
  open: boolean
  onClose: () => void
  /** Poids actuel (moyenne sur 7 jours) : point de départ du poids cible. */
  currentWeight?: number
}

const groupTitle = 'text-caption font-semibold tracking-[0.06em] text-muted uppercase'

function GoalsSheet({ open, onClose, currentWeight }: Props) {
  const settings = useSettings()
  if (!settings) return null
  const weight = settings.goalBodyWeight
  const sessions = settings.goalWeeklySessions
  const start = currentWeight ?? BODY_WEIGHT_DEFAULT

  return (
    <Sheet open={open} onClose={onClose} label="Objectifs">
      <div>
        <h2 className="text-title font-bold">Objectifs</h2>
        <p className="mt-1.5 text-body text-muted">Les lignes en pointillés des graphiques, pour voir d’un coup d’œil si tu es dans les clous.</p>
      </div>

      <div className="flex flex-col gap-1">
        <div className="flex min-h-6 items-center justify-between">
          <h3 className={groupTitle}>Poids corporel</h3>
          {weight !== undefined && (
            <button type="button" onClick={() => void updateSettings({ goalBodyWeight: undefined })} className="-my-3 min-h-12 px-2 text-small font-semibold text-muted underline underline-offset-[3px]">
              Retirer
            </button>
          )}
        </div>
        <Card className="px-3.5 py-0.5">
          <MiniStepper
            label="Cible"
            ariaLabel="Poids cible"
            value={weight !== undefined ? formatNumber(weight) : 'Aucun'}
            unit={weight !== undefined ? 'kg' : undefined}
            valueWidth="w-[108px]"
            onDecrement={() => void changeSettings((s) => ({ goalBodyWeight: stepGoalWeight(s.goalBodyWeight, -1, start) }))}
            onIncrement={() => void changeSettings((s) => ({ goalBodyWeight: stepGoalWeight(s.goalBodyWeight, 1, start) }))}
          />
        </Card>
      </div>

      <div className="flex flex-col gap-1">
        <h3 className={`${groupTitle} flex min-h-6 items-center`}>Séances par semaine</h3>
        <Card className="px-3.5 py-0.5">
          <MiniStepper
            label="Cible"
            ariaLabel="Séances par semaine"
            value={sessions !== undefined ? formatNumber(sessions) : 'Aucun'}
            valueWidth="w-[108px]"
            canDecrement={sessions !== undefined}
            canIncrement={sessions === undefined || sessions < GOAL_SESSIONS_MAX}
            onDecrement={() => void changeSettings((s) => ({ goalWeeklySessions: stepGoalSessions(s.goalWeeklySessions, -1) }))}
            onIncrement={() => void changeSettings((s) => ({ goalWeeklySessions: stepGoalSessions(s.goalWeeklySessions, 1) }))}
          />
        </Card>
      </div>

      <Button variant="link" className="text-text" onClick={onClose}>
        Fermer
      </Button>
    </Sheet>
  )
}

export default GoalsSheet
