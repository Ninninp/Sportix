// Barre d'onglets du bas (5 onglets). L'onglet actif est en gras avec un trait au-dessus.
// Onglets de 56 px (cible tactile ≥ 48 px), posés un peu plus bas que la zone de sécurité
// complète (8 px de moins) pour rapprocher la barre du bas de l'écran, comme les apps iOS
// (retour du test sur iPhone, 19/09/2026).
// J8 : une pastille rouge sur Réglages rappelle d'exporter les données (plus de 30 jours sans sauvegarde).
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

/** `badge` : adresse de l'onglet qui porte une pastille (sauvegarde à faire, sur Réglages). */
function BottomNav({ badge }: { badge?: string }) {
  return (
    <nav
      aria-label="Navigation principale"
      className="shrink-0 border-t border-border bg-surface pb-[max(0px,calc(env(safe-area-inset-bottom)-8px))]"
    >
      <ul className="grid h-14 grid-cols-5">
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
                  <span className="relative flex">
                    <Icon size={24} />
                    {badge === to && (
                      <span aria-hidden="true" className="absolute -top-0.5 -right-1.5 size-2.5 rounded-full bg-danger ring-2 ring-surface" />
                    )}
                  </span>
                  <span>
                    {label}
                    {badge === to && <span className="sr-only"> (sauvegarde à faire)</span>}
                  </span>
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
