// Pastille à toucher (48 px de haut) : filtre, groupe musculaire, variante…
// Active = couleurs inversées (« choisi »), inactive = simple contour.
import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { selected: boolean; children: ReactNode }

function Chip({ selected, className = '', children, ...rest }: Props) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={
        'inline-flex min-h-12 shrink-0 items-center gap-1.5 rounded-full border-[1.5px] px-4 text-body font-semibold ' +
        'transition-transform duration-[120ms] ease-out active:scale-[0.97] ' +
        (selected ? 'border-inverse bg-inverse text-on-inverse ' : 'border-border-strong bg-transparent text-text ') +
        className
      }
      {...rest}
    >
      {children}
    </button>
  )
}

export default Chip
