import { useId } from 'react'
import { wedding } from '../../config/wedding'

/** Leaves along an arc of the ring, from `a0` to `a1` degrees (0° = right, clockwise). */
function sprig(a0: number, a1: number, r: number) {
  return Array.from({ length: 6 }, (_, i) => {
    const a = a0 + ((a1 - a0) * (i + 0.5)) / 6
    const rad = (a * Math.PI) / 180
    const out = i % 2 ? 1 : -1
    return {
      x: 60 + Math.cos(rad) * r,
      y: 60 + Math.sin(rad) * r,
      rotate: a + 90 + (a1 > a0 ? 1 : -1) * 35 + out * 22,
    }
  })
}
const LEAVES = [...sprig(150, 210, 47), ...sprig(30, -30, 47)]
const LEAF = 'M0 0C1.6-1.8 4.4-1.9 6 0 4.4 1.9 1.6 1.8 0 0Z'

/** The crest's artwork, in a single paint: drawn once in foil, once as the shine's mask. */
function Crest({ paint }: { paint: string }) {
  return (
    <>
      <circle cx="60" cy="60" r="57" fill="none" stroke={paint} strokeWidth="0.9" />
      <circle cx="60" cy="60" r="53.5" fill="none" stroke={paint} strokeWidth="0.45" opacity="0.7" />
      {[0, 90, 180, 270].map((a) => (
        <rect key={a} x="58.6" y="1.6" width="2.8" height="2.8" fill={paint} transform={`rotate(${a} 60 60) rotate(45 60 3)`} />
      ))}
      {LEAVES.map((l, i) => (
        <path key={i} d={LEAF} fill={paint} opacity="0.85" transform={`translate(${l.x.toFixed(2)} ${l.y.toFixed(2)}) rotate(${l.rotate.toFixed(1)})`} />
      ))}
      <text x="49" y="76" textAnchor="middle" fontFamily="'Pinyon Script', Allura, cursive" fontSize="50" fill={paint}>
        {wedding.bride.short[0]}
      </text>
      <text x="72" y="80" textAnchor="middle" fontFamily="'Pinyon Script', Allura, cursive" fontSize="50" fill={paint}>
        {wedding.groom.short[0]}
      </text>
    </>
  )
}

/**
 * The couple's crest: interlaced initials struck in gold foil, inside a fine
 * double ring with laurel sprigs. Inside a `[data-live]` card, a band of light
 * drifts across now and then (`.monogram-shine`); at rest it sits off the
 * crest, so the still and live crests are identical until the sweep begins.
 */
export function Monogram({ className = '' }: { className?: string }) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '')
  return (
    <svg viewBox="0 0 120 120" className={className} role="img" aria-label={`${wedding.bride.short} and ${wedding.groom.short}`}>
      <defs>
        <linearGradient id={`${id}g`} gradientUnits="userSpaceOnUse" x1="0" y1="20" x2="120" y2="100">
          <stop offset="0" stopColor="#9c7a25" />
          <stop offset="0.38" stopColor="#c9a54a" />
          <stop offset="0.5" stopColor="#f0dca4" />
          <stop offset="0.62" stopColor="#c9a54a" />
          <stop offset="1" stopColor="#8b6b20" />
        </linearGradient>
        <linearGradient id={`${id}s`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fffaea" stopOpacity="0" />
          <stop offset="0.5" stopColor="#fffaea" stopOpacity="0.95" />
          <stop offset="1" stopColor="#fffaea" stopOpacity="0" />
        </linearGradient>
        <mask id={`${id}m`} maskUnits="userSpaceOnUse" x="0" y="0" width="120" height="120">
          <Crest paint="#fff" />
        </mask>
      </defs>
      <Crest paint={`url(#${id}g)`} />
      <g mask={`url(#${id}m)`}>
        <g transform="rotate(20 60 60)">
          <rect className="monogram-shine" x="-70" y="-40" width="44" height="200" fill={`url(#${id}s)`} />
        </g>
      </g>
    </svg>
  )
}
