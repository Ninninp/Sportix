// « Tous les exercices » (maquette J7) : chaque exercice travaillé sur la période, résumé par sa
// variante la plus utilisée — courbe miniature et niveau actuel (1RM estimé, ou reps max sans
// charge). Les plus pratiqués d'abord ; recherche sans accents, comme la bibliothèque.
import { useState } from 'react'
import { Link } from 'react-router'
import Card from '../../components/Card.tsx'
import ScreenHeader from '../../components/ScreenHeader.tsx'
import SearchField from '../../components/SearchField.tsx'
import { EXERCISE_TYPE_LABELS, VARIANT_LABELS, normalizeForSearch } from '../../lib/exercises.ts'
import { METRIC_LABELS, PERIOD_LABELS, exerciseSummaries, formatMetric, periodStart } from '../../lib/stats.ts'
import { useAllSets, useExercisesById, useFinishedSessions } from '../sessions/useSession.ts'
import { useNowOnResume } from '../timer/useNow.ts'
import { Sparkline } from './charts.tsx'
import PeriodPicker from './PeriodPicker.tsx'
import { usePeriod, withPeriod } from './useStats.ts'
import { variantParam } from './variantParam.ts'

function ExerciseStatsListPage() {
  const [period] = usePeriod()
  const sessions = useFinishedSessions()
  const sets = useAllSets()
  const exercises = useExercisesById()
  const now = useNowOnResume()
  const [query, setQuery] = useState('')
  if (!sessions || !sets || !exercises) return null

  const q = normalizeForSearch(query)
  const list = exerciseSummaries(exercises, sessions, sets, periodStart(period, now)).filter((s) => normalizeForSearch(s.exercise.name).includes(q))

  return (
    <main className="flex flex-1 flex-col gap-3 px-4 pt-2 pb-4">
      <ScreenHeader title="Exercices" backTo={withPeriod('/stats', period)} backLabel="Retour aux stats" right={<PeriodPicker />} />
      <SearchField value={query} onChange={setQuery} placeholder="Rechercher un exercice" />
      {list.length === 0 ? (
        <p className="px-1 text-body text-muted">{q ? 'Aucun exercice ne correspond.' : `Aucun exercice travaillé en ${PERIOD_LABELS[period]}.`}</p>
      ) : (
        <Card className="shrink-0 divide-y divide-border overflow-hidden">
          {list.map((s) => (
            <Link
              key={s.exercise.id}
              to={withPeriod(`/stats/exercices/${s.exercise.id}?variante=${variantParam(s.variant)}`, period)}
              className="flex min-h-16 items-center gap-3 py-2 pr-3 pl-4 text-text no-underline active:bg-surface-2"
            >
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="truncate text-body-strong font-semibold">{s.exercise.name}</span>
                <span className="truncate text-small text-muted">
                  {s.variant ? VARIANT_LABELS[s.variant] : EXERCISE_TYPE_LABELS[s.exercise.type]} · {METRIC_LABELS[s.metric]}
                </span>
              </span>
              <Sparkline values={s.values} />
              <span className="num min-w-16 shrink-0 text-right text-num-s whitespace-nowrap">{formatMetric(s.metric, s.latest)}</span>
            </Link>
          ))}
        </Card>
      )}
    </main>
  )
}

export default ExerciseStatsListPage
