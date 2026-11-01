import { motion } from 'motion/react'
import type { Ref } from 'react'
import { wedding } from '../config/wedding'
import { guestName, isMyanmar } from '../lib/guest'
import { CardFrame } from './card/CardFrame'
import { Monogram } from './card/Monogram'
import { FeatherCanvas, GOLD_FOIL } from './ui/FeatherCanvas'
import { FeatherDivider } from './ui/Ornaments'
import { Snowfall } from './ui/Snowfall'
import { silk } from './ui/variants'

const weekday = wedding.event.dateLabel.split(',')[0]

/** The couple in a cathedral arch, keylined in gold leaf, a gilded feather resting against it. */
function Portrait({ live }: { live: boolean }) {
  const { photo } = wedding.hero
  return (
    <figure className="relative m-0 aspect-[4/5] h-[clamp(8.5rem,24svh,15rem)] shrink-0 sm:h-[clamp(10rem,30svh,20rem)] lg:aspect-[3/4] lg:h-[min(62svh,40rem)] lg:justify-self-end">
      <span aria-hidden="true" className="gold-keyline absolute -inset-[7px] rounded-t-full lg:-inset-3" />
      <span aria-hidden="true" className="gold-keyline absolute -inset-[11px] rounded-t-full opacity-40 lg:-inset-[19px]" />
      <div className="relative size-full overflow-hidden rounded-t-full bg-linen shadow-[0_28px_60px_-30px_rgb(61_45_20/0.5)]">
        <img
          src={photo.src}
          alt={photo.alt}
          width={photo.width}
          height={photo.height}
          fetchPriority="high"
          style={{ objectPosition: photo.focus }}
          className={`size-full object-cover transition-transform duration-[9s] ease-out motion-reduce:transition-none ${live ? 'scale-100' : 'scale-[1.07]'}`}
        />
        {/* Soft, warm light: a glow from above and a gentle settling of shade at the foot. */}
        <span
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(90%_55%_at_50%_0%,rgb(255_244_220/0.32),transparent_65%),linear-gradient(180deg,transparent_62%,rgb(61_45_20/0.16))]"
        />
        {/* Their snow keeps falling — only once live, so the envelope's copy stays still for the hand-off. */}
        {live && <Snowfall className="pointer-events-none absolute inset-0 size-full" />}
      </div>
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-[9%] -left-[19%] hidden aspect-[2/5] h-[50%] -rotate-[34deg] lg:block">
        <FeatherCanvas
          seed={42}
          tint={GOLD_FOIL}
          resolution={360}
          className="size-full [filter:drop-shadow(0_2px_1.5px_rgb(120_92_30/0.25))_drop-shadow(0_10px_10px_rgb(120_92_30/0.12))]"
        />
      </div>
    </figure>
  )
}

/** The invitation's wording, set like engraved stationery. */
function Words() {
  const { bride, groom, event, venue } = wedding
  return (
    <div className="relative text-center">
      <Monogram className="mx-auto hidden size-[clamp(3.5rem,9svh,5.5rem)] sm:block" />
      {guestName && (
        <p className={`mb-1 text-champagne sm:mt-4 ${isMyanmar(guestName) ? 'font-my text-sm' : 'font-serif text-lg italic sm:text-xl'}`}>
          Dear {guestName},
        </p>
      )}
      <p className={`caps text-[0.6rem] text-muted sm:text-[0.7rem] ${guestName ? '' : 'sm:mt-5'}`}>Together with their families</p>

      <h1 className="letterpress mt-1 font-display text-[clamp(3.1rem,min(15vw,9svh),6.6rem)] leading-[1.2] font-normal text-ink sm:mt-2">
        <span className="sr-only">
          {bride.short} and {groom.short}
        </span>
        <span aria-hidden="true">{bride.short}</span>
        {/* The copperplate's own ampersand is too ornate to read; engravers set it in the italic. */}
        <span aria-hidden="true" className="foil-sweep mx-[0.08em] inline-block px-[0.1em] font-serif text-[0.68em] italic [text-shadow:none]">
          &amp;
        </span>
        <span aria-hidden="true">{groom.short}</span>
      </h1>
      <p lang="my" className="text-[0.78rem] text-muted sm:text-[0.9rem]">
        {groom.nameMy} <span className="text-gold">·</span> {bride.nameMy}
      </p>

      <p className="mx-auto mt-2 max-w-[18rem] font-serif text-[1.05rem] leading-snug text-balance text-muted italic sm:mt-4 sm:max-w-sm sm:text-xl">
        request the honour of your presence at the celebration of their marriage
      </p>

      <FeatherDivider className="my-3 sm:my-5" />

      <p className="caps text-[0.66rem] text-champagne sm:text-xs">{weekday}</p>
      <p className="mt-0.5 font-serif text-[1.6rem] leading-tight text-ink italic sm:text-[2.1rem]">{event.dateFormal}</p>
      <p className="caps mt-1 text-[0.6rem] text-muted sm:text-[0.68rem]">{event.yearFormal}</p>
      <p className="caps mt-3 text-[0.62rem] !tracking-[0.2em] text-ink [font-variant-numeric:lining-nums] sm:mt-4 sm:text-[0.72rem]">{event.timeLabel}</p>

      <p className="mt-3 font-serif text-lg leading-snug text-ink sm:mt-4 sm:text-xl">{venue.name}</p>
      <p className="mx-auto mt-0.5 max-w-[19rem] text-[0.72rem] leading-relaxed text-muted sm:max-w-md sm:text-sm [@media(max-height:700px)]:hidden">
        {venue.address}
      </p>
    </div>
  )
}

/**
 * The words and portrait printed on the invitation card. The letter that
 * slides out of the envelope renders this too, at the hero's exact size and
 * with `live` off, so the swap is invisible. Once live, the foil catches the
 * light and the portrait slowly settles.
 */
export function HeroCardContent({ live = false }: { live?: boolean }) {
  return (
    <div data-live={live || undefined} className="absolute inset-0">
      {/* Candlelight: warmth behind the words, a soft leak of light over the portrait. */}
      <span
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(60%_42%_at_50%_62%,rgb(255_245_222/0.7),transparent_70%)] lg:bg-[radial-gradient(38%_55%_at_66%_50%,rgb(255_245_222/0.75),transparent_70%),radial-gradient(34%_48%_at_24%_28%,rgb(255_238_208/0.5),transparent_70%)]"
      />
      <div className="relative flex h-full flex-col items-center justify-center gap-6 px-8 pt-10 pb-14 sm:gap-9 sm:px-14 sm:pb-20 lg:grid lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1fr)] lg:gap-[clamp(3.5rem,7vw,8rem)] lg:px-[clamp(5rem,8vw,9rem)] lg:py-16">
        <Portrait live={live} />
        <Words />
      </div>
    </div>
  )
}

/** The homepage opens on the invitation card itself, framed edge to edge. */
export function Hero({ revealed, frameRef }: { revealed: boolean; frameRef: Ref<HTMLDivElement> }) {
  const { bride, groom } = wedding
  return (
    <section id="top" aria-label={`${bride.short} and ${groom.short} are getting married`} className="relative p-3 sm:p-5">
      <CardFrame ref={frameRef} className="h-[calc(100svh-1.5rem)] min-h-[38rem] sm:h-[calc(100svh-2.5rem)]">
        <HeroCardContent live={revealed} />
        <motion.a
          href="#invitation"
          className="eyebrow absolute bottom-[calc(var(--inset)+0.9rem)] left-1/2 flex -translate-x-1/2 flex-col items-center gap-2 !text-[0.58rem] no-underline sm:bottom-[calc(var(--inset)+1.4rem)] [@media(max-height:760px)]:hidden"
          initial={{ opacity: 0, y: -8 }}
          animate={revealed ? { opacity: 1, y: 0 } : { opacity: 0, y: -8 }}
          transition={{ duration: 1.2, ease: silk, delay: 0.5 }}
        >
          Scroll
          <motion.span
            className="block h-6 w-px origin-top bg-gradient-to-b from-gold to-transparent"
            animate={{ scaleY: [0.3, 1, 0.3] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
          />
        </motion.a>
      </CardFrame>
    </section>
  )
}
