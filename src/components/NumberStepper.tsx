// Pavé de saisie − / + du design system (D4) : boutons de 56 px de large, grande valeur au centre.
// Utilisé en salle, à une main : maintenir un bouton enfoncé répète l'action.
// Avec `onType`, toucher la valeur ouvre le clavier numérique pour la taper directement
// (utile pour un grand écart, ex. 20 → 60 kg, sinon 16 appuis sur +).
import { useEffect, useRef, useState, type ReactNode } from 'react'

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
  /** Valeur tapée au clavier (texte brut : c'est l'appelant qui la lit et la valide). */
  onType?: (text: string) => void
  /** Clavier proposé : avec virgule (charge) ou chiffres seuls (reps). */
  inputMode?: 'decimal' | 'numeric'
  /** Version compacte (séance en liste, J5) : bloc de 52 px, chiffres de 30 px. */
  compact?: boolean
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
  onType,
  inputMode = 'numeric',
  compact = false,
}: Props) {
  // Tailles : bloc 60 px (étiquette 14 + nombre 34) ou compact 52 px (13 + 32)
  const size = compact
    ? { box: 'h-13', label: 'text-[11px] leading-[13px]', row: 'h-[32px]', num: 'text-[30px] leading-[32px]' }
    : { box: 'h-15', label: 'text-caption leading-[14px]', row: 'h-[34px]', num: 'text-num-l leading-[34px]' }
  // Texte en cours de frappe (null : on affiche la valeur enregistrée)
  const [draft, setDraft] = useState<string | null>(null)
  const cancelled = useRef(false)

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

  const button = `w-14 shrink-0 bg-surface-2 ${compact ? 'text-[24px]' : 'text-[26px]'} font-bold text-text disabled:text-border-strong`

  // overflow-clip (et non hidden) : coupe les coins sans créer de zone qui défile. Sinon, au
  // toucher du nombre, le navigateur fait défiler le bloc de quelques pixels pour montrer le champ.
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={`flex ${size.box} items-stretch overflow-clip rounded-md border-[1.5px] border-border-strong bg-surface`}
    >
      <button type="button" aria-label={minusLabel} disabled={!canDecrement} className={button} {...hold('onDecrement')}>
        −
      </button>
      {/* Le bloc fait 60 px (tokens.md) : étiquette et nombre ont des hauteurs de ligne resserrées
          (14 + 34 px) pour laisser de l'air en haut et en bas. Les chiffres n'ont pas de jambage,
          34 px suffisent à un nombre de 38 px. */}
      <div className="flex flex-1 flex-col items-center justify-center">
        <span className={`${size.label} font-semibold tracking-[0.06em] text-muted uppercase`}>{label}</span>
        <span className={`flex ${size.row} items-baseline justify-center gap-1 has-[input:focus]:gap-3.5`}>
          {onType ? (
            // Le champ se cale sur le texte réellement affiché : une copie invisible du texte
            // donne sa taille à la case, et le champ occupe exactement cette case. (Une largeur
            // estimée en « ch » tombait à côté avec SF Pro sur l'iPhone : texte décalé, collé au bord.)
            // Pendant la saisie, le fond gris déborde autour du nombre (ombres pleines à gauche et à droite, qui ne prennent pas
            // de place : au repos rien ne bouge) et l'unité s'écarte pour ne pas le toucher.
            <span className="inline-grid rounded-sm focus-within:bg-surface-2 focus-within:shadow-[-8px_0_0_var(--color-surface-2),8px_0_0_var(--color-surface-2)]">
              <span aria-hidden="true" className={`num invisible col-start-1 row-start-1 ${size.num} tracking-[-0.02em] whitespace-pre`}>
                {(draft ?? value) || ' '}
              </span>
              <input
                type="text"
                inputMode={inputMode}
                enterKeyHint="done"
                aria-label={`${ariaLabel} : saisir au clavier`}
                value={draft ?? value}
                onFocus={(e) => {
                  cancelled.current = false
                  setDraft(value)
                  e.currentTarget.select()
                }}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') e.currentTarget.blur()
                  if (e.key === 'Escape') {
                    cancelled.current = true
                    e.currentTarget.blur()
                  }
                }}
                onBlur={() => {
                  if (draft !== null && !cancelled.current && draft !== value) onType(draft)
                  setDraft(null)
                }}
                // Hauteur imposée : Safari agrandit sinon le champ au-delà de la hauteur de ligne
                className={`num col-start-1 row-start-1 ${size.row} w-0 min-w-full bg-transparent p-0 text-center ${size.num} tracking-[-0.02em] text-text outline-none`}
              />
            </span>
          ) : (
            <span className={`num ${size.num} tracking-[-0.02em]`}>{value}</span>
          )}
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
