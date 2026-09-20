import { describe, expect, it } from 'vitest'
import { findRecords, isRecord } from './records.ts'
import type { SessionSet } from './sessions.ts'

const set = (over: Partial<SessionSet> = {}): SessionSet => ({
  id: Math.random().toString(36).slice(2),
  sessionId: 's2',
  exerciseId: 'squat',
  variant: 'barre',
  exerciseOrder: 1,
  order: 1,
  weight: 100,
  reps: 5,
  done: true,
  doneAt: 10,
  ...over,
})

const history = [set({ sessionId: 's1', weight: 100, doneAt: 1 }), set({ sessionId: 's1', weight: 97.5, doneAt: 2 })]

describe('findRecords', () => {
  it('signale une charge jamais soulevée', () => {
    const records = findRecords([set({ weight: 102.5 })], history)
    expect(records).toHaveLength(1)
    expect(records[0].previous).toBe(100)
  })

  it('ne signale rien quand la charge égale l’ancien record', () => {
    expect(findRecords([set({ weight: 100 })], history)).toEqual([])
  })

  it('garde la meilleure série de la séance, une seule par exercice et variante', () => {
    const records = findRecords([set({ weight: 102.5 }), set({ weight: 105, order: 2 })], history)
    expect(records).toHaveLength(1)
    expect(records[0].set.weight).toBe(105)
  })

  it('sépare les variantes : la même charge à la machine est un record à part', () => {
    expect(findRecords([set({ variant: 'machine', weight: 100 })], history)).toHaveLength(1)
  })

  it('premier passage sur un exercice : c’est un record, sans ancien à battre', () => {
    expect(findRecords([set({ exerciseId: 'nouveau' })], history)[0].previous).toBeUndefined()
  })

  it('exercice au poids du corps : ce sont les reps qui comptent', () => {
    const tractions = { exerciseId: 'tractions', variant: null, weight: 0 }
    expect(findRecords([set({ ...tractions, reps: 10 })], [set({ ...tractions, reps: 9, sessionId: 's1' })])).toHaveLength(1)
    expect(findRecords([set({ ...tractions, reps: 8 })], [set({ ...tractions, reps: 9, sessionId: 's1' })])).toEqual([])
  })

  it('ignore les séries non validées ou à zéro rep', () => {
    expect(findRecords([set({ weight: 200, done: false })], history)).toEqual([])
    expect(findRecords([set({ weight: 200, reps: 0 })], history)).toEqual([])
  })
})

describe('isRecord', () => {
  it('répond pour une série isolée', () => {
    expect(isRecord(set({ weight: 105 }), history)).toBe(true)
    expect(isRecord(set({ weight: 95 }), history)).toBe(false)
  })
})
