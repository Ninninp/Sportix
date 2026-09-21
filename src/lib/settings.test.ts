import { describe, expect, it } from 'vitest'
import { DEFAULT_SETTINGS, stepRest, withDefaults } from './settings.ts'

describe('withDefaults', () => {
  it('sans rien d’enregistré : les valeurs par défaut (repos 2:00, son, pas des maquettes)', () => {
    expect(withDefaults()).toEqual(DEFAULT_SETTINGS)
    expect(withDefaults().restSeconds).toBe(120)
    expect(withDefaults().weightSteps.machine).toBe(5)
  })

  it('garde ce qui a été modifié et complète le reste, pas de charge compris', () => {
    const s = withDefaults({ restSeconds: 180, weightSteps: { halteres: 1 } as never })
    expect(s.restSeconds).toBe(180)
    expect(s.restSound).toBe(true)
    expect(s.weightSteps.halteres).toBe(1)
    expect(s.weightSteps.barre).toBe(2.5)
  })
})

describe('stepRest', () => {
  it('avance de 15 s, entre 0:15 et 10:00', () => {
    expect(stepRest(120, 1)).toBe(135)
    expect(stepRest(120, -1)).toBe(105)
    expect(stepRest(15, -1)).toBe(15)
    expect(stepRest(600, 1)).toBe(600)
  })
})
