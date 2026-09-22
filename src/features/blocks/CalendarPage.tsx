// Onglet Calendrier (maquettes J6 « Calendrier · le mois » et « Calendrier · aucun bloc ») :
// - la grille du mois, avec à gauche la semaine du bloc (S1, S2, D pour un deload) ;
//   jours d'un bloc sur fond plein, point sous les jours travaillés, aujourd'hui cerclé ;
// - on change de mois avec les flèches pour retrouver les autres blocs ;
// - chaque bloc a sa couleur ; un jour commun à deux blocs (chevauchement) est coupé en deux ;
// - en bas, le bloc en cours (ou le prochain), dans une carte qui ouvre son détail.
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
  blockColor,
  blockEnd,
  formatDayMonth,
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
import { useFinishedSessions } from '../sessions/useSession.ts'
import { useNowOnResume } from '../timer/useNow.ts'
import { cellBackground, colorVar } from './blockColors.ts'
import { useBlocks } from './useBlocks.ts'
import WeekBar from './WeekBar.tsx'

const DAY_LETTERS = ['L', 'M', 'M', 'J', 'V', 'S', 'D']
const COLS = 'grid grid-cols-[26px_repeat(7,minmax(0,1fr))] gap-1'

function CalendarPage() {
  const navigate = useNavigate()
  const blocks = useBlocks()
  const sessions = useFinishedSessions()
  const now = useNowOnResume()
  // Mois affiché : celui d'aujourd'hui au départ (état de l'écran, pas en base).
  const [month, setMonth] = useState(() => monthStart(Date.now()))

  if (blocks === undefined || sessions === undefined) return null

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
  // Blocs présents dans le mois (y compris celui « dessous » un chevauchement), par date de début.
  const monthEnd = addMonths(month, 1)
  const shown = blocks.filter((b) => b.startsOn < monthEnd && blockEnd(b) > month)
  const deloadRow = grid.find((w) => w.label === 'D')
  // Légende du point seulement s'il y a au moins une séance dans le mois affiché.
  const anyDone = grid.some((w) => w.days.some((d) => d.inMonth && d.done))
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
        {/* Une entrée par bloc visible dans le mois, avec sa couleur. */}
        {shown.map((b) => (
          <span key={b.id} className="inline-flex items-center gap-1.5">
            <span aria-hidden="true" className="size-3.5 shrink-0 rounded-[4px]" style={{ background: colorVar(blockColor(b)) }} />
            {b.name}
          </span>
        ))}
        {anyDone && (
          <span className="inline-flex items-center gap-1.5">
            <span aria-hidden="true" className="size-1.5 rounded-full bg-text" />
            séance
          </span>
        )}
        {deloadRow && (
          <span className="inline-flex items-center gap-1.5">
            <span aria-hidden="true" className="box-border size-3.5 rounded-[4px] border-[1.5px] border-dashed border-border-strong" />
            deload
          </span>
        )}
      </div>

      <div className="flex-1" />
      {featured && <FeaturedBlock block={featured} sessions={sessions} now={now} />}
    </main>
  )
}

function DayCell({ day, onOpen }: { day: CalendarDay; onOpen?: () => void }) {
  // Sur une couleur de bloc, tout passe en `on-block` / `on-block-muted` (tokens J6) : texte,
  // point, cercle d'aujourd'hui et pointillés du deload restent lisibles sur toutes les teintes.
  const onBlock = day.colors.length > 0
  const look =
    `box-border flex h-[46px] flex-col items-center justify-center gap-[3px] rounded-[10px] ` +
    (day.deload ? `border-[1.5px] border-dashed ${onBlock ? 'border-on-block-muted' : 'border-border-strong'} ` : '') +
    (day.today ? `${onBlock ? 'shadow-[inset_0_0_0_2px_var(--color-on-block)]' : 'shadow-[inset_0_0_0_2px_var(--color-text)]'} ` : '')
  const dayColor = onBlock ? (day.inMonth ? 'text-on-block' : 'text-on-block-muted') : day.inMonth ? 'text-text' : 'text-faint'
  const label = new Date(day.time).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
  const content = (
    <>
      <span className={`num text-body ${day.today ? 'font-extrabold' : 'font-semibold'} ${dayColor}`}>{day.date}</span>
      <span aria-hidden="true" className={`size-1.5 rounded-full ${day.done ? (onBlock ? 'bg-on-block' : 'bg-text') : 'bg-transparent'}`} />
    </>
  )
  const a11y = `${label}${day.today ? ', aujourd’hui' : ''}${day.done ? ', séance faite' : ''}`
  return (
    <span role="cell">
      {onOpen ? (
        <button type="button" onClick={onOpen} aria-label={`${a11y}, ouvrir le bloc`} className={`${look} w-full`} style={{ background: cellBackground(day.colors) }}>
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

/**
 * Rappel du bloc en cours (ou du prochain), en bas de l'écran : carte ordinaire (pas inversée),
 * entièrement touchable — pastille de couleur, nom et dates, barre des semaines, puis « Semaine 2/5 ·
 * 4/15 séances ». Choisie le 22/09/2026 (option « carte claire, sans bouton ») à la place de la
 * grande carte inversée de la maquette.
 */
function FeaturedBlock({ block, sessions, now }: { block: Block; sessions: Session[]; now: number }) {
  const segments = weekSegments(block, now)
  const done = blockSessions(block, sessions).length
  const planned = plannedSessions(block)
  const week = weekIndexAt(block, now)
  // Faites = séances terminées rattachées au bloc ; prévues = séances par semaine × semaines.
  const count = planned !== null ? `${done}/${planned} séances` : `${done} séance${done > 1 ? 's' : ''}`
  const when = week !== null ? `Semaine ${week}/${block.weeks}` : `Début le ${formatDayMonth(block.startsOn)}`
  return (
    <Link
      to={`/calendrier/${block.id}`}
      aria-label={`Bloc ${block.name}, ${describeWeeks(segments)}, ${count}, ouvrir`}
      className="flex shrink-0 flex-col gap-3 rounded-lg border border-border bg-surface p-4 text-text"
    >
      <span className="flex items-center gap-2">
        <span aria-hidden="true" className="size-3.5 shrink-0 rounded-full" style={{ background: colorVar(blockColor(block)) }} />
        <span className="min-w-0 flex-1 truncate text-title font-extrabold tracking-[-0.02em]">{block.name}</span>
        <span className="num shrink-0 text-body text-muted">{formatSpan(block.startsOn, blockLastDay(block), now)}</span>
      </span>
      <WeekBar segments={segments} />
      <span className="flex items-center gap-2">
        <span className="num flex-1 truncate text-body font-semibold">
          {when} <span className="text-muted">· {count}</span>
        </span>
        <span aria-hidden="true" className="flex text-muted">
          <IconChevronDroite size={20} />
        </span>
      </span>
    </Link>
  )
}

export default CalendarPage
