import { useEffect, useRef } from 'react'
import { paintFeather, type FeatherKind } from '../../lib/feather'

/** Champagne foil, pale at the tip and deepening toward the quill. */
export const GOLD_FOIL = ['#f1e2b4', '#d9bd72', '#c09a42', '#a7832e']

interface FeatherCanvasProps {
  seed?: number
  kind?: FeatherKind
  /** Gradient stops (tip → quill) to gild the feather with; it stays white when omitted. */
  tint?: readonly string[]
  /** Backing-store width in px; height follows the feather's 2:5 proportion. Size it for the largest display. */
  resolution?: number
  className?: string
}

/** A single painted feather (quill at the bottom), sized by CSS. */
export function FeatherCanvas({ seed = 1, kind = 'contour', tint, resolution = 320, className = '' }: FeatherCanvasProps) {
  const ref = useRef<HTMLCanvasElement>(null)
  const tintKey = tint?.join()

  useEffect(() => {
    const canvas = ref.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    paintFeather(canvas, { seed, kind })
    // Lying on paper rather than floating in light, it needs more body: layer it once more.
    ctx.drawImage(canvas, 0, 0)
    if (tint?.length) {
      // Recolour every barb while keeping its painted alpha: the texture becomes foil.
      const foil = ctx.createLinearGradient(0, 0, 0, canvas.height)
      tint.forEach((c, i) => foil.addColorStop(i / Math.max(1, tint.length - 1), c))
      ctx.globalCompositeOperation = 'source-atop'
      ctx.fillStyle = foil
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.globalCompositeOperation = 'source-over'
    }
    // tintKey stands in for the tint array, so a new array with the same stops doesn't repaint.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seed, kind, tintKey, resolution])

  return <canvas ref={ref} width={resolution} height={Math.round(resolution * 2.5)} className={className} aria-hidden="true" />
}
