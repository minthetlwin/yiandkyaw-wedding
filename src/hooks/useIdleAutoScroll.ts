import { useEffect } from 'react'
import { startIdleAutoScroll } from '../lib/idleAutoScroll'
import { usePrefersReducedMotion } from './hooks'

/**
 * Gently auto-scrolls the page after a stretch of no interaction; any input
 * hands control straight back. Off while `enabled` is false (e.g. behind the
 * intro) and entirely for guests who prefer reduced motion.
 */
export function useIdleAutoScroll(enabled: boolean) {
  const reducedMotion = usePrefersReducedMotion()

  useEffect(() => {
    if (!enabled || reducedMotion) return
    return startIdleAutoScroll()
  }, [enabled, reducedMotion])
}
