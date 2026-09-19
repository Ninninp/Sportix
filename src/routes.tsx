import { createBrowserRouter } from 'react-router'
import App from './App.tsx'
import ComingSoon from './components/ComingSoon.tsx'
import { IconCalendrier, IconProgrammes, IconStats } from './components/icons.tsx'
import HomePage from './features/home/HomePage.tsx'
import NotFoundPage from './features/home/NotFoundPage.tsx'
import SettingsPage from './features/settings/SettingsPage.tsx'

// Associe chaque adresse (URL) à l'écran à afficher.
// basename : l'app vit sous /Sportix/ (GitHub Pages), valeur fournie par Vite (option `base`).
export const router = createBrowserRouter(
  [
    {
      path: '/',
      element: <App />,
      children: [
        { index: true, element: <HomePage /> },
        {
          path: 'programmes',
          element: (
            <ComingSoon title="Programmes" milestone="J5" Icon={IconProgrammes}
              description="Tes routines (ex. Force A/B) et leurs jours, pour lancer la séance du jour en un geste." />
          ),
        },
        {
          path: 'calendrier',
          element: (
            <ComingSoon title="Calendrier" milestone="J6" Icon={IconCalendrier}
              description="Tes blocs de spécialisation semaine par semaine, avec les deloads." />
          ),
        },
        {
          path: 'stats',
          element: (
            <ComingSoon title="Stats" milestone="J7" Icon={IconStats}
              description="Ta progression : 1RM estimé, volume, records et poids du corps." />
          ),
        },
        { path: 'reglages', element: <SettingsPage /> },
        { path: '*', element: <NotFoundPage /> },
      ],
    },
  ],
  { basename: import.meta.env.BASE_URL },
)
