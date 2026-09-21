// Progression de la séance : « 4 / 15 séries » et une barre en 5 segments (D4).
// `onRest` : sur l'écran de fin de repos, tout passe dans la couleur on-rest.
type Props = { done: number; total: number; onRest?: boolean }

function SessionProgress({ done, total, onRest = false }: Props) {
  const segments = 5
  const filled = total === 0 ? 0 : (done / total) * segments

  return (
    <div className="flex shrink-0 flex-col gap-2">
      <div className={`flex items-baseline justify-between text-small ${onRest ? 'text-on-rest' : 'text-muted'}`}>
        <span className="font-semibold">Séance</span>
        <span>
          <span className={`num text-[16px] ${onRest ? '' : 'text-text'}`}>
            {done} / {total}
          </span>{' '}
          séries
        </span>
      </div>
      <div
        role="progressbar"
        aria-label="Progression de la séance"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={done}
        className="grid grid-cols-5 gap-1"
      >
        {Array.from({ length: segments }, (_, i) => (
          <div
            key={i}
            className={`h-2 overflow-hidden rounded-[4px] border-[1.5px] ${onRest ? 'border-on-rest' : 'border-border-strong'}`}
          >
            <div
              className={`h-full ${onRest ? 'bg-on-rest' : 'bg-text'}`}
              style={{ width: `${Math.max(0, Math.min(1, filled - i)) * 100}%` }}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

export default SessionProgress
