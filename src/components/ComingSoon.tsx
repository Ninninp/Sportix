// Écran provisoire pour les onglets pas encore construits (Programmes, Calendrier, Stats).
// Même mise en page que les états vides des maquettes : pastille d'icône, titre, explication.
import type { ComponentType } from 'react'

type Props = {
  title: string
  milestone: string
  description: string
  Icon: ComponentType<{ size?: number }>
}

function ComingSoon({ title, milestone, description, Icon }: Props) {
  return (
    <main className="flex flex-1 flex-col gap-3 px-4 pt-2 pb-4">
      <h1 className="text-title-l font-extrabold tracking-[-0.02em]">{title}</h1>
      <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center">
        <span className="flex size-16 items-center justify-center rounded-full bg-surface-2 text-muted">
          <Icon size={28} />
        </span>
        <h2 className="mt-2 text-title font-bold">Arrive au {milestone}</h2>
        <p className="text-body text-muted">{description}</p>
      </div>
    </main>
  )
}

export default ComingSoon
