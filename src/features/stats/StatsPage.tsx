// Onglet Stats, vue d'ensemble (maquettes J7 « Stats · vue d'ensemble » et « premier lancement ») :
// une période en haut (4 sem. / 3 mois / 1 an) qui vaut pour toutes les cartes, puis
// - Poids corporel : pesées (points gris) + moyenne sur 7 jours (trait) + objectif, « + Pesée » ;
// - Séances par semaine : colonnes, deload en gris, semaine en cours en pointillés, objectif ;
// - Séries par muscle : moyenne par semaine sur la période (sans objectif, retiré le 25/09/2026) ;
// - Records récents, puis « Tous les exercices » et « Comparer deux blocs ».
// Pas de poids sur l'accueil (décision du 25/09/2026) : la pesée se fait ici.
import { useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import { BadgePR } from '../../components/Badge.tsx'
import Button from '../../components/Button.tsx'
import Card from '../../components/Card.tsx'
import ListRow from '../../components/ListRow.tsx'
import SegmentedControl from '../../components/SegmentedControl.tsx'
import { IconFleche, IconFlecheBas, IconPlus } from '../../components/icons.tsx'
import { formatBodyWeight, formatWeightChange, weightSummary } from '../../lib/bodyWeight.ts'
import { MUSCLE_GROUP_LABELS, VARIANT_LABELS } from '../../lib/exercises.ts'
import { formatNumber } from '../../lib/sessions.ts'
import {
  PERIOD_LABELS,
  PERIODS,
  averagePerWeek,
  defaultComparison,
  exerciseSummaries,
  formatSet,
  formatShortDate,
  periodStart,
  recentRecords,
  sessionsByWeek,
  setsPerMuscle,
} from '../../lib/stats.ts'
import { useBlocks } from '../blocks/useBlocks.ts'
import { useAllSets, useExercisesById, useFinishedSessions } from '../sessions/useSession.ts'
import { useSettings } from '../settings/useSettings.ts'
import { useNowOnResume } from '../timer/useNow.ts'
import { HorizontalBars, Legend, TimeChart, WeekColumns } from './charts.tsx'
import GoalsSheet from './GoalsSheet.tsx'
import { useBodyWeights, usePeriod, withPeriod } from './useStats.ts'
import WeighInSheet from './WeighInSheet.tsx'
import { variantParam } from './variantParam.ts'

const sectionTitle = 'text-caption font-semibold tracking-[0.06em] text-muted uppercase'

/** Carte de graphique : titre, élément à droite (Pesée, objectif), contenu. */
function StatCard({ title, right, children }: { title: string; right?: ReactNode; children: ReactNode }) {
  return (
    <Card as="section" aria-label={title} className="flex shrink-0 flex-col gap-2 px-4 pt-2.5 pb-3.5">
      <div className="flex min-h-8 items-center justify-between gap-2">
        <h2 className="text-body-strong font-bold">{title}</h2>
        {right}
      </div>
      {children}
    </Card>
  )
}

/** Gros chiffre de la carte et sa ligne d'explication. */
function BigNumber({ value, unit, children }: { value: string; unit?: string; children?: ReactNode }) {
  return (
    <div>
      <span className="num text-display tracking-[-0.02em]">{value}</span>
      {unit && <span className="ml-1 text-body font-semibold text-muted">{unit}</span>}
      {children && <div className="flex items-center gap-1 text-small text-muted">{children}</div>}
    </div>
  )
}

/** Libellé de l'objectif, en pointillés : le toucher ouvre le panneau (la ligne seule serait trop fine au doigt). */
function GoalLink({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} aria-label={`${label}, modifier`} className="-my-2 -mr-2 inline-flex min-h-12 items-center gap-1.5 px-2 text-small font-semibold whitespace-nowrap text-muted">
      <svg width="16" height="2" aria-hidden="true">
        <line x1="0" x2="16" y1="1" y2="1" style={{ stroke: 'var(--sx-text-muted)' }} strokeWidth="1.5" strokeDasharray="4 4" />
      </svg>
      {label}
    </button>
  )
}

function StatsPage() {
  const [period, setPeriod] = usePeriod()
  const sessions = useFinishedSessions()
  const sets = useAllSets()
  const exercises = useExercisesById()
  const blocks = useBlocks()
  const weights = useBodyWeights()
  const settings = useSettings()
  const now = useNowOnResume()
  const [weighing, setWeighing] = useState(false)
  const [goals, setGoals] = useState(false)

  if (!sessions || !sets || !exercises || !blocks || !weights || !settings) return null

  const from = periodStart(period, now)
  const weighIn = weighing && <WeighInSheet weights={weights} onClose={() => setWeighing(false)} />

  if (sessions.length === 0 && weights.length === 0) {
    return (
      <main className="flex flex-1 flex-col gap-3 px-4 pt-2 pb-4">
        <h1 className="text-title-l font-extrabold tracking-[-0.02em]">Stats</h1>
        <Card className="flex shrink-0 flex-col gap-2 p-4">
          <h2 className="text-[20px] leading-6 font-extrabold">Pas encore de stats</h2>
          <p className="text-body text-muted">Elles se remplissent à chaque séance et à chaque pesée.</p>
        </Card>
        <div className="flex-1" />
        <Button variant="secondary" onClick={() => setWeighing(true)}>
          <IconPlus size={20} />
          Pesée
        </Button>
        {weighIn}
      </main>
    )
  }

  const weight = weightSummary(weights, from)
  const weeks = sessionsByWeek(sessions, blocks, from, now)
  const average = averagePerWeek(weeks)
  const muscles = setsPerMuscle(exercises, sessions, sets, from, now)
  const records = recentRecords(sessions, sets, from)
  const followed = exerciseSummaries(exercises, sessions, sets, from).length
  const comparison = defaultComparison(blocks, now)
  const goalWeight = settings.goalBodyWeight
  const goalSessions = settings.goalWeeklySessions
  const span = `en ${PERIOD_LABELS[period]}`

  return (
    <main className="flex flex-1 flex-col gap-3 px-4 pt-2 pb-4">
      <h1 className="text-title-l font-extrabold tracking-[-0.02em]">Stats</h1>
      <SegmentedControl label="Période" options={PERIODS.map((p) => ({ value: p, label: PERIOD_LABELS[p] }))} value={period} onChange={setPeriod} />

      <StatCard
        title="Poids corporel"
        right={
          <button type="button" onClick={() => setWeighing(true)} className="-my-2 -mr-2 inline-flex min-h-12 items-center gap-1 px-2 text-body font-bold whitespace-nowrap text-text">
            <IconPlus size={18} strokeWidth={2.5} />
            Pesée
          </button>
        }
      >
        {weight ? (
          <>
            <div className="flex items-end justify-between">
              <BigNumber value={formatBodyWeight(weight.current)} unit="kg">
                {weight.change !== null && Math.abs(weight.change) >= 0.05 ? (
                  <>
                    {weight.change < 0 ? <IconFlecheBas size={13} strokeWidth={3} /> : <IconFleche size={13} strokeWidth={3} />}
                    <span>
                      <span className="sr-only">{weight.change < 0 ? 'Baisse de ' : 'Hausse de '}</span>
                      {formatWeightChange(weight.change)} {span}
                    </span>
                  </>
                ) : (
                  <span>moyenne sur 7 jours</span>
                )}
              </BigNumber>
              <GoalLink label={goalWeight !== undefined ? `objectif ${formatNumber(goalWeight)}` : 'objectif'} onClick={() => setGoals(true)} />
            </div>
            <TimeChart
              label={`Poids corporel ${span} : moyenne sur 7 jours de ${formatBodyWeight(weight.points[0].average)} à ${formatBodyWeight(weight.current)} kg${goalWeight !== undefined ? `, objectif ${formatNumber(goalWeight)} kg` : ''}`}
              height={150}
              from={from}
              to={now}
              dots={[
                ...weight.points.map((p) => ({ time: p.date, value: p.kg, kind: 'small' as const })),
                { time: weight.points[weight.points.length - 1].date, value: weight.current, kind: 'ink' as const },
              ]}
              line={weight.points.map((p) => ({ time: p.date, value: p.average }))}
              target={goalWeight}
              tips={weight.points.map((p) => ({ time: p.date, value: p.average, title: formatShortDate(p.date), main: `${formatBodyWeight(p.kg)} kg`, detail: `moy. ${formatBodyWeight(p.average)}` }))}
            />
            <Legend items={[{ mark: 'dot', label: 'pesée' }, { mark: 'line', label: 'moyenne 7 jours' }]} />
          </>
        ) : (
          <div className="flex items-center justify-between">
            <p className="text-body text-muted">Aucune pesée {span}.</p>
            <GoalLink label={goalWeight !== undefined ? `objectif ${formatNumber(goalWeight)}` : 'objectif'} onClick={() => setGoals(true)} />
          </div>
        )}
      </StatCard>

      <StatCard title="Séances par semaine" right={<GoalLink label={goalSessions !== undefined ? `objectif ${goalSessions}` : 'objectif'} onClick={() => setGoals(true)} />}>
        <BigNumber value={average !== null ? formatNumber(Math.round(average * 10) / 10) : '—'}>
          <span>en moyenne</span>
        </BigNumber>
        <WeekColumns
          label={`Séances par semaine ${span}${average !== null ? `, ${formatNumber(Math.round(average * 10) / 10)} en moyenne` : ''}${goalSessions !== undefined ? `, objectif ${goalSessions}` : ''} ; semaine en cours : ${weeks[weeks.length - 1]?.count ?? 0}`}
          weeks={weeks}
          target={goalSessions}
        />
        <Legend items={[...(weeks.some((w) => w.deload) ? [{ mark: 'square' as const, label: 'deload' }] : []), { mark: 'dashed', label: 'semaine en cours' }]} />
      </StatCard>

      {muscles.length > 0 && (
        <StatCard title="Séries par muscle">
          <p className="-mt-1.5 text-small text-muted">par semaine, en moyenne</p>
          <HorizontalBars
            label={`Séries par semaine et par muscle : ${muscles.map((m) => `${MUSCLE_GROUP_LABELS[m.group]} ${Math.round(m.perWeek)}`).join(', ')}`}
            rows={muscles.map((m) => ({ name: MUSCLE_GROUP_LABELS[m.group], value: m.perWeek, text: formatNumber(Math.round(m.perWeek)) }))}
          />
        </StatCard>
      )}

      {records.length > 0 && (
        <>
          <h2 className={`${sectionTitle} mt-1`}>Records récents</h2>
          <Card className="shrink-0 divide-y divide-border overflow-hidden">
            {records.map((r) => {
              const exercise = exercises.get(r.set.exerciseId)
              const variant = r.set.variant ? `${VARIANT_LABELS[r.set.variant]} · ` : ''
              return (
                <Link
                  key={`${r.set.id}`}
                  to={withPeriod(`/stats/exercices/${r.set.exerciseId}?variante=${variantParam(r.set.variant)}`, period)}
                  className="flex min-h-15 items-center gap-3 py-2 pr-3 pl-4 text-text no-underline active:bg-surface-2"
                >
                  <BadgePR />
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="truncate text-body-strong font-semibold">{exercise?.name ?? 'Exercice'}</span>
                    <span className="text-small text-muted">
                      {variant}
                      {formatShortDate(r.time)}
                    </span>
                  </span>
                  <span className="num text-num-s">{formatSet(r.set)}</span>
                </Link>
              )
            })}
          </Card>
        </>
      )}

      <Card className="shrink-0 divide-y divide-border overflow-hidden">
        <ListRow to={withPeriod('/stats/exercices', period)} title="Tous les exercices" subtitle={`${followed} exercice${followed > 1 ? 's' : ''} suivi${followed > 1 ? 's' : ''} ${span}`} />
        {comparison && <ListRow to="/stats/blocs" title="Comparer deux blocs" subtitle={`${comparison[0].name} · ${comparison[1].name}`} />}
      </Card>

      {weighIn}
      <GoalsSheet open={goals} onClose={() => setGoals(false)} currentWeight={weight?.current ?? weights.at(-1)?.kg} />
    </main>
  )
}

export default StatsPage
