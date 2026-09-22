import { describe, expect, it } from 'vitest'
import {
  activeBlock,
  addWeeks,
  blockEnd,
  blockIdFor,
  blockLastDay,
  blockWeeks,
  formatDayMonth,
  formatLongSpan,
  formatMonth,
  formatSpan,
  normalizeStart,
  overlapping,
  weekIndexAt,
  withDeloadWeek,
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

describe('withDeloadWeek', () => {
  it('insère une semaine allégée et décale les deloads suivants', () => {
    const b = withDeloadWeek(block(), 2)
    expect(b.weeks).toBe(6)
    expect(b.deloadWeeks).toEqual([3, 6])
  })

  it('ne dépasse pas la durée maximale', () => {
    const b = withDeloadWeek(block({ weeks: 24, deloadWeeks: [] }), 24)
    expect(b.weeks).toBe(24)
    expect(b.deloadWeeks).toEqual([])
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
