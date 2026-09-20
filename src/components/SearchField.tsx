// Champ de recherche (loupe à gauche, 48 px). Le libellé est lu par les lecteurs d'écran.
import { IconRecherche } from './icons.tsx'

type Props = { value: string; onChange: (value: string) => void; placeholder: string }

function SearchField({ value, onChange, placeholder }: Props) {
  return (
    <label className="relative block shrink-0">
      <span className="pointer-events-none absolute top-3.5 left-3.5 flex text-muted">
        <IconRecherche size={20} />
      </span>
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        enterKeyHint="search"
        className="h-12 w-full rounded-md border-[1.5px] border-border-strong bg-surface pr-3.5 pl-11 text-body-strong text-text placeholder:text-faint"
      />
    </label>
  )
}

export default SearchField
