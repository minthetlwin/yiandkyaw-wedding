import { wedding } from '../config/wedding'

/**
 * Background music: one shared audio element, driven from anywhere.
 *
 * Browsers only let a page make sound from inside a user gesture, so `start()`
 * must be called synchronously from a tap handler (the envelope's seal), never
 * from a timer or effect. Everything else (fades, tab visibility) lives here so
 * components just read `status` and call `toggle()`.
 *
 * Every visit starts fresh: opening the envelope always plays the song from the
 * beginning. Turning it off lasts for that visit only.
 */

export type MusicStatus =
  /** Not playing yet: waiting for the guest's tap (or the browser refused to start it). */
  | 'idle'
  | 'playing'
  /** Off, by the guest's choice. */
  | 'paused'
  /** The file is missing or can't be decoded: the control hides itself. */
  | 'unavailable'

interface MusicState {
  status: MusicStatus
}

const FADE_IN_MS = 3000
const FADE_OUT_MS = 600

const { src, volume } = wedding.music

let audio: HTMLAudioElement | null = null
let state: MusicState = { status: 'idle' }
let fadeFrame = 0
const listeners = new Set<() => void>()

function setStatus(status: MusicStatus) {
  if (state.status === status) return
  state = { status }
  listeners.forEach((notify) => notify())
}

// Earlier versions remembered "off" across visits; clear it so no one stays silent.
try {
  localStorage.removeItem('yk-wedding:music-off')
} catch {
  /* storage unavailable: nothing to clear */
}

function element() {
  if (audio) return audio
  const a = new Audio(src)
  a.loop = true
  a.preload = 'auto'
  a.volume = 0
  // A 404 (or a non-audio response) lands here: hide the control rather than show a dead one.
  a.addEventListener('error', () => setStatus('unavailable'))
  audio = a
  return a
}

/** Ramps the volume linearly. Cancels any fade in progress; resolves when done or cancelled. */
function fade(to: number, ms: number) {
  cancelAnimationFrame(fadeFrame)
  const a = element()
  const from = a.volume
  const t0 = performance.now()
  return new Promise<void>((resolve) => {
    const step = (now: number) => {
      // rAF's timestamp can be a hair earlier than t0, and the browser throws on a
      // volume outside [0, 1] (which would kill the fade and leave the song silent).
      const k = Math.min(1, Math.max(0, (now - t0) / ms))
      a.volume = Math.min(1, Math.max(0, from + (to - from) * k))
      if (k < 1) fadeFrame = requestAnimationFrame(step)
      else resolve()
    }
    fadeFrame = requestAnimationFrame(step)
  })
}

async function play() {
  const a = element()
  try {
    await a.play() // called synchronously, so it still counts as part of the tap
  } catch {
    // Either the browser blocked it or the file is bad (the 'error' listener covers that).
    // Back to idle, so the button invites a tap rather than looking switched off.
    if (state.status !== 'unavailable') setStatus('idle')
    return
  }
  setStatus('playing')
  void fade(volume, FADE_IN_MS)
}

/** Begins buffering so the music starts the instant the guest taps. Safe to call repeatedly. */
export function prepareMusic() {
  if (!src) return setStatus('unavailable')
  element().load()
}

/** Call synchronously from a user gesture (the seal tap). Always starts the song from the top. */
export function startMusic() {
  if (!src || state.status !== 'idle') return
  element().currentTime = 0
  void play()
}

export function toggleMusic() {
  if (state.status === 'playing') {
    setStatus('paused')
    const a = element()
    void fade(0, FADE_OUT_MS).then(() => {
      // Ignore if the guest turned it back on during the fade.
      if (state.status === 'paused') a.pause()
    })
  } else if (state.status === 'idle' || state.status === 'paused') {
    void play()
  }
}

export const music = {
  subscribe(notify: () => void) {
    listeners.add(notify)
    return () => void listeners.delete(notify)
  },
  getSnapshot: () => state,
}

// Silence while the tab is hidden (a phone locked, another tab in front), and pick up where we left off.
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (!audio || state.status !== 'playing') return
    if (document.hidden) audio.pause()
    else void audio.play().catch(() => setStatus('idle'))
  })
}
