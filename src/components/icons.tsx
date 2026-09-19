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
export const IconPlus = (p: IconProps) => <Icon {...p}><path d="M12 5v14M5 12h14" /></Icon>
