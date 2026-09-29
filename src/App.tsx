import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router'
import BottomNav from './components/BottomNav.tsx'
import SessionBar from './features/sessions/SessionBar.tsx'
import { useActiveSession } from './features/sessions/useSession.ts'
import { useSettings } from './features/settings/useSettings.ts'
import { useRestAlarm } from './features/timer/useRestAlarm.ts'
import { useBackupReminder } from './features/backup/useBackupReminder.ts'
import { applyTheme } from './features/settings/theme.ts'
import { pageAnimation, type PageAnimation } from './lib/motion.ts'

/** Entrée de la page selon d'où l'on vient (J10) : durées de tokens.md. */
const PAGE_ANIMATIONS: Record<PageAnimation, string> = {
  seance: 'animate-[sx-seance-monte_320ms_var(--ease-out)]',
  droite: 'animate-[sx-page-droite_400ms_var(--ease-glisse)]',
  gauche: 'animate-[sx-page-gauche_400ms_var(--ease-glisse)]',
  fondu: 'animate-[sx-fondu_280ms_var(--ease-glisse)]',
}

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
  // Adresse précédente et animation d'entrée de la page affichée, recalculées quand l'adresse change
  const [page, setPage] = useState<{ path: string; animation: PageAnimation | null }>({ path: pathname, animation: null })
  if (page.path !== pathname) setPage({ path: pathname, animation: pageAnimation(page.path, pathname) })
  const fullScreen = inSession || /^\/calendrier\/(nouveau|[^/]+\/modifier)$/.test(pathname)
  const active = useActiveSession()
  const settings = useSettings()
  useRestAlarm(active?.rest, settings?.restSound ?? true)
  const remindBackup = useBackupReminder(settings)
  // Apparence (J9) : suit le réglage en base, y compris après l'import d'une sauvegarde
  const theme = settings?.theme
  useEffect(() => {
    if (theme) applyTheme(theme)
  }, [theme])

  return (
    // overflow-x-clip : une page qui glisse depuis le côté ne fait jamais glisser tout l'écran
    <div className="flex h-dvh flex-col overflow-x-clip bg-bg text-text">
      {/* overflow-x-hidden : la page ne glisse jamais de gauche à droite, même si un élément dépasse
          (le champ date de Safari iOS est plus large que prévu). Les lignes de pastilles qui défilent
          à l'horizontale ont leur propre défilement, elles ne sont pas concernées. */}
      {/* J10 : une page neuve à chaque adresse (clé), qui arrive selon d'où l'on vient
          (`pageAnimation`) : la séance monte, un niveau plus bas glisse depuis la droite, un niveau
          plus haut depuis la gauche, un autre onglet en fondu. `data-seance` sert à « Réduire »
          (SessionHeader), qui fait redescendre la séance avant de la quitter. */}
      <div
        key={pathname}
        data-seance={inSession ? '' : undefined}
        className={`flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-auto pt-[env(safe-area-inset-top)] ${
          page.animation ? PAGE_ANIMATIONS[page.animation] : ''
        }`}
      >
        <Outlet />
      </div>
      {fullScreen ? (
        <div aria-hidden="true" className="h-[env(safe-area-inset-bottom)] shrink-0" />
      ) : (
        <>
          {active && <SessionBar session={active} />}
          <BottomNav badge={remindBackup ? '/reglages' : undefined} />
        </>
      )}
    </div>
  )
}

export default App
