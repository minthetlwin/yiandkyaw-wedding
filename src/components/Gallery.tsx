import { motion } from 'motion/react'
import { useEffect, useRef, useState, type PointerEvent } from 'react'
import { wedding, type Photo } from '../config/wedding'
import { ChevronIcon, CloseIcon } from './Icons'
import { SectionHeading } from './ui/Heading'
import { Curtain } from './ui/motion'
import { silk } from './ui/variants'

const photos: readonly Photo[] = wedding.gallery

/** Bento layout: tile spans cycle through a hand-tuned rhythm. */
const SPANS = [
  'md:col-span-2 md:row-span-2',
  'md:row-span-2',
  '',
  'md:col-span-2',
  '',
  'md:row-span-2',
  'md:col-span-2 md:row-span-2',
  '',
  '',
]

export function Gallery() {
  const [active, setActive] = useState<number | null>(null)

  return (
    <section id="moments" aria-labelledby="moments-title" className="relative scroll-mt-16 px-5 py-28 sm:px-8 md:py-36">
      <div className="mx-auto max-w-6xl">
        <SectionHeading id="moments-title" index="08" eyebrow="Captured moments" title="Little" accent="moments" titleMy="အမှတ်တရ ဓာတ်ပုံများ" />
        <ul className="m-0 grid list-none auto-rows-[38vw] grid-cols-2 gap-3 p-0 [grid-auto-flow:dense] sm:gap-4 md:auto-rows-[15rem] md:grid-cols-4">
          {photos.map((p, i) => (
            <li key={p.src} className={`${SPANS[i % SPANS.length]} ${i === 0 ? 'col-span-2 row-span-2' : ''}`}>
              <Curtain className="size-full rounded-[3px] shadow-[var(--shadow-float)]" delay={(i % 4) * 0.09}>
              <button
                type="button"
                onClick={() => setActive(i)}
                className="group relative block h-full w-full cursor-zoom-in overflow-hidden border-0 bg-linen p-0"
              >
                <img
                  src={p.src}
                  alt={p.alt}
                  width={p.width}
                  height={p.height}
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover transition duration-[1.4s] ease-[var(--ease-silk)] group-hover:scale-[1.06]"
                />
                <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/35 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                {/* a fine light keyline, like a print's border */}
                <span className="pointer-events-none absolute inset-0 ring-1 ring-white/35 ring-inset" />
                <span className="sr-only">
                  Open photo {i + 1} of {photos.length}
                </span>
              </button>
              </Curtain>
            </li>
          ))}
        </ul>
      </div>
      <Lightbox index={active} onChange={setActive} />
    </section>
  )
}

const SWIPE_THRESHOLD = 50

function Lightbox({ index, onChange }: { index: number | null; onChange: (i: number | null) => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const swipeStart = useRef<number | null>(null)
  const open = index !== null

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  useEffect(() => {
    if (index === null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') onChange((index + 1) % photos.length)
      if (e.key === 'ArrowLeft') onChange((index - 1 + photos.length) % photos.length)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [index, onChange])

  const go = (delta: number) => index !== null && onChange((index + delta + photos.length) % photos.length)

  const onPointerUp = (e: PointerEvent) => {
    if (swipeStart.current === null) return
    const dx = e.clientX - swipeStart.current
    swipeStart.current = null
    if (Math.abs(dx) > SWIPE_THRESHOLD) go(dx < 0 ? 1 : -1)
  }

  const photo = index !== null ? photos[index] : null
  const buttonClass =
    'absolute grid size-12 place-items-center rounded-full border border-ink/15 bg-paper/80 text-ink backdrop-blur transition hover:border-champagne hover:text-champagne'

  return (
    <dialog
      ref={dialogRef}
      aria-label="Photo viewer"
      onClose={() => onChange(null)}
      onClick={(e) => e.target === e.currentTarget && onChange(null)}
      className="m-0 h-dvh max-h-none w-screen max-w-none border-0 bg-ivory/95 p-0 backdrop:bg-transparent open:grid open:place-items-center"
    >
      {photo && (
        <>
          <figure
            className="m-0 grid touch-pan-y justify-items-center gap-3 px-4 pt-16 pb-6 select-none"
            onPointerDown={(e) => (swipeStart.current = e.clientX)}
            onPointerUp={onPointerUp}
          >
            <motion.img
              key={photo.src}
              src={photo.src}
              alt={photo.alt}
              width={photo.width}
              height={photo.height}
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: silk }}
              className="h-auto max-h-[calc(100dvh-140px)] w-auto max-w-[min(92vw,1100px)] rounded-xl shadow-[var(--shadow-soft)]"
            />
            <figcaption className="eyebrow">
              {(index ?? 0) + 1} / {photos.length}
            </figcaption>
          </figure>
          <button type="button" className={`${buttonClass} top-[max(16px,env(safe-area-inset-top))] right-4`} onClick={() => onChange(null)} aria-label="Close">
            <CloseIcon />
          </button>
          <button type="button" className={`${buttonClass} bottom-5 left-4 md:top-1/2 md:bottom-auto md:-translate-y-1/2`} onClick={() => go(-1)} aria-label="Previous photo">
            <ChevronIcon style={{ transform: 'scaleX(-1)' }} />
          </button>
          <button type="button" className={`${buttonClass} right-4 bottom-5 md:top-1/2 md:bottom-auto md:-translate-y-1/2`} onClick={() => go(1)} aria-label="Next photo">
            <ChevronIcon />
          </button>
        </>
      )}
    </dialog>
  )
}
