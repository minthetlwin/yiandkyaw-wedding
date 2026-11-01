import { useEffect } from 'react'
import Lenis from 'lenis'
import 'lenis/dist/lenis.css'
import { usePrefersReducedMotion } from './hooks'

/**
 * Inertial smooth scrolling (Lenis). It drives the native window scroll, so
 * ScrollTrigger and IntersectionObserver keep working unchanged. Paused while
 * `enabled` is false (e.g. behind the intro) and skipped for reduced motion.
 */
export function useSmoothScroll(enabled: boolean) {
  const reducedMotion = usePrefersReducedMotion()

  useEffect(() => {
    if (!enabled || reducedMotion) return
    const lenis = new Lenis({ lerp: 0.085, anchors: { offset: -40 } })
    let raf = requestAnimationFrame(function loop(time) {
      lenis.raf(time)
      raf = requestAnimationFrame(loop)
    })
    return () => {
      cancelAnimationFrame(raf)
      lenis.destroy()
    }
  }, [enabled, reducedMotion])
}
