import { Link } from 'react-router'

function NotFoundPage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 px-4 text-center">
      <h1 className="text-3xl font-bold">Page introuvable</h1>
      <Link
        to="/"
        className="flex min-h-12 items-center rounded-xl bg-neutral-50 px-6 font-semibold text-neutral-950"
      >
        Retour à l'accueil
      </Link>
    </main>
  )
}

export default NotFoundPage
