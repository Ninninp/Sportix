// Barre des semaines d'un bloc (maquettes D3 et J6) : une case par semaine.
// Pleine = passée, inversée avec « S2 » = en cours, contour = à venir, pointillés avec « D » = deload.
// `onInverse` : posée sur la carte inversée du calendrier (couleurs retournées).
import type { WeekSegment } from '../../lib/blocks.ts'

type Props = { segments: WeekSegment[]; onInverse?: boolean; height?: 16 | 18 }

function WeekBar({ segments, onInverse = false, height = 18 }: Props) {
  const line = onInverse ? 'border-on-inverse-muted' : 'border-border-strong'
  const past = onInverse ? 'bg-on-inverse-muted' : 'bg-border-strong'
  const current = onInverse ? 'bg-on-inverse text-inverse' : 'bg-inverse text-on-inverse'
  const muted = onInverse ? 'text-on-inverse-muted' : 'text-muted'
  return (
    <span aria-hidden="true" className="grid gap-[3px]" style={{ gridTemplateColumns: `repeat(${segments.length}, minmax(0, 1fr))` }}>
      {segments.map((s) => {
        const box = `box-border flex items-center justify-center rounded-full text-caption leading-none font-extrabold ${height === 16 ? 'h-4' : 'h-[18px]'}`
        if (s.state === 'current') return <span key={s.index} className={`${box} ${current}`}>{segments.length > 8 ? '' : `S${s.index}`}</span>
        if (s.state === 'past') return <span key={s.index} className={`${box} ${past}`} />
        return (
          <span key={s.index} className={`${box} border-[1.5px] ${line} ${muted} ${s.deload ? 'border-dashed' : ''}`}>
            {s.deload && segments.length <= 12 ? 'D' : ''}
          </span>
        )
      })}
    </span>
  )
}

export default WeekBar
