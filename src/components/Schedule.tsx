import { motion } from 'motion/react'
import { wedding, type ScheduleItem as Moment } from '../config/wedding'
import { ArchIcon, CameraIcon, CheersIcon, RingsIcon } from './Icons'
import { SectionHeading } from './ui/Heading'
import { RevealGroup, RevealItem } from './ui/motion'
import { fadeUp, stagger } from './ui/variants'

const ICONS = { arrival: ArchIcon, rings: RingsIcon, dining: CheersIcon, camera: CameraIcon } as const

/** The double gold-leaf rule printed inside every card. */
function GoldFrame() {
  return (
    <>
      <span aria-hidden="true" className="gold-leaf pointer-events-none absolute inset-2.5" />
      <span aria-hidden="true" className="gold-leaf pointer-events-none absolute inset-[15px] opacity-50" />
    </>
  )
}

function Meridiem({ children }: { children: string }) {
  return <span className="ml-1.5 font-sans text-[0.62rem] font-medium tracking-[0.25em] text-champagne">{children}</span>
}

/**
 * "1:30 PM", or a range "1:30 – 3:30 PM", set as large numerals with a
 * small-caps meridiem. A shared meridiem is printed once, at the end.
 */
function EventTime({ moment, className = '' }: { moment: Moment; className?: string }) {
  const [start, startMer] = moment.time.split(' ')
  const [end, endMer] = moment.endTime?.split(' ') ?? []
  return (
    <p className={`font-serif leading-none font-light text-ink ${className}`}>
      <time>{start}</time>
      {end ? (
        <>
          {startMer !== endMer && <Meridiem>{startMer}</Meridiem>}
          <span className="mx-[0.25em] text-gold">–</span>
          <time>{end}</time>
          <Meridiem>{endMer}</Meridiem>
        </>
      ) : (
        <Meridiem>{startMer}</Meridiem>
      )}
    </p>
  )
}

/**
 * Phones: one place card holding the whole day as a timeline, the moments
 * strung together by a gold thread through their icons.
 */
function DayCard({ moments }: { moments: readonly Moment[] }) {
  return (
    <div className="paper-stock relative rounded-[4px] px-6 pt-10 pb-9 shadow-[var(--shadow-float)]">
      <GoldFrame />
      <p className="eyebrow text-center">{wedding.event.dateLabel}</p>
      <span aria-hidden="true" className="mx-auto mt-3 mb-8 block h-px w-10 bg-gold/60" />
      <motion.ol
        className="m-0 list-none p-0"
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: '0px 0px -12% 0px' }}
        variants={stagger}
      >
        {moments.map((m, i) => {
          const Icon = ICONS[m.icon]
          const last = i === moments.length - 1
          return (
            <motion.li key={m.title} variants={fadeUp} className={`relative grid grid-cols-[2.75rem_1fr] gap-x-4 ${last ? '' : 'pb-8'}`}>
              {/* the thread: from under this icon down to the next */}
              {!last && <span aria-hidden="true" className="absolute top-12 bottom-1 left-[1.375rem] w-px bg-gradient-to-b from-gold/60 to-gold/15" />}
              <span className="grid size-11 place-items-center rounded-full border border-gold/50 bg-paper text-champagne">
                <Icon width={20} height={20} />
              </span>
              <div className="pt-1">
                <EventTime moment={m} className="text-3xl" />
                <h3 className="mt-2 font-serif text-xl leading-snug text-ink">{m.title}</h3>
                <p lang="my" className="mt-1 text-sm text-champagne">
                  {m.titleMy}
                </p>
                <p className="mt-2 font-serif text-base leading-relaxed text-muted">{m.text}</p>
              </div>
            </motion.li>
          )
        })}
      </motion.ol>
    </div>
  )
}

/** Each moment on its own printed place card. The caller sets display and columns. */
function PlaceCards({ moments, className }: { moments: readonly Moment[]; className: string }) {
  return (
    <RevealGroup className={`m-0 list-none gap-5 p-0 ${className}`}>
      {moments.map((m) => {
        const Icon = ICONS[m.icon]
        return (
          <RevealItem key={m.title} className="h-full">
            <motion.article
              className="paper-stock relative h-full rounded-[4px] px-7 pt-11 pb-10 text-center shadow-[var(--shadow-float)]"
              whileHover={{ y: -6 }}
              transition={{ type: 'spring', stiffness: 220, damping: 22 }}
            >
              <GoldFrame />
              <span className="mx-auto grid size-14 place-items-center rounded-full border border-gold/50 text-champagne">
                <Icon width={24} height={24} />
              </span>
              <EventTime moment={m} className={`mt-6 ${m.endTime ? 'text-4xl sm:text-5xl' : 'text-5xl'}`} />
              <h3 className="mt-5 font-serif text-2xl text-ink">{m.title}</h3>
              <p lang="my" className="mt-1 text-sm text-champagne">
                {m.titleMy}
              </p>
              <span aria-hidden="true" className="mx-auto my-4 block h-px w-10 bg-gold/60" />
              <p className="font-serif text-lg leading-relaxed text-muted">{m.text}</p>
            </motion.article>
          </RevealItem>
        )
      })}
    </RevealGroup>
  )
}

/**
 * The order of the day, laid out for however many moments there are:
 * - one: a single place card, centred, at every width;
 * - several: a timeline card on phones and a row of place cards above that.
 *   Both render from the same data and CSS picks one (the other is
 *   display:none, so screen readers hear it once and nothing flashes on load).
 */
export function Schedule() {
  const moments = wedding.schedule
  return (
    <section id="schedule" aria-labelledby="schedule-title" className="section-wash relative scroll-mt-16 px-5 py-28 sm:px-8 md:py-36">
      <div className="mx-auto max-w-6xl">
        <SectionHeading id="schedule-title" index="05" eyebrow="Schedule of events" title="The" accent="day" titleMy="အစီအစဉ်" />
        {moments.length === 1 ? (
          <PlaceCards moments={moments} className="mx-auto grid max-w-md" />
        ) : (
          <>
            <div className="mx-auto max-w-md sm:hidden">
              <DayCard moments={moments} />
            </div>
            <PlaceCards moments={moments} className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-4" />
          </>
        )}
      </div>
    </section>
  )
}
