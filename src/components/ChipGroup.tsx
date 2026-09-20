// Groupe de pastilles pour choisir une ou plusieurs valeurs.
// - `scroll` : une seule ligne qui défile à l'horizontale (filtres en haut de liste)
// - sinon les pastilles passent à la ligne (formulaires)
import Chip from './Chip.tsx'

type Option<T> = { value: T; label: string }

type Props<T> = {
  label: string
  options: Option<T>[]
  selected: T[]
  onToggle: (value: T) => void
  scroll?: boolean
}

function ChipGroup<T extends string>({ label, options, selected, onToggle, scroll = false }: Props<T>) {
  return (
    <div
      role="group"
      aria-label={label}
      className={
        scroll
          ? '-mx-4 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'
          : 'flex flex-wrap gap-2'
      }
    >
      {options.map((o) => (
        <Chip key={o.value} selected={selected.includes(o.value)} onClick={() => onToggle(o.value)}>
          {o.label}
        </Chip>
      ))}
    </div>
  )
}

export default ChipGroup
