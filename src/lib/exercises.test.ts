import { describe, expect, it } from 'vitest'
import {
  describeVariants,
  filterExercises,
  groupByMuscle,
  normalizeForSearch,
  validateExercise,
  type Exercise,
  type ExerciseForm,
} from './exercises.ts'

const ex = (name: string, over: Partial<Exercise> = {}): Exercise => ({
  id: name,
  name,
  muscleGroup: 'jambes',
  type: 'charge',
  variants: ['barre'],
  createdAt: 0,
  ...over,
})

describe('normalizeForSearch', () => {
  it('ignore accents, majuscules et espaces autour', () => {
    expect(normalizeForSearch('  Développé Épaules ')).toBe('developpe epaules')
  })
})

describe('filterExercises', () => {
  const list = [
    ex('Squat'),
    ex('Développé couché', { muscleGroup: 'pectoraux' }),
    ex('Ancien exercice', { deletedAt: 1 }),
  ]

  it('trouve un exercice sans taper les accents', () => {
    expect(filterExercises(list, 'developpe', null).map((e) => e.name)).toEqual(['Développé couché'])
  })

  it('filtre par groupe musculaire', () => {
    expect(filterExercises(list, '', 'jambes').map((e) => e.name)).toEqual(['Squat'])
  })

  it('ne montre jamais les exercices supprimés', () => {
    expect(filterExercises(list, 'ancien', null)).toEqual([])
  })
})

describe('groupByMuscle', () => {
  it('suit l’ordre des groupes et trie les noms à la française', () => {
    const sections = groupByMuscle([
      ex('Écarté', { muscleGroup: 'pectoraux' }),
      ex('Squat'),
      ex('Dips', { muscleGroup: 'pectoraux' }),
      ex('Fentes bulgares'),
    ])
    expect(sections.map((s) => s.group)).toEqual(['jambes', 'pectoraux'])
    expect(sections[1].exercises.map((e) => e.name)).toEqual(['Dips', 'Écarté'])
    expect(sections[0].exercises.map((e) => e.name)).toEqual(['Fentes bulgares', 'Squat'])
  })
})

describe('describeVariants', () => {
  it('liste les variantes dans l’ordre habituel', () => {
    expect(describeVariants({ type: 'charge', variants: ['machine', 'barre'] })).toBe('Barre · Machine')
  })

  it('affiche le type quand il n’y a pas de variante', () => {
    expect(describeVariants({ type: 'poids-du-corps', variants: [] })).toBe('Poids du corps')
  })
})

describe('validateExercise', () => {
  const draft = (over: Partial<ExerciseForm> = {}): ExerciseForm => ({
    name: 'Hack squat',
    muscleGroup: 'jambes',
    type: 'charge',
    variants: ['machine'],
    ...over,
  })

  it('accepte un exercice complet', () => {
    expect(validateExercise(draft(), [])).toEqual([])
  })

  it('refuse un nom vide', () => {
    expect(validateExercise(draft({ name: '   ' }), [])).toEqual(['Donne un nom à l’exercice'])
  })

  it('refuse un nom déjà pris, même écrit autrement', () => {
    expect(validateExercise(draft({ name: 'DEVELOPPE couché' }), [{ name: 'Développé couché' }])).toEqual([
      'Un exercice porte déjà ce nom',
    ])
  })

  it('autorise à reprendre le nom d’un exercice supprimé', () => {
    expect(validateExercise(draft(), [{ name: 'Hack squat', deletedAt: 1 }])).toEqual([])
  })

  it('exige un groupe musculaire', () => {
    expect(validateExercise(draft({ muscleGroup: null }), [])).toEqual(['Choisis un groupe musculaire'])
  })

  it('exige une variante pour un exercice avec charge', () => {
    expect(validateExercise(draft({ variants: [] }), [])).toEqual(['Choisis au moins une variante'])
  })

  it('n’exige pas de variante au poids du corps ou au temps', () => {
    expect(validateExercise(draft({ type: 'poids-du-corps', variants: [] }), [])).toEqual([])
    expect(validateExercise(draft({ type: 'temps', variants: [] }), [])).toEqual([])
  })
})
