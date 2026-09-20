// Détail d'une séance passée (maquette D5) : exercices et séries, avec le badge des records.
import { useParams } from 'react-router'
import { BadgePR } from '../../components/Badge.tsx'
import Card from '../../components/Card.tsx'
import ScreenHeader from '../../components/ScreenHeader.tsx'
import { VARIANT_LABELS } from '../../lib/exercises.ts'
import { findRecords } from '../../lib/records.ts'
import { formatDuration, formatNumber, formatWeight, groupSetsByExercise, sessionSummary } from '../../lib/sessions.ts'
import { useExercisesById, useHistorySets, useSession, useSessionSets } from './useSession.ts'

function SessionDetailPage() {
  const sessionId = useParams().id!
  const session = useSession(sessionId)
  const sets = useSessionSets(sessionId)
  const history = useHistorySets(sessionId)
  const exercises = useExercisesById()

  if (session === undefined || sets === undefined || history === undefined || exercises === undefined) return null
  if (session === null) {
    return (
      <main className="flex flex-1 flex-col gap-3 px-4 pt-2 pb-4">
        <ScreenHeader title="Séance introuvable" backTo="/historique" backLabel="Retour à l’historique" size="m" />
      </main>
    )
  }

  const summary = sessionSummary(session, sets)
  // Records battus ce jour-là, par rapport aux séances précédentes
  const recordIds = new Set(
    findRecords(
      sets,
      history.filter((s) => (s.doneAt ?? 0) < session.startedAt),
    ).map((r) => r.set.id),
  )
  const date = new Date(session.startedAt).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'short' })

  return (
    <main className="flex min-h-0 flex-1 flex-col gap-3 px-4 pt-2 pb-4">
      <ScreenHeader
        title={date.charAt(0).toUpperCase() + date.slice(1)}
        backTo="/historique"
        backLabel="Retour à l’historique"
        size="m"
      />
      <div className="num -mt-2 shrink-0 pl-10 text-body font-medium text-muted">
        {formatDuration(summary.durationMs)} · {summary.exerciseCount} exercice{summary.exerciseCount > 1 ? 's' : ''} ·{' '}
        {formatWeight(summary.volume)}
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto">
        {groupSetsByExercise(sets).map((block) => (
          <Card key={block.exerciseOrder} className="flex flex-col gap-1 p-3">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-body-strong font-bold">{exercises.get(block.exerciseId)?.name ?? 'Exercice'}</span>
              <span className="text-small text-muted">
                {block.variant ? VARIANT_LABELS[block.variant] : 'Poids du corps'}
                {block.sets[0]?.targetRepsMin
                  ? ` · objectif ${block.sets[0].targetRepsMin}${
                      block.sets[0].targetRepsMax && block.sets[0].targetRepsMax !== block.sets[0].targetRepsMin
                        ? `–${block.sets[0].targetRepsMax}`
                        : ''
                    }`
                  : ''}
              </span>
            </div>
            {block.sets.map((s) => (
              <div
                key={s.id}
                className="grid min-h-10 grid-cols-[20px_minmax(0,1fr)_auto] items-center gap-x-3 rounded-sm bg-surface-2 px-3"
              >
                <span className="num text-body text-muted">{s.order}</span>
                <span className="num text-num-s">
                  {s.weight > 0 ? `${formatNumber(s.weight)} kg × ${s.reps}` : `× ${s.reps}`}
                </span>
                {recordIds.has(s.id) ? <BadgePR /> : <span />}
              </div>
            ))}
          </Card>
        ))}
      </div>
    </main>
  )
}

export default SessionDetailPage
