import { Outlet } from 'react-router'
import BottomNav from './components/BottomNav.tsx'

// Mise en page commune à tous les écrans : la page courante s'affiche à la place de <Outlet />,
// la barre d'onglets reste en bas.
// Zones de sécurité de l'iPhone : marge en haut sous l'encoche (safe-area-inset-top) ;
// la BottomNav gère elle-même la barre d'accueil en bas. (Masquée pendant la séance : J3.)
function App() {
  return (
    <div className="flex h-dvh flex-col bg-bg text-text">
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto pt-[env(safe-area-inset-top)]">
        <Outlet />
      </div>
      <BottomNav />
    </div>
  )
}

export default App
