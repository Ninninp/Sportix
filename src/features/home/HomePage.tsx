// Onglet Séance — accueil (maquette J5 « Accueil · séance du jour », inspirée de Lyfta) :
// - « Cette semaine » : séances, durée, volume, chacun avec une flèche d'évolution par rapport à la
//   même période de la semaine passée (src/lib/week.ts), puis les pastilles des jours ;
// - « Autre séance » (lien discret) : choisir un autre jour du programme, ou une séance libre ;
// - la grande carte : séance en cours, séance du jour du programme actif, ou séance libre, avec
//   le bouton « Démarrer la séance » dans la zone du pouce (2 appuis depuis l'ouverture de l'app).
// - J6 : la ligne du bloc en cours (« Bloc Force » + barre des semaines), SOUS les chiffres de la
//   semaine et juste avant la grande carte (place choisie dans le canvas J6) ; elle ouvre le bloc.
import { useState, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router'
import Card from '../../components/Card.tsx'
import Sheet from '../../components/Sheet.tsx'
import { BadgeIncrease } from '../../components/Badge.tsx'
import { IconChevronDroite, IconFleche, IconFlecheBas, IconPartager } from '../../components/icons.tsx'
import { startProgramSession } from '../../db/programs.ts'
import { activeBlock, describeWeeks, weekSegments } from '../../lib/blocks.ts'
import { startSession } from '../../db/sessions.ts'
import { increaseBadge, lastPerformance } from '../../lib/progression.ts'
import { increaseSuggested, nextDay } from '../../lib/programs.ts'
import { formatNumber, groupSetsByExercise, type SessionSet } from '../../lib/sessions.ts'
import { isStandalone } from '../../lib/standalone.ts'
import { formatHoursMinutes, weekDays, weekStats, type Trend } from '../../lib/week.ts'
import WeekBar from '../blocks/WeekBar.tsx'
import { useBlocks } from '../blocks/useBlocks.ts'
import { useProgram } from '../programs/usePrograms.ts'
import { useNowOnResume } from '../timer/useNow.ts'
import { useActiveSession, useAllSets, useExercisesById, useFinishedSessions } from '../sessions/useSession.ts'
import { useSettings } from '../settings/useSettings.ts'

/** Flèche d'évolution à côté du libellé (rien si c'est pareil que la semaine passée). */
function TrendArrow({ trend }: { trend: Trend }) {
  if (trend === 'same') return null
  const up = trend === 'up'
  return (
    <span aria-label={`${up ? 'en hausse' : 'en baisse'} par rapport à la semaine passée`} className={`flex ${up ? 'text-text' : 'text-muted'}`}>
      {up ? <IconFleche size={13} strokeWidth={3} /> : <IconFlecheBas size={13} strokeWidth={3} />}
    </span>
  )
}

function WeekFigure({ label, trend, children }: { label: string; trend: Trend; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="flex items-center gap-1.5 text-small text-muted">
        {label}
        <TrendArrow trend={trend} />
      </span>
      <span className="num text-[24px] leading-7">{children}</span>
    </div>
  )
}

/** Ligne d'exercice dans la grande carte. */
function HeroRow({ first, name, increase, value }: { first: boolean; name: string; increase?: boolean; value?: string }) {
  return (
    <div className={`flex min-h-[38px] items-center gap-2 ${first ? '' : 'border-t border-on-inverse/15'}`}>
      <span className="flex-1 text-body-strong font-semibold">{name}</span>
      {increase && <BadgeIncrease> </BadgeIncrease>}
      {value && <span className="num text-num-s">{value}</span>}
    </div>
  )
}

type HeroRowData = { key: string; name: string; increase?: boolean; value?: string }

/**
 * La carte n'affiche que les 5 premiers exercices. Au-delà, la place manque sur un iPhone 14 et les
 * dernières lignes étaient coupées en deux par le bas de la carte, sans rien pour le signaler.
 */
const MAX_HERO_ROWS = 5
function heroRows(rows: HeroRowData[]) {
  const shown = rows.slice(0, MAX_HERO_ROWS)
  const rest = rows.length - shown.length
  return (
    <>
      {shown.map((r, i) => (
        <HeroRow key={r.key} first={i === 0} name={r.name} increase={r.increase} value={r.value} />
      ))}
      {rest > 0 && <HeroRow first={false} name={`+ ${rest} exercice${rest > 1 ? 's' : ''}`} />}
    </>
  )
}

/** Choix fait avec « Autre séance », pour aujourd'hui seulement : un jour du programme, ou libre. */
type Choice = { dayId: string } | 'libre' | null

function HomePage() {
  const navigate = useNavigate()
  const active = useActiveSession()
  const sessions = useFinishedSessions()
  const sets = useAllSets()
  const exercises = useExercisesById()
  const settings = useSettings()
  const program = useProgram(settings?.activeProgramId)
  const blocks = useBlocks()
  const [choice, setChoice] = useState<Choice>(null)
  const [choosing, setChoosing] = useState(false)
  // Pas de chrono sur l'accueil, mais l'heure est relue à chaque retour au premier plan : sinon
  // une app rouverte le lendemain garderait les chiffres et la pastille « aujourd'hui » de la veille.
  const now = useNowOnResume()

  if (
    active === undefined ||
    sessions === undefined ||
    sets === undefined ||
    exercises === undefined ||
    settings === undefined ||
    program === undefined ||
    blocks === undefined
  )
    return null

  const all = active ? [...sessions, active] : sessions
  const block = activeBlock(blocks, now)
  const stats = weekStats(all, sets, now)
  const days = weekDays(all, now)
  const history: SessionSet[] = sets.filter((s) => s.done)
  const nameOf = (id: string) => exercises.get(id)?.name ?? 'Exercice'

  // Séance proposée : celle choisie avec « Autre séance », sinon la prochaine du programme actif
  const programDays = program?.days ?? []
  const next = nextDay(programDays.map((d) => d.day), sessions)
  const planned =
    choice === 'libre' ? undefined : (programDays.find((d) => choice !== null && d.day.id === choice.dayId) ?? programDays.find((d) => d.day.id === next?.id))

  // Séance libre : les dernières charges des exercices travaillés le plus récemment
  const recent = [...new Set([...history].sort((a, b) => (b.doneAt ?? 0) - (a.doneAt ?? 0)).map((s) => s.exerciseId))]
    .slice(0, 5)
    .map((exerciseId) => {
      const latest = history.filter((s) => s.exerciseId === exerciseId).sort((a, b) => (b.doneAt ?? 0) - (a.doneAt ?? 0))[0]
      return {
        exerciseId,
        value: latest.weight > 0 ? `${formatNumber(latest.weight)} kg` : `× ${latest.reps}`,
        increase: latest.progression !== false && increaseBadge(lastPerformance(history, exerciseId, latest.variant), latest.variant) !== null,
      }
    })

  const plural = (n: number, word: string) => `${n} ${word}${n > 1 ? 's' : ''}`
  let hero: { title: string; sub: string; rows: ReactNode; cta: string; onStart: () => Promise<void> }
  if (active) {
    hero = {
      title: active.title ?? 'Séance en cours',
      sub: `Commencée à ${new Date(active.startedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`,
      rows: heroRows(
        groupSetsByExercise(sets.filter((s) => s.sessionId === active.id)).map((b) => ({
          key: String(b.exerciseOrder),
          name: nameOf(b.exerciseId),
          value: `${b.doneCount}/${b.sets.length}`,
        })),
      ),
      cta: 'Reprendre la séance',
      onStart: async () => {},
    }
  } else if (planned && program) {
    hero = {
      title: planned.day.name,
      sub: `${choice ? 'Séance choisie' : 'Prochaine séance'} · ${program.program.name} · ${plural(planned.exercises.length, 'exercice')}`,
      rows: heroRows(
        planned.exercises.map((pe) => ({ key: pe.id, name: nameOf(pe.exerciseId), increase: increaseSuggested(pe, history) })),
      ),
      cta: 'Démarrer la séance',
      onStart: async () => void (await startProgramSession(planned.day.id)),
    }
  } else {
    hero = {
      title: 'Séance libre',
      sub: recent.length > 0 ? 'Tes dernières charges, reprises automatiquement' : 'Pas besoin de programme pour commencer',
      rows: heroRows(recent.map((r) => ({ key: r.exerciseId, name: nameOf(r.exerciseId), increase: r.increase, value: r.value }))),
      cta: 'Démarrer la séance',
      onStart: async () => void (await startSession()),
    }
  }

  return (
    <main className="flex min-h-0 flex-1 flex-col gap-3 px-4 pt-2 pb-4">
      <h1 className="sr-only">Sportix</h1>

      {/* Premier lancement dans Safari : rappel d'installation */}
      {sessions.length === 0 && !active && !isStandalone(window) && (
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
      )}

      {/* Cette semaine : chiffres, évolution, pastilles des jours */}
      <section aria-label="Cette semaine" className="flex shrink-0 flex-col gap-1.5">
        <div className="-mr-3 flex min-h-12 items-center justify-between">
          <h2 className="text-caption font-semibold tracking-[0.06em] text-muted uppercase">Cette semaine</h2>
          {!active && programDays.length > 0 && (
            <button type="button" onClick={() => setChoosing(true)} className="min-h-12 px-3 text-body font-semibold text-muted underline underline-offset-[3px]">
              Autre séance
            </button>
          )}
        </div>
        <div className="grid grid-cols-3 gap-3">
          <WeekFigure label="Séances" trend={stats.sessions.trend}>
            {stats.sessions.value}
          </WeekFigure>
          <WeekFigure label="Durée" trend={stats.durationMs.trend}>
            {formatHoursMinutes(stats.durationMs.value)}
          </WeekFigure>
          <WeekFigure label="Volume" trend={stats.volume.trend}>
            {new Intl.NumberFormat('fr-FR').format(Math.round(stats.volume.value))}{' '}
            <span className="text-body font-semibold text-muted">kg</span>
          </WeekFigure>
        </div>
        <div className="mt-1.5 flex justify-center gap-[25px]">
          {days.map((d, i) => (
            <div
              key={i}
              className={`flex flex-col items-center gap-[3px] text-[11px] ${d.today ? 'font-extrabold text-text' : d.done ? 'font-semibold text-text' : 'font-semibold text-muted'}`}
            >
              <span
                className={`size-6 rounded-full ${
                  d.done ? 'border-2 border-inverse bg-inverse' : d.today ? 'border-[3px] border-text' : 'border-[1.5px] border-border-strong'
                }`}
              />
              {d.letter}
            </div>
          ))}
        </div>
      </section>

      {/* Bloc en cours : nom et barre des semaines */}
      {block && (
        <Link
          to={`/calendrier/${block.id}`}
          aria-label={`Bloc ${block.name}, ${describeWeeks(weekSegments(block, now))}`}
          className="flex min-h-13 shrink-0 items-center gap-3 rounded-lg border border-border bg-surface pr-3 pl-4 text-text"
        >
          <span className="max-w-[45%] truncate text-body whitespace-nowrap">
            <span className="text-muted">Bloc</span> <strong>{block.name}</strong>
          </span>
          <span className="min-w-0 flex-1">
            <WeekBar segments={weekSegments(block, now)} height={16} />
          </span>
          <span className="flex text-muted">
            <IconChevronDroite size={18} />
          </span>
        </Link>
      )}

      {/* Grande carte : séance en cours, séance du jour ou séance libre */}
      <Card inverse as="section" aria-label={hero.title} className="flex min-h-0 flex-1 flex-col gap-2 p-4">
        <div>
          <h2 className="text-title-l font-extrabold tracking-[-0.02em]">{hero.title}</h2>
          <p className="mt-1 truncate text-[14px] leading-[18px] text-on-inverse-muted">{hero.sub}</p>
        </div>
        <div className="flex min-h-0 flex-col overflow-hidden">{hero.rows}</div>
        <div className="flex-1" />
        <button
          type="button"
          onClick={async () => {
            await hero.onStart()
            navigate('/seance')
          }}
          className="flex min-h-15 shrink-0 items-center justify-center rounded-md bg-hero-action text-[20px] font-extrabold text-on-hero-action"
        >
          {hero.cta}
        </button>
      </Card>

      {/* Autre séance : les jours du programme, puis la séance libre */}
      <Sheet open={choosing} onClose={() => setChoosing(false)} label="Quelle séance aujourd’hui ?">
        <div>
          <h2 className="text-title font-bold">Quelle séance aujourd’hui ?</h2>
          {program && <p className="mt-1 text-body text-muted">{program.program.name}</p>}
        </div>
        <Card className="divide-y divide-border overflow-hidden">
          {programDays.map(({ day }) => (
            <DayOption
              key={day.id}
              name={day.name}
              selected={choice !== 'libre' && planned?.day.id === day.id}
              onSelect={() => {
                setChoice(day.id === next?.id ? null : { dayId: day.id })
                setChoosing(false)
              }}
            />
          ))}
        </Card>
        <Card className="overflow-hidden">
          <DayOption
            name="Séance libre"
            selected={choice === 'libre'}
            onSelect={() => {
              setChoice('libre')
              setChoosing(false)
            }}
          />
        </Card>
        <button type="button" onClick={() => setChoosing(false)} className="min-h-12 text-body font-semibold text-text underline underline-offset-[3px]">
          Fermer
        </button>
      </Sheet>
    </main>
  )
}

/** Une ligne du choix de séance, avec son rond de sélection. */
function DayOption({ name, selected, onSelect }: { name: string; selected: boolean; onSelect: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className="flex min-h-16 w-full items-center gap-3 px-4 text-left text-text active:bg-surface-2"
    >
      <span className="flex-1 text-body-strong font-semibold">{name}</span>
      <span aria-hidden="true" className={`size-6 rounded-full ${selected ? 'border-[7px] border-inverse' : 'border-[1.5px] border-border-strong'}`} />
    </button>
  )
}

export default HomePage
