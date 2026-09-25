// Lecture et écriture des pesées (J7).
// Une seule pesée par jour : en enregistrer une deuxième le même jour la remplace (on se repèse
// pour corriger une erreur de saisie, pas pour avoir deux points). L'identifiant est fixé à
// l'ouverture du panneau : deux appuis rapprochés sur « Enregistrer » écrivent la même ligne.
import { dayStart, type BodyWeight } from '../lib/bodyWeight.ts'
import { db as defaultDb, type SportixDB } from './schema.ts'

/** Toutes les pesées, de la plus ancienne à la plus récente. */
export function listBodyWeights(db: SportixDB = defaultDb): Promise<BodyWeight[]> {
  return db.bodyWeights.orderBy('date').toArray()
}

/** Enregistre la pesée `id` du jour de `time` ; une autre pesée du même jour est remplacée. */
export async function saveBodyWeight(id: string, time: number, kg: number, db: SportixDB = defaultDb): Promise<void> {
  const date = dayStart(time)
  await db.transaction('rw', db.bodyWeights, async () => {
    const sameDay = await db.bodyWeights.where('date').equals(date).toArray()
    await db.bodyWeights.bulkDelete(sameDay.filter((w) => w.id !== id).map((w) => w.id))
    const existing = await db.bodyWeights.get(id)
    await db.bodyWeights.put({ id, date, kg, createdAt: existing?.createdAt ?? Date.now() })
  })
}

export async function deleteBodyWeight(id: string, db: SportixDB = defaultDb): Promise<void> {
  await db.bodyWeights.delete(id)
}
