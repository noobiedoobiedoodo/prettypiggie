import blankaCatalogRaw from './blankaCatalog.json';
import {
  BoutiqueProduct,
  BoutiqueZone,
  BoutiqueZoneId,
  FinishType,
  InciVerificationStatus,
  ProductModelType,
  ProductShade,
} from '@/types/boutique';

export const BOUTIQUE_ZONES: BoutiqueZone[] = [
  {
    id: 'rotunda',
    name: 'Grand Chandelier Rotunda',
    shortName: 'Boutique',
    subtitle: 'Welcome to Pretty Piggie Makeup’s 3D Beauty World',
    description:
      'Step onto the polished blush-marble floor beneath our crystal & rose-gold oval cove chandelier. Swipe or tap any illuminated department to explore our luxury collection.',
    badge: '360° Flagship Showroom',
    referenceImage: '/design-reference/rotunda-chandelier.png',
    accentColor: '#F4B6CB',
    mobileCamera: {
      position: [0, 2.65, 10.4],
      target: [0, 1.95, -1.5],
      fov: 62,
    },
    tabletCamera: {
      position: [0, 2.75, 9.6],
      target: [0, 1.95, -1.5],
      fov: 54,
    },
    desktopCamera: {
      position: [0, 2.85, 9.0],
      target: [0, 1.9, -2.0],
      fov: 46,
    },
  },
  {
    id: 'makeup-wall',
    name: 'The Makeup Wall',
    shortName: 'Makeup Wall',
    subtitle: 'Lipsticks, Lip Glosses, Liners & Eyeshadow Palettes',
    description:
      'Floor-to-ceiling rounded blush alcoves outlined in warm glowing LED light strips, housing our signature Lipsticks, High-Shine Lip Glosses, and Couture Eyeshadow Palettes.',
    badge: 'Lips & Eye Couture',
    referenceImage: '/design-reference/makeup-wall-counter.png',
    accentColor: '#EC8EAE',
    mobileCamera: {
      position: [0, 2.65, 1.1],
      target: [0, 2.75, -7.0],
      fov: 62,
    },
    tabletCamera: {
      position: [0, 2.7, 0.6],
      target: [0, 2.75, -7.0],
      fov: 54,
    },
    desktopCamera: {
      position: [0, 2.75, 0.3],
      target: [0, 2.75, -7.0],
      fov: 48,
    },
  },
  {
    id: 'beauty-counter',
    name: 'The Beauty Counter',
    shortName: 'Counter',
    subtitle: 'Foundations, BB Creams, Blush Palettes & Primers',
    description:
      'Examine featured complexion finishers, 17-shade Silk Foundations, Full Cover Foundations, and Blush Palettes arranged across our dual-LED blush beauty counter.',
    badge: 'Complexion & Cheek Bar',
    referenceImage: '/design-reference/makeup-wall-counter.png',
    accentColor: '#E5A999',
    mobileCamera: {
      position: [0, 2.25, 3.1],
      target: [0, 1.45, -3.5],
      fov: 58,
    },
    tabletCamera: {
      position: [0, 2.25, 2.6],
      target: [0, 1.45, -3.5],
      fov: 50,
    },
    desktopCamera: {
      position: [0, 2.25, 2.3],
      target: [0, 1.45, -3.5],
      fov: 45,
    },
  },
  {
    id: 'collection',
    name: 'The PrettyPiggie Collection',
    shortName: 'Collection',
    subtitle: 'Luxury Cream & Matte Lipsticks, Luminizers & Serums',
    description:
      'Our flagship central oval islands trimmed in brushed champagne rose-gold, showcasing Luxury Cream Lipstick, Luminizing Powder, and signature skincare elixirs.',
    badge: 'Luxury Collection',
    referenceImage: '/design-reference/rotunda-chandelier.png',
    accentColor: '#DF648F',
    mobileCamera: {
      position: [0, 2.5, 7.4],
      target: [0, 1.35, 1.7],
      fov: 60,
    },
    tabletCamera: {
      position: [0, 2.45, 6.7],
      target: [0, 1.35, 1.7],
      fov: 52,
    },
    desktopCamera: {
      position: [0, 2.45, 6.3],
      target: [0, 1.35, 1.7],
      fov: 46,
    },
  },
  {
    id: 'bestsellers',
    name: 'The Bestsellers Display',
    shortName: 'Bestsellers',
    subtitle: 'Matte Lip Stains, Liquid Blushes & Top-Selling Icons',
    description:
      'Our most-loved customer favorites—including 12-shade Matte Lip Stain and 5-shade Liquid Blush—elevated on LED-rimmed blush pedestals.',
    badge: 'Most-Loved Icons',
    referenceImage: '/design-reference/product-stage-lipstick.png',
    accentColor: '#F5DDC4',
    mobileCamera: {
      position: [-0.8, 2.4, 3.6],
      target: [-5.8, 1.9, 0.2],
      fov: 60,
    },
    tabletCamera: {
      position: [-1.1, 2.35, 3.1],
      target: [-5.8, 1.9, 0.2],
      fov: 52,
    },
    desktopCamera: {
      position: [-1.3, 2.35, 2.9],
      target: [-5.8, 1.9, 0.2],
      fov: 47,
    },
  },
  {
    id: 'discovery-room',
    name: 'The Discovery Room',
    shortName: 'Discovery',
    subtitle: 'Artistry Brushes, Hydrating Lip Oils & New Arrivals',
    description:
      'Enter our high-gloss futuristic pink sanctuary featuring Stipple & Blend Brushes, Hydrating Lip Oils, Pro Cheek Palettes, and seasonal drops.',
    badge: 'Brushes & New Drops',
    referenceImage: '/design-reference/discovery-room-futuristic.png',
    accentColor: '#F9D5E1',
    mobileCamera: {
      position: [0.8, 2.4, 3.6],
      target: [5.8, 1.85, 0.2],
      fov: 60,
    },
    tabletCamera: {
      position: [1.1, 2.35, 3.1],
      target: [5.8, 1.85, 0.2],
      fov: 52,
    },
    desktopCamera: {
      position: [1.3, 2.35, 2.9],
      target: [5.8, 1.85, 0.2],
      fov: 47,
    },
  },
];

// 11 Hero 3D Showroom Floor Placements mapped to exact 3D shelf/counter/podium coordinates
const SHOWROOM_HERO_PLACEMENTS: Record<
  string,
  {
    zoneId: Exclude<BoutiqueZoneId, 'rotunda'>;
    position3D: [number, number, number];
    modelType: ProductModelType;
    badge: string;
  }
> = {
  lipstick: {
    zoneId: 'makeup-wall',
    position3D: [-2.6, 2.55, -6.68],
    modelType: 'lipstick',
    badge: '14 Shades • Preview',
  },
  'lip-gloss': {
    zoneId: 'makeup-wall',
    position3D: [0.0, 2.55, -6.68],
    modelType: 'lipgloss',
    badge: '15 Shades • Preview',
  },
  'eyeshadow-palette': {
    zoneId: 'makeup-wall',
    position3D: [2.6, 2.55, -6.56],
    modelType: 'palette',
    badge: '5 Palettes • Preview',
  },
  foundation: {
    zoneId: 'beauty-counter',
    position3D: [-1.4, 1.38, -3.5],
    modelType: 'foundation',
    badge: '17 Shades • Preview',
  },
  'blush-palette': {
    zoneId: 'beauty-counter',
    position3D: [1.4, 1.38, -3.5],
    modelType: 'compact',
    badge: '3 Palettes • Preview',
  },
  'luxury-cream-lipstick': {
    zoneId: 'collection',
    position3D: [-1.45, 1.32, 1.2],
    modelType: 'lipstick',
    badge: 'Luxury Preview',
  },
  'luminizing-powder': {
    zoneId: 'collection',
    position3D: [1.45, 1.32, 2.2],
    modelType: 'compact',
    badge: 'Verified • Signature Glow',
  },
  'matte-lip-stain': {
    zoneId: 'bestsellers',
    position3D: [-5.8, 1.55, -0.9],
    modelType: 'lipgloss',
    badge: '12 Shades • Preview',
  },
  'liquid-blush': {
    zoneId: 'bestsellers',
    position3D: [-5.8, 1.55, 1.3],
    modelType: 'foundation',
    badge: '5 Shades • Preview',
  },
  'stipple-blend-foundation-brush': {
    zoneId: 'discovery-room',
    position3D: [5.8, 1.48, -0.9],
    modelType: 'brushset',
    badge: 'Verified • Artistry Brush',
  },
  'pro-cheek-palette': {
    zoneId: 'discovery-room',
    position3D: [5.8, 1.48, 1.3],
    modelType: 'palette',
    badge: '3-in-1 Preview',
  },
};

function inferCategoryAndModel(
  title: string,
  categoriesText: string
): {
  category: BoutiqueProduct['category'];
  modelType: ProductModelType;
  zoneId: Exclude<BoutiqueZoneId, 'rotunda'>;
  finish: FinishType;
} {
  const t = title.toLowerCase();
  const c = categoriesText.toLowerCase();

  if (
    t.includes('brush') ||
    t.includes('blender') ||
    t.includes('sponge') ||
    t.includes('tweezer') ||
    t.includes('bag') ||
    t.includes('blotting')
  ) {
    return {
      category: 'Artistry Brushes',
      modelType: 'brushset',
      zoneId: 'discovery-room',
      finish: 'Satin Crème',
    };
  }
  if (
    t.includes('lipstick') ||
    t.includes('lip liner') ||
    t.includes('lip balm') ||
    t.includes('lip butter')
  ) {
    const isMatte = t.includes('matte');
    return {
      category: 'Lipstick',
      modelType: 'lipstick',
      zoneId: t.includes('luxury') ? 'collection' : 'makeup-wall',
      finish: isMatte ? 'Velvet Matte' : 'Satin Crème',
    };
  }
  if (
    t.includes('lip gloss') ||
    t.includes('lip oil') ||
    t.includes('lip stain') ||
    t.includes('lip plumper') ||
    t.includes('shimmer')
  ) {
    return {
      category: 'Lip Gloss',
      modelType: 'lipgloss',
      zoneId: c.includes('bestseller') ? 'bestsellers' : 'makeup-wall',
      finish: t.includes('stain') ? 'Velvet Matte' : 'Mirror Gloss',
    };
  }
  if (
    t.includes('eyeshadow') ||
    t.includes('cheek palette') ||
    t.includes('blush palette')
  ) {
    return {
      category: t.includes('eye') ? 'Eye Couture' : 'Blush & Glow',
      modelType: 'palette',
      zoneId: t.includes('eye') ? 'makeup-wall' : 'beauty-counter',
      finish: 'Rose Shimmer',
    };
  }
  if (t.includes('powder foundation')) {
    return {
      category: 'Complexion',
      modelType: 'compact',
      zoneId: 'beauty-counter',
      finish: 'Velvet Matte',
    };
  }
  if (
    t.includes('blush') ||
    t.includes('bronzer') ||
    t.includes('luminizing') ||
    t.includes('highlighter') ||
    t.includes('finishing powder')
  ) {
    return {
      category: 'Blush & Glow',
      modelType: 'compact',
      zoneId: c.includes('bestseller') ? 'bestsellers' : 'collection',
      finish:
        t.includes('luminizing') || t.includes('highlighter')
          ? 'Rose Shimmer'
          : 'Satin Crème',
    };
  }
  if (
    (t.includes('eyeliner') ||
      t.includes('eyebrow') ||
      t.includes('brow') ||
      t.includes('mascara') ||
      t.includes('lash') ||
      t.includes('eye definer') ||
      t.includes('eye primer') ||
      t.includes('eye & lip primer') ||
      t.includes('pro line') ||
      t.includes('glitter')) &&
    !t.includes('eye cream')
  ) {
    return {
      category: 'Eye Couture',
      modelType: 'lipgloss',
      zoneId: 'makeup-wall',
      finish: 'Velvet Matte',
    };
  }
  if (
    t.includes('foundation') ||
    t.includes('bb cream') ||
    t.includes('conceal') ||
    t.includes('tinted moisturizer') ||
    t.includes('primer') ||
    t.includes('setting spray')
  ) {
    return {
      category: 'Complexion',
      modelType: 'foundation',
      zoneId: 'beauty-counter',
      finish: 'Luminous Silk',
    };
  }

  return {
    category: 'Skincare & Body',
    modelType: 'foundation',
    zoneId: c.includes('bestseller')
      ? 'bestsellers'
      : c.includes('new')
      ? 'discovery-room'
      : 'collection',
    finish: 'Luminous Silk',
  };
}

function analyzeRegulatoryProfile(
  slug: string,
  title: string,
  description: string,
  ingredients: string,
  category: BoutiqueProduct['category'],
  manufacturerVerified: boolean
): {
  isVegan: boolean;
  isParabenFree: boolean;
  originLabel: string;
  safetyAdvisory: string;
  safetyAdvisoryFr: string;
  highlights: string[];
  howToApply: string;
} {
  const ingLower = ingredients.toLowerCase();
  const descLower = description.toLowerCase();
  const titleLower = title.toLowerCase();

  // Per Owner Directive (P0-REG-01): Do not introduce unverified product claims.
  // Vegan & Paraben-Free badges remain suppressed (false) until signed manufacturer CoAs are uploaded.
  const isVegan = false;
  const isParabenFree = false;

  const originLabel = descLower.includes('made in china')
    ? 'Imported'
    : descLower.includes('made in canada')
    ? 'Made in Canada'
    : 'Made in North America';

  // Bilingual English & French Cautionary Warnings (US FDA / MoCRA & Health Canada Cosmetic Regulations s. 18 & 24)
  let safetyAdvisory =
    'WARNING: For external use only. Avoid direct contact with inner eyes. Perform a patch test prior to first use; discontinue use if irritation or rash occurs. Keep out of reach of children.';
  let safetyAdvisoryFr =
    'MISE EN GARDE : Pour usage externe seulement. Éviter tout contact direct avec les yeux. Effectuer un test cutané avant la première utilisation ; cesser l’emploi en cas d’irritation ou d’éruption cutanée. Garder hors de la portée des enfants.';

  if (slug === 'scented-candle') {
    safetyAdvisory =
      'CPSC FIRE SAFETY WARNING: Burn within sight on a heat-resistant surface. Keep away from flammable objects, drafts, children, and pets. Trim wick to 1/4 inch before each lighting and do not burn for more than 4 hours at a time.';
    safetyAdvisoryFr =
      'MISE EN GARDE CONTRE LES INCENDIES : Faire brûler sous surveillance sur une surface résistante à la chaleur. Tenir loin des objets inflammables, des courants d’air, des enfants et des animaux. Couper la mèche à 6 mm avant chaque allumage et ne pas faire brûler plus de 4 heures consécutives.';
  } else if (
    slug === 'tanning-drops' ||
    slug === 'tanning-mousse' ||
    ingLower.includes('dihydroxyacetone')
  ) {
    safetyAdvisory =
      '21 CFR § 740.19 SUNLESS TANNER WARNING: This product does not contain a sunscreen and does not protect against sunburn. Repeated exposure of unprotected skin while tanning may increase the risk of skin aging, skin cancer, and other harmful effects to the skin even if you do not burn. For external use only.';
    safetyAdvisoryFr =
      'MISE EN GARDE POUR AUTOBRONZANT : Ce produit ne contient pas d’écran solaire et ne protège pas contre les coups de soleil. L’exposition répétée de la peau non protégée pendant le bronzage peut augmenter le risque de vieillissement cutané, de cancer de la peau et d’autres effets nocifs, même en l’absence de coup de soleil. Pour usage externe seulement.';
  } else if (
    ingLower.includes('glycolic acid') ||
    ingLower.includes('retinol') ||
    ingLower.includes('retinyl palmitate')
  ) {
    safetyAdvisory =
      'FDA / HEALTH CANADA AHA & RETINOID SUNBURN ALERT: This product contains an alpha-hydroxy acid (AHA) and/or retinoid that may increase your skin’s sensitivity to the sun and particularly the possibility of sunburn. Use a broad-spectrum sunscreen, wear protective clothing, and limit sun exposure while using this product and for a week afterwards.';
    safetyAdvisoryFr =
      'ALERTE AUX COUPS DE SOLEIL (AHA / RÉTINOÏDES) : Ce produit contient un acide alpha-hydroxylé (AHA) et/ou un rétinoïde pouvant accroître la sensibilité de votre peau au soleil et particulièrement le risque de coup de soleil. Utiliser un écran solaire à large spectre, porter des vêtements protecteurs et limiter l’exposition au soleil pendant l’utilisation de ce produit et durant la semaine suivante.';
  } else if (category === 'Artistry Brushes') {
    safetyAdvisory =
      'CARE ADVISORY: Cleanse tool regularly with mild brush cleanser or gentle soap and lukewarm water. Reshape and lay flat to air dry completely before storage.';
    safetyAdvisoryFr =
      'CONSEIL D’ENTRETIEN : Nettoyer régulièrement l’accessoire avec un nettoyant doux pour pinceaux et de l’eau tiède. Remodeler et laisser sécher à plat à l’air libre avant le rangement.';
  }

  const verificationLine = manufacturerVerified
    ? 'Complete Manufacturer INCI Specification On File'
    : 'UNVERIFIED — Purchase Locked Pending Full Manufacturer INCI Sheet';

  let highlights: string[] = [];
  let howToApply = '';

  if (slug === 'scented-candle') {
    highlights = [
      'Hand-poured coconut and soy wax blend for an even burn',
      'Infused with aromatic fragrance profiles',
      verificationLine,
      `${originLabel} • Signature Pretty Piggie vessel`,
    ];
    howToApply =
      'Trim cotton wick to 1/4 inch before lighting. Allow the wax pool to reach the vessel edges on first burn.';
  } else if (category === 'Artistry Brushes') {
    highlights = [
      'Ergonomically balanced for artistry and precision control',
      'Synthetic materials designed for seamless application',
      verificationLine,
      `${originLabel} • Signature Pretty Piggie Makeup collection`,
    ];
    howToApply = titleLower.includes('bag')
      ? 'Store your Pretty Piggie Makeup essentials upright or wipe interior lining clean with a damp cloth.'
      : titleLower.includes('tweezer')
      ? 'Grip individual stray hairs at the root in the direction of growth for precise brow shaping.'
      : titleLower.includes('blotting')
      ? 'Gently press a single sheet onto the T-zone, chin, or cheeks to absorb excess surface shine.'
      : titleLower.includes('sponge') || titleLower.includes('blender')
      ? 'Dampen with water and squeeze out excess moisture before bouncing cream, liquid, or cleanser across the face.'
      : 'Use gentle sweeping or stippling motions to apply, buff, and blend liquid, cream, or powder formulas.';
  } else if (category === 'Skincare & Body') {
    highlights = [
      'Formulated with skin-conditioning botanical extracts and humectants',
      'Lightweight texture layers smoothly into daily skincare routines',
      verificationLine,
      `${originLabel} • Signature Pretty Piggie Makeup skincare`,
    ];
    howToApply =
      'Apply to clean skin using gentle upward motions. Follow with broad-spectrum sun protection during daytime use.';
  } else if (category === 'Lipstick' || category === 'Lip Gloss') {
    highlights = [
      'Buildable color payoff with comfortable wear',
      'Conditioning base designed for smooth application',
      verificationLine,
      `${originLabel} • Signature Pretty Piggie Makeup lip collection`,
    ];
    howToApply =
      'Glide evenly across clean lips starting from the center of the Cupid’s bow outward.';
  } else if (category === 'Eye Couture') {
    highlights = [
      'High-definition pigment designed for smooth wear',
      'Blends for daytime definition or evening drama',
      verificationLine,
      `${originLabel} • Signature Pretty Piggie Makeup eye collection`,
    ];
    howToApply =
      'Apply gently along the lash line, brow, or eyelid using a precision Pretty Piggie artistry brush or applicator.';
  } else {
    highlights = [
      'Buildable finish that blends smoothly across skin',
      'Formulated to flatter natural facial contours',
      verificationLine,
      `${originLabel} • Signature Pretty Piggie Makeup complexion bar`,
    ];
    howToApply =
      'Apply evenly to clean, moisturized skin from the center of the face outward using a brush, blender, or fingertips.';
  }

  return {
    isVegan,
    isParabenFree,
    originLabel,
    safetyAdvisory,
    safetyAdvisoryFr,
    highlights,
    howToApply,
  };
}

interface SanitizedCatalogItem {
  id: string;
  slug: string;
  sku: string;
  title: string;
  subtitle: string;
  description: string;
  ingredients: string;
  price: number;
  inStock: boolean;
  manufacturerVerified: boolean;
  inciStatus: InciVerificationStatus;
  canPurchase: boolean;
  categoriesText: string;
  imageUrls: string[];
  primaryImage: string | null;
  boxImage: string | null;
  shades: Array<{
    id: string;
    name: string;
    rgb: string;
    hex: string;
    sku: string;
    inStock: boolean;
  }>;
}

const rawItems = blankaCatalogRaw as SanitizedCatalogItem[];

export const PRETTYPIGGIE_PRODUCTS: BoutiqueProduct[] = rawItems.map((item) => {
  const heroPlacement = SHOWROOM_HERO_PLACEMENTS[item.slug];
  const inferred = inferCategoryAndModel(item.title, item.categoriesText);

  const modelType = heroPlacement?.modelType ?? inferred.modelType;
  const zoneId = heroPlacement?.zoneId ?? inferred.zoneId;
  const isBestseller = item.categoriesText
    .toLowerCase()
    .includes('bestseller');
  const isNewArrival = item.categoriesText.toLowerCase().includes('new');

  const manufacturerVerified = Boolean(item.manufacturerVerified);
  const canPurchase = Boolean(manufacturerVerified && item.inStock);

  const regProfile = analyzeRegulatoryProfile(
    item.slug,
    item.title,
    item.description,
    item.ingredients,
    inferred.category,
    manufacturerVerified
  );

  const shades: ProductShade[] = item.shades.map((s) => ({
    id: s.id,
    name: s.name,
    hex: s.hex,
    secondaryHex: '#FCE4EC',
    finish: inferred.finish,
    sku: s.sku,
    inStock: canPurchase,
    shopifyVariantId: `gid://shopify/ProductVariant/${s.sku}`,
  }));

  return {
    id: item.id,
    handle: item.slug,
    sku: item.sku,
    title: item.title,
    subtitle: item.subtitle,
    category: inferred.category,
    modelType,
    zoneId,
    isShowroomFloorHero: Boolean(heroPlacement),
    position3D: heroPlacement?.position3D ?? [0, 1.5, 0],
    price: item.price,
    inStock: item.inStock,
    manufacturerVerified,
    inciStatus: item.inciStatus || 'UNVERIFIED_MISSING_SPEC',
    canPurchase,
    primaryImage: item.primaryImage,
    boxImage: item.boxImage,
    rating: 4.9,
    reviewCount: 1,
    badge: !manufacturerVerified
      ? 'UNVERIFIED • Hold'
      : !item.inStock
      ? 'Sold Out'
      : heroPlacement?.badge ||
        (isBestseller
          ? 'Verified • Bestseller'
          : isNewArrival
          ? 'Verified • New'
          : 'Verified INCI'),
    isBestseller,
    isNewArrival,
    isVegan: regProfile.isVegan,
    isParabenFree: regProfile.isParabenFree,
    originLabel: regProfile.originLabel,
    safetyAdvisory: regProfile.safetyAdvisory,
    safetyAdvisoryFr: regProfile.safetyAdvisoryFr,
    description: item.description,
    highlights: regProfile.highlights,
    ingredients: item.ingredients,
    howToApply: regProfile.howToApply,
    shades,
    reviews: [
      {
        id: `editorial-${item.slug}-1`,
        author: 'Pretty Piggie Boutique Editorial Team',
        handle: 'Curator Note',
        rating: 5,
        date: 'Boutique Curation',
        shadeName: shades[0]?.name || 'Signature Formula',
        comment: `${item.subtitle} Featured in the Pretty Piggie Makeup ${
          zoneId === 'makeup-wall'
            ? 'Makeup Wall'
            : zoneId === 'beauty-counter'
            ? 'Beauty Counter'
            : zoneId === 'bestsellers'
            ? 'Bestsellers Display'
            : zoneId === 'discovery-room'
            ? 'Discovery Room'
            : 'Signature Collection'
        }.`,
        verified: false,
      },
    ],
  };
});

/** The 11 signature 3D hero products mounted on the 3D showroom shelves, counters, and podiums */
export const SHOWROOM_FLOOR_PRODUCTS: BoutiqueProduct[] =
  PRETTYPIGGIE_PRODUCTS.filter((p) => p.isShowroomFloorHero);
