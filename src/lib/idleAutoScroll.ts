/**
 * Idle auto-scroll: an unhurried tour of the invitation for a guest who has
 * stopped to look.
 *
 * Once the guest has been still for `idleMs`, the page glides downward at a
 * viewport-relative pace, easing in from rest and braking smoothly as it nears
 * the end. Any sign of the guest (a wheel, touch, key, click, real pointer
 * movement, or a scroll we didn't make) hands control straight back, and the
 * idle clock starts over.
 *
 * It writes the native window scroll, so Lenis (which re-syncs from native
 * scroll whenever it isn't animating), ScrollTrigger and IntersectionObserver
 * all follow along unchanged.
 */

export interface IdleAutoScrollOptions {
  /** Stillness before the tour begins. */
  idleMs?: number
  /** Cruising speed, in viewport heights per second. */
  speed?: number
  /** Time to ease from rest up to cruising speed. */
  rampMs?: number
  /** Distance from the end over which it brakes to a stop, in viewport heights. */
  settle?: number
}

const DEFAULTS: Required<IdleAutoScrollOptions> = {
  idleMs: 8_000,
  speed: 1 / 22,
  rampMs: 1_600,
  settle: 0.4,
}

/** Pointer travel that counts as the guest moving; ignores jitter and scroll-induced synthetic moves. */
const POINTER_SLOP_PX = 6
/** Difference between where we put the page and where it is that means someone else scrolled it. */
const DRIFT_PX = 2
/** Caps a frame's step after a stall (a busy main thread, a backgrounded tab). */
const MAX_FRAME_MS = 64

const ACTIVITY_EVENTS = ['wheel', 'touchstart', 'pointerdown', 'keydown'] as const

const easeInOutSine = (t: number) => (1 - Math.cos(Math.PI * t)) / 2

const maxScroll = () => document.documentElement.scrollHeight - window.innerHeight

/** Typing, choosing, or reading a highlighted passage: never move the page out from under that. */
function isGuestEngaged(): boolean {
  const el = document.activeElement
  if (el instanceof HTMLElement && (el.isContentEditable || el.matches('input, textarea, select'))) return true
  const selection = document.getSelection()
  return !!selection && !selection.isCollapsed
}

function canTour(): boolean {
  return (
    document.visibilityState === 'visible' &&
    !document.querySelector('dialog[open]') &&
    !isGuestEngaged() &&
    maxScroll() - window.scrollY > 1
  )
}

/** Starts watching for idleness. Returns a function that tears everything down. */
export function startIdleAutoScroll(options: IdleAutoScrollOptions = {}): () => void {
  const { idleMs, speed, rampMs, settle } = { ...DEFAULTS, ...options }
  const listeners = new AbortController()
  const on = { passive: true, capture: true, signal: listeners.signal } as const

  let lastActivity = performance.now()
  let idleTimer = 0
  let frame = 0
  let startedAt = 0
  let lastFrame = 0
  /** Sub-pixel position, kept ahead of the browser's rounding so slow speeds stay smooth. */
  let position = 0
  /** Where the browser actually put the page on our last write. */
  let written = 0
  let pointer: { x: number; y: number } | null = null

  // One timer, rescheduled only when it fires: activity just stamps the clock,
  // so a stream of pointer moves costs nothing.
  const checkIdle = () => {
    const wait = lastActivity + idleMs - performance.now()
    if (wait > 0) {
      idleTimer = window.setTimeout(checkIdle, wait)
    } else if (canTour()) {
      begin()
    } else {
      // Not a good moment (form focused, lightbox open, at the end). Look again later.
      lastActivity = performance.now()
      idleTimer = window.setTimeout(checkIdle, idleMs)
    }
  }

  const begin = () => {
    position = written = window.scrollY
    startedAt = lastFrame = performance.now()
    frame = requestAnimationFrame(tick)
  }

  const halt = () => {
    cancelAnimationFrame(frame)
    frame = 0
    window.clearTimeout(idleTimer)
    idleTimer = window.setTimeout(checkIdle, idleMs)
  }

  const activity = () => {
    lastActivity = performance.now()
    if (frame) halt()
  }

  const tick = (now: number) => {
    // Something other than us moved the page (a scrollbar drag, find-in-page, an anchor): yield.
    if (Math.abs(window.scrollY - written) > DRIFT_PX) return activity()

    const end = maxScroll()
    const remaining = end - position
    if (remaining < 0.5) return activity()

    const dt = Math.min(now - lastFrame, MAX_FRAME_MS)
    lastFrame = now
    const vh = window.innerHeight
    const rampIn = easeInOutSine(Math.min(1, (now - startedAt) / rampMs))
    // v ∝ √distance is constant deceleration: a natural stop that arrives in finite time.
    const brake = Math.sqrt(Math.min(1, remaining / (settle * vh)))
    const velocity = speed * vh * rampIn * brake

    position = Math.min(end, position + (velocity * dt) / 1000)
    window.scrollTo({ top: position, behavior: 'instant' })
    written = window.scrollY
    frame = requestAnimationFrame(tick)
  }

  for (const type of ACTIVITY_EVENTS) window.addEventListener(type, activity, on)

  // Mouse and pen only (touch is covered by touchstart), and only real travel.
  window.addEventListener(
    'pointermove',
    (e) => {
      if (e.pointerType === 'touch') return
      if (pointer && Math.hypot(e.screenX - pointer.x, e.screenY - pointer.y) < POINTER_SLOP_PX) return
      pointer = { x: e.screenX, y: e.screenY }
      activity()
    },
    on,
  )

  // While touring, drift is judged per frame in `tick`. Otherwise any scroll, Lenis's
  // inertial glide included, means the guest is moving, so the clock waits for it to settle.
  window.addEventListener(
    'scroll',
    () => {
      if (!frame) activity()
    },
    on,
  )

  // Leaving the tab ends the tour. Coming back starts a fresh idle period instead of an abrupt resume.
  document.addEventListener('visibilitychange', activity, { signal: listeners.signal })

  idleTimer = window.setTimeout(checkIdle, idleMs)

  return () => {
    listeners.abort()
    window.clearTimeout(idleTimer)
    cancelAnimationFrame(frame)
  }
}
