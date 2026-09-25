// Lecture et écriture des réglages (une seule ligne « app » dans la table `settings`).
import { withDefaults, type Settings } from '../lib/settings.ts'
import { db as defaultDb, type SportixDB } from './schema.ts'

/** Réglages complets : ce qui a été modifié, et les valeurs par défaut pour le reste. */
export async function getSettings(db: SportixDB = defaultDb): Promise<Settings> {
  return withDefaults(await db.settings.get('app'))
}

/** Modifie un ou plusieurs réglages (les autres restent tels quels). */
export async function updateSettings(changes: Partial<Settings>, db: SportixDB = defaultDb): Promise<void> {
  await db.transaction('rw', db.settings, async () => {
    const current = (await db.settings.get('app')) ?? { id: 'app' as const }
    await db.settings.put({ ...current, ...changes, id: 'app' })
  })
}

/**
 * Change des réglages d'après leur valeur EN BASE (boutons − / +) : `change` reçoit les réglages
 * actuels, lus dans la même transaction. Calculer depuis la valeur affichée perdrait des appuis
 * rapprochés (l'écran a un cycle de retard sur la base).
 */
export async function changeSettings(change: (current: Settings) => Partial<Settings>, db: SportixDB = defaultDb): Promise<void> {
  await db.transaction('rw', db.settings, async () => {
    const stored = (await db.settings.get('app')) ?? { id: 'app' as const }
    await db.settings.put({ ...stored, ...change(withDefaults(stored)), id: 'app' })
  })
}
