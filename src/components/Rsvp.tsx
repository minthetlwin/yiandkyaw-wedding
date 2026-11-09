import { AnimatePresence, motion } from 'motion/react'
import { useId, useState, type FormEvent } from 'react'
import { wedding } from '../config/wedding'
import { useAnimatedNumber, useRsvpStats } from '../hooks/hooks'
import { guestName } from '../lib/guest'
import { rsvpService, validateSubmission, type RsvpSubmission } from '../lib/rsvp'
import { HeartIcon } from './Icons'
import { HeartBurst } from './ui/HeartBurst'
import { SectionHeading } from './ui/Heading'
import { Reveal } from './ui/motion'
import { silk } from './ui/variants'

const MY_RSVP_KEY = 'yk-wedding:my-rsvp'

const EMPTY_FORM: RsvpSubmission = { name: guestName ?? '', attending: true, guests: 1, message: '' }

function loadMyRsvp(): RsvpSubmission | null {
  try {
    return JSON.parse(localStorage.getItem(MY_RSVP_KEY) ?? 'null') as RsvpSubmission | null
  } catch {
    return null
  }
}

const deadline = new Date(`${wedding.rsvp.deadline}T23:59:59+06:30`).toLocaleDateString('en-GB', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: wedding.event.timeZone,
})

const CHOICES = [
  { value: true, label: 'Joyfully accept', labelMy: 'တက်ရောက်ပါမည်' },
  { value: false, label: 'Regretfully decline', labelMy: 'မတက်ရောက်နိုင်ပါ' },
] as const

export function Rsvp() {
  const { stats, setStats, status } = useRsvpStats()
  const [form, setForm] = useState<RsvpSubmission>(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState<RsvpSubmission | null>(loadMyRsvp)
  const id = useId()

  const update = <K extends keyof RsvpSubmission>(key: K, value: RsvpSubmission[K]) =>
    setForm((f) => ({ ...f, [key]: value }))

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    // Honeypot: real people never see or fill this field.
    if (new FormData(e.currentTarget).get('company')) return

    const result = validateSubmission(form, wedding.rsvp.maxGuestsPerResponse)
    if (!result.ok) {
      setError(result.error)
      return
    }

    setSubmitting(true)
    setError(null)
    try {
      setStats(await rsvpService.submit(result.value))
      setSubmitted(result.value)
      setForm({ ...EMPTY_FORM, name: '' }) // the next reply is for someone else
      try {
        localStorage.setItem(MY_RSVP_KEY, JSON.stringify(result.value))
      } catch {
        /* non-essential */
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section id="rsvp" aria-labelledby="rsvp-title" className="section-wash relative scroll-mt-16 px-5 py-28 sm:px-8 md:py-36">
      <div className="mx-auto grid max-w-6xl gap-16 md:grid-cols-[0.85fr_1.15fr]">
      <div>
      <SectionHeading id="rsvp-title" index="07" eyebrow="Kindly reply" title="Will you" accent="join us?" align="left" titleMy="တက်ရောက်မည်ဆိုပါက အသိပေးပါ" />
      <Reveal className="max-w-md">
        <p className="font-serif text-2xl leading-relaxed text-muted">
          Please let us know by <strong className="font-medium text-champagne">{deadline}</strong> so we can prepare a seat for you.
        </p>
      </Reveal>

      <Reveal className="mt-10 flex flex-wrap gap-4" delay={0.1}>
        <div className="contents" aria-live="polite" aria-busy={status === 'loading'}>
          <Stat value={stats.guests} label="Guests attending" labelMy="တက်ရောက်မည့် ဧည့်သည်" />
          <Stat value={stats.households} label="Confirmed replies" labelMy="အတည်ပြုပြီး" />
        </div>
        {!rsvpService.isShared && <p className="basis-full text-xs text-muted">Preview mode — counts are saved in this browser only.</p>}
        {status === 'error' && <p className="basis-full text-xs text-muted">Couldn’t load the latest count.</p>}
      </Reveal>
      </div>

      <Reveal delay={0.15}>
        <div className="paper-stock relative overflow-hidden rounded-[4px] px-7 py-12 shadow-[var(--shadow-card)] sm:px-14 sm:py-16">
        <span aria-hidden="true" className="gold-leaf pointer-events-none absolute inset-2.5 sm:inset-3.5" />
        <span aria-hidden="true" className="gold-leaf pointer-events-none absolute inset-[15px] opacity-50 sm:inset-[19px]" />
        <AnimatePresence mode="wait" initial={false}>
          {submitted ? (
            <Thanks key="thanks" entry={submitted} onAgain={() => setSubmitted(null)} />
          ) : (
            <motion.form
              key="form"
              onSubmit={onSubmit}
              noValidate
              className="grid gap-6"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16, filter: 'blur(4px)' }}
              transition={{ duration: 0.6, ease: silk }}
            >
              <fieldset className="m-0 grid gap-3 border-0 p-0 sm:grid-cols-2">
                <legend className="eyebrow mb-3">Will you attend?</legend>
                {CHOICES.map((o) => {
                  const selected = form.attending === o.value
                  return (
                    <label
                      key={String(o.value)}
                      className={`relative grid cursor-pointer gap-0.5 rounded-2xl border p-4 text-center transition has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-champagne ${
                        selected ? 'border-champagne bg-champagne text-paper shadow-[0_12px_30px_-14px_rgb(139_107_32/0.7)]' : 'border-ink/15 bg-transparent hover:border-champagne/50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="attending"
                        checked={selected}
                        onChange={() => update('attending', o.value)}
                        className="pointer-events-none absolute opacity-0"
                      />
                      <span className={`font-serif text-xl ${selected ? 'text-paper' : 'text-ink'}`}>{o.label}</span>
                      <span lang="my" className={`text-sm ${selected ? 'text-paper/80' : 'text-muted'}`}>
                        {o.labelMy}
                      </span>
                    </label>
                  )
                })}
              </fieldset>

              {/* Name and party size share a row; the party size folds away for a "decline". */}
              <div className="relative grid gap-4 sm:grid-cols-2">
                <label className={`grid gap-2 ${form.attending ? '' : 'sm:col-span-2'}`}>
                  <span className="text-sm font-medium text-muted">Your name *</span>
                  <input
                    className="field"
                    value={form.name}
                    onChange={(e) => update('name', e.target.value)}
                    autoComplete="name"
                    maxLength={80}
                    required
                    aria-describedby={error ? `${id}-error` : undefined}
                  />
                </label>
                {/* popLayout lifts the leaving field out of the grid, so the name can widen without a jump. */}
                <AnimatePresence initial={false} mode="popLayout">
                  {form.attending && (
                    <motion.label
                      className="grid gap-2 overflow-hidden"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.4, ease: silk }}
                    >
                      <span className="text-sm font-medium text-muted">Number of guests (including you)</span>
                      <select className="field" value={form.guests} onChange={(e) => update('guests', Number(e.target.value))}>
                        {Array.from({ length: wedding.rsvp.maxGuestsPerResponse }, (_, i) => i + 1).map((n) => (
                          <option key={n} value={n}>
                            {n} {n === 1 ? 'person' : 'people'}
                          </option>
                        ))}
                      </select>
                    </motion.label>
                  )}
                </AnimatePresence>
              </div>

              <label className="grid gap-2">
                <span className="text-sm font-medium text-muted">Wishes for the couple (optional)</span>
                <textarea
                  className="field resize-y"
                  rows={3}
                  value={form.message}
                  onChange={(e) => update('message', e.target.value)}
                  maxLength={500}
                  placeholder="Share a blessing or a sweet memory…"
                />
              </label>

              <input type="text" name="company" tabIndex={-1} autoComplete="off" className="sr-only" aria-hidden="true" />

              {error && (
                <p id={`${id}-error`} role="alert" className="m-0 rounded-xl border border-champagne/25 bg-champagne/5 px-4 py-3 text-sm text-champagne">
                  {error}
                </p>
              )}

              <button type="submit" className="btn btn-primary w-full" disabled={submitting}>
                {submitting ? 'Sending…' : 'Send RSVP'}
              </button>
            </motion.form>
          )}
        </AnimatePresence>
        </div>
      </Reveal>
      </div>
    </section>
  )
}

function Thanks({ entry, onAgain }: { entry: RsvpSubmission; onAgain: () => void }) {
  return (
    <motion.div
      role="status"
      className="relative grid justify-items-center text-center"
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8, ease: silk }}
    >
      <div className="absolute top-8 left-1/2">
        <HeartBurst />
      </div>

      <motion.span
        className="grid size-16 place-items-center rounded-full bg-champagne text-paper"
        initial={{ scale: 0.4 }}
        animate={{ scale: [0.4, 1.12, 1] }}
        transition={{ duration: 0.9, ease: silk }}
      >
        <HeartIcon width={30} height={30} fill="currentColor" />
      </motion.span>

      <h3 className="mt-6 font-script text-5xl leading-tight text-champagne">
        {entry.attending ? 'We can’t wait to celebrate with you!' : 'You’ll be in our hearts'}
      </h3>
      <p className="mt-3 max-w-md font-serif text-xl text-muted">
        Thank you, {entry.name}.{' '}
        {entry.attending
          ? entry.guests > 1
            ? `We’ve saved a place for your party of ${entry.guests}.`
            : 'We’ve saved a place for you.'
          : 'We’re so grateful for your love and wishes.'}
      </p>
      <p lang="my" className="mt-2 text-muted">
        {entry.attending ? 'သင်နှင့်အတူ ပျော်ရွှင်စွာ ဆင်နွှဲရန် စောင့်မျှော်နေပါသည်။' : 'ကျေးဇူးအထူးတင်ပါသည်။'}
      </p>
      <button type="button" className="btn btn-ghost mt-8" onClick={onAgain}>
        RSVP for someone else
      </button>
    </motion.div>
  )
}

function Stat({ value, label, labelMy }: { value: number; label: string; labelMy: string }) {
  const display = useAnimatedNumber(value)
  return (
    <div className="grid min-w-36 flex-1 basis-36 gap-0.5 border-l border-champagne/30 pl-5 sm:max-w-52">
      <span className="font-serif text-7xl leading-none font-light text-champagne tabular-nums">{display}</span>
      <span className="eyebrow mt-3 !text-ink">{label}</span>
      <span lang="my" className="mt-1 text-sm text-muted">
        {labelMy}
      </span>
    </div>
  )
}
