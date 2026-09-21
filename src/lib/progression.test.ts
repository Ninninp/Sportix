import { describe, expect, it } from 'vitest'
import {
  increaseBadge,
  lastPerformance,
  minWeight,
  prefillSets,
  stepWeight,
  suggestsWeightIncrease,
  weightStep,
} from './progression.ts'
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

  it('premier passage sur un exercice : une série vide à remplir (barre à vide à la barre libre)', () => {
    expect(prefillSets(null, 'barre')).toEqual([{ weight: 20, reps: 0 }])
    expect(prefillSets(null, 'machine')).toEqual([{ weight: 0, reps: 0 }])
  })

  it('ne reprend jamais moins que la barre à vide (séance enregistrée avant la règle des 20 kg)', () => {
    const last = lastPerformance(pastSets([10], { weight: 0 }), 'developpe', 'barre')
    expect(prefillSets(last, 'barre')[0].weight).toBe(20)
  })
})

describe('charge minimale (barre à vide)', () => {
  it('20 kg à la barre libre, 0 ailleurs', () => {
    expect(minWeight('barre')).toBe(20)
    expect(minWeight('smith')).toBe(0)
    expect(minWeight('halteres')).toBe(0)
    expect(minWeight(null)).toBe(0)
  })

  it('le − s’arrête à 20 kg à la barre, et le + part de 20 kg', () => {
    expect(stepWeight(22.5, 'barre', -1)).toBe(20)
    expect(stepWeight(20, 'barre', -1)).toBe(20)
    expect(stepWeight(0, 'barre', 1)).toBe(20)
    expect(stepWeight(20, 'barre', 1)).toBe(22.5)
  })

  it('les autres variantes descendent jusqu’à 0', () => {
    expect(stepWeight(5, 'machine', -1)).toBe(0)
    expect(stepWeight(2, 'halteres', -1)).toBe(0)
  })
})
