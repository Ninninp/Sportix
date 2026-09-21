import { describe, expect, it } from 'vitest'
import { extendRest, formatRest, isRestFinished, msUntilNextSecond, restFraction, restRemaining, shouldRing, startRest } from './rest.ts'

const T0 = 1_000_000

describe('minuteur de repos (horodatage de fin)', () => {
  it('calcule le temps restant depuis la fin, pas depuis un décompte', () => {
    const rest = startRest(180, T0)
    expect(restRemaining(rest, T0)).toBe(180)
    expect(restRemaining(rest, T0 + 96_000)).toBe(84) // 1:24
    expect(restRemaining(rest, T0 + 179_001)).toBe(1) // 0:01 jusqu'au bout
    expect(restRemaining(rest, T0 + 180_000)).toBe(0)
  })

  it('reste juste après un verrouillage : seule l’heure du réveil compte', () => {
    const rest = startRest(120, T0)
    // L'app « dort » 100 s (écran verrouillé) : aucune étape intermédiaire n'est nécessaire
    expect(restRemaining(rest, T0 + 100_000)).toBe(20)
    // Réveil après la fin : terminé, jamais de temps négatif
    expect(isRestFinished(rest, T0 + 500_000)).toBe(true)
    expect(restRemaining(rest, T0 + 500_000)).toBe(0)
  })

  it('la barre se vide de 1 à 0', () => {
    const rest = startRest(180, T0)
    expect(restFraction(rest, T0)).toBe(1)
    expect(restFraction(rest, T0 + 90_000)).toBe(0.5)
    expect(restFraction(rest, T0 + 999_000)).toBe(0)
  })
})

describe('+15 s', () => {
  it('pendant le repos, recule la fin et allonge la durée totale', () => {
    const rest = extendRest(startRest(180, T0), T0 + 10_000)
    expect(rest.duration).toBe(195)
    expect(restRemaining(rest, T0 + 10_000)).toBe(185)
    expect(rest.extended).toBeUndefined()
  })

  it('après la fin, relance un repos prolongé de 15 s depuis maintenant', () => {
    const later = T0 + 200_000
    const rest = extendRest(startRest(180, T0), later)
    expect(rest).toEqual({ endsAt: later + 15_000, duration: 15, extended: true })
    // Deuxième appui pendant ce repos prolongé : 0:30 au total, toujours prolongé
    expect(extendRest(rest, later + 1_000)).toMatchObject({ duration: 30, extended: true })
  })
})

describe('son de fin', () => {
  it('sonne seulement si la fin est vue en direct', () => {
    const rest = startRest(60, T0)
    expect(shouldRing(rest, T0 + 59_000)).toBe(false)
    expect(shouldRing(rest, T0 + 60_500)).toBe(true)
    expect(shouldRing(rest, T0 + 120_000)).toBe(false) // réveil tardif : pas de son surprise
  })
})

describe('formatRest', () => {
  it('écrit minutes:secondes', () => {
    expect(formatRest(120)).toBe('2:00')
    expect(formatRest(15)).toBe('0:15')
    expect(formatRest(84)).toBe('1:24')
    expect(formatRest(600)).toBe('10:00')
  })
})

describe('msUntilNextSecond', () => {
  it('attend le prochain changement de seconde du chrono, pas une seconde « au hasard »', () => {
    expect(msUntilNextSecond(T0 + 250, T0)).toBe(765) // chrono de séance : prochaine seconde à T0 + 1000
    expect(msUntilNextSecond(T0 + 1015, T0)).toBe(1000) // juste après un changement : une seconde pile
  })

  it('marche aussi avant l’ancre (décompte du repos, dont les secondes tombent sur la fin)', () => {
    const endsAt = T0 + 60_000
    const now = T0 + 400 // 59,6 s restantes : l'affichage passe de 1:00 à 0:59 à T0 + 1000
    expect(msUntilNextSecond(now, endsAt)).toBe(615)
    expect(restRemaining(startRest(60, T0), now + 615)).toBe(59)
  })
})
