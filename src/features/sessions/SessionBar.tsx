// Barre compacte « Séance en cours » posée au-dessus des onglets quand on a réduit la séance
// (maquette D5 « Séance réduite », décision de D2) : un appui ramène à la séance.
// Pendant le repos, elle affiche le décompte et un bouton +15 s ; à la fin du repos, elle passe
// en couleur `rest`, comme l'écran de fin, pour qu'on le voie depuis n'importe quel onglet.
import { Link } from 'react-router'
import { extendSessionRest } from '../../db/sessions.ts'
import { formatRest, isRestFinished, restRemaining } from '../../lib/rest.ts'
import { currentSet, formatDuration, sessionDuration, type Session } from '../../lib/sessions.ts'
import { useNow } from '../timer/useNow.ts'
import { useExercisesById, useSessionSets } from './useSession.ts'

function SessionBar({ session }: { session: Session }) {
  const now = useNow(true, 500)
  const sets = useSessionSets(session.id)
  const exercises = useExercisesById()
  if (sets === undefined || exercises === undefined) return null

  const next = currentSet(sets)
  const nextLabel = next ? `${exercises.get(next.exerciseId)?.name ?? 'Exercice'} · série ${next.order}` : null
  const rest = session.rest
  const finished = rest !== undefined && isRestFinished(rest, now)

  const title = !rest ? 'Séance en cours' : finished ? 'Repos terminé' : 'Séance en cours · repos'
  const subtitle = finished
    ? nextLabel
      ? `${nextLabel} : c’est parti`
      : 'C’est reparti'
    : nextLabel
      ? `${nextLabel} ensuite`
      : 'Reprendre la séance'
  const time = rest ? formatRest(restRemaining(rest, now)) : formatDuration(sessionDuration(session, now))

  return (
    <div className="shrink-0 bg-bg p-2">
      <div
        className={`flex min-h-14 items-center gap-3 rounded-lg pr-1.5 pl-4 ${
          finished ? 'bg-rest text-on-rest' : 'bg-inverse text-on-inverse'
        }`}
      >
        <Link
          to="/seance"
          aria-label={`Revenir à la séance, ${title.toLowerCase()} ${time}`}
          className="flex min-h-14 min-w-0 flex-1 items-center gap-3 text-current no-underline"
        >
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="text-body font-bold">{title}</span>
            <span className={`truncate text-small ${finished ? '' : 'text-on-inverse-muted'}`}>{subtitle}</span>
          </span>
          {!finished && <span className="num text-[22px]">{time}</span>}
        </Link>
        {rest && (
          <button
            type="button"
            onClick={() => void extendSessionRest(session.id)}
            className="inline-flex min-h-11 min-w-16 shrink-0 items-center justify-center rounded-full border-[1.5px] border-current px-3 text-body font-bold"
          >
            +15 s
          </button>
        )}
      </div>
    </div>
  )
}

export default SessionBar
