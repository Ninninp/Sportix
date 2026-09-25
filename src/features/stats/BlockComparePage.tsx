// Comparer deux blocs (maquette J7) : par défaut le dernier bloc commencé et celui d'avant ;
// on change l'un ou l'autre en touchant sa carte. Séances et volume par semaine, puis le 1RM estimé
// gagné pendant chaque bloc, pour les exercices travaillés dans les deux.
// Le bloc le plus ancien (à gauche) en gris, le plus récent en encre ; chaque barre porte le nom de
// son bloc et sa valeur : la couleur n'est jamais le seul repère. Semaines de deload exclues.
import { useState } from 'react'
import { useSearchParams } from 'react-router'
import Card from '../../components/Card.tsx'
import ScreenHeader from '../../components/ScreenHeader.tsx'
import Sheet from '../../components/Sheet.tsx'
import { IconChevronBas, IconCoche } from '../../components/icons.tsx'
import { blockColor, blockLastDay, formatSpan, formatTonnage, weekIndexAt, type Block } from '../../lib/blocks.ts'
import { VARIANT_LABELS } from '../../lib/exercises.ts'
import { formatNumber } from '../../lib/sessions.ts'
import { blockFigures, blockGains, defaultComparison, formatKgChange, startedBlocks } from '../../lib/stats.ts'
import { colorVar } from '../blocks/blockColors.ts'
import { useBlocks } from '../blocks/useBlocks.ts'
import { useAllSets, useExercisesById, useFinishedSessions } from '../sessions/useSession.ts'
import { useNowOnResume } from '../timer/useNow.ts'
import { usePeriod, withPeriod } from './useStats.ts'

const sectionTitle = 'text-caption font-semibold tracking-[0.06em] text-muted uppercase'
const COLS = 'grid grid-cols-[minmax(0,1fr)_96px_96px] items-center gap-x-2'

function describe(block: Block, now: number): string {
  const week = weekIndexAt(block, now)
  return week !== null ? `en cours · S${week}/${block.weeks}` : formatSpan(block.startsOn, blockLastDay(block), now)
}

/** Carte d'un des deux blocs comparés ; la toucher ouvre le choix du bloc. */
function Picker({ block, side, now, onClick }: { block: Block; side: string; now: number; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`${side} bloc : ${block.name}, ${describe(block, now)}, changer`}
      className="box-border flex min-h-16 min-w-0 flex-col gap-0.5 rounded-md border-[1.5px] border-border-strong bg-surface px-3 py-2.5 text-left text-text"
    >
      <span className="flex items-center gap-1.5">
        <span aria-hidden="true" className="size-3 shrink-0 rounded-full" style={{ background: colorVar(blockColor(block)) }} />
        <span className="min-w-0 flex-1 truncate text-body-strong font-bold">{block.name}</span>
        <span className="flex text-muted">
          <IconChevronBas size={16} strokeWidth={2.5} />
        </span>
      </span>
      <span className="truncate text-small whitespace-nowrap text-muted">{describe(block, now)}</span>
    </button>
  )
}

/** Barre du 1RM gagné pendant un bloc : nom du bloc, barre (longueur relative à `max`), valeur. */
function Bar({ name, value, strong, max }: { name: string; value: number; strong: boolean; max: number }) {
  return (
    <div className="flex h-[22px] items-center gap-2">
      <span className="w-[88px] shrink-0 truncate text-small text-muted">{name}</span>
      <span
        aria-hidden="true"
        className={`h-3 rounded-r-[4px] ${strong ? 'bg-text' : 'bg-border-strong'}`}
        style={{ width: `calc((100% - 160px) * ${Math.abs(value) / max})`, minWidth: value === 0 ? 0 : 2 }}
      />
      <span className={`num text-body ${strong ? '' : 'text-muted'}`}>{formatKgChange(value)}</span>
    </div>
  )
}

function BlockCompareFallback({ back }: { back: string }) {
  return (
    <main className="flex flex-1 flex-col gap-3 px-4 pt-2 pb-4">
      <ScreenHeader title="Comparer" backTo={back} backLabel="Retour aux stats" />
      <p className="text-body text-muted">Il faut au moins deux blocs commencés pour les comparer.</p>
    </main>
  )
}

function BlockComparePage() {
  const [params, setParams] = useSearchParams()
  const [period] = usePeriod()
  const back = withPeriod('/stats', period)
  const blocks = useBlocks()
  const sessions = useFinishedSessions()
  const sets = useAllSets()
  const exercises = useExercisesById()
  const now = useNowOnResume()
  // Carte dont on change le bloc (0 = gauche, 1 = droite), ou null
  const [picking, setPicking] = useState<0 | 1 | null>(null)
  if (!blocks || !sessions || !sets || !exercises) return null

  const started = startedBlocks(blocks, now)
  const fallback = defaultComparison(blocks, now)
  if (!fallback) return <BlockCompareFallback back={back} />
  const find = (id: string | null) => started.find((b) => b.id === id)
  const chosen: [Block, Block] = [find(params.get('a')) ?? fallback[0], find(params.get('b')) ?? fallback[1]]
  // Le plus ancien à gauche, quel que soit l'ordre du choix
  const [a, b] = chosen[0].startsOn <= chosen[1].startsOn ? chosen : [chosen[1], chosen[0]]
  const fa = blockFigures(a, sessions, sets, now)
  const fb = blockFigures(b, sessions, sets, now)
  const gains = blockGains(a, b, sessions, sets)
  const max = Math.max(1, ...gains.flatMap((g) => g.gains.map(Math.abs)))

  const choose = (block: Block) => {
    if (picking === null) return
    const next: [Block, Block] = [a, b]
    next[picking] = block
    setParams({ a: next[0].id, b: next[1].id, periode: period }, { replace: true })
    setPicking(null)
  }

  return (
    <main className="flex flex-1 flex-col gap-3 px-4 pt-2 pb-4">
      <ScreenHeader title="Comparer" backTo={back} backLabel="Retour aux stats" />
      <div className="grid shrink-0 grid-cols-2 gap-2">
        <Picker block={a} side="Premier" now={now} onClick={() => setPicking(0)} />
        <Picker block={b} side="Second" now={now} onClick={() => setPicking(1)} />
      </div>

      <Card className="shrink-0 px-4">
        <div className={`${COLS} min-h-11`}>
          <span className="text-body text-muted">Séances / sem.</span>
          <span className="num text-right text-num-s text-muted">{formatNumber(Math.round(fa.sessionsPerWeek * 10) / 10)}</span>
          <span className="num text-right text-num-s">{formatNumber(Math.round(fb.sessionsPerWeek * 10) / 10)}</span>
        </div>
        <div className={`${COLS} min-h-11 border-t border-border`}>
          <span className="text-body text-muted">Volume / sem.</span>
          <span className="num text-right text-num-s text-muted">{formatTonnage(fa.volumePerWeek)}</span>
          <span className="num text-right text-num-s">{formatTonnage(fb.volumePerWeek)}</span>
        </div>
      </Card>

      <h2 className={`${sectionTitle} mt-1`}>1RM estimé · gagné pendant le bloc</h2>
      {gains.length === 0 ? (
        <p className="text-body text-muted">Aucun exercice avec charge travaillé dans les deux blocs.</p>
      ) : (
        <Card className="shrink-0 divide-y divide-border px-4">
          {gains.map((g) => (
            <div key={`${g.exerciseId}|${g.variant}`} className="flex flex-col gap-1 py-2.5">
              <span className="text-body-strong font-semibold">
                {exercises.get(g.exerciseId)?.name ?? 'Exercice'}
                {g.variant && g.variant !== 'barre' && <span className="font-normal text-muted"> · {VARIANT_LABELS[g.variant]}</span>}
              </span>
              <Bar name={a.name} value={g.gains[0]} strong={false} max={max} />
              <Bar name={b.name} value={g.gains[1]} strong max={max} />
            </div>
          ))}
        </Card>
      )}
      <p className="shrink-0 text-center text-small text-muted">Semaines de deload exclues</p>

      <Sheet open={picking !== null} onClose={() => setPicking(null)} label="Choisir un bloc">
        <h2 className="text-title font-bold">Choisir un bloc</h2>
        <div className="flex max-h-[60dvh] flex-col overflow-y-auto">
          {[...started].reverse().map((block) => {
            const current = picking !== null && [a, b][picking].id === block.id
            const other = picking !== null && [a, b][1 - picking].id === block.id
            return (
              <button
                key={block.id}
                type="button"
                disabled={other}
                aria-pressed={current}
                onClick={() => choose(block)}
                className="flex min-h-14 items-center gap-3 rounded-md px-3 text-left text-text active:bg-surface-2 disabled:text-faint"
              >
                <span aria-hidden="true" className="size-3 shrink-0 rounded-full" style={{ background: colorVar(blockColor(block)) }} />
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-body-strong font-semibold">{block.name}</span>
                  <span className="text-small text-muted">{other ? 'déjà comparé' : describe(block, now)}</span>
                </span>
                {current && <IconCoche size={22} />}
              </button>
            )
          })}
        </div>
      </Sheet>
    </main>
  )
}

export default BlockComparePage
