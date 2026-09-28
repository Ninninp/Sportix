// En-tête de la séance en cours (maquettes D5) : flèche « réduire », nom et chrono, « Terminer ».
// `onRest` : version posée sur l'écran de fin de repos (tout en couleur on-rest).
import { Link, useNavigate } from 'react-router'
import { IconChevronBas } from '../../components/icons.tsx'
import { formatDuration, sessionDuration, type Session } from '../../lib/sessions.ts'
import { prefersReducedMotion } from '../motion/useMotion.ts'
import { useNow } from '../timer/useNow.ts'

/** Durée de la descente de la séance quand on la réduit (duration-base, tokens.md). */
const EXIT_MS = 200

type Props = { session: Session; onEnd: () => void; onRest?: boolean }

function SessionHeader({ session, onEnd, onRest = false }: Props) {
  // Le chrono se rafraîchit pile à chaque changement de seconde depuis le début de la séance
  const now = useNow(session.startedAt)
  const navigate = useNavigate()
  return (
    <header className={`-mx-2 flex shrink-0 items-center gap-1 ${onRest ? 'text-on-rest' : 'text-text'}`}>
      <Link
        to="/"
        // J10 : la séance redescend (200 ms) avant de laisser la place à l'accueil
        onClick={(e) => {
          const screen = e.currentTarget.closest<HTMLElement>('[data-seance]')
          if (!screen || prefersReducedMotion()) return
          e.preventDefault()
          if (screen.style.animation) return // deuxième appui pendant la descente : déjà en route
          screen.style.animation = `sx-seance-descend ${EXIT_MS}ms var(--ease-in) forwards`
          window.setTimeout(() => navigate('/'), EXIT_MS)
        }}
        aria-label="Réduire la séance (elle continue)"
        className="flex size-12 shrink-0 items-center justify-center rounded-md text-current"
      >
        <IconChevronBas />
      </Link>
      <div className="flex-1">
        <div className="text-body font-bold">{session.title ?? 'Séance libre'}</div>
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
