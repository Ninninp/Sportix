// Choix unique parmi quelques options côte à côte (ex. Charge / Poids du corps / Temps, kg / lb).
type Option<T> = { value: T; label: string }

type Props<T> = {
  label: string
  options: Option<T>[]
  value: T
  onChange: (value: T) => void
}

function SegmentedControl<T extends string>({ label, options, value, onChange }: Props<T>) {
  const n = options.length
  const index = options.findIndex((o) => o.value === value)
  return (
    <div
      role="group"
      aria-label={label}
      className="relative grid gap-1 rounded-md bg-surface-2 p-1"
      style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}
    >
      {/* J10 : la pastille de l'option choisie glisse d'une option à l'autre (200 ms, ease-out).
          Sa largeur est celle d'une colonne : (largeur − marges − espaces) / n. */}
      {index >= 0 && (
        <span
          aria-hidden="true"
          className="absolute top-1 bottom-1 left-1 rounded-[9px] bg-inverse transition-transform duration-[260ms] ease-out"
          style={{
            width: `calc((100% - 0.5rem - ${(n - 1) * 0.25}rem) / ${n})`,
            transform: `translateX(calc(${index} * (100% + 0.25rem)))`,
          }}
        />
      )}
      {options.map((o) => {
        const on = o.value === value
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(o.value)}
            // Texte sur une seule ligne : en gras, une option longue (« Poids du corps ») déborderait
            // de sa colonne et ferait grandir le bloc au moment du choix.
            className={
              'relative min-h-12 rounded-[9px] bg-transparent px-1 text-small whitespace-nowrap transition-colors duration-[260ms] ease-out ' +
              (on ? 'font-bold text-on-inverse' : 'font-medium text-text')
            }
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

export default SegmentedControl
