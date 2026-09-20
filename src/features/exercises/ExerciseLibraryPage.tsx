// Bibliothèque d'exercices (Réglages → Exercices), d'après la maquette D5 « J2 · Exercices ».
// Recherche, filtre par groupe musculaire, liste groupée, et création en bas (zone du pouce).
import { useState } from 'react'
import Button from '../../components/Button.tsx'
import Card from '../../components/Card.tsx'
import ChipGroup from '../../components/ChipGroup.tsx'
import ListRow from '../../components/ListRow.tsx'
import ScreenHeader from '../../components/ScreenHeader.tsx'
import SearchField from '../../components/SearchField.tsx'
import { IconPlus, IconRecherche } from '../../components/icons.tsx'
import {
  MUSCLE_GROUPS,
  MUSCLE_GROUP_LABELS,
  describeVariants,
  filterExercises,
  groupByMuscle,
  type MuscleGroup,
} from '../../lib/exercises.ts'
import { useActiveExercises } from './useExercises.ts'

const groupOptions = MUSCLE_GROUPS.map((g) => ({ value: g, label: MUSCLE_GROUP_LABELS[g] }))

/** « hack sq » → « Hack sq » (nom proposé à la création depuis une recherche infructueuse) */
function capitalize(text: string): string {
  const t = text.trim()
  return t.charAt(0).toUpperCase() + t.slice(1)
}

function ExerciseLibraryPage() {
  const exercises = useActiveExercises()
  const [query, setQuery] = useState('')
  const [group, setGroup] = useState<MuscleGroup | null>(null)

  const found = filterExercises(exercises ?? [], query, group)
  const sections = groupByMuscle(found)
  const nothingFound = exercises !== undefined && found.length === 0

  return (
    <main className="flex min-h-0 flex-1 flex-col gap-3 px-4 pt-2 pb-4">
      <ScreenHeader
        title="Exercices"
        backTo="/reglages"
        backLabel="Retour aux réglages"
        right={
          <span className="num pr-3 text-body text-muted">{exercises?.length ?? ''}</span>
        }
      />
      <SearchField value={query} onChange={setQuery} placeholder="Rechercher un exercice" />
      <ChipGroup
        label="Groupe musculaire"
        scroll
        options={groupOptions}
        selected={group ? [group] : []}
        onToggle={(g) => setGroup((current) => (current === g ? null : g))}
      />

      {nothingFound ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 px-4 text-center">
          <span className="flex size-16 items-center justify-center rounded-full bg-surface-2 text-muted">
            <IconRecherche size={28} />
          </span>
          <h2 className="mt-2 text-title font-bold">
            {query ? `Aucun exercice « ${query.trim()} »` : 'Aucun exercice dans ce groupe'}
          </h2>
          <p className="text-body text-muted">
            {query
              ? 'Vérifie l’orthographe, ou crée-le : il sera ensuite proposé partout.'
              : 'Crée ton premier exercice pour ce groupe musculaire.'}
          </p>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto">
          {sections.map(({ group: g, exercises: list }) => (
            <section key={g} className="flex flex-col gap-1.5">
              <h2 className="text-caption font-semibold tracking-[0.06em] text-muted uppercase">
                {MUSCLE_GROUP_LABELS[g]}
              </h2>
              <Card className="divide-y divide-border overflow-hidden">
                {list.map((e) => (
                  <ListRow
                    key={e.id}
                    to={`/reglages/exercices/${e.id}`}
                    title={e.name}
                    subtitle={describeVariants(e)}
                  />
                ))}
              </Card>
            </section>
          ))}
        </div>
      )}

      <Button to={`/reglages/exercices/nouveau${query.trim() ? `?nom=${encodeURIComponent(capitalize(query))}` : ''}`}>
        <IconPlus size={20} />
        {nothingFound && query.trim() ? `Créer « ${capitalize(query)} »` : 'Nouvel exercice'}
      </Button>
    </main>
  )
}

export default ExerciseLibraryPage
