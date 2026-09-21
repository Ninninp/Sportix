// Petit réglage « libellé … − valeur + » (maquettes J5, panneau d'un exercice du programme) :
// boutons de 48 px, valeur au centre. Pour les réglages hors séance (séries, reps, repos).
type Props = {
  label: string
  value: string
  /** Libellé lu par les lecteurs d'écran (ex. « Reps minimum »). */
  ariaLabel: string
  onDecrement: () => void
  onIncrement: () => void
  canDecrement?: boolean
  canIncrement?: boolean
}

function MiniStepper({ label, value, ariaLabel, onDecrement, onIncrement, canDecrement = true, canIncrement = true }: Props) {
  const button = 'size-12 rounded-md bg-surface-2 text-[22px] font-bold text-text disabled:text-border-strong'
  return (
    <div className="flex min-h-13 items-center justify-between gap-3">
      <span className="text-body-strong">{label}</span>
      <span role="group" aria-label={ariaLabel} className="flex items-center gap-2">
        <button type="button" aria-label={`${ariaLabel} : moins`} disabled={!canDecrement} onClick={onDecrement} className={button}>
          −
        </button>
        <span className="num min-w-13 text-center text-[22px]">{value}</span>
        <button type="button" aria-label={`${ariaLabel} : plus`} disabled={!canIncrement} onClick={onIncrement} className={button}>
          +
        </button>
      </span>
    </div>
  )
}

export default MiniStepper
