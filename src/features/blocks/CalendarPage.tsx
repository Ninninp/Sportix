// Onglet Calendrier (maquettes J6 « Calendrier · le mois » et « Calendrier · aucun bloc ») :
// - la grille du mois, avec à gauche la semaine du bloc (S1, S2, D pour un deload) ;
//   jours d'un bloc sur fond plein, point sous les jours travaillés, aujourd'hui cerclé ;
// - on change de mois avec les flèches pour retrouver les autres blocs ;
// - en bas, la carte du bloc en cours (ou du prochain), qui ouvre son détail.
// Toucher un jour d'un bloc ouvre aussi ce bloc.
import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import Button from '../../components/Button.tsx'
import Card from '../../components/Card.tsx'
import { IconChevronDroite, IconChevronGauche, IconPlus } from '../../components/icons.tsx'
import {
  activeBlock,
  addMonths,
  blockLastDay,
  blockSessions,
  describeWeeks,
  formatMonth,
  formatSpan,
  monthGrid,
  monthStart,
  plannedSessions,
  weekIndexAt,
  weekSegments,
  type Block,
  type CalendarDay,
} from '../../lib/blocks.ts'
import type { Session } from '../../lib/sessions.ts'
import { usePrograms, type ProgramWithDays } from '../programs/usePrograms.ts'
import { useFinishedSessions } from '../sessions/useSession.ts'
import { useNowOnResume } from '../timer/useNow.ts'
import { useBlocks } from './useBlocks.ts'
import WeekBar from './WeekBar.tsx'

const DAY_LETTERS = ['L', 'M', 'M', 'J', 'V', 'S', 'D']
const COLS = 'grid grid-cols-[26px_repeat(7,minmax(0,1fr))] gap-1'

function CalendarPage() {
  const navigate = useNavigate()
  const blocks = useBlocks()
  const sessions = useFinishedSessions()
  const programs = usePrograms()
  const now = useNowOnResume()
  // Mois affiché : celui d'aujourd'hui au départ (état de l'écran, pas en base).
  const [month, setMonth] = useState(() => monthStart(Date.now()))

  if (blocks === undefined || sessions === undefined || programs === undefined) return null

  if (blocks.length === 0) {
    return (
      <main className="flex flex-1 flex-col gap-3 px-4 pt-2 pb-4">
        <h1 className="text-title-l font-extrabold tracking-[-0.02em]">Calendrier</h1>
        <Card className="flex shrink-0 flex-col gap-2 p-4">
          <h2 className="text-title font-extrabold">Aucun bloc pour l’instant</h2>
          <p className="text-body text-muted">
            Un bloc, c’est un objectif sur quelques semaines (« Force, 5 semaines »). Tes séances s’y rattachent toutes
            seules : tu pourras comparer un bloc à l’autre.
          </p>
        </Card>
        <div className="flex-1" />
        <Button to="/calendrier/nouveau">Créer un bloc</Button>
      </main>
    )
  }

  const grid = monthGrid(month, blocks, sessions, now)
  const byId = new Map(blocks.map((b) => [b.id, b]))
  const shown = [...new Set(grid.flatMap((w) => w.days.filter((d) => d.inMonth && d.blockId).map((d) => d.blockId!)))].map((id) => byId.get(id)!)
  const deloadRow = grid.find((w) => w.label === 'D')
  // Carte du bas : le bloc en cours, sinon le prochain à venir.
  const featured = activeBlock(blocks, now) ?? blocks.find((b) => b.startsOn > now)

  return (
    <main className="flex flex-1 flex-col gap-2.5 px-4 pt-2 pb-4">
      <header className="-mr-2 flex shrink-0 items-center gap-1">
        <h1 className="flex-1 text-title-l font-extrabold tracking-[-0.02em]">Calendrier</h1>
        <Link
          to="/calendrier/nouveau"
          aria-label="Nouveau bloc"
          className="flex size-12 items-center justify-center rounded-full text-text"
        >
          <span className="flex size-11 items-center justify-center rounded-full border-[1.5px] border-border-strong">
            <IconPlus size={22} />
          </span>
        </Link>
      </header>

      <div className="-mx-2 flex shrink-0 items-center justify-between">
        <button type="button" aria-label="Mois précédent" onClick={() => setMonth((m) => addMonths(m, -1))} className="flex size-12 items-center justify-center rounded-md text-text">
          <IconChevronGauche />
        </button>
        <span aria-live="polite" className="text-body-strong font-bold">
          {formatMonth(month)}
        </span>
        <button type="button" aria-label="Mois suivant" onClick={() => setMonth((m) => addMonths(m, 1))} className="flex size-12 items-center justify-center rounded-md text-text">
          <IconChevronDroite />
        </button>
      </div>

      <div role="table" aria-label={formatMonth(month)} className="flex shrink-0 flex-col gap-1">
        <div role="row" className={COLS}>
          <span role="columnheader" />
          {DAY_LETTERS.map((d, i) => (
            <span key={i} role="columnheader" className="text-center text-[11px] font-bold tracking-[0.06em] text-muted">
              {d}
            </span>
          ))}
        </div>
        {grid.map((week) => (
          <div key={week.days[0].time} role="row" className={COLS}>
            <span role="rowheader" className={`flex items-center justify-center text-[11px] font-extrabold ${week.label ? 'text-muted' : 'text-transparent'}`}>
              {week.label || '·'}
            </span>
            {week.days.map((d) => (
              <DayCell key={d.time} day={d} onOpen={d.blockId ? () => navigate(`/calendrier/${d.blockId}`) : undefined} />
            ))}
          </div>
        ))}
      </div>

      <div className="flex shrink-0 flex-wrap gap-x-4 gap-y-1 text-caption text-muted">
        {/* Une seule couleur pour tous les blocs : deux blocs qui se suivent se distinguent par le
            retour à « S1 » dans la colonne de gauche, d'où une seule entrée de légende. */}
        {shown.length > 0 && (
          <span className="inline-flex items-center gap-1.5">
            <span aria-hidden="true" className="size-3.5 shrink-0 rounded-[4px] bg-surface-2" />
            {shown.length === 1 ? 'bloc' : 'blocs'} {shown.map((b) => b.name).join(', ')}
          </span>
        )}
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden="true" className="size-1.5 rounded-full bg-text" />
          séance faite
        </span>
        {deloadRow && (
          <span className="inline-flex items-center gap-1.5">
            <span aria-hidden="true" className="box-border size-3.5 rounded-[4px] border-[1.5px] border-dashed border-border-strong" />
            deload
          </span>
        )}
      </div>

      <div className="flex-1" />
      {featured && <FeaturedBlock block={featured} sessions={sessions} programs={programs} now={now} />}
    </main>
  )
}

function DayCell({ day, onOpen }: { day: CalendarDay; onOpen?: () => void }) {
  const look =
    `box-border flex h-[46px] flex-col items-center justify-center gap-[3px] rounded-[10px] ` +
    (day.blockId ? 'bg-surface-2 ' : '') +
    (day.deload ? 'border-[1.5px] border-dashed border-border-strong ' : '') +
    (day.today ? 'shadow-[inset_0_0_0_2px_var(--color-text)] ' : '')
  const label = new Date(day.time).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
  const content = (
    <>
      <span className={`num text-body ${day.today ? 'font-extrabold' : 'font-semibold'} ${day.inMonth ? 'text-text' : 'text-faint'}`}>{day.date}</span>
      <span aria-hidden="true" className={`size-1.5 rounded-full ${day.done ? 'bg-text' : 'bg-transparent'}`} />
    </>
  )
  const a11y = `${label}${day.today ? ', aujourd’hui' : ''}${day.done ? ', séance faite' : ''}`
  return (
    <span role="cell">
      {onOpen ? (
        <button type="button" onClick={onOpen} aria-label={`${a11y}, ouvrir le bloc`} className={`${look} w-full`}>
          {content}
        </button>
      ) : (
        <span aria-label={a11y} className={look}>
          {content}
        </span>
      )}
    </span>
  )
}

/** Carte inversée du bloc en cours : nom, dates, barre des semaines, séances faites / prévues. */
function FeaturedBlock({ block, sessions, programs, now }: { block: Block; sessions: Session[]; programs: ProgramWithDays[]; now: number }) {
  const segments = weekSegments(block, now)
  const program = programs.find((p) => p.program.id === block.programId)
  const done = blockSessions(block, sessions).length
  const planned = plannedSessions(block, program?.days.length ?? 0)
  const week = weekIndexAt(block, now)
  return (
    <Card inverse as="section" aria-label={`Bloc ${block.name}, ${describeWeeks(segments)}`} className="flex shrink-0 flex-col gap-3 p-4">
      <div className="flex items-baseline gap-2">
        <h2 className="min-w-0 flex-1 truncate text-[24px] leading-7 font-extrabold tracking-[-0.02em]">{block.name}</h2>
        <span className="num shrink-0 text-body text-on-inverse-muted">{formatSpan(block.startsOn, blockLastDay(block), now)}</span>
      </div>
      <WeekBar segments={segments} onInverse />
      <div className="flex items-end gap-3">
        <div className="min-w-0 flex-1">
          <div className="truncate text-body font-semibold">
            {week !== null ? `Semaine ${week} sur ${block.weeks}` : `Commence le ${new Date(block.startsOn).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}`}
            {program && ` · ${program.program.name}`}
          </div>
          <div className="num mt-0.5 text-small text-on-inverse-muted">
            {/* Faites = séances terminées rattachées au bloc ; prévues = jours du programme × semaines du bloc. */}
            {planned !== null ? `${done} faite${done > 1 ? 's' : ''} sur ${planned} prévues` : `${done} séance${done > 1 ? 's' : ''} faite${done > 1 ? 's' : ''}`}
          </div>
        </div>
        <Link
          to={`/calendrier/${block.id}`}
          className="inline-flex min-h-12 shrink-0 items-center rounded-md bg-hero-action px-4 text-body font-bold text-on-hero-action"
        >
          Ouvrir
        </Link>
      </div>
    </Card>
  )
}

export default CalendarPage
