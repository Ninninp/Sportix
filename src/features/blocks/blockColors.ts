// Fond CSS d'une case du calendrier selon ses blocs (tokens `block-*`, voir design/tokens.md).
// Un bloc : sa couleur. Deux blocs qui se chevauchent : la case est coupée en diagonale, l'ancien
// en haut à gauche, le récent en bas à droite.
import type { BlockColor } from '../../lib/blocks.ts'

export const colorVar = (color: BlockColor) => `var(--sx-block-${color})`

export function cellBackground(colors: BlockColor[]): string | undefined {
  if (colors.length === 0) return undefined
  if (colors.length === 1) return colorVar(colors[0])
  return `linear-gradient(135deg, ${colorVar(colors[0])} 50%, ${colorVar(colors[colors.length - 1])} 50%)`
}
