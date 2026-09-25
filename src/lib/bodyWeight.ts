// Poids corporel (J7) : les pesées et leur moyenne sur 7 jours.
// Le poids varie beaucoup d'un jour à l'autre (eau, repas) : c'est la moyenne qui dit la tendance,
// les pesées elles-mêmes ne sont que des points gris sur le graphique (docs/design/parcours.md § 5).
// Une seule pesée par jour : en peser une deuxième remplace la première (src/db/bodyWeights.ts).
import { formatNumber } from './sessions.ts'

export type BodyWeight = {
  id: string
  /** Jour de la pesée, à 0 h (heure locale). */
  date: number
  /** Poids en kg, au dixième. */
  kg: number
  createdAt: number
}

/** Bornes et pas du panneau « Pesée ». */
export const BODY_WEIGHT_MIN = 30
export const BODY_WEIGHT_MAX = 250
export const BODY_WEIGHT_STEP = 0.1
/** Poids proposé à la toute première pesée. */
export const BODY_WEIGHT_DEFAULT = 75

/** 0 h du jour de cet instant (heure locale). */
export function dayStart(time: number): number {
  return new Date(time).setHours(0, 0, 0, 0)
}

/** Poids après un appui sur − / + : 0,1 kg de plus ou de moins, arrondi au dixième, dans les bornes. */
export function stepBodyWeight(kg: number, direction: 1 | -1): number {
  const next = Math.round((kg + direction * BODY_WEIGHT_STEP) * 10) / 10
  return Math.min(BODY_WEIGHT_MAX, Math.max(BODY_WEIGHT_MIN, next))
}

/** Poids tapé au clavier (« 78,4 ») : null s'il n'est pas lisible ou hors des bornes. */
export function parseBodyWeight(text: string): number | null {
  const value = Number(text.replace(',', '.').trim())
  if (!Number.isFinite(value) || value < BODY_WEIGHT_MIN || value > BODY_WEIGHT_MAX) return null
  return Math.round(value * 10) / 10
}

/** « 78,4 » : toujours un chiffre après la virgule, comme sur une balance. */
export function formatBodyWeight(kg: number): string {
  return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(kg)
}

export type WeightPoint = { date: number; kg: number; /** Moyenne des pesées des 7 derniers jours (ce jour compris). */ average: number }

/** Le même jour `n` jours plus tôt (en jours de calendrier : juste aux changements d'heure). */
function daysBefore(date: number, n: number): number {
  const d = new Date(date)
  d.setDate(d.getDate() - n)
  return d.getTime()
}

/** Pesées triées par date, chacune avec la moyenne des pesées des 7 jours qui finissent ce jour-là. */
export function withMovingAverage(weights: BodyWeight[]): WeightPoint[] {
  const sorted = [...weights].sort((a, b) => a.date - b.date)
  return sorted.map((w) => {
    const from = daysBefore(w.date, 6)
    const window = sorted.filter((o) => o.date >= from && o.date <= w.date)
    return { date: w.date, kg: w.kg, average: window.reduce((sum, o) => sum + o.kg, 0) / window.length }
  })
}

export type WeightSummary = {
  /** Pesées de la période, avec leur moyenne (la moyenne tient compte des pesées d'avant la période). */
  points: WeightPoint[]
  /** Moyenne sur 7 jours à la dernière pesée. */
  current: number
  /** Évolution de la moyenne sur la période (null s'il n'y a qu'une pesée). */
  change: number | null
}

/** Ce qu'affiche la carte « Poids corporel » pour la période qui commence à `from`. */
export function weightSummary(weights: BodyWeight[], from: number): WeightSummary | null {
  const all = withMovingAverage(weights)
  const points = all.filter((p) => p.date >= from)
  if (points.length === 0) return null
  const current = points[points.length - 1].average
  return { points, current, change: points.length > 1 ? current - points[0].average : null }
}

/** « 1,8 kg » : écart de poids arrondi au dixième, sans signe (la flèche le donne). */
export function formatWeightChange(kg: number): string {
  return `${formatNumber(Math.round(Math.abs(kg) * 10) / 10)} kg`
}
