import Button from '../../components/Button.tsx'

function NotFoundPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-4 text-center">
      <h1 className="text-title-l font-extrabold tracking-[-0.02em]">Page introuvable</h1>
      <Button to="/" className="max-w-xs">
        Retour à l'accueil
      </Button>
    </main>
  )
}

export default NotFoundPage
