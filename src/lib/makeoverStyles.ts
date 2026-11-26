export type MakeoverPersonalityId =
  | 'glam-piggie'
  | 'sweet-piggie'
  | 'glitter-piggie'
  | 'royal-piggie'
  | 'fashion-piggie';

export type MakeoverExportFormat =
  | 'story-9-16'
  | 'square-1-1'
  | 'portrait-4-5';

export interface MakeoverPersonality {
  id: MakeoverPersonalityId;
  name: string;
  shortName: string;
  tagline: string;
  description: string;
  accentHex: string;
  palette: [string, string, string];
  badgeText: string;
  promptDirective: string;
  pairedProductHandles: string[];
}

export const MASTER_REFERENCE_PUBLIC_PATH =
  '/brand/makeover-studio/master-pretty-piggie-reference.png';

export const MAKEOVER_CAMPAIGN = {
  studioTitle: 'Pretty Piggie Makeover Studio',
  headline: "What's Your Pretty Piggie?",
  hashtag: '#MyPrettyPiggie',
  domain: 'PrettyPiggie.com',
  defaultCaption:
    "Meet my Pretty Piggie! 💗🐷 What's yours? Create yours at PrettyPiggie.com #MyPrettyPiggie",
} as const;

export const EXPORT_FORMAT_SPECS: Record<
  MakeoverExportFormat,
  {
    id: MakeoverExportFormat;
    label: string;
    shortLabel: string;
    ratioLabel: string;
    platformHint: string;
    width: number;
    height: number;
  }
> = {
  'story-9-16': {
    id: 'story-9-16',
    label: '9:16 Vertical',
    shortLabel: '9:16 Story',
    ratioLabel: '1080 × 1920',
    platformHint: 'TikTok, IG Stories, Reels & Snapchat',
    width: 1080,
    height: 1920,
  },
  'square-1-1': {
    id: 'square-1-1',
    label: '1:1 Square',
    shortLabel: '1:1 Square',
    ratioLabel: '1080 × 1080',
    platformHint: 'Instagram Feed & Facebook',
    width: 1080,
    height: 1080,
  },
  'portrait-4-5': {
    id: 'portrait-4-5',
    label: 'HD Portrait',
    shortLabel: '4:5 Portrait',
    ratioLabel: '1200 × 1500',
    platformHint: 'High-Resolution Keepsake & IG Post',
    width: 1200,
    height: 1500,
  },
};

/**
 * Master Pretty Piggie Character Bible.
 * Shared verbatim across all 5 personalities so every customer belongs to ONE
 * unmistakable luxury 3D animated Pretty Piggie brand universe.
 */
export const MASTER_PRETTY_PIGGIE_STYLE_BIBLE = [
  'Transform the person in Image 1 (the customer portrait) into a personalized, recognizable, feature-film-quality 3D animated Pretty Piggie luxury beauty character that strictly matches the exact 3D rendering style, lighting, shading, and character anatomy of Image 2 (the Master Pretty Piggie Character Reference).',
  'IDENTITY PRESERVATION (MANDATORY): Faithfully preserve the customer’s recognizable facial identity from Image 1 — including their approximate age, face shape, skin tone and undertone, eye shape/color cues, eyebrow structure, smile/expression, and their hairstyle, hair texture, hair color, and glasses or facial hair if present.',
  'SIGNATURE PRETTY PIGGIE ANATOMY (INTEGRATED, NEVER STICKERS): Seamlessly sculpt the nose into a small, cute, flattering stylized blush-pink pig snout that blends harmoniously with their skin tone and face proportions. Integrate soft, velvety blush-pink rounded pig ears naturally into the upper head silhouette peeking gracefully through their preserved hairstyle.',
  'BEAUTY & 3D ART DIRECTION: Render large, soulful, sparkling 3D animated eyes, lush curled eyelashes, smooth subsurface-scattered 3D animated skin, studio-lit luxury cosmetics, pink/blush/rose-gold color harmony, and warm rose-pearl beauty studio lighting against a clean dreamy soft-blush bokeh studio backdrop (head-and-shoulders centered composition with generous headroom so ears and hair are never cropped).',
  'STRICT NEGATIVE CONSTRAINTS: Do NOT paste flat clip-art ears or nose stickers on a human photo. Do NOT create a scary, realistic, grotesque, or uncanny pig head. Do NOT distort the customer’s identity into a generic unrelated cartoon. Do NOT include any text, watermarks, logos, frames, or borders inside the generated image.',
].join(' ');

export const MAKEOVER_PERSONALITIES: MakeoverPersonality[] = [
  {
    id: 'glam-piggie',
    name: 'Glam Piggie',
    shortName: 'Glam',
    tagline: 'Dramatic lashes, sculpted eyes & high-shine berry lips',
    description:
      'Red-carpet Pretty Piggie glam with voluminous curled lashes, smoky rose-plum eye definition, sculpted blush, and mirror-gloss lips.',
    accentHex: '#C84673',
    palette: ['#4A1829', '#C84673', '#F4B6CB'],
    badgeText: 'Signature Icon',
    promptDirective:
      'MAKEUP PERSONALITY — GLAM PIGGIE: Apply dramatic high-volume curled flutter lashes, rich smoky rose-plum and champagne-shimmer cut-crease eyeshadow, crisp winged eyeliner, sculpted warm rose-berry cheek blush with soft contour, and plump mirror-shine berry-rose glossy lips. Style with subtle rose-gold luxury stud accents and luminous red-carpet studio rim lighting.',
    pairedProductHandles: [
      'single-pan-eyeshadow',
      'automatic-eyebrow-pencil',
      'bronzer',
    ],
  },
  {
    id: 'sweet-piggie',
    name: 'Sweet Piggie',
    shortName: 'Sweet',
    tagline: 'Soft petal-pink blush & radiant natural beauty',
    description:
      'Fresh, dreamy Pretty Piggie softness with cloud-blended petal-pink blush, feathery brows, delicate satin shimmer lids, and ballet-pink gloss.',
    accentHex: '#DF648F',
    palette: ['#F9D5E1', '#EC8EAE', '#F5DDC4'],
    badgeText: 'Soft Glow',
    promptDirective:
      'MAKEUP PERSONALITY — SWEET PIGGIE: Apply soft diffused petal-pink blush swept delicately across the cheeks and bridge of the cute pig snout, soft feathery groomed brows, natural wispy doll lashes, sheer pearl-pink satin eyelid wash, and dewy sheer ballet-pink glossy lips. Keep the styling sweet, fresh, and sunlit with creamy pastel rose studio lighting.',
    pairedProductHandles: [
      'eyebrow-gel',
      'luminizing-powder',
      'foundation-primer',
    ],
  },
  {
    id: 'glitter-piggie',
    name: 'Glitter Piggie',
    shortName: 'Glitter',
    tagline: 'Diamond shimmer, starlight highlights & sparkling lips',
    description:
      'Dazzling Pretty Piggie sparkle with iridescent diamond-pink micro-glitter lids, prism rose-gold cheek glow, and crystal-glazed lips.',
    accentHex: '#B6468C',
    palette: ['#F8E3D8', '#DF648F', '#A78BFA'],
    badgeText: 'Shimmer Pop',
    promptDirective:
      'MAKEUP PERSONALITY — GLITTER PIGGIE: Apply luminous iridescent diamond-pink and champagne micro-glitter eyeshadow across the lids with sparkling inner-corner starlight shimmer, prism rose-gold cheekbone highlighter with delicate micro-sparkle, plush curled lashes, and glassy sparkle-infused pink lip gloss. Add soft dreamy champagne sparkle bokeh in the studio backdrop.',
    pairedProductHandles: [
      'glitter-dust',
      'luminizing-powder',
      'setting-spray',
    ],
  },
  {
    id: 'royal-piggie',
    name: 'Royal Piggie',
    shortName: 'Royal',
    tagline: 'Rose-gold tiara crown, pearl accents & champagne glam',
    description:
      'Regal Pretty Piggie elegance featuring a delicate rose-gold & pearl mini tiara nestled in your hair, gilded champagne lids, and satin-rose luxury.',
    accentHex: '#A96654',
    palette: ['#F5DDC4', '#E5A999', '#7C2845'],
    badgeText: 'Couture Crown',
    promptDirective:
      'MAKEUP PERSONALITY — ROYAL PIGGIE: Crown the character with a delicate, finely rendered rose-gold and pearl couture mini tiara nestled gracefully into their preserved hairstyle (without covering their cute pig ears), paired with subtle pearl drop ear accents. Apply gilded champagne-gold and satin-rose eyeshadow, regal sculpted rose blush, polished velvet-gloss champagne-rose lips, and warm golden-hour palace studio lighting.',
    pairedProductHandles: [
      'luminizing-powder',
      'bronzer',
      'single-pan-eyeshadow',
    ],
  },
  {
    id: 'fashion-piggie',
    name: 'Fashion Piggie',
    shortName: 'Fashion',
    tagline: 'Editorial beauty, glass skin & high-fashion styling',
    description:
      'Runway Pretty Piggie attitude with chic graphic rose-crimson wing liner, high-fashion cheek draping, glass-skin radiance, and couture satin lips.',
    accentHex: '#260B15',
    palette: ['#260B15', '#A6335A', '#E5A999'],
    badgeText: 'Editorial',
    promptDirective:
      'MAKEUP PERSONALITY — FASHION PIGGIE: Apply high-fashion editorial luxury makeup with sleek graphic rose-espresso winged liner, luminous glass-skin cheekbone highlights, couture draped rose-berry blush up toward the temples, sculpted satin-velvet rose-crimson lips, and a chic rose-gold fashion accessory or tailored silk neckline. Use crisp Vogue-style editorial beauty studio lighting.',
    pairedProductHandles: [
      'foundation-primer',
      'stipple-blend-foundation-brush',
      'glitter-dust',
    ],
  },
];

export function getMakeoverPersonality(
  id: string | null | undefined
): MakeoverPersonality | null {
  if (!id) return null;
  return MAKEOVER_PERSONALITIES.find((p) => p.id === id) ?? null;
}

export function buildPrettyPiggiePrompt(
  personality: MakeoverPersonality
): string {
  return [
    MASTER_PRETTY_PIGGIE_STYLE_BIBLE,
    personality.promptDirective,
    'FINAL QUALITY CHECK: The customer from Image 1 must instantly recognize themselves smiling back as a gorgeous, polished 3D animated Pretty Piggie beauty character matching the exact brand universe of Image 2.',
  ].join('\n\n');
}
