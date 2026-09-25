import { describe, expect, it } from 'vitest'
import type { Block } from './blocks.ts'
import type { Exercise } from './exercises.ts'
import type { Session, SessionSet } from './sessions.ts'
import {
  averagePerWeek,
  blockFigures,
  blockGains,
  defaultComparison,
  estimateOneRepMax,
  exercisePoints,
  exerciseRecords,
  exerciseSummaries,
  formatKg,
  formatKgChange,
  formatMetric,
  formatSet,
  formatShortDate,
  niceScale,
  parsePeriod,
  periodStart,
  progressOf,
  recentRecords,
  sessionsByWeek,
  setsPerMuscle,
  timeLabels,
} from './stats.ts'

// Jeudi 24 septembre 2026, 18 h — le même exemple que les maquettes J7
const NOW = new Date(2026, 8, 24, 18).getTime()
const at = (m: number, d: number, h = 18) => new Date(2026, m, d, h).getTime()

const session = (id: string, startedAt: number, over: Partial<Session> = {}): Session => ({
  id,
  startedAt,
  endedAt: startedAt + 3_600_000,
  ...over,
})
let n = 0
const set = (sessionId: string, weight: number, reps: number, over: Partial<SessionSet> = {}): SessionSet => ({
  id: `set-${++n}`,
  sessionId,
  exerciseId: 'squat',
  variant: 'barre',
  exerciseOrder: 1,
  order: 1,
  weight,
  reps,
  done: true,
  ...over,
})
const exercise = (id: string, over: Partial<Exercise> = {}): Exercise => ({
  id,
  name: id,
  muscleGroup: 'jambes',
  type: 'charge',
  variants: ['barre'],
  createdAt: 0,
  ...over,
})
const block = (over: Partial<Block> = {}): Block => ({
  id: 'force',
  name: 'Force',
  goalId: null,
  startsOn: new Date(2026, 8, 14).getTime(), // lundi 14 septembre
  weeks: 5,
  deloadWeeks: [],
  programId: null,
  createdAt: 0,
  ...over,
})

describe('période', () => {
  it('lit l’adresse, 3 mois par défaut', () => {
    expect(parsePeriod('1a')).toBe('1a')
    expect(parsePeriod(null)).toBe('3m')
    expect(parsePeriod('n’importe quoi')).toBe('3m')
  })

  it('« 4 sem. » part du lundi d’il y a trois semaines', () => {
    expect(periodStart('4s', NOW)).toBe(new Date(2026, 7, 31).getTime())
  })

  it('« 3 mois » et « 1 an » partent du même jour, à 0 h', () => {
    expect(periodStart('3m', NOW)).toBe(new Date(2026, 5, 24).getTime())
    expect(periodStart('1a', NOW)).toBe(new Date(2025, 8, 24).getTime())
  })
})

describe('estimateOneRepMax (Epley)', () => {
  it('charge × (1 + reps / 30)', () => {
    expect(estimateOneRepMax(90, 5)).toBe(105)
    expect(estimateOneRepMax(100, 10)).toBeCloseTo(133.33, 2)
  })

  it('une seule rep : la charge elle-même ; sans rep ou sans charge : rien', () => {
    expect(estimateOneRepMax(120, 1)).toBe(120)
    expect(estimateOneRepMax(120, 0)).toBeNull()
    expect(estimateOneRepMax(0, 12)).toBeNull()
  })
})

describe('niceScale', () => {
  it('encadre les valeurs par des graduations rondes', () => {
    expect(niceScale([104, 117])).toEqual({ min: 100, max: 120, ticks: [100, 105, 110, 115, 120] })
    expect(niceScale([0, 4])).toEqual({ min: 0, max: 4, ticks: [0, 2, 4] })
  })

  it('ouvre un peu autour d’une valeur unique', () => {
    const { min, max } = niceScale([80])
    expect(min).toBeLessThan(80)
    expect(max).toBeGreaterThan(80)
  })
})

describe('timeLabels', () => {
  it('les débuts de mois sur 3 mois', () => {
    expect(timeLabels(periodStart('3m', NOW), NOW).map((l) => l.label)).toEqual(['juil.', 'août', 'sept.'])
  })

  it('un mois sur deux sur un an', () => {
    const labels = timeLabels(periodStart('1a', NOW), NOW)
    expect(labels.length).toBeLessThanOrEqual(6)
    expect(labels[0].label).toBe('oct.')
  })

  it('les lundis sur 4 semaines', () => {
    expect(timeLabels(periodStart('4s', NOW), NOW).map((l) => l.label)).toEqual(['31 août', '7 sept.', '14 sept.', '21 sept.'])
  })
})

describe('exercisePoints', () => {
  const sessions = [session('a', at(8, 7)), session('b', at(8, 10), { deload: true }), session('c', at(8, 14))]
  const sets = [
    set('a', 90, 5), // 1RM 105
    set('a', 95, 2), // 1RM 101,3 ; charge max 95
    set('b', 70, 5),
    set('c', 100, 3), // 1RM 110
    set('c', 60, 10, { variant: 'smith' }),
    set('c', 200, 0), // pas une série (0 rep)
    set('c', 200, 5, { done: false }), // pas faite
  ]

  it('un point par séance, la meilleure série, deload marqué', () => {
    const points = exercisePoints('squat', 'barre', 'oneRepMax', sessions, sets)
    expect(points.map((p) => [p.sessionId, Math.round(p.value), p.deload])).toEqual([
      ['a', 105, false],
      ['b', 82, true],
      ['c', 110, false],
    ])
    expect(formatSet(points[0].best)).toBe('90 × 5')
  })

  it('charge max, volume, et toutes les variantes', () => {
    expect(exercisePoints('squat', 'barre', 'maxWeight', sessions, sets)[0].value).toBe(95)
    expect(exercisePoints('squat', 'barre', 'volume', sessions, sets)[0].value).toBe(90 * 5 + 95 * 2)
    expect(exercisePoints('squat', 'all', 'volume', sessions, sets)[2].value).toBe(300 + 600)
  })

  it('volume des haltères compté double', () => {
    const points = exercisePoints('squat', 'halteres', 'volume', sessions, [set('a', 20, 10, { variant: 'halteres' })])
    expect(points[0].value).toBe(400)
  })

  it('ignore les séances en cours', () => {
    const open = [session('a', at(8, 7), { endedAt: undefined })]
    expect(exercisePoints('squat', 'barre', 'oneRepMax', open, sets)).toEqual([])
  })
})

describe('progressOf', () => {
  const pts = (values: [number, number, boolean?][]) =>
    values.map(([time, value, deload = false], i) => ({ sessionId: String(i), time, value, deload, best: set(String(i), value, 1) }))

  it('depuis le début du bloc en cours : la dernière séance d’avant le bloc sert de départ', () => {
    const points = pts([
      [at(8, 3), 108],
      [at(8, 10), 90, true], // deload, ignoré
      [at(8, 17), 114],
      [at(8, 21), 117],
    ])
    expect(progressOf(points, [block()], periodStart('3m', NOW), NOW)).toEqual({ change: 9, blockName: 'Force' })
  })

  it('hors bloc : l’écart sur la période (les séances d’avant la période ne comptent pas)', () => {
    const points = pts([
      [at(1, 3), 80],
      [at(7, 3), 100],
      [at(8, 21), 104],
    ])
    expect(progressOf(points, [], periodStart('3m', NOW), NOW)).toEqual({ change: 4, blockName: null })
  })

  it('rien avec moins de deux séances', () => {
    expect(progressOf(pts([[at(8, 21), 100]]), [], periodStart('3m', NOW), NOW)).toBeNull()
  })
})

describe('exerciseRecords', () => {
  const sessions = [session('a', at(8, 7)), session('b', at(8, 14))]
  const sets = [set('a', 90, 5), set('a', 90, 5), set('b', 110, 2)]

  it('1RM estimé, charge max et volume d’une séance, avec leur date', () => {
    const r = exerciseRecords('squat', 'barre', true, sessions, sets)
    expect(r.oneRepMax).toEqual({ value: 117.33333333333333, time: at(8, 14) })
    expect(r.maxWeight?.set.weight).toBe(110)
    expect(r.volume).toEqual({ value: 900, time: at(8, 7) })
  })

  it('sans charge : les reps max', () => {
    const r = exerciseRecords('squat', null, false, sessions, [set('a', 0, 8, { variant: null }), set('b', 0, 12, { variant: null })])
    expect(r.maxReps?.set.reps).toBe(12)
    expect(r.oneRepMax).toBeUndefined()
  })
})

describe('exerciseSummaries', () => {
  it('résume chaque exercice par sa variante la plus utilisée, les plus pratiqués d’abord', () => {
    const exercises = new Map([
      ['squat', exercise('squat', { name: 'Squat', variants: ['barre', 'smith'] })],
      ['tractions', exercise('tractions', { name: 'Tractions', type: 'poids-du-corps', variants: [] })],
    ])
    const sessions = [session('a', at(8, 7)), session('b', at(8, 14)), session('vieux', at(1, 1))]
    const sets = [
      set('a', 90, 5),
      set('b', 100, 3),
      set('b', 60, 10, { variant: 'smith' }),
      set('b', 0, 12, { exerciseId: 'tractions', variant: null }),
      set('vieux', 0, 5, { exerciseId: 'ancien', variant: null }),
    ]
    const list = exerciseSummaries(exercises, sessions, sets, periodStart('3m', NOW))
    expect(list.map((s) => [s.exercise.name, s.variant, s.metric, s.sessionCount])).toEqual([
      ['Squat', 'barre', 'oneRepMax', 2],
      ['Tractions', null, 'maxReps', 1],
    ])
    expect(list[0].latest).toBeCloseTo(110)
  })
})

describe('séances par semaine', () => {
  const blocks = [block({ startsOn: new Date(2026, 7, 10).getTime(), weeks: 5, deloadWeeks: [5] })] // deload du 7 au 13 sept.
  const sessions = [
    session('a', at(8, 1)),
    session('b', at(8, 3)),
    session('c', at(8, 8)),
    session('d', at(8, 15)),
    session('e', at(8, 22)),
    session('en-cours', at(8, 24), { endedAt: undefined }),
  ]

  it('une colonne par semaine depuis le lundi du début, deload et semaine en cours marqués', () => {
    const weeks = sessionsByWeek(sessions, blocks, periodStart('4s', NOW), NOW)
    expect(weeks.map((w) => [w.count, w.deload, w.current])).toEqual([
      [2, false, false],
      [1, true, false],
      [1, false, false],
      [1, false, true],
    ])
  })

  it('moyenne sans la semaine en cours ni le deload', () => {
    expect(averagePerWeek(sessionsByWeek(sessions, blocks, periodStart('4s', NOW), NOW))).toBe(1.5)
    expect(averagePerWeek([{ start: 0, count: 2, deload: false, current: true, partial: false }])).toBeNull()
  })

  it('la première semaine, commencée avant la période, est marquée et sort de la moyenne', () => {
    const weeks = sessionsByWeek(sessions, blocks, periodStart('3m', NOW), NOW)
    expect(weeks[0].partial).toBe(true)
    expect(weeks.slice(1).every((w) => !w.partial)).toBe(true)
  })
})

describe('setsPerMuscle', () => {
  it('moyenne par semaine depuis la première séance, deload exclu, plus travaillés d’abord', () => {
    const exercises = new Map([
      ['squat', exercise('squat')],
      ['couche', exercise('couche', { muscleGroup: 'pectoraux' })],
    ])
    // Première séance le lundi 14 septembre : 10 jours et 18 h jusqu'au jeudi 24 à 18 h
    const sessions = [session('a', at(8, 14)), session('b', at(8, 21)), session('d', at(8, 17), { deload: true })]
    const sets = [
      ...Array.from({ length: 6 }, () => set('a', 100, 5)),
      ...Array.from({ length: 4 }, () => set('b', 100, 5)),
      set('b', 80, 8, { exerciseId: 'couche' }),
      set('d', 100, 5),
    ]
    const result = setsPerMuscle(exercises, sessions, sets, periodStart('3m', NOW), NOW)
    const weeks = (NOW - new Date(2026, 8, 14).getTime()) / (7 * 86_400_000)
    expect(result.map((r) => r.group)).toEqual(['jambes', 'pectoraux'])
    expect(result[0].perWeek).toBeCloseTo(10 / weeks)
  })
})

describe('recentRecords', () => {
  it('même règle qu’en séance : pas la première fois, du plus récent au plus ancien', () => {
    const sessions = [session('a', at(7, 3)), session('b', at(8, 7)), session('c', at(8, 14))]
    const sets = [set('a', 100, 5), set('b', 105, 3), set('b', 105, 5), set('c', 102.5, 5), set('c', 60, 10, { exerciseId: 'couche' })]
    const records = recentRecords(sessions, sets, periodStart('3m', NOW))
    expect(records.map((r) => [r.set.weight, r.set.reps, r.time])).toEqual([[105, 5, at(8, 7)]])
  })
})

describe('comparer deux blocs', () => {
  const hyp = block({ id: 'hyp', name: 'Hypertrophie', startsOn: new Date(2026, 7, 10).getTime(), weeks: 5, deloadWeeks: [5] })
  const force = block()
  const futur = block({ id: 'futur', startsOn: new Date(2026, 9, 19).getTime() })
  const sessions = [
    session('h1', at(7, 10), { blockId: 'hyp' }),
    session('h2', at(7, 31), { blockId: 'hyp' }),
    session('hd', at(8, 8), { blockId: 'hyp', deload: true }),
    session('f1', at(8, 14), { blockId: 'force' }),
    session('f2', at(8, 21), { blockId: 'force' }),
  ]
  const sets = [
    set('h1', 90, 5), // 105
    set('h2', 95, 5), // 110,8
    set('hd', 70, 5),
    set('f1', 100, 3), // 110
    set('f2', 105, 3), // 115,5
    set('h1', 20, 10, { exerciseId: 'curl', variant: 'halteres' }),
  ]

  it('par défaut : le dernier bloc commencé et celui d’avant', () => {
    expect(defaultComparison([futur, force, hyp], NOW)?.map((b) => b.id)).toEqual(['hyp', 'force'])
    expect(defaultComparison([force], NOW)).toBeNull()
  })

  it('séances et volume par semaine, sans le deload, sur les semaines commencées', () => {
    const h = blockFigures(hyp, sessions, sets, NOW)
    expect(h.sessionsPerWeek).toBe(2 / 4)
    expect(h.volumePerWeek).toBe((450 + 475 + 400) / 4)
    const f = blockFigures(force, sessions, sets, NOW)
    expect(f.sessionsPerWeek).toBe(1) // 2 séances, semaines 1 et 2 commencées
  })

  it('1RM gagné dans chaque bloc, pour les exercices des deux blocs', () => {
    const gains = blockGains(hyp, force, sessions, sets)
    expect(gains).toHaveLength(1)
    expect(gains[0].exerciseId).toBe('squat')
    expect(gains[0].gains[0]).toBeCloseTo(110.83 - 105, 1)
    expect(gains[0].gains[1]).toBeCloseTo(5.5, 5)
  })
})

describe('formats', () => {
  it('kg au demi-kilo, écarts signés', () => {
    expect(formatKg(117.3)).toBe('117,5 kg')
    expect(formatKgChange(5.2)).toBe('+5 kg')
    expect(formatKgChange(-2.4)).toBe('−2,5 kg')
    expect(formatKgChange(0.1)).toBe('0 kg')
  })

  it('mesures, séries et dates', () => {
    expect(formatMetric('maxReps', 12)).toBe('× 12')
    expect(formatMetric('volume', 2160)).toBe('2 160 kg')
    expect(formatSet({ weight: 0, reps: 12 })).toBe('× 12')
    expect(formatShortDate(at(6, 27))).toBe('lun. 27 juil.')
  })
})
