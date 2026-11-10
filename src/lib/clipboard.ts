/**
 * Copies text to the clipboard. Resolves true on success.
 *
 * Tries the async Clipboard API first. In-app browsers (Messenger, Viber,
 * Instagram), where invitation links are usually opened, often block it, so
 * it falls back to a selected, off-screen textarea and `execCommand`.
 */
export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    // Permission denied or unsupported: try the legacy path.
  }
  return legacyCopy(text)
}

function legacyCopy(text: string): boolean {
  const field = document.createElement('textarea')
  field.value = text
  field.setAttribute('readonly', '')
  // Off-screen and at a 16px font size, so iOS neither scrolls nor zooms to it.
  field.style.cssText = 'position:fixed;top:0;left:-9999px;font-size:16px;opacity:0'
  const previousFocus = document.activeElement as HTMLElement | null
  document.body.append(field)
  field.select()
  field.setSelectionRange(0, text.length)
  try {
    return document.execCommand('copy')
  } catch {
    return false
  } finally {
    field.remove()
    previousFocus?.focus({ preventScroll: true })
  }
}
