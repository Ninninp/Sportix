// Ligne de série (D4) : son état se lit à la couleur, sans case à cocher.
// faite = fond discret · en cours = couleurs inversées · à venir = contour en pointillés.
type Props = {
  index: number
  weight: string
  reps: number
  state: 'done' | 'current' | 'next'
  onClick?: () => void
}

const looks = {
  done: 'border-surface-2 bg-surface-2 text-muted',
  current: 'border-inverse bg-inverse text-on-inverse',
  next: 'border-dashed border-border-strong bg-transparent text-faint',
}
const labels = { done: 'faite', current: 'en cours', next: 'à faire' }

function SetRow({ index, weight, reps, state, onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={state === 'current' ? 'true' : undefined}
      aria-label={`Série ${index}, ${labels[state]} : ${weight}, ${reps} reps`}
      className={`grid min-h-12 w-full grid-cols-[24px_minmax(0,1fr)_72px] items-center gap-x-3 rounded-sm border-[1.5px] px-3.5 text-left ${looks[state]}`}
    >
      <span className="num text-body">{index}</span>
      <span className="num text-num-m">{weight}</span>
      <span className="num text-num-m text-right">× {reps}</span>
    </button>
  )
}

export default SetRow
