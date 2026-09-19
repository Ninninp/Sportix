// Onglet Séance — accueil. Au J1, seule la coquille de l'accueil D5 « premier lancement » :
// en-tête (date du jour, Sportix) et grande carte inversée avec le bouton en bas (zone du pouce).
// Le bouton s'activera au J3, quand on pourra enregistrer une séance.
import Button from '../../components/Button.tsx'
import Card from '../../components/Card.tsx'

const steps = [
  'Ajoute tes exercices au fil de la séance',
  'Règle charge et reps avec − / +, puis valide la série',
  'La fois suivante, tout est pré-rempli',
]

// « jeudi 17 septembre » → « Jeudi 17 septembre »
function todayLabel(date: Date): string {
  const label = date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
  return label.charAt(0).toUpperCase() + label.slice(1)
}

function HomePage() {
  return (
    <main className="flex flex-1 flex-col gap-3 px-4 pt-2 pb-4">
      <header>
        <p className="text-body text-muted">{todayLabel(new Date())}</p>
        <h1 className="text-display font-extrabold tracking-[-0.02em]">Sportix</h1>
      </header>

      <Card inverse as="section" aria-labelledby="premiere-seance" className="flex flex-1 flex-col gap-2 p-4">
        <div>
          <h2 id="premiere-seance" className="text-title-l font-extrabold tracking-[-0.02em]">
            Première séance
          </h2>
          <p className="mt-1 text-[14px] leading-[18px] text-on-inverse-muted">
            Pas besoin de programme pour commencer.
          </p>
        </div>
        <ol className="flex flex-col">
          {steps.map((step, i) => (
            <li key={step} className={`flex items-center gap-2 ${i > 0 ? 'border-t border-on-inverse/15' : ''}`}>
              <span className="num flex size-7 shrink-0 items-center justify-center rounded-full border-[1.5px] border-on-inverse-muted text-body">
                {i + 1}
              </span>
              <span className="py-2 text-body">{step}</span>
            </li>
          ))}
        </ol>
        <div className="flex-1" />
        <Button variant="hero" disabled aria-describedby="bientot">
          Démarrer la séance
        </Button>
        <p id="bientot" className="text-center text-small text-on-inverse-muted">
          L'enregistrement des séances arrive au J3.
        </p>
      </Card>
    </main>
  )
}

export default HomePage
