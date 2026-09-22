import { createBrowserRouter } from 'react-router'
import App from './App.tsx'
import ComingSoon from './components/ComingSoon.tsx'
import { IconStats } from './components/icons.tsx'
import BlockDetailPage from './features/blocks/BlockDetailPage.tsx'
import BlockFormPage from './features/blocks/BlockFormPage.tsx'
import CalendarPage from './features/blocks/CalendarPage.tsx'
import ExerciseFormPage from './features/exercises/ExerciseFormPage.tsx'
import ExerciseLibraryPage from './features/exercises/ExerciseLibraryPage.tsx'
import HomePage from './features/home/HomePage.tsx'
import ProgramDetailPage from './features/programs/ProgramDetailPage.tsx'
import ProgramExercisePickerPage from './features/programs/ProgramExercisePickerPage.tsx'
import ProgramsPage from './features/programs/ProgramsPage.tsx'
import NotFoundPage from './features/home/NotFoundPage.tsx'
import ExercisePickerPage from './features/sessions/ExercisePickerPage.tsx'
import HistoryPage from './features/sessions/HistoryPage.tsx'
import SessionDetailPage from './features/sessions/SessionDetailPage.tsx'
import SessionPage from './features/sessions/SessionPage.tsx'
import SessionRecapPage from './features/sessions/SessionRecapPage.tsx'
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
        // Séance (onglets masqués)
        { path: 'seance', element: <SessionPage /> },
        { path: 'seance/exercices', element: <ExercisePickerPage /> },
        { path: 'seance/recap/:id', element: <SessionRecapPage /> },
        // Historique
        { path: 'historique', element: <HistoryPage /> },
        { path: 'historique/:id', element: <SessionDetailPage /> },
        // Programmes (J5)
        { path: 'programmes', element: <ProgramsPage /> },
        { path: 'programmes/:id', element: <ProgramDetailPage /> },
        { path: 'programmes/:id/jours/:dayId/exercices', element: <ProgramExercisePickerPage /> },
        // Calendrier des blocs (J6)
        { path: 'calendrier', element: <CalendarPage /> },
        { path: 'calendrier/nouveau', element: <BlockFormPage /> },
        { path: 'calendrier/:id', element: <BlockDetailPage /> },
        { path: 'calendrier/:id/modifier', element: <BlockFormPage /> },
        {
          path: 'stats',
          element: (
            <ComingSoon title="Stats" milestone="J7" Icon={IconStats}
              description="Ta progression : 1RM estimé, volume, records et poids du corps." />
          ),
        },
        { path: 'reglages', element: <SettingsPage /> },
        { path: 'reglages/exercices', element: <ExerciseLibraryPage /> },
        // Le formulaire sert à la création (« nouveau ») comme à la modification (identifiant)
        { path: 'reglages/exercices/nouveau', element: <ExerciseFormPage /> },
        { path: 'reglages/exercices/:id', element: <ExerciseFormPage /> },
        { path: '*', element: <NotFoundPage /> },
      ],
    },
  ],
  { basename: import.meta.env.BASE_URL },
)
