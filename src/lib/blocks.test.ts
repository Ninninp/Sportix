import { describe, expect, it } from 'vitest'
import type { Session, SessionSet } from './sessions.ts'
import {
  activeBlock,
  addMonths,
  addWeeks,
  blockVolume,
  blockEnd,
  blockIdFor,
  blockLastDay,
  blockWeeks,
  defaultWeeklySessions,
  formatDayMonth,
  formatLongSpan,
  formatMonth,
  formatSpan,
  formatTonnage,
  formatWeekDates,
  monthGrid,
  normalizeStart,
  overlapping,
  plannedSessions,
  sessionsPerWeek,
  suggestStart,
  weekIndexAt,
  weekSegments,
  shiftNextBlocks,
  weeksBetween,
  type Block,
} from './blocks.ts'

const day = (y: number, m: number, d: number, h = 0) => new Date(y, m, d, h).getTime()

// Bloc « Force » : 5 semaines à partir du lundi 14 septembre 2026, deload en semaine 5.
const block = (over: Partial<Block> = {}): Block => ({
  id: 'force',
  name: 'Force',
  goalId: null,
  startsOn: day(2026, 8, 14),
  weeks: 5,
  deloadWeeks: [5],
  programId: null,
  createdAt: 0,
  ...over,
})

describe('dates du bloc', () => {
  it('finit le lundi qui suit sa dernière semaine', () => {
    expect(blockEnd(block())).toBe(day(2026, 9, 19))
    expect(blockLastDay(block())).toBe(day(2026, 9, 18)) // dimanche 18 octobre
  })

  it('compte en jours de calendrier au changement d’heure (25 octobre 2026)', () => {
    // Lundi 19 octobre + 1 semaine = lundi 26 octobre 0 h, même si la semaine a duré 169 h.
    expect(addWeeks(day(2026, 9, 19), 1)).toBe(day(2026, 9, 26))
  })

  it('ramène une date choisie au lundi de sa semaine', () => {
    expect(normalizeStart(day(2026, 8, 17, 15))).toBe(day(2026, 8, 14)) // jeudi → lundi
    expect(normalizeStart(day(2026, 8, 20, 23))).toBe(day(2026, 8, 14)) // dimanche → lundi
  })
})

describe('weekIndexAt', () => {
  it('donne la semaine du bloc, et null en dehors', () => {
    const b = block()
    expect(weekIndexAt(b, day(2026, 8, 14))).toBe(1)
    expect(weekIndexAt(b, day(2026, 8, 20, 23))).toBe(1) // dimanche soir
    expect(weekIndexAt(b, day(2026, 8, 21))).toBe(2)
    expect(weekIndexAt(b, day(2026, 9, 18, 23))).toBe(5)
    expect(weekIndexAt(b, day(2026, 8, 13, 23))).toBeNull() // la veille
    expect(weekIndexAt(b, day(2026, 9, 19))).toBeNull() // le lundi d'après
  })

  it('reste juste après le changement d’heure', () => {
    const b = block({ startsOn: day(2026, 9, 19), weeks: 2 })
    expect(weekIndexAt(b, day(2026, 9, 25, 23))).toBe(1) // dimanche du changement, 23 h
    expect(weekIndexAt(b, day(2026, 9, 26))).toBe(2)
  })
})

describe('blockWeeks', () => {
  it('liste les semaines du lundi au dimanche, deload repéré', () => {
    const weeks = blockWeeks(block())
    expect(weeks).toHaveLength(5)
    expect(weeks[0]).toEqual({ index: 1, start: day(2026, 8, 14), end: day(2026, 8, 20), deload: false })
    expect(weeks[4]).toEqual({ index: 5, start: day(2026, 9, 12), end: day(2026, 9, 18), deload: true })
  })
})

describe('bloc en cours et rattachement', () => {
  const force = block()
  const hypertrophie = block({ id: 'hyper', startsOn: day(2026, 9, 12), weeks: 4, deloadWeeks: [] })

  it('prend le bloc qui contient la date, le plus récent en cas de chevauchement', () => {
    expect(activeBlock([force, hypertrophie], day(2026, 8, 30))?.id).toBe('force')
    expect(activeBlock([force, hypertrophie], day(2026, 9, 14))?.id).toBe('hyper') // les deux se croisent
    expect(activeBlock([force, hypertrophie], day(2026, 11, 1))).toBeUndefined()
  })

  it('rattache une séance au bloc en cours, ou à aucun', () => {
    expect(blockIdFor([force], day(2026, 8, 22, 18))).toBe('force')
    expect(blockIdFor([force], day(2026, 7, 1))).toBeUndefined()
  })
})

describe('overlapping', () => {
  const force = block()

  it('trouve les blocs dont les dates se croisent, triés par date', () => {
    const apres = block({ id: 'apres', startsOn: day(2026, 9, 12), weeks: 3 })
    const avant = block({ id: 'avant', startsOn: day(2026, 7, 31), weeks: 3 })
    expect(overlapping(force, [apres, force, avant]).map((b) => b.id)).toEqual(['avant', 'apres'])
  })

  it('ignore un bloc qui commence juste après', () => {
    const suivant = block({ id: 'suivant', startsOn: blockEnd(force) })
    expect(overlapping(force, [suivant])).toEqual([])
  })
})

describe('shiftNextBlocks', () => {
  const force = block({ weeks: 7 }) // allongé de 2 semaines : finit le 1er novembre
  const hyper = block({ id: 'hyper', startsOn: day(2026, 9, 19), weeks: 4 })
  const seche = block({ id: 'seche', startsOn: day(2026, 10, 16), weeks: 4 })

  it('repousse le premier bloc touché juste après, et les suivants d’autant', () => {
    expect(weeksBetween(day(2026, 9, 19), day(2026, 10, 2))).toBe(2)
    expect(shiftNextBlocks(force, [force, hyper, seche])).toEqual([
      { id: 'hyper', startsOn: day(2026, 10, 2) },
      { id: 'seche', startsOn: day(2026, 10, 30) },
    ])
  })

  it('ne déplace ni un bloc qui commence avant, ni rien sans chevauchement', () => {
    const avant = block({ id: 'avant', startsOn: day(2026, 7, 31), weeks: 3 })
    expect(shiftNextBlocks(force, [avant])).toEqual([])
    expect(shiftNextBlocks(block(), [hyper, seche])).toEqual([])
  })
})

describe('formats français', () => {
  const now = day(2026, 8, 22)

  it('écrit les dates courtes, l’année seulement si elle change', () => {
    expect(formatDayMonth(day(2026, 8, 14))).toBe('14 sept.')
    expect(formatSpan(day(2026, 8, 14), day(2026, 9, 18), now)).toBe('14 sept. → 18 oct.')
    expect(formatSpan(day(2026, 11, 7), day(2027, 0, 10), now)).toBe('7 déc. → 10 janv. 2027')
  })

  it('écrit les dates longues et le mois', () => {
    expect(formatLongSpan(day(2026, 8, 14), day(2026, 9, 18))).toBe('Du 14 septembre au 18 octobre 2026')
    expect(formatMonth(day(2026, 8, 1))).toBe('Septembre 2026')
  })
})

const session = (id: string, startedAt: number, blockId?: string): Session => ({ id, startedAt, endedAt: startedAt + 3600000, blockId })

describe('suivi d’un bloc', () => {
  const b = block()

  it('découpe la barre en semaines passées, en cours et à venir', () => {
    expect(weekSegments(b, day(2026, 8, 24)).map((w) => w.state)).toEqual(['past', 'current', 'future', 'future', 'future'])
    expect(weekSegments(b, day(2026, 9, 30)).every((w) => w.state === 'past')).toBe(true)
    expect(weekSegments(b, day(2026, 8, 1)).every((w) => w.state === 'future')).toBe(true)
    expect(weekSegments(b, day(2026, 8, 24))[4].deload).toBe(true)
  })

  it('compte les séances par semaine et le volume, séances du bloc seulement', () => {
    const sessions = [
      session('a', day(2026, 8, 15, 18), 'force'),
      session('b', day(2026, 8, 17, 18), 'force'),
      session('c', day(2026, 8, 22, 18), 'force'),
      session('d', day(2026, 8, 23, 18)), // hors bloc (pas de blockId)
    ]
    expect(sessionsPerWeek(b, sessions)).toEqual([2, 1, 0, 0, 0])
    const sets: SessionSet[] = ['a', 'd'].map((sessionId) => ({
      id: sessionId, sessionId, exerciseId: 'squat', variant: 'barre', exerciseOrder: 1, order: 1, weight: 100, reps: 5, done: true,
    }))
    expect(blockVolume(b, sessions, sets)).toBe(500)
    expect(plannedSessions(block({ weeklySessions: 3 }))).toBe(15) // 3 par semaine × 5 semaines
    expect(plannedSessions(b)).toBeNull() // bloc créé avant le réglage
    expect(defaultWeeklySessions(2)).toBe(2)
    expect(defaultWeeklySessions(0)).toBe(3)
  })

  it('propose de commencer ce lundi, ou après le dernier bloc', () => {
    expect(suggestStart([], day(2026, 8, 24))).toBe(day(2026, 8, 21))
    expect(suggestStart([b], day(2026, 8, 24))).toBe(day(2026, 9, 19))
  })
})

describe('monthGrid', () => {
  const grid = monthGrid(day(2026, 8, 10), [block({ deloadWeeks: [2] })], [session('a', day(2026, 8, 15, 18), 'force')], day(2026, 8, 24, 18))

  it('couvre le mois par semaines entières, du lundi au dimanche', () => {
    expect(grid).toHaveLength(5) // du lundi 31 août au dimanche 4 octobre
    expect(grid[0].days[0]).toMatchObject({ date: 31, inMonth: false })
    expect(grid[4].days[6]).toMatchObject({ date: 4, inMonth: false })
  })

  it('libelle les semaines du bloc, deload compris', () => {
    expect(grid.map((w) => w.label)).toEqual(['', '', 'S1', 'D', 'S3'])
    expect(grid[3].days.every((d) => d.deload && d.blockId === 'force')).toBe(true)
  })

  it('marque les jours travaillés et aujourd’hui', () => {
    expect(grid[2].days[1]).toMatchObject({ date: 15, done: true })
    expect(grid[3].days[3]).toMatchObject({ date: 24, today: true, done: false })
  })

  it('passe d’un mois à l’autre', () => {
    expect(addMonths(day(2026, 11, 15), 1)).toBe(day(2027, 0, 1))
    expect(addMonths(day(2026, 0, 31), -1)).toBe(day(2025, 11, 1))
  })
})

describe('formats du détail', () => {
  it('écrit les dates d’une semaine', () => {
    expect(formatWeekDates(day(2026, 8, 14), day(2026, 8, 20))).toBe('14 → 20 sept.')
    expect(formatWeekDates(day(2026, 8, 28), day(2026, 9, 4))).toBe('28 sept. → 4 oct.')
  })

  it('écrit le volume en tonnes', () => {
    expect(formatTonnage(850)).toBe('850 kg')
    expect(formatTonnage(1540)).toBe('1,5 t')
    expect(formatTonnage(38240)).toBe('38 t')
  })
})
