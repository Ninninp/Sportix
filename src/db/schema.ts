// Base de données locale de Sportix (IndexedDB, via la bibliothèque Dexie).
// Tout reste sur le téléphone : aucune donnée n'est envoyée sur Internet.
//
// ⚠️ RÈGLE DES MIGRATIONS : des données réelles d'entraînement existent peut-être déjà sur le téléphone.
// Ne JAMAIS modifier une version déjà publiée. Pour changer le schéma (nouvelle table, nouvel index),
// ajouter une version suivante, par exemple :
//   this.version(2).stores({ sessions: 'id, date' })          // nouvelle table : rien à migrer
//   this.version(3).stores({...}).upgrade(tx => { ... })      // transformation des données existantes
// Dexie applique alors les étapes manquantes au prochain lancement, sans rien perdre.
import Dexie, { type EntityTable } from 'dexie'
import type { Exercise } from '../lib/exercises.ts'
import { SEED_EXERCISES } from './seed.ts'

export class SportixDB extends Dexie {
  exercises!: EntityTable<Exercise, 'id'>

  constructor(name = 'sportix') {
    super(name)

    // Version 1 (J2) : la bibliothèque d'exercices.
    // Champs listés = index (recherche/tri rapides) ; les autres champs sont enregistrés quand même.
    this.version(1).stores({
      exercises: 'id, name, muscleGroup, deletedAt',
    })

    // Au tout premier lancement seulement (base encore vide) : les exercices de base.
    this.on('populate', (tx) => {
      const now = Date.now()
      tx.table('exercises').bulkAdd(
        SEED_EXERCISES.map((e) => ({ ...e, id: crypto.randomUUID(), createdAt: now })),
      )
    })
  }
}

/** La base de l'app (une seule pour tout le code). */
export const db = new SportixDB()
