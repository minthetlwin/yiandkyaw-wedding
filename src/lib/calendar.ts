import { wedding } from '../config/wedding'

/** Formats a date as an iCalendar / Google Calendar UTC timestamp: 20261128T063000Z */
const toUtcStamp = (iso: string) => new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')

const title = `${wedding.groom.short} & ${wedding.bride.short}'s Wedding`
const location = `${wedding.venue.name}, ${wedding.venue.address}`
const details = `Join us to celebrate the wedding of ${wedding.groom.name} and ${wedding.bride.name}.`

export function googleCalendarUrl(): string {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${toUtcStamp(wedding.event.start)}/${toUtcStamp(wedding.event.end)}`,
    details,
    location,
    ctz: wedding.event.timeZone,
  })
  return `https://calendar.google.com/calendar/render?${params}`
}

const escapeIcs = (s: string) => s.replace(/\\/g, '\\\\').replace(/([,;])/g, '\\$1').replace(/\n/g, '\\n')

/** Triggers a download of an .ics file, which Apple Calendar and Outlook open natively. */
export function downloadIcs(): void {
  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//kyawandshwe//wedding//EN',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:wedding-${toUtcStamp(wedding.event.start)}@kyawandshwe`,
    `DTSTAMP:${toUtcStamp(new Date().toISOString())}`,
    `DTSTART:${toUtcStamp(wedding.event.start)}`,
    `DTEND:${toUtcStamp(wedding.event.end)}`,
    `SUMMARY:${escapeIcs(title)}`,
    `DESCRIPTION:${escapeIcs(details)}`,
    `LOCATION:${escapeIcs(location)}`,
    'BEGIN:VALARM',
    'TRIGGER:-P1D',
    'ACTION:DISPLAY',
    `DESCRIPTION:${escapeIcs(title)} is tomorrow`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')

  const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar;charset=utf-8' }))
  const a = Object.assign(document.createElement('a'), { href: url, download: 'kyaw-and-shwe-wedding.ics' })
  a.click()
  URL.revokeObjectURL(url)
}

export const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(wedding.venue.mapQuery)}`
export const mapsEmbedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(wedding.venue.mapQuery)}&z=16&output=embed`
