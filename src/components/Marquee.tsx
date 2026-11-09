import { wedding } from '../config/wedding'

/** A small four-point gold star, the glint between phrases. */
function Glint() {
  return (
    <svg viewBox="0 0 24 24" className="size-4 shrink-0 text-gold md:size-5" aria-hidden="true">
      <path d="M12 0c.6 6.2 5.8 11.4 12 12-6.2.6-11.4 5.8-12 12-.6-6.2-5.8-11.4-12-12C6.2 11.4 11.4 6.2 12 0Z" fill="currentColor" />
    </svg>
  )
}

/** Slow, endless band of type between gold hairlines; its ends dissolve into the page. Duplicated so the loop is seamless. */
export function Marquee() {
  const item = (
    <span className="flex shrink-0 items-center gap-10 pr-10 md:gap-14 md:pr-14">
      <span className="font-display text-5xl leading-none text-ink md:text-7xl">
        {wedding.groom.short} <span className="font-serif text-[0.7em] text-champagne italic">&amp;</span> {wedding.bride.short}
      </span>
      <Glint />
      <span className="font-serif text-4xl font-light tracking-[0.18em] text-ink/80 md:text-6xl">28 · 11 · 2026</span>
      <Glint />
      <span className="font-serif text-4xl font-light text-champagne italic md:text-6xl">Forever begins</span>
      <Glint />
    </span>
  )
  return (
    <div className="relative overflow-hidden py-10 [mask-image:linear-gradient(90deg,transparent,#000_12%,#000_88%,transparent)]" aria-hidden="true">
      <span className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/50 to-transparent" />
      <span className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-gold/50 to-transparent" />
      <div className="animate-marquee flex w-max">
        {item}
        {item}
        {item}
        {item}
      </div>
    </div>
  )
}
