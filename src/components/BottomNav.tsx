// Barre d'onglets du bas (5 onglets). L'onglet actif est en gras avec un trait au-dessus.
// Elle s'arrête au-dessus de la barre d'accueil de l'iPhone : la zone du dessous
// (env(safe-area-inset-bottom)) garde la même couleur mais ne contient rien de cliquable.
import type { ComponentType } from 'react'
import { NavLink } from 'react-router'
import { IconCalendrier, IconProgrammes, IconReglages, IconSeance, IconStats } from './icons.tsx'

const tabs: { to: string; label: string; Icon: ComponentType<{ size?: number }> }[] = [
  { to: '/', label: 'Séance', Icon: IconSeance },
  { to: '/programmes', label: 'Programmes', Icon: IconProgrammes },
  { to: '/calendrier', label: 'Calendrier', Icon: IconCalendrier },
  { to: '/stats', label: 'Stats', Icon: IconStats },
  { to: '/reglages', label: 'Réglages', Icon: IconReglages },
]

function BottomNav() {
  return (
    <nav
      aria-label="Navigation principale"
      className="shrink-0 border-t border-border bg-surface pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="grid h-16 grid-cols-5">
        {tabs.map(({ to, label, Icon }) => (
          <li key={to} className="flex">
            <NavLink
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                'flex flex-1 flex-col items-center justify-center gap-[3px] text-caption no-underline ' +
                (isActive ? 'font-bold text-text' : 'font-medium text-muted')
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    aria-hidden="true"
                    className={`h-[3px] w-6 rounded-sm ${isActive ? 'bg-text' : 'bg-transparent'}`}
                  />
                  <Icon size={24} />
                  <span>{label}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}

export default BottomNav
