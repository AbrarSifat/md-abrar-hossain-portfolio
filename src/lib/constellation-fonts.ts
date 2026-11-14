import {
  Amiri,
  Noto_Serif,
  Noto_Serif_Bengali,
  Noto_Serif_Devanagari,
  Noto_Serif_Ethiopic,
  Noto_Serif_Hebrew,
  Noto_Serif_JP,
  Noto_Serif_KR,
  Noto_Serif_SC,
  Noto_Serif_Tamil,
  Noto_Serif_Telugu,
  Noto_Serif_Thai,
} from 'next/font/google';

export type ConstellationScript =
  | 'cormorant'
  | 'sans'
  | 'greek'
  | 'arabic'
  | 'bengali'
  | 'devanagari'
  | 'jp'
  | 'sc'
  | 'kr'
  | 'tamil'
  | 'telugu'
  | 'thai'
  | 'hebrew'
  | 'ethiopic';

const notoGreek = Noto_Serif({
  subsets: ['greek'],
  weight: ['400', '500', '600'],
  variable: '--font-c-greek',
  display: 'swap',
  preload: false,
});

const amiri = Amiri({
  subsets: ['arabic'],
  weight: ['400', '700'],
  variable: '--font-c-arabic',
  display: 'swap',
  preload: false,
});

const notoBengali = Noto_Serif_Bengali({
  subsets: ['bengali'],
  weight: ['400', '500', '600'],
  variable: '--font-c-bengali',
  display: 'swap',
  preload: false,
});

const notoDevanagari = Noto_Serif_Devanagari({
  subsets: ['devanagari'],
  weight: ['400', '500', '600'],
  variable: '--font-c-devanagari',
  display: 'swap',
  preload: false,
});

const notoJP = Noto_Serif_JP({
  weight: ['400', '500', '600'],
  variable: '--font-c-jp',
  display: 'swap',
  preload: false,
});

const notoSC = Noto_Serif_SC({
  weight: ['400', '500', '600'],
  variable: '--font-c-sc',
  display: 'swap',
  preload: false,
});

const notoKR = Noto_Serif_KR({
  weight: ['400', '500', '600'],
  variable: '--font-c-kr',
  display: 'swap',
  preload: false,
});

const notoTamil = Noto_Serif_Tamil({
  subsets: ['tamil'],
  weight: ['400', '500', '600'],
  variable: '--font-c-tamil',
  display: 'swap',
  preload: false,
});

const notoTelugu = Noto_Serif_Telugu({
  subsets: ['telugu'],
  weight: ['400', '500', '600'],
  variable: '--font-c-telugu',
  display: 'swap',
  preload: false,
});

const notoThai = Noto_Serif_Thai({
  subsets: ['thai'],
  weight: ['400', '500', '600'],
  variable: '--font-c-thai',
  display: 'swap',
  preload: false,
});

const notoHebrew = Noto_Serif_Hebrew({
  subsets: ['hebrew'],
  weight: ['400', '500', '600'],
  variable: '--font-c-hebrew',
  display: 'swap',
  preload: false,
});

const notoEthiopic = Noto_Serif_Ethiopic({
  subsets: ['ethiopic'],
  weight: ['400', '500', '600'],
  variable: '--font-c-ethiopic',
  display: 'swap',
  preload: false,
});

export const CONSTELLATION_FONT_CLASSES = [
  notoGreek.variable,
  amiri.variable,
  notoBengali.variable,
  notoDevanagari.variable,
  notoJP.variable,
  notoSC.variable,
  notoKR.variable,
  notoTamil.variable,
  notoTelugu.variable,
  notoThai.variable,
  notoHebrew.variable,
  notoEthiopic.variable,
].join(' ');

export const SCRIPT_FONT_FAMILIES: Record<ConstellationScript, string> = {
  cormorant: "var(--font-cormorant-garamond), 'Cormorant Garamond', Georgia, serif",
  sans: "var(--font-inter), 'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  greek: "var(--font-c-greek), var(--font-cormorant-garamond), Georgia, serif",
  arabic: "var(--font-c-arabic), 'Amiri', 'Traditional Arabic', Georgia, serif",
  bengali: "var(--font-c-bengali), 'Shonar Bangla', 'Noto Serif Bengali', Georgia, serif",
  devanagari: "var(--font-c-devanagari), 'Kokila', 'Noto Serif Devanagari', Georgia, serif",
  jp: "var(--font-c-jp), 'Yu Mincho', 'Hiragino Mincho ProN', Georgia, serif",
  sc: "var(--font-c-sc), 'Songti SC', 'SimSun', Georgia, serif",
  kr: "var(--font-c-kr), 'Batang', 'AppleMyungjo', Georgia, serif",
  tamil: "var(--font-c-tamil), 'Vijaya', 'Noto Serif Tamil', Georgia, serif",
  telugu: "var(--font-c-telugu), 'Vani', 'Noto Serif Telugu', Georgia, serif",
  thai: "var(--font-c-thai), 'Angsana New', 'Noto Serif Thai', Georgia, serif",
  hebrew: "var(--font-c-hebrew), 'Frank Ruehl CLM', 'David', Georgia, serif",
  ethiopic: "var(--font-c-ethiopic), 'Abyssinica SIL', 'Nyala', Georgia, serif",
};
