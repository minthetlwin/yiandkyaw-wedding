import { motion, type Variants } from 'motion/react'
import type { ReactNode } from 'react'
import { silk } from './variants'

interface SectionHeadingProps {
  id: string
  index: string
  eyebrow: string
  /** Serif part of the title. */
  title: string
  /** Script accent appended in champagne gold. */
  accent?: string
  titleMy?: string
  align?: 'center' | 'left'
  children?: ReactNode
}

// One choreography for every section: the number and gold rule arrive, the rule
// draws itself, the title rises out of a mask, then the Myanmar line settles.
const sequence: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.14 } } }
const fade: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 1, ease: silk } },
}
const draw: Variants = {
  hidden: { scaleX: 0 },
  show: { scaleX: 1, transition: { duration: 1.1, ease: silk } },
}
const rise: Variants = {
  hidden: { y: '105%' },
  show: { y: '0%', transition: { duration: 1.25, ease: silk } },
}

/** Editorial section heading: number + small caps, large serif with a script accent. */
export function SectionHeading({ id, index, eyebrow, title, accent, titleMy, align = 'center', children }: SectionHeadingProps) {
  const center = align === 'center'
  return (
    <motion.div
      className={`mb-14 md:mb-20 ${center ? 'text-center' : ''}`}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '0px 0px -12% 0px' }}
      variants={sequence}
    >
      <motion.p className={`eyebrow flex items-center gap-4 ${center ? 'justify-center' : ''}`} variants={fade}>
        <span className="font-serif text-sm tracking-normal text-champagne italic">{index}</span>
        <motion.span className="h-px w-10 origin-left bg-gradient-to-r from-gold to-gold/30" aria-hidden="true" variants={draw} />
        {eyebrow}
      </motion.p>
      {/* The mask leaves room below for the script accent's swashes. */}
      <h2 id={id} className="mt-5 -mb-[0.22em] overflow-hidden pb-[0.22em] font-serif text-5xl leading-[1.02] font-light text-ink sm:text-6xl md:text-7xl">
        <motion.span className="block" variants={rise}>
          {title} {accent && <span className="font-script text-[1.1em] font-normal text-champagne">{accent}</span>}
        </motion.span>
      </h2>
      {titleMy && (
        <motion.p lang="my" className="mt-3 text-muted" variants={fade}>
          {titleMy}
        </motion.p>
      )}
      {children}
    </motion.div>
  )
}
