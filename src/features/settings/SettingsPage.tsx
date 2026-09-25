// Onglet Réglages (maquette D5). L'encart d'installation sur l'iPhone (iOS ne propose pas
// d'installation automatique, il faut passer par Partager) disparaît quand l'app est installée.
// J4 : repos par défaut, son de fin de repos, pas de charge des boutons − / + par variante.
// Chaque changement est enregistré aussitôt (pas de bouton « Enregistrer »).
// Unité (kg / lb) et RPE, présents sur la maquette, arriveront avec les jalons qui les utilisent.
// J7 : les objectifs des Stats (poids cible, séances par semaine), le même panneau que dans les Stats.
import { useState, type ReactNode } from 'react'
import Button from '../../components/Button.tsx'
import Card from '../../components/Card.tsx'
import ChipGroup from '../../components/ChipGroup.tsx'
import ListRow from '../../components/ListRow.tsx'
import NumberStepper from '../../components/NumberStepper.tsx'
import Sheet from '../../components/Sheet.tsx'
import Switch from '../../components/Switch.tsx'
import { IconChevronDroite, IconLivre, IconPartager } from '../../components/icons.tsx'
import { updateSettings } from '../../db/settings.ts'
import { VARIANTS, VARIANT_LABELS, type Variant } from '../../lib/exercises.ts'
import { formatRest } from '../../lib/rest.ts'
import { formatNumber } from '../../lib/sessions.ts'
import { REST_MIN, WEIGHT_STEP_CHOICES, stepRest } from '../../lib/settings.ts'
import { useActiveExercises } from '../exercises/useExercises.ts'
import GoalsSheet from '../stats/GoalsSheet.tsx'
import { useBodyWeights } from '../stats/useStats.ts'
import { withMovingAverage } from '../../lib/bodyWeight.ts'
import { isStandalone } from '../../lib/standalone.ts'
import { useSettings } from './useSettings.ts'

/** Ligne de réglage qui ouvre un panneau : libellé à gauche, valeur et chevron à droite. */
function SettingButton({ label, value, onClick }: { label: ReactNode; value: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-14 w-full items-center justify-between gap-3 pr-3 pl-4 text-left text-text active:bg-surface-2"
    >
      <span className="text-body-strong">{label}</span>
      <span className="flex items-center gap-1 text-muted">
        <span className="num text-body-strong">{value}</span>
        <IconChevronDroite size={20} />
      </span>
    </button>
  )
}

const sectionTitle = 'text-caption font-semibold tracking-[0.06em] text-muted uppercase'

function SettingsPage() {
  const installed = isStandalone(window)
  const exercises = useActiveExercises()
  const settings = useSettings()
  const weights = useBodyWeights()
  // Panneau ouvert : le repos, les objectifs, ou le pas de charge d'une variante
  const [editing, setEditing] = useState<'rest' | 'goals' | Variant | null>(null)
  if (settings === undefined) return null
  const close = () => setEditing(null)
  const variant = editing !== null && editing !== 'rest' && editing !== 'goals' ? editing : null
  const goals = [
    settings.goalBodyWeight !== undefined && `${formatNumber(settings.goalBodyWeight)} kg`,
    settings.goalWeeklySessions !== undefined && `${settings.goalWeeklySessions} / sem.`,
  ].filter(Boolean)

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
        <h2 className={sectionTitle}>Séance</h2>
        <Card className="divide-y divide-border overflow-hidden">
          <SettingButton
            label="Repos par défaut"
            value={formatRest(settings.restSeconds)}
            onClick={() => setEditing('rest')}
          />
          <Switch
            label="Son de fin de repos"
            checked={settings.restSound}
            onChange={(restSound) => void updateSettings({ restSound })}
          />
        </Card>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className={sectionTitle}>Pas de charge (boutons − / +)</h2>
        <Card className="divide-y divide-border overflow-hidden">
          {VARIANTS.map((v) => (
            <SettingButton
              key={v}
              label={
                v === 'halteres' ? (
                  <>
                    Haltères <span className="text-small text-muted">(par haltère)</span>
                  </>
                ) : (
                  VARIANT_LABELS[v]
                )
              }
              value={`${formatNumber(settings.weightSteps[v])} kg`}
              onClick={() => setEditing(v)}
            />
          ))}
        </Card>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className={sectionTitle}>Stats</h2>
        <Card className="overflow-hidden">
          <SettingButton label="Objectifs" value={goals.length > 0 ? goals.join(' · ') : 'Aucun'} onClick={() => setEditing('goals')} />
        </Card>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className={sectionTitle}>Exercices</h2>
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

      <GoalsSheet open={editing === 'goals'} onClose={close} currentWeight={weights && weights.length > 0 ? withMovingAverage(weights).at(-1)!.average : undefined} />

      <Sheet open={editing === 'rest'} onClose={close} label="Repos par défaut">
        <div>
          <div className="text-title font-bold">Repos par défaut</div>
          <p className="text-body text-muted">Lancé après chaque série validée. « +15 s » l’allonge en séance.</p>
        </div>
        {/* Version compacte : « 2:00 » n'a pas besoin des gros chiffres de la séance (retour du 21/09/2026) */}
        <NumberStepper
          compact
          label="Repos"
          ariaLabel="Repos par défaut"
          value={formatRest(settings.restSeconds)}
          unit=""
          minusLabel="Retirer 15 secondes"
          plusLabel="Ajouter 15 secondes"
          canDecrement={settings.restSeconds > REST_MIN}
          onDecrement={() => void updateSettings({ restSeconds: stepRest(settings.restSeconds, -1) })}
          onIncrement={() => void updateSettings({ restSeconds: stepRest(settings.restSeconds, 1) })}
        />
        <Button onClick={close}>OK</Button>
      </Sheet>

      <Sheet open={variant !== null} onClose={close} label="Pas de charge">
        {variant && (
          <>
            <div>
              <div className="text-title font-bold">Pas de charge · {VARIANT_LABELS[variant]}</div>
              <p className="text-body text-muted">
                Ajouté ou retiré à chaque appui sur − / +, et proposé quand l’objectif est atteint
                {variant === 'halteres' ? ' (par haltère).' : '.'}
              </p>
            </div>
            <ChipGroup
              label={`Pas de charge, ${VARIANT_LABELS[variant]}`}
              options={WEIGHT_STEP_CHOICES.map((c) => ({ value: String(c), label: `${formatNumber(c)} kg` }))}
              selected={[String(settings.weightSteps[variant])]}
              onToggle={(value) => {
                void updateSettings({ weightSteps: { ...settings.weightSteps, [variant]: Number(value) } })
                close()
              }}
            />
          </>
        )}
      </Sheet>
    </main>
  )
}

export default SettingsPage
