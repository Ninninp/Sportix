// Badges du design system (D4) : progression de charge (↑) et record (PR).
// Couleur « accent 2 », réservée à ces deux usages.
import type { ReactNode } from 'react'
import { IconFleche } from './icons.tsx'

export function BadgeIncrease({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-accent-2 px-2.5 py-[3px] text-small font-bold text-on-accent-2">
      <IconFleche size={14} strokeWidth={3} />
      {children}
    </span>
  )
}

export function BadgePR() {
  return (
    <span className="shrink-0 rounded-full bg-accent-2 px-2 py-0.5 text-caption font-extrabold text-on-accent-2">PR</span>
  )
}
