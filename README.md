# Kyaw & Shwe — Wedding Invitation

A luxury digital wedding invitation in soft white, ivory and champagne gold.
Guests arrive to a linen envelope floating among 3D white feathers, a feather
pinned across its flap by a gold wax seal. A tap snaps the seal in a spray of
golden stardust and down, the flap lifts in 3D to a foil liner, the letter
slides out and the camera pushes in until the card becomes the homepage hero.
Feathers drift away from the pointer and keep falling softly behind the page.
Sections: the invitation card, our story (polaroids), the day's schedule,
venue & map, RSVP (attendance, party size, live guest counter) and gifts
(KBZPay).

Stack: React 19 · Tailwind CSS v4 · Motion (Framer Motion) · React Three Fiber · Lenis.

## Develop

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # type-check + production build into dist/ (set SITE_URL for link previews, see below)
npm run lint
```

## Edit content

Everything guests see — names, date, time, venue, photos, payment methods — is
in [`src/config/wedding.ts`](src/config/wedding.ts). Photos live in
`public/yiandkyaw/`.

## Personal invitations

Add `?to=` and a guest's name to the link, e.g.
`https://your-site/?to=Ma%20Su` or `?to=ဒေါ်မြင့်မြင့်`. The envelope is
addressed to them ("For Ma Su"), the card greets them ("Dear Ma Su,"), the
invitation text uses their name and the RSVP form is pre-filled. Without `?to=`
everything reads as before. Most chat apps encode the name for you when you paste
the link; spaces can also be written as `%20`.

## Link preview (Messenger, WhatsApp, Viber, Telegram, iMessage, Facebook, X…)

When the link is shared, apps show the title **Kyaw & Shwe**, a line of
description, and `public/share/kyaw-and-shwe.jpg`: the couple's portrait with
**ခင်မင်ရင်းနှီးစွာဖြင့် ဖိတ်ကြားအပ်ပါသည်။**, the date and the venue.

- **To change the title, description or image**, edit `src/config/share.ts`.
  Every platform's tags (Open Graph, Twitter/X, Apple, search) are generated
  from it at build time by `build/share-metadata.ts`; `index.html` has none to
  keep in step. The build warns if the image isn't ~1200×630 or is over 300 KB
  (WhatsApp's limit).
- **The site's address must be right**, because preview photos need a full URL.
  When Netlify, Vercel or Cloudflare Pages build the site they supply it, and it
  follows renames and custom domains. For builds on your own computer it comes
  from `SITE_URL` in `.env.production`: update it if the site's address changes,
  or every preview photo points at the old, dead address.
- **After every deploy, run `npm run check:share`.** It loads the live site the
  way Facebook/Messenger, WhatsApp, iMessage, Telegram, Viber, X, LinkedIn,
  Slack, Discord and Google do, and confirms each can download the photo.
- **To change the card**, edit `scripts/share-card.html` and re-render it with the
  command at the top of that file. The iMessage / home-screen icon
  (`public/apple-touch-icon.png`) comes from `scripts/touch-icon.html` the same way.
- **Apps cache the first preview they see for a link.** The share image is
  published under a name carrying a fingerprint of the file
  (`share/kyaw-and-shwe.<hash>.jpg`), so a changed card is always fetched
  fresh. But if a link was shared while the site had no preview image,
  that app keeps showing it without one. Share a link it hasn't seen yet: a
  personal link (`?to=Name`) is always new, or add something like `?s=1`.
  Facebook/Messenger can be refreshed at https://developers.facebook.com/tools/debug/
  ("Scrape Again"); TikTok has no such tool.
- **TikTok** shows link cards in direct messages only; links in captions,
  comments and the profile bio never get a photo preview, whatever the site does.
- Personal links (`?to=Name`) share the same preview: the apps read the page
  without running it, so the guest's name appears once the invitation is opened.

## Background music

The song is Playdate (violin, slowed; Lindsey Stirling) at
`public/music/playdate-violin.mp3`; to change it, replace the file or the `music.src`
path. It starts, fading in,
when a guest taps the envelope's seal (or Skip), loops, pauses when the tab is
hidden, and a small sound button lets guests turn it off for that visit;
every time the envelope is opened again, the song starts from the beginning. Volume and path are in `music` in `src/config/wedding.ts`. With no
file the button simply doesn't appear. Keep it under ~6 MB (128 kbps is plenty).

## Shared RSVP counter

Set `VITE_RSVP_ENDPOINT` to a Google Apps Script web app backed by a Google
Sheet. Setup takes about five minutes: see
[`backend/google-apps-script/README.md`](backend/google-apps-script/README.md).
Without it the site still works, but counts are stored per browser only.

## Structure

```
src/
  config/wedding.ts          content (single source of truth): names, date, story, schedule, photos, gifts
  index.css                  theme tokens (ivory/champagne palette, fonts), linen, foil, gold-leaf and paper textures
  lib/feather.ts             paints feathers barb by barb (3D textures and the envelope's feather)
  lib/rsvp.ts                RSVP service: remote (Google Sheets) or localStorage
  lib/calendar.ts            Google Calendar link, .ics download, map URLs
  hooks/                     countdown, smooth scroll, RSVP stats
  intro/
    Intro.tsx                envelope sequence: seal → flap → letter → camera push onto the hero
    Envelope.tsx, WaxSeal.tsx  envelope layers and the gold wax seal
    FeatherField.tsx         React Three Fiber feathers, gold dust and stardust (code-split)
  components/
    card/CardFrame.tsx       the printed card (shared by the letter and the hero)
    ui/                      reveal helpers, ornaments (corner sprigs, feather marks), painted feather
    *.tsx                    page sections
backend/google-apps-script   Sheets-backed RSVP endpoint
```

## Deploy

Any static host works (Vercel, Netlify, Cloudflare Pages, GitHub Pages). Build
command `npm run build`, output directory `dist`.
