// Liste de choix d'un exercice (maquette D5 « Choix d'exercice ») : recherche, groupes musculaires,
// exercices faits récemment en premier. Quand l'exercice accepte plusieurs variantes, la ligne se
// déplie pour la choisir. Sert à la séance (ajouter, remplacer) et aux programmes (J5) : c'est
// `onChoose` qui décide quoi faire de l'exercice choisi.
import { useState } from 'react'
import Button from '../../components/Button.tsx'
import Card from '../../components/Card.tsx'
import ChipGroup from '../../components/ChipGroup.tsx'
import ScreenHeader from '../../components/ScreenHeader.tsx'
import SearchField from '../../components/SearchField.tsx'
import { IconPlus } from '../../components/icons.tsx'
import {
  MUSCLE_GROUPS,
  MUSCLE_GROUP_LABELS,
  describeVariants,
  filterExercises,
  VARIANT_LABELS,
  type Exercise,
  type MuscleGroup,
  type Variant,
} from '../../lib/exercises.ts'
import type { SessionSet } from '../../lib/sessions.ts'
import { useActiveExercises } from './useExercises.ts'

const groupOptions = MUSCLE_GROUPS.map((g) => ({ value: g, label: MUSCLE_GROUP_LABELS[g] }))

type Props = {
  title: string
  backTo: string
  backLabel: string
  /** Séries déjà faites : les exercices récents passent en premier. */
  history: SessionSet[]
  onChoose: (exercise: Exercise, variant: Variant | null) => void
}

function ExercisePicker({ title, backTo, backLabel, history, onChoose }: Props) {
  const exercises = useActiveExercises()
  const [query, setQuery] = useState('')
  const [group, setGroup] = useState<MuscleGroup | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)

  if (exercises === undefined) return null

  // Exercices faits le plus récemment, pour les proposer en premier
  const lastDone = new Map<string, number>()
  for (const s of history) lastDone.set(s.exerciseId, Math.max(lastDone.get(s.exerciseId) ?? 0, s.doneAt ?? 0))
  const found = filterExercises(exercises, query, group).sort(
    (a, b) => (lastDone.get(b.id) ?? 0) - (lastDone.get(a.id) ?? 0) || a.name.localeCompare(b.name, 'fr'),
  )

  return (
    <main className="flex min-h-0 flex-1 flex-col gap-3 px-4 pt-1 pb-4">
      <ScreenHeader title={title} backTo={backTo} backLabel={backLabel} size="m" />
      <SearchField value={query} onChange={setQuery} placeholder="Rechercher un exercice" />
      <ChipGroup
        label="Groupe musculaire"
        scroll
        options={groupOptions}
        selected={group ? [group] : []}
        onToggle={(g) => setGroup((current) => (current === g ? null : g))}
      />

      {found.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 px-4 text-center">
          <h2 className="text-title font-bold">Aucun exercice « {query.trim()} »</h2>
          <p className="text-body text-muted">Crée-le : il sera ensuite proposé partout.</p>
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto">
          <Card className="divide-y divide-border overflow-hidden">
            {found.map((e) => {
              const open = expanded === e.id
              return (
                <div key={e.id} className={open ? 'bg-surface-2' : ''}>
                  <div className="flex min-h-16 items-center gap-3 py-2 pr-2 pl-4">
                    <button
                      type="button"
                      onClick={() => (e.variants.length > 1 ? setExpanded(open ? null : e.id) : onChoose(e, e.variants[0] ?? null))}
                      className="flex min-w-0 flex-1 flex-col gap-0.5 py-1 text-left"
                    >
                      <span className="text-body-strong font-semibold">{e.name}</span>
                      <span className="text-small text-muted">
                        {MUSCLE_GROUP_LABELS[e.muscleGroup]} ·{' '}
                        {e.variants.length > 1 ? 'choisis la variante' : describeVariants(e)}
                      </span>
                    </button>
                    {e.variants.length <= 1 && (
                      <button
                        type="button"
                        aria-label={`Ajouter ${e.name}`}
                        onClick={() => onChoose(e, e.variants[0] ?? null)}
                        className="flex size-12 shrink-0 items-center justify-center rounded-full border-[1.5px] border-border-strong text-text"
                      >
                        <IconPlus size={20} />
                      </button>
                    )}
                  </div>
                  {open && (
                    <div className="flex flex-wrap gap-2 px-4 pb-3.5">
                      {e.variants.map((v) => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => onChoose(e, v)}
                          className="inline-flex min-h-12 items-center rounded-full border-[1.5px] border-text px-4 text-body font-bold text-text"
                        >
                          {VARIANT_LABELS[v]}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </Card>
        </div>
      )}

      <Button variant="secondary" to={`/reglages/exercices/nouveau${query.trim() ? `?nom=${encodeURIComponent(query.trim())}` : ''}`}>
        <IconPlus size={20} />
        Créer un exercice
      </Button>
    </main>
  )
}

export default ExercisePicker
