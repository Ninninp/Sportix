import { Outlet } from 'react-router'

// Mise en page commune à tous les écrans : la page courante s'affiche
// à la place de <Outlet />. La barre de navigation du bas s'ajoutera ici (J1).
function App() {
  return (
    <div className="min-h-dvh bg-neutral-950 text-neutral-50">
      <Outlet />
    </div>
  )
}

export default App
