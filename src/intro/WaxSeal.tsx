import { useId } from 'react'
import { wedding } from '../config/wedding'

/** A closed Catmull-Rom curve through `pts`, as cubic Béziers. */
function smoothPath(pts: [number, number][]) {
  const n = pts.length
  let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`
  for (let i = 0; i < n; i++) {
    const [p0, p1, p2, p3] = [pts[(i - 1 + n) % n], pts[i], pts[(i + 1) % n], pts[(i + 2) % n]]
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6]
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6]
    d += `C${c1.map((v) => v.toFixed(1)).join(' ')} ${c2.map((v) => v.toFixed(1)).join(' ')} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`
  }
  return `${d}Z`
}

/** The irregular rim of poured wax. */
const RIM = smoothPath(
  Array.from({ length: 44 }, (_, i) => {
    const a = (i / 44) * Math.PI * 2
    const r = 90 + 3.4 * Math.sin(5 * a + 0.6) + 2.2 * Math.sin(9 * a + 2.1) + 1.3 * Math.sin(14 * a + 4)
    return [100 + Math.cos(a) * r, 100 + Math.sin(a) * r] as [number, number]
  }),
)

const BEADS = Array.from({ length: 40 }, (_, i) => {
  const a = (i / 40) * Math.PI * 2
  return [100 + Math.cos(a) * 73, 100 + Math.sin(a) * 73]
})

/** The crack the seal breaks along. */
const CRACK = 'L96 36 107 70 93 106 105 142 97 172 101 200'
const HALVES = {
  left: `M0 0H103${CRACK}H0Z`,
  right: `M103 0H200V200H101L97 172 105 142 93 106 107 70 96 36Z`,
}

interface WaxSealProps {
  /** Render one half of the broken seal; both halves overlaid make the whole. */
  half?: keyof typeof HALVES
  className?: string
}

/**
 * The champagne-gold wax seal: poured rim with lit relief, a pressed basin,
 * a beaded border and the couple's raised monogram.
 */
export function WaxSeal({ half, className }: WaxSealProps) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '')
  const [a, b] = [wedding.groom.short[0], wedding.bride.short[0]]
  const monogram = (fill: string, dx: number, dy: number, opacity = 1) => (
    <text
      x={100 + dx}
      y={121 + dy}
      textAnchor="middle"
      fontFamily="Allura, 'Snell Roundhand', cursive"
      fontSize="70"
      fill={fill}
      opacity={opacity}
    >
      {a}
      <tspan fontSize="46" dy="-4">
        &amp;
      </tspan>
      <tspan dy="4">{b}</tspan>
    </text>
  )

  return (
    <svg viewBox="0 0 200 200" className={`overflow-visible ${className ?? ''}`} aria-hidden="true">
      <defs>
        <radialGradient id={`${id}w`} cx="36%" cy="30%" r="78%">
          <stop offset="0" stopColor="#f7e7b0" />
          <stop offset="0.22" stopColor="#e6c86e" />
          <stop offset="0.5" stopColor="#d4af37" />
          <stop offset="0.8" stopColor="#b08a28" />
          <stop offset="1" stopColor="#8a6a1c" />
        </radialGradient>
        <radialGradient id={`${id}p`} cx="50%" cy="50%" r="50%">
          <stop offset="0.7" stopColor="#c9a43c" />
          <stop offset="0.93" stopColor="#a8852a" />
          <stop offset="1" stopColor="#f2dc98" />
        </radialGradient>
        <filter id={`${id}r`} x="-10%" y="-10%" width="120%" height="120%" colorInterpolationFilters="sRGB">
          <feGaussianBlur in="SourceAlpha" stdDeviation="4" result="blur" />
          <feSpecularLighting in="blur" surfaceScale="6" specularConstant="0.9" specularExponent="16" lightingColor="#fff4d2" result="spec">
            <fePointLight x="30" y="10" z="240" />
          </feSpecularLighting>
          <feComposite in="spec" in2="SourceAlpha" operator="in" result="lit" />
          <feComposite in="SourceGraphic" in2="lit" operator="arithmetic" k1="0" k2="1" k3="0.7" k4="0" />
        </filter>
        {half && (
          <clipPath id={`${id}c`}>
            <path d={HALVES[half]} />
          </clipPath>
        )}
      </defs>

      <g clipPath={half ? `url(#${id}c)` : undefined}>
        <g filter={`url(#${id}r)`}>
          <path d={RIM} fill={`url(#${id}w)`} />
        </g>
        {/* pressed basin, rimmed by the stamp's edge */}
        <circle cx="100" cy="100" r="66" fill={`url(#${id}p)`} />
        <circle cx="100" cy="100" r="66" fill="none" stroke="#7d5f17" strokeOpacity="0.45" strokeWidth="2" />
        <circle cx="101" cy="101.5" r="64" fill="none" stroke="#fff1c4" strokeOpacity="0.55" strokeWidth="1.2" />
        {BEADS.map(([x, y], i) => (
          <g key={i}>
            <circle cx={x + 0.7} cy={y + 0.8} r="1.9" fill="#6f5214" opacity="0.4" />
            <circle cx={x} cy={y} r="1.8" fill="#ecd391" />
          </g>
        ))}
        {/* raised monogram: shadow, highlight, face */}
        {monogram('#5f4510', 1.6, 1.9, 0.55)}
        {monogram('#fff3c9', -1.1, -1.2, 0.8)}
        {monogram('#c39d3a', 0, 0)}
      </g>
    </svg>
  )
}
