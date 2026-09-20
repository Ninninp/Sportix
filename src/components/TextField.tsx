// Champ de texte avec son libellé en petites capitales au-dessus (52 px de haut).
import type { InputHTMLAttributes } from 'react'

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> & {
  label: string
  value: string
  onChange: (value: string) => void
}

function TextField({ label, value, onChange, className = '', ...rest }: Props) {
  return (
    <label className={`flex flex-col gap-1.5 ${className}`}>
      <span className="text-caption font-semibold tracking-[0.06em] text-muted uppercase">{label}</span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-[52px] w-full rounded-md border-[1.5px] border-border-strong bg-surface px-3.5 text-body-strong font-semibold text-text placeholder:font-normal placeholder:text-faint"
        {...rest}
      />
    </label>
  )
}

export default TextField
