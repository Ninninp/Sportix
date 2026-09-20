// Onglet Séance — accueil (maquette D5 « Accueil · J3 ») : ligne fine sur la dernière séance,
// semaine en pastilles, puis la grande carte qui domine, avec le bouton dans la zone du pouce.
import { useNavigate } from 'react-router'
import Card from '../../components/Card.tsx'
import { BadgeIncrease, BadgePR } from '../../components/Badge.tsx'
import { IconChevronDroite, IconHistorique, IconPartager } from '../../components/icons.tsx'
import { startSession } from '../../db/sessions.ts'
import { isStandalone } from '../../lib/standalone.ts'
import { increaseBadge, lastPerformance } from '../../lib/progression.ts'
import { sessionsWithRecords } from '../../lib/records.ts'
import {
  formatDuration,
  formatNumber,
  formatWeight,
  groupSetsByExercise,
  sessionSummary,
  type SessionSet,
} from '../../lib/sessions.ts'
import { useActiveSession, useAllSets, useExercisesById, useFinishedSessions } from '../sessions/useSession.ts'

/** Lundi de la semaine en cours (les pastilles L → D). */
function mondayOf(date: Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7))
  return d
}

function HomePage() {
  const navigate = useNavigate()
  const active = useActiveSession()
  const sessions = useFinishedSessions()
  const sets = useAllSets()
  const exercises = useExercisesById()

  if (active === undefined || sessions === undefined || sets === undefined || exercises === undefined) return null

  const last = sessions[0]
  const lastSets = last ? sets.filter((s) => s.sessionId === last.id) : []
  const withRecords = sessionsWithRecords(sessions, sets)

  // Semaine en cours : un point plein par jour entraîné, un contour épais pour aujourd'hui
  const monday = mondayOf(new Date())
  const days = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(monday)
    day.setDate(monday.getDate() + i)
    const next = new Date(day)
    next.setDate(day.getDate() + 1)
    return {
      letter: ['L', 'M', 'M', 'J', 'V', 'S', 'D'][i],
      done: sessions.some((s) => s.startedAt >= day.getTime() && s.startedAt < next.getTime()),
      today: new Date().toDateString() === day.toDateString(),
    }
  })
  const weekCount = days.filter((d) => d.done).length

  // Dernières charges : les exercices travaillés le plus récemment
  const history: SessionSet[] = sets.filter((s) => s.done)
  const recent = [...new Set([...history].sort((a, b) => (b.doneAt ?? 0) - (a.doneAt ?? 0)).map((s) => s.exerciseId))]
    .slice(0, 5)
    .map((exerciseId) => {
      const latest = history.filter((s) => s.exerciseId === exerciseId).sort((a, b) => (b.doneAt ?? 0) - (a.doneAt ?? 0))[0]
      const perf = lastPerformance(history, exerciseId, latest.variant)
      return {
        exerciseId,
        name: exercises.get(exerciseId)?.name ?? 'Exercice',
        value: latest.weight > 0 ? `${formatNumber(latest.weight)} kg` : `× ${latest.reps}`,
        increase: increaseBadge(perf, latest.variant) !== null,
      }
    })

  return (
    <main className="flex min-h-0 flex-1 flex-col gap-3 px-4 pt-2 pb-4">
      <h1 className="sr-only">Sportix</h1>

      {/* Ligne fine : dernière séance, ou rappel d'installation au premier lancement */}
      {last ? (
        <button
          type="button"
          onClick={() => navigate('/historique')}
          className="flex min-h-13 shrink-0 items-center gap-3 rounded-lg border border-border bg-surface pr-3 pl-4 text-left text-text"
        >
          <span className="flex text-muted">
            <IconHistorique size={20} />
          </span>
          <span className="flex-1 text-body">
            <strong>{new Date(last.startedAt).toLocaleDateString('fr-FR', { weekday: 'long' })}</strong>{' '}
            <span className="text-muted">
              · {formatDuration(sessionSummary(last, lastSets).durationMs)} ·{' '}
              {formatWeight(sessionSummary(last, lastSets).volume)}
            </span>
          </span>
          {withRecords.has(last.id) && <BadgePR />}
          <span className="flex text-muted">
            <IconChevronDroite size={18} />
          </span>
        </button>
      ) : (
        !isStandalone(window) && (
          <button
            type="button"
            onClick={() => navigate('/reglages')}
            className="flex min-h-13 shrink-0 items-center gap-3 rounded-lg border border-border bg-surface pr-3 pl-4 text-left text-text"
          >
            <span className="flex text-muted">
              <IconPartager size={20} />
            </span>
            <span className="flex-1 text-body">
              <strong>Installer Sportix</strong> <span className="text-muted">· Partager → Sur l’écran d’accueil</span>
            </span>
            <span className="flex text-muted">
              <IconChevronDroite size={18} />
            </span>
          </button>
        )
      )}

      {/* Cette semaine */}
      <Card className="flex shrink-0 flex-col gap-2.5 px-4 pt-3 pb-3.5">
        <div className="flex items-center justify-between">
          <span className="text-body font-bold">Cette semaine</span>
          <span className="text-small text-muted">
            {weekCount === 0 ? 'aucune séance' : `${weekCount} séance${weekCount > 1 ? 's' : ''}`}
          </span>
        </div>
        <div className="flex justify-between">
          {days.map((d, i) => (
            <div
              key={i}
              className={`flex flex-col items-center gap-1 text-caption ${d.today ? 'font-extrabold text-text' : d.done ? 'font-semibold text-text' : 'font-semibold text-muted'}`}
            >
              <span
                className={`size-[30px] rounded-full ${
                  d.done
                    ? 'border-2 border-inverse bg-inverse'
                    : d.today
                      ? 'border-[3px] border-text'
                      : 'border-[1.5px] border-border-strong'
                }`}
              />
              {d.letter}
            </div>
          ))}
        </div>
      </Card>

      {/* Grande carte : séance en cours, ou nouvelle séance */}
      <Card inverse as="section" aria-label="Séance" className="flex min-h-0 flex-1 flex-col gap-2 p-4">
        <div>
          <h2 className="text-title-l font-extrabold tracking-[-0.02em]">
            {active ? 'Séance en cours' : 'Séance libre'}
          </h2>
          <p className="mt-1 truncate text-[14px] leading-[18px] text-on-inverse-muted">
            {active
              ? `Commencée à ${new Date(active.startedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`
              : recent.length > 0
                ? 'Tes dernières charges, reprises automatiquement'
                : 'Pas besoin de programme pour commencer'}
          </p>
        </div>

        <div className="flex flex-col">
          {active
            ? groupSetsByExercise(sets.filter((s) => s.sessionId === active.id)).map((b, i) => (
                <div
                  key={b.exerciseOrder}
                  className={`flex min-h-[38px] items-center gap-2 ${i > 0 ? 'border-t border-on-inverse/15' : ''}`}
                >
                  <span className="flex-1 text-body-strong font-semibold">
                    {exercises.get(b.exerciseId)?.name ?? 'Exercice'}
                  </span>
                  <span className="num text-num-s">
                    {b.doneCount}/{b.sets.length}
                  </span>
                </div>
              ))
            : recent.map((r, i) => (
                <div
                  key={r.exerciseId}
                  className={`flex min-h-[38px] items-center gap-2 ${i > 0 ? 'border-t border-on-inverse/15' : ''}`}
                >
                  <span className="flex-1 text-body-strong font-semibold">{r.name}</span>
                  {r.increase && <BadgeIncrease> </BadgeIncrease>}
                  <span className="num text-num-s">{r.value}</span>
                </div>
              ))}
        </div>

        <div className="flex-1" />
        <button
          type="button"
          onClick={async () => {
            if (!active) await startSession()
            navigate('/seance')
          }}
          className="flex min-h-15 shrink-0 items-center justify-center rounded-md bg-hero-action text-[20px] font-extrabold text-on-hero-action"
        >
          {active ? 'Reprendre la séance' : 'Démarrer la séance'}
        </button>
      </Card>
    </main>
  )
}

export default HomePage
