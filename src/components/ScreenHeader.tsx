// En-tête d'un écran secondaire : bouton retour (48 px) + titre, et éventuellement un élément à droite.
// `close` : une croix au lieu du chevron (pour « Annuler » un formulaire).
import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { IconChevronGauche, IconFermer } from './icons.tsx'

type Props = {
  title: string
  backTo: string
  backLabel: string
  close?: boolean
  size?: 'l' | 'm'
  right?: ReactNode
}

function ScreenHeader({ title, backTo, backLabel, close = false, size = 'l', right }: Props) {
  return (
    <header className="-mx-2 flex shrink-0 items-center gap-1">
      <Link
        to={backTo}
        aria-label={backLabel}
        className="flex size-12 shrink-0 items-center justify-center rounded-md text-text"
      >
        {close ? <IconFermer /> : <IconChevronGauche />}
      </Link>
      <h1
        className={`min-w-0 flex-1 truncate font-extrabold tracking-[-0.02em] ${size === 'l' ? 'text-title-l' : 'text-title'}`}
      >
        {title}
      </h1>
      {right}
    </header>
  )
}

export default ScreenHeader
