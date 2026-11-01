import { AnimatePresence, motion } from 'motion/react'
import { wedding } from '../config/wedding'
import { useCountdown } from '../hooks/hooks'
import { guestName } from '../lib/guest'
import { SectionHeading } from './ui/Heading'
import { Reveal, RevealGroup, RevealItem } from './ui/motion'
import { silk } from './ui/variants'

const UNITS = [
  ['days', 'Days', 'ရက်'],
  ['hours', 'Hours', 'နာရီ'],
  ['minutes', 'Minutes', 'မိနစ်'],
  ['seconds', 'Seconds', 'စက္ကန့်'],
] as const

/** One digit that rolls, like a fine watch, whenever it changes. */
function RollingDigit({ value }: { value: string }) {
  return (
    <span className="relative inline-block h-[1em] w-[0.62em] overflow-hidden align-top">
      <AnimatePresence initial={false} mode="popLayout">
        <motion.span
          key={value}
          className="absolute inset-0 text-center"
          initial={{ y: '-100%', opacity: 0, filter: 'blur(3px)' }}
          animate={{ y: '0%', opacity: 1, filter: 'blur(0px)' }}
          exit={{ y: '100%', opacity: 0, filter: 'blur(3px)' }}
          transition={{ duration: 0.6, ease: silk }}
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </span>
  )
}

function Tile({ value, label, labelMy }: { value: number; label: string; labelMy: string }) {
  const digits = String(value).padStart(2, '0').split('')
  return (
    <div className="paper-stock relative grid justify-items-center rounded-[4px] px-2 pt-7 pb-6 shadow-[var(--shadow-float)] sm:pt-9 sm:pb-8">
      <span aria-hidden="true" className="gold-leaf pointer-events-none absolute inset-1.5 sm:inset-2" />
      <span className="font-serif text-[clamp(2.6rem,9vw,4.75rem)] leading-none font-light text-ink [font-variant-numeric:lining-nums]" aria-hidden="true">
        {digits.map((d, i) => (
          <RollingDigit key={digits.length - i} value={d} />
        ))}
      </span>
      <span className="caps mt-3 text-[0.55rem] text-champagne sm:text-[0.62rem]">{label}</span>
      <span lang="my" className="text-[0.7rem] text-muted">
        {labelMy}
      </span>
    </div>
  )
}

/** The invitation's words, and the days until the wedding, counting down. */
export function Invitation() {
  const countdown = useCountdown(wedding.event.start)
  const { bride, groom } = wedding
  return (
    <section id="invitation" aria-labelledby="invitation-title" className="relative scroll-mt-16 px-5 py-28 sm:px-8 md:py-36">
      <div className="mx-auto max-w-4xl text-center">
        <SectionHeading id="invitation-title" index="01" eyebrow="The invitation" title="You are" accent="invited" titleMy="ဖိတ်ကြားလွှာ" />
        <Reveal>
          <p className="mx-auto max-w-2xl font-serif text-2xl leading-relaxed text-balance text-muted md:text-[1.7rem]">
            {guestName ? `${guestName}, with` : 'With'} joyful hearts, {groom.short} and {bride.short} invite you to share in the day they promise each
            other forever.
          </p>
          <p lang="my" className="mx-auto mt-4 max-w-xl text-muted">
            မင်္ဂလာဆောင်ပွဲသို့ ကြွရောက်ချီးမြှင့်ပေးကြပါရန် လေးစားစွာ ဖိတ်ကြားအပ်ပါသည်။
          </p>
        </Reveal>

        <Reveal className="mt-16 md:mt-20" delay={0.1}>
          <p className="caps text-[0.68rem] text-muted">Counting down to forever</p>
        </Reveal>
        {countdown.done ? (
          <Reveal className="mt-6">
            <div data-live>
              <p className="foil-sweep inline-block px-[0.2em] font-script text-6xl">Today is the day</p>
            </div>
          </Reveal>
        ) : (
          <RevealGroup className="mx-auto mt-6 grid max-w-3xl grid-cols-4 gap-2.5 sm:gap-5">
            {UNITS.map(([key, label, labelMy]) => (
              <RevealItem key={key}>
                <Tile value={countdown[key]} label={label} labelMy={labelMy} />
              </RevealItem>
            ))}
          </RevealGroup>
        )}
        {/* For screen readers, one calm sentence instead of four ticking numbers. */}
        <p className="sr-only" aria-live="off">
          {countdown.days} days until the wedding.
        </p>
      </div>
    </section>
  )
}
