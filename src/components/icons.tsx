// Icônes de l'app : mêmes tracés que les maquettes (style Lucide, trait de 2 px, bouts arrondis).
// Elles prennent la couleur du texte autour (currentColor) et sont masquées aux lecteurs d'écran :
// c'est le libellé du bouton ou de l'onglet qui porte le sens.
import type { ReactNode } from 'react'

type IconProps = { size?: number; strokeWidth?: number; className?: string }

function Icon({ size = 24, strokeWidth = 2, className, children }: IconProps & { children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {children}
    </svg>
  )
}

export const IconSeance = (p: IconProps) => <Icon {...p}><path d="M6 7v10M18 7v10M3 10v4M21 10v4M6 12h12" /></Icon>
export const IconProgrammes = (p: IconProps) => <Icon {...p}><path d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01" /></Icon>
export const IconCalendrier = (p: IconProps) => (
  <Icon {...p}>
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M3 10h18M8 3v4M16 3v4" />
  </Icon>
)
export const IconStats = (p: IconProps) => <Icon {...p}><path d="M4 20V10M10 20V4M16 20v-7M2 20h20" /></Icon>
export const IconReglages = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="3" />
    <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1" />
  </Icon>
)
export const IconPartager = (p: IconProps) => <Icon {...p}><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13" /></Icon>
export const IconChevronDroite = (p: IconProps) => <Icon {...p}><path d="M9 6l6 6-6 6" /></Icon>
export const IconChevronGauche = (p: IconProps) => <Icon {...p}><path d="M15 18l-6-6 6-6" /></Icon>
export const IconPlus = (p: IconProps) => <Icon {...p}><path d="M12 5v14M5 12h14" /></Icon>
export const IconFermer = (p: IconProps) => <Icon {...p}><path d="M18 6L6 18M6 6l12 12" /></Icon>
export const IconChevronBas = (p: IconProps) => <Icon {...p}><path d="M6 9l6 6 6-6" /></Icon>
export const IconFleche = (p: IconProps) => <Icon {...p}><path d="M12 19V5M5 12l7-7 7 7" /></Icon>
export const IconFlecheBas = (p: IconProps) => <Icon {...p}><path d="M12 5v14M5 12l7 7 7-7" /></Icon>
export const IconCoche = (p: IconProps) => <Icon {...p}><path d="M5 12.5l4.5 4.5L19 7.5" /></Icon>
export const IconOptions = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="5" cy="12" r="1.5" />
    <circle cx="12" cy="12" r="1.5" />
    <circle cx="19" cy="12" r="1.5" />
  </Icon>
)
export const IconEchange = (p: IconProps) => <Icon {...p}><path d="M16 3l4 4-4 4M20 7H4M8 21l-4-4 4-4M4 17h16" /></Icon>
export const IconTrophee = (p: IconProps) => (
  <Icon {...p}>
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M10 14.7V17c0 .6-.5 1-1 1.2-1.1.6-2 2-2 3.8M14 14.7V17c0 .6.5 1 1 1.2 1.1.6 2 2 2 3.8M18 2H6v7a6 6 0 0 0 12 0V2z" />
  </Icon>
)
export const IconHistorique = (p: IconProps) => (
  <Icon {...p}><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8M3 3v5h5M12 7v5l4 2" /></Icon>
)
export const IconRecherche = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="M20 20l-3.5-3.5" />
  </Icon>
)
export const IconCorbeille = (p: IconProps) => (
  <Icon {...p}><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></Icon>
)
export const IconLivre = (p: IconProps) => (
  <Icon {...p}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></Icon>
)
// Importer : une flèche qui entre dans le bac (l'inverse de « Partager », qui en sort)
export const IconImporter = (p: IconProps) => (
  <Icon {...p}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" /></Icon>
)
export const IconAlerte = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 8v4M12 16h.01" />
  </Icon>
)
