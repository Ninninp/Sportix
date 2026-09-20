// Ligne de liste cliquable (64 px) : titre, sous-titre discret, chevron. À placer dans une Card
// avec « divide-y divide-border » pour les traits de séparation.
import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { IconChevronDroite } from './icons.tsx'

type Props = { to: string; title: string; subtitle?: string; left?: ReactNode; right?: ReactNode }

function ListRow({ to, title, subtitle, left, right }: Props) {
  return (
    <Link to={to} className="flex min-h-16 items-center gap-3 py-2 pr-3 pl-4 text-text no-underline active:bg-surface-2">
      {left && <span className="flex shrink-0 text-muted">{left}</span>}
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-body-strong font-semibold">{title}</span>
        {subtitle && <span className="text-small text-muted">{subtitle}</span>}
      </span>
      {right}
      <span className="flex text-muted">
        <IconChevronDroite size={20} />
      </span>
    </Link>
  )
}

export default ListRow
