// Menu ⋯ d'un exercice pendant la séance (maquette D5) : remplacer, changer de variante,
// modifier l'objectif du jour, retirer de la séance.
import { useNavigate } from 'react-router'
import Button from '../../components/Button.tsx'
import ChipGroup from '../../components/ChipGroup.tsx'
import Sheet from '../../components/Sheet.tsx'
import { IconCorbeille, IconEchange } from '../../components/icons.tsx'
import { changeVariant, removeExercise, setTargetReps } from '../../db/sessions.ts'
import { VARIANT_LABELS, type Exercise, type Variant } from '../../lib/exercises.ts'
import type { ExerciseBlock } from '../../lib/sessions.ts'

type Props = {
  open: boolean
  onClose: () => void
  sessionId: string
  block: ExerciseBlock
  exercise: Exercise | undefined
  onRemoved: () => void
}

function ExerciseMenu({ open, onClose, sessionId, block, exercise, onRemoved }: Props) {
  const navigate = useNavigate()
  const editing = block.sets.find((s) => !s.done)
  const min = editing?.targetRepsMin
  const max = editing?.targetRepsMax

  // Petit réglage +/− pour l'objectif de reps du jour
  const stepper = (label: string, value: number | undefined, onChange: (v: number | undefined) => void) => (
    <div className="flex items-center justify-between gap-3">
      <span className="text-body">{label}</span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label={`${label} : retirer une rep`}
          onClick={() => onChange(value && value > 1 ? value - 1 : undefined)}
          className="size-12 rounded-md bg-surface-2 text-[22px] font-bold text-text"
        >
          −
        </button>
        <span className="num w-10 text-center text-num-s">{value ?? '—'}</span>
        <button
          type="button"
          aria-label={`${label} : ajouter une rep`}
          onClick={() => onChange((value ?? 0) + 1)}
          className="size-12 rounded-md bg-surface-2 text-[22px] font-bold text-text"
        >
          +
        </button>
      </div>
    </div>
  )

  return (
    <Sheet open={open} onClose={onClose} label={`Options de ${exercise?.name ?? 'l’exercice'}`}>
      <div>
        <div className="text-title font-bold">{exercise?.name ?? 'Exercice'}</div>
        <div className="text-body text-muted">
          {block.doneCount} série{block.doneCount > 1 ? 's' : ''} faite{block.doneCount > 1 ? 's' : ''} sur{' '}
          {block.sets.length}
        </div>
      </div>

      <Button
        variant="secondary"
        className="justify-start px-4"
        to={`/seance/exercices?remplace=${block.exerciseOrder}`}
      >
        <IconEchange size={20} />
        Remplacer l’exercice
      </Button>

      {exercise && exercise.variants.length > 1 && (
        <div className="flex flex-col gap-2">
          <span className="text-caption font-semibold tracking-[0.06em] text-muted uppercase">Variante</span>
          <ChipGroup
            label="Variante"
            options={exercise.variants.map((v) => ({ value: v, label: VARIANT_LABELS[v] }))}
            selected={block.variant ? [block.variant] : []}
            onToggle={(v: Variant) => changeVariant(sessionId, block.exerciseOrder, v)}
          />
        </div>
      )}

      <div className="flex flex-col gap-2">
        <span className="text-caption font-semibold tracking-[0.06em] text-muted uppercase">Objectif du jour</span>
        <div className="flex flex-col gap-1 rounded-md bg-surface-2 px-4 py-2">
          {stepper('Reps minimum', min, (v) => setTargetReps(sessionId, block.exerciseOrder, { min: v, max }))}
          {stepper('Reps maximum', max, (v) => setTargetReps(sessionId, block.exerciseOrder, { min, max: v }))}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={async () => {
            await removeExercise(sessionId, block.exerciseOrder)
            onRemoved()
            onClose()
            navigate('/seance', { replace: true })
          }}
          className="inline-flex min-h-12 items-center gap-2 px-1 text-body font-semibold text-danger"
        >
          <IconCorbeille size={20} />
          Retirer de la séance
        </button>
        <Button variant="link" className="text-text" onClick={onClose}>
          Fermer
        </Button>
      </div>
    </Sheet>
  )
}

export default ExerciseMenu
