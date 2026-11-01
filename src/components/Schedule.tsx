import { motion } from 'motion/react'
import { wedding } from '../config/wedding'
import { ArchIcon, CameraIcon, CheersIcon, RingsIcon } from './Icons'
import { SectionHeading } from './ui/Heading'
import { RevealGroup, RevealItem } from './ui/motion'

const ICONS = { arrival: ArchIcon, rings: RingsIcon, dining: CheersIcon, camera: CameraIcon } as const

/** The day as a row of printed place cards, each framed in gold leaf. */
export function Schedule() {
  return (
    <section id="schedule" aria-labelledby="schedule-title" className="section-wash relative scroll-mt-16 px-5 py-28 sm:px-8 md:py-36">
      <div className="mx-auto max-w-6xl">
        <SectionHeading id="schedule-title" index="05" eyebrow="Schedule of events" title="The" accent="day" titleMy="အစီအစဉ်" />
        <RevealGroup className="m-0 grid list-none gap-5 p-0 sm:grid-cols-2 lg:grid-cols-4">
          {wedding.schedule.map((item) => {
            const Icon = ICONS[item.icon]
            const [time, meridiem] = item.time.split(' ')
            return (
              <RevealItem key={item.title} className="h-full">
                <motion.article
                  className="paper-stock relative h-full rounded-[4px] px-7 pt-11 pb-10 text-center shadow-[var(--shadow-float)]"
                  whileHover={{ y: -6 }}
                  transition={{ type: 'spring', stiffness: 220, damping: 22 }}
                >
                  <span aria-hidden="true" className="gold-leaf pointer-events-none absolute inset-2.5" />
                  <span aria-hidden="true" className="gold-leaf pointer-events-none absolute inset-[15px] opacity-50" />
                  <span className="mx-auto grid size-14 place-items-center rounded-full border border-gold/50 text-champagne">
                    <Icon width={24} height={24} />
                  </span>
                  <p className="mt-6 font-serif text-5xl leading-none font-light text-ink">
                    {time}
                    <span className="ml-2 font-sans text-[0.62rem] font-medium tracking-[0.25em] text-champagne">{meridiem}</span>
                  </p>
                  <h3 className="mt-5 font-serif text-2xl text-ink">{item.title}</h3>
                  <p lang="my" className="text-sm text-champagne">
                    {item.titleMy}
                  </p>
                  <span aria-hidden="true" className="mx-auto my-4 block h-px w-10 bg-gold/60" />
                  <p className="font-serif text-lg leading-relaxed text-muted">{item.text}</p>
                </motion.article>
              </RevealItem>
            )
          })}
        </RevealGroup>
      </div>
    </section>
  )
}
