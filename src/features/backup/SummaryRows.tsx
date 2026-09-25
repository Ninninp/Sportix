// Lignes « Séances 142 / Programmes 3 / Blocs 4 / Pesées 38 » d'une sauvegarde (maquettes J8).
// Avec `device`, une seconde colonne montre ce qu'il y a sur le téléphone (confirmation d'import).
import type { BackupSummary } from '../../lib/backup.ts'

const ROWS: { key: keyof BackupSummary; label: string }[] = [
  { key: 'sessions', label: 'Séances' },
  { key: 'programs', label: 'Programmes' },
  { key: 'blocks', label: 'Blocs' },
  { key: 'bodyWeights', label: 'Pesées' },
]
const COLS = 'grid grid-cols-[minmax(0,1fr)_104px_104px] items-center gap-x-2'

export function SummaryRows({ summary }: { summary: BackupSummary }) {
  return ROWS.map(({ key, label }) => (
    <div key={key} className="flex min-h-10 items-center justify-between px-4">
      <span className="text-body text-muted">{label}</span>
      <span className="num text-body-strong">{summary[key]}</span>
    </div>
  ))
}

export function CompareRows({ backup, device, backupDate }: { backup: BackupSummary; device: BackupSummary; backupDate: string }) {
  return (
    <>
      <div className={`${COLS} min-h-11 px-4 pt-2 pb-1`}>
        <span />
        <span className="text-right text-caption font-semibold text-muted">
          Sauvegarde
          <br />
          du {backupDate}
        </span>
        <span className="text-right text-caption font-semibold text-muted">
          Ce
          <br />
          téléphone
        </span>
      </div>
      {ROWS.map(({ key, label }) => (
        <div key={key} className={`${COLS} min-h-10 border-t border-border px-4`}>
          <span className="text-body text-muted">{label}</span>
          <span className="num text-right text-body-strong">{backup[key]}</span>
          <span className="num text-right text-body-strong text-muted">{device[key]}</span>
        </div>
      ))}
    </>
  )
}
