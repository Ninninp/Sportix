// Panneau pour saisir un ou deux noms (maquette J5 « Nouveau programme ») : nouveau programme
// (nom + premier jour), nouveau jour, renommer. Le bouton reste grisé tant qu'un champ est vide.
import { useRef, useState } from 'react'
import Button from '../../components/Button.tsx'
import Sheet from '../../components/Sheet.tsx'
import TextField from '../../components/TextField.tsx'

type Field = { label: string; placeholder: string; initial?: string }

type Props = {
  open: boolean
  onClose: () => void
  title: string
  fields: Field[]
  confirmLabel: string
  /** Peut être asynchrone : le bouton reste désactivé jusqu'à la fin (pas de doublon au double appui). */
  onConfirm: (values: string[]) => void | Promise<void>
}

function NameSheet({ open, onClose, title, fields, confirmLabel, onConfirm }: Props) {
  return (
    <Sheet open={open} onClose={onClose} label={title}>
      {/* Remonté à chaque ouverture : les champs repartent de leurs valeurs initiales */}
      {open && <NameForm title={title} fields={fields} confirmLabel={confirmLabel} onConfirm={onConfirm} onClose={onClose} />}
    </Sheet>
  )
}

function NameForm({ title, fields, confirmLabel, onConfirm, onClose }: Omit<Props, 'open'>) {
  const [values, setValues] = useState(fields.map((f) => f.initial ?? ''))
  // Pendant l'enregistrement, le bouton est désactivé : un double appui sur « Créer » créait deux
  // objectifs (ou programmes, ou jours) du même nom (relecture du J6). Le verrou est un `useRef`,
  // qui change tout de suite : deux appuis dans la même fraction de seconde arrivent avant que
  // React ait redessiné le bouton, un simple état ne suffisait pas (vérifié dans Chrome).
  const lock = useRef(false)
  const [busy, setBusy] = useState(false)
  const ready = values.every((v) => v.trim() !== '') && !busy
  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault()
        if (!ready || lock.current) return
        lock.current = true
        setBusy(true)
        Promise.resolve(onConfirm(values.map((v) => v.trim()))).finally(() => {
          lock.current = false
          setBusy(false)
        })
      }}
    >
      <h2 className="text-title font-bold">{title}</h2>
      {fields.map((f, i) => (
        <TextField
          key={f.label}
          label={f.label}
          placeholder={f.placeholder}
          value={values[i]}
          onChange={(v) => setValues((current) => current.map((old, j) => (j === i ? v : old)))}
          enterKeyHint={i === fields.length - 1 ? 'done' : 'next'}
        />
      ))}
      <div className="flex flex-col gap-1">
        <Button type="submit" disabled={!ready}>
          {confirmLabel}
        </Button>
        <Button type="button" variant="link" onClick={onClose} className="text-text">
          Annuler
        </Button>
      </div>
    </form>
  )
}

export default NameSheet
