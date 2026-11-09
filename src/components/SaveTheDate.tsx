import { motion } from 'motion/react'
import { useEffect, useRef, useState, type PointerEvent } from 'react'
import { wedding } from '../config/wedding'
import { usePrefersReducedMotion } from '../hooks/hooks'
import { downloadIcs, googleCalendarUrl } from '../lib/calendar'
import { HeartBurst } from './ui/HeartBurst'
import { SectionHeading } from './ui/Heading'
import { Reveal } from './ui/motion'
import { silk } from './ui/variants'

const REVEAL_AT = 0.5 // fraction scratched before the foil lifts away entirely

/**
 * Scratch-off gold foil hiding the date. The foil is a canvas; scratching
 * erases it with destination-out strokes. Coverage is sampled on a coarse grid
 * so the check stays cheap; past the threshold the rest melts away.
 */
function ScratchCard({ onReveal }: { onReveal: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawing = useRef(false)
  const last = useRef<{ x: number; y: number } | null>(null)
  const [cleared, setCleared] = useState(false)
  const reducedMotion = usePrefersReducedMotion()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    // Paint the foil at the card's real size; repaint if it resizes (rotation, window resize).
    const paint = () => {
    const dpr = Math.min(window.devicePixelRatio, 2)
    const { width, height } = canvas.getBoundingClientRect()
    if (!width || !height) return
    canvas.width = width * dpr
    canvas.height = height * dpr
    const ctx = canvas.getContext('2d')!
    ctx.scale(dpr, dpr)
    // Champagne foil: a soft metallic sweep, brushed grain, the envelope liner's
    // lattice pressed in, and the couple's monogram embossed at its heart.
    const g = ctx.createLinearGradient(0, 0, width, height)
    g.addColorStop(0, '#bf9f5a')
    g.addColorStop(0.3, '#ecd8a4')
    g.addColorStop(0.5, '#cfae66')
    g.addColorStop(0.72, '#f3e4bd')
    g.addColorStop(1, '#b08f4c')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, width, height)
    for (let i = 0; i < 1100; i++) {
      ctx.fillStyle = `rgba(255,250,235,${(Math.random() * 0.1).toFixed(3)})`
      ctx.fillRect(Math.random() * width, Math.random() * height, Math.random() * 46 + 6, 0.8)
    }
    ctx.strokeStyle = 'rgba(255,248,228,0.28)'
    ctx.lineWidth = 0.7
    for (let d = -height; d < width + height; d += 30) {
      ctx.beginPath()
      ctx.moveTo(d, 0)
      ctx.lineTo(d + height, height)
      ctx.moveTo(d + height, 0)
      ctx.lineTo(d, height)
      ctx.stroke()
    }
    const cx = width / 2
    const cy = height / 2
    const emboss = (text: string, font: string, y: number, alpha = 1) => {
      ctx.font = font
      ctx.textAlign = 'center'
      ctx.fillStyle = `rgba(95,70,25,${0.55 * alpha})`
      ctx.fillText(text, cx + 1, y + 1.2)
      ctx.fillStyle = `rgba(255,248,226,${0.75 * alpha})`
      ctx.fillText(text, cx - 0.8, y - 0.8)
      ctx.fillStyle = `rgba(176,140,66,${alpha})`
      ctx.fillText(text, cx, y)
    }
    ctx.strokeStyle = 'rgba(255,248,226,0.55)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.arc(cx, cy - 18, 34, 0, Math.PI * 2)
    ctx.stroke()
    emboss(`${wedding.groom.short[0]}${wedding.bride.short[0]}`, `44px "Pinyon Script", Allura, cursive`, cy - 4)
    emboss('S C R A T C H   T O   R E V E A L', '500 11px "Cormorant Garamond", serif', cy + 42, 0.95)
    emboss('our wedding day', 'italic 20px "Cormorant Garamond", serif', cy + 66, 0.95)
    }
    const ro = new ResizeObserver(paint)
    ro.observe(canvas)
    // The monogram and lettering use web fonts: repaint once they've arrived.
    void document.fonts.ready.then(paint)
    return () => ro.disconnect()
  }, [])

  const scratch = (x: number, y: number) => {
    const canvas = canvasRef.current
    if (!canvas || cleared) return
    const ctx = canvas.getContext('2d')!
    ctx.globalCompositeOperation = 'destination-out'
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.lineWidth = 44
    ctx.beginPath()
    const from = last.current ?? { x, y }
    ctx.moveTo(from.x, from.y)
    ctx.lineTo(x, y)
    ctx.stroke()
    last.current = { x, y }
  }

  const coverage = () => {
    const canvas = canvasRef.current
    if (!canvas) return 0
    const { width, height } = canvas
    const data = canvas.getContext('2d')!.getImageData(0, 0, width, height).data
    let clear = 0
    let total = 0
    for (let y = 0; y < height; y += 12) {
      for (let x = 0; x < width; x += 12) {
        total++
        if (data[(y * width + x) * 4 + 3] < 40) clear++
      }
    }
    return clear / total
  }

  const point = (e: PointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    return { x: e.clientX - r.left, y: e.clientY - r.top }
  }

  const finish = () => {
    drawing.current = false
    last.current = null
    if (!cleared && coverage() > REVEAL_AT) {
      setCleared(true)
      onReveal()
    }
  }

  return (
    <div className="absolute inset-0">
      <motion.canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full cursor-grab touch-none rounded-[4px] shadow-[var(--shadow-float)] active:cursor-grabbing"
        animate={cleared ? { opacity: 0, scale: 1.04, filter: 'blur(6px)' } : { opacity: 1 }}
        transition={{ duration: reducedMotion ? 0 : 0.9, ease: silk }}
        style={{ pointerEvents: cleared ? 'none' : 'auto' }}
        onPointerDown={(e) => {
          drawing.current = true
          e.currentTarget.setPointerCapture(e.pointerId)
          const p = point(e)
          scratch(p.x, p.y)
        }}
        onPointerMove={(e) => {
          if (!drawing.current) return
          const p = point(e)
          scratch(p.x, p.y)
        }}
        onPointerUp={finish}
        onPointerCancel={finish}
        aria-label="Scratch to reveal the wedding date"
        role="img"
      />
      {!cleared && (
        <button
          type="button"
          className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:right-3 focus:z-10 focus:rounded-full focus:bg-paper focus:px-4 focus:py-2"
          onClick={() => {
            setCleared(true)
            onReveal()
          }}
        >
          Reveal the date
        </button>
      )}
    </div>
  )
}

/** November 2026 with a heart drawn around the 28th once the date is revealed. */
function Calendar({ drawn }: { drawn: boolean }) {
  // 1 November 2026 is a Sunday.
  const days = Array.from({ length: 30 }, (_, i) => i + 1)
  return (
    <div className="mx-auto w-full max-w-sm">
      <p className="text-center font-serif text-3xl font-light text-ink">
        November <span className="text-muted">2026</span>
      </p>
      <div className="mt-6 grid grid-cols-7 gap-y-3 text-center">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <span key={i} className="eyebrow !text-[0.6rem] !tracking-[0.2em]">
            {d}
          </span>
        ))}
        {days.map((d) => (
          <span key={d} className={`relative py-1.5 font-serif text-xl ${d === 28 ? 'font-medium text-champagne' : 'text-ink/70'}`}>
            {d}
            {d === 28 && (
              <svg viewBox="0 0 60 56" className="absolute top-1/2 left-1/2 size-14 -translate-1/2 overflow-visible text-champagne" aria-hidden="true">
                <motion.path
                  d="M30 50C14 38 4 28 6 17 8 7 20 3 30 13 40 3 52 7 54 17 56 28 46 38 30 50Z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={drawn ? { pathLength: 1, opacity: 1 } : {}}
                  transition={{ duration: 1.6, ease: 'easeInOut', delay: 0.4 }}
                />
              </svg>
            )}
          </span>
        ))}
      </div>
    </div>
  )
}

export function SaveTheDate() {
  const [revealed, setRevealed] = useState(false)
  const { event } = wedding

  return (
    <section id="date" aria-labelledby="date-title" className="section-wash-paper relative scroll-mt-16 px-5 py-28 sm:px-8 md:py-36">
      <div className="mx-auto max-w-6xl">
        <SectionHeading id="date-title" index="02" eyebrow="Save the date" title="Mark your" accent="calendar" titleMy="ရက်စွဲ မှတ်သားထားပါ" />
        <div className="grid items-center gap-10 md:grid-cols-2 md:gap-16">
          <Reveal>
            <div className="relative mx-auto aspect-[4/3] w-full max-w-md">
              {/* the prize under the foil */}
              <div className="paper-stock absolute inset-0 grid place-items-center rounded-[4px] text-center shadow-[var(--shadow-float)]">
                <span aria-hidden="true" className="gold-leaf pointer-events-none absolute inset-2.5" />
                <span aria-hidden="true" className="gold-leaf pointer-events-none absolute inset-[15px] opacity-50" />
                <div>
                  <p className="eyebrow">{event.dateLabel.split(',')[0]}</p>
                  <p className="mt-2 font-serif text-[6.5rem] leading-none font-light text-champagne">28</p>
                  <p className="font-serif text-2xl tracking-[0.3em] text-ink uppercase">November 2026</p>
                  <p className="mt-2 text-sm text-muted">{event.timeLabel}</p>
                </div>
              </div>
              <ScratchCard onReveal={() => setRevealed(true)} />
              {revealed && <HeartBurst />}
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            {/* On phones the scratch card alone carries the date; the month grid is for wider screens. */}
            <div className="hidden md:block">
              <Calendar drawn={revealed} />
            </div>
            <motion.div
              className="flex flex-wrap justify-center gap-3 md:mt-10"
              initial={false}
              animate={{ opacity: revealed ? 1 : 0.35 }}
              transition={{ duration: 0.8 }}
            >
              <a className="btn btn-primary" href={googleCalendarUrl()} target="_blank" rel="noopener noreferrer">
                Google Calendar
              </a>
              <button type="button" className="btn btn-ghost" onClick={downloadIcs}>
                Apple / Outlook
              </button>
            </motion.div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
