// Accès aux blocs de spécialisation et à leurs objectifs (J6).
//
// Rattachement des séances : une séance appartient au bloc en cours au moment où elle a commencé
// (`blockIdFor`). Le `blockId` est posé au démarrage de la séance, puis **recalculé pour toutes
// les séances** à chaque création, modification ou suppression d'un bloc : une séance faite avant
// de créer le bloc, ou pendant une semaine de deload ajoutée après coup, rejoint ainsi son bloc.
// Le recalcul se fait dans la même transaction que le changement de bloc (jamais d'état bancal).
import { blockIdFor, isDeloadAt, normalizeStart, shiftNextBlocks, type Block, type BlockDraft, type BlockGoal } from '../lib/blocks.ts'
import { db as defaultDb, type SportixDB } from './schema.ts'

/** Blocs, du plus ancien au plus récent. */
export async function listBlocks(db: SportixDB = defaultDb): Promise<Block[]> {
  return db.blocks.orderBy('startsOn').toArray()
}

export function getBlock(id: string, db: SportixDB = defaultDb): Promise<Block | undefined> {
  return db.blocks.get(id)
}

/** Objectifs, dans l'ordre de création. */
export async function listGoals(db: SportixDB = defaultDb): Promise<BlockGoal[]> {
  return (await db.blockGoals.toArray()).sort((a, b) => a.createdAt - b.createdAt)
}

export async function createGoal(name: string, db: SportixDB = defaultDb): Promise<string> {
  const id = crypto.randomUUID()
  await db.blockGoals.add({ id, name: name.trim(), createdAt: Date.now() })
  return id
}

/** Le bloc tel qu'enregistré : nom sans espaces autour, début ramené au lundi, deloads dans la durée. */
function clean(draft: BlockDraft): BlockDraft {
  return {
    ...draft,
    name: draft.name.trim(),
    startsOn: normalizeStart(draft.startsOn),
    deloadWeeks: [...new Set(draft.deloadWeeks)].filter((n) => n >= 1 && n <= draft.weeks).sort((a, b) => a - b),
  }
}

/**
 * Rattache chaque séance au bloc en cours à son démarrage (ou à aucun), et recalcule si elle tombe
 * dans une semaine de deload — étiquette recopiée sur ses séries, que la double progression saute.
 * À appeler dans une transaction qui couvre `blocks`, `sessions` et `sets`.
 */
async function reattachSessions(db: SportixDB): Promise<void> {
  const blocks = await db.blocks.toArray()
  const deloadSessions = new Set<string>()
  await db.sessions.toCollection().modify((session) => {
    const blockId = blockIdFor(blocks, session.startedAt)
    if (blockId) session.blockId = blockId
    else delete session.blockId
    if (isDeloadAt(blocks, session.startedAt)) {
      session.deload = true
      deloadSessions.add(session.id)
    } else delete session.deload
  })
  await db.sets.toCollection().modify((set) => {
    if (deloadSessions.has(set.sessionId)) set.deload = true
    else delete set.deload
  })
}

/**
 * Enregistre le bloc `id` : le crée s'il n'existe pas encore, le remplace sinon. Avec `shiftNext`,
 * les blocs suivants sur lesquels il mord reculent d'autant de semaines que nécessaire
 * (`shiftNextBlocks`), dans la même transaction.
 *
 * Répéter l'appel avec le même `id` ne change rien de plus (relecture du J6) : le formulaire fixe
 * l'identifiant d'un nouveau bloc à l'ouverture, si bien qu'un double appui sur « Créer le bloc »
 * réécrit le même bloc au lieu d'en créer deux. Et au second appui sur « Décaler », le bloc suivant
 * commence déjà après la fin : rien n'est décalé deux fois.
 */
export async function saveBlock(id: string, draft: BlockDraft, shiftNext = false, db: SportixDB = defaultDb): Promise<string> {
  const blockId = id
  await db.transaction('rw', db.blocks, db.sessions, db.sets, async () => {
    const existing = await db.blocks.get(id)
    const block: Block = { ...clean(draft), id: blockId, createdAt: existing?.createdAt ?? Date.now() }
    if (shiftNext) {
      for (const { id: other, startsOn } of shiftNextBlocks(block, await db.blocks.toArray())) {
        await db.blocks.update(other, { startsOn })
      }
    }
    await db.blocks.put(block)
    await reattachSessions(db)
  })
  return blockId
}

export function createBlock(draft: BlockDraft, shiftNext = false, db: SportixDB = defaultDb): Promise<string> {
  return saveBlock(crypto.randomUUID(), draft, shiftNext, db)
}

export async function updateBlock(id: string, draft: BlockDraft, shiftNext = false, db: SportixDB = defaultDb): Promise<void> {
  await saveBlock(id, draft, shiftNext, db)
}

/** Supprime un bloc. Ses séances restent (elles rejoignent un autre bloc qui couvre leur date, s'il y en a un). */
export async function deleteBlock(id: string, db: SportixDB = defaultDb): Promise<void> {
  await db.transaction('rw', db.blocks, db.sessions, db.sets, async () => {
    await db.blocks.delete(id)
    await reattachSessions(db)
  })
}
