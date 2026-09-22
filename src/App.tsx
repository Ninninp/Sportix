import { Outlet, useLocation } from 'react-router'
import BottomNav from './components/BottomNav.tsx'
import SessionBar from './features/sessions/SessionBar.tsx'
import { useActiveSession } from './features/sessions/useSession.ts'
import { useSettings } from './features/settings/useSettings.ts'
import { useRestAlarm } from './features/timer/useRestAlarm.ts'

// Mise en page commune : la page courante s'affiche à la place de <Outlet />,
// la barre d'onglets reste en bas — sauf pendant une séance, où l'écran est plein
// (décision prise en D2 : /seance, choix d'exercice, récapitulatif), et sur le formulaire d'un bloc
// (nouveau / modifier), qui doit tenir sur l'écran sans défiler (maquette J6 « Nouveau bloc »).
// Séance réduite (on navigue ailleurs pendant une séance) : une barre « Séance en cours »
// se pose au-dessus des onglets. Le repos est surveillé ici, où que l'on soit dans l'app
// (son, vibration, écran gardé allumé).
// Zones de sécurité de l'iPhone : marge en haut sous l'encoche ; la BottomNav gère le bas.
function App() {
  const { pathname } = useLocation()
  const inSession = pathname.startsWith('/seance')
  const fullScreen = inSession || /^\/calendrier\/(nouveau|[^/]+\/modifier)$/.test(pathname)
  const active = useActiveSession()
  const settings = useSettings()
  useRestAlarm(active?.rest, settings?.restSound ?? true)

  return (
    <div className="flex h-dvh flex-col bg-bg text-text">
      {/* overflow-x-hidden : la page ne glisse jamais de gauche à droite, même si un élément dépasse
          (le champ date de Safari iOS est plus large que prévu). Les lignes de pastilles qui défilent
          à l'horizontale ont leur propre défilement, elles ne sont pas concernées. */}
      <div className="flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-auto pt-[env(safe-area-inset-top)]">
        <Outlet />
      </div>
      {fullScreen ? (
        <div aria-hidden="true" className="h-[env(safe-area-inset-bottom)] shrink-0" />
      ) : (
        <>
          {active && <SessionBar session={active} />}
          <BottomNav />
        </>
      )}
    </div>
  )
}

export default App
