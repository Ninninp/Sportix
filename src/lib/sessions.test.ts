import { describe, expect, it } from 'vitest'
import {
  currentSet,
  formatDuration,
  formatNumber,
  formatWeight,
  groupBySession,
  groupSetsByExercise,
  plural,
  restFollows,
  sessionProgress,
  sessionSequence,
  sessionSummary,
  sessionVolume,
  supersetFollow,
  supersetGroups,
  workIndex,
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

describe('échauffement et superset (J9)', () => {
  // Développé militaire (1, relié au suivant) + Élévations (2) en superset, puis Rowing (3) seul
  const dm = (order: number, over: Partial<SessionSet> = {}) =>
    set({ id: `dm${order}`, exerciseId: 'dm', exerciseOrder: 1, order, supersetNext: true, ...over })
  const el = (order: number, over: Partial<SessionSet> = {}) => set({ id: `el${order}`, exerciseId: 'el', exerciseOrder: 2, order, ...over })
  const row = (order: number) => set({ id: `row${order}`, exerciseId: 'row', exerciseOrder: 3, order })

  it('regroupe les exercices reliés, et ignore le lien du dernier exercice', () => {
    const groups = supersetGroups(groupSetsByExercise([dm(1), el(1), row(1)]))
    expect(groups.map((g) => g.map((b) => b.exerciseId))).toEqual([['dm', 'el'], ['row']])
    const last = supersetGroups(groupSetsByExercise([set({ supersetNext: true })]))
    expect(last).toHaveLength(1)
  })

  it('fait les échauffements d’abord, puis alterne les séries du superset', () => {
    const warm = dm(1, { id: 'dmE', warmup: true })
    const order = sessionSequence([el(2), dm(2), el(1), dm(1), warm, row(1)]).map((s) => s.id)
    expect(order).toEqual(['dmE', 'dm1', 'el1', 'dm2', 'el2', 'row1'])
  })

  it('un exercice qui a plus de séries finit seul', () => {
    expect(sessionSequence([dm(1), dm(2), el(1)]).map((s) => s.id)).toEqual(['dm1', 'el1', 'dm2'])
  })

  it('le repos vient après le dernier exercice du tour, jamais après un échauffement', () => {
    const sets = [dm(1, { done: true }), el(1), dm(2), el(2), row(1)]
    expect(restFollows(sets, sets[0])).toBe(false) // Élévations 1 reste à faire
    expect(restFollows(sets, sets[1])).toBe(true)
    expect(restFollows(sets, row(1))).toBe(true)
    expect(restFollows(sets, dm(1, { warmup: true }))).toBe(false)
  })

  it('le pavé annonce la suite : l’autre exercice, puis le repos ; rien hors superset', () => {
    const sets = [dm(1, { done: true }), el(1), dm(2), el(2), row(1)]
    expect(supersetFollow(sets, dm(2))).toMatchObject({ id: 'el2' })
    expect(supersetFollow(sets, sets[1])).toBe('rest')
    expect(supersetFollow(sets, row(1))).toBeNull()
    expect(supersetFollow(sets, dm(1, { warmup: true }))).toBeNull()
  })

  it('les échauffements ne comptent ni dans la progression, ni dans le volume', () => {
    const warm = set({ id: 'w', warmup: true, done: true, weight: 60, reps: 10 })
    const work = set({ id: 'w1', done: true })
    expect(sessionProgress([warm, work, set({ id: 'w2', order: 2 })])).toEqual({ done: 1, total: 2 })
    expect(sessionVolume([warm, work])).toBe(500)
    const [block] = groupSetsByExercise([work, warm])
    expect(block.sets.map((s) => s.id)).toEqual(['w', 'w1'])
    expect(workIndex(block, work)).toBe(0)
    expect(workIndex(block, warm)).toBe(-1)
  })
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

describe('groupBySession et plural', () => {
  it('range les séries par séance en gardant leur ordre', () => {
    const a1 = set({ id: 'a1', sessionId: 'A', order: 1 })
    const b1 = set({ id: 'b1', sessionId: 'B', order: 1 })
    const a2 = set({ id: 'a2', sessionId: 'A', order: 2 })
    const grouped = groupBySession([a1, b1, a2])
    expect([...grouped.keys()]).toEqual(['A', 'B'])
    expect(grouped.get('A')?.map((s) => s.id)).toEqual(['a1', 'a2'])
    expect(grouped.get('C')).toBeUndefined()
    expect(groupBySession([]).size).toBe(0)
  })
  it('met le mot au pluriel à partir de 2', () => {
    expect([0, 1, 2, 12].map((n) => plural(n, 'série'))).toEqual(['0 série', '1 série', '2 séries', '12 séries'])
  })
})
