// Pavé de saisie − / + du design system (D4) : boutons de 56 px de large, grande valeur au centre.
// Utilisé en salle, à une main : maintenir un bouton enfoncé répète l'action.
import { useEffect, useRef, type ReactNode } from 'react'

type Props = {
  label: ReactNode
  /** Libellé lu par les lecteurs d'écran (le visuel peut contenir l'objectif de reps). */
  ariaLabel: string
  value: string
  unit: string
  onDecrement: () => void
  onIncrement: () => void
  minusLabel: string
  plusLabel: string
  canDecrement?: boolean
}

function NumberStepper({
  label,
  ariaLabel,
  value,
  unit,
  onDecrement,
  onIncrement,
  minusLabel,
  plusLabel,
  canDecrement = true,
}: Props) {
  // Les actions sont relues à chaque répétition : si on gardait celles du premier appui,
  // elles repartiraient toujours de la même valeur et la charge n'avancerait que d'un pas.
  const actions = useRef({ onIncrement, onDecrement })
  useEffect(() => {
    actions.current = { onIncrement, onDecrement }
  })

  const timer = useRef<number | undefined>(undefined)
  const stop = () => {
    window.clearInterval(timer.current)
    timer.current = undefined
  }
  useEffect(() => stop, [])

  const hold = (direction: 'onIncrement' | 'onDecrement') => {
    const run = () => actions.current[direction]()
    return {
      onPointerDown: () => {
        run()
        let ticks = 0
        // Première répétition après 300 ms, puis accélération
        timer.current = window.setInterval(() => {
          ticks += 1
          run()
          if (ticks === 5) {
            stop()
            timer.current = window.setInterval(run, 80)
          }
        }, 300)
      },
      onPointerUp: stop,
      onPointerLeave: stop,
      onPointerCancel: stop,
    }
  }

  const button = 'w-14 shrink-0 bg-surface-2 text-[26px] font-bold text-text disabled:text-border-strong'

  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className="flex h-15 items-stretch overflow-hidden rounded-md border-[1.5px] border-border-strong bg-surface"
    >
      <button type="button" aria-label={minusLabel} disabled={!canDecrement} className={button} {...hold('onDecrement')}>
        −
      </button>
      <div className="flex flex-1 flex-col items-center justify-center">
        <span className="text-caption font-semibold tracking-[0.06em] text-muted uppercase">{label}</span>
        <span>
          <span className="num text-num-l tracking-[-0.02em]">{value}</span>{' '}
          <span className="text-body font-semibold text-muted">{unit}</span>
        </span>
      </div>
      <button type="button" aria-label={plusLabel} className={button} {...hold('onIncrement')}>
        +
      </button>
    </div>
  )
}

export default NumberStepper
