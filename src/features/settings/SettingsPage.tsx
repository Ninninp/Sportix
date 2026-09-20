// Onglet Réglages. Au J1 : l'encart d'installation sur l'iPhone (iOS ne propose pas
// d'installation automatique, il faut passer par Partager). Il disparaît quand l'app est installée.
// Les vrais réglages (unité, repos, pas de charge…) arrivent avec les jalons qui les utilisent.
import Card from '../../components/Card.tsx'
import ListRow from '../../components/ListRow.tsx'
import { IconLivre, IconPartager } from '../../components/icons.tsx'
import { useActiveExercises } from '../exercises/useExercises.ts'
import { isStandalone } from '../../lib/standalone.ts'

function SettingsPage() {
  const installed = isStandalone(window)
  const exercises = useActiveExercises()

  return (
    <main className="flex flex-1 flex-col gap-4 px-4 pt-2 pb-4">
      <h1 className="text-title-l font-extrabold tracking-[-0.02em]">Réglages</h1>

      {!installed && (
        <Card as="section" aria-labelledby="installer" className="flex items-start gap-3 p-3.5">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-md bg-surface-2">
            <IconPartager size={22} />
          </span>
          <div className="flex flex-col gap-1.5">
            <h2 id="installer" className="text-body-strong font-semibold">
              Installer Sportix sur l'iPhone
            </h2>
            <ol className="list-decimal pl-[18px] text-body leading-[21px] text-muted">
              <li>
                Dans Safari, touche <strong className="text-text">Partager</strong>.
              </li>
              <li>
                Choisis <strong className="text-text">Sur l'écran d'accueil</strong>.
              </li>
              <li>Ouvre Sportix depuis son icône : l'app marche hors connexion.</li>
            </ol>
          </div>
        </Card>
      )}

      <section className="flex flex-col gap-2">
        <h2 className="text-caption font-semibold tracking-[0.06em] text-muted uppercase">Exercices</h2>
        <Card className="overflow-hidden">
          <ListRow
            to="/reglages/exercices"
            title="Bibliothèque d'exercices"
            left={<IconLivre size={20} />}
            right={
              <span className="flex items-center gap-3 text-muted">
                <span className="num text-body-strong">{exercises?.length ?? ''}</span>
              </span>
            }
          />
        </Card>
      </section>

      <footer className="mt-auto flex flex-col items-center gap-1 text-center text-small text-muted">
        <p>Tes données restent sur ce téléphone.</p>
        {/* Permet de vérifier que l'iPhone a bien la dernière version déployée */}
        <p className="num">Version {__APP_VERSION__}</p>
      </footer>
    </main>
  )
}

export default SettingsPage
