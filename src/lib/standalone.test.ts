import { describe, expect, it } from 'vitest'
import { isStandalone } from './standalone.ts'

const media = (matches: boolean) => () => ({ matches })

describe('isStandalone', () => {
  it("est vrai quand l'app est ouverte depuis l'écran d'accueil de l'iPhone", () => {
    expect(isStandalone({ navigator: { standalone: true }, matchMedia: media(false) })).toBe(true)
  })

  it('est vrai quand le navigateur annonce le mode standalone', () => {
    expect(isStandalone({ navigator: {}, matchMedia: media(true) })).toBe(true)
  })

  it('est faux dans un onglet Safari classique', () => {
    expect(isStandalone({ navigator: { standalone: false }, matchMedia: media(false) })).toBe(false)
  })

  it('est faux si le navigateur ne connaît pas matchMedia', () => {
    expect(isStandalone({})).toBe(false)
  })
})
