import { motion, useTransform, type MotionValue } from 'motion/react'
import type { ReactNode } from 'react'

/**
 * The envelope, as flat layers stacked by z-index in a perspective stage:
 *
 *   back (foil-lined) · letter · front pocket · top flap · seal
 *
 * The flap is the only true 3D piece: paper hinged at the top, linen outside
 * and foil inside. Its z-index drops behind the letter as it passes edge-on,
 * so the stacking never needs depth sorting.
 */

const FOLDS = [
  // left and right side folds, then the bottom fold over them
  { clip: 'polygon(0 0, 53% 53%, 0 100%)', shade: 'linear-gradient(90deg, rgb(255 255 255 / 0.25), rgb(120 100 70 / 0.05))' },
  { clip: 'polygon(100% 0, 47% 53%, 100% 100%)', shade: 'linear-gradient(270deg, rgb(255 255 255 / 0.15), rgb(120 100 70 / 0.07))' },
  { clip: 'polygon(0 100%, 50% 43%, 100% 100%)', shade: 'linear-gradient(0deg, rgb(120 100 70 / 0.04), rgb(255 255 255 / 0.4))' },
]

/** The inside of the envelope: champagne foil liner, shadowed toward the fold. */
export function EnvelopeBack({ className = '' }: { className?: string }) {
  return (
    <div className={`foil overflow-hidden rounded-[3px] ${className}`}>
      <div className="sheen absolute inset-0" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgb(70_55_30/0.18),transparent_22%,transparent_70%,rgb(70_55_30/0.22))]" />
    </div>
  )
}

/** The front pocket: three folds of linen with crisp, softly shadowed edges. */
export function EnvelopePocket({ className = '', children }: { className?: string; children?: ReactNode }) {
  return (
    <div className={`pointer-events-none ${className}`}>
      {FOLDS.map((f) => (
        <div key={f.clip} className="absolute inset-0 [filter:drop-shadow(0_-1px_1.2px_rgb(90_70_40/0.16))]">
          <div className="linen absolute inset-0" style={{ clipPath: f.clip }}>
            <div className="absolute inset-0" style={{ background: f.shade }} />
          </div>
        </div>
      ))}
      {children}
    </div>
  )
}

/** The shadow at the pocket's mouth: depth inside the envelope, falling on the letter as it emerges. */
export function EnvelopeThroat({ className = '' }: { className?: string }) {
  // A thin band along the pocket's top edge (the side folds meet the bottom fold at ~47%/43%),
  // blurred so it reads as shade rather than a line.
  return (
    <div className={`pointer-events-none [filter:blur(3px)] ${className}`}>
      <div
        className="absolute inset-0 bg-[rgb(55_40_18/0.16)]"
        style={{ clipPath: 'polygon(0 0, 46.7% 46.7%, 50% 43%, 53.3% 46.7%, 100% 0, 100% -3.5%, 53.3% 43.2%, 50% 39.5%, 46.7% 43.2%, 0 -3.5%)' }}
      />
    </div>
  )
}

/* --- the flap ---------------------------------------------------------------
   Paper, not a board: two segments hinged at mid-depth, so it flexes as it
   swings (the tip lags, then follows through). Its fold, its shading and the
   shadow it casts are all derived from one angle, so they can't disagree. */

/** Where the flap flexes, as a fraction of its depth. */
const FLEX = 0.5
/** The flap's outline is a triangle with a softly rounded point (sides meet the point's shoulders at 92%). */
const SHOULDER = 0.92
const foldX = 100 - 44.5 * (FLEX / SHOULDER)
const shoulderY = ((SHOULDER - FLEX) / (1 - FLEX)) * 100
const OUTLINE = {
  base: `polygon(0 0, 100% 0, ${foldX}% 100%, ${100 - foldX}% 100%)`,
  tip: `polygon(${100 - foldX}% 0, ${foldX}% 0, 55.5% ${shoulderY}%, 50% 100%, 44.5% ${shoulderY}%)`,
}
/** The whole flap's outline, for its cast shadow. */
export const FLAP_OUTLINE = 'polygon(0 0, 100% 0, 55.5% 92%, 50% 100%, 44.5% 92%)'

type Part = keyof typeof OUTLINE

function FlapFaces({ part, frontShade, insideShade }: { part: Part; frontShade: MotionValue<number>; insideShade: MotionValue<number> }) {
  // Each segment shows its half of one continuous foil gradient, so no seam at the fold.
  const foil = { backgroundSize: '44px 44px, 100% 200%', backgroundPosition: part === 'base' ? '0 0, 0 0' : '0 0, 0 100%' }
  return (
    <>
      <div className="backface-hidden absolute inset-0">
        <div className="linen absolute inset-0" style={{ clipPath: OUTLINE[part] }}>
          <div
            className="absolute inset-0"
            style={{
              background:
                part === 'base'
                  ? 'linear-gradient(180deg, rgb(255 255 255 / 0.45), rgb(255 255 255 / 0.12))'
                  : 'linear-gradient(180deg, rgb(255 255 255 / 0.12), transparent 30%, rgb(120 100 70 / 0.06))',
            }}
          />
          {/* turning away from the light */}
          <motion.div className="absolute inset-0 bg-[rgb(60_45_25)]" style={{ opacity: frontShade }} />
        </div>
      </div>
      {/* Inside face: mirrored so it lines up exactly when the flap turns over. */}
      <div className="backface-hidden absolute inset-0 [transform:rotateY(180deg)]">
        <div className="foil absolute inset-0" style={{ clipPath: OUTLINE[part], ...foil }}>
          <div className="sheen absolute inset-0" />
          {part === 'base' && <div className="absolute inset-0 bg-[linear-gradient(180deg,rgb(70_55_30/0.24),transparent_70%)]" />}
          {/* grazing light while it's still edge-on, full light once it lies open */}
          <motion.div className="absolute inset-0 bg-[rgb(40_30_15)]" style={{ opacity: insideShade }} />
        </div>
      </div>
    </>
  )
}

/**
 * The top flap, hinged at its top edge and driven by `angle` (0 closed, 180 open).
 * It carries its own perspective, centred on the envelope, so its outer element
 * can be moved and faded like any other envelope part.
 */
export function EnvelopeFlap({ angle, className = '' }: { angle: MotionValue<number>; className?: string }) {
  // Lag behind the swing, peaking mid-way; past flat (the settle) it follows through the other way.
  const flex = useTransform(angle, (a) => -24 * Math.sin((Math.PI * Math.max(0, a)) / 180))
  const frontShade = useTransform(angle, [0, 90], [0, 0.24])
  const insideShade = useTransform(angle, [90, 180], [0.5, 0])
  return (
    <div className={`[perspective:1100px] [perspective-origin:50%_88%] ${className}`}>
      <motion.div className="absolute inset-0 origin-top [transform-style:preserve-3d]" style={{ rotateX: angle }}>
        <div className="absolute inset-x-0 top-0 h-1/2 [transform-style:preserve-3d]">
          <FlapFaces part="base" frontShade={frontShade} insideShade={insideShade} />
        </div>
        {/* Overlaps the base by a pixel, so no hairline can open at the fold. */}
        <motion.div className="absolute inset-x-0 top-[calc(50%-1px)] h-[calc(50%+1px)] origin-top [transform-style:preserve-3d]" style={{ rotateX: flex }}>
          <FlapFaces part="tip" frontShade={frontShade} insideShade={insideShade} />
        </motion.div>
      </motion.div>
    </div>
  )
}
