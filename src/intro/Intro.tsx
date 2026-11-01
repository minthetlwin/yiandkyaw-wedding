import { motion, useAnimate, useMotionValue, useSpring, useTransform } from 'motion/react'
import { useEffect, useState, type RefObject } from 'react'
import { CardFrame } from '../components/card/CardFrame'
import { HeroCardContent } from '../components/Hero'
import { FeatherCanvas } from '../components/ui/FeatherCanvas'
import { silk } from '../components/ui/variants'
import { wedding } from '../config/wedding'
import { guestName, isMyanmar } from '../lib/guest'
import { EnvelopeBack, EnvelopeFlap, EnvelopePocket, EnvelopeThroat, FLAP_OUTLINE } from './Envelope'
import { WaxSeal } from './WaxSeal'

const sleep = (ms: number) => new Promise((r) => window.setTimeout(r, ms))

/** Where the flap's point (and the seal) sits, as a fraction of the envelope's height. */
const FLAP_DEPTH = '57%'

/** What's printed on the letter as it leaves the envelope. */
function EnvelopeLettering() {
  const { bride, groom } = wedding
  return (
    <div className="absolute inset-0 grid place-items-center text-center">
      <div>
        <p className="eyebrow !text-[0.55rem]">The wedding of</p>
        <p className="letterpress mt-1 font-display text-[2.5rem] leading-[1.3] text-ink sm:text-5xl">
          {bride.short} <span className="gold-text px-[0.1em] font-serif text-[0.68em] italic">&amp;</span> {groom.short}
        </p>
        <p className="mt-1 font-serif text-sm tracking-[0.3em] text-muted">28 · 11 · 2026</p>
      </div>
    </div>
  )
}

interface IntroProps {
  /** The hero card on the page beneath: the letter lands exactly on it. */
  target: RefObject<HTMLElement | null>
  /** The seal broke at this viewport point (CSS px). */
  onBurst: (x: number, y: number) => void
  /** The camera begins its push into the card. */
  onZoom: () => void
  /** The guest's first tap: the one moment the browser lets us start music. */
  onStart: () => void
  onDone: () => void
}

/**
 * The envelope intro.
 *
 *   1  A linen envelope floats among falling feathers, a white feather pinned
 *      across its flap by a champagne-gold wax seal.
 *   2  On tap the seal snaps in two, spraying stardust and down; the feather
 *      is released and drifts away.
 *   3  The flap lifts in 3D, revealing the foil liner; the letter slides out
 *      and the envelope drops away beneath it.
 *   4  The camera pushes in: the letter grows to fill the screen and becomes
 *      the homepage hero, which is the same card.
 */
export function Intro({ target, onBurst, onZoom, onStart, onDone }: IntroProps) {
  const [scope, animate] = useAnimate<HTMLDivElement>()
  const [sealed, setSealed] = useState(true)
  const tiltX = useSpring(0, { stiffness: 60, damping: 16 })
  const tiltY = useSpring(0, { stiffness: 60, damping: 16 })
  // The flap's angle drives its swing, flex and shading, and the shadow it casts.
  const flapAngle = useMotionValue(0)
  // The flap's shadow: closed, a soft edge just below it; lifting toward the viewer, it stretches
  // down the envelope and softens; once the flap passes upright, it's gone.
  const castOpacity = useTransform(flapAngle, [0, 30, 75, 95], [0.22, 0.34, 0.2, 0])
  const castY = useTransform(flapAngle, [0, 90], ['1.2%', '16%'])
  const castScale = useTransform(flapAngle, [0, 90], [1, 0.82])
  const castBlur = useTransform(flapAngle, [0, 60], ['blur(2.5px)', 'blur(10px)'])

  // The envelope leans gently toward the mouse.
  useEffect(() => {
    if (!sealed) return
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return
      tiltY.set((e.clientX / window.innerWidth - 0.5) * 10)
      tiltX.set(-(e.clientY / window.innerHeight - 0.5) * 8)
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => window.removeEventListener('pointermove', onMove)
  }, [sealed, tiltX, tiltY])

  async function open() {
    if (!sealed) return
    onStart() // before any await: still inside the tap, so audio is allowed
    setSealed(false)
    tiltX.set(0)
    tiltY.set(0)
    const root = scope.current
    const q = (selector: string) => root.querySelector<HTMLElement>(selector)!

    // 1 — the seal snaps open
    const seal = q('.seal').getBoundingClientRect()
    onBurst(seal.left + seal.width / 2, seal.top + seal.height / 2)
    await animate('.seal', { scale: 0.9 }, { duration: 0.1, ease: 'easeOut' })
    animate('.seal', { scale: 1 }, { duration: 0.25 })
    animate('.seal-l', { x: '-34%', y: '34%', rotate: -26, opacity: 0 }, { duration: 0.85, ease: [0.2, 0.7, 0.3, 1] })
    animate('.seal-r', { x: '34%', y: '42%', rotate: 22, opacity: 0 }, { duration: 0.85, ease: [0.2, 0.7, 0.3, 1] })
    animate('.rest-feather', { x: '70%', y: '-95%', rotate: 96, opacity: 0 }, { duration: 2.6, ease: [0.25, 0.1, 0.3, 1] })

    // 2 — released, the flap springs up a few degrees and hangs for a beat, then
    //     swings open toward the viewer, overshoots flat and settles: paper has give.
    const flap = q('.flap')
    const unsubscribe = flapAngle.on('change', (a) => {
      flap.style.zIndex = a > 90 ? '2' : '5' // edge-on is the moment to tuck it behind the letter
    })
    const opening = animate(flapAngle, [0, 9, 7, 186, 177.5, 180], {
      duration: 2.1,
      times: [0, 0.08, 0.2, 0.72, 0.88, 1],
      ease: ['easeOut', 'easeInOut', [0.45, 0, 0.3, 1], 'easeInOut', 'easeInOut'],
    })
    // Keep the z-index in step through the settle, which overlaps the pull below.
    const settled = opening.then(unsubscribe)
    await sleep(1150)
    animate('.sheen', { backgroundPosition: ['130% 0%', '-30% 0%'] }, { duration: 1.8, ease: 'easeInOut' })
    await sleep(320) // the hand reaches in while the flap is still settling: no dead pause

    // 3 — drawn out by an unseen hand: the letter catches for a moment, then glides
    //     out in one continuous pull with a slight, hand-like tilt, emerging from the
    //     envelope's shadow into the light while the envelope gives way beneath it.
    const stageH = q('.stage').offsetHeight
    const letter = q('.letter')
    const risen = -stageH * 0.62
    const pull = 2.2
    animate('.env-part', { y: [0, stageH * 0.012, 0] }, { duration: 0.7, times: [0, 0.35, 1], ease: 'easeInOut' })
    animate(q('.letter-shade'), { opacity: 0 }, { duration: pull * 0.7, delay: 0.2, ease: 'easeOut' })
    animate('.env-part', { y: stageH * 0.38 }, { duration: pull * 0.55, delay: pull * 0.45, ease: [0.4, 0, 0.2, 1] })
    await animate(
      letter,
      { y: [0, -stageH * 0.035, -stageH * 0.03, risen], rotate: [0, -0.7, 0.9, 0] },
      {
        y: { duration: pull, times: [0, 0.07, 0.13, 1], ease: ['easeOut', 'easeInOut', [0.32, 0, 0.18, 1]] },
        rotate: { duration: pull, times: [0, 0.3, 0.65, 1], ease: 'easeInOut' },
      },
    )
    await settled

    // 4 — the camera pushes in; the letter becomes the page.
    //
    // The zoom is flown by a twin letter in a flat layer (no perspective, no
    // transforms), moved with layout properties. On its last frame it occupies
    // exactly the hero's box and is rasterised exactly like it, so the hand-off
    // is pixel-identical rather than a soft image snapping into focus.
    const to = target.current?.getBoundingClientRect()
    if (!to) return onDone()
    onZoom()
    const origin = root.getBoundingClientRect()
    const from = letter.getBoundingClientRect()
    const flight = q('.flight')
    const face = q('.flight-hero')
    // The invitation is laid out once, at the hero's size, and scaled to fit
    // the growing card: it grows out of the letter instead of being cropped by it.
    face.style.width = `${to.width}px`
    face.style.height = `${to.height}px`
    const fit = (w: number, h: number) => Math.min(1, w / to.width, h / to.height)
    const frame = (k: number) => {
      const w = from.width + (to.width - from.width) * k
      const h = from.height + (to.height - from.height) * k
      flight.style.left = `${from.left - origin.left + (to.left - from.left) * k}px`
      flight.style.top = `${from.top - origin.top + (to.top - from.top) * k}px`
      flight.style.width = `${w}px`
      flight.style.height = `${h}px`
      // Centred on whole pixels (a -50% translate can land on half a pixel).
      face.style.left = `${Math.round((w - to.width) / 2)}px`
      face.style.top = `${Math.round((h - to.height) / 2)}px`
      face.style.scale = String(fit(w, h))
    }
    frame(0)
    flight.style.visibility = 'visible' // same frame: the twin takes the letter's place
    letter.style.visibility = 'hidden'

    animate('.env-part', { y: window.innerHeight * 0.8, scale: 1.3, opacity: 0 }, { duration: 1.1, ease: [0.5, 0, 0.75, 0] })
    animate('.glow', { opacity: 0 }, { duration: 1.3 })
    // Overlapping cross-fade: the card is never blank.
    animate(q('.flight-envelope'), { opacity: 0 }, { duration: 0.3, ease: 'easeOut' })
    animate(face, { opacity: 1 }, { duration: 0.6, delay: 0.15, ease: 'easeOut' })

    // One progress value drives position, size and scale together, so they can never drift apart.
    await animate(0, 1, { duration: 1.5, ease: [0.5, 0, 0.15, 1], onUpdate: frame })
    frame(1)
    face.style.scale = '' // exactly 1:1, no transform left, for the hand-off
    // The page beneath is now identical, so leave on this very frame rather
    // than cross-fading: a fading layer is anti-aliased differently and would
    // make the text shimmer for a moment. (Skip keeps the exit fade.)
    root.style.visibility = 'hidden'
    onDone()
  }

  const { bride, groom } = wedding

  return (
    <motion.div
      ref={scope}
      className="fixed inset-0 z-50 overflow-hidden bg-ivory"
      role="dialog"
      aria-modal="true"
      aria-label="Wedding invitation"
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
    >
      {/* warm, softly lit room */}
      <div aria-hidden="true" className="glow pointer-events-none absolute inset-0 bg-[radial-gradient(90%_70%_at_50%_38%,#ffffff_0%,#faf9f6_48%,#ece6db_100%)]" />
      <div aria-hidden="true" className="glow pointer-events-none absolute -top-[40vmax] left-1/2 size-[100vmax] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgb(255_243_214/0.75),transparent)]" />

      <div className="relative flex h-full flex-col items-center justify-center px-4 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
        <motion.p
          className="eyebrow mb-9 sm:mb-12"
          initial={{ opacity: 0, y: 10 }}
          animate={sealed ? { opacity: 1, y: 0 } : { opacity: 0, y: -8 }}
          transition={{ duration: sealed ? 1.4 : 0.5, ease: silk, delay: sealed ? 0.4 : 0 }}
        >
          A letter for you
        </motion.p>

        <div className="[perspective:1600px]">
          <motion.div
            style={{ rotateX: tiltX, rotateY: tiltY }}
            initial={{ opacity: 0, y: 36, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 1.6, ease: silk, delay: 0.15 }}
          >
            <motion.div
              animate={sealed ? { y: [0, -7, 0], rotate: [-0.5, 0.5, -0.5] } : { y: 0, rotate: 0 }}
              transition={sealed ? { duration: 7, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.5, ease: silk }}
            >
              <div
                className="stage relative aspect-[1.42] w-[min(88vw,36rem,calc(52svh*1.42))] cursor-pointer [perspective:1400px]"
                onClick={() => void open()}
              >
                {/* contact shadow */}
                <div className="env-part absolute inset-x-[6%] -bottom-[8%] h-[16%] rounded-[50%] bg-[radial-gradient(closest-side,rgb(80_62_30/0.3),transparent)] blur-md" />

                <EnvelopeBack className="env-part absolute inset-0 z-[1]" />

                <div className="letter absolute top-[6%] left-[4%] z-[3] h-[88%] w-[92%]" aria-hidden="true">
                  <CardFrame className="h-full w-full">
                    <EnvelopeLettering />
                    {/* inside the envelope it's dim; it brightens as it comes out into the light */}
                    <div className="letter-shade pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgb(60_45_22/0.05),rgb(60_45_22/0.13))]" />
                  </CardFrame>
                </div>
                <EnvelopeThroat className="env-part absolute inset-0 z-[3]" />

                <EnvelopePocket className="env-part absolute inset-0 z-[4]">
                  <div className="absolute inset-x-0 bottom-[7%] px-[8%] text-center">
                    {guestName ? (
                      <>
                        {/* Addressed, as a real envelope is. */}
                        <p className="caps text-[0.5rem] text-muted sm:text-[0.58rem]">For</p>
                        <p
                          className={`truncate leading-tight text-champagne/90 ${
                            isMyanmar(guestName) ? 'font-my text-[clamp(0.95rem,3.6vw,1.35rem)]' : 'font-display text-[clamp(1.35rem,5vw,2rem)]'
                          }`}
                        >
                          {guestName}
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="font-display text-[clamp(1.35rem,5vw,2rem)] leading-tight text-champagne/85">
                          {bride.short} <span className="font-serif text-[0.7em] italic">&amp;</span> {groom.short}
                        </p>
                        <p className="mt-1 text-[0.55rem] tracking-[0.4em] text-muted uppercase">28 · 11 · 2026</p>
                      </>
                    )}
                  </div>
                </EnvelopePocket>

                {/* the flap's shadow on the envelope as it lifts toward the viewer */}
                <motion.div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-0 top-0 z-[4] h-[57%] origin-top"
                  style={{ opacity: castOpacity, y: castY, scaleY: castScale, filter: castBlur }}
                >
                  <div className="absolute inset-0 bg-[rgb(70_52_25)]" style={{ clipPath: FLAP_OUTLINE }} />
                </motion.div>

                <EnvelopeFlap angle={flapAngle} className="flap env-part absolute inset-x-0 top-0 z-[5] h-[57%]" />

                {/* the feather, pinned across the flap by the seal */}
                <motion.div
                  className="rest-feather pointer-events-none absolute left-1/2 z-[6] aspect-[320/800] h-[82%] origin-[50%_78%] -translate-x-1/2 -translate-y-[78%]"
                  style={{ top: FLAP_DEPTH, rotate: 54 }}
                >
                  <FeatherCanvas seed={42} className="h-full w-full [filter:drop-shadow(1px_2px_1.5px_rgb(80_62_30/0.18))_drop-shadow(4px_10px_8px_rgb(80_62_30/0.16))]" />
                </motion.div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    void open()
                  }}
                  aria-label="Break the seal and open the invitation"
                  className="seal absolute left-1/2 z-[7] aspect-square w-[23%] -translate-1/2 cursor-pointer rounded-full border-0 bg-transparent p-0"
                  style={{ top: FLAP_DEPTH }}
                >
                  {sealed && (
                    <motion.span
                      aria-hidden="true"
                      className="absolute -inset-[14%] rounded-full border border-gold/45"
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: [0.8, 1.25], opacity: [0.7, 0] }}
                      transition={{ duration: 2.4, repeat: Infinity, ease: 'easeOut', delay: 1.6 }}
                    />
                  )}
                  <WaxSeal half="left" className="seal-l absolute inset-0 size-full [filter:drop-shadow(0_5px_6px_rgb(90_68_20/0.32))]" />
                  <WaxSeal half="right" className="seal-r absolute inset-0 size-full [filter:drop-shadow(0_5px_6px_rgb(90_68_20/0.32))]" />
                </button>
              </div>
            </motion.div>
          </motion.div>
        </div>

        <motion.p
          className="mt-14 font-serif text-xl text-ink/85 italic sm:mt-16 sm:text-2xl"
          style={{ textShadow: '0 0 18px rgb(212 175 55 / 0.55), 0 0 2px rgb(255 255 255 / 0.9)' }}
          initial={{ opacity: 0 }}
          animate={sealed ? { opacity: [0.5, 1, 0.5] } : { opacity: 0 }}
          transition={sealed ? { duration: 3.2, repeat: Infinity, ease: 'easeInOut', delay: 1.2 } : { duration: 0.4 }}
        >
          Touch to open our letter…
        </motion.p>
      </div>

      {/* The twin letter that flies the zoom (see step 4). */}
      <div className="flight invisible absolute z-20" aria-hidden="true">
        <CardFrame className="h-full w-full">
          <div className="flight-envelope absolute inset-0">
            <EnvelopeLettering />
          </div>
          <div className="flight-hero absolute opacity-0">
            <HeroCardContent />
          </div>
        </CardFrame>
      </div>

      {sealed && (
        <button
          type="button"
          onClick={() => {
            onStart()
            onDone()
          }}
          className="absolute top-[max(16px,env(safe-area-inset-top))] right-4 z-[70] rounded-full border border-ink/10 bg-paper/60 px-4 py-2 text-[0.62rem] tracking-[0.28em] text-muted uppercase backdrop-blur transition-colors hover:text-ink"
        >
          Skip
        </button>
      )}
    </motion.div>
  )
}
