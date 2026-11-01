import { wedding } from '../config/wedding'
import { Reveal } from './ui/motion'
import { FeatherDivider } from './ui/Ornaments'

export function Footer() {
  const { bride, groom, hashtag } = wedding
  return (
    <footer className="relative overflow-hidden bg-[linear-gradient(180deg,transparent,var(--color-linen)_28%)] px-5 pt-28 pb-[calc(3.5rem+env(safe-area-inset-bottom))] text-center text-ink">
      <Reveal>
        <p className="eyebrow">With all our love</p>
        <p className="gold-text mt-6 inline-block px-[0.2em] font-script text-[clamp(4.5rem,14vw,9rem)] leading-[1]">Thank you</p>
        <p className="mt-4 font-serif text-2xl font-light text-muted italic">for being part of our story</p>
        <p lang="my" className="mt-2 text-muted">
          ချစ်ခြင်းမေတ္တာဖြင့် ကျေးဇူးတင်ပါသည်။
        </p>
        <FeatherDivider className="mt-14" />
        <p className="mt-6 font-script text-5xl">
          {bride.short} <span className="text-champagne">&amp;</span> {groom.short}
        </p>
        <p className="eyebrow mt-3">28 · 11 · 2026 &nbsp;·&nbsp; {hashtag}</p>
      </Reveal>
    </footer>
  )
}
