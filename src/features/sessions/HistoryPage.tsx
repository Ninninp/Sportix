// Historique des séances (maquette D5) : liste par mois, avec durée, volume et badge PR.
import { Link } from 'react-router'
import { BadgePR } from '../../components/Badge.tsx'
import Card from '../../components/Card.tsx'
import ScreenHeader from '../../components/ScreenHeader.tsx'
import { IconChevronDroite, IconHistorique } from '../../components/icons.tsx'
import { sessionsWithRecords } from '../../lib/records.ts'
import { describeSessionExercises, formatDuration, formatWeight, sessionSummary } from '../../lib/sessions.ts'
import { useAllSets, useExercisesById, useFinishedSessions } from './useSession.ts'

function HistoryPage() {
  const sessions = useFinishedSessions()
  const sets = useAllSets()
  const exercises = useExercisesById()

  if (sessions === undefined || sets === undefined || exercises === undefined) return null

  const withRecords = sessionsWithRecords(sessions, sets)
  const byMonth = new Map<string, typeof sessions>()
  for (const s of sessions) {
    const label = new Date(s.startedAt).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
    byMonth.set(label, [...(byMonth.get(label) ?? []), s])
  }

  return (
    <main className="flex min-h-0 flex-1 flex-col gap-3 px-4 pt-2 pb-4">
      <ScreenHeader title="Historique" backTo="/" backLabel="Retour à l’accueil" />

      {sessions.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center">
          <span className="flex size-16 items-center justify-center rounded-full bg-surface-2 text-muted">
            <IconHistorique size={28} />
          </span>
          <h2 className="mt-2 text-title font-bold">Aucune séance pour l’instant</h2>
          <p className="text-body text-muted">Chaque séance terminée s’ajoute ici, avec ses records.</p>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto">
          {[...byMonth].map(([month, list]) => (
            <section key={month} className="flex flex-col gap-1.5">
              <h2 className="text-caption font-semibold tracking-[0.06em] text-muted uppercase">{month}</h2>
              <Card className="divide-y divide-border overflow-hidden">
                {list.map((s) => {
                  const sessionSets = sets.filter((x) => x.sessionId === s.id)
                  const summary = sessionSummary(s, sessionSets)
                  const date = new Date(s.startedAt)
                  return (
                    <Link
                      key={s.id}
                      to={`/historique/${s.id}`}
                      className="flex min-h-17 items-center gap-3.5 py-2 pr-3 pl-3.5 text-text no-underline"
                    >
                      <span className="flex w-10 shrink-0 flex-col items-center">
                        <span className="num text-num-m">{String(date.getDate()).padStart(2, '0')}</span>
                        <span className="text-caption font-semibold text-muted">
                          {date.toLocaleDateString('fr-FR', { weekday: 'short' }).toUpperCase()}
                        </span>
                      </span>
                      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <span className="truncate text-body-strong font-semibold">
                          {describeSessionExercises(sessionSets, (id) => exercises.get(id)?.name)}
                        </span>
                        <span className="num text-small font-medium text-muted">
                          {formatDuration(summary.durationMs)} · {formatWeight(summary.volume)}
                        </span>
                      </span>
                      {withRecords.has(s.id) && <BadgePR />}
                      <span className="flex text-muted">
                        <IconChevronDroite size={20} />
                      </span>
                    </Link>
                  )
                })}
              </Card>
            </section>
          ))}
        </div>
      )}
    </main>
  )
}

export default HistoryPage
