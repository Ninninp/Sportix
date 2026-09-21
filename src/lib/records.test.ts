import { describe, expect, it } from 'vitest'
import { findRecords, sessionsWithRecords } from './records.ts'
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

  it('sépare les variantes : la barre ne compte pas pour la machine', () => {
    const machine = [set({ sessionId: 's1', variant: 'machine', weight: 60, doneAt: 3 })]
    expect(findRecords([set({ variant: 'machine', weight: 65 })], [...history, ...machine])).toHaveLength(1)
    // 65 kg à la machine ne bat pas les 100 kg à la barre, mais c'est bien un record machine
    expect(findRecords([set({ variant: 'machine', weight: 65 })], [...history, ...machine])[0].previous).toBe(60)
  })

  it('premier passage sur un exercice ou une variante : pas de record (rien à battre)', () => {
    expect(findRecords([set({ exerciseId: 'nouveau' })], history)).toEqual([])
    expect(findRecords([set({ variant: 'machine', weight: 100 })], history)).toEqual([])
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

describe('sessionsWithRecords', () => {
  it('la toute première séance n’a pas de record ; la suivante en a un si elle bat la charge', () => {
    const sessions = [
      { id: 's1', startedAt: 1 },
      { id: 's2', startedAt: 2 },
      { id: 's3', startedAt: 3 },
    ]
    const sets = [
      set({ sessionId: 's1', weight: 100 }),
      set({ sessionId: 's2', weight: 100 }),
      set({ sessionId: 's3', weight: 102.5 }),
    ]
    expect([...sessionsWithRecords(sessions, sets)]).toEqual(['s3'])
  })
})
