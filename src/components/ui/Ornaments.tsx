import type { SVGProps } from 'react'

type SvgProps = SVGProps<SVGSVGElement>

/** Point and unit tangent on a cubic Bézier. */
function bezier(p: number[][], t: number) {
  const u = 1 - t
  const pt = [0, 1].map((k) => u * u * u * p[0][k] + 3 * u * u * t * p[1][k] + 3 * u * t * t * p[2][k] + t * t * t * p[3][k])
  const d = [0, 1].map((k) => 3 * u * u * (p[1][k] - p[0][k]) + 6 * u * t * (p[2][k] - p[1][k]) + 3 * t * t * (p[3][k] - p[2][k]))
  return { x: pt[0], y: pt[1], angle: (Math.atan2(d[1], d[0]) * 180) / Math.PI }
}

const STEM = [
  [10, 86],
  [12, 40],
  [40, 12],
  [86, 10],
]
const LEAVES = [0.14, 0.26, 0.38, 0.5, 0.62, 0.74, 0.86].map((t, i) => {
  const { x, y, angle } = bezier(STEM, t)
  const side = i % 2 ? 1 : -1
  const size = 1 - Math.abs(t - 0.5) * 0.9
  return { x, y, rotate: angle + side * 48, size }
})
const LEAF = 'M0 0C3.2-3.4 8.6-3.6 12 0 8.6 3.6 3.2 3.4 0 0Z'

/**
 * A corner sprig in gold line: a fine bracket, a leafy stem and a single
 * curling feather. Drawn for the top-left corner; mirror it for the others.
 */
export function CornerAccent(props: SvgProps) {
  return (
    <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeLinecap="round" aria-hidden="true" {...props}>
      <path d="M4 96V16Q4 4 16 4H96" strokeWidth="0.8" opacity="0.55" />
      <path d={`M${STEM[0]}C${STEM.slice(1).join(' ')}`} strokeWidth="0.9" />
      {LEAVES.map((l, i) => (
        <path
          key={i}
          d={LEAF}
          transform={`translate(${l.x.toFixed(2)} ${l.y.toFixed(2)}) rotate(${l.rotate.toFixed(1)}) scale(${(0.7 + l.size * 0.55).toFixed(2)})`}
          fill="currentColor"
          fillOpacity="0.18"
          strokeWidth="0.7"
        />
      ))}
      {/* the feather, lying along the diagonal */}
      <g transform="translate(26 26) rotate(-45)" strokeWidth="0.6">
        <path d="M0 22C-.3 8 .2-8 1.5-24" strokeWidth="0.8" />
        <path d="M.2 14C-5 9-6.5-4-3-14 -1.5-19 .3-22 1.5-24 4-18 6.5-6 5 4 4 10 2 13 .2 14Z" fill="currentColor" fillOpacity="0.1" />
        {[10, 5, 0, -5, -10, -15].map((y) => (
          <path key={y} d={`M${(0.25 - y * 0.05).toFixed(2)} ${y}l-4 -4.4M${(0.25 - y * 0.05).toFixed(2)} ${y}l4.2 -4.6`} opacity="0.7" />
        ))}
      </g>
      <circle cx="58" cy="20" r="1.3" fill="currentColor" stroke="none" opacity="0.6" />
      <circle cx="20" cy="58" r="1.3" fill="currentColor" stroke="none" opacity="0.6" />
    </svg>
  )
}

/** A long, quill-down feather in fine gold line. Used for dividers and watermarks. */
export function FeatherMark(props: SvgProps) {
  const barbs = Array.from({ length: 15 }, (_, i) => {
    const y = 122 - i * 7.6
    const x = 20 + (122 - y) * 0.028
    const w = Math.sin(((i + 1) / 16) * Math.PI) * 13 + 2
    return `M${x.toFixed(1)} ${y.toFixed(1)}q${(-w * 0.6).toFixed(1)} -3 ${(-w).toFixed(1)} -9M${x.toFixed(1)} ${y.toFixed(1)}q${(w * 0.6).toFixed(1)} -3 ${w.toFixed(1)} -9.5`
  })
  return (
    <svg viewBox="0 0 40 160" fill="none" stroke="currentColor" strokeLinecap="round" aria-hidden="true" {...props}>
      <path d="M20 132C7 118 3 82 10 50 13 34 18 18 24 4 30 20 36 52 34 84 33 104 28 120 20.6 132" fill="currentColor" fillOpacity="0.08" strokeWidth="0.8" />
      <path d="M20 158C20 124 21 70 24 4" strokeWidth="1" />
      <path d={barbs.join('')} strokeWidth="0.5" opacity="0.75" />
      <path d="M20 140c-4-1-7-5-8-9M20 144c4-1 7-4 8-8M20 136c-3 0-6-3-7-6" strokeWidth="0.5" opacity="0.6" />
    </svg>
  )
}

/** A centred divider: hairlines either side of a small, lying feather. */
export function FeatherDivider({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center gap-3 text-champagne-soft ${className}`} aria-hidden="true">
      <span className="h-px w-12 bg-gradient-to-r from-transparent to-gold/70 sm:w-16" />
      <span className="grid h-3 w-10 place-items-center">
        <FeatherMark className="h-10 w-2.5 shrink-0 rotate-90" />
      </span>
      <span className="h-px w-12 bg-gradient-to-l from-transparent to-gold/70 sm:w-16" />
    </div>
  )
}
