// Séance en cours (maquette D5 « Séance en cours ») : pastilles d'exercices, séries,
// progression, pavé de saisie Charge / Reps et bouton « Valider la série ».
// Les onglets du bas sont masqués sur cet écran (décision de D2).
// Terminer demande toujours une confirmation : un appui de trop en salle ne doit pas clore la séance.
// Valider une série lance le repos (J4) : l'écran de repos remplace alors la saisie.
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { BadgeIncrease } from '../../components/Badge.tsx'
import Button from '../../components/Button.tsx'
import Card from '../../components/Card.tsx'
import NumberStepper from '../../components/NumberStepper.tsx'
import SessionProgress from '../../components/SessionProgress.tsx'
import SetRow from '../../components/SetRow.tsx'
import Sheet from '../../components/Sheet.tsx'
import { Link } from 'react-router'
import { IconChevronDroite, IconOptions, IconPlus } from '../../components/icons.tsx'
import {
  addSet,
  clearSessionRest,
  discardSession,
  endSession,
  startSession,
  updateSet,
  validateSetAndRest,
} from '../../db/sessions.ts'
import { VARIANT_LABELS } from '../../lib/exercises.ts'
import {
  increaseBadge,
  lastPerformance,
  minWeight,
  parseReps,
  parseWeight,
  stepWeight,
  weightStep,
} from '../../lib/progression.ts'
import { formatRest } from '../../lib/rest.ts'
import { currentSet, formatNumber, groupSetsByExercise, sessionProgress, type SessionSet } from '../../lib/sessions.ts'
import { useSettings } from '../settings/useSettings.ts'
import RestScreen from '../timer/RestScreen.tsx'
import { unlockAudio } from '../timer/sound.ts'
import ExerciseMenu from './ExerciseMenu.tsx'
import SessionHeader from './SessionHeader.tsx'
import { useActiveSession, useExercisesById, useHistorySets, useSessionSets } from './useSession.ts'

/** Chrono de la séance, remis à jour chaque seconde. */
function useTicker(active: boolean) {
  const [, setTick] = useState(0)
  useEffect(() => {
    if (!active) return
    const timer = window.setInterval(() => setTick((t) => t + 1), 1000)
    return () => window.clearInterval(timer)
  }, [active])
}

function SessionPage() {
  const navigate = useNavigate()
  const session = useActiveSession()
  const sets = useSessionSets(session?.id)
  const history = useHistorySets(session?.id)
  const exercises = useExercisesById()
  const settings = useSettings()
  const [selected, setSelected] = useState<number | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [confirmEnd, setConfirmEnd] = useState(false)
  useTicker(session !== null && session !== undefined)

  if (
    session === undefined ||
    sets === undefined ||
    exercises === undefined ||
    history === undefined ||
    settings === undefined
  )
    return null

  // Aucune séance en cours : on en propose une (arrivée directe sur l'adresse /seance)
  if (session === null) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
        <h1 className="text-title-l font-extrabold tracking-[-0.02em]">Aucune séance en cours</h1>
        <Button
          className="max-w-xs"
          onClick={async () => {
            await startSession()
          }}
        >
          Démarrer une séance
        </Button>
        <Button variant="link" to="/">
          Retour à l’accueil
        </Button>
      </main>
    )
  }

  const blocks = groupSetsByExercise(sets)
  const nextSet = currentSet(sets)
  const activeOrder = selected ?? nextSet?.exerciseOrder ?? blocks[0]?.exerciseOrder ?? null
  const block = blocks.find((b) => b.exerciseOrder === activeOrder)
  const editing: SessionSet | undefined = block?.sets.find((s) => !s.done)
  const exercise = block ? exercises.get(block.exerciseId) : undefined
  const progress = sessionProgress(sets)
  const steps = settings.weightSteps
  const badge = block
    ? increaseBadge(lastPerformance(history, block.exerciseId, block.variant), block.variant, steps)
    : null
  const step = block ? weightStep(block.variant, steps) : 2.5

  const header = <SessionHeader session={session} onEnd={() => setConfirmEnd(true)} />

  // Confirmation de fin de séance. Sans aucune série validée, il n'y a rien à garder :
  // la séance est abandonnée au lieu de laisser une séance vide dans l'historique.
  const remaining = progress.total - progress.done
  const plural = (n: number, word: string) => `${n} ${word}${n > 1 ? 's' : ''}`
  const endSheet = (
    <Sheet open={confirmEnd} onClose={() => setConfirmEnd(false)} label="Terminer la séance ?">
      <div>
        <div className="text-title font-bold">Terminer la séance ?</div>
        <p className="text-body text-muted">
          {progress.done === 0
            ? 'Aucune série validée : la séance sera abandonnée, rien ne sera enregistré.'
            : `${plural(progress.done, 'série')} ${progress.done > 1 ? 'validées' : 'validée'}.` +
              (remaining > 0
                ? ` ${remaining > 1 ? `Les ${remaining} séries non faites seront retirées.` : 'La série non faite sera retirée.'}`
                : '')}
        </p>
      </div>
      <Button
        variant={progress.done === 0 ? 'danger' : 'primary'}
        onClick={async () => {
          if (progress.done === 0) {
            await discardSession(session.id)
            navigate('/', { replace: true })
          } else {
            await endSession(session.id)
            navigate(`/seance/recap/${session.id}`, { replace: true })
          }
        }}
      >
        {progress.done === 0 ? 'Abandonner la séance' : 'Terminer'}
      </Button>
      <Button variant="secondary" onClick={() => setConfirmEnd(false)}>
        Continuer la séance
      </Button>
    </Sheet>
  )

  // Séance vide : on invite à ajouter le premier exercice
  if (blocks.length === 0) {
    return (
      <main className="flex flex-1 flex-col gap-3 px-4 pt-1 pb-4">
        {header}
        <div className="flex flex-1 flex-col justify-center gap-2 px-2">
          <h1 className="text-title-l font-extrabold tracking-[-0.02em]">Séance libre</h1>
          <p className="text-body text-muted">
            Ajoute ton premier exercice. Ses séries seront pré-remplies avec ta dernière fois.
          </p>
        </div>
        <Button to="/seance/exercices" className="text-[20px] font-extrabold">
          <IconPlus size={22} />
          Ajouter un exercice
        </Button>
        {endSheet}
      </main>
    )
  }

  const unit = exercise?.type === 'charge' ? 'kg' : ''

  // Repos en cours : la série qui suit est celle de l'exercice affiché, sinon la prochaine de la séance
  if (session.rest) {
    const upcomingSet = editing ?? nextSet
    const upcomingExercise = upcomingSet ? exercises.get(upcomingSet.exerciseId) : undefined
    return (
      <>
        <RestScreen
          session={{ ...session, rest: session.rest }}
          progress={progress}
          sound={settings.restSound}
          upcoming={
            upcomingSet && {
              name: upcomingExercise?.name ?? 'Exercice',
              order: upcomingSet.order,
              weight: upcomingExercise?.type === 'poids-du-corps' ? null : upcomingSet.weight,
              reps: upcomingSet.reps,
              targetRepsMin: upcomingSet.targetRepsMin,
              targetRepsMax: upcomingSet.targetRepsMax,
            }
          }
          onEnd={() => setConfirmEnd(true)}
          onDone={() => {
            // Retour à la saisie sur la série annoncée dans « Ensuite »
            if (!editing) setSelected(null)
            void clearSessionRest(session.id)
          }}
        />
        {endSheet}
      </>
    )
  }

  return (
    <main className="flex min-h-0 flex-1 flex-col gap-3 px-4 pt-1 pb-4">
      {header}

      {/* Pastilles des exercices de la séance */}
      <nav aria-label="Exercices de la séance" className="-mr-4 flex shrink-0 items-center gap-2">
        <div className="flex flex-1 gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {blocks.map((b) => {
            const on = b.exerciseOrder === activeOrder
            return (
              <button
                key={b.exerciseOrder}
                type="button"
                aria-current={on ? 'step' : undefined}
                onClick={() => setSelected(b.exerciseOrder)}
                className={`inline-flex min-h-12 shrink-0 items-center gap-1.5 rounded-full border-[1.5px] px-3.5 text-body font-semibold whitespace-nowrap ${
                  on ? 'border-inverse bg-inverse text-on-inverse' : 'border-border-strong text-text'
                }`}
              >
                {exercises.get(b.exerciseId)?.name ?? 'Exercice'}{' '}
                <span className="num opacity-80">
                  {b.doneCount}/{b.sets.length}
                </span>
              </button>
            )
          })}
        </div>
        <Link
          to="/seance/exercices"
          aria-label="Ajouter un exercice"
          className="mr-4 flex size-12 shrink-0 items-center justify-center rounded-full border-[1.5px] border-border-strong text-text"
        >
          <IconPlus size={20} />
        </Link>
      </nav>

      {/* Exercice en cours */}
      <div className="flex shrink-0 items-start gap-2">
        <div className="flex-1">
          <h1 className="text-title-l font-extrabold tracking-[-0.02em]">{exercise?.name ?? 'Exercice'}</h1>
          <div className="text-body text-muted">
            <span className="num text-num-s text-text">
              {editing?.targetRepsMin ? (
                <>
                  {block!.sets.length} × {editing.targetRepsMin}
                  {editing.targetRepsMax && editing.targetRepsMax !== editing.targetRepsMin
                    ? `–${editing.targetRepsMax}`
                    : ''}{' '}
                  reps
                </>
              ) : (
                plural(block!.sets.length, 'série')
              )}
            </span>
            {block!.variant ? ` · ${VARIANT_LABELS[block!.variant]}` : ''}
            {' · repos '}
            <span className="num">{formatRest(settings.restSeconds)}</span>
          </div>
        </div>
        <button
          type="button"
          aria-label="Options de l’exercice"
          onClick={() => setMenuOpen(true)}
          className="-mr-2 flex size-12 shrink-0 items-center justify-center rounded-md text-text"
        >
          <IconOptions />
        </button>
      </div>

      {/* Séries */}
      <Card className="flex shrink-0 flex-col gap-1 p-1">
        {block!.sets.map((s) => (
          <SetRow
            key={s.id}
            index={s.order}
            weight={s.weight > 0 ? `${formatNumber(s.weight)} kg` : '—'}
            reps={s.reps}
            state={s.done ? 'done' : s.id === editing?.id ? 'current' : 'next'}
          />
        ))}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => addSet(session.id, block!.exerciseOrder)}
            className="min-h-12 px-2.5 text-body font-semibold text-text"
          >
            + Série
          </button>
          {blocks.length > 1 && (
            <button
              type="button"
              onClick={() => {
                const next = blocks.find((b) => b.exerciseOrder > block!.exerciseOrder) ?? blocks[0]
                setSelected(next.exerciseOrder)
              }}
              className="flex min-h-12 items-center gap-1 pr-1.5 pl-2.5 text-body text-text"
            >
              <span className="text-muted">Ensuite :</span>
              <span className="font-semibold">
                {exercises.get((blocks.find((b) => b.exerciseOrder > block!.exerciseOrder) ?? blocks[0]).exerciseId)?.name}
              </span>
              <IconChevronDroite size={18} />
            </button>
          )}
        </div>
      </Card>

      <div className="flex flex-1 flex-col justify-center">
        <SessionProgress done={progress.done} total={progress.total} />
      </div>

      {/* Pavé de saisie de la série en cours */}
      {editing ? (
        <>
          <Card className="flex shrink-0 flex-col gap-2.5 p-3">
            <div className="flex items-center justify-between">
              <span className="text-body-strong font-bold">Série {editing.order}</span>
              {badge && <BadgeIncrease>{badge}</BadgeIncrease>}
            </div>
            {exercise?.type !== 'poids-du-corps' && (
              <NumberStepper
                label="Charge"
                ariaLabel="Charge"
                value={formatNumber(editing.weight)}
                unit={unit || 'kg'}
                minusLabel={`Retirer ${formatNumber(step)} kg`}
                plusLabel={`Ajouter ${formatNumber(step)} kg`}
                canDecrement={editing.weight > minWeight(editing.variant)}
                onDecrement={() =>
                  updateSet(editing.id, { weight: stepWeight(editing.weight, editing.variant, -1, steps) })
                }
                onIncrement={() =>
                  updateSet(editing.id, { weight: stepWeight(editing.weight, editing.variant, 1, steps) })
                }
                inputMode="decimal"
                onType={(text) => {
                  const weight = parseWeight(text, editing.variant)
                  if (weight !== null) updateSet(editing.id, { weight })
                }}
              />
            )}
            <NumberStepper
              label={
                <>
                  Reps
                  {editing.targetRepsMin ? (
                    <>
                      {' · '}
                      <span className="text-text">
                        objectif {editing.targetRepsMin}
                        {editing.targetRepsMax && editing.targetRepsMax !== editing.targetRepsMin
                          ? `–${editing.targetRepsMax}`
                          : ''}
                      </span>
                    </>
                  ) : null}
                </>
              }
              ariaLabel={
                editing.targetRepsMin
                  ? `Répétitions, objectif ${editing.targetRepsMin} à ${editing.targetRepsMax ?? editing.targetRepsMin}`
                  : 'Répétitions'
              }
              value={String(editing.reps)}
              unit="reps"
              minusLabel="Retirer une rep"
              plusLabel="Ajouter une rep"
              canDecrement={editing.reps > 0}
              onDecrement={() => updateSet(editing.id, { reps: Math.max(0, editing.reps - 1) })}
              onIncrement={() => updateSet(editing.id, { reps: editing.reps + 1 })}
              onType={(text) => {
                const reps = parseReps(text)
                if (reps !== null) updateSet(editing.id, { reps })
              }}
            />
          </Card>
          <Button
            className="text-[20px] font-extrabold"
            disabled={editing.reps < 1}
            onClick={() => {
              unlockAudio() // iOS : le son de fin de repos doit être autorisé pendant un geste
              void validateSetAndRest(session.id, editing.id, { weight: editing.weight, reps: editing.reps })
            }}
          >
            Valider la série
          </Button>
        </>
      ) : (
        // Exercice fini : la suite la plus fréquente (une série de plus, un autre exercice) est
        // à portée de pouce ; « Terminer la séance » passe par la confirmation.
        <div className="flex shrink-0 flex-col gap-2.5">
          <div className="flex gap-2.5">
            <Button variant="secondary" onClick={() => addSet(session.id, block!.exerciseOrder)}>
              <IconPlus size={20} />
              Série
            </Button>
            <Button variant="secondary" to="/seance/exercices">
              <IconPlus size={20} />
              Exercice
            </Button>
          </div>
          <Button className="text-[20px] font-extrabold" onClick={() => setConfirmEnd(true)}>
            Terminer la séance
          </Button>
        </div>
      )}

      {endSheet}

      {block && (
        <ExerciseMenu
          open={menuOpen}
          onClose={() => setMenuOpen(false)}
          sessionId={session.id}
          block={block}
          exercise={exercise}
          onRemoved={() => setSelected(null)}
        />
      )}
    </main>
  )
}

export default SessionPage
