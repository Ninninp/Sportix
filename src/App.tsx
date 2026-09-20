import { Outlet, useLocation } from 'react-router'
import BottomNav from './components/BottomNav.tsx'

// Mise en page commune : la page courante s'affiche à la place de <Outlet />,
// la barre d'onglets reste en bas — sauf pendant une séance, où l'écran est plein
// (décision prise en D2 : /seance, choix d'exercice, récapitulatif).
// Zones de sécurité de l'iPhone : marge en haut sous l'encoche ; la BottomNav gère le bas.
function App() {
  const { pathname } = useLocation()
  const inSession = pathname.startsWith('/seance')

  return (
    <div className="flex h-dvh flex-col bg-bg text-text">
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto pt-[env(safe-area-inset-top)]">
        <Outlet />
      </div>
      {inSession ? <div aria-hidden="true" className="h-[env(safe-area-inset-bottom)] shrink-0" /> : <BottomNav />}
    </div>
  )
}

export default App
