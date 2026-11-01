import { useEffect, useState } from 'react'
import { wedding, type PaymentMethod } from '../config/wedding'
import { CheckIcon, CopyIcon, DownloadIcon, HeartIcon } from './Icons'
import { SectionHeading } from './ui/Heading'
import { Reveal } from './ui/motion'

export function Gifts() {
  return (
    <section id="gifts" aria-labelledby="gifts-title" className="relative scroll-mt-16 px-5 py-28 sm:px-8 md:py-36">
      <div className="mx-auto max-w-6xl">
      <SectionHeading id="gifts-title" index="08" eyebrow="Wedding gifts" title="With love &" accent="gratitude" titleMy="မင်္ဂလာ လက်ဆောင်" />
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
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return
    const id = window.setTimeout(() => setCopied(false), 2000)
    return () => window.clearTimeout(id)
  }, [copied])

  async function copyName() {
    try {
      await navigator.clipboard.writeText(method.accountName)
      setCopied(true)
    } catch {
      window.prompt('Copy the account name:', method.accountName)
    }
  }

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
          <dt className="eyebrow !text-[0.6rem] !text-muted">Account</dt>
          <dd className="m-0 mt-1 text-lg text-ink tabular-nums">{method.accountHint}</dd>
        </div>
      </dl>

      <div className="grid grid-cols-2 gap-3">
        <a className="btn btn-primary !px-3" href={method.qr.src} download={`${method.provider.replace(/\s+/g, '')}-QR.jpg`}>
          <DownloadIcon width={18} height={18} /> Save QR
        </a>
        <button type="button" className="btn btn-ghost !px-3" onClick={copyName}>
          {copied ? <CheckIcon width={18} height={18} /> : <CopyIcon width={18} height={18} />}
          {copied ? 'Copied' : 'Copy name'}
        </button>
      </div>

      <p className="mt-5 text-center text-sm text-muted">
        On your phone? Save the QR, then in {method.provider} tap <strong className="text-ink">Scan</strong> and choose it from your photos.
      </p>
      <p lang="my" className="mt-1 text-center text-sm text-muted">
        QR ကို သိမ်းဆည်းပြီး {method.provider} ရှိ Scan မှ ဓာတ်ပုံကို ရွေးချယ်၍ ပေးပို့နိုင်ပါသည်။
      </p>
      </div>
    </Reveal>
  )
}
