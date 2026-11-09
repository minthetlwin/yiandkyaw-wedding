import { AnimatePresence, motion } from 'motion/react'
import { useSyncExternalStore } from 'react'
import { music, toggleMusic } from '../lib/music'

const BARS = [0.55, 1, 0.7]

/**
 * The sound control, present from the envelope onward and above everything
 * (the intro, the feather layer). Opening the envelope starts the music; this
 * is the guest's way to start or pause it at any moment.
 *
 *   idle     not playing yet ("Play music", with a soft gold pulse); also where
 *            it returns if the browser refuses to play (some battery savers do)
 *   playing  a small equalizer, dancing
 *   paused   the guest turned it off: the equalizer at rest, struck through
 */
export function MusicToggle() {
  const { status } = useSyncExternalStore(music.subscribe, music.getSnapshot)
  if (status === 'unavailable') return null
  const playing = status === 'playing'
  const inviting = status === 'idle'

  return (
    <button
      type="button"
      onClick={toggleMusic}
      aria-pressed={playing}
      aria-label={playing ? 'Pause the music' : 'Play the music'}
      title={playing ? 'Pause music' : 'Play music'}
      className="fixed right-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-[70] grid size-11 cursor-pointer place-items-center rounded-full border border-gold/50 bg-paper/85 text-champagne shadow-[var(--shadow-float)] backdrop-blur transition-colors hover:border-champagne"
    >
      {/* A soft gold pulse invites the first tap. */}
      <AnimatePresence>
        {inviting && (
          <motion.span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 rounded-full border border-gold"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.7, 0], scale: [1, 1.6] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeOut' }}
          />
        )}
      </AnimatePresence>
      <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
        {BARS.map((peak, i) => {
          const x = 8 + i * 4
          return (
            <motion.path
              key={i}
              initial={false}
              animate={playing ? { d: [`M${x} 12v0`, `M${x} ${12 - 7 * peak}v${14 * peak}`, `M${x} 10v4`] } : { d: `M${x} ${12 - 2.5 * peak}v${5 * peak}` }}
              transition={playing ? { duration: 0.9 + i * 0.25, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' } : { duration: 0.3 }}
            />
          )
        })}
        <motion.path
          d="M4.5 4.5l15 15"
          initial={false}
          animate={{ pathLength: status === 'paused' ? 1 : 0, opacity: status === 'paused' ? 1 : 0 }}
          transition={{ duration: 0.3 }}
        />
      </svg>
    </button>
  )
}
