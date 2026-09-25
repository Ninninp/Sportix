import { describe, expect, it } from 'vitest'
import {
  currentAverage,
  formatBodyWeight,
  formatWeightChange,
  parseBodyWeight,
  stepBodyWeight,
  weightSummary,
  withMovingAverage,
  type BodyWeight,
} from './bodyWeight.ts'

const day = (m: number, d: number) => new Date(2026, m, d).getTime()
const w = (date: number, kg: number): BodyWeight => ({ id: String(date), date, kg, createdAt: date })

describe('pavé de la pesée', () => {
  it('pas de 0,1 kg, arrondi au dixième, dans les bornes', () => {
    expect(stepBodyWeight(78.4, 1)).toBe(78.5)
    expect(stepBodyWeight(78.4, -1)).toBe(78.3)
    expect(stepBodyWeight(30, -1)).toBe(30)
  })

  it('lit un poids tapé au clavier', () => {
    expect(parseBodyWeight('78,45')).toBe(78.5)
    expect(parseBodyWeight('abc')).toBeNull()
    expect(parseBodyWeight('12')).toBeNull()
  })

  it('affiche toujours un chiffre après la virgule', () => {
    expect(formatBodyWeight(78)).toBe('78,0')
    expect(formatWeightChange(-1.84)).toBe('1,8 kg')
  })
})

describe('moyenne sur 7 jours', () => {
  it('moyenne des pesées des 7 jours qui finissent ce jour-là', () => {
    const points = withMovingAverage([w(day(8, 10), 80), w(day(8, 1), 82), w(day(8, 14), 79), w(day(8, 16), 78)])
    expect(points.map((p) => p.average)).toEqual([82, 80, 79.5, 79])
  })

  it('moyenne actuelle seule (pour les Réglages)', () => {
    expect(currentAverage([w(day(8, 10), 80), w(day(8, 1), 82), w(day(8, 14), 79), w(day(8, 16), 78)])).toBe(79)
    expect(currentAverage([])).toBeUndefined()
  })

  it('résumé de la période : moyenne actuelle et évolution depuis le début de la période', () => {
    const weights = [w(day(5, 1), 90), w(day(8, 1), 82), w(day(8, 10), 80), w(day(8, 14), 79)]
    const summary = weightSummary(weights, day(7, 1))!
    expect(summary.points).toHaveLength(3)
    expect(summary.current).toBe(79.5)
    expect(summary.change).toBe(-2.5)
    expect(weightSummary(weights, day(9, 1))).toBeNull()
    expect(weightSummary([w(day(8, 1), 82)], 0)?.change).toBeNull()
  })
})
