import { AnimatePresence, MotionConfig, motion } from 'motion/react'
import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { Footer } from './components/Footer'
import { Gallery } from './components/Gallery'
import { Gifts } from './components/Gifts'
import { Hero } from './components/Hero'
import { Invitation } from './components/Invitation'
import { Marquee } from './components/Marquee'
import { MusicToggle } from './components/MusicToggle'
import { Nav } from './components/Nav'
import { Rsvp } from './components/Rsvp'
import { SaveTheDate } from './components/SaveTheDate'
import { Schedule } from './components/Schedule'
import { Story } from './components/Story'
import { Venue } from './components/Venue'
import { usePrefersReducedMotion } from './hooks/hooks'
import { useIdleAutoScroll } from './hooks/useIdleAutoScroll'
import { useSmoothScroll } from './hooks/useSmoothScroll'
import type { Burst } from './intro/FeatherField'
import { prepareMusic, startMusic } from './lib/music'
import { Intro } from './intro/Intro'

const FeatherField = lazy(() => import('./intro/FeatherField'))

/**
 * The envelope intro plays first, over the page. When the letter lands on the
 * hero card (the same card) the intro lifts away and the site is simply there.
 * The 3D feather layer floats over the envelope during the intro, then drifts
 * on behind the page.
 */
export default function App() {
  const reducedMotion = usePrefersReducedMotion()
  const [opened, setOpened] = useState(reducedMotion)
  const [burst, setBurst] = useState<Burst | null>(null)
  const [dolly, setDolly] = useState(false)
  const heroFrame = useRef<HTMLDivElement>(null)

  const onBurst = useCallback((x: number, y: number) => setBurst((b) => ({ x, y, id: (b?.id ?? 0) + 1 })), [])
  const onZoom = useCallback(() => setDolly(true), [])
  const onDone = useCallback(() => {
    setDolly(false)
    setOpened(true)
  }, [])

  // Buffer the song while the guest looks at the envelope, so it starts the instant they tap.
  useEffect(() => prepareMusic(), [])

  // The letter measures the hero at the top of the page.
  useEffect(() => {
    history.scrollRestoration = 'manual'
    window.scrollTo(0, 0)
  }, [])

  // Keep the page still while the intro is up.
  useEffect(() => {
    document.documentElement.classList.toggle('is-locked', !opened)
  }, [opened])

  useSmoothScroll(opened)
  useIdleAutoScroll(opened)

  return (
    <MotionConfig reducedMotion="user">
      {!reducedMotion && (
        <Suspense fallback={null}>
          {/* Over the envelope during the intro; behind the page afterwards (fading out across the hand-off). */}
          <motion.div
            aria-hidden="true"
            className={`pointer-events-none fixed inset-0 ${opened ? 'z-0' : 'z-[60]'}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: opened ? 0.85 : dolly ? 0 : 1 }}
            transition={opened ? { duration: 2, delay: 0.8 } : { duration: dolly ? 1.3 : 2 }}
          >
            <FeatherField mode={opened ? 'ambient' : 'intro'} burst={burst} dolly={dolly} />
          </motion.div>
        </Suspense>
      )}

      <AnimatePresence>{!opened && <Intro target={heroFrame} onBurst={onBurst} onZoom={onZoom} onStart={startMusic} onDone={onDone} />}</AnimatePresence>

      {/* Present from the envelope on: opening it starts the music, this starts or pauses it any time. */}
      <MusicToggle />

      {/* Opacity only: a transform here would turn the fixed nav into a scrolling element. */}
      <motion.div
        className="relative z-20"
        initial={{ opacity: 0 }}
        animate={{ opacity: opened ? 1 : 0 }}
        transition={{ duration: 1.2, delay: 0.6 }}
        inert={!opened}
      >
        <Nav />
      </motion.div>

      {/* Fully drawn beneath the intro, so the hero is already in place when the letter lands. */}
      <div className="relative z-10" inert={!opened}>
        <main>
          <Hero revealed={opened} frameRef={heroFrame} />
          <Marquee />
          <Invitation />
          <SaveTheDate />
          <Story />
          <Gifts />
          <Schedule />
          <Venue />
          <Rsvp />
          <Gallery />
        </main>
        <Footer />
      </div>
    </MotionConfig>
  )
}
