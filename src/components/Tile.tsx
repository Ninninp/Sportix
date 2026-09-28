// Tuile chiffrée (planche « Fin de séance » de D5, reprise au J6) : petit libellé en capitales,
// valeur en chiffres tabulaires. Sert au récapitulatif, au détail d'un bloc et au calendrier.
// `className` / `style` : pour l'animation d'entrée du récapitulatif (J10).
import type { CSSProperties, ReactNode } from 'react'
import Card from './Card.tsx'

type Props = { label: string; value: ReactNode; className?: string; style?: CSSProperties }

function Tile({ label, value, className = '', style }: Props) {
  return (
    <Card className={`flex flex-col gap-1 p-3 ${className}`} style={style}>
      <span className="text-caption font-semibold tracking-[0.06em] text-muted uppercase">{label}</span>
      <span className="num truncate text-num-m">{value}</span>
    </Card>
  )
}

export default Tile
