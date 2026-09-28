import { describe, expect, it } from 'vitest'
import { countUpValue, easeOut, staggerDelay } from './motion.ts'

describe('compteur qui défile', () => {
  it('part de 0 et arrive exactement sur la valeur', () => {
    expect(countUpValue(9240, 0)).toBe(0)
    expect(countUpValue(9240, 700)).toBe(9240)
    expect(countUpValue(9240, 5000)).toBe(9240)
  })

  it('va vite au début puis ralentit (ease-out), sans dépasser', () => {
    const half = countUpValue(100, 350)
    expect(half).toBeGreaterThan(50)
    expect(half).toBeLessThan(100)
    expect(easeOut(-1)).toBe(0)
    expect(easeOut(2)).toBe(1)
  })
})

describe('cascade', () => {
  it('décale chaque élément de 60 ms, jusqu’à un plafond', () => {
    expect([0, 1, 2].map((i) => staggerDelay(i))).toEqual([0, 60, 120])
    expect(staggerDelay(20)).toBe(360)
  })
})
