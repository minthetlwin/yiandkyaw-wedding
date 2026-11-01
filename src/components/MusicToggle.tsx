import { motion } from 'motion/react'
import { useSyncExternalStore } from 'react'
import { music, toggleMusic } from '../lib/music'

const BARS = [0.55, 1, 0.7]

/** The sound control: a small equalizer that dances while music plays, and rests flat, struck through, when it doesn't. */
export function MusicToggle() {
  const { status } = useSyncExternalStore(music.subscribe, music.getSnapshot)
  if (status === 'unavailable') return null
  const playing = status === 'playing'

  return (
    <button
      type="button"
      onClick={toggleMusic}
      aria-pressed={playing}
      aria-label={playing ? 'Turn the music off' : 'Turn the music on'}
      className="fixed right-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-30 grid size-11 cursor-pointer place-items-center rounded-full border border-gold/40 bg-paper/80 text-champagne shadow-[var(--shadow-float)] backdrop-blur transition-colors hover:border-champagne"
    >
      <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
        {BARS.map((peak, i) => (
          <motion.path
            key={i}
            d={`M${8 + i * 4} 12v0`}
            // Each bar is a vertical stroke scaled around the icon's centre line.
            style={{ originY: '12px', transformBox: 'fill-box' }}
            animate={playing ? { d: [`M${8 + i * 4} 12v0`, `M${8 + i * 4} ${12 - 7 * peak}v${14 * peak}`, `M${8 + i * 4} 10v4`] } : { d: `M${8 + i * 4} 10.5v3` }}
            transition={playing ? { duration: 0.9 + i * 0.25, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' } : { duration: 0.3 }}
          />
        ))}
        <motion.path d="M4.5 4.5l15 15" initial={false} animate={{ pathLength: playing ? 0 : 1, opacity: playing ? 0 : 1 }} transition={{ duration: 0.3 }} />
      </svg>
    </button>
  )
}
