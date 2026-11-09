/**
 * Single source of truth for everything shown on the invitation.
 * Edit this file to change names, times, venue, photos or gift details —
 * no component needs to change.
 *
 * Details were transcribed from the handwritten invitation note
 * (public/yiandkyaw/2026-10-31 20.29.02.jpg). Fields marked VERIFY were
 * hard to read and should be double-checked before sharing the link.
 */

/** Files in public/, wherever the site is served from (a domain's root, or a folder such as GitHub Pages'). */
const asset = (path: string) => `${import.meta.env.BASE_URL}${path}`
const photo = (file: string) => asset(`yiandkyaw/${encodeURIComponent(file)}`)

export interface Person {
  /** Short display name used in the monogram and headings. */
  short: string
  /** Full name in English. */
  name: string
  /** Full name in Myanmar script. */
  nameMy: string
  /** Parents, in Myanmar script. Hidden when empty. */
  parentsMy: string
  role: string
  roleMy: string
  portrait: Photo
}

export interface Photo {
  src: string
  alt: string
  width: number
  height: number
  /** CSS object-position used when the photo is cropped, e.g. '66% 20%'. */
  focus?: string
}

export interface StoryChapter {
  title: string
  titleMy: string
  text: string
  photo: Photo
}

export interface ScheduleItem {
  /** Start, e.g. '1:30 PM'. */
  time: string
  /** Optional end, e.g. '3:30 PM'. */
  endTime?: string
  title: string
  titleMy: string
  text: string
  icon: 'arrival' | 'rings' | 'dining' | 'camera'
}

export interface PaymentMethod {
  id: string
  provider: string
  accountName: string
  /** Masked account / phone number as printed on the QR card. */
  accountHint: string
  qr: Photo
  brandColor: string
}

const bride: Person = {
  short: 'Shwe',
  name: 'Shwe',
  nameMy: 'မရွှေရည်ဖြိုး', // VERIFY: bride's full name
  parentsMy: 'ဦးသိန်းဇော် + ဒေါ်ဝင်းဝင်းနွယ် တို့၏ သမီးငယ်',
  role: 'The Bride',
  roleMy: 'သတို့သမီး',
  portrait: {
    src: photo('2026-10-31 20.30.45.jpg'),
    alt: 'Portrait of the bride in a white gown with a bouquet',
    width: 1280,
    height: 853,
    focus: '68% 20%',
  },
}

const groom: Person = {
  short: 'Kyaw',
  name: 'Kyaw Htet Winn',
  nameMy: 'မောင်ကျော်ထက်ဝင်း',
  parentsMy: 'ဦးနေအေးကျော် + ဒေါ်နုနုဝင်း တို့၏ သားကြီး', // VERIFY: groom's parents
  role: 'The Groom',
  roleMy: 'သတို့သား',
  portrait: {
    src: photo('2026-10-31 20.30.50.jpg'),
    alt: 'Portrait of the groom in a black suit',
    width: 1280,
    height: 853,
    focus: '61% 20%',
  },
}

export const wedding = {
  bride,
  groom,
  monogram: 'K & S',
  hashtag: '#KyawAndShwe',

  event: {
    // Myanmar Standard Time is UTC+06:30.
    start: '2026-11-28T13:00:00+06:30',
    end: '2026-11-28T15:30:00+06:30',
    timeZone: 'Asia/Yangon',
    dateLabel: 'Saturday, 28 November 2026',
    dateLabelMy: '၂၀၂၆ ခုနှစ်၊ နိုဝင်ဘာလ ၂၈ ရက်၊ စနေနေ့',
    lunarDateMy: '၁၃၈၈ ခုနှစ်၊ တန်ဆောင်မုန်းလဆုတ် ၅ ရက်',
    timeLabel: '1:00 PM – 3:30 PM',
    timeLabelMy: 'နေ့လည် ၁:၀၀ နာရီ မှ ၃:၃၀ နာရီ ထိ',
    /** Spelled out, as engraved on formal stationery (the hero card). */
    dateFormal: 'the twenty-eighth of November',
    yearFormal: 'two thousand twenty-six',
  },

  venue: {
    name: 'Wedding Hall, South Okkalapa Pagoda',
    nameMy: 'မင်္ဂလာခန်းမ၊ တောင်ဥက္ကလာပ စေတီတော်', // VERIFY: hall name in quotes on the note
    address: 'Corner of Thanthumar Rd & Thitsar Rd, South Okkalapa Township, Yangon',
    addressMy: 'သံသုမာလမ်းနှင့် သစ္စာလမ်းထောင့်၊ တောင်ဥက္ကလာပမြို့နယ်',
    mapQuery: 'South Okkalapa Pagoda, Thanthumar Road, Yangon',
  },

  /**
   * "Our Story" chapters. The wording is intentionally general — rewrite it
   * with your own memories (how you met, the proposal, …).
   */
  /** The portrait on the hero card. Focus keeps the studio mark out of the arch crop. */
  hero: {
    photo: {
      src: photo('2026-10-31 20.30.27.jpg'),
      alt: 'The couple sharing a quiet moment in falling snow',
      width: 853,
      height: 1280,
      focus: '50% 18%',
    } satisfies Photo,
  },

  story: [
    {
      title: 'Two paths, one direction',
      titleMy: 'လမ်းနှစ်သွယ် တစ်ခုတည်းဖြစ်လာခြင်း',
      text: 'Somewhere along the way, “you and me” quietly became “us” — and every ordinary day became a little brighter.',
      photo: { src: photo('2026-10-31 20.30.40.jpg'), alt: 'The couple embracing under a flowing veil', width: 853, height: 1280 },
    },
    {
      title: 'Rooted in tradition',
      titleMy: 'ရိုးရာဓလေ့ကို လေးစားမြတ်နိုးခြင်း',
      text: 'Honouring our families and the traditions that raised us, we step forward together with gratitude and love.',
      photo: { src: photo('2026-10-31 20.28.58.jpg'), alt: 'The couple in traditional Myanmar attire on a golden throne', width: 853, height: 1280 },
    },
    {
      title: 'A promise kept gently',
      titleMy: 'နူးညံ့သော ကတိသစ္စာ',
      text: 'A promise to choose each other — in quiet mornings, in laughter, and in every season still to come.',
      photo: { src: photo('2026-10-31 20.30.12.jpg'), alt: 'The groom kissing the bride’s hand beneath white arches', width: 853, height: 1280 },
    },
    {
      title: 'Forever begins',
      titleMy: 'ထာဝရ စတင်ခြင်း',
      text: 'On 28 November 2026 we begin our forever — and it would mean the world to have you there with us.',
      photo: { src: photo('2026-10-31 20.30.36.jpg'), alt: 'The couple walking hand in hand down a tree-lined path', width: 853, height: 1280 },
    },
  ] satisfies StoryChapter[],

  /**
   * Order of the day, shown in "The Day" section. Add entries to turn it into
   * a timeline; `endTime` is optional ("1:30 – 3:30 PM" when given).
   */
  schedule: [
    {
      time: '1:30 PM',
      endTime: '3:30 PM',
      title: 'Chicken Rice & Ice Cream',
      titleMy: 'ကြက်ဆီထမင်း နှင့် ရေခဲမုန့်',
      text: 'Join us for a traditional wedding treat of kyet-si htamin, with ice cream to follow.',
      icon: 'dining',
    },
  ] as ScheduleItem[],

  gallery: [
    { src: photo('2026-10-31 20.30.40.jpg'), alt: 'The couple embracing under a flowing veil', width: 853, height: 1280 },
    { src: photo('2026-10-31 20.28.58.jpg'), alt: 'The couple in traditional Myanmar attire on a golden throne', width: 853, height: 1280 },
    { src: photo('2026-10-31 20.30.18.jpg'), alt: 'The groom pouring wine for the bride', width: 1280, height: 853 },
    { src: photo('2026-10-31 20.30.23.jpg'), alt: 'The couple in a garden pergola, bride in a long-train gown', width: 853, height: 1280 },
    { src: photo('2026-10-31 20.30.12.jpg'), alt: 'The groom kissing the bride’s hand beneath white arches', width: 853, height: 1280 },
    { src: photo('2026-10-31 20.30.27.jpg'), alt: 'The couple sharing a quiet moment in falling snow', width: 853, height: 1280 },
    { src: photo('2026-10-31 20.30.32.jpg'), alt: 'The bride under a clear umbrella with the groom behind her', width: 853, height: 1280 },
    { src: photo('2026-10-31 20.28.26.jpg'), alt: 'The couple in evening wear in a classic bar', width: 853, height: 1280 },
    { src: photo('2026-10-31 20.30.36.jpg'), alt: 'The couple walking hand in hand down a tree-lined path', width: 853, height: 1280 },
  ] satisfies Photo[],

  payments: [
    {
      id: 'kbzpay',
      provider: 'KBZPay',
      accountName: 'U Kyaw Htet Winn',
      accountHint: '******7795',
      qr: {
        src: photo('2026-10-31 20.29.07.jpg'),
        alt: 'KBZPay QR code for U Kyaw Htet Winn',
        width: 865,
        height: 1280,
        // The card shows a crop; keep the blue QR panel, drop the white footer.
        focus: '50% 0%',
      },
      brandColor: '#0053ab',
    },
    {
      id: 'ayapay',
      provider: 'AYA Pay',
      accountName: 'KYAW HTET WIN',
      accountHint: '*****7795',
      qr: {
        src: photo('photo_2026-11-01 15.18.17.jpeg'),
        alt: 'AYA Pay QR code for Kyaw Htet Win',
        width: 590,
        height: 1280,
        // Frame the QR code with the name and number beneath it.
        focus: '50% 78%',
      },
      brandColor: '#d71f3a',
    },
  ] satisfies PaymentMethod[],

  /**
   * Background music, started by the guest's tap on the envelope's seal:
   * Pachelbel's Canon in D, violin & piano duet (Ariana Strings), in
   * public/music/. With no file there, the sound control simply doesn't appear.
   */
  music: {
    src: asset('music/canon-in-d.mp3'),
    /** Final volume, 0–1: soft enough to sit under conversation. */
    volume: 0.45,
  },

  rsvp: {
    /** Last day guests can respond. */
    deadline: '2026-11-21',
    maxGuestsPerResponse: 6,
  },

} as const

export type Wedding = typeof wedding
