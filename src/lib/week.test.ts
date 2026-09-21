import { describe, expect, it } from 'vitest'
import type { Session, SessionSet } from './sessions.ts'
import { formatHoursMinutes, mondayOf, weekDays, weekStats } from './week.ts'

// Jeudi 24 septembre 2026, 18 h (heure locale)
const NOW = new Date(2026, 8, 24, 18, 0).getTime()
const at = (y: number, m: number, d: number, h = 18) => new Date(y, m, d, h).getTime()
const session = (id: string, startedAt: number, minutes: number): Session => ({ id, startedAt, endedAt: startedAt + minutes * 60000 })
const set = (sessionId: string, weight: number, reps: number): SessionSet => ({
  id: `${sessionId}-${weight}`,
  sessionId,
  exerciseId: 'squat',
  variant: 'barre',
  exerciseOrder: 1,
  order: 1,
  weight,
  reps,
  done: true,
})

describe('mondayOf', () => {
  it('ramène au lundi 0 h, dimanche compris', () => {
    expect(mondayOf(NOW)).toBe(new Date(2026, 8, 21).getTime())
    expect(mondayOf(new Date(2026, 8, 27, 23).getTime())).toBe(new Date(2026, 8, 21).getTime())
  })
})

describe('weekStats (à date égale)', () => {
  const sessions = [
    session('a', at(2026, 8, 21), 60), // lundi de cette semaine
    session('b', at(2026, 8, 23), 44), // mercredi
    session('c', at(2026, 8, 15), 50), // mardi dernier : dans la période comparée
  ]
  const previousLate = session('e', at(2026, 8, 19), 70) // samedi dernier : après « jeudi dernier 18 h » → hors comparaison
  const sets = [set('a', 100, 5), set('b', 100, 5), set('c', 100, 20)]

  it('compare du lundi à maintenant avec la même période de la semaine passée', () => {
    const stats = weekStats([...sessions, previousLate], sets, NOW)
    expect(stats.sessions).toEqual({ value: 2, trend: 'up' }) // 2 contre 1 (le samedi dernier ne compte pas)
    expect(stats.durationMs).toEqual({ value: 104 * 60000, trend: 'up' }) // 1 h 44 contre 50 min
    expect(stats.volume).toEqual({ value: 1000, trend: 'down' }) // 1 000 kg contre 2 000 kg
  })

  it('égalité : ni hausse ni baisse', () => {
    expect(weekStats([], [], NOW).sessions).toEqual({ value: 0, trend: 'same' })
  })
})

describe('weekDays', () => {
  it('marque les jours entraînés et aujourd’hui', () => {
    const days = weekDays([session('a', at(2026, 8, 21), 60)], NOW)
    expect(days.map((d) => d.letter).join('')).toBe('LMMJVSD')
    expect(days[0]).toMatchObject({ done: true, today: false })
    expect(days[3]).toMatchObject({ done: false, today: true })
  })
})

describe('formatHoursMinutes', () => {
  it('écrit des heures et minutes lisibles', () => {
    expect(formatHoursMinutes(104 * 60000)).toBe('1 h 44')
    expect(formatHoursMinutes(45 * 60000)).toBe('45 min')
    expect(formatHoursMinutes(60 * 60000)).toBe('1 h 00')
  })
})
