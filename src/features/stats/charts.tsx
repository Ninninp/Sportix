// Graphiques des Stats (maquettes J7), dessinés en SVG. Règles de la skill dataviz, reprises des
// maquettes : la série qui compte en encre, le contexte en gris ; traits de 2 px, points de 8 px
// cerclés de la couleur de la carte ; grille en filets pleins, graduations à droite ; ligne
// d'objectif en pointillés ; pas de valeur sur chaque point (seulement le record). Blocs en lavis
// de leur couleur, deload hachuré, ses points creux et gris.
// Les couleurs viennent des variables CSS des tokens (`var(--sx-…)`) : les deux thèmes suivent
// tout seuls. Tous les calculs (échelle, repères) sont dans src/lib/stats.ts.
import { useId, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import type { BlockColor } from '../../lib/blocks.ts'
import { niceScale, timeLabels, type WeekCount } from '../../lib/stats.ts'
import { formatNumber } from '../../lib/sessions.ts'
import { staggerDelay, traceDelay } from '../../lib/motion.ts'
import { prefersReducedMotion } from '../motion/useMotion.ts'
import { colorVar } from '../blocks/blockColors.ts'

const C = {
  text: 'var(--sx-text)',
  muted: 'var(--sx-text-muted)',
  strong: 'var(--sx-border-strong)',
  border: 'var(--sx-border)',
  surface: 'var(--sx-surface)',
  accent2: 'var(--sx-accent-2)',
  onAccent2: 'var(--sx-on-accent-2)',
  inverse: 'var(--sx-inverse)',
  onInverse: 'var(--sx-on-inverse)',
  onInverseMuted: 'var(--sx-on-inverse-muted)',
}
const AXIS = 30 // place des graduations, à droite

/** Durée du tracé d'une courbe (J10). */
const TRACE_MS = 700

/**
 * Courbe qui se trace de gauche à droite (J10). Sa longueur est mesurée (`getTotalLength`) : les
 * pointillés à `pathLength="1"` ne sont pas appliqués par tous les navigateurs (Chrome laissait une
 * courbe en tirets de 1 px). L'animation passe par l'API du navigateur (`animate`), rejouée quand
 * la courbe change (période, mesure, variante) ; rien avec « Réduire les animations ».
 */
function TracedPath({ d, color }: { d: string; color: string }) {
  const ref = useRef<SVGPathElement>(null)
  useLayoutEffect(() => {
    const path = ref.current
    if (!path || prefersReducedMotion() || typeof path.animate !== 'function') return
    const length = path.getTotalLength()
    path.style.strokeDasharray = `${length} ${length}`
    const animation = path.animate([{ strokeDashoffset: length }, { strokeDashoffset: 0 }], {
      duration: TRACE_MS,
      easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
    })
    // À la fin, plus de pointillés du tout : la courbe reste entière même si elle change de longueur
    animation.onfinish = () => (path.style.strokeDasharray = '')
    return () => {
      animation.cancel()
      path.style.strokeDasharray = ''
    }
  }, [d])
  return <path ref={ref} d={d} fill="none" style={{ stroke: color }} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
}

/** Petit rebond d'apparition d'un point (J10), centré sur lui-même, après `delay` ms. */
function popIn(delay: number): CSSProperties {
  return { transformBox: 'fill-box', transformOrigin: 'center', animation: `sx-pop 240ms var(--ease-out) ${Math.round(delay)}ms both` }
}

/** Barre qui pousse depuis sa base (`bottom` : colonne, `left` : barre horizontale), après `delay` ms. */
function grow(from: 'bottom' | 'left', delay: number): CSSProperties {
  const name = from === 'bottom' ? 'sx-pousser-haut' : 'sx-pousser-droite'
  return { transformBox: 'fill-box', transformOrigin: from, animation: `${name} 420ms var(--ease-out) ${delay}ms both` }
}

/**
 * Largeur disponible de l'élément (les graphiques s'adaptent à l'écran). Elle est lue AVANT le
 * premier affichage (`useLayoutEffect`), puis suivie par un `ResizeObserver` : sans cela le graphique
 * apparaissait d'abord à la largeur de secours (326 px), puis se redessinait à la vraie, et la
 * courbe se traçait deux fois de suite.
 */
function useWidth<T extends HTMLElement>(fallback = 326) {
  const ref = useRef<T>(null)
  const [width, setWidth] = useState(fallback)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    setWidth(Math.round(el.getBoundingClientRect().width))
    const observer = new ResizeObserver(([entry]) => setWidth(Math.round(entry.contentRect.width)))
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  return [ref, width] as const
}

const Label = ({ x, y, children, anchor = 'start', weight = 600, color = C.muted }: { x: number; y: number; children: ReactNode; anchor?: 'start' | 'middle' | 'end'; weight?: number; color?: string }) => (
  <text x={x} y={y} textAnchor={anchor} fontSize={11} fontWeight={weight} style={{ fill: color, fontVariantNumeric: 'tabular-nums' }}>
    {children}
  </text>
)

export type ChartPoint = { time: number; value: number }
export type ChartDot = ChartPoint & { kind: 'ink' | 'small' | 'hollow' }
/** Point touchable : ce que dit la bulle (« lun. 27 juil. » / « 105 kg » / « 90 × 5 »). */
export type ChartTip = ChartPoint & { title: string; main: string; detail?: string }

type TimeChartProps = {
  /** Phrase lue par les lecteurs d'écran : ce que montre le graphique. */
  label: string
  height: number
  from: number
  to: number
  line?: ChartPoint[]
  dots?: ChartDot[]
  target?: number
  bands?: { from: number; to: number; color: BlockColor; label: string }[]
  hatched?: { from: number; to: number }[]
  /** Badge « PR » au-dessus de ce point. */
  record?: ChartPoint
  tips?: ChartTip[]
  format?: (v: number) => string
  /** Écart minimal entre deux graduations (la précision affichée : 1 pour des reps ou des kg ronds). */
  minStep?: number
}

/** Courbe dans le temps (poids corporel, progression d'un exercice). Toucher un point ouvre sa bulle. */
export function TimeChart({ label, height, from, to, line = [], dots = [], target, bands = [], hatched = [], record, tips = [], format = (v) => formatNumber(v), minStep = 0 }: TimeChartProps) {
  const [ref, width] = useWidth<HTMLDivElement>()
  const [selected, setSelected] = useState<number | null>(null)
  const pattern = useId()
  const pw = width - AXIS
  // Avec des blocs : une bande en haut pour leur nom, au-dessus de la grille (sinon un trait le barre)
  const top = bands.length > 0 ? 30 : 8
  const bottom = height - 20
  const values = [...line, ...dots].map((p) => p.value).concat(target !== undefined ? [target] : [])
  const scale = niceScale(values, 3, minStep)
  const x = (t: number) => ((t - from) / Math.max(1, to - from)) * pw
  const y = (v: number) => bottom - ((v - scale.min) / (scale.max - scale.min || 1)) * (bottom - top)
  const clampX = (t: number) => Math.max(0, Math.min(pw, x(t)))
  // Seules les semaines de deload visibles : une semaine à venir (après aujourd'hui) ou d'avant la
  // période serait réduite à un trait sur le bord, et son « D » flotterait seul dans le coin.
  const deloads = hatched.filter((h) => clampX(h.to) - clampX(h.from) >= 1)

  // Le point le plus proche du doigt, sur l'axe du temps
  const pick = (clientX: number, rect: DOMRect) => {
    if (tips.length === 0) return
    const px = clientX - rect.left
    let best = 0
    tips.forEach((p, i) => {
      if (Math.abs(x(p.time) - px) < Math.abs(x(tips[best].time) - px)) best = i
    })
    setSelected((current) => (current === best ? null : best))
  }

  const tip = selected !== null ? tips[selected] : undefined
  const bubble = tip && (() => {
    const tx = x(tip.time)
    const ty = y(tip.value)
    const bw = 96
    const bh = tip.detail ? 50 : 38
    const bx = Math.max(0, Math.min(width - bw, tx - bw / 2))
    const above = ty - bh - 12 >= 0
    const by = above ? ty - bh - 12 : ty + 12
    return (
      <g aria-hidden="true">
        <line x1={tx} x2={tx} y1={above ? ty - 12 : ty} y2={bottom} style={{ stroke: C.muted }} strokeWidth={1} />
        <circle cx={tx} cy={ty} r={6} style={{ fill: C.text, stroke: C.surface }} strokeWidth={2} />
        <rect x={bx} y={by} width={bw} height={bh} rx={8} style={{ fill: C.inverse }} />
        <Label x={bx + bw / 2} y={by + 16} anchor="middle" color={C.onInverseMuted}>{tip.title}</Label>
        <text x={bx + bw / 2} y={by + 34} textAnchor="middle" fontSize={17} fontWeight={800} style={{ fill: C.onInverse, fontVariantNumeric: 'tabular-nums' }}>
          {tip.main}
        </text>
        {tip.detail && <Label x={bx + bw / 2} y={by + 46} anchor="middle" color={C.onInverse}>{tip.detail}</Label>}
      </g>
    )
  })()

  const path = line.map((p, i) => `${i ? 'L' : 'M'}${x(p.time).toFixed(1)} ${y(p.value).toFixed(1)}`).join(' ')
  // Début et fin horizontale de la courbe : un point apparaît quand le tracé passe à sa hauteur
  const lineStart = line.length > 0 ? x(line[0].time) : 0
  const lineEnd = line.length > 0 ? x(line[line.length - 1].time) : pw

  return (
    <div ref={ref} className="relative w-full">
      <svg
        role="img"
        aria-label={label}
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="block touch-pan-y overflow-visible select-none"
        onPointerDown={(e) => pick(e.clientX, e.currentTarget.getBoundingClientRect())}
      >
        <defs>
          <pattern id={pattern} width={6} height={6} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1={0} y1={0} x2={0} y2={6} style={{ stroke: C.strong }} strokeWidth={1.5} strokeOpacity={0.6} />
          </pattern>
        </defs>
        {bands.map((b, i) => (
          <g key={`b${i}`}>
            {/* En sombre, les teintes des blocs sont vives : on les adoucit (comme la maquette) */}
            <rect x={clampX(b.from)} y={top - 24} width={clampX(b.to) - clampX(b.from)} height={bottom - top + 24} className="dark:opacity-20" style={{ fill: colorVar(b.color) }} />
          </g>
        ))}
        {deloads.map((h, i) => (
          <rect key={`h${i}`} x={clampX(h.from)} y={top - 24} width={clampX(h.to) - clampX(h.from)} height={bottom - top + 24} fill={`url(#${pattern})`} />
        ))}
        {bands.map((b, i) =>
          clampX(b.to) - clampX(b.from) > 40 ? (
            <Label key={`bl${i}`} x={clampX(b.from) + 5} y={top - 10} weight={700} color={C.text}>{b.label}</Label>
          ) : null,
        )}
        {deloads.map((h, i) => (
          <Label key={`hl${i}`} x={(clampX(h.from) + clampX(h.to)) / 2} y={top - 10} anchor="middle" weight={700} color={C.text}>D</Label>
        ))}
        {scale.ticks.map((v) => (
          <g key={v}>
            <line x1={0} x2={pw} y1={y(v)} y2={y(v)} style={{ stroke: C.border }} strokeWidth={1} />
            <Label x={width} y={y(v) + 4} anchor="end">{format(v)}</Label>
          </g>
        ))}
        {timeLabels(from, to).map((l) => (
          <Label key={l.time} x={x(l.time)} y={height - 3}>{l.label}</Label>
        ))}
        {target !== undefined && <line x1={0} x2={pw} y1={y(target)} y2={y(target)} style={{ stroke: C.muted }} strokeWidth={1.5} strokeDasharray="4 4" />}
        {dots.filter((d) => d.kind === 'small').map((d, i) => (
          <circle key={`s${i}`} cx={x(d.time)} cy={y(d.value)} r={2.5} style={{ fill: C.strong }} />
        ))}
        {path && (
          // J10 : la courbe se trace de gauche à droite (et se retrace quand elle change)
          <TracedPath d={path} color={C.text} />
        )}
        {dots.filter((d) => d.kind !== 'small').map((d, i) => (
          <circle
            key={`d${i}-${from}-${to}`}
            cx={x(d.time)}
            cy={y(d.value)}
            r={4}
            strokeWidth={2}
            style={{
              ...(d.kind === 'hollow' ? { fill: C.surface, stroke: C.strong } : { fill: C.text, stroke: C.surface }),
              // Chaque point apparaît quand la courbe passe dessus
              ...popIn(traceDelay((x(d.time) - lineStart) / Math.max(1, lineEnd - lineStart), TRACE_MS)),
            }}
          />
        ))}
        {record && (
          <g aria-hidden="true" key={`pr-${from}-${to}`} style={popIn(TRACE_MS)}>
            <rect x={x(record.time) - 12} y={y(record.value) - 28} width={24} height={18} rx={9} style={{ fill: C.accent2 }} />
            <Label x={x(record.time)} y={y(record.value) - 15} anchor="middle" weight={800} color={C.onAccent2}>PR</Label>
          </g>
        )}
        {bubble}
      </svg>
    </div>
  )
}

/** Séances par semaine : une colonne par semaine, deload en gris, semaine en cours en pointillés. */
export function WeekColumns({ label, weeks, target, height = 120 }: { label: string; weeks: WeekCount[]; target?: number; height?: number }) {
  const [ref, width] = useWidth<HTMLDivElement>()
  const pw = width - AXIS
  const top = 8
  const bottom = height - 20
  const scale = niceScale([0, ...weeks.map((w) => w.count), ...(target !== undefined ? [target] : []), 2], 3, 1)
  const y = (v: number) => bottom - (v / (scale.max || 1)) * (bottom - top)
  const slot = pw / Math.max(1, weeks.length)
  const bw = Math.max(3, Math.min(14, slot - 4))
  const r = Math.min(4, bw / 2)
  const col = (x0: number, w: number, yTop: number) =>
    `M${x0} ${bottom} V${yTop + r} Q${x0} ${yTop} ${x0 + r} ${yTop} H${x0 + w - r} Q${x0 + w} ${yTop} ${x0 + w} ${yTop + r} V${bottom} Z`
  const from = weeks[0]?.start ?? 0
  const to = weeks.length > 0 ? weeks[weeks.length - 1].start + 7 * 86_400_000 : 1
  const x = (t: number) => ((t - from) / Math.max(1, to - from)) * pw

  return (
    <div ref={ref} className="w-full">
      <svg role="img" aria-label={label} width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="block">
        {scale.ticks.map((v) => (
          <g key={v}>
            <line x1={0} x2={pw} y1={y(v)} y2={y(v)} style={{ stroke: C.border }} strokeWidth={1} />
            <Label x={width} y={y(v) + 4} anchor="end">{formatNumber(v)}</Label>
          </g>
        ))}
        {timeLabels(from, to).map((l) => (
          <Label key={l.time} x={x(l.time)} y={height - 3}>{l.label}</Label>
        ))}
        {target !== undefined && <line x1={0} x2={pw} y1={y(target)} y2={y(target)} style={{ stroke: C.muted }} strokeWidth={1.5} strokeDasharray="4 4" />}
        {weeks.map((w, i) => {
          const x0 = i * slot + (slot - bw) / 2
          if (w.count === 0 && !w.current) return null
          if (w.current)
            return (
              <path key={w.start} d={col(x0 + 0.75, bw - 1.5, Math.min(y(w.count), bottom - 4) + 0.75)} fill="none" style={{ stroke: C.text }} strokeWidth={1.5} strokeDasharray="3 3" />
            )
          return (
            <path
              key={w.start}
              d={col(x0, bw, y(w.count))}
              // J10 : les colonnes poussent depuis le bas, de gauche à droite
              style={{ fill: w.deload ? C.strong : C.text, ...grow('bottom', staggerDelay(i, 25, 400)) }}
            />
          )
        })}
      </svg>
    </div>
  )
}

/** Barres horizontales étiquetées (séries par muscle) : nom à gauche, valeur au bout de la barre. */
export function HorizontalBars({ label, rows }: { label: string; rows: { name: string; value: number; text: string }[] }) {
  const [ref, width] = useWidth<HTMLDivElement>()
  const lw = 96
  const row = 30
  const max = Math.max(1, ...rows.map((r) => r.value))
  const len = (v: number) => (v / max) * (width - lw - 40)
  return (
    <div ref={ref} className="w-full">
      <svg role="img" aria-label={label} width={width} height={rows.length * row} viewBox={`0 0 ${width} ${rows.length * row}`} className="block">
        {rows.map((r, i) => {
          const cy = i * row + row / 2
          const end = lw + Math.max(4, len(r.value))
          return (
            <g key={r.name}>
              <text x={0} y={cy + 5} fontSize={15} fontWeight={600} style={{ fill: C.text }}>{r.name}</text>
              {/* J10 : la barre pousse depuis la gauche, puis son chiffre apparaît */}
              <path
                d={`M${lw} ${cy - 7} H${end - 4} Q${end} ${cy - 7} ${end} ${cy - 3} V${cy + 3} Q${end} ${cy + 7} ${end - 4} ${cy + 7} H${lw} Z`}
                style={{ fill: C.text, ...grow('left', staggerDelay(i, 50)) }}
              />
              <text
                x={end + 6}
                y={cy + 5}
                fontSize={15}
                fontWeight={700}
                style={{ fill: C.text, fontVariantNumeric: 'tabular-nums', animation: `sx-fondu 200ms var(--ease-out) ${staggerDelay(i, 50) + 300}ms both` }}
              >
                {r.text}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

/** Courbe miniature (liste des exercices) : juste la tendance, en gris. */
export function Sparkline({ values }: { values: number[] }) {
  const w = 56
  const h = 24
  if (values.length < 2) return <span aria-hidden="true" className="w-14 shrink-0" />
  const lo = Math.min(...values)
  const hi = Math.max(...values)
  const d = values
    .map((v, i) => `${i ? 'L' : 'M'}${((i / (values.length - 1)) * (w - 4) + 2).toFixed(1)} ${(h - 3 - ((v - lo) / (hi - lo || 1)) * (h - 6)).toFixed(1)}`)
    .join(' ')
  return (
    <svg width={w} height={h} aria-hidden="true" className="shrink-0">
      <TracedPath d={d} color={C.muted} />
    </svg>
  )
}

/** Légende : un petit repère et son libellé. */
export function Legend({ items }: { items: { mark: 'dot' | 'line' | 'square' | 'dashed'; label: string }[] }) {
  const mark = {
    dot: <span className="size-1.5 rounded-full bg-border-strong" />,
    line: <span className="h-0.5 w-4 rounded-full bg-text" />,
    square: <span className="size-3 rounded-[3px] bg-border-strong" />,
    dashed: <span className="box-border size-3 rounded-[3px] border-[1.5px] border-dashed border-text" />,
  }
  return (
    <div aria-hidden="true" className="flex gap-4 text-caption text-muted">
      {items.map((i) => (
        <span key={i.label} className="inline-flex items-center gap-1.5">
          {mark[i.mark]}
          {i.label}
        </span>
      ))}
    </div>
  )
}
