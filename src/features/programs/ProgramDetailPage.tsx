// Détail d'un programme (maquette J5 « Détail d'un programme ») : interrupteur « Programme actif »,
// une carte par jour avec ses exercices (séries × reps, variante, repos), « Ajouter un exercice »,
// « Ajouter un jour ». Menus ⋯ du programme (renommer, supprimer) et de chaque jour.
// Toucher un exercice ouvre son panneau ; au retour du choix d'exercice, ?exercice=<id> l'ouvre aussi.
import { useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router'
import Button from '../../components/Button.tsx'
import Card from '../../components/Card.tsx'
import ScreenHeader from '../../components/ScreenHeader.tsx'
import Sheet from '../../components/Sheet.tsx'
import Switch from '../../components/Switch.tsx'
import { IconChevronDroite, IconCorbeille, IconFleche, IconFlecheBas, IconOptions, IconPlus } from '../../components/icons.tsx'
import { addDay, deleteDay, deleteProgram, moveDay, renameDay, renameProgram, setActiveProgram } from '../../db/programs.ts'
import { VARIANT_LABELS, type Exercise } from '../../lib/exercises.ts'
import { nextDay, type ProgramDay, type ProgramExercise } from '../../lib/programs.ts'
import { formatRest } from '../../lib/rest.ts'
import { formatTarget } from '../../lib/sessions.ts'
import { useExercisesById, useFinishedSessions } from '../sessions/useSession.ts'
import { useSettings } from '../settings/useSettings.ts'
import NameSheet from './NameSheet.tsx'
import ProgramExerciseSheet from './ProgramExerciseSheet.tsx'
import { Pill } from './ProgramsPage.tsx'
import { useProgram } from './usePrograms.ts'

/** « Barre », « Poids du corps »… : ce qui s'affiche sous le nom de l'exercice. */
function equipment(pe: ProgramExercise, info: Exercise | undefined): string {
  if (pe.variant) return VARIANT_LABELS[pe.variant]
  if (info?.type === 'poids-du-corps') return 'Poids du corps'
  if (info?.type === 'temps') return 'Temps'
  return ''
}

type Menu = { kind: 'program' } | { kind: 'day'; day: ProgramDay }
type Naming = { kind: 'program' } | { kind: 'day'; day: ProgramDay } | { kind: 'new-day' }

function ProgramDetailPage() {
  const id = useParams().id!
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const data = useProgram(id)
  const exercises = useExercisesById()
  const sessions = useFinishedSessions()
  const settings = useSettings()
  const [menu, setMenu] = useState<Menu | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [naming, setNaming] = useState<Naming | null>(null)

  if (data === undefined || exercises === undefined || sessions === undefined || settings === undefined) return null
  if (data === null) {
    return (
      <main className="flex flex-1 flex-col gap-3 px-4 pt-2 pb-4">
        <ScreenHeader title="Programme introuvable" backTo="/programmes" backLabel="Retour aux programmes" size="m" />
      </main>
    )
  }

  const { program, days } = data
  const active = settings.activeProgramId === program.id
  const next = active ? nextDay(days.map((d) => d.day), sessions) : undefined
  const openId = params.get('exercice')
  const opened = openId ? days.flatMap((d) => d.exercises).find((pe) => pe.id === openId) : undefined
  const closeMenu = () => {
    setMenu(null)
    setConfirmDelete(false)
  }

  return (
    <main className="flex flex-1 flex-col gap-3 px-4 pt-1 pb-4">
      <ScreenHeader
        title={program.name}
        backTo="/programmes"
        backLabel="Retour aux programmes"
        size="m"
        right={
          <button
            type="button"
            aria-label="Options du programme"
            onClick={() => setMenu({ kind: 'program' })}
            className="flex size-12 shrink-0 items-center justify-center rounded-md text-text"
          >
            <IconOptions />
          </button>
        }
      />

      <Card className="shrink-0">
        <Switch label="Programme actif" checked={active} onChange={(on) => void setActiveProgram(on ? program.id : null)} />
      </Card>

      {days.map(({ day, exercises: dayExercises }) => (
        <Card key={day.id} className="shrink-0 overflow-hidden">
          <div className="flex min-h-13 items-center gap-2 pt-1 pr-2 pl-4">
            <h2 className="flex-1 text-[20px] leading-6 font-extrabold tracking-[-0.01em]">{day.name}</h2>
            {next?.id === day.id && <Pill>Prochaine</Pill>}
            <button
              type="button"
              aria-label={`Options du jour ${day.name}`}
              onClick={() => setMenu({ kind: 'day', day })}
              className="flex size-12 shrink-0 items-center justify-center rounded-md text-text"
            >
              <IconOptions />
            </button>
          </div>
          <div className="divide-y divide-border">
            {dayExercises.map((pe) => {
              const info = exercises.get(pe.exerciseId)
              return (
                <button
                  key={pe.id}
                  type="button"
                  onClick={() => setParams({ exercice: pe.id }, { replace: true })}
                  className="flex min-h-15 w-full items-center gap-3 pr-2 pl-4 text-left text-text active:bg-surface-2"
                >
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="text-body-strong font-semibold">{info?.name ?? 'Exercice'}</span>
                    <span className="text-small text-muted">
                      {[equipment(pe, info), `repos ${formatRest(pe.restSeconds)}`].filter(Boolean).join(' · ')}
                    </span>
                  </span>
                  <span className="num text-[18px] whitespace-nowrap">
                    {pe.sets} × {formatTarget(pe.repsMin, pe.repsMax)}
                  </span>
                  <span className="flex text-muted">
                    <IconChevronDroite size={20} />
                  </span>
                </button>
              )
            })}
          </div>
          <Link
            to={`/programmes/${program.id}/jours/${day.id}/exercices`}
            className="flex min-h-13 items-center gap-2 border-t border-border px-4 text-body font-semibold text-text no-underline"
          >
            <IconPlus size={20} />
            Ajouter un exercice
          </Link>
        </Card>
      ))}

      <Button variant="secondary" onClick={() => setNaming({ kind: 'new-day' })}>
        <IconPlus size={20} />
        Ajouter un jour
      </Button>

      <ProgramExerciseSheet
        exercise={opened}
        info={opened ? exercises.get(opened.exerciseId) : undefined}
        onClose={() => setParams({}, { replace: true })}
      />

      {/* Menu ⋯ du programme ou d'un jour : renommer, supprimer (avec confirmation) */}
      <Sheet open={menu !== null} onClose={closeMenu} label="Options">
        {menu && (
          <>
            <div className="text-title font-bold">{menu.kind === 'program' ? program.name : menu.day.name}</div>
            {confirmDelete ? (
              <>
                <p className="text-body text-muted">
                  {menu.kind === 'program'
                    ? 'Le programme, ses jours et leurs exercices seront supprimés. Tes séances passées restent dans l’historique.'
                    : 'Le jour et ses exercices seront supprimés. Tes séances passées restent dans l’historique.'}
                </p>
                <Button
                  variant="danger"
                  onClick={async () => {
                    if (menu.kind === 'program') {
                      await deleteProgram(program.id)
                      navigate('/programmes', { replace: true })
                    } else {
                      await deleteDay(menu.day.id)
                      closeMenu()
                    }
                  }}
                >
                  <IconCorbeille size={20} />
                  {menu.kind === 'program' ? 'Supprimer le programme' : 'Supprimer le jour'}
                </Button>
                <Button variant="secondary" onClick={closeMenu}>
                  Annuler
                </Button>
              </>
            ) : (
              <>
                {menu.kind === 'day' && days.length > 1 && (
                  <div className="flex flex-col gap-1">
                    <span className="text-caption font-semibold tracking-[0.06em] text-muted uppercase">Ordre des séances</span>
                    <p className="text-small text-muted">
                      Les séances tournent dans cet ordre : après « {days[days.length - 1].day.name} », on revient à «{' '}
                      {days[0].day.name} ».
                    </p>
                    <div className="mt-1 flex gap-2">
                      <MoveButton
                        label="Monter"
                        Icon={IconFleche}
                        disabled={position(days, menu.day) === 0}
                        onClick={() => void moveDay(menu.day.id, -1)}
                      />
                      <MoveButton
                        label="Descendre"
                        Icon={IconFlecheBas}
                        disabled={position(days, menu.day) === days.length - 1}
                        onClick={() => void moveDay(menu.day.id, 1)}
                      />
                    </div>
                  </div>
                )}
                <Button
                  variant="secondary"
                  onClick={() => {
                    setNaming(menu.kind === 'program' ? { kind: 'program' } : { kind: 'day', day: menu.day })
                    closeMenu()
                  }}
                >
                  Renommer
                </Button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="inline-flex min-h-12 items-center gap-2 self-start px-1 text-body font-semibold text-danger"
                >
                  <IconCorbeille size={20} />
                  {menu.kind === 'program' ? 'Supprimer le programme' : 'Supprimer le jour'}
                </button>
              </>
            )}
          </>
        )}
      </Sheet>

      <NameSheet
        open={naming !== null}
        onClose={() => setNaming(null)}
        title={naming?.kind === 'new-day' ? 'Nouveau jour' : naming?.kind === 'day' ? 'Renommer le jour' : 'Renommer le programme'}
        fields={[
          naming?.kind === 'program'
            ? { label: 'Nom du programme', placeholder: 'Ex. Force A/B', initial: program.name }
            : { label: 'Nom du jour', placeholder: 'Ex. Push, Jambes', initial: naming?.kind === 'day' ? naming.day.name : '' },
        ]}
        confirmLabel={naming?.kind === 'new-day' ? 'Ajouter le jour' : 'Renommer'}
        onConfirm={async ([name]) => {
          if (naming?.kind === 'new-day') await addDay(program.id, name)
          else if (naming?.kind === 'day') await renameDay(naming.day.id, name)
          else await renameProgram(program.id, name)
          setNaming(null)
        }}
      />
    </main>
  )
}

/** Rang du jour dans le programme (le menu reste ouvert pendant qu'on le déplace). */
function position(days: { day: ProgramDay }[], day: ProgramDay): number {
  return days.findIndex((d) => d.day.id === day.id)
}

/** « Monter » / « Descendre » : une moitié de largeur chacun, 48 px de haut. */
function MoveButton({
  label,
  Icon,
  disabled,
  onClick,
}: {
  label: string
  Icon: typeof IconFleche
  disabled: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-md border-[1.5px] border-border-strong text-body font-semibold text-text disabled:border-border disabled:text-faint"
    >
      <Icon size={20} />
      {label}
    </button>
  )
}

export default ProgramDetailPage
