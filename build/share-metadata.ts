/**
 * Link-preview metadata, generated at build time from src/config/share.ts.
 *
 * Chat apps and social sites fetch the page without running JavaScript, so
 * every tag must be in the static HTML, and every URL in it absolute. This
 * plugin writes the full set once, so no platform's tags fall out of step:
 *
 *   Open Graph   Facebook, Messenger, WhatsApp, Viber, Telegram, LinkedIn,
 *                Slack, Discord, LINE, iMessage (Apple's LinkPresentation)
 *   Twitter/X    twitter:* (X ignores og:image alone for large cards)
 *   Apple        apple-touch-icon (iMessage's site icon, iOS home screen)
 *   Search       <title>, description, canonical
 *
 * The share image is published under a content-hashed name
 * (share/kyaw-and-shwe.<hash>.jpg). Apps cache previews by image URL, often
 * ignoring query strings, so a new card must get a new path to be seen.
 */
import { createHash } from 'node:crypto'
import { readFileSync, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import type { HtmlTagDescriptor, Plugin, ResolvedConfig } from 'vite'
import { share } from '../src/config/share.ts'

/** WhatsApp silently drops preview images above roughly this size. */
const WHATSAPP_IMAGE_LIMIT = 300 * 1024

const MIME: Record<string, string> = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' }

/** Width and height from a JPEG's frame header or a PNG's IHDR, without an image library. */
export function imageSize(buf: Buffer): { width: number; height: number } {
  if (buf.readUInt32BE(0) === 0x89504e47) return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) }
  if (buf.readUInt16BE(0) !== 0xffd8) throw new Error('not a JPEG or PNG')
  for (let i = 2; i + 9 < buf.length; ) {
    if (buf[i] !== 0xff) throw new Error('corrupt JPEG')
    const marker = buf[i + 1]
    // SOF0–SOF15 carry the dimensions; C4 (DHT), C8 (JPG) and CC (DAC) share the range but don't.
    if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
      return { height: buf.readUInt16BE(i + 5), width: buf.readUInt16BE(i + 7) }
    }
    i += 2 + buf.readUInt16BE(i + 2)
  }
  throw new Error('no JPEG frame header')
}

const escapeText = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;')

/**
 * @param siteUrl The site's public address, without a trailing slash, including
 *   any sub-path (e.g. https://user.github.io/repo). Empty: the build still
 *   works, but the tags fall back to site-relative URLs and warn, since many
 *   apps then show the preview without its photo.
 */
export function shareMetadata(siteUrl: string): Plugin {
  const root = fileURLToPath(new URL('../public/', import.meta.url))
  const imageFile = `${root}${share.image.path}`
  const ext = share.image.path.split('.').pop()!.toLowerCase()
  let config: ResolvedConfig
  let image: { bytes: Buffer; width: number; height: number; hashedPath: string }

  return {
    name: 'share-metadata',

    configResolved(resolved) {
      config = resolved
    },

    buildStart() {
      const bytes = readFileSync(imageFile)
      const { width, height } = imageSize(bytes)
      const hash = createHash('sha256').update(bytes).digest('hex').slice(0, 10)
      image = { bytes, width, height, hashedPath: share.image.path.replace(/(\.\w+)$/, `.${hash}$1`) }
      this.addWatchFile(imageFile)

      if (width < 1200 || Math.abs(width / height - 1.91) > 0.05) {
        this.warn(`${share.image.path} is ${width}×${height}; link previews look best at 1200×630.`)
      }
      if (bytes.length > WHATSAPP_IMAGE_LIMIT) {
        this.warn(`${share.image.path} is ${Math.round(bytes.length / 1024)} KB; WhatsApp may skip images over 300 KB.`)
      }
      statSync(`${root}${share.appleTouchIcon}`) // fail fast if the icon is missing
    },

    generateBundle() {
      this.emitFile({ type: 'asset', fileName: image.hashedPath, source: image.bytes })
    },

    transformIndexHtml() {
      const isBuild = config.command === 'build'
      if (isBuild && !siteUrl) {
        config.logger.warn(
          '\n[share-metadata] SITE_URL is not set: link previews may show no photo. ' +
            'Build with SITE_URL=https://your-domain (Vercel, Netlify and Cloudflare Pages set it for you).',
        )
      }
      // Absolute when we know the address; otherwise relative to wherever the site is served.
      const at = (path: string) => (siteUrl ? `${siteUrl}/${path}` : `${config.base}${path}`)
      const imageUrl = at(isBuild ? image.hashedPath : share.image.path)
      const pageUrl = at('')

      const meta = (key: 'name' | 'property', id: string, content: string | number): HtmlTagDescriptor => ({
        tag: 'meta',
        attrs: { [key]: id, content: String(content) },
        injectTo: 'head',
      })
      const og = (p: string, v: string | number) => meta('property', `og:${p}`, v)
      const tw = (n: string, v: string) => meta('name', `twitter:${n}`, v)
      const link = (rel: string, href: string, extra: Record<string, string> = {}): HtmlTagDescriptor => ({
        tag: 'link',
        attrs: { rel, href, ...extra },
        injectTo: 'head',
      })

      return [
        { tag: 'title', children: escapeText(share.title), injectTo: 'head' }, // after <meta charset>, which must lead
        meta('name', 'description', share.description),
        ...(siteUrl ? [link('canonical', pageUrl)] : []),

        og('type', 'website'),
        og('site_name', share.title),
        og('url', pageUrl),
        og('title', share.title),
        og('description', share.description),
        og('locale', share.locale),
        ...share.alternateLocales.map((l) => og('locale:alternate', l)),
        og('image', imageUrl),
        og('image:secure_url', imageUrl),
        og('image:type', MIME[ext] ?? `image/${ext}`),
        og('image:width', image.width),
        og('image:height', image.height),
        og('image:alt', share.image.alt),

        tw('card', 'summary_large_image'),
        tw('title', share.title),
        tw('description', share.description),
        tw('image', imageUrl),
        tw('image:alt', share.image.alt),

        link('image_src', imageUrl), // older crawlers (VK, some in-app browsers)
        link('apple-touch-icon', at(share.appleTouchIcon), { sizes: '180x180' }),
        meta('name', 'apple-mobile-web-app-title', share.title),
      ]
    },
  }
}
