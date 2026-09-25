// Stats d'un exercice (maquette J7 « Stats d'un exercice · Squat ») : c'est ici que l'on répond à
// « ai-je progressé au squat pendant mon bloc Force ? ».
// - la variante (Barre / Smith / Toutes) et la mesure (1RM estimé / Charge max / Volume ; sans
//   charge : Reps max / Reps totales) ;
// - le niveau actuel en gros, et dessous l'écart depuis le début du bloc en cours ;
// - la courbe : blocs en fond de leur couleur, deload hachuré « D » et ses séances en points creux
//   (hors de la courbe), badge PR sur le record ; toucher un point ouvre sa bulle ;
// - les records de tout l'historique pour cette variante.
import { useParams, useSearchParams } from 'react-router'
import Card from '../../components/Card.tsx'
import ChipGroup from '../../components/ChipGroup.tsx'
import ScreenHeader from '../../components/ScreenHeader.tsx'
import SegmentedControl from '../../components/SegmentedControl.tsx'
import { IconFleche, IconFlecheBas } from '../../components/icons.tsx'
import { addWeeks, blockColor, blockEnd } from '../../lib/blocks.ts'
import { VARIANT_LABELS, type Variant } from '../../lib/exercises.ts'
import {
  LOADED_METRICS,
  METRIC_LABELS,
  PERIOD_LABELS,
  UNLOADED_METRICS,
  exercisePoints,
  exerciseRecords,
  exerciseSets,
  formatKg,
  formatMetric,
  formatSet,
  formatShortDate,
  isLoaded,
  metricParts,
  periodStart,
  progressOf,
  type Metric,
  type VariantFilter,
} from '../../lib/stats.ts'
import { useBlocks } from '../blocks/useBlocks.ts'
import { useAllSets, useExercisesById, useFinishedSessions } from '../sessions/useSession.ts'
import { useNowOnResume } from '../timer/useNow.ts'
import { TimeChart } from './charts.tsx'
import PeriodPicker from './PeriodPicker.tsx'
import { usePeriod, withPeriod } from './useStats.ts'
import { parseVariantParam, variantParam } from './variantParam.ts'

const sectionTitle = 'text-caption font-semibold tracking-[0.06em] text-muted uppercase'

/** Écart affiché sous le gros chiffre, avec l'unité de la mesure (« 5 kg », « 2 reps »). */
function formatChange(metric: Metric, change: number): string {
  const abs = Math.abs(change)
  if (metric === 'maxReps' || metric === 'totalReps') return `${Math.round(abs)} rep${Math.round(abs) > 1 ? 's' : ''}`
  if (metric === 'volume') return formatMetric('volume', abs)
  return formatKg(abs)
}

function RecordRow({ label, date, value }: { label: string; date: number; value: string }) {
  return (
    <div className="flex min-h-15 items-center gap-3 px-4">
      <span className="flex flex-1 flex-col gap-0.5">
        <span className="text-body-strong font-semibold">{label}</span>
        <span className="text-small text-muted">{formatShortDate(date)}</span>
      </span>
      <span className="num text-num-s">{value}</span>
    </div>
  )
}

function ExerciseStatsPage() {
  const { id = '' } = useParams()
  const [params, setParams] = useSearchParams()
  const [period] = usePeriod()
  const sessions = useFinishedSessions()
  const sets = useAllSets()
  const exercises = useExercisesById()
  const blocks = useBlocks()
  const now = useNowOnResume()
  if (!sessions || !sets || !exercises || !blocks) return null

  const exercise = exercises.get(id)
  const back = withPeriod('/stats/exercices', period)
  if (!exercise) {
    return (
      <main className="flex flex-1 flex-col gap-5 px-4 pt-2 pb-4">
        <ScreenHeader title="Exercice introuvable" backTo={back} backLabel="Retour aux exercices" size="m" />
      </main>
    )
  }

  const loaded = isLoaded(exercise)
  // Variantes proposées : celles de l'exercice et celles déjà utilisées (un exercice modifié depuis)
  const used = new Set(exerciseSets(id, 'all', sets).map((s) => s.variant))
  const variants: (Variant | null)[] = exercise.variants.length > 0 ? [...new Set<Variant>([...exercise.variants, ...[...used].filter((v): v is Variant => v !== null)])] : [null]
  // Par défaut : la variante la plus utilisée
  const counts = (v: Variant | null) => exerciseSets(id, v, sets).length
  const fallback = [...variants].sort((a, b) => counts(b) - counts(a))[0]
  const variant: VariantFilter = parseVariantParam(params.get('variante')) ?? fallback
  const metrics = loaded ? LOADED_METRICS : UNLOADED_METRICS
  const metric = metrics.find((m) => m === params.get('mesure')) ?? metrics[0]
  const setParam = (key: string, value: string) =>
    setParams(
      (current) => {
        const next = new URLSearchParams(current)
        next.set(key, value)
        return next
      },
      { replace: true },
    )

  const from = periodStart(period, now)
  const all = exercisePoints(id, variant, metric, sessions, sets)
  const points = all.filter((p) => p.time >= from)
  const kept = points.filter((p) => !p.deload)
  const latest = kept[kept.length - 1]
  const progress = progressOf(all, blocks, from, now)
  const best = all.reduce<(typeof all)[number] | undefined>((a, p) => (!a || p.value > a.value ? p : a), undefined)
  const records = exerciseRecords(id, variant, loaded, sessions, sets)
  const shownBlocks = blocks.filter((b) => b.startsOn < now && blockEnd(b) > from)
  const variantName = variant === 'all' ? 'toutes variantes' : variant ? VARIANT_LABELS[variant].toLowerCase() : null

  return (
    <main className="flex flex-1 flex-col gap-3 px-4 pt-2 pb-4">
      <ScreenHeader title={exercise.name} backTo={back} backLabel="Retour aux exercices" right={<PeriodPicker />} />

      {variants.length > 1 && (
        <ChipGroup
          label="Variante"
          scroll
          options={[...variants.map((v) => ({ value: variantParam(v), label: v ? VARIANT_LABELS[v] : 'Sans variante' })), { value: 'toutes', label: 'Toutes' }]}
          selected={[variantParam(variant)]}
          onToggle={(v) => setParam('variante', v)}
        />
      )}
      <SegmentedControl label="Mesure" options={metrics.map((m) => ({ value: m, label: METRIC_LABELS[m] }))} value={metric} onChange={(m) => setParam('mesure', m)} />

      <Card className="flex shrink-0 flex-col gap-3 px-4 py-3.5">
        {points.length === 0 ? (
          <p className="text-body text-muted">Pas de séance de cet exercice{variantName ? ` (${variantName})` : ''} en {PERIOD_LABELS[period]}.</p>
        ) : (
          <>
            <div>
              <span className="num text-display tracking-[-0.02em]">{latest ? metricParts(metric, latest.value).number : '—'}</span>
              {latest && <span className="ml-1 text-body font-semibold text-muted">{metricParts(metric, latest.value).unit}</span>}
              {progress && Math.abs(progress.change) >= 0.25 && (
                <div className="flex items-center gap-1 text-small text-muted">
                  {progress.change > 0 ? <IconFleche size={13} strokeWidth={3} /> : <IconFlecheBas size={13} strokeWidth={3} />}
                  <span>
                    <span className="sr-only">{progress.change > 0 ? 'Hausse de ' : 'Baisse de '}</span>
                    {formatChange(metric, progress.change)} {progress.blockName ? `depuis le début du bloc ${progress.blockName}` : `en ${PERIOD_LABELS[period]}`}
                  </span>
                </div>
              )}
            </div>
            <TimeChart
              label={`${METRIC_LABELS[metric]} ${exercise.name.toLowerCase()} en ${PERIOD_LABELS[period]}${kept.length > 0 ? ` : de ${formatMetric(metric, kept[0].value)} à ${formatMetric(metric, latest!.value)}` : ''}${points.some((p) => p.deload) ? ' ; séances de deload grisées' : ''}`}
              height={190}
              from={from}
              to={now}
              bands={shownBlocks.map((b) => ({ from: b.startsOn, to: blockEnd(b), color: blockColor(b), label: b.name }))}
              hatched={shownBlocks.flatMap((b) => b.deloadWeeks.map((w) => ({ from: addWeeks(b.startsOn, w - 1), to: addWeeks(b.startsOn, w) })))}
              line={kept.map((p) => ({ time: p.time, value: p.value }))}
              dots={points.map((p) => ({ time: p.time, value: p.value, kind: p.deload ? ('hollow' as const) : ('ink' as const) }))}
              record={best && best.time >= from && best.value > 0 ? { time: best.time, value: best.value } : undefined}
              tips={points.map((p) => ({
                time: p.time,
                value: p.value,
                title: formatShortDate(p.time),
                main: formatMetric(metric, p.value),
                detail: metric === 'volume' || metric === 'totalReps' ? undefined : formatSet(p.best),
              }))}
              format={(v) => metricParts(metric, v).number}
            />
          </>
        )}
      </Card>

      {(records.oneRepMax || records.maxReps) && (
        <>
          <h2 className={`${sectionTitle} mt-1`}>Records{variantName ? ` · ${variantName}` : ''}</h2>
          <Card className="shrink-0 divide-y divide-border overflow-hidden">
            {records.oneRepMax && <RecordRow label="1RM estimé" date={records.oneRepMax.time} value={formatKg(records.oneRepMax.value)} />}
            {records.maxWeight && <RecordRow label="Charge max" date={records.maxWeight.time} value={`${formatKg(records.maxWeight.set.weight)} × ${records.maxWeight.set.reps}`} />}
            {records.volume && <RecordRow label="Volume d’une séance" date={records.volume.time} value={formatMetric('volume', records.volume.value)} />}
            {records.maxReps && <RecordRow label="Reps max" date={records.maxReps.time} value={formatSet(records.maxReps.set)} />}
          </Card>
        </>
      )}
    </main>
  )
}

export default ExerciseStatsPage
