// Carte du design system : fond « surface », contour décoratif, arrondi 16 px, sans ombre.
// La variante « inverse » (fond encre en clair, fond clair en sombre) signale « ici, maintenant » :
// la série en cours, la carte de la séance du jour.
import type { HTMLAttributes, ReactNode } from 'react'

type Props = HTMLAttributes<HTMLElement> & {
  inverse?: boolean
  as?: 'div' | 'section'
  children: ReactNode
}

function Card({ inverse = false, as: Tag = 'div', className = '', children, ...rest }: Props) {
  const look = inverse ? 'bg-inverse text-on-inverse' : 'border border-border bg-surface text-text'
  return (
    <Tag className={`rounded-lg ${look} ${className}`} {...rest}>
      {children}
    </Tag>
  )
}

export default Card
