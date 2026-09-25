// Section « Sauvegarde » des Réglages (maquettes J8, validées le 25/09/2026) :
// - « Exporter mes données » (avec la date de la dernière sauvegarde) ouvre le panneau d'export ;
// - « Importer une sauvegarde » ouvre le choix de fichier d'iOS, puis :
//   fichier refusé → panneau d'explication (rien n'est changé) ;
//   sinon → confirmation (la sauvegarde face au téléphone, séances perdues), puis « Données importées ».
// L'import REMPLACE tout : c'est dit sur la ligne, dans la confirmation, et le bouton est rouge.
import { useLiveQuery } from 'dexie-react-hooks'
import { useRef, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router'
import Button from '../../components/Button.tsx'
import Card from '../../components/Card.tsx'
import Sheet from '../../components/Sheet.tsx'
import { IconAlerte, IconChevronDroite, IconCoche, IconImporter, IconPartager } from '../../components/icons.tsx'
import { compareWithDevice, importBackup, readBackupFile } from '../../db/backup.ts'
import { describeImported, describeLastBackup, describeLost, summarize, type Backup, type BackupSummary } from '../../lib/backup.ts'
import { formatDayMonth } from '../../lib/blocks.ts'
import { useNowOnResume } from '../timer/useNow.ts'
import ExportSheet from './ExportSheet.tsx'
import { CompareRows } from './SummaryRows.tsx'

type ImportState =
  | { step: 'confirm'; backup: Backup }
  | { step: 'refused'; reason: 'illisible' | 'pas-sportix' | 'trop-recent' | 'echec' }
  | { step: 'done'; summary: BackupSummary }
  | null

/** Ligne de la section : icône, titre, sous-titre, chevron. */
function Row({ icon, title, subtitle, onClick }: { icon: ReactNode; title: string; subtitle: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="flex min-h-16 w-full items-center gap-3 py-2 pr-3 pl-4 text-left text-text active:bg-surface-2">
      <span className="flex text-muted">{icon}</span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-body-strong">{title}</span>
        <span className="text-small text-muted">{subtitle}</span>
      </span>
      <span className="flex text-muted">
        <IconChevronDroite size={20} />
      </span>
    </button>
  )
}

type ConfirmProps = { backup: Backup; onCancel: () => void; onExportFirst: () => void; onDone: (s: BackupSummary) => void; onFailed: () => void }

function ConfirmSheet({ backup, onCancel, onExportFirst, onDone, onFailed }: ConfirmProps) {
  const comparison = useLiveQuery(() => compareWithDevice(backup), [backup])
  // Pendant l'import, le panneau ne se ferme plus (sinon on croirait avoir annulé un import
  // qui se termine quand même) ; le verrou empêche aussi un second appui.
  const [running, setRunning] = useState(false)
  const busy = useRef(false)
  const summary = summarize(backup.tables)

  const replace = async () => {
    if (busy.current) return
    busy.current = true
    setRunning(true)
    try {
      await importBackup(backup)
      onDone(summary)
    } catch {
      // La transaction est annulée : rien n'a changé sur le téléphone
      onFailed()
    }
  }

  return (
    <Sheet open onClose={running ? () => {} : onCancel} label="Remplacer tes données">
      <div>
        <h2 className="text-title font-bold">Remplacer tes données ?</h2>
        <p className="mt-1.5 text-body text-muted">Tout ce qui est sur ce téléphone sera remplacé par la sauvegarde.</p>
      </div>
      {comparison && (
        <>
          <Card className="shrink-0 overflow-hidden">
            <CompareRows backup={summary} device={comparison.device} backupDate={formatDayMonth(backup.exportedAt)} />
          </Card>
          {comparison.lost > 0 && (
            <p className="flex gap-2 text-body text-danger">
              <IconAlerte size={20} className="shrink-0" />
              <span>{describeLost(comparison.lost)}</span>
            </p>
          )}
        </>
      )}
      <div className="flex flex-col gap-2">
        <Button variant="danger" disabled={!comparison || running} onClick={() => void replace()}>
          {running ? 'Import en cours…' : 'Remplacer mes données'}
        </Button>
        <Button variant="secondary" disabled={running} onClick={onCancel}>
          Annuler
        </Button>
        <Button variant="link" className="text-text" disabled={running} onClick={onExportFirst}>
          Exporter d’abord ce téléphone
        </Button>
      </div>
    </Sheet>
  )
}

const NOT_A_BACKUP = {
  title: 'Ce fichier n’est pas une sauvegarde Sportix',
  text: 'Choisis un fichier « sportix-….json » créé par « Exporter mes données ». Rien n’a été changé sur ce téléphone.',
}
const REFUSALS = {
  illisible: NOT_A_BACKUP,
  'pas-sportix': NOT_A_BACKUP,
  echec: {
    title: 'L’import n’a pas abouti',
    text: 'Rien n’a été changé sur ce téléphone. Ferme l’app et rouvre-la, puis réessaie.',
  },
  'trop-recent': {
    title: 'Sauvegarde d’une version plus récente',
    text: 'Elle vient d’une version de Sportix plus récente que celle-ci. Ferme l’app et rouvre-la pour la mettre à jour, puis réessaie. Rien n’a été changé sur ce téléphone.',
  },
}

function BackupSection({ lastBackupAt }: { lastBackupAt?: number }) {
  const navigate = useNavigate()
  const now = useNowOnResume()
  const input = useRef<HTMLInputElement>(null)
  const [exporting, setExporting] = useState(false)
  const [importing, setImporting] = useState<ImportState>(null)

  const chooseFile = () => {
    setImporting(null)
    input.current?.click()
  }

  const onFile = async (file: File | undefined) => {
    if (!file) return
    const result = readBackupFile(await file.text())
    setImporting(result.ok ? { step: 'confirm', backup: result.backup } : { step: 'refused', reason: result.reason })
  }

  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-caption font-semibold tracking-[0.06em] text-muted uppercase">Sauvegarde</h2>
      <Card className="divide-y divide-border overflow-hidden">
        <Row icon={<IconPartager size={20} />} title="Exporter mes données" subtitle={describeLastBackup(lastBackupAt, now)} onClick={() => setExporting(true)} />
        <Row icon={<IconImporter size={20} />} title="Importer une sauvegarde" subtitle="Remplace les données de ce téléphone" onClick={chooseFile} />
      </Card>
      {/* Choix du fichier : le sélecteur d'iOS (Fichiers, iCloud Drive…). Remis à zéro après chaque
          choix, pour pouvoir choisir deux fois de suite le même fichier. */}
      <input
        ref={input}
        type="file"
        accept=".json,application/json"
        className="hidden"
        onChange={(e) => {
          void onFile(e.target.files?.[0])
          e.target.value = ''
        }}
      />

      {exporting && <ExportSheet onClose={() => setExporting(false)} />}

      {importing?.step === 'confirm' && !exporting && (
        <ConfirmSheet
          backup={importing.backup}
          onCancel={() => setImporting(null)}
          onExportFirst={() => setExporting(true)}
          onDone={(summary) => setImporting({ step: 'done', summary })}
          onFailed={() => setImporting({ step: 'refused', reason: 'echec' })}
        />
      )}

      {importing?.step === 'refused' && (
        <Sheet open onClose={() => setImporting(null)} label="Fichier refusé">
          <div className="flex flex-col gap-1.5">
            <span className="flex text-danger">
              <IconAlerte size={28} />
            </span>
            <h2 className="text-title font-bold">{REFUSALS[importing.reason].title}</h2>
            <p className="text-body text-muted">{REFUSALS[importing.reason].text}</p>
          </div>
          <div className="flex flex-col gap-1">
            <Button variant="secondary" onClick={chooseFile}>
              Choisir un autre fichier
            </Button>
            <Button variant="link" className="text-text" onClick={() => setImporting(null)}>
              Fermer
            </Button>
          </div>
        </Sheet>
      )}

      {importing?.step === 'done' && (
        <Sheet open onClose={() => navigate('/')} label="Données importées">
          <div className="flex flex-col gap-1.5">
            <span className="flex size-11 items-center justify-center rounded-full bg-inverse text-on-inverse">
              <IconCoche size={24} strokeWidth={2.5} />
            </span>
            <h2 className="text-title font-bold">Données importées</h2>
            <p className="text-body text-muted">{describeImported(importing.summary)}</p>
          </div>
          <Button onClick={() => navigate('/')}>OK</Button>
        </Sheet>
      )}
    </section>
  )
}

export default BackupSection
