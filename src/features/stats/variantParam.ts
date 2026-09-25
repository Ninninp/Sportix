// Variante d'un exercice dans l'adresse des Stats (`?variante=barre`) : « aucune » pour un exercice
// sans variante (poids du corps, temps), « toutes » pour réunir toutes les variantes.
import { VARIANTS } from '../../lib/exercises.ts'
import type { VariantFilter } from '../../lib/stats.ts'

export function variantParam(variant: VariantFilter): string {
  return variant === null ? 'aucune' : variant === 'all' ? 'toutes' : variant
}

export function parseVariantParam(value: string | null): VariantFilter | undefined {
  if (value === 'aucune') return null
  if (value === 'toutes') return 'all'
  return VARIANTS.find((v) => v === value)
}
