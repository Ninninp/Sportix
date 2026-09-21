// Fin de séance (maquette D5 « Fin de séance · récapitulatif ») : durée, volume, séries,
// records battus, et ce que l'app proposera la prochaine fois.
import { useParams } from 'react-router'
import { BadgeIncrease, BadgePR } from '../../components/Badge.tsx'
import Button from '../../components/Button.tsx'
import Card from '../../components/Card.tsx'
import { IconTrophee } from '../../components/icons.tsx'
import { VARIANT_LABELS } from '../../lib/exercises.ts'
import { increaseBadge } from '../../lib/progression.ts'
import { findRecords } from '../../lib/records.ts'
import { formatDuration, formatNumber, formatWeight, groupSetsByExercise, sessionSummary } from '../../lib/sessions.ts'
import { useSettings } from '../settings/useSettings.ts'
import { useExercisesById, useHistorySets, useSession, useSessionSets } from './useSession.ts'

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <Card className="flex flex-col gap-1 p-3">
      <span className="text-caption font-semibold tracking-[0.06em] text-muted uppercase">{label}</span>
      <span className="num text-num-m">{value}</span>
    </Card>
  )
}

function SessionRecapPage() {
  const sessionId = useParams().id!
  const session = useSession(sessionId)
  const sets = useSessionSets(sessionId)
  const history = useHistorySets(sessionId)
  const exercises = useExercisesById()
  const settings = useSettings()

  if (
    session === undefined ||
    sets === undefined ||
    history === undefined ||
    exercises === undefined ||
    settings === undefined
  )
    return null
  // Adresse ouverte avec un identifiant inconnu (lien périmé) : on le dit au lieu d'un écran vide.
  if (session === null) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
        <h1 className="text-title-l font-extrabold tracking-[-0.02em]">Séance introuvable</h1>
        <Button to="/" className="max-w-xs">
          Retour à l’accueil
        </Button>
      </main>
    )
  }

  const summary = sessionSummary(session, sets)
  const records = findRecords(sets, history)
  const blocks = groupSetsByExercise(sets)
  // Ce que la double progression proposera la prochaine fois, exercice par exercice
  const nextTime = blocks
    .map((b) => ({ block: b, badge: increaseBadge({ sessionId, sets: b.sets }, b.variant, settings.weightSteps) }))
    .filter((x) => x.badge !== null)

  const date = new Date(session.startedAt).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <main className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 pt-3 pb-4">
      <header className="shrink-0">
        <p className="text-body text-muted">
          {date.charAt(0).toUpperCase() + date.slice(1)} · Séance libre
        </p>
        <h1 className="text-display font-extrabold tracking-[-0.02em]">Séance terminée</h1>
      </header>

      <div className="grid shrink-0 grid-cols-3 gap-2">
        <Tile label="Durée" value={formatDuration(summary.durationMs)} />
        <Tile label="Volume" value={formatWeight(summary.volume)} />
        <Tile label="Séries" value={String(summary.setCount)} />
      </div>

      {records.length > 0 && (
        <Card inverse as="section" aria-label="Records" className="flex shrink-0 flex-col gap-2.5 p-4">
          <div className="flex items-center gap-2.5">
            <IconTrophee size={28} />
            <h2 className="text-title font-bold">
              {records.length} record{records.length > 1 ? 's' : ''}
            </h2>
          </div>
          {records.map(({ set }, i) => (
            <div
              key={set.id}
              className={`flex min-h-11 items-center gap-2 ${i > 0 ? 'border-t border-on-inverse/15' : ''}`}
            >
              <span className="flex-1">
                <span className="text-body-strong font-semibold">{exercises.get(set.exerciseId)?.name}</span>{' '}
                {set.variant && <span className="text-small text-on-inverse-muted">{VARIANT_LABELS[set.variant]}</span>}
              </span>
              <span className="num text-num-s">
                {set.weight > 0 ? `${formatNumber(set.weight)} kg × ${set.reps}` : `× ${set.reps}`}
              </span>
              <BadgePR />
            </div>
          ))}
        </Card>
      )}

      {nextTime.length > 0 && (
        <Card className="flex shrink-0 flex-col gap-1.5 p-4">
          <span className="text-caption font-semibold tracking-[0.06em] text-muted uppercase">La prochaine fois</span>
          {nextTime.map(({ block, badge }) => (
            <div key={block.exerciseOrder} className="flex min-h-10 items-center gap-2">
              <span className="flex-1 text-body-strong font-semibold">{exercises.get(block.exerciseId)?.name}</span>
              <BadgeIncrease>{badge!.replace('charge ', '')}</BadgeIncrease>
            </div>
          ))}
          <p className="text-small leading-[18px] text-muted">
            Toutes les séries ont atteint le haut de la fourchette : l’app proposera la charge du dessus, et l’objectif
            repartira du bas.
          </p>
        </Card>
      )}

      <div className="flex-1" />

      <div className="flex shrink-0 flex-col gap-1">
        <Button to="/" className="text-[20px] font-extrabold">
          Fermer
        </Button>
        <Button variant="link" className="self-center text-text" to={`/historique/${sessionId}`}>
          Voir le détail
        </Button>
      </div>
    </main>
  )
}

export default SessionRecapPage
