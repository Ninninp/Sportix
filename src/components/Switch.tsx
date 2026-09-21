// Interrupteur marche / arrêt (maquette « Réglages » de D5) : 52 × 32 px, pastille qui glisse.
// Toute la ligne qui le contient est cliquable (le libellé est dans le <label> parent).
type Props = { checked: boolean; onChange: (checked: boolean) => void; label: string }

function Switch({ checked, onChange, label }: Props) {
  return (
    <label className="flex min-h-14 cursor-pointer items-center justify-between gap-3 px-4">
      <span className="text-body-strong">{label}</span>
      <input
        type="checkbox"
        role="switch"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="relative h-8 w-[52px] shrink-0 cursor-pointer appearance-none rounded-full bg-border-strong transition-colors duration-200 checked:bg-inverse after:absolute after:top-[3px] after:left-[3px] after:size-[26px] after:rounded-full after:bg-white after:transition-[left] after:duration-200 after:ease-out after:content-[''] checked:after:left-[23px] checked:after:bg-on-inverse"
      />
    </label>
  )
}

export default Switch
