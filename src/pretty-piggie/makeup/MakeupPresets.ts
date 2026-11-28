import {
  PiggieAccessoryId,
  PiggieCollectionId,
} from '../character/CharacterParameters';

export interface MakeupCollectionPreset {
  id: PiggieCollectionId;
  name: string;
  shortName: string;
  badge: string;
  tagline: string;
  eyeshadowPrimaryHex: string;
  eyeshadowShimmerHex: string;
  eyeshadowRoughness: number;
  eyeshadowMetalness: number;
  glitterIntensity: number; // 0..1
  linerHex: string;
  linerWingScale: number;   // 0.6..1.5
  lashCount: number;        // 5..10 per eye
  lashLength: number;       // 0.85..1.35
  lashThickness: number;
  blushHex: string;
  blushOpacity: number;     // 0.25..0.75
  blushHighDrape: boolean;
  highlighterHex: string;
  highlighterIntensity: number;
  lipShades: [
    { label: string; hex: string },
    { label: string; hex: string },
    { label: string; hex: string },
    { label: string; hex: string },
  ];
  lipRoughness: number;
  lipClearcoat: number;
  defaultAccessoryId: PiggieAccessoryId;
  backdropTopHex: string;
  backdropBottomHex: string;
  /** Strictly VERIFIED_IN_STOCK product handles from blankaCatalog.json */
  eligibleProductHandles: [string, string, string];
}

export const MAKEUP_COLLECTION_PRESETS: Record<
  PiggieCollectionId,
  MakeupCollectionPreset
> = {
  'glam-piggie': {
    id: 'glam-piggie',
    name: 'Glam Piggie',
    shortName: 'Glam',
    badge: 'Signature Icon',
    tagline: 'Dramatic lashes, pink glitter shadow & glossy berry lips',
    eyeshadowPrimaryHex: '#C84673',
    eyeshadowShimmerHex: '#F8D5E2',
    eyeshadowRoughness: 0.24,
    eyeshadowMetalness: 0.35,
    glitterIntensity: 0.55,
    linerHex: '#1D0B13',
    linerWingScale: 1.22,
    lashCount: 9,
    lashLength: 1.24,
    lashThickness: 1.15,
    blushHex: '#DF5C88',
    blushOpacity: 0.52,
    blushHighDrape: false,
    highlighterHex: '#FCE4EC',
    highlighterIntensity: 0.55,
    lipShades: [
      { label: 'Berry Mirror', hex: '#B8295C' },
      { label: 'Velvet Rose', hex: '#D44776' },
      { label: 'Ruby Glaze', hex: '#9E1C43' },
      { label: 'Plum Couture', hex: '#7B1E48' },
    ],
    lipRoughness: 0.08,
    lipClearcoat: 1.0,
    defaultAccessoryId: 'pearl-studs',
    backdropTopHex: '#FCE4EE',
    backdropBottomHex: '#E8A5BE',
    eligibleProductHandles: [
      'single-pan-eyeshadow',
      'automatic-eyebrow-pencil',
      'bronzer',
    ],
  },
  'sweet-piggie': {
    id: 'sweet-piggie',
    name: 'Sweet Piggie',
    shortName: 'Sweet',
    badge: 'Soft Pastel',
    tagline: 'Dewy pink cheeks, delicate lashes & sheer glossy lips',
    eyeshadowPrimaryHex: '#F2AFC5',
    eyeshadowShimmerHex: '#FFF5F8',
    eyeshadowRoughness: 0.38,
    eyeshadowMetalness: 0.14,
    glitterIntensity: 0.15,
    linerHex: '#4A2431',
    linerWingScale: 0.85,
    lashCount: 6,
    lashLength: 0.96,
    lashThickness: 0.9,
    blushHex: '#F48FB1',
    blushOpacity: 0.62,
    blushHighDrape: false,
    highlighterHex: '#FFF0F5',
    highlighterIntensity: 0.4,
    lipShades: [
      { label: 'Petal Dew', hex: '#E8739B' },
      { label: 'Peach Sorbet', hex: '#E6837A' },
      { label: 'Sugar Peony', hex: '#F08EB0' },
      { label: 'Rose Milk', hex: '#D46A87' },
    ],
    lipRoughness: 0.06,
    lipClearcoat: 1.0,
    defaultAccessoryId: 'velvet-bow',
    backdropTopHex: '#FFF4F8',
    backdropBottomHex: '#F7C6D7',
    eligibleProductHandles: [
      'eyebrow-gel',
      'luminizing-powder',
      'foundation-primer',
    ],
  },
  'glitter-piggie': {
    id: 'glitter-piggie',
    name: 'Glitter Piggie',
    shortName: 'Glitter',
    badge: 'High Sparkle',
    tagline: 'Sparkling prism lids, glitter highlight & crystal lip gloss',
    eyeshadowPrimaryHex: '#D84B9E',
    eyeshadowShimmerHex: '#E5D4FF',
    eyeshadowRoughness: 0.12,
    eyeshadowMetalness: 0.62,
    glitterIntensity: 1.0,
    linerHex: '#2C1028',
    linerWingScale: 1.18,
    lashCount: 8,
    lashLength: 1.18,
    lashThickness: 1.05,
    blushHex: '#EC6CA7',
    blushOpacity: 0.5,
    blushHighDrape: true,
    highlighterHex: '#FFF8FF',
    highlighterIntensity: 0.95,
    lipShades: [
      { label: 'Starlight Pink', hex: '#E0488B' },
      { label: 'Cosmic Berry', hex: '#B44AC0' },
      { label: 'Crystal Rose', hex: '#E67A9E' },
      { label: 'Prism Fuchsia', hex: '#C82E77' },
    ],
    lipRoughness: 0.03,
    lipClearcoat: 1.0,
    defaultAccessoryId: 'starlight-clips',
    backdropTopHex: '#FAF0FF',
    backdropBottomHex: '#E5A9D4',
    eligibleProductHandles: [
      'glitter-dust',
      'luminizing-powder',
      'setting-spray',
    ],
  },
  'royal-piggie': {
    id: 'royal-piggie',
    name: 'Royal Piggie',
    shortName: 'Royal',
    badge: 'Rose-Gold Crown',
    tagline: 'Couture crown, gilded champagne lids & rich rose-gold glam',
    eyeshadowPrimaryHex: '#C99372',
    eyeshadowShimmerHex: '#FBE8CC',
    eyeshadowRoughness: 0.18,
    eyeshadowMetalness: 0.52,
    glitterIntensity: 0.45,
    linerHex: '#28131A',
    linerWingScale: 1.15,
    lashCount: 8,
    lashLength: 1.16,
    lashThickness: 1.08,
    blushHex: '#D15B76',
    blushOpacity: 0.48,
    blushHighDrape: false,
    highlighterHex: '#F9E4C8',
    highlighterIntensity: 0.78,
    lipShades: [
      { label: 'Imperial Rose', hex: '#A62B52' },
      { label: 'Gilded Peony', hex: '#C65573' },
      { label: 'Champagne Berry', hex: '#9B3E54' },
      { label: 'Sovereign Rouge', hex: '#7E1D3D' },
    ],
    lipRoughness: 0.11,
    lipClearcoat: 0.92,
    defaultAccessoryId: 'royal-crown',
    backdropTopHex: '#FDF4EC',
    backdropBottomHex: '#E8B8C4',
    eligibleProductHandles: [
      'luminizing-powder',
      'bronzer',
      'single-pan-eyeshadow',
    ],
  },
  'fashion-piggie': {
    id: 'fashion-piggie',
    name: 'Fashion Piggie',
    shortName: 'Fashion',
    badge: 'Editorial',
    tagline: 'Bold graphic liner, statement lashes & runway shades',
    eyeshadowPrimaryHex: '#7C2845',
    eyeshadowShimmerHex: '#E5A999',
    eyeshadowRoughness: 0.28,
    eyeshadowMetalness: 0.28,
    glitterIntensity: 0.25,
    linerHex: '#12070B',
    linerWingScale: 1.45,
    lashCount: 10,
    lashLength: 1.32,
    lashThickness: 1.22,
    blushHex: '#B6325F',
    blushOpacity: 0.58,
    blushHighDrape: true,
    highlighterHex: '#F8E3D8',
    highlighterIntensity: 0.68,
    lipShades: [
      { label: 'Runway Crimson', hex: '#981636' },
      { label: 'Editorial Mauve', hex: '#7D2E4D' },
      { label: 'Electric Rosé', hex: '#D62970' },
      { label: 'Espresso Velvet', hex: '#5E1D2E' },
    ],
    lipRoughness: 0.18,
    lipClearcoat: 0.72,
    defaultAccessoryId: 'couture-shades',
    backdropTopHex: '#F7E5EE',
    backdropBottomHex: '#CFA0B6',
    eligibleProductHandles: [
      'foundation-primer',
      'stipple-blend-foundation-brush',
      'glitter-dust',
    ],
  },
};

export function getMakeupPreset(
  id: PiggieCollectionId
): MakeupCollectionPreset {
  return MAKEUP_COLLECTION_PRESETS[id] ?? MAKEUP_COLLECTION_PRESETS['glam-piggie'];
}
