// Choix unique parmi quelques options côte à côte (ex. Charge / Poids du corps / Temps, kg / lb).
type Option<T> = { value: T; label: string }

type Props<T> = {
  label: string
  options: Option<T>[]
  value: T
  onChange: (value: T) => void
}

/** Durée du glissement de la pastille (J10). */
const SLIDE_MS = 260

function SegmentedControl<T extends string>({ label, options, value, onChange }: Props<T>) {
  const n = options.length
  const index = options.findIndex((o) => o.value === value)
  const gap = 0.25 // rem : espace entre deux colonnes (gap-1)
  const columns = `repeat(${n}, minmax(0, 1fr))`
  const slide = `transform ${SLIDE_MS}ms var(--ease-glisse)`
  return (
    <div
      role="group"
      aria-label={label}
      className="relative grid gap-1 rounded-md bg-surface-2 p-1"
      style={{ gridTemplateColumns: columns }}
    >
      {/* J10 : la pastille de l'option choisie glisse d'une option à l'autre. Elle porte sa propre
          copie des textes, en couleur inversée, qui glisse EN SENS INVERSE : les textes restent en
          place et la pastille les « éclaire » au passage (comme le sélecteur d'iOS). Sans cela, en
          sautant une option, le texte du milieu passait sous la pastille, illisible.
          Largeur d'une colonne : (largeur − marges − espaces) / n. */}
      {index >= 0 && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute top-1 bottom-1 left-1 z-10 overflow-hidden rounded-[9px] bg-inverse"
          style={{
            width: `calc((100% - 0.5rem - ${(n - 1) * gap}rem) / ${n})`,
            transform: `translateX(calc(${index} * (100% + ${gap}rem)))`,
            transition: slide,
          }}
        >
          <span
            className="grid h-full gap-1"
            style={{
              gridTemplateColumns: columns,
              // n colonnes de la largeur de la pastille (100 % = une colonne), espaces compris
              width: `calc(${n} * 100% + ${(n - 1) * gap}rem)`,
              transform: `translateX(calc(${-index} * (100% + ${gap}rem) / ${n}))`,
              transition: slide,
            }}
          >
            {options.map((o) => (
              <span key={o.value} className="flex items-center justify-center px-1 text-small font-bold whitespace-nowrap text-on-inverse">
                {o.label}
              </span>
            ))}
          </span>
        </span>
      )}
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={o.value === value}
          onClick={() => onChange(o.value)}
          // Texte sur une seule ligne : une option longue (« Poids du corps ») déborderait de sa colonne
          className="relative min-h-12 rounded-[9px] bg-transparent px-1 text-small font-medium whitespace-nowrap text-text"
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export default SegmentedControl
