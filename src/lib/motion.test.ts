import { describe, expect, it } from 'vitest'
import { countUpValue, easeOut, pageAnimation, staggerDelay, traceDelay } from './motion.ts'

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

describe('animation de page', () => {
  it('rien au premier affichage ni sur la même adresse', () => {
    expect(pageAnimation(null, '/')).toBeNull()
    expect(pageAnimation('/stats', '/stats')).toBeNull()
  })
  it('la séance monte en y entrant, et rien en la quittant (« Réduire » s’en charge)', () => {
    expect(pageAnimation('/', '/seance')).toBe('seance')
    expect(pageAnimation('/programmes/p1', '/seance')).toBe('seance')
    expect(pageAnimation('/seance', '/')).toBeNull()
  })
  it('dans la séance : le choix d’exercice arrive par la droite, le retour par la gauche', () => {
    expect(pageAnimation('/seance', '/seance/exercices')).toBe('droite')
    expect(pageAnimation('/seance/exercices', '/seance')).toBe('gauche')
  })
  it('un niveau plus bas par la droite, un niveau plus haut par la gauche', () => {
    expect(pageAnimation('/stats', '/stats/exercices')).toBe('droite')
    expect(pageAnimation('/stats/exercices/x', '/stats/exercices')).toBe('gauche')
  })
  it('un autre onglet en fondu, même depuis une page profonde', () => {
    expect(pageAnimation('/stats', '/programmes')).toBe('fondu')
    expect(pageAnimation('/stats/exercices/x', '/calendrier')).toBe('fondu')
    expect(pageAnimation('/', '/historique')).toBe('fondu')
  })
})

describe('tracé d’une courbe', () => {
  it('un point apparaît quand le trait (ease-out) passe dessus', () => {
    expect(traceDelay(0, 700)).toBe(0)
    expect(traceDelay(1, 700)).toBe(700)
    const t = traceDelay(0.5, 700)
    expect(easeOut(t / 700)).toBeCloseTo(0.5)
    expect(t).toBeLessThan(350) // le trait va vite au début
  })
})
