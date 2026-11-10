import { useEffect, useState } from 'react'
import { wedding, type PaymentMethod } from '../config/wedding'
import { copyText } from '../lib/clipboard'
import { CheckIcon, CopyIcon, DownloadIcon, HeartIcon } from './Icons'
import { SectionHeading } from './ui/Heading'
import { Reveal } from './ui/motion'

export function Gifts() {
  return (
    <section id="gifts" aria-labelledby="gifts-title" className="relative scroll-mt-16 px-5 py-28 sm:px-8 md:py-36">
      <div className="mx-auto max-w-6xl">
      <SectionHeading id="gifts-title" index="04" eyebrow="Wedding gifts" title="With love &" accent="gratitude" titleMy="မင်္ဂလာ လက်ဆောင်" />
      <Reveal className="mx-auto mb-14 max-w-2xl text-center">
        <HeartIcon className="mx-auto mb-4 size-7 text-champagne" />
        <p className="font-serif text-2xl leading-relaxed text-muted">
          Your presence is the greatest gift of all. For those who wish to bless us from near or far, you can send a gift
          through either of the methods below.
        </p>
        <p lang="my" className="mt-3 text-muted">
          ကြွရောက်ချီးမြှင့်ခြင်းသည်ပင် အကြီးမားဆုံးသော လက်ဆောင်ဖြစ်ပါသည်။ ဝေးကွာနေသော မိတ်ဆွေများအတွက်
          အောက်ပါအတိုင်း ပေးပို့နိုင်ပါသည်။
        </p>
      </Reveal>

      <div className="flex flex-wrap justify-center gap-6">
        {wedding.payments.map((m) => (
          <PaymentCard key={m.id} method={m} />
        ))}
      </div>
      </div>
    </section>
  )
}

function PaymentCard({ method }: { method: PaymentMethod }) {
  return (
    <Reveal className="w-full max-w-md">
      <div className="paper-stock relative rounded-[4px] p-8 shadow-[var(--shadow-card)] sm:p-10">
      <span aria-hidden="true" className="gold-leaf pointer-events-none absolute inset-2.5" />
      <span aria-hidden="true" className="gold-leaf pointer-events-none absolute inset-[15px] opacity-50" />
      <header className="mb-5 flex items-center justify-between">
        <h3 className="m-0 font-sans text-xl font-medium" style={{ color: method.brandColor }}>
          {method.provider}
        </h3>
        <span className="eyebrow rounded-full border border-ink/15 px-3 py-1.5 !text-[0.6rem]">Scan to pay</span>
      </header>

      {/* Every provider's QR image is cropped to the same frame; `qr.focus` picks the part that matters. */}
      <div className="aspect-[865/994] overflow-hidden rounded-xl shadow-[var(--shadow-float)]" style={{ background: method.brandColor }}>
        <img
          src={method.qr.src}
          alt={method.qr.alt}
          width={method.qr.width}
          height={method.qr.height}
          loading="lazy"
          decoding="async"
          className="size-full object-cover"
          style={{ objectPosition: method.qr.focus }}
        />
      </div>

      <dl className="my-6 grid grid-cols-[1fr_auto] gap-3">
        <div>
          <dt className="eyebrow !text-[0.6rem] !text-muted">Account name</dt>
          <dd className="m-0 mt-1 text-lg text-ink">{method.accountName}</dd>
        </div>
        <div className="text-right">
          <dt className="eyebrow !text-[0.6rem] !text-muted">Phone</dt>
          <dd className="m-0 mt-1">
            <CopyPhone phone={method.phone} provider={method.provider} />
          </dd>
        </div>
      </dl>

      <a className="btn btn-primary w-full" href={method.qr.src} download={`${method.provider.replace(/\s+/g, '')}-QR.jpg`}>
        <DownloadIcon width={18} height={18} /> Save QR
      </a>
      </div>
    </Reveal>
  )
}

const COPIED_MS = 2_000

/**
 * The wallet number, tap to copy, ready to paste into the payment app. The hint
 * beneath it confirms the copy; if the browser refuses, the digits stay
 * selectable to copy by hand.
 */
function CopyPhone({ phone, provider }: { phone: string; provider: string }) {
  const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle')

  useEffect(() => {
    if (state === 'idle') return
    const id = window.setTimeout(() => setState('idle'), COPIED_MS)
    return () => window.clearTimeout(id)
  }, [state])

  const copied = state === 'copied'
  const Icon = copied ? CheckIcon : CopyIcon

  return (
    <>
      <button
        type="button"
        onClick={async () => setState((await copyText(phone)) ? 'copied' : 'failed')}
        aria-label={`Copy ${provider} phone number ${phone.split('').join(' ')}`}
        className="group -mr-1.5 inline-flex cursor-pointer items-center gap-2 rounded-md border-0 bg-transparent px-1.5 py-0.5 text-lg text-ink tabular-nums transition-colors select-all hover:text-champagne focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-champagne"
      >
        {phone}
        <Icon width={16} height={16} className="text-champagne transition-transform group-active:scale-90" />
      </button>
      <span role="status" className={`block text-xs ${state === 'failed' ? 'text-muted' : 'text-champagne'}`}>
        {copied ? 'Copied' : state === 'failed' ? 'Press and hold to copy' : <span className="text-muted">Tap to copy</span>}
      </span>
    </>
  )
}
