/**
 * RSVP persistence.
 *
 * Two interchangeable implementations sit behind one interface:
 *  - RemoteRsvpService talks to a Google Apps Script web app backed by a
 *    Google Sheet (see backend/google-apps-script). Used whenever
 *    VITE_RSVP_ENDPOINT is set, so every guest sees the same counter.
 *  - LocalRsvpService keeps responses in localStorage. It exists so the site
 *    works out of the box in development; counts are per-browser only.
 */

export interface RsvpSubmission {
  name: string
  attending: boolean
  guests: number
  message: string
}

export interface RsvpStats {
  /** Total people attending (sum of party sizes). */
  guests: number
  /** Number of responses that said yes. */
  households: number
  /** Number of responses that said no. */
  declined: number
}

export interface RsvpService {
  readonly isShared: boolean
  getStats(signal?: AbortSignal): Promise<RsvpStats>
  submit(entry: RsvpSubmission): Promise<RsvpStats>
}

export const EMPTY_STATS: RsvpStats = { guests: 0, households: 0, declined: 0 }

export class RsvpError extends Error {
  override name = 'RsvpError'
}

function toStats(raw: unknown): RsvpStats {
  const r = (raw ?? {}) as Record<string, unknown>
  const n = (v: unknown) => (Number.isFinite(Number(v)) ? Math.max(0, Math.floor(Number(v))) : 0)
  return { guests: n(r.guests), households: n(r.households), declined: n(r.declined) }
}

function tally(entries: readonly RsvpSubmission[]): RsvpStats {
  return entries.reduce<RsvpStats>(
    (acc, e) =>
      e.attending
        ? { ...acc, guests: acc.guests + e.guests, households: acc.households + 1 }
        : { ...acc, declined: acc.declined + 1 },
    EMPTY_STATS,
  )
}

class RemoteRsvpService implements RsvpService {
  readonly isShared = true
  private readonly endpoint: string

  constructor(endpoint: string) {
    this.endpoint = endpoint
  }

  async getStats(signal?: AbortSignal): Promise<RsvpStats> {
    const res = await fetch(`${this.endpoint}?action=stats`, { signal })
    if (!res.ok) throw new RsvpError(`Could not load RSVP count (${res.status})`)
    return toStats(await res.json())
  }

  async submit(entry: RsvpSubmission): Promise<RsvpStats> {
    // text/plain keeps this a "simple" CORS request, which Apps Script requires
    // (it cannot answer preflight OPTIONS requests).
    const res = await fetch(this.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(entry),
    })
    if (!res.ok) throw new RsvpError(`Could not send RSVP (${res.status})`)
    const body = (await res.json()) as { ok?: boolean; error?: string; stats?: unknown }
    if (!body.ok) throw new RsvpError(body.error ?? 'Could not send RSVP')
    return toStats(body.stats)
  }
}

class LocalRsvpService implements RsvpService {
  readonly isShared = false
  private static readonly KEY = 'yk-wedding:rsvps'

  private read(): RsvpSubmission[] {
    try {
      const parsed: unknown = JSON.parse(localStorage.getItem(LocalRsvpService.KEY) ?? '[]')
      return Array.isArray(parsed) ? (parsed as RsvpSubmission[]) : []
    } catch {
      return []
    }
  }

  async getStats(): Promise<RsvpStats> {
    return tally(this.read())
  }

  async submit(entry: RsvpSubmission): Promise<RsvpStats> {
    const entries = [...this.read(), entry]
    try {
      localStorage.setItem(LocalRsvpService.KEY, JSON.stringify(entries))
    } catch {
      throw new RsvpError('Your browser blocked saving the RSVP')
    }
    return tally(entries)
  }
}

function createRsvpService(): RsvpService {
  const endpoint = import.meta.env.VITE_RSVP_ENDPOINT?.trim()
  if (endpoint) return new RemoteRsvpService(endpoint)
  if (import.meta.env.PROD) {
    console.warn(
      '[rsvp] VITE_RSVP_ENDPOINT is not set; RSVPs are stored only in this browser. ' +
        'See backend/google-apps-script/README.md.',
    )
  }
  return new LocalRsvpService()
}

export const rsvpService: RsvpService = createRsvpService()

/** Validates and normalises user input. Returns an error message or the clean entry. */
export function validateSubmission(
  input: RsvpSubmission,
  maxGuests: number,
): { ok: true; value: RsvpSubmission } | { ok: false; error: string } {
  const name = input.name.trim().replace(/\s+/g, ' ')
  if (name.length < 2) return { ok: false, error: 'Please enter your name.' }
  if (name.length > 80) return { ok: false, error: 'Name is too long.' }

  const guests = input.attending ? Math.floor(input.guests) : 0
  if (input.attending && (guests < 1 || guests > maxGuests)) {
    return { ok: false, error: `Party size must be between 1 and ${maxGuests}.` }
  }

  return {
    ok: true,
    value: { name, attending: input.attending, guests, message: input.message.trim().slice(0, 500) },
  }
}
