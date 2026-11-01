import { motion } from 'motion/react'
import type { ReactNode } from 'react'
import { fadeUp, stagger } from './variants'

const VIEWPORT = { once: true, margin: '0px 0px -12% 0px' } as const

interface RevealProps {
  children: ReactNode
  className?: string
  delay?: number
}

/** Fades and floats its content up the first time it scrolls into view. */
export function Reveal({ children, className, delay = 0 }: RevealProps) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={VIEWPORT}
      variants={fadeUp}
      transition={{ delay }}
    >
      {children}
    </motion.div>
  )
}

/** Container whose `RevealItem` children animate in one after another. */
export function RevealGroup({ children, className }: Omit<RevealProps, 'delay'>) {
  return (
    <motion.div className={className} initial="hidden" whileInView="show" viewport={VIEWPORT} variants={stagger}>
      {children}
    </motion.div>
  )
}

export function RevealItem({ children, className }: Omit<RevealProps, 'delay'>) {
  return (
    <motion.div className={className} variants={fadeUp}>
      {children}
    </motion.div>
  )
}

interface CurtainProps {
  children: ReactNode
  className?: string
  delay?: number
}

/**
 * A photograph unveiled like a print drawn from a sleeve: a curtain lifts from
 * the bottom while the image settles from a gentle zoom. Wrap an <img>.
 */
export function Curtain({ children, className = '', delay = 0 }: CurtainProps) {
  return (
    <motion.div
      className={`overflow-hidden ${className}`}
      initial={{ clipPath: 'inset(100% 0% 0% 0%)' }}
      whileInView={{ clipPath: 'inset(0% 0% 0% 0%)' }}
      viewport={VIEWPORT}
      transition={{ duration: 1.3, ease: [0.76, 0, 0.24, 1], delay }}
    >
      <motion.div
        className="size-full"
        initial={{ scale: 1.14 }}
        whileInView={{ scale: 1 }}
        viewport={VIEWPORT}
        transition={{ duration: 1.9, ease: [0.22, 1, 0.36, 1], delay }}
      >
        {children}
      </motion.div>
    </motion.div>
  )
}
