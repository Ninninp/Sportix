// Panneau « Exporter mes données » (maquette J8) : ce que contient la sauvegarde, puis « Partager le
// fichier », qui ouvre la feuille de partage d'iOS (Fichiers, AirDrop, mail…).
// Le fichier est préparé dès l'ouverture du panneau : iOS n'ouvre la feuille de partage que pendant
// un appui, et lire toute la base après l'appui risquerait de laisser passer ce moment.
// À n'afficher que pendant qu'il est ouvert (`{open && <ExportSheet … />}`).
import { useEffect, useRef, useState } from 'react'
import Button from '../../components/Button.tsx'
import Card from '../../components/Card.tsx'
import Sheet from '../../components/Sheet.tsx'
import { IconPartager } from '../../components/icons.tsx'
import { exportBackup, markBackupDone } from '../../db/backup.ts'
import { backupFileName, formatFileSize, summarize, type BackupSummary } from '../../lib/backup.ts'
import { SummaryRows } from './SummaryRows.tsx'

type Prepared = { file: File; summary: BackupSummary }

/** Partage le fichier (iOS : feuille de partage) ; sinon, le télécharge. true si c'est fait. */
async function shareOrDownload(file: File): Promise<boolean> {
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: 'Sauvegarde Sportix' })
      return true
    } catch (e) {
      // Annulé par l'utilisateur : rien n'est sauvegardé. Autre refus : on passe au téléchargement.
      if (e instanceof DOMException && e.name === 'AbortError') return false
    }
  }
  const url = URL.createObjectURL(file)
  const link = document.createElement('a')
  link.href = url
  link.download = file.name
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
  return true
}

function ExportSheet({ onClose }: { onClose: () => void }) {
  const [prepared, setPrepared] = useState<Prepared | null>(null)
  const busy = useRef(false)

  useEffect(() => {
    let cancelled = false
    void exportBackup().then((backup) => {
      if (cancelled) return
      const file = new File([JSON.stringify(backup)], backupFileName(backup.exportedAt), { type: 'application/json' })
      setPrepared({ file, summary: summarize(backup.tables) })
    })
    return () => {
      cancelled = true
    }
  }, [])

  const share = async () => {
    if (!prepared || busy.current) return
    busy.current = true
    const done = await shareOrDownload(prepared.file)
    busy.current = false
    if (done) {
      await markBackupDone()
      onClose()
    }
  }

  return (
    <Sheet open onClose={onClose} label="Exporter mes données">
      <div>
        <h2 className="text-title font-bold">Exporter mes données</h2>
        <p className="mt-1.5 text-body text-muted">Un fichier avec tout ce que contient l’app. Range-le dans Fichiers ou envoie-le-toi : c’est ta copie de secours.</p>
      </div>
      {prepared ? (
        <>
          <Card className="shrink-0 divide-y divide-border overflow-hidden">
            <SummaryRows summary={prepared.summary} />
          </Card>
          <p className="num -mt-2 text-center text-small text-muted">
            {prepared.file.name} · {formatFileSize(prepared.file.size)}
          </p>
        </>
      ) : (
        <p className="text-body text-muted">Préparation du fichier…</p>
      )}
      <div className="flex flex-col gap-1">
        <Button disabled={!prepared} onClick={() => void share()}>
          <IconPartager size={20} />
          Partager le fichier
        </Button>
        <Button variant="link" className="text-text" onClick={onClose}>
          Annuler
        </Button>
      </div>
    </Sheet>
  )
}

export default ExportSheet
