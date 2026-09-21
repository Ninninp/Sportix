// Panneau d'un exercice du programme (maquettes J5 « Exercice du programme ») : variante, séries,
// double progression, reps, repos, et « Retirer du jour ». Chaque réglage est enregistré aussitôt.
// Double progression activée : une fourchette de reps (au moins / au plus) ; désactivée : un
// nombre de reps fixe (retour du 21/09/2026).
import ChipGroup from '../../components/ChipGroup.tsx'
import MiniStepper from '../../components/MiniStepper.tsx'
import Sheet from '../../components/Sheet.tsx'
import Switch from '../../components/Switch.tsx'
import { IconCorbeille } from '../../components/icons.tsx'
import { removeDayExercise, updateDayExercise } from '../../db/programs.ts'
import { VARIANT_LABELS, type Exercise, type Variant } from '../../lib/exercises.ts'
import type { ProgramExercise } from '../../lib/programs.ts'
import { formatRest } from '../../lib/rest.ts'
import { REST_MAX, REST_MIN, stepRest } from '../../lib/settings.ts'

const MAX_SETS = 10
const MAX_REPS = 50

type Props = { exercise: ProgramExercise | undefined; info: Exercise | undefined; onClose: () => void }

function ProgramExerciseSheet({ exercise: pe, info, onClose }: Props) {
  const update = (changes: Partial<ProgramExercise>) => pe && void updateDayExercise(pe.id, changes)
  return (
    <Sheet open={pe !== undefined} onClose={onClose} label={info?.name ?? 'Exercice'}>
      {pe && (
        <>
          <div className="text-title font-bold">{info?.name ?? 'Exercice'}</div>

          {info && info.variants.length > 1 && (
            <div className="flex flex-col gap-2">
              <span className="text-caption font-semibold tracking-[0.06em] text-muted uppercase">Variante</span>
              <ChipGroup<Variant>
                label="Variante"
                options={info.variants.map((v) => ({ value: v, label: VARIANT_LABELS[v] }))}
                selected={pe.variant ? [pe.variant] : []}
                onToggle={(variant) => update({ variant })}
              />
            </div>
          )}

          <div className="flex flex-col">
            <MiniStepper
              label="Séries"
              ariaLabel="Séries"
              value={String(pe.sets)}
              canDecrement={pe.sets > 1}
              canIncrement={pe.sets < MAX_SETS}
              onDecrement={() => update({ sets: pe.sets - 1 })}
              onIncrement={() => update({ sets: pe.sets + 1 })}
            />
            <Switch
              inset
              label="Double progression"
              checked={pe.doubleProgression}
              // Désactivée : un seul nombre de reps ; réactivée : une fourchette qui part de ce nombre
              onChange={(on) =>
                update(on ? { doubleProgression: true, repsMax: Math.min(MAX_REPS, pe.repsMin + 2) } : { doubleProgression: false, repsMax: pe.repsMin })
              }
            />
            {pe.doubleProgression ? (
              <>
                <MiniStepper
                  label="Reps, au moins"
                  ariaLabel="Reps minimum"
                  value={String(pe.repsMin)}
                  canDecrement={pe.repsMin > 1}
                  canIncrement={pe.repsMin < pe.repsMax}
                  onDecrement={() => update({ repsMin: pe.repsMin - 1 })}
                  onIncrement={() => update({ repsMin: pe.repsMin + 1 })}
                />
                <MiniStepper
                  label="Reps, au plus"
                  ariaLabel="Reps maximum"
                  value={String(pe.repsMax)}
                  canDecrement={pe.repsMax > pe.repsMin}
                  canIncrement={pe.repsMax < MAX_REPS}
                  onDecrement={() => update({ repsMax: pe.repsMax - 1 })}
                  onIncrement={() => update({ repsMax: pe.repsMax + 1 })}
                />
              </>
            ) : (
              <MiniStepper
                label="Reps"
                ariaLabel="Reps"
                value={String(pe.repsMin)}
                canDecrement={pe.repsMin > 1}
                canIncrement={pe.repsMin < MAX_REPS}
                onDecrement={() => update({ repsMin: pe.repsMin - 1, repsMax: pe.repsMin - 1 })}
                onIncrement={() => update({ repsMin: pe.repsMin + 1, repsMax: pe.repsMin + 1 })}
              />
            )}
            <MiniStepper
              label="Repos"
              ariaLabel="Repos"
              value={formatRest(pe.restSeconds)}
              canDecrement={pe.restSeconds > REST_MIN}
              canIncrement={pe.restSeconds < REST_MAX}
              onDecrement={() => update({ restSeconds: stepRest(pe.restSeconds, -1) })}
              onIncrement={() => update({ restSeconds: stepRest(pe.restSeconds, 1) })}
            />
          </div>

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={async () => {
                await removeDayExercise(pe.id)
                onClose()
              }}
              className="inline-flex min-h-12 items-center gap-2 px-1 text-body font-semibold text-danger"
            >
              <IconCorbeille size={20} />
              Retirer du jour
            </button>
            <button type="button" onClick={onClose} className="min-h-12 px-3 text-body font-semibold text-text underline underline-offset-[3px]">
              OK
            </button>
          </div>
        </>
      )}
    </Sheet>
  )
}

export default ProgramExerciseSheet
