// Chiffres de la semaine sur l'accueil (J5, inspiré de Lyfta) : séances, durée, volume, chacun avec
// son évolution par rapport à la semaine passée, et les pastilles des jours.
// Comparaison « à date égale » (décidé le 21/09/2026) : du lundi à maintenant, contre la même
// période de la semaine passée (du lundi précédent au même jour et à la même heure).
import { sessionDuration, sessionVolume, type Session, type SessionSet } from './sessions.ts'

const DAY = 24 * 60 * 60 * 1000

/** Lundi 0 h de la semaine de `now` (heure locale). */
export function mondayOf(now: number): number {
  const d = new Date(now)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7))
  return d.getTime()
}

export type Trend = 'up' | 'down' | 'same'
export type WeekFigure = { value: number; trend: Trend }
export type WeekStats = { sessions: WeekFigure; durationMs: WeekFigure; volume: WeekFigure }

function trendOf(current: number, previous: number): Trend {
  return current > previous ? 'up' : current < previous ? 'down' : 'same'
}

/** Séances commencées dans [from, to[, avec leur durée et leur volume cumulés. */
function totals(sessions: Session[], sets: SessionSet[], from: number, to: number, now: number) {
  const inRange = sessions.filter((s) => s.startedAt >= from && s.startedAt < to)
  const ids = new Set(inRange.map((s) => s.id))
  return {
    count: inRange.length,
    durationMs: inRange.reduce((total, s) => total + sessionDuration(s, now), 0),
    volume: sessionVolume(sets.filter((s) => ids.has(s.sessionId))),
  }
}

export function weekStats(sessions: Session[], sets: SessionSet[], now = Date.now()): WeekStats {
  const monday = mondayOf(now)
  const current = totals(sessions, sets, monday, now + 1, now)
  const previous = totals(sessions, sets, monday - 7 * DAY, now + 1 - 7 * DAY, now)
  return {
    sessions: { value: current.count, trend: trendOf(current.count, previous.count) },
    durationMs: { value: current.durationMs, trend: trendOf(current.durationMs, previous.durationMs) },
    volume: { value: current.volume, trend: trendOf(current.volume, previous.volume) },
  }
}

export type WeekDay = { letter: string; done: boolean; today: boolean }

/** Les 7 pastilles L → D : entraîné ce jour-là ? aujourd'hui ? */
export function weekDays(sessions: Session[], now = Date.now()): WeekDay[] {
  const monday = new Date(mondayOf(now))
  const today = new Date(now).toDateString()
  return ['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((letter, i) => {
    const day = new Date(monday)
    day.setDate(monday.getDate() + i)
    const next = new Date(day)
    next.setDate(day.getDate() + 1)
    return {
      letter,
      done: sessions.some((s) => s.startedAt >= day.getTime() && s.startedAt < next.getTime()),
      today: day.toDateString() === today,
    }
  })
}

/** « 1 h 44 », « 45 min », « 0 min » : durée cumulée de la semaine. */
export function formatHoursMinutes(ms: number): string {
  const minutes = Math.max(0, Math.round(ms / 60000))
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return h > 0 ? `${h} h ${String(m).padStart(2, '0')}` : `${m} min`
}
