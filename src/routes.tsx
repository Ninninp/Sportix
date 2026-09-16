import { createBrowserRouter } from 'react-router'
import App from './App.tsx'
import HomePage from './features/home/HomePage.tsx'
import NotFoundPage from './features/home/NotFoundPage.tsx'

// Associe chaque adresse (URL) à l'écran à afficher.
export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <HomePage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
