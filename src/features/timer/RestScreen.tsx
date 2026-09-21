// Écrans de repos (maquettes D5, page J4), affichés à la place de la saisie pendant le repos :
// - repos actif : gros décompte, barre qui se vide, carte « Ensuite », +15 s / Passer ;
// - repos prolongé : le même, relancé par « +15 s » après la fin ;
// - repos terminé : tout l'écran passe en couleur `rest` (signal visible de loin, iOS ne vibre pas),
//   avec la série suivante en très gros, +15 s de repos / C'est parti.
// Le temps restant est recalculé depuis l'horodatage de fin enregistré (src/lib/rest.ts).
// Animations (CSS, src/index.css) : l'aplat de fin jaillit depuis le décompte ; « +15 s de repos »
// le fait s'effacer pendant que le chrono grandit et que la carte « Ensuite » se range.
import { useState } from 'react'
import Button from '../../components/Button.tsx'
import Card from '../../components/Card.tsx'
import SessionProgress from '../../components/SessionProgress.tsx'
import { extendSessionRest } from '../../db/sessions.ts'
import { extendRest, formatRest, isRestFinished, restFraction, restRemaining, type Rest } from '../../lib/rest.ts'
import { formatNumber, formatTarget, type Session } from '../../lib/sessions.ts'
import SessionHeader from '../sessions/SessionHeader.tsx'
import { useNow } from './useNow.ts'

/** La série qui suit le repos. `weight` est null pour un exercice au poids du corps. */
export type UpcomingSet = {
  name: string
  order: number
  weight: number | null
  reps: number
  targetRepsMin?: number
  targetRepsMax?: number
}

type Props = {
  session: Session & { rest: Rest }
  progress: { done: number; total: number }
  upcoming: UpcomingSet | undefined
  onEnd: () => void
  onDone: () => void
}

function RestScreen({ session, progress, upcoming, onEnd, onDone }: Props) {
  // « +15 s » est appliqué tout de suite à l'écran, sans attendre la base (qui suit juste après)
  const [local, setLocal] = useState<{ from: number; rest: Rest } | null>(null)
  const rest = local?.from === session.rest.endsAt ? local.rest : session.rest
  // Rafraîchi pile à chaque changement de seconde du décompte (secondes calées sur la fin)
  const now = useNow(rest.endsAt)
  const finished = isRestFinished(rest, now)
  // Repos relancé depuis l'écran de fin : on joue l'animation de retour au repos actif
  const [fromEnd, setFromEnd] = useState(false)
  const target = upcoming ? formatTarget(upcoming.targetRepsMin, upcoming.targetRepsMax) : null

  const extend = () => {
    setFromEnd(finished)
    setLocal({ from: session.rest.endsAt, rest: extendRest(rest, Date.now()) })
    void extendSessionRest(session.id)
  }

  if (finished) {
    return (
      <main className="fixed inset-0 z-40 flex animate-[sx-fin-repos_320ms_var(--ease-out)] flex-col gap-3 bg-rest px-4 pt-[calc(env(safe-area-inset-top)+4px)] pb-[calc(env(safe-area-inset-bottom)+16px)] text-on-rest">
        <SessionHeader session={session} onEnd={onEnd} onRest />
        <div role="status" className="flex flex-1 flex-col justify-center gap-1.5">
          <div className="text-[17px] font-extrabold">
            Repos terminé · <span className="num">{formatRest(rest.duration)}</span>
          </div>
          {upcoming ? (
            <>
              <h1 className="mt-4 text-[40px] leading-[44px] font-extrabold tracking-[-0.02em]">
                {upcoming.name} · série {upcoming.order}
              </h1>
              <div className="num text-num-hero tracking-[-0.03em] whitespace-nowrap">
                {upcoming.weight !== null ? formatNumber(upcoming.weight) : upcoming.reps}
                <span className="text-[40px]">{upcoming.weight !== null ? ' kg' : ' reps'}</span>
              </div>
              <div className="text-[22px] font-bold">
                {upcoming.weight !== null && (
                  <>
                    <span className="num text-[30px]">× {upcoming.reps}</span> reps
                  </>
                )}
                {upcoming.weight !== null && target && ' · '}
                {target && (
                  <>
                    objectif <span className="num text-[30px]">{target}</span>
                  </>
                )}
              </div>
            </>
          ) : (
            <h1 className="mt-4 text-[40px] leading-[44px] font-extrabold tracking-[-0.02em]">Dernière série faite</h1>
          )}
        </div>
        <SessionProgress done={progress.done} total={progress.total} onRest />
        <div className="grid shrink-0 grid-cols-[2fr_3fr] gap-3">
          <button
            type="button"
            onClick={extend}
            className="min-h-15 rounded-md border-[1.5px] border-on-rest px-2 text-body font-bold whitespace-nowrap text-on-rest transition-transform duration-[120ms] active:scale-[0.97]"
          >
            +15 s de repos
          </button>
          <button
            type="button"
            onClick={onDone}
            className="min-h-15 rounded-md bg-on-rest px-3 text-[20px] font-extrabold text-rest transition-transform duration-[120ms] active:scale-[0.97]"
          >
            C’est parti
          </button>
        </div>
      </main>
    )
  }

  const remaining = restRemaining(rest, now)
  return (
    <main className="flex min-h-0 flex-1 flex-col gap-3 px-4 pt-1 pb-4">
      {fromEnd && (
        // L'aplat de fin de repos s'efface au lieu de disparaître d'un coup
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-40 animate-[sx-effacer_320ms_var(--ease-out)_forwards] bg-rest"
        />
      )}
      <SessionHeader session={session} onEnd={onEnd} />
      <div
        role="timer"
        aria-label={`Repos restant ${formatRest(remaining)}`}
        className="flex flex-1 flex-col items-center justify-center gap-2"
      >
        <span className="flex items-center gap-2 text-body font-bold text-muted">
          {rest.extended ? 'Repos prolongé' : 'Repos'}
          {rest.extended && (
            <span className="num rounded-full bg-surface-2 px-2 py-0.5 text-small font-bold text-text">
              +{rest.duration} s
            </span>
          )}
        </span>
        <span className={`num text-num-xl tracking-[-0.02em] ${fromEnd ? 'animate-[sx-grandir_320ms_var(--ease-out)]' : ''}`}>
          {formatRest(remaining)}
        </span>
        <span className="num text-body font-medium text-muted">sur {formatRest(rest.duration)}</span>
        <div className="mt-3 h-2.5 w-full overflow-hidden rounded-[5px] border-[1.5px] border-border-strong">
          <div
            // La barre glisse sur toute la seconde : elle se vide en continu, sans à-coups
            className="h-full bg-text transition-[width] duration-1000 ease-linear"
            style={{ width: `${restFraction(rest, now) * 100}%` }}
          />
        </div>
      </div>

      <SessionProgress done={progress.done} total={progress.total} />

      {upcoming && (
        <Card
          className={`flex shrink-0 flex-col gap-0.5 px-4 py-3 ${fromEnd ? 'animate-[sx-ranger_320ms_var(--ease-out)]' : ''}`}
        >
          <div className="text-small text-muted">Ensuite</div>
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-body-strong font-semibold">
              {upcoming.name} · série {upcoming.order}
            </span>
            <span className="num shrink-0 text-num-s">
              {upcoming.weight !== null ? `${formatNumber(upcoming.weight)} kg × ${upcoming.reps}` : `× ${upcoming.reps}`}
            </span>
          </div>
          {target && (
            <div className="text-small text-muted">
              objectif <span className="num">{target}</span> reps
            </div>
          )}
        </Card>
      )}

      <div className="grid shrink-0 grid-cols-[2fr_3fr] gap-3">
        <Button variant="secondary" onClick={extend}>
          +15 s
        </Button>
        <Button className="text-[20px] font-extrabold" onClick={onDone}>
          Passer
        </Button>
      </div>
    </main>
  )
}

export default RestScreen
