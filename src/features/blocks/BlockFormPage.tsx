// Création et modification d'un bloc (maquettes J6 « Nouveau bloc » et « Nouvel objectif »).
// Même page pour les deux : avec un identifiant dans l'adresse, elle charge le bloc à modifier.
// - Premier jour : n'importe quelle date peut être choisie, le bloc part du lundi de sa semaine
//   (règle du J6) ; les dates calculées se lisent au-dessus du bouton.
// - Deload facultatif : « − » descend jusqu'à « Aucun ». C'est le seul endroit où l'on ajoute un
//   deload ou change sa semaine (le détail du bloc n'a plus de « + Semaine de deload »).
// - Si le bloc croise un autre bloc, on prévient avant d'enregistrer (sans l'interdire) ; s'il mord
//   sur un bloc qui vient après lui, on propose de décaler ce bloc (maquette « Chevauchement »).
// - Couleur du bloc : le carré à droite du nom ouvre le choix (7 couleurs, tokens `block-*`).
// - L'écran ne doit jamais défiler (retour du 22/09/2026) : pas d'onglets ici (comme sur la maquette,
//   voir App.tsx), et les pastilles d'objectif et de programme tiennent sur une ligne qui défile à
//   l'horizontale, pour que la hauteur ne dépende pas de leur nombre.
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import Button from '../../components/Button.tsx'
import Card from '../../components/Card.tsx'
import Chip from '../../components/Chip.tsx'
import MiniStepper from '../../components/MiniStepper.tsx'
import ScreenHeader from '../../components/ScreenHeader.tsx'
import Sheet from '../../components/Sheet.tsx'
import TextField from '../../components/TextField.tsx'
import { createGoal, saveBlock } from '../../db/blocks.ts'
import {
  MAX_WEEKLY_SESSIONS,
  MAX_WEEKS,
  MIN_WEEKLY_SESSIONS,
  MIN_WEEKS,
  BLOCK_COLORS,
  BLOCK_COLOR_LABELS,
  blockColor,
  defaultWeeklySessions,
  suggestColor,
  blockLastDay,
  formatLongSpan,
  normalizeStart,
  overlapping,
  suggestStart,
  type Block,
  type BlockDraft,
} from '../../lib/blocks.ts'
import { IconCalendrier, IconCoche } from '../../components/icons.tsx'
import NameSheet from '../programs/NameSheet.tsx'
import { colorVar } from './blockColors.ts'
import { usePrograms } from '../programs/usePrograms.ts'
import { useSettings } from '../settings/useSettings.ts'
import { useBlock, useBlocks, useGoals } from './useBlocks.ts'

const DEFAULT_WEEKS = 4
/** Même largeur pour les trois valeurs de la carte (« 3 séances » est la plus longue) : boutons alignés. */
const VALUE_WIDTH = 'w-[108px]'

/** « 2026-09-14 » (valeur d'un champ date) ↔ horodatage local à 0 h. */
const toInput = (time: number) => {
  const d = new Date(time)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
const fromInput = (value: string) => {
  const [y, m, d] = value.split('-').map(Number)
  return new Date(y, m - 1, d).getTime()
}

function Legend({ children }: { children: string }) {
  return <legend className="mb-2 p-0 text-caption font-semibold tracking-[0.06em] text-muted uppercase">{children}</legend>
}

function BlockFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const blocks = useBlocks()
  const saved = useBlock(id)
  const goals = useGoals()
  const programs = usePrograms()
  const settings = useSettings()
  const [draft, setDraft] = useState<BlockDraft | null>(null)
  const [newGoal, setNewGoal] = useState(false)
  const [choosingColor, setChoosingColor] = useState(false)
  // Identifiant du bloc, fixé dès l'ouverture pour un nouveau bloc : deux appuis rapprochés sur
  // « Créer le bloc » écrivent le même bloc (saveBlock), jamais deux.
  const [newId] = useState(() => crypto.randomUUID())
  const [conflicts, setConflicts] = useState<Block[]>([])

  if (blocks === undefined || saved === undefined || goals === undefined || programs === undefined || settings === undefined) return null

  const back = id ? `/calendrier/${id}` : '/calendrier'

  if (id && saved === null) {
    return (
      <main className="flex flex-1 flex-col gap-5 px-4 pt-2 pb-4">
        <ScreenHeader title="Bloc introuvable" backTo="/calendrier" backLabel="Retour au calendrier" size="m" />
        <p className="text-body text-muted">Il a peut-être été supprimé depuis un autre écran.</p>
      </main>
    )
  }

  // Tant que rien n'est touché : le bloc enregistré, ou un nouveau bloc qui enchaîne sur le dernier,
  // avec le programme actif. Calculé à l'affichage (pas d'effet), comme le formulaire d'exercice.
  // Séances par semaine proposées : une par jour du programme (3 sans programme).
  const daysOf = (programId: string | null) => programs.find((p) => p.program.id === programId)?.days.length ?? 0
  const activeProgram = programs.some((p) => p.program.id === settings.activeProgramId) ? (settings.activeProgramId ?? null) : null
  const initial: BlockDraft = saved
    ? {
        name: saved.name,
        goalId: saved.goalId,
        startsOn: saved.startsOn,
        weeks: saved.weeks,
        deloadWeeks: saved.deloadWeeks,
        programId: saved.programId,
        weeklySessions: saved.weeklySessions ?? defaultWeeklySessions(daysOf(saved.programId)),
        color: blockColor(saved),
      }
    : {
        name: '',
        goalId: null,
        startsOn: suggestStart(blocks),
        weeks: DEFAULT_WEEKS,
        deloadWeeks: [],
        programId: activeProgram,
        weeklySessions: defaultWeeklySessions(daysOf(activeProgram)),
        color: suggestColor(blocks),
      }
  const form = draft ?? initial
  const set = (changes: Partial<BlockDraft>) => setDraft({ ...form, ...changes })

  // Une seule semaine de deload par bloc (0 = « Aucun »).
  const deload = form.deloadWeeks[0] ?? 0
  const setDeload = (week: number) => set({ deloadWeeks: week > 0 ? [week] : [] })
  const weekly = form.weeklySessions ?? defaultWeeklySessions(daysOf(form.programId))
  const setWeeks = (weeks: number) => set({ weeks, deloadWeeks: form.deloadWeeks.filter((n) => n <= weeks) })

  const start = normalizeStart(form.startsOn)
  const preview: Block = { ...form, startsOn: start, id: id ?? 'nouveau', createdAt: 0 }
  const ready = form.name.trim() !== ''

  async function save(shiftNext = false) {
    await saveBlock(id ?? newId, form, shiftNext)
    navigate(id ? `/calendrier/${id}` : '/calendrier', { replace: true })
  }

  // Blocs que « Décaler » ferait reculer : ceux qui commencent après celui-ci (même règle que shiftNextBlocks).
  const later = conflicts.filter((b) => b.startsOn > start)
  const formatLongDay = (t: number) => new Date(t).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })

  function trySave() {
    if (!ready) return
    const others = overlapping(preview, blocks ?? [])
    if (others.length > 0) setConflicts(others)
    else void save()
  }

  return (
    <main className="flex flex-1 flex-col gap-4 px-4 pt-2 pb-4">
      <ScreenHeader title={id ? 'Modifier le bloc' : 'Nouveau bloc'} backTo={back} backLabel="Annuler" close size="m" />

      <div className="flex items-end gap-2">
        <TextField label="Nom du bloc" value={form.name} onChange={(name) => set({ name })} placeholder="Ex. Force" autoCapitalize="sentences" className="min-w-0 flex-1" />
        <button
          type="button"
          aria-label={`Couleur du bloc : ${BLOCK_COLOR_LABELS[blockColor(form)]}, changer`}
          onClick={() => setChoosingColor(true)}
          className="flex size-[52px] shrink-0 items-center justify-center rounded-md border-[1.5px] border-border-strong bg-surface"
        >
          <span aria-hidden="true" className="size-7 rounded-full border-[1.5px] border-border-strong" style={{ background: colorVar(blockColor(form)) }} />
        </button>
      </div>

      <fieldset className="m-0 flex flex-col border-0 p-0">
        <Legend>Objectif</Legend>
        <div role="group" aria-label="Objectif" className="-mx-4 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {goals.map((g) => (
            <Chip key={g.id} selected={form.goalId === g.id} onClick={() => set({ goalId: form.goalId === g.id ? null : g.id })}>
              {g.name}
            </Chip>
          ))}
          <Chip selected={false} onClick={() => setNewGoal(true)}>
            + Nouvel objectif
          </Chip>
        </div>
      </fieldset>

      {/* Premier jour : la case affiche la date en toutes lettres ; le vrai champ date d'iOS est posé
          dessus, transparent, et enfermé dans la case (overflow-hidden). Toucher la case ouvre la roue
          de dates d'iOS, mais le champ ne peut plus faire glisser la page : affiché tel quel, Safari
          lui donnait une largeur à lui qui dépassait de l'écran (retour du 22/09/2026). */}
      <label className="flex flex-col gap-1.5">
        <span className="text-caption font-semibold tracking-[0.06em] text-muted uppercase">Premier jour (un lundi)</span>
        <span className="relative flex h-[52px] items-center gap-2 overflow-hidden rounded-md border-[1.5px] border-border-strong bg-surface px-3.5">
          <span aria-hidden="true" className="min-w-0 flex-1 truncate text-body-strong font-semibold text-text">
            {new Date(start).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </span>
          <span aria-hidden="true" className="flex shrink-0 text-muted">
            <IconCalendrier size={20} />
          </span>
          <input
            type="date"
            value={toInput(start)}
            onChange={(e) => e.target.value && set({ startsOn: fromInput(e.target.value) })}
            className="absolute inset-0 h-full w-full max-w-full min-w-0 appearance-none opacity-0"
          />
        </span>
      </label>

      <Card className="flex shrink-0 flex-col px-3.5 py-0.5">
        <MiniStepper
          label="Durée"
          value={String(form.weeks)}
          unit="sem."
          ariaLabel="Durée en semaines"
          valueWidth={VALUE_WIDTH}
          canDecrement={form.weeks > MIN_WEEKS}
          canIncrement={form.weeks < MAX_WEEKS}
          onDecrement={() => setWeeks(form.weeks - 1)}
          onIncrement={() => setWeeks(form.weeks + 1)}
        />
        <div className="h-px bg-border" />
        <MiniStepper
          label="Deload"
          value={deload > 0 ? `S${deload}` : 'Aucun'}
          ariaLabel="Semaine de deload"
          valueWidth={VALUE_WIDTH}
          canDecrement={deload > 0}
          canIncrement={deload < form.weeks}
          onDecrement={() => setDeload(deload - 1)}
          onIncrement={() => setDeload(deload + 1)}
        />
        <div className="h-px bg-border" />
        {/* Sert au « 6 faites sur 15 prévues » du calendrier : séances par semaine × semaines. */}
        <MiniStepper
          label="Par semaine"
          value={String(weekly)}
          unit={weekly > 1 ? 'séances' : 'séance'}
          ariaLabel="Séances par semaine"
          valueWidth={VALUE_WIDTH}
          canDecrement={weekly > MIN_WEEKLY_SESSIONS}
          canIncrement={weekly < MAX_WEEKLY_SESSIONS}
          onDecrement={() => set({ weeklySessions: weekly - 1 })}
          onIncrement={() => set({ weeklySessions: weekly + 1 })}
        />
      </Card>

      <fieldset className="m-0 flex flex-col border-0 p-0">
        <Legend>Programme suivi</Legend>
        <div role="group" aria-label="Programme suivi" className="-mx-4 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {programs.map(({ program }) => (
            <Chip key={program.id} selected={form.programId === program.id} onClick={() => set({ programId: program.id })}>
              {program.name}
            </Chip>
          ))}
          <Chip selected={form.programId === null} onClick={() => set({ programId: null })}>
            Aucun
          </Chip>
        </div>
      </fieldset>

      <div className="flex-1" />

      <div className="flex shrink-0 flex-col gap-1.5">
        <p className="num text-center text-small font-medium text-muted">{formatLongSpan(start, blockLastDay(preview))}</p>
        <Button onClick={trySave} disabled={!ready} aria-describedby={ready ? undefined : 'blocage'}>
          {id ? 'Enregistrer' : 'Créer le bloc'}
        </Button>
        {!ready && (
          <p id="blocage" className="text-center text-small text-muted">
            Donne un nom au bloc.
          </p>
        )}
      </div>

      <Sheet open={choosingColor} onClose={() => setChoosingColor(false)} label="Couleur du bloc">
        <h2 className="text-title font-bold">Couleur du bloc</h2>
        <div role="group" aria-label="Couleur du bloc" className="grid grid-cols-4 gap-y-2">
          {BLOCK_COLORS.map((c) => {
            const selected = blockColor(form) === c
            return (
              <button
                key={c}
                type="button"
                aria-pressed={selected}
                onClick={() => {
                  set({ color: c })
                  setChoosingColor(false)
                }}
                className="flex min-h-20 flex-col items-center justify-center gap-1.5 rounded-md text-small text-muted active:bg-surface-2"
              >
                <span
                  aria-hidden="true"
                  className={`flex size-11 items-center justify-center rounded-full text-text ${selected ? 'border-[3px] border-text' : 'border-[1.5px] border-border-strong'}`}
                  style={{ background: colorVar(c) }}
                >
                  {selected && <IconCoche size={20} strokeWidth={3} />}
                </span>
                {BLOCK_COLOR_LABELS[c]}
              </button>
            )
          })}
        </div>
      </Sheet>

      <NameSheet
        open={newGoal}
        onClose={() => setNewGoal(false)}
        title="Nouvel objectif"
        fields={[{ label: 'Nom', placeholder: 'Ex. Puissance' }]}
        confirmLabel="Créer l’objectif"
        onConfirm={async ([name]) => {
          const goalId = await createGoal(name)
          set({ goalId })
          setNewGoal(false)
        }}
      />

      <Sheet open={conflicts.length > 0} onClose={() => setConflicts([])} label="Chevauchement">
        <div>
          <h2 className="text-title font-bold">
            {later.length > 0 ? `Le bloc irait jusqu’au ${formatLongDay(blockLastDay(preview))}` : 'Deux blocs en même temps'}
          </h2>
          <p className="mt-1.5 text-body text-muted">
            {conflicts.map((b) => `« ${b.name} » ${b.startsOn > start ? 'commence' : 'a commencé'} le ${formatLongDay(b.startsOn)}`).join(', ')} :
            les blocs se chevaucheraient. Pendant les semaines communes, les séances iraient au bloc qui a commencé le plus tard.
          </p>
        </div>
        <div className="flex flex-col gap-2">
          {later.length > 0 && (
            <Button onClick={() => void save(true)}>
              {later.length === 1 ? `Décaler « ${later[0].name} »` : 'Décaler les blocs suivants'}
            </Button>
          )}
          <Button variant={later.length > 0 ? 'secondary' : 'primary'} onClick={() => void save()}>
            Laisser le chevauchement
          </Button>
          <Button variant="link" className="text-text" onClick={() => setConflicts([])}>
            Changer les dates
          </Button>
        </div>
      </Sheet>
    </main>
  )
}

export default BlockFormPage
