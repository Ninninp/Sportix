// Exercices : types et règles « pures » (sans base de données ni affichage), donc faciles à tester.
// Les écrans et la base de données (src/db/) s'appuient sur ces fonctions.

export const MUSCLE_GROUPS = ['jambes', 'pectoraux', 'dos', 'epaules', 'bras', 'abdos'] as const
export type MuscleGroup = (typeof MUSCLE_GROUPS)[number]

export const EXERCISE_TYPES = ['charge', 'poids-du-corps', 'temps'] as const
export type ExerciseType = (typeof EXERCISE_TYPES)[number]

// Variantes d'équipement (docs/design/parcours.md § 5) : charges et stats séparées par variante.
export const VARIANTS = ['barre', 'smith', 'halteres', 'machine', 'poulie'] as const
export type Variant = (typeof VARIANTS)[number]

export const MUSCLE_GROUP_LABELS: Record<MuscleGroup, string> = {
  jambes: 'Jambes',
  pectoraux: 'Pectoraux',
  dos: 'Dos',
  epaules: 'Épaules',
  bras: 'Bras',
  abdos: 'Abdos',
}

export const EXERCISE_TYPE_LABELS: Record<ExerciseType, string> = {
  charge: 'Charge',
  'poids-du-corps': 'Poids du corps',
  temps: 'Temps',
}

export const VARIANT_LABELS: Record<Variant, string> = {
  barre: 'Barre',
  smith: 'Smith',
  halteres: 'Haltères',
  machine: 'Machine',
  poulie: 'Poulie',
}

export type Exercise = {
  id: string
  name: string
  muscleGroup: MuscleGroup
  type: ExerciseType
  variants: Variant[]
  createdAt: number
  /** Suppression « douce » : l'exercice disparaît des listes mais reste pour l'historique. */
  deletedAt?: number
}

/** Ce que l'utilisateur remplit dans le formulaire (le reste est ajouté à l'enregistrement). */
export type ExerciseDraft = Pick<Exercise, 'name' | 'muscleGroup' | 'type' | 'variants'>

/** Le formulaire en cours de saisie : le groupe peut ne pas être encore choisi. */
export type ExerciseForm = Omit<ExerciseDraft, 'muscleGroup'> & { muscleGroup: MuscleGroup | null }

/** « Développé » → « developpe » : pour chercher sans se soucier des accents ni des majuscules. */
export function normalizeForSearch(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim()
}

/** Exercices visibles (non supprimés) correspondant à la recherche et au groupe choisi. */
export function filterExercises(exercises: Exercise[], query: string, group: MuscleGroup | null): Exercise[] {
  const q = normalizeForSearch(query)
  return exercises.filter(
    (e) => !e.deletedAt && (group === null || e.muscleGroup === group) && normalizeForSearch(e.name).includes(q),
  )
}

const collator = new Intl.Collator('fr', { sensitivity: 'base' })

/** Regroupe par groupe musculaire (ordre fixe de MUSCLE_GROUPS), noms triés à la française. */
export function groupByMuscle(exercises: Exercise[]): { group: MuscleGroup; exercises: Exercise[] }[] {
  return MUSCLE_GROUPS.map((group) => ({
    group,
    exercises: exercises.filter((e) => e.muscleGroup === group).sort((a, b) => collator.compare(a.name, b.name)),
  })).filter((section) => section.exercises.length > 0)
}

/** « Barre · Smith · Machine », ou le type quand il n'y a pas de variante (« Poids du corps »). */
export function describeVariants(exercise: Pick<Exercise, 'type' | 'variants'>): string {
  if (exercise.variants.length === 0) return EXERCISE_TYPE_LABELS[exercise.type]
  return VARIANTS.filter((v) => exercise.variants.includes(v))
    .map((v) => VARIANT_LABELS[v])
    .join(' · ')
}

/**
 * Vérifie un brouillon avant enregistrement. Renvoie la liste des problèmes (vide = valide).
 * `others` : les autres exercices, pour refuser un nom déjà pris (sans tenir compte des accents).
 */
export function validateExercise(draft: ExerciseForm, others: Pick<Exercise, 'name' | 'deletedAt'>[]): string[] {
  const errors: string[] = []
  const name = normalizeForSearch(draft.name)
  if (name === '') errors.push('Donne un nom à l’exercice')
  else if (others.some((o) => !o.deletedAt && normalizeForSearch(o.name) === name))
    errors.push('Un exercice porte déjà ce nom')
  if (draft.muscleGroup === null) errors.push('Choisis un groupe musculaire')
  if (draft.type === 'charge' && draft.variants.length === 0) errors.push('Choisis au moins une variante')
  return errors
}
