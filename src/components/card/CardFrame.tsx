import type { ReactNode, Ref } from 'react'
import { CornerAccent } from '../ui/Ornaments'

const CORNERS = [
  'top-[var(--inset)] left-[var(--inset)]',
  'top-[var(--inset)] right-[var(--inset)] -scale-x-100',
  'bottom-[var(--inset)] left-[var(--inset)] -scale-y-100',
  'bottom-[var(--inset)] right-[var(--inset)] -scale-100',
]

interface CardFrameProps {
  children?: ReactNode
  className?: string
  ref?: Ref<HTMLDivElement>
}

/**
 * The printed invitation card: white cotton stock, a double gold-leaf border
 * and feathered corner sprigs. Everything is inset from the edges, so the
 * frame stays true at any size — the letter in the envelope and the homepage
 * hero are the same card, just larger.
 */
export function CardFrame({ children, className = '', ref }: CardFrameProps) {
  return (
    <div
      ref={ref}
      className={`paper-stock relative overflow-hidden rounded-[4px] shadow-[var(--shadow-card)] [--inset:10px] sm:[--inset:16px] ${className}`}
    >
      <span className="gold-leaf pointer-events-none absolute inset-[var(--inset)]" aria-hidden="true" />
      <span className="gold-leaf pointer-events-none absolute inset-[calc(var(--inset)+5px)] opacity-60" aria-hidden="true" />
      {CORNERS.map((pos) => (
        <CornerAccent
          key={pos}
          className={`pointer-events-none absolute size-16 p-1.5 text-champagne-soft sm:size-24 md:size-28 ${pos}`}
        />
      ))}
      {children}
    </div>
  )
}
