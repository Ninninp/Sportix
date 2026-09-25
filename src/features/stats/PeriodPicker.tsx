// Bouton « 3 mois ⌄ » en haut à droite des écrans d'exercice (maquettes J7) : il ouvre un panneau
// pour changer la période, la même que celle de la vue d'ensemble (gardée dans l'adresse).
import { useState } from 'react'
import Sheet from '../../components/Sheet.tsx'
import { IconChevronBas, IconCoche } from '../../components/icons.tsx'
import { PERIOD_LABELS, PERIODS } from '../../lib/stats.ts'
import { usePeriod } from './useStats.ts'

function PeriodPicker() {
  const [period, setPeriod] = usePeriod()
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Période : ${PERIOD_LABELS[period]}, changer`}
        className="inline-flex min-h-12 items-center gap-1 px-2 text-body font-bold whitespace-nowrap text-text"
      >
        {PERIOD_LABELS[period]}
        <IconChevronBas size={18} strokeWidth={2.5} />
      </button>
      <Sheet open={open} onClose={() => setOpen(false)} label="Période">
        <h2 className="text-title font-bold">Période</h2>
        <div className="flex flex-col">
          {PERIODS.map((p) => (
            <button
              key={p}
              type="button"
              aria-pressed={p === period}
              onClick={() => {
                setPeriod(p)
                setOpen(false)
              }}
              className="flex min-h-14 items-center justify-between rounded-md px-3 text-left text-body-strong font-semibold text-text active:bg-surface-2"
            >
              {PERIOD_LABELS[p]}
              {p === period && <IconCoche size={22} />}
            </button>
          ))}
        </div>
      </Sheet>
    </>
  )
}

export default PeriodPicker
