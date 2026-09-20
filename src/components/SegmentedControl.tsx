// Choix unique parmi quelques options côte à côte (ex. Charge / Poids du corps / Temps, kg / lb).
type Option<T> = { value: T; label: string }

type Props<T> = {
  label: string
  options: Option<T>[]
  value: T
  onChange: (value: T) => void
}

function SegmentedControl<T extends string>({ label, options, value, onChange }: Props<T>) {
  return (
    <div
      role="group"
      aria-label={label}
      className="grid gap-1 rounded-md bg-surface-2 p-1"
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
    >
      {options.map((o) => {
        const on = o.value === value
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(o.value)}
            className={
              'min-h-12 rounded-[9px] px-1 text-body ' +
              (on ? 'bg-inverse font-bold text-on-inverse' : 'bg-transparent font-medium text-text')
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
