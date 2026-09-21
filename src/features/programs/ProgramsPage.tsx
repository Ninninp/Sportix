// Onglet Programmes (maquettes J5 « Programmes » et « Programmes · aucun ») : une carte par
// programme avec ses jours, le programme actif marqué, et « Nouveau programme » en bas.
import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import Button from '../../components/Button.tsx'
import { IconChevronDroite, IconPlus, IconProgrammes } from '../../components/icons.tsx'
import { createProgram } from '../../db/programs.ts'
import { nextDay } from '../../lib/programs.ts'
import { useFinishedSessions } from '../sessions/useSession.ts'
import { useSettings } from '../settings/useSettings.ts'
import NameSheet from './NameSheet.tsx'
import { usePrograms } from './usePrograms.ts'

/** Pastille « Actif » / « Prochaine » (inverse, comme sur les maquettes). */
export function Pill({ children }: { children: string }) {
  return (
    <span className="shrink-0 rounded-full bg-inverse px-2 py-0.5 text-caption font-extrabold text-on-inverse">{children}</span>
  )
}

const plural = (n: number, word: string) => `${n} ${word}${n > 1 ? 's' : ''}`

function ProgramsPage() {
  const navigate = useNavigate()
  const programs = usePrograms()
  const sessions = useFinishedSessions()
  const settings = useSettings()
  const [creating, setCreating] = useState(false)

  if (programs === undefined || sessions === undefined || settings === undefined) return null

  const newProgram = (
    <NameSheet
      open={creating}
      onClose={() => setCreating(false)}
      title="Nouveau programme"
      fields={[
        { label: 'Nom du programme', placeholder: 'Ex. Force A/B, PPL' },
        { label: 'Premier jour', placeholder: 'Ex. Push, Jambes, Haut du corps' },
      ]}
      confirmLabel="Créer le programme"
      onConfirm={async ([name, day]) => {
        const id = await createProgram(name, day)
        setCreating(false)
        navigate(`/programmes/${id}`)
      }}
    />
  )

  if (programs.length === 0) {
    return (
      <main className="flex flex-1 flex-col gap-3 px-4 pt-2 pb-4">
        <h1 className="text-title-l font-extrabold tracking-[-0.02em]">Programmes</h1>
        <div className="flex flex-1 flex-col items-center justify-center gap-2 px-4 text-center">
          <span className="flex size-16 items-center justify-center rounded-full bg-surface-2 text-muted">
            <IconProgrammes size={28} />
          </span>
          <h2 className="mt-2 text-title font-bold">Aucun programme</h2>
        </div>
        <Button onClick={() => setCreating(true)}>
          <IconPlus size={20} />
          Créer un programme
        </Button>
        {newProgram}
      </main>
    )
  }

  return (
    <main className="flex flex-1 flex-col gap-3 px-4 pt-2 pb-4">
      <h1 className="text-title-l font-extrabold tracking-[-0.02em]">Programmes</h1>
      {programs.map(({ program, days }) => {
        const active = settings.activeProgramId === program.id
        const next = active ? nextDay(days.map((d) => d.day), sessions) : undefined
        return (
          <Link
            key={program.id}
            to={`/programmes/${program.id}`}
            className="flex shrink-0 flex-col gap-2.5 rounded-lg border border-border bg-surface py-3.5 pr-3 pl-4 text-text no-underline active:bg-surface-2"
          >
            <span className="flex items-center gap-2">
              <span className="flex-1 text-[20px] leading-6 font-extrabold tracking-[-0.01em]">{program.name}</span>
              {active && <Pill>Actif</Pill>}
              <span className="flex text-muted">
                <IconChevronDroite size={20} />
              </span>
            </span>
            <span className="-mt-1.5 text-small text-muted">
              {next ? `Prochaine séance : ${next.name}` : plural(days.length, 'jour')}
            </span>
            <span className="flex flex-col divide-y divide-border">
              {days.map(({ day, exercises }) => (
                <span key={day.id} className="flex min-h-9 items-center justify-between gap-2">
                  <span className="text-body font-semibold">{day.name}</span>
                  <span className="text-small text-muted">{plural(exercises.length, 'exercice')}</span>
                </span>
              ))}
            </span>
          </Link>
        )
      })}
      <div className="flex-1" />
      <Button onClick={() => setCreating(true)}>
        <IconPlus size={20} />
        Nouveau programme
      </Button>
      {newProgram}
    </main>
  )
}

export default ProgramsPage
