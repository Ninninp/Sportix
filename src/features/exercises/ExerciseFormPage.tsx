// Création et modification d'un exercice (maquettes D5 « Nouvel exercice » et « Modifier un exercice »).
// La même page sert aux deux : avec un identifiant dans l'adresse, elle charge l'exercice à modifier.
import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router'
import Button from '../../components/Button.tsx'
import ChipGroup from '../../components/ChipGroup.tsx'
import SegmentedControl from '../../components/SegmentedControl.tsx'
import ScreenHeader from '../../components/ScreenHeader.tsx'
import Sheet from '../../components/Sheet.tsx'
import TextField from '../../components/TextField.tsx'
import { IconCorbeille } from '../../components/icons.tsx'
import { addExercise, getExercise, softDeleteExercise, updateExercise } from '../../db/exercises.ts'
import { countExerciseInPrograms } from '../../db/programs.ts'
import {
  EXERCISE_TYPES,
  EXERCISE_TYPE_LABELS,
  MUSCLE_GROUPS,
  MUSCLE_GROUP_LABELS,
  VARIANTS,
  VARIANT_LABELS,
  validateExercise,
  type ExerciseForm as Form,
  type ExerciseType,
  type MuscleGroup,
  type Variant,
} from '../../lib/exercises.ts'
import { useActiveExercises } from './useExercises.ts'

const groupOptions = MUSCLE_GROUPS.map((g) => ({ value: g, label: MUSCLE_GROUP_LABELS[g] }))
const typeOptions = EXERCISE_TYPES.map((t) => ({ value: t, label: EXERCISE_TYPE_LABELS[t] }))
const variantOptions = VARIANTS.map((v) => ({ value: v, label: VARIANT_LABELS[v] }))

const LIBRARY = '/reglages/exercices'

function ExerciseFormPage() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const exercises = useActiveExercises()

  // En modification : l'exercice enregistré. La réponse est emballée dans un objet pour distinguer
  // « la base n'a pas encore répondu » (result undefined) de « cet exercice n'existe pas »
  // (result.value undefined) : sans ça, l'écran peut afficher « introuvable » pendant le chargement.
  const result = useLiveQuery(async () => ({ value: id ? await getExercise(id) : undefined }), [id])
  const saved = result?.value
  // Combien de jours de programme utilisent cet exercice : la suppression l'en retirera, autant le dire.
  const usedInPrograms = useLiveQuery(async () => (id ? countExerciseInPrograms(id) : 0), [id]) ?? 0

  // `draft` = ce que l'utilisateur a modifié ; tant qu'il n'a rien touché, on affiche soit un
  // formulaire vide (création), soit l'exercice venu de la base (modification, d'où le `null`
  // le temps que la base réponde). Pas d'effet : la valeur est calculée à l'affichage.
  const [draft, setDraft] = useState<Form | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const initial: Form | null = id
    ? saved
      ? { name: saved.name, muscleGroup: saved.muscleGroup, type: saved.type, variants: saved.variants }
      : null
    : { name: searchParams.get('nom') ?? '', muscleGroup: null, type: 'charge', variants: [] }
  const form = draft ?? initial

  const setForm = (update: (f: Form) => Form) => setDraft((current) => update(current ?? initial!))

  const others = (exercises ?? []).filter((e) => e.id !== id)
  const errors = form ? validateExercise(form, others) : ['Chargement…']
  const canSave = errors.length === 0

  async function save() {
    if (!form || !canSave || form.muscleGroup === null) return
    const draft = { ...form, muscleGroup: form.muscleGroup }
    if (id) await updateExercise(id, draft)
    else await addExercise(draft)
    navigate(LIBRARY, { replace: true })
  }

  async function remove() {
    if (!id) return
    await softDeleteExercise(id)
    navigate(LIBRARY, { replace: true })
  }

  // L'exercice n'existe pas (ou plus) : on le dit plutôt que d'afficher un formulaire vide.
  // On attend que la lecture ait répondu (`result`) avant de conclure.
  if (id && result !== undefined && saved === undefined) {
    return (
      <main className="flex flex-1 flex-col gap-5 px-4 pt-2 pb-4">
        <ScreenHeader title="Exercice introuvable" backTo={LIBRARY} backLabel="Retour à la bibliothèque" size="m" />
        <p className="text-body text-muted">Il a peut-être été supprimé depuis un autre écran.</p>
      </main>
    )
  }

  if (!form) {
    return (
      <main className="flex flex-1 flex-col gap-5 px-4 pt-2 pb-4">
        <ScreenHeader title="" backTo={LIBRARY} backLabel="Retour à la bibliothèque" size="m" />
      </main>
    )
  }

  return (
    <main className="flex flex-1 flex-col gap-5 px-4 pt-2 pb-4">
      <ScreenHeader
        title={id ? (saved?.name ?? '') : 'Nouvel exercice'}
        backTo={LIBRARY}
        backLabel={id ? 'Retour à la bibliothèque' : 'Annuler'}
        close={!id}
        size="m"
      />

      <TextField
        label="Nom"
        value={form.name}
        onChange={(name) => setForm((f) => ({ ...f, name }))}
        placeholder="Ex. Hack squat"
        autoCapitalize="sentences"
      />

      <fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
        <legend className="mb-2 p-0 text-caption font-semibold tracking-[0.06em] text-muted uppercase">
          Groupe musculaire
        </legend>
        <ChipGroup
          label="Groupe musculaire"
          options={groupOptions}
          selected={form.muscleGroup ? [form.muscleGroup] : []}
          onToggle={(g: MuscleGroup) => setForm((f) => ({ ...f, muscleGroup: f.muscleGroup === g ? null : g }))}
        />
      </fieldset>

      <fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
        <legend className="mb-2 p-0 text-caption font-semibold tracking-[0.06em] text-muted uppercase">Type</legend>
        <SegmentedControl
          label="Type d’exercice"
          options={typeOptions}
          value={form.type}
          onChange={(type: ExerciseType) => setForm((f) => ({ ...f, type }))}
        />
      </fieldset>

      <fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
        <legend className="mb-2 p-0 text-caption font-semibold tracking-[0.06em] text-muted uppercase">
          Variantes possibles
        </legend>
        <ChipGroup
          label="Variantes possibles"
          options={variantOptions}
          selected={form.variants}
          onToggle={(v: Variant) =>
            setForm((f) => ({
              ...f,
              variants: f.variants.includes(v) ? f.variants.filter((x) => x !== v) : [...f.variants, v],
            }))
          }
        />
        {form.type !== 'charge' && (
          <p className="text-small text-muted">Facultatif pour un exercice au poids du corps ou au temps.</p>
        )}
      </fieldset>

      <div className="flex-1" />

      <div className="flex flex-col gap-1">
        <Button onClick={save} disabled={!canSave} aria-describedby={canSave ? undefined : 'blocage'}>
          Enregistrer
        </Button>
        {!canSave && (
          <p id="blocage" className="text-center text-small text-muted">
            {errors[0]}
          </p>
        )}
        {id && (
          <Button variant="link" className="self-center text-danger" onClick={() => setConfirmDelete(true)}>
            Supprimer l’exercice
          </Button>
        )}
      </div>

      <Sheet open={confirmDelete} onClose={() => setConfirmDelete(false)} label="Supprimer l’exercice">
        <div className="flex flex-col gap-1.5">
          <h2 className="text-title font-bold">Supprimer « {saved?.name} » ?</h2>
          <p className="text-body text-muted">
            Il ne sera plus proposé. Tes séances passées le gardent dans l’historique.
            {usedInPrograms > 0 &&
              ` Il sera retiré de ${usedInPrograms === 1 ? 'la séance de programme' : `${usedInPrograms} séances de programme`} où il figure.`}
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <Button variant="danger" onClick={remove}>
            <IconCorbeille size={20} />
            Supprimer l’exercice
          </Button>
          <Button variant="secondary" onClick={() => setConfirmDelete(false)}>
            Annuler
          </Button>
        </div>
      </Sheet>
    </main>
  )
}

export default ExerciseFormPage
