// Détail d'un bloc (maquettes J6 « Détail d'un bloc » et « Deux blocs qui se chevauchent ») :
// objectif, programme, dates ; tuiles Semaine / Séances / Volume ; la liste des semaines
// (en cours inversée, deload en pointillés) avec les séances faites ; suppression.
// Le deload (en ajouter un, changer sa semaine) se règle dans « Modifier », et nulle part ailleurs
// (décidé le 22/09/2026 : le bouton « + Semaine de deload » de la maquette a été retiré).
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import Button from '../../components/Button.tsx'
import Card from '../../components/Card.tsx'
import ScreenHeader from '../../components/ScreenHeader.tsx'
import Sheet from '../../components/Sheet.tsx'
import { IconCorbeille } from '../../components/icons.tsx'
import { deleteBlock } from '../../db/blocks.ts'
import {
  blockEnd,
  blockLastDay,
  blockVolume,
  blockSessions,
  blockWeeks,
  formatLongSpan,
  formatTonnage,
  formatWeekDates,
  sessionsPerWeek,
  weekIndexAt,
} from '../../lib/blocks.ts'
import { usePrograms } from '../programs/usePrograms.ts'
import { useAllSets, useFinishedSessions } from '../sessions/useSession.ts'
import { useNowOnResume } from '../timer/useNow.ts'
import { useBlock, useGoals } from './useBlocks.ts'

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <Card className="flex flex-col gap-1 p-3">
      <span className="text-caption font-semibold tracking-[0.06em] text-muted uppercase">{label}</span>
      <span className="num text-num-m">{value}</span>
    </Card>
  )
}

function BlockDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const block = useBlock(id)
  const goals = useGoals()
  const programs = usePrograms()
  const sessions = useFinishedSessions()
  const sets = useAllSets()
  const now = useNowOnResume()
  const [confirmDelete, setConfirmDelete] = useState(false)

  if (block === undefined || goals === undefined || programs === undefined || sessions === undefined || sets === undefined) return null

  if (block === null) {
    return (
      <main className="flex flex-1 flex-col gap-5 px-4 pt-2 pb-4">
        <ScreenHeader title="Bloc introuvable" backTo="/calendrier" backLabel="Retour au calendrier" size="m" />
        <p className="text-body text-muted">Il a peut-être été supprimé depuis un autre écran.</p>
      </main>
    )
  }

  const goal = goals.find((g) => g.id === block.goalId)
  const program = programs.find((p) => p.program.id === block.programId)
  const current = weekIndexAt(block, now)
  const finished = now >= blockEnd(block)
  const counts = sessionsPerWeek(block, sessions)
  const done = blockSessions(block, sessions).length

  return (
    <main className="flex flex-1 flex-col gap-2.5 px-4 pt-2 pb-4">
      <ScreenHeader
        title={block.name}
        backTo="/calendrier"
        backLabel="Retour au calendrier"
        right={
          <Button variant="link" to={`/calendrier/${block.id}/modifier`} className="text-text">
            Modifier
          </Button>
        }
      />

      <div className="flex shrink-0 flex-col gap-1 text-body text-muted">
        {(goal || program) && (
          <span>
            {goal && (
              <>
                Objectif <strong className="text-text">{goal.name}</strong>
              </>
            )}
            {goal && program && ' · '}
            {program && (
              <>
                programme <strong className="text-text">{program.program.name}</strong>
              </>
            )}
          </span>
        )}
        <span className="num">{formatLongSpan(block.startsOn, blockLastDay(block))}</span>
      </div>

      <div className="grid shrink-0 grid-cols-3 gap-2">
        <Tile label="Semaine" value={current !== null ? `${current}/${block.weeks}` : finished ? 'Fini' : `0/${block.weeks}`} />
        <Tile label="Séances" value={String(done)} />
        <Tile label="Volume" value={formatTonnage(blockVolume(block, sessions, sets))} />
      </div>

      <h2 className="mt-1.5 text-caption font-semibold tracking-[0.06em] text-muted uppercase">Semaines</h2>
      <Card className="flex shrink-0 flex-col gap-1 p-1.5">
        {blockWeeks(block).map((w) => {
          const isNow = w.index === current
          const past = current !== null ? w.index < current : finished
          const count = counts[w.index - 1]
          return (
            <div
              key={w.index}
              className={`box-border flex min-h-13 items-center gap-3 rounded-[10px] px-3 ${
                isNow ? 'bg-inverse text-on-inverse' : w.deload ? 'border-[1.5px] border-dashed border-border-strong' : ''
              }`}
            >
              <span className={`num w-7 text-body font-extrabold ${isNow ? 'text-on-inverse' : 'text-muted'}`}>{w.deload ? 'D' : `S${w.index}`}</span>
              <span className={`num flex-1 text-body ${isNow ? '' : 'text-muted'}`}>
                {formatWeekDates(w.start, w.end)}
                <span className="sr-only">{isNow ? ', semaine en cours' : ''}{w.deload ? ', deload' : ''}</span>
              </span>
              <span className="num text-body font-bold">{count > 0 ? `${count} séance${count > 1 ? 's' : ''}` : past || isNow ? '0' : '—'}</span>
            </div>
          )
        })}
      </Card>

      <div className="min-h-2 flex-1" />
      <Button variant="link" className="self-center text-danger" onClick={() => setConfirmDelete(true)}>
        Supprimer le bloc
      </Button>

      <Sheet open={confirmDelete} onClose={() => setConfirmDelete(false)} label="Supprimer le bloc">
        <div>
          <h2 className="text-title font-bold">Supprimer « {block.name} » ?</h2>
          <p className="mt-1.5 text-body text-muted">Tes séances restent dans l’historique ; elles ne seront plus rattachées à ce bloc.</p>
        </div>
        <div className="flex flex-col gap-2">
          <Button
            variant="danger"
            onClick={async () => {
              await deleteBlock(block.id)
              navigate('/calendrier', { replace: true })
            }}
          >
            <IconCorbeille size={20} />
            Supprimer le bloc
          </Button>
          <Button variant="secondary" onClick={() => setConfirmDelete(false)}>
            Annuler
          </Button>
        </div>
      </Sheet>
    </main>
  )
}

export default BlockDetailPage
