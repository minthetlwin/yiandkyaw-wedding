import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { EMPTY_STATS, rsvpService, type RsvpStats } from '../lib/rsvp'

const REDUCED_MOTION = '(prefers-reduced-motion: reduce)'

export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    (notify) => {
      const mq = window.matchMedia(REDUCED_MOTION)
      mq.addEventListener('change', notify)
      return () => mq.removeEventListener('change', notify)
    },
    () => window.matchMedia(REDUCED_MOTION).matches,
    () => false,
  )
}

export interface Countdown {
  days: number
  hours: number
  minutes: number
  seconds: number
  done: boolean
}

function diff(target: number): Countdown {
  const ms = Math.max(0, target - Date.now())
  const s = Math.floor(ms / 1000)
  return {
    days: Math.floor(s / 86_400),
    hours: Math.floor((s % 86_400) / 3_600),
    minutes: Math.floor((s % 3_600) / 60),
    seconds: s % 60,
    done: ms === 0,
  }
}

export function useCountdown(targetIso: string): Countdown {
  const target = new Date(targetIso).getTime()
  const [state, setState] = useState(() => diff(target))

  useEffect(() => {
    const tick = () => setState(diff(target))
    tick()
    const id = window.setInterval(tick, 1000)
    return () => window.clearInterval(id)
  }, [target])

  return state
}

/** Adds `is-visible` once the element scrolls into view; used for entrance animations. */
export function useReveal<T extends Element>() {
  const ref = useRef<T>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          io.disconnect()
        }
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0.12 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return [ref, visible] as const
}

/** Animates from the previous value to `value` with an ease-out curve. */
export function useAnimatedNumber(value: number, durationMs = 1200): number {
  const [display, setDisplay] = useState(0)
  const fromRef = useRef(0)
  const reduced = usePrefersReducedMotion()

  useEffect(() => {
    const from = fromRef.current
    fromRef.current = value
    if (reduced || from === value) {
      setDisplay(value)
      return
    }
    let raf = 0
    const start = performance.now()
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs)
      const eased = 1 - Math.pow(1 - t, 3)
      setDisplay(Math.round(from + (value - from) * eased))
      if (t < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [value, durationMs, reduced])

  return display
}

const POLL_MS = 30_000

/** Live RSVP totals: loads on mount, refreshes while the tab is visible. */
export function useRsvpStats() {
  const [stats, setStats] = useState<RsvpStats>(EMPTY_STATS)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')

  useEffect(() => {
    const ctrl = new AbortController()
    const refresh = () =>
      rsvpService.getStats(ctrl.signal).then(
        (next) => {
          setStats(next)
          setStatus('ready')
        },
        (err: Error) => {
          if (err.name !== 'AbortError') setStatus((s) => (s === 'ready' ? s : 'error'))
        },
      )

    void refresh()
    if (!rsvpService.isShared) return () => ctrl.abort()

    const id = window.setInterval(() => {
      if (document.visibilityState === 'visible') void refresh()
    }, POLL_MS)
    return () => {
      ctrl.abort()
      window.clearInterval(id)
    }
  }, [])

  return { stats, setStats, status }
}
