// Historique des séances (maquette D5) : liste par mois, avec durée, volume et badge PR.
import { Link, useNavigate } from 'react-router'
import { BadgePR } from '../../components/Badge.tsx'
import Button from '../../components/Button.tsx'
import Card from '../../components/Card.tsx'
import ScreenHeader from '../../components/ScreenHeader.tsx'
import { IconChevronDroite, IconHistorique } from '../../components/icons.tsx'
import { startSession } from '../../db/sessions.ts'
import { sessionsWithRecords } from '../../lib/records.ts'
import { describeSessionExercises, formatWeight, groupBySession, sessionSummary } from '../../lib/sessions.ts'
import { formatHoursMinutes } from '../../lib/week.ts'
import { staggerDelay } from '../../lib/motion.ts'
import { useAllSets, useExercisesById, useFinishedSessions } from './useSession.ts'

// Formats de date créés une seule fois : `toLocaleDateString` en recrée un à chaque appel, ce qui
// devient long avec des centaines de séances (même texte affiché).
const MONTH_FORMAT = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' })
const WEEKDAY_FORMAT = new Intl.DateTimeFormat('fr-FR', { weekday: 'short' })

function HistoryPage() {
  const navigate = useNavigate()
  const sessions = useFinishedSessions()
  const sets = useAllSets()
  const exercises = useExercisesById()

  if (sessions === undefined || sets === undefined || exercises === undefined) return null

  const withRecords = sessionsWithRecords(sessions, sets)
  const setsBySession = groupBySession(sets)
  const byMonth = new Map<string, typeof sessions>()
  for (const s of sessions) {
    const label = MONTH_FORMAT.format(s.startedAt)
    const list = byMonth.get(label)
    if (list) list.push(s)
    else byMonth.set(label, [s])
  }

  return (
    <main className="flex min-h-0 flex-1 flex-col gap-3 px-4 pt-2 pb-4">
      <ScreenHeader title="Historique" backTo="/" backLabel="Retour à l’accueil" />

      {sessions.length === 0 ? (
        <>
          <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center">
            <span className="flex size-16 items-center justify-center rounded-full bg-surface-2 text-muted">
              <IconHistorique size={28} />
            </span>
            <h2 className="mt-2 text-title font-bold">Aucune séance pour l’instant</h2>
            <p className="text-body text-muted">Chaque séance terminée s’ajoute ici, avec ses records.</p>
          </div>
          {/* Séance libre (reprend la séance en cours s'il y en a une : startSession ne crée pas de doublon) */}
          <Button
            onClick={async () => {
              await startSession()
              navigate('/seance')
            }}
          >
            Démarrer une séance
          </Button>
        </>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto">
          {[...byMonth].map(([month, list], index) => (
            // J10 : les mois arrivent l'un après l'autre
            <section key={month} className="sx-apparaitre flex flex-col gap-1.5" style={{ animationDelay: `${staggerDelay(index)}ms` }}>
              <h2 className="text-caption font-semibold tracking-[0.06em] text-muted uppercase">{month}</h2>
              <Card className="divide-y divide-border overflow-hidden">
                {list.map((s) => {
                  const sessionSets = setsBySession.get(s.id) ?? []
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
                          {WEEKDAY_FORMAT.format(date).toUpperCase()}
                        </span>
                      </span>
                      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <span className="truncate text-body-strong font-semibold">
                          {/* Séance de programme : le nom du jour ; séance libre : ses exercices */}
                          {s.title ?? describeSessionExercises(sessionSets, (id) => exercises.get(id)?.name)}
                        </span>
                        <span className="num text-small font-medium text-muted">
                          {formatHoursMinutes(summary.durationMs)} · {formatWeight(summary.volume)}
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
