import { wedding } from '../config/wedding'
import { mapsEmbedUrl, mapsUrl } from '../lib/calendar'
import { SectionHeading } from './ui/Heading'
import { Reveal } from './ui/motion'

/** Venue: a large map beside the address and one-tap directions. */
export function Venue() {
  const { venue, event } = wedding
  return (
    <section id="venue" aria-labelledby="venue-title" className="relative scroll-mt-16 px-5 py-28 sm:px-8 md:py-36">
      <div className="mx-auto max-w-6xl">
        <SectionHeading id="venue-title" index="06" eyebrow="Venue & location" title="Where we'll" accent="celebrate" titleMy="မင်္ဂလာ နေရာ" />
        <Reveal className="paper-stock relative grid overflow-hidden rounded-[4px] shadow-[var(--shadow-card)] md:grid-cols-[1.3fr_1fr]">
          <span aria-hidden="true" className="gold-leaf pointer-events-none absolute inset-2.5 z-10 sm:inset-3.5" />
          <span aria-hidden="true" className="gold-leaf pointer-events-none absolute inset-[15px] z-10 opacity-50 sm:inset-[19px]" />
          <iframe
            title={`Map showing ${venue.name}`}
            src={mapsEmbedUrl}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="block aspect-[4/3] h-full w-full border-0 bg-linen grayscale-[0.35] sepia-[0.15] md:aspect-auto md:min-h-[460px]"
          />
          <div className="flex flex-col justify-center px-8 py-12 sm:px-12">
            <p className="eyebrow">The venue</p>
            <h3 className="mt-4 font-serif text-4xl leading-tight font-light text-ink">{venue.name}</h3>
            <p lang="my" className="mt-2 text-champagne">
              {venue.nameMy}
            </p>
            <p className="mt-5 text-muted">{venue.address}</p>
            <p lang="my" className="text-sm text-muted">
              {venue.addressMy}
            </p>
            <div className="my-8 h-px bg-gradient-to-r from-gold/60 to-transparent" />
            <p className="font-serif text-2xl text-ink">{event.dateLabel}</p>
            <p className="text-muted">{event.timeLabel}</p>
            <p lang="my" className="text-sm text-muted">
              {event.lunarDateMy}
            </p>
            <a className="btn btn-primary mt-8 self-start" href={mapsUrl} target="_blank" rel="noopener noreferrer">
              Get directions
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
