import { motion, useScroll, useSpring } from 'motion/react'
import { useEffect, useState } from 'react'
import { wedding } from '../config/wedding'

const LINKS = [
  { href: '#invitation', label: 'Invitation' },
  { href: '#story', label: 'Our Story' },
  { href: '#schedule', label: 'The Day' },
  { href: '#venue', label: 'Venue' },
  { href: '#gifts', label: 'Gifts' },
] as const

export function Nav() {
  // A gold thread that fills as the guest reads through the day.
  const { scrollYProgress } = useScroll()
  const progress = useSpring(scrollYProgress, { stiffness: 140, damping: 30, restDelta: 0.001 })
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    // Hidden while the hero card fills the screen; it would sit on the card's corners.
    const onScroll = () => setScrolled(window.scrollY > window.innerHeight * 0.6)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 pt-[env(safe-area-inset-top)] transition-all duration-500 ${
        scrolled ? 'bg-ivory/80 shadow-[0_1px_0_rgb(61_58_55/0.08)] backdrop-blur-xl' : 'pointer-events-none -translate-y-full opacity-0'
      }`}
    >
      <motion.span
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-px origin-left bg-gradient-to-r from-gold-light via-gold to-champagne"
        style={{ scaleX: progress }}
      />
      <nav className="mx-auto flex h-16 max-w-6xl items-center gap-8 px-5 sm:px-8" aria-label="Sections">
        <a href="#top" className="font-script text-3xl text-champagne no-underline" aria-label="Back to top">
          {wedding.monogram}
        </a>
        <ul className="ml-auto hidden list-none gap-8 md:flex">
          {LINKS.map((l) => (
            <li key={l.href}>
              <a href={l.href} className="eyebrow !tracking-[0.28em] !text-muted no-underline transition-colors hover:!text-ink">
                {l.label}
              </a>
            </li>
          ))}
        </ul>
        <a href="#rsvp" className="btn btn-ghost ml-auto !min-h-0 !px-5 !py-2.5 md:ml-0">
          RSVP
        </a>
      </nav>
    </header>
  )
}
