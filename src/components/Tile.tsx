// Tuile chiffrée (planche « Fin de séance » de D5, reprise au J6) : petit libellé en capitales,
// valeur en chiffres tabulaires. Sert au récapitulatif, au détail d'un bloc et au calendrier.
import Card from './Card.tsx'

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <Card className="flex flex-col gap-1 p-3">
      <span className="text-caption font-semibold tracking-[0.06em] text-muted uppercase">{label}</span>
      <span className="num truncate text-num-m">{value}</span>
    </Card>
  )
}

export default Tile
