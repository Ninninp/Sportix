// Séance « en liste » (maquette J5, inspirée de Lyfta, retenue le 21/09/2026) : toute la séance
// dans une liste qui défile. L'exercice ouvert est déplié en tableau N° · Dernière fois · Kg · Reps · ✓ ;
// les autres sont repliés sur une ligne (« Presse à cuisses · 0/3 ») : un appui les ouvre.
// Remplace les pastilles, le sous-titre, la barre de progression et « Ensuite ».
import { useEffect, useRef } from 'react'
import { Link } from 'react-router'
import Card from '../../components/Card.tsx'
import { IconChevronBas, IconCoche, IconOptions, IconPlus } from '../../components/icons.tsx'
import type { Exercise } from '../../lib/exercises.ts'
import { lastPerformance } from '../../lib/progression.ts'
import { formatNumber, formatTarget, type ExerciseBlock, type SessionSet } from '../../lib/sessions.ts'

const COLUMNS = 'grid grid-cols-[28px_minmax(0,1fr)_76px_48px_36px] gap-x-2'

type Props = {
  blocks: ExerciseBlock[]
  openOrder: number | null
  editingId: string | undefined
  exercises: Map<string, Exercise>
  history: SessionSet[]
  onOpen: (exerciseOrder: number) => void
  onAddSet: (exerciseOrder: number) => void
  onMenu: () => void
}

function SessionList({ blocks, openOrder, editingId, exercises, history, onOpen, onAddSet, onMenu }: Props) {
  // L'exercice ouvert reste visible quand la liste défile (ex. passage à l'exercice suivant)
  const openRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    openRef.current?.scrollIntoView({ block: 'nearest' })
  }, [openOrder])

  return (
    <div className="-mx-4 min-h-0 flex-1 overflow-y-auto px-4">
      <div className="flex flex-col gap-2 pb-1">
        {blocks.map((b) => {
          const name = exercises.get(b.exerciseId)?.name ?? 'Exercice'
          if (b.exerciseOrder !== openOrder) {
            return (
              <button
                key={b.exerciseOrder}
                type="button"
                onClick={() => onOpen(b.exerciseOrder)}
                className="flex min-h-14 shrink-0 items-center gap-3 rounded-lg border border-border bg-surface pr-2 pl-4 text-left text-text"
              >
                <span className="flex-1 text-body-strong font-semibold">{name}</span>
                <span className="num text-body font-medium text-muted">
                  {b.doneCount}/{b.sets.length}
                </span>
                <span className="flex text-muted">
                  <IconChevronBas size={20} />
                </span>
              </button>
            )
          }

          const last = lastPerformance(history, b.exerciseId, b.variant)
          const target = formatTarget(b.sets[0]?.targetRepsMin, b.sets[0]?.targetRepsMax)
          return (
            <Card key={b.exerciseOrder} className="flex shrink-0 flex-col gap-1 p-1.5">
              <div ref={openRef} className="flex scroll-mt-2 items-center gap-2 pt-1.5 pb-0.5 pl-1.5">
                <div className="flex flex-1 items-baseline gap-2">
                  <h1 className="text-[20px] leading-6 font-extrabold">{name}</h1>
                  {target && <span className="num text-body font-medium text-muted">{target} reps</span>}
                </div>
                <button
                  type="button"
                  aria-label="Options de l’exercice"
                  onClick={onMenu}
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
              {b.sets.map((s, i) => {
                const previous = last?.sets[i]
                const state = s.done ? 'done' : s.id === editingId ? 'now' : 'next'
                return (
                  <div
                    key={s.id}
                    role="row"
                    aria-label={`Série ${s.order}${state === 'done' ? ', faite' : state === 'now' ? ', en cours' : ''}`}
                    aria-current={state === 'now' ? 'true' : undefined}
                    className={`${COLUMNS} min-h-13 items-center rounded-[10px] px-2.5 ${
                      state === 'done' ? 'bg-surface-2 text-muted' : state === 'now' ? 'bg-inverse text-on-inverse' : 'text-faint'
                    }`}
                  >
                    <span role="cell" className="num text-body">{s.order}</span>
                    <span role="cell" className={`num text-body font-medium ${state === 'now' ? 'text-on-inverse-muted' : ''}`}>
                      {previous ? `${previous.weight > 0 ? `${formatNumber(previous.weight)} × ` : '× '}${previous.reps}` : '—'}
                    </span>
                    <span role="cell" className="num text-right text-[22px]">{s.weight > 0 ? formatNumber(s.weight) : '—'}</span>
                    <span role="cell" className="num text-right text-[22px]">{s.reps}</span>
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
              <button
                type="button"
                onClick={() => onAddSet(b.exerciseOrder)}
                className="min-h-11 self-start px-1.5 text-body font-semibold text-text"
              >
                + Série
              </button>
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
