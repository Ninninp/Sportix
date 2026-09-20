import { describe, expect, it } from 'vitest'
import { increaseBadge, lastPerformance, prefillSets, suggestsWeightIncrease, weightStep } from './progression.ts'
import type { SessionSet } from './sessions.ts'

// Une séance passée de développé couché : 3 × 8–12 à 80 kg, avec les reps faites
const pastSets = (reps: number[], over: Partial<SessionSet> = {}): SessionSet[] =>
  reps.map((r, i) => ({
    id: `set-${i}`,
    sessionId: 'seance-1',
    exerciseId: 'developpe',
    variant: 'barre',
    exerciseOrder: 1,
    order: i + 1,
    weight: 80,
    reps: r,
    targetRepsMin: 8,
    targetRepsMax: 12,
    done: true,
    doneAt: 1000 + i,
    ...over,
  }))

describe('weightStep', () => {
  it('suit le pas de chaque variante', () => {
    expect(weightStep('barre')).toBe(2.5)
    expect(weightStep('halteres')).toBe(2)
    expect(weightStep('machine')).toBe(5)
    expect(weightStep(null)).toBe(2.5)
  })
})

describe('lastPerformance', () => {
  it('reprend la séance la plus récente de cet exercice et cette variante', () => {
    const ancienne = pastSets([10], { sessionId: 'vieille', doneAt: 1 })
    const recente = pastSets([12, 11, 10])
    expect(lastPerformance([...ancienne, ...recente], 'developpe', 'barre')?.sessionId).toBe('seance-1')
  })

  it('sépare les variantes (la barre ne compte pas pour la machine)', () => {
    expect(lastPerformance(pastSets([10]), 'developpe', 'machine')).toBeNull()
  })

  it('ignore les séries non validées', () => {
    expect(lastPerformance(pastSets([10], { done: false }), 'developpe', 'barre')).toBeNull()
  })
})

describe('double progression', () => {
  it('12, 11, 10 : on garde la charge et les reps à battre', () => {
    const last = lastPerformance(pastSets([12, 11, 10]), 'developpe', 'barre')
    expect(suggestsWeightIncrease(last)).toBe(false)
    expect(prefillSets(last, 'barre')).toEqual([
      { weight: 80, reps: 12, targetRepsMin: 8, targetRepsMax: 12 },
      { weight: 80, reps: 11, targetRepsMin: 8, targetRepsMax: 12 },
      { weight: 80, reps: 10, targetRepsMin: 8, targetRepsMax: 12 },
    ])
    expect(increaseBadge(last, 'barre')).toBeNull()
  })

  it('12, 12, 12 : +2,5 kg et l’objectif repart du bas de la fourchette', () => {
    const last = lastPerformance(pastSets([12, 12, 12]), 'developpe', 'barre')
    expect(suggestsWeightIncrease(last)).toBe(true)
    expect(prefillSets(last, 'barre')).toEqual([
      { weight: 82.5, reps: 8, targetRepsMin: 8, targetRepsMax: 12 },
      { weight: 82.5, reps: 8, targetRepsMin: 8, targetRepsMax: 12 },
      { weight: 82.5, reps: 8, targetRepsMin: 8, targetRepsMax: 12 },
    ])
    expect(increaseBadge(last, 'barre')).toBe('charge +2,5 kg')
  })

  it('sans objectif enregistré, on ne propose jamais d’augmenter', () => {
    const last = lastPerformance(pastSets([5], { targetRepsMin: undefined, targetRepsMax: undefined }), 'developpe', 'barre')
    expect(suggestsWeightIncrease(last)).toBe(false)
    expect(prefillSets(last, 'barre')).toEqual([{ weight: 80, reps: 5, targetRepsMin: undefined, targetRepsMax: undefined }])
  })

  it('premier passage sur un exercice : une série vide à remplir', () => {
    expect(prefillSets(null, 'barre')).toEqual([{ weight: 0, reps: 0 }])
  })
})
