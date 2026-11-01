import { motion } from 'motion/react'
import { HeartIcon } from '../Icons'

const HEARTS = Array.from({ length: 16 }, (_, i) => {
  const angle = (i / 16) * Math.PI * 2 + (i % 2 ? 0.2 : -0.1)
  const dist = 90 + ((i * 37) % 70)
  return {
    x: Math.cos(angle) * dist,
    y: Math.sin(angle) * dist * 0.8 - 40,
    size: 14 + ((i * 11) % 14),
    delay: (i % 5) * 0.04,
    tone: i % 3,
  }
})

const TONES = ['text-champagne', 'text-champagne-soft', 'text-gold']

/** A one-shot bloom of hearts from the centre of its parent. */
export function HeartBurst() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute top-1/2 left-1/2 z-10">
      {HEARTS.map((h, i) => (
        <motion.span
          key={i}
          className={`absolute -translate-1/2 ${TONES[h.tone]}`}
          initial={{ x: 0, y: 0, scale: 0, opacity: 0, rotate: 0 }}
          animate={{ x: h.x, y: h.y, scale: [0, 1.1, 0.9], opacity: [0, 1, 0], rotate: h.x > 0 ? 20 : -20 }}
          transition={{ duration: 1.6, delay: h.delay, ease: [0.16, 1, 0.3, 1] }}
        >
          <HeartIcon width={h.size} height={h.size} fill="currentColor" stroke="none" />
        </motion.span>
      ))}
    </div>
  )
}
