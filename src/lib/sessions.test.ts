import { describe, expect, it } from 'vitest'
import {
  currentSet,
  formatDuration,
  formatNumber,
  formatWeight,
  groupSetsByExercise,
  sessionProgress,
  sessionSummary,
  sessionVolume,
  type SessionSet,
} from './sessions.ts'

const set = (over: Partial<SessionSet> = {}): SessionSet => ({
  id: Math.random().toString(36).slice(2),
  sessionId: 's1',
  exerciseId: 'squat',
  variant: 'barre',
  exerciseOrder: 1,
  order: 1,
  weight: 100,
  reps: 5,
  done: false,
  ...over,
})

describe('groupSetsByExercise', () => {
  it('regroupe par exercice, dans l’ordre d’ajout, et compte les séries faites', () => {
    const blocks = groupSetsByExercise([
      set({ exerciseId: 'presse', exerciseOrder: 2, order: 1 }),
      set({ order: 2, done: true }),
      set({ order: 1, done: true }),
    ])
    expect(blocks.map((b) => b.exerciseId)).toEqual(['squat', 'presse'])
    expect(blocks[0].sets.map((s) => s.order)).toEqual([1, 2])
    expect(blocks[0].doneCount).toBe(2)
    expect(blocks[1].doneCount).toBe(0)
  })
})

describe('currentSet', () => {
  it('est la première série non faite, dans l’ordre de la séance', () => {
    const cible = set({ order: 2 })
    expect(currentSet([set({ order: 1, done: true }), cible, set({ order: 3 })])?.id).toBe(cible.id)
  })

  it('n’existe plus quand tout est fait', () => {
    expect(currentSet([set({ done: true })])).toBeUndefined()
  })
})

describe('sessionVolume', () => {
  it('ne compte que les séries faites', () => {
    expect(sessionVolume([set({ done: true }), set({ order: 2 })])).toBe(500)
  })

  it('compte double pour les haltères (charge d’un seul haltère)', () => {
    expect(sessionVolume([set({ variant: 'halteres', weight: 20, reps: 10, done: true })])).toBe(400)
  })
})

describe('sessionProgress et sessionSummary', () => {
  it('compte les séries faites sur le total', () => {
    expect(sessionProgress([set({ done: true }), set({ order: 2 })])).toEqual({ done: 1, total: 2 })
  })

  it('résume une séance terminée', () => {
    const session = { id: 's1', startedAt: 0, endedAt: 60_000 }
    expect(sessionSummary(session, [set({ done: true }), set({ exerciseId: 'presse', exerciseOrder: 2 })])).toEqual({
      durationMs: 60_000,
      volume: 500,
      setCount: 1,
      exerciseCount: 2,
    })
  })
})

describe('formatage', () => {
  it('affiche les durées en minutes:secondes, puis en heures', () => {
    expect(formatDuration(94_000)).toBe('1:34')
    expect(formatDuration(3_753_000)).toBe('1:02:33')
  })

  it('affiche les kilos et les décimales à la française', () => {
    expect(formatWeight(9240)).toMatch(/^9\s?240 kg$/)
    expect(formatNumber(102.5)).toBe('102,5')
  })
})
