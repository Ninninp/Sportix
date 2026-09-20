import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router'
import './index.css'
import { requestPersistentStorage } from './db/persist.ts'
import { registerServiceWorker } from './pwa.ts'
import { router } from './routes.tsx'

registerServiceWorker()
// Demande au navigateur de ne jamais effacer les données d'entraînement de cet appareil
void requestPersistentStorage()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
