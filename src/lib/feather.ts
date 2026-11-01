/**
 * Paints soft white feathers onto a canvas, barb by barb. The same painter
 * makes the 3D field's textures and the feather resting on the envelope, so
 * every feather on screen shares one hand.
 */

/** Deterministic PRNG: the same seed always paints the same feather. */
export function seeded(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = Math.imul(a ^ (a >>> 15), a | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export type FeatherKind = 'contour' | 'down'

type Ctx = CanvasRenderingContext2D
type Rand = () => number

/** Warm white with a breath of grey, so white-on-ivory still has form. */
function tone(rand: Rand, alpha: number) {
  const v = 243 + Math.floor(rand() * 13)
  return `rgba(${v},${v - 3},${v - 9},${alpha.toFixed(3)})`
}

/** A contour feather: tapered quill, two vanes of fine barbs, fluffy base and a few natural splits. */
function paintContour(ctx: Ctx, W: number, H: number, rand: Rand) {
  const cx = W * 0.5
  const baseY = H * 0.985
  const tipY = H * 0.025
  const len = baseY - tipY
  const bend = W * 0.075 * (rand() > 0.5 ? 1 : -1)
  const halfW = W * 0.43
  const vaneStart = 0.15

  const shaft = (t: number) => ({ x: cx + bend * (t * t - 0.3 * t), y: baseY - len * t })
  const tangent = (t: number) => {
    const dx = bend * (2 * t - 0.3)
    const dy = -len
    const m = Math.hypot(dx, dy)
    return { x: dx / m, y: dy / m }
  }
  const width = (t: number) => {
    if (t < vaneStart) return 0
    const u = (t - vaneStart) / (1 - vaneStart)
    return halfW * Math.pow(Math.sin(Math.PI * Math.pow(u, 0.68)), 0.72) * (0.92 + 0.08 * (1 - u))
  }

  const splits = Array.from({ length: 4 }, () => ({ at: 0.3 + rand() * 0.6, w: 0.012 + rand() * 0.02, side: rand() > 0.5 ? 1 : -1 }))
  const splitAt = (t: number, side: number) =>
    splits.reduce((m, s) => (s.side === side ? Math.max(m, 1 - Math.abs(t - s.at) / s.w) : m), 0)

  // Afterfeather: loose, curling down around the base.
  for (let i = 0; i < 170; i++) {
    const t = rand() * 0.24
    const s = shaft(t)
    const side = rand() > 0.5 ? 1 : -1
    const reach = halfW * (0.45 + rand() * 0.75)
    const a = -Math.PI / 2 + side * (0.35 + rand() * 1.15)
    const ex = s.x + Math.cos(a) * reach
    const ey = s.y + Math.sin(a) * reach
    ctx.strokeStyle = tone(rand, 0.1 + rand() * 0.22)
    ctx.lineWidth = 0.6 + rand() * 0.7
    ctx.beginPath()
    ctx.moveTo(s.x, s.y)
    ctx.bezierCurveTo(
      s.x + (rand() - 0.5) * reach,
      s.y - rand() * reach * 0.6,
      ex + (rand() - 0.5) * reach * 0.8,
      ey + (rand() - 0.5) * reach * 0.5,
      ex,
      ey,
    )
    ctx.stroke()
  }

  // Vanes: hundreds of barbs leaving the shaft and sweeping toward the tip.
  for (const side of [-1, 1]) {
    for (let d = 0; d <= len; d += 1.05 + rand() * 0.5) {
      const t = d / len
      const w = width(t)
      if (w < 1) continue
      const s = shaft(t)
      const T = tangent(t)
      const N = { x: -T.y * side, y: T.x * side }
      const split = Math.max(0, splitAt(t, side))
      const fluffy = t < 0.34 ? (0.34 - t) / 0.34 : 0
      const sweep = 0.72 + rand() * 0.2 + split * 0.45
      const reach = w * (0.9 + rand() * 0.14) * (1 - split * 0.18)
      const wob = (fluffy * 0.55 + split * 0.12) * reach
      const ex = s.x + N.x * reach + T.x * reach * sweep + (rand() - 0.5) * wob * 2
      const ey = s.y + N.y * reach + T.y * reach * sweep + (rand() - 0.5) * wob * 2
      const qx = s.x + N.x * reach * 0.58 + T.x * reach * 0.12 + (rand() - 0.5) * wob
      const qy = s.y + N.y * reach * 0.58 + T.y * reach * 0.12 + (rand() - 0.5) * wob
      ctx.strokeStyle = tone(rand, (0.42 + rand() * 0.32) * (1 - fluffy * 0.4))
      ctx.lineWidth = 0.85 + rand() * 0.55
      ctx.beginPath()
      ctx.moveTo(s.x, s.y)
      ctx.quadraticCurveTo(qx, qy, ex, ey)
      ctx.stroke()
    }
  }

  // Shading: a little depth toward the shaft, painted only where barbs are.
  ctx.globalCompositeOperation = 'source-atop'
  const across = ctx.createLinearGradient(cx - halfW, 0, cx + halfW, 0)
  across.addColorStop(0, 'rgba(150,138,120,0)')
  across.addColorStop(0.4, 'rgba(150,138,120,0.16)')
  across.addColorStop(0.5, 'rgba(140,128,110,0.24)')
  across.addColorStop(0.6, 'rgba(150,138,120,0.16)')
  across.addColorStop(1, 'rgba(150,138,120,0)')
  ctx.fillStyle = across
  ctx.fillRect(0, 0, W, H)
  const along = ctx.createLinearGradient(0, tipY, 0, baseY)
  along.addColorStop(0, 'rgba(255,255,255,0.25)')
  along.addColorStop(0.7, 'rgba(255,255,255,0)')
  along.addColorStop(1, 'rgba(150,138,120,0.14)')
  ctx.fillStyle = along
  ctx.fillRect(0, 0, W, H)
  ctx.globalCompositeOperation = 'source-over'

  // Rachis: a tapering, slightly translucent quill with a highlight.
  const steps = 48
  for (let i = 0; i < steps; i++) {
    const t0 = i / steps
    const t1 = (i + 1) / steps
    const a = shaft(t0)
    const b = shaft(t1)
    const lw = W * 0.022 * (1 - t0) ** 1.4 + 0.6
    ctx.strokeStyle = `rgba(214,205,190,${(0.95 - t0 * 0.35).toFixed(3)})`
    ctx.lineWidth = lw
    ctx.beginPath()
    ctx.moveTo(a.x, a.y)
    ctx.lineTo(b.x, b.y)
    ctx.stroke()
    ctx.strokeStyle = 'rgba(255,255,255,0.85)'
    ctx.lineWidth = lw * 0.35
    ctx.beginPath()
    ctx.moveTo(a.x - lw * 0.18, a.y)
    ctx.lineTo(b.x - lw * 0.18, b.y)
    ctx.stroke()
  }
}

/** A down plume: no vane, just a fan of long wisps from a short quill. */
function paintDown(ctx: Ctx, W: number, H: number, rand: Rand) {
  const ox = W * 0.5
  const oy = H * 0.92
  for (let i = 0; i < 260; i++) {
    const t = rand() * 0.22
    const sx = ox
    const sy = oy - t * H
    const a = -Math.PI / 2 + (rand() - 0.5) * 2.3
    const reach = H * (0.28 + rand() * 0.48)
    const ex = sx + Math.cos(a) * reach * 0.62
    const ey = sy + Math.sin(a) * reach
    ctx.strokeStyle = tone(rand, 0.14 + rand() * 0.3)
    ctx.lineWidth = 0.8 + rand() * 0.7
    ctx.beginPath()
    ctx.moveTo(sx, sy)
    ctx.bezierCurveTo(
      sx + Math.cos(a) * reach * 0.3 + (rand() - 0.5) * W * 0.3,
      sy + Math.sin(a) * reach * 0.4,
      ex + (rand() - 0.5) * W * 0.25,
      ey + (rand() - 0.5) * H * 0.08,
      ex,
      ey,
    )
    ctx.stroke()
  }
  ctx.strokeStyle = 'rgba(220,212,198,0.9)'
  ctx.lineWidth = W * 0.02
  ctx.beginPath()
  ctx.moveTo(ox, H * 0.99)
  ctx.lineTo(ox, oy - H * 0.2)
  ctx.stroke()
}

/** Paints a feather (quill at the bottom) onto `canvas`, filling it edge to edge. */
export function paintFeather(canvas: HTMLCanvasElement, { seed = 1, kind = 'contour' as FeatherKind } = {}) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return canvas
  const { width: W, height: H } = canvas
  ctx.clearRect(0, 0, W, H)
  // Near-invisible white ground: keeps texture filtering from bleeding black
  // into the feather's soft edges.
  ctx.fillStyle = 'rgba(255,255,255,0.004)'
  ctx.fillRect(0, 0, W, H)
  ctx.lineCap = 'round'
  const rand = seeded(seed)
  if (kind === 'down') paintDown(ctx, W, H, rand)
  else paintContour(ctx, W, H, rand)
  return canvas
}
