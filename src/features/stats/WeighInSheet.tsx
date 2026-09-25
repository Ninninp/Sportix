// Panneau « Pesée » (maquette J7) : le poids au pavé − / + (0,1 kg, maintien enfoncé, ou toucher le
// nombre pour le taper), le jour (aujourd'hui par défaut, modifiable), « Enregistrer ».
// Le poids part de la dernière pesée : d'un jour à l'autre, il ne bouge que de quelques dixièmes.
// Un jour qui a déjà sa pesée : le panneau reprend ce poids (l'enregistrer la remplace) et propose
// de la supprimer (pesée faite par erreur, ou le mauvais jour).
// À n'afficher que pendant qu'il est ouvert (`{open && <WeighInSheet … />}`) : l'identifiant de la
// pesée est tiré à l'ouverture, deux appuis sur « Enregistrer » écrivent donc la même ligne.
import { useRef, useState } from 'react'
import Button from '../../components/Button.tsx'
import Card from '../../components/Card.tsx'
import NumberStepper from '../../components/NumberStepper.tsx'
import Sheet from '../../components/Sheet.tsx'
import { IconChevronDroite } from '../../components/icons.tsx'
import { deleteBodyWeight, saveBodyWeight } from '../../db/bodyWeights.ts'
import {
  BODY_WEIGHT_DEFAULT,
  BODY_WEIGHT_MIN,
  dayStart,
  formatBodyWeight,
  parseBodyWeight,
  stepBodyWeight,
  type BodyWeight,
} from '../../lib/bodyWeight.ts'
import { formatShortDate } from '../../lib/stats.ts'

/** « 2026-09-14 » (valeur d'un champ date) ↔ horodatage local à 0 h. */
const toInput = (time: number) => {
  const d = new Date(time)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
const fromInput = (value: string) => {
  const [y, m, d] = value.split('-').map(Number)
  return new Date(y, m - 1, d).getTime()
}

type Props = { weights: BodyWeight[]; onClose: () => void }

function WeighInSheet({ weights, onClose }: Props) {
  const [id] = useState(() => crypto.randomUUID())
  // Aujourd'hui, figé à l'ouverture du panneau (jour proposé, et dernier jour qu'on peut choisir)
  const [today] = useState(() => dayStart(Date.now()))
  const [date, setDate] = useState(today)
  const existing = weights.find((w) => w.date === date)
  const [kg, setKg] = useState(() => existing?.kg ?? weights.at(-1)?.kg ?? BODY_WEIGHT_DEFAULT)
  const saving = useRef(false)

  const chooseDay = (day: number) => {
    setDate(day)
    const found = weights.find((w) => w.date === day)
    if (found) setKg(found.kg)
  }

  const remove = async () => {
    if (!existing || saving.current) return
    saving.current = true
    await deleteBodyWeight(existing.id)
    onClose()
  }

  const save = async () => {
    if (saving.current) return
    saving.current = true
    await saveBodyWeight(id, date, kg)
    onClose()
  }

  return (
    <Sheet open onClose={onClose} label="Pesée">
      <h2 className="text-title font-bold">Pesée</h2>
      <NumberStepper
        label="Poids"
        ariaLabel="Poids"
        value={formatBodyWeight(kg)}
        unit="kg"
        minusLabel="Moins 0,1 kg"
        plusLabel="Plus 0,1 kg"
        canDecrement={kg > BODY_WEIGHT_MIN}
        onDecrement={() => setKg((v) => stepBodyWeight(v, -1))}
        onIncrement={() => setKg((v) => stepBodyWeight(v, 1))}
        inputMode="decimal"
        onType={(text) => {
          const value = parseBodyWeight(text)
          if (value !== null) setKg(value)
        }}
      />
      {/* Le vrai champ date d'iOS est posé dessus, transparent (comme le formulaire d'un bloc) */}
      <Card className="relative overflow-hidden">
        <label className="flex min-h-14 items-center gap-3 pr-3 pl-4">
          <span className="flex-1 text-body-strong font-semibold">{date === today ? 'Aujourd’hui' : 'Jour'}</span>
          <span className="text-body text-muted">{formatShortDate(date)}</span>
          <span className="flex text-muted">
            <IconChevronDroite size={20} />
          </span>
          <input
            type="date"
            aria-label="Jour de la pesée"
            value={toInput(date)}
            max={toInput(today)}
            onChange={(e) => e.target.value && chooseDay(Math.min(today, fromInput(e.target.value)))}
            className="absolute inset-0 h-full w-full max-w-full min-w-0 appearance-none opacity-0"
          />
        </label>
      </Card>
      <div className="flex flex-col gap-1">
        <Button onClick={() => void save()}>{existing ? 'Remplacer' : 'Enregistrer'}</Button>
        <Button variant="link" className="text-text" onClick={onClose}>
          Annuler
        </Button>
        {existing && (
          <Button variant="link" className="text-danger" onClick={() => void remove()}>
            Supprimer la pesée de ce jour
          </Button>
        )}
      </div>
    </Sheet>
  )
}

export default WeighInSheet
