import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement>

const base: IconProps = {
  width: 22,
  height: 22,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
}

export const CalendarIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
    <path d="M3.5 10h17M8 3v4M16 3v4" />
  </svg>
)

export const ClockIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2" />
  </svg>
)

export const PinIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11Z" />
    <circle cx="12" cy="10" r="2.4" />
  </svg>
)

export const CopyIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <rect x="8.5" y="8.5" width="11" height="11" rx="2" />
    <path d="M15.5 8.5V6a1.5 1.5 0 0 0-1.5-1.5H6A1.5 1.5 0 0 0 4.5 6v8A1.5 1.5 0 0 0 6 15.5h2.5" />
  </svg>
)

export const CheckIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </svg>
)

export const DownloadIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M12 4v11m0 0-4.5-4.5M12 15l4.5-4.5M5 19.5h14" />
  </svg>
)

export const ChevronIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="m9 5 7 7-7 7" />
  </svg>
)

export const CloseIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
)

export const HeartIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.3a4.3 4.3 0 0 1 7.5 2.5C19.5 15.4 12 20 12 20Z" />
  </svg>
)

export const ArchIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M5.5 20.5V10a6.5 6.5 0 0 1 13 0v10.5M3 20.5h18M9 20.5v-6a3 3 0 0 1 6 0v6" />
  </svg>
)

export const RingsIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <circle cx="9" cy="14.5" r="5.5" />
    <circle cx="15" cy="14.5" r="5.5" />
    <path d="m13.6 5.7 1.4-2.2 1.4 2.2-1.4 1.6Z" />
  </svg>
)

export const CheersIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M5 3.5h5l-.4 4.6a2.1 2.1 0 0 1-4.2 0ZM7.5 10.3v8.2M5.2 18.5h4.6M14 3.5h5l-.4 4.6a2.1 2.1 0 0 1-4.2 0ZM16.5 10.3v8.2M14.2 18.5h4.6" />
  </svg>
)

export const CameraIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <rect x="3" y="7" width="18" height="13" rx="2.5" />
    <circle cx="12" cy="13.5" r="3.6" />
    <path d="m8.5 7 1.4-2.6h4.2L15.5 7" />
  </svg>
)
