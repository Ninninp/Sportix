// Séance « en liste » (maquette J5, inspirée de Lyfta, retenue le 21/09/2026) : toute la séance
// dans une liste qui défile. L'exercice ouvert est déplié en tableau N° · Dernière fois · Kg · Reps · ✓ ;
// les autres sont repliés sur une ligne (« Presse à cuisses · 0/3 ») : un appui les ouvre.
// Remplace les pastilles, le sous-titre, la barre de progression et « Ensuite ».
// J9 (maquettes validées le 28/09/2026) : un superset est une seule carte « Superset » qui contient
// ses exercices l'un sous l'autre (un seul « + Série » : un tour de plus) ; les séries
// d'échauffement sont des lignes « É », plus basses, avant les séries de travail.
import { useEffect, useRef } from 'react'
import { Link } from 'react-router'
import Card from '../../components/Card.tsx'
import { IconChevronBas, IconCoche, IconLien, IconOptions, IconPlus } from '../../components/icons.tsx'
import type { Exercise } from '../../lib/exercises.ts'
import { lastPerformance } from '../../lib/progression.ts'
import {
  formatNumber,
  formatTarget,
  isWorkSet,
  supersetGroups,
  workIndex,
  type ExerciseBlock,
  type SessionSet,
} from '../../lib/sessions.ts'

const COLUMNS = 'grid grid-cols-[28px_minmax(0,1fr)_76px_48px_36px] gap-x-2'

type Props = {
  blocks: ExerciseBlock[]
  openOrder: number | null
  editingId: string | undefined
  exercises: Map<string, Exercise>
  history: SessionSet[]
  onOpen: (exerciseOrder: number) => void
  /** « + Série » : un exercice seul, ou tous ceux d'un superset (un tour de plus). */
  onAddSet: (exerciseOrders: number[]) => void
  onAddWarmup: (exerciseOrder: number) => void
  onMenu: (exerciseOrder: number) => void
}

function SessionList({ blocks, openOrder, editingId, exercises, history, onOpen, onAddSet, onAddWarmup, onMenu }: Props) {
  // L'exercice ouvert reste visible quand la liste défile (ex. passage à l'exercice suivant)
  const openRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    openRef.current?.scrollIntoView({ block: 'nearest' })
  }, [openOrder])

  const nameOf = (b: ExerciseBlock) => exercises.get(b.exerciseId)?.name ?? 'Exercice'

  // En-tête et tableau des séries d'un exercice ouvert
  const exerciseTable = (b: ExerciseBlock) => {
    const name = nameOf(b)
    const last = lastPerformance(history, b.exerciseId, b.variant)
    const firstWork = b.sets.find(isWorkSet)
    const target = formatTarget(firstWork?.targetRepsMin, firstWork?.targetRepsMax)
    return (
      <>
        <div className="flex items-center gap-2 pt-1.5 pb-0.5 pl-1.5">
          <div className="flex flex-1 items-baseline gap-2">
            <h1 className="text-[20px] leading-6 font-extrabold">{name}</h1>
            {target && <span className="num text-body font-medium text-muted">{target} reps</span>}
          </div>
          <button
            type="button"
            aria-label={`Options de ${name}`}
            onClick={() => onMenu(b.exerciseOrder)}
            className="flex size-12 shrink-0 items-center justify-center rounded-md text-text"
          >
            <IconOptions />
          </button>
        </div>
        {/* Vrai tableau pour les lecteurs d'écran : un `role="row"` doit être contenu dans un
            `role="table"`, sinon VoiceOver ignore les lignes et ne lit pas charge et reps. */}
        <div role="table" aria-label={`Séries — ${name}`} className="flex flex-col gap-1">
          <div role="row" className={`${COLUMNS} px-2.5 text-[11px] font-semibold tracking-[0.06em] text-muted uppercase`}>
            <span role="columnheader">N°</span>
            <span role="columnheader">Dernière fois</span>
            <span role="columnheader" className="text-right">Kg</span>
            <span role="columnheader" className="text-right">Reps</span>
            <span role="columnheader" />
          </div>
          {b.sets.map((s) => {
            const warmup = s.warmup === true
            // « Dernière fois » : la série de travail de même rang (rien pour un échauffement)
            const previous = warmup ? undefined : last?.sets[workIndex(b, s)]
            const state = s.done ? 'done' : s.id === editingId ? 'now' : 'next'
            const label = warmup ? 'Échauffement' : `Série ${s.order}`
            return (
              <div
                key={s.id}
                role="row"
                aria-label={`${label}${state === 'done' ? ', faite' : state === 'now' ? ', en cours' : ''}`}
                aria-current={state === 'now' ? 'true' : undefined}
                className={`${COLUMNS} ${warmup ? 'min-h-11' : 'min-h-13'} items-center rounded-[10px] px-2.5 ${
                  state === 'done' ? 'bg-surface-2 text-muted' : state === 'now' ? 'bg-inverse text-on-inverse' : 'text-faint'
                }`}
              >
                <span role="cell" className="num text-body">{warmup ? 'É' : s.order}</span>
                <span role="cell" className={`num text-body font-medium ${state === 'now' ? 'text-on-inverse-muted' : ''}`}>
                  {warmup ? '' : previous ? `${previous.weight > 0 ? `${formatNumber(previous.weight)} × ` : '× '}${previous.reps}` : '—'}
                </span>
                <span role="cell" className={`num text-right ${warmup ? 'text-[18px]' : 'text-[22px]'}`}>
                  {s.weight > 0 ? formatNumber(s.weight) : '—'}
                </span>
                <span role="cell" className={`num text-right ${warmup ? 'text-[18px]' : 'text-[22px]'}`}>{s.reps}</span>
                <span role="cell" className="flex justify-end">
                  {state === 'done' ? (
                    <span aria-hidden="true" className="flex size-7 items-center justify-center rounded-full bg-text text-bg">
                      <IconCoche size={18} strokeWidth={3} />
                    </span>
                  ) : (
                    <span
                      aria-hidden="true"
                      className={`size-7 rounded-full border-[1.5px] ${state === 'now' ? 'border-on-inverse' : 'border-dashed border-border-strong'}`}
                    />
                  )}
                </span>
              </div>
            )
          })}
        </div>
      </>
    )
  }

  const addSetButton = (orders: number[]) => (
    <button type="button" onClick={() => onAddSet(orders)} className="min-h-11 px-1.5 text-body font-semibold text-text">
      + Série
    </button>
  )

  return (
    <div className="-mx-4 min-h-0 flex-1 overflow-y-auto px-4">
      <div className="flex flex-col gap-2 pb-1">
        {supersetGroups(blocks).map((group) => {
          const key = group[0].exerciseOrder
          const open = group.some((b) => b.exerciseOrder === openOrder)
          const superset = group.length > 1

          if (!open) {
            const done = group.reduce((n, b) => n + b.doneCount, 0)
            const total = group.reduce((n, b) => n + b.workCount, 0)
            return (
              <button
                key={key}
                type="button"
                onClick={() => onOpen(key)}
                className="flex min-h-14 shrink-0 items-center gap-3 rounded-lg border border-border bg-surface pr-2 pl-4 text-left text-text"
              >
                {superset && (
                  <span aria-hidden="true" className="flex text-muted">
                    <IconLien size={18} />
                  </span>
                )}
                <span className="flex-1 text-body-strong font-semibold">
                  {superset && <span className="sr-only">Superset : </span>}
                  {group.map(nameOf).join(' + ')}
                </span>
                <span className="num text-body font-medium text-muted">
                  {done}/{total}
                </span>
                <span className="flex text-muted">
                  <IconChevronBas size={20} />
                </span>
              </button>
            )
          }

          if (!superset) {
            const b = group[0]
            return (
              <Card key={key} className="flex shrink-0 flex-col gap-1 p-1.5">
                <div ref={openRef} className="flex scroll-mt-2 flex-col gap-1">
                  {exerciseTable(b)}
                </div>
                <div className="flex justify-between">
                  {addSetButton([b.exerciseOrder])}
                  <button
                    type="button"
                    onClick={() => onAddWarmup(b.exerciseOrder)}
                    className="min-h-11 px-1.5 text-body font-semibold text-text"
                  >
                    + Échauffement
                  </button>
                </div>
              </Card>
            )
          }

          return (
            <Card key={key} className="flex shrink-0 flex-col gap-1 p-1.5">
              <div ref={openRef} className="flex scroll-mt-2 items-center gap-1.5 px-1.5 pt-1.5 text-muted">
                <IconLien size={16} strokeWidth={2.5} />
                <span className="text-caption font-semibold tracking-[0.06em] uppercase">Superset</span>
              </div>
              {group.map((b, i) => (
                <div key={b.exerciseOrder} className="flex flex-col gap-1">
                  {i > 0 && <div className="mx-1.5 my-1 h-px bg-border" />}
                  {exerciseTable(b)}
                </div>
              ))}
              <div className="flex">{addSetButton(group.map((b) => b.exerciseOrder))}</div>
            </Card>
          )
        })}
        <Link
          to="/seance/exercices"
          className="flex min-h-13 shrink-0 items-center justify-center gap-2 rounded-lg border-[1.5px] border-dashed border-border-strong text-body font-semibold text-text no-underline"
        >
          <IconPlus size={20} />
          Ajouter un exercice
        </Link>
      </div>
    </div>
  )
}

export default SessionList
