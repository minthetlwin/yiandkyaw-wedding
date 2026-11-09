#!/usr/bin/env node
/**
 * Checks the LIVE site's link preview the way each platform's bot sees it:
 * fetches the page with that bot's user agent, reads its preview tags, then
 * confirms the photo and the canonical address actually load.
 *
 *   npm run check:share                       # the address in .env.production
 *   npm run check:share -- https://example.com/?to=Ma%20Su
 *
 * Exits non-zero if any platform would show a preview without its photo.
 * Node 18+, no dependencies.
 */
import { readFileSync } from 'node:fs'

const BOTS = {
  'Facebook / Messenger / Instagram': 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
  WhatsApp: 'WhatsApp/2.24.1.6 A',
  'iMessage (Apple)':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15 facebookexternalhit/1.1 Facebot Twitterbot/1.0',
  Telegram: 'TelegramBot (like TwitterBot)',
  Viber: 'Mozilla/5.0 (compatible; Viber/20.0)',
  'X / Twitter': 'Twitterbot/1.0',
  LinkedIn: 'LinkedInBot/1.0 (compatible; Mozilla/5.0; Apache-HttpClient +http://www.linkedin.com)',
  Slack: 'Slackbot-LinkExpanding 1.0 (+https://api.slack.com/robots)',
  Discord: 'Mozilla/5.0 (compatible; Discordbot/2.0; +https://discordapp.com)',
  Google: 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
}

/** WhatsApp skips preview images above roughly this size. */
const IMAGE_LIMIT = 300 * 1024

function defaultUrl() {
  try {
    const m = readFileSync(new URL('../.env.production', import.meta.url), 'utf8').match(/^SITE_URL=(.+)$/m)
    return m && `${m[1].trim().replace(/\/+$/, '')}/`
  } catch {
    return null
  }
}

/** Reads <meta property|name="key" content="…"> in either attribute order. */
function metaTags(html) {
  const tags = {}
  for (const [tag] of html.matchAll(/<meta\b[^>]*>/gi)) {
    const key = tag.match(/\b(?:property|name)="([^"]+)"/i)?.[1]
    const content = tag.match(/\bcontent="([^"]*)"/i)?.[1]
    if (key && content !== undefined && !(key in tags)) tags[key] = content.replace(/&amp;/g, '&')
  }
  return tags
}

async function get(url, ua) {
  const res = await fetch(url, { headers: { 'User-Agent': ua, Accept: '*/*' }, redirect: 'follow', signal: AbortSignal.timeout(15000) })
  return { res, body: Buffer.from(await res.arrayBuffer()) }
}

async function checkBot(pageUrl, ua) {
  const problems = []
  const page = await get(pageUrl, ua)
  if (!page.res.ok) return { problems: [`page returned ${page.res.status}`] }
  const tags = metaTags(page.body.toString('utf8'))

  const image = tags['og:image'] ?? tags['twitter:image']
  const title = tags['og:title'] ?? tags['twitter:title']
  if (!title) problems.push('no og:title')
  if (!image) return { title, problems: [...problems, 'no og:image'] }
  if (!/^https:\/\//.test(image)) problems.push(`og:image is not an absolute https URL: ${image}`)
  else {
    const img = await get(image, ua)
    const type = img.res.headers.get('content-type') ?? ''
    if (!img.res.ok) problems.push(`photo returned ${img.res.status}: ${image}`)
    else if (!type.startsWith('image/')) problems.push(`photo is ${type}, not an image: ${image}`)
    else if (img.body.length > IMAGE_LIMIT) problems.push(`photo is ${Math.round(img.body.length / 1024)} KB (WhatsApp skips > 300 KB)`)
  }

  // Facebook re-scrapes og:url as the canonical page; if it's dead, the preview is too.
  const canonical = tags['og:url']
  if (canonical) {
    const c = await get(canonical, ua)
    if (!c.res.ok) problems.push(`og:url returned ${c.res.status}: ${canonical}`)
    if (new URL(canonical).host !== new URL(page.res.url).host) {
      problems.push(`og:url is on another site (${new URL(canonical).host}) than the page (${new URL(page.res.url).host})`)
    }
  }
  return { title, image, problems }
}

const target = process.argv[2] ?? defaultUrl()
if (!target) {
  console.error('Usage: npm run check:share -- https://your-site/')
  process.exit(2)
}

console.log(`Link preview check for ${target}\n`)
let failed = 0
let shown = false
for (const [platform, ua] of Object.entries(BOTS)) {
  try {
    const r = await checkBot(target, ua)
    if (!shown && r.image) {
      console.log(`  title  ${r.title}\n  photo  ${r.image}\n`)
      shown = true
    }
    if (r.problems.length) failed++
    console.log(`${r.problems.length ? '✗' : '✓'} ${platform}${r.problems.map((p) => `\n    - ${p}`).join('')}`)
  } catch (err) {
    failed++
    console.log(`✗ ${platform}\n    - ${err.cause?.code ?? err.message}`)
  }
}

console.log(failed ? `\n${failed} platform(s) would show no photo.` : '\nAll platforms can load the preview photo.')
process.exit(failed ? 1 : 0)
