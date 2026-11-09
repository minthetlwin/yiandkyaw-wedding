/**
 * What a shared link looks like: the title, description and photo that
 * Messenger, WhatsApp, Viber, Telegram, iMessage, X, LinkedIn, Slack, Discord
 * and search engines show for the site.
 *
 * Read at build time by vite.config.ts, which turns it into every <meta> tag
 * the platforms look for (Open Graph, Twitter/X, Apple). Edit it here, not in
 * index.html. Plain data only: this file runs in Node, not the browser.
 */
export const share = {
  /** Shown in bold on the preview card and in the browser tab. */
  title: 'Kyaw & Shwe',
  /**
   * One or two lines under the title. Lead with what matters: most apps cut
   * it short (WhatsApp ~2 lines, iMessage hides it entirely).
   */
  description:
    'ခင်မင်ရင်းနှီးစွာဖြင့် ဖိတ်ကြားအပ်ပါသည်။ ' +
    'Saturday, 28 November 2026 · 1:00 PM · South Okkalapa Pagoda, Yangon.',
  /** Primary language first (Facebook format: language_TERRITORY). */
  locale: 'my_MM',
  alternateLocales: ['en_GB'],
  image: {
    /**
     * In public/. 1200 × 630 JPEG, made from scripts/share-card.html. Its
     * pixel size is read from the file itself, so it can't drift from the tags.
     */
    path: 'share/kyaw-and-shwe.jpg',
    alt: 'Kyaw and Shwe in an arched portrait beside the words ခင်မင်ရင်းနှီးစွာဖြင့် ဖိတ်ကြားအပ်ပါသည်။ — Saturday, 28 November 2026, South Okkalapa Pagoda, Yangon',
  },
  /** 180 × 180 PNG in public/, for iMessage and the iOS home screen (they don't use SVG icons). */
  appleTouchIcon: 'apple-touch-icon.png',
} as const
