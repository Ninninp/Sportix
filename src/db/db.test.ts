// Tests de la base : fake-indexeddb fournit une fausse IndexedDB en mémoire (pas besoin de navigateur).
import 'fake-indexeddb/auto'
import { afterEach, describe, expect, it } from 'vitest'
import { addExercise, getExercise, listActiveExercises, softDeleteExercise, updateExercise } from './exercises.ts'
import { SportixDB } from './schema.ts'
import { SEED_EXERCISES } from './seed.ts'

let db: SportixDB
let n = 0
// Une base neuve par test (nom différent) pour qu'ils ne se gênent pas
const freshDb = () => (db = new SportixDB(`test-${++n}`))

afterEach(async () => {
  await db.delete()
})

describe('base Sportix', () => {
  it('pré-remplit les 32 exercices de base au premier lancement', async () => {
    freshDb()
    expect(SEED_EXERCISES).toHaveLength(32)
    expect(await db.exercises.count()).toBe(32)
  })

  it('ne pré-remplit pas une deuxième fois à la réouverture', async () => {
    freshDb()
    await addExercise({ name: 'Hack squat test', muscleGroup: 'jambes', type: 'charge', variants: ['machine'] }, db)
    db.close()
    await db.open()
    expect(await db.exercises.count()).toBe(33)
  })

  it('garde un exercice créé après fermeture et réouverture de la base', async () => {
    freshDb()
    const id = await addExercise(
      { name: '  Presse   inclinée ', muscleGroup: 'jambes', type: 'charge', variants: ['machine'] },
      db,
    )
    db.close()
    await db.open()
    const saved = await getExercise(id, db)
    expect(saved?.name).toBe('Presse inclinée')
  })

  it('modifie un exercice', async () => {
    freshDb()
    const id = await addExercise({ name: 'Curl', muscleGroup: 'bras', type: 'charge', variants: ['barre'] }, db)
    await updateExercise(id, { name: 'Curl pupitre', muscleGroup: 'bras', type: 'charge', variants: ['machine'] }, db)
    expect(await getExercise(id, db)).toMatchObject({ name: 'Curl pupitre', variants: ['machine'] })
  })

  it('une suppression retire l’exercice des listes mais le garde pour l’historique', async () => {
    freshDb()
    const id = await addExercise({ name: 'À supprimer', muscleGroup: 'dos', type: 'charge', variants: ['poulie'] }, db)
    await softDeleteExercise(id, db)
    expect((await listActiveExercises(db)).some((e) => e.id === id)).toBe(false)
    expect((await getExercise(id, db))?.deletedAt).toBeTypeOf('number')
  })
})
