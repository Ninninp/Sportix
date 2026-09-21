// En-tête de la séance en cours (maquettes D5) : flèche « réduire », nom et chrono, « Terminer ».
// `onRest` : version posée sur l'écran de fin de repos (tout en couleur on-rest).
import { Link } from 'react-router'
import { IconChevronBas } from '../../components/icons.tsx'
import { formatDuration, sessionDuration, type Session } from '../../lib/sessions.ts'
import { useNow } from '../timer/useNow.ts'

type Props = { session: Session; onEnd: () => void; onRest?: boolean }

function SessionHeader({ session, onEnd, onRest = false }: Props) {
  // Le chrono se rafraîchit pile à chaque changement de seconde depuis le début de la séance
  const now = useNow(session.startedAt)
  return (
    <header className={`-mx-2 flex shrink-0 items-center gap-1 ${onRest ? 'text-on-rest' : 'text-text'}`}>
      <Link
        to="/"
        aria-label="Réduire la séance (elle continue)"
        className="flex size-12 shrink-0 items-center justify-center rounded-md text-current"
      >
        <IconChevronBas />
      </Link>
      <div className="flex-1">
        <div className="text-body font-bold">Séance libre</div>
        <div className={`num text-body ${onRest ? '' : 'text-muted'}`}>{formatDuration(sessionDuration(session, now))}</div>
      </div>
      <button
        type="button"
        onClick={onEnd}
        className={`min-h-12 px-3 text-body font-semibold underline underline-offset-[3px] ${onRest ? 'text-on-rest' : 'text-muted'}`}
      >
        Terminer
      </button>
    </header>
  )
}

export default SessionHeader
