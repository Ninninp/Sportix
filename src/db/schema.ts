// Base de données locale de Sportix (IndexedDB, via la bibliothèque Dexie).
// Tout reste sur le téléphone : aucune donnée n'est envoyée sur Internet.
//
// ⚠️ RÈGLE DES MIGRATIONS : des données réelles d'entraînement existent peut-être déjà sur le téléphone.
// Ne JAMAIS modifier une version déjà publiée. Pour changer le schéma (nouvelle table, nouvel index),
// ajouter une version suivante, par exemple :
//   this.version(2).stores({ sessions: 'id, date' })          // nouvelle table : rien à migrer
//   this.version(3).stores({...}).upgrade(tx => { ... })      // transformation des données existantes
// Dexie applique alors les étapes manquantes au prochain lancement, sans rien perdre.
import Dexie, { type EntityTable, type Transaction } from 'dexie'
import type { Block, BlockGoal } from '../lib/blocks.ts'
import type { Exercise } from '../lib/exercises.ts'
import type { Program, ProgramDay, ProgramExercise } from '../lib/programs.ts'
import type { Session, SessionSet } from '../lib/sessions.ts'
import type { Settings } from '../lib/settings.ts'
import { SEED_EXERCISES } from './seed.ts'

export class SportixDB extends Dexie {
  exercises!: EntityTable<Exercise, 'id'>
  sessions!: EntityTable<Session, 'id'>
  sets!: EntityTable<SessionSet, 'id'>
  settings!: EntityTable<StoredSettings, 'id'>
  programs!: EntityTable<Program, 'id'>
  programDays!: EntityTable<ProgramDay, 'id'>
  programExercises!: EntityTable<ProgramExercise, 'id'>
  blocks!: EntityTable<Block, 'id'>
  blockGoals!: EntityTable<BlockGoal, 'id'>

  constructor(name = 'sportix') {
    super(name)

    // Version 1 (J2) : la bibliothèque d'exercices.
    // Champs listés = index (recherche/tri rapides) ; les autres champs sont enregistrés quand même.
    this.version(1).stores({
      exercises: 'id, name, muscleGroup, deletedAt',
    })

    // Version 2 (J3) : les séances et leurs séries. Ajouter des tables ne touche pas aux
    // exercices déjà enregistrés ; Dexie applique simplement cette étape au prochain lancement.
    this.version(2).stores({
      sessions: 'id, startedAt, endedAt',
      sets: 'id, sessionId, exerciseId, doneAt, [sessionId+order]',
    })

    // Version 3 (J4) : les réglages (repos par défaut, son, pas de charge), une seule ligne « app ».
    // Le repos en cours, lui, est un simple champ de la séance : pas besoin d'index, donc pas de
    // changement de la table `sessions`.
    this.version(3).stores({
      settings: 'id',
    })

    // Version 4 (J5) : les programmes, leurs jours et les exercices de chaque jour. Nouvelles tables
    // seulement : les séances déjà enregistrées ne changent pas (une séance de programme porte
    // simplement en plus `programDayId` et `title`, champs non indexés).
    this.version(4).stores({
      programs: 'id',
      programDays: 'id, programId',
      programExercises: 'id, dayId',
    })

    // Version 5 (J6) : les blocs de spécialisation et leurs objectifs. Là encore, rien à migrer
    // dans les séances : une séance porte en plus `blockId` (champ non indexé), recalculé d'après
    // les dates à chaque changement de bloc (voir src/db/blocks.ts). Seul ajout : l'objectif
    // d'exemple « Force », pour un téléphone qui avait déjà la base (sinon `populate` s'en charge).
    this.version(5)
      .stores({
        blocks: 'id, startsOn',
        blockGoals: 'id',
      })
      .upgrade((tx) => addSeedGoal(tx))

    // Au tout premier lancement seulement (base encore vide) : les exercices de base.
    // Le `return` est indispensable : Dexie attend cette promesse avant de clore la transaction.
    // Sans lui, la base pourrait s'ouvrir avant la fin de l'insertion (bibliothèque vide).
    this.on('populate', (tx) => {
      const now = Date.now()
      return Promise.all([
        tx.table('exercises').bulkAdd(SEED_EXERCISES.map((e) => ({ ...e, id: crypto.randomUUID(), createdAt: now }))),
        addSeedGoal(tx),
      ])
    })
  }
}

/** L'objectif de bloc fourni en exemple (modifiable, supprimable) : les autres, l'utilisateur les crée. */
function addSeedGoal(tx: Transaction) {
  return tx.table('blockGoals').add({ id: crypto.randomUUID(), name: 'Force', createdAt: Date.now() })
}

/** Réglages tels qu'enregistrés : seuls ceux qui ont été modifiés (les autres prennent leur valeur par défaut). */
export type StoredSettings = Partial<Settings> & { id: 'app' }

/** La base de l'app (une seule pour tout le code). */
export const db = new SportixDB()
