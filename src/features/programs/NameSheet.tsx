// Panneau pour saisir un ou deux noms (maquette J5 « Nouveau programme ») : nouveau programme
// (nom + premier jour), nouveau jour, renommer. Le bouton reste grisé tant qu'un champ est vide.
import { useState } from 'react'
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
  onConfirm: (values: string[]) => void
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
  const ready = values.every((v) => v.trim() !== '')
  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault()
        if (ready) onConfirm(values.map((v) => v.trim()))
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
