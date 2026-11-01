import { useEffect, useRef } from 'react'
import { usePrefersReducedMotion } from '../../hooks/hooks'

interface Flake {
  x: number
  y: number
  /** Radius in CSS px. */
  r: number
  /** Fall speed, px/s. */
  vy: number
  sway: number
  freq: number
  phase: number
  alpha: number
}

/** A soft, round flake, drawn once and stamped for every flake. */
function flakeSprite() {
  const size = 64
  const sprite = document.createElement('canvas')
  sprite.width = sprite.height = size
  const ctx = sprite.getContext('2d')!
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  g.addColorStop(0, 'rgba(255,255,255,1)')
  g.addColorStop(0.3, 'rgba(255,255,255,0.9)')
  g.addColorStop(0.6, 'rgba(255,253,248,0.35)')
  g.addColorStop(1, 'rgba(255,253,248,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, size, size)
  return sprite
}

/** Places a flake: at a random depth, anywhere in view or just above it. */
function place(f: Flake, w: number, h: number, fromTop: boolean) {
  const bokeh = Math.random() < 0.06
  // Depth 0 (far) … 1 (near): nearer flakes are larger, brighter and faster.
  const z = bokeh ? 1 : Math.random() ** 1.7
  f.r = bokeh ? 5 + Math.random() * 4 : 0.6 + z * 2.6
  f.vy = bokeh ? 34 + Math.random() * 16 : 9 + z * 34
  f.alpha = bokeh ? 0.22 + Math.random() * 0.12 : 0.35 + z * 0.55
  f.sway = 4 + Math.random() * 12
  f.freq = 0.35 + Math.random() * 0.8
  f.phase = Math.random() * Math.PI * 2
  f.x = Math.random() * w
  f.y = fromTop ? -f.r * 3 - Math.random() * h * 0.15 : Math.random() * h
  return f
}

/**
 * Gently falling snow, sized to its parent. Pauses off-screen (and with the
 * tab, via rAF); renders nothing for reduced motion. Fades in on mount.
 */
export function Snowfall({ className = '' }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const reducedMotion = usePrefersReducedMotion()

  useEffect(() => {
    const canvas = ref.current
    const ctx = canvas?.getContext('2d')
    if (reducedMotion || !canvas || !ctx) return

    const sprite = flakeSprite()
    const flakes: Flake[] = []
    let w = 0
    let h = 0

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      w = rect.width
      h = rect.height
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      // Density follows area, so a phone's arch and a desktop's feel the same.
      const count = Math.round(Math.min(120, Math.max(36, (w * h) / 2400)))
      while (flakes.length < count) flakes.push(place({} as Flake, w, h, false))
      flakes.length = count
    }
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)
    resize()

    let visible = true
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
    })
    io.observe(canvas)

    const start = performance.now()
    let last = start
    let raf = requestAnimationFrame(function frame(now) {
      raf = requestAnimationFrame(frame)
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      if (!visible) return

      const t = now / 1000
      const fadeIn = Math.min(1, (now - start) / 2000)
      // A slow breeze that turns now and then.
      const wind = Math.sin(t * 0.13) * 7 + Math.sin(t * 0.37 + 1.3) * 3
      ctx.clearRect(0, 0, w, h)
      for (const f of flakes) {
        f.y += f.vy * dt
        f.x += (Math.cos(t * f.freq + f.phase) * f.sway + wind * (f.vy / 30)) * dt
        if (f.y - f.r * 2 > h) place(f, w, h, true)
        if (f.x < -f.r * 2) f.x += w + f.r * 4
        else if (f.x > w + f.r * 2) f.x -= w + f.r * 4
        const d = f.r * 4
        ctx.globalAlpha = f.alpha * fadeIn
        ctx.drawImage(sprite, f.x - d / 2, f.y - d / 2, d, d)
      }
    })

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      io.disconnect()
    }
  }, [reducedMotion])

  return <canvas ref={ref} className={className} aria-hidden="true" />
}
