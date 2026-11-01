/**
 * Personal invitations. Share the link as `…/?to=Ma%20Su` (any language) and
 * the envelope is addressed to that guest, the card greets them by name and
 * the RSVP form is pre-filled. Without the parameter, the invitation is
 * addressed to everyone.
 *
 * React escapes text, so this is about tidiness, not safety: control
 * characters and markup-ish symbols are dropped, whitespace is collapsed, and
 * the name is capped at a length that still fits on the envelope.
 */
function readGuestName(): string | null {
  try {
    const raw = new URLSearchParams(window.location.search).get('to')
    if (!raw) return null
    const name = raw
      .normalize('NFC')
      .replace(/[\p{Cc}<>{}[\]\\|^`]/gu, '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 40)
    return name.length >= 2 ? name : null
  } catch {
    return null
  }
}

export const guestName = readGuestName()

/** True for Myanmar script, which the Latin display scripts can't set. */
export const isMyanmar = (text: string) => /[က-႟ꩠ-ꩿ]/.test(text)
