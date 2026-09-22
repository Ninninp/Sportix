// Petit réglage « libellé … − valeur + » (maquettes J5, panneau d'un exercice du programme) :
// boutons de 48 px, valeur au centre. Pour les réglages hors séance (séries, reps, repos, blocs).
// Chiffres comme ceux des autres pavés − / + de l'app (pavé compact : 30 px, resserrés), unité à
// côté en petit gris (comme « kg ») — aligné le 22/09/2026. Une valeur sans chiffre (« Aucun »)
// s'écrit en texte normal, pas en gros chiffres.
type Props = {
  label: string
  value: string
  /** Unité écrite après la valeur, en petit gris (« sem. », « séances »). */
  unit?: string
  /** Libellé lu par les lecteurs d'écran (ex. « Reps minimum »). */
  ariaLabel: string
  onDecrement: () => void
  onIncrement: () => void
  canDecrement?: boolean
  canIncrement?: boolean
  /** Largeur de la valeur, pour aligner les boutons de plusieurs lignes (par défaut 52 px au moins). */
  valueWidth?: string
}

function MiniStepper({ label, value, unit, ariaLabel, onDecrement, onIncrement, canDecrement = true, canIncrement = true, valueWidth = 'min-w-13' }: Props) {
  const button = 'size-12 rounded-md bg-surface-2 text-[22px] font-bold text-text disabled:text-border-strong'
  return (
    <div className="flex min-h-13 items-center justify-between gap-3">
      <span className="text-body-strong">{label}</span>
      <span role="group" aria-label={ariaLabel} className="flex items-center gap-2">
        <button type="button" aria-label={`${ariaLabel} : moins`} disabled={!canDecrement} onClick={onDecrement} className={button}>
          −
        </button>
        <span className={`${valueWidth} text-center whitespace-nowrap`}>
          {/\d/.test(value) ? (
            <span className="num text-[30px] leading-[34px] tracking-[-0.02em]">{value}</span>
          ) : (
            <span className="text-body-strong font-semibold">{value}</span>
          )}
          {unit && <span className="ml-1 text-small font-semibold text-muted">{unit}</span>}
        </span>
        <button type="button" aria-label={`${ariaLabel} : plus`} disabled={!canIncrement} onClick={onIncrement} className={button}>
          +
        </button>
      </span>
    </div>
  )
}

export default MiniStepper
