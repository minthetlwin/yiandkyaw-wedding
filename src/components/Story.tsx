import { wedding, type Person, type Photo } from '../config/wedding'
import { SectionHeading } from './ui/Heading'
import { Reveal } from './ui/motion'

/** An instant photo: white border, a strip of linen tape, an optional handwritten caption. */
function Polaroid({ photo, caption, focus }: { photo: Photo; caption?: string; focus?: string }) {
  return (
    <figure className="relative m-0 bg-paper p-3 pb-14 shadow-[var(--shadow-card)] sm:p-3.5 sm:pb-16">
      <span
        aria-hidden="true"
        className="absolute -top-3 left-1/2 h-7 w-24 -translate-x-1/2 -rotate-3 border-x border-dashed border-white/60 bg-[rgb(233_224_206/0.82)] shadow-[0_1px_2px_rgb(61_52_40/0.14)]"
      />
      <div className="relative aspect-[4/5] overflow-hidden bg-linen">
        <img
          src={photo.src}
          alt={photo.alt}
          width={photo.width}
          height={photo.height}
          loading="lazy"
          decoding="async"
          style={{ objectPosition: focus }}
          className="h-full w-full object-cover saturate-[0.9]"
        />
        {/* a soft, warm wash, like film left in the sun */}
        <span aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(160deg,rgb(255_244_222/0.22),transparent_45%,rgb(212_175_55/0.08))]" />
      </div>
      {caption && (
        <figcaption className="absolute inset-x-0 bottom-3 text-center font-script text-[1.7rem] leading-none text-ink/75 sm:bottom-4 sm:text-3xl">
          {caption}
        </figcaption>
      )}
    </figure>
  )
}

/** The bride and groom, side by side, with their families. */
function Couple() {
  const people: Person[] = [wedding.groom, wedding.bride]
  return (
    <div className="mx-auto grid max-w-3xl grid-cols-2 gap-5 sm:gap-12">
      {people.map((p, i) => (
        <Reveal key={p.name} delay={i * 0.12} className="text-center">
          <div className={i ? 'rotate-[2.5deg]' : '-rotate-[2.5deg]'}>
            <Polaroid photo={p.portrait} focus={p.portrait.focus} caption={p.short} />
          </div>
          <p className="eyebrow mt-8">
            {p.role} · <span lang="my">{p.roleMy}</span>
          </p>
          <p className="mt-2 font-serif text-xl text-ink sm:text-3xl">{p.name}</p>
          <p lang="my" className="text-sm text-champagne">
            {p.nameMy}
          </p>
          {p.parentsMy && (
            <p lang="my" className="text-xs text-muted sm:text-sm">
              {p.parentsMy}
            </p>
          )}
        </Reveal>
      ))}
    </div>
  )
}

/** "Our story": the bride and groom with their families. */
export function Story() {
  return (
    <section id="story" aria-labelledby="story-title" className="relative scroll-mt-16 px-5 py-28 sm:px-8 md:py-36">
      <div className="mx-auto max-w-5xl">
        <SectionHeading id="story-title" index="03" eyebrow="Our story" title="A love" accent="story" titleMy="ကျွန်ုပ်တို့၏ ချစ်ခြင်းဇာတ်လမ်း" />
        <Couple />
      </div>
    </section>
  )
}
