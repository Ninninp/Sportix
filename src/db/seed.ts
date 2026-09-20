// Exercices de base, insérés une seule fois au premier lancement (voir schema.ts).
// Liste validée avec le plan du J2 (19/09/2026) : 32 exercices, 6 groupes musculaires.
// L'utilisateur peut ensuite les modifier, les supprimer ou en créer d'autres.
import type { ExerciseDraft } from '../lib/exercises.ts'

export const SEED_EXERCISES: ExerciseDraft[] = [
  // Jambes
  { name: 'Squat', muscleGroup: 'jambes', type: 'charge', variants: ['barre', 'smith', 'machine'] },
  { name: 'Hack squat', muscleGroup: 'jambes', type: 'charge', variants: ['machine'] },
  { name: 'Presse à cuisses', muscleGroup: 'jambes', type: 'charge', variants: ['machine'] },
  { name: 'Leg extension', muscleGroup: 'jambes', type: 'charge', variants: ['machine'] },
  { name: 'Leg curl', muscleGroup: 'jambes', type: 'charge', variants: ['machine'] },
  { name: 'Fentes bulgares', muscleGroup: 'jambes', type: 'charge', variants: ['halteres', 'smith', 'barre'] },
  { name: 'Soulevé de terre roumain', muscleGroup: 'jambes', type: 'charge', variants: ['barre', 'halteres'] },
  { name: 'Hip thrust', muscleGroup: 'jambes', type: 'charge', variants: ['barre', 'machine', 'smith'] },
  { name: 'Mollets debout', muscleGroup: 'jambes', type: 'charge', variants: ['machine', 'smith'] },
  // Pectoraux
  { name: 'Développé couché', muscleGroup: 'pectoraux', type: 'charge', variants: ['barre', 'halteres', 'machine', 'smith'] },
  { name: 'Développé incliné', muscleGroup: 'pectoraux', type: 'charge', variants: ['barre', 'halteres', 'smith', 'machine'] },
  { name: 'Écarté', muscleGroup: 'pectoraux', type: 'charge', variants: ['halteres', 'poulie', 'machine'] },
  { name: 'Dips', muscleGroup: 'pectoraux', type: 'poids-du-corps', variants: [] },
  // Dos
  { name: 'Soulevé de terre', muscleGroup: 'dos', type: 'charge', variants: ['barre'] },
  { name: 'Tractions', muscleGroup: 'dos', type: 'poids-du-corps', variants: [] },
  { name: 'Tirage vertical', muscleGroup: 'dos', type: 'charge', variants: ['poulie', 'machine'] },
  { name: 'Rowing', muscleGroup: 'dos', type: 'charge', variants: ['barre', 'halteres', 'machine', 'poulie'] },
  { name: 'Tirage horizontal', muscleGroup: 'dos', type: 'charge', variants: ['poulie', 'machine'] },
  { name: 'Pull-over', muscleGroup: 'dos', type: 'charge', variants: ['poulie', 'halteres'] },
  // Épaules
  { name: 'Développé militaire', muscleGroup: 'epaules', type: 'charge', variants: ['barre', 'halteres', 'smith', 'machine'] },
  { name: 'Élévations latérales', muscleGroup: 'epaules', type: 'charge', variants: ['halteres', 'poulie', 'machine'] },
  { name: 'Oiseau', muscleGroup: 'epaules', type: 'charge', variants: ['halteres', 'poulie', 'machine'] },
  { name: 'Face pull', muscleGroup: 'epaules', type: 'charge', variants: ['poulie'] },
  { name: 'Shrug', muscleGroup: 'epaules', type: 'charge', variants: ['barre', 'halteres'] },
  // Bras
  { name: 'Curl', muscleGroup: 'bras', type: 'charge', variants: ['barre', 'halteres', 'poulie'] },
  { name: 'Curl marteau', muscleGroup: 'bras', type: 'charge', variants: ['halteres', 'poulie'] },
  { name: 'Extension triceps', muscleGroup: 'bras', type: 'charge', variants: ['poulie', 'halteres'] },
  { name: 'Barre au front', muscleGroup: 'bras', type: 'charge', variants: ['barre'] },
  // Abdos
  { name: 'Crunch à la poulie', muscleGroup: 'abdos', type: 'charge', variants: ['poulie'] },
  { name: 'Relevé de jambes', muscleGroup: 'abdos', type: 'poids-du-corps', variants: [] },
  { name: 'Roue abdominale', muscleGroup: 'abdos', type: 'poids-du-corps', variants: [] },
  { name: 'Gainage', muscleGroup: 'abdos', type: 'temps', variants: [] },
]
