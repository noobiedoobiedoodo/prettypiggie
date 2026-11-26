import blankaCatalogRaw from './blankaCatalog.json';
import {
  AvailabilityState,
  BoutiqueProduct,
  BoutiqueZone,
  BoutiqueZoneId,
  CatalogReconciliationSummary,
  FinishType,
  InciVerificationStatus,
  IngredientEvidenceTier,
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
    subtitle: '7-Shade Eyeshadows, Brow Pencils & Luminous Glitter Dust',
    description:
      'Floor-to-ceiling rounded blush alcoves outlined in warm glowing LED light strips, showcasing 7-shade Single Pan Eyeshadows, 5-shade Automatic Eyebrow Pencils, and Glitter Dust.',
    badge: 'Eye Couture Wall',
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
    subtitle: '4-Shade Bronzers, Complexion Primers & Finishing Mists',
    description:
      'Explore velvety 4-shade Bronzer compacts, smoothing Foundation Primer, Finishing Powder, and Oil Control Setting Spray across our dual-LED blush beauty counter.',
    badge: 'Complexion & Glow Bar',
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
    subtitle: 'Luminizing Powder, Niacinamide Serums & Luxury Skincare',
    description:
      'Our flagship central oval islands trimmed in brushed champagne rose-gold, featuring Luminizing Powder, Niacinamide Vitamin Boost Serum, and signature skincare rituals.',
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
    subtitle: 'Glycolic Acid Serum, Eyebrow Gel & Iconic Essentials',
    description:
      'Our highest-demand ready-to-ship favorites—including Glycolic Acid Serum, sculpting Eyebrow Gel, and Classic Blender—elevated on LED-rimmed blush pedestals.',
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
    subtitle: 'Pro Artistry Brushes, Blending Tools & New Arrivals',
    description:
      'Enter our high-gloss pink sanctuary featuring Stipple & Blend Brushes, Cheek Fan Brushes, Hydrating Facial Cleanser, and fresh seasonal drops.',
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

// 11 Hero 3D Showroom Floor Placements — 100% VERIFIED_IN_STOCK prestige beauty heroes
const SHOWROOM_HERO_PLACEMENTS: Record<
  string,
  {
    zoneId: Exclude<BoutiqueZoneId, 'rotunda'>;
    position3D: [number, number, number];
    modelType: ProductModelType;
    badge: string;
  }
> = {
  'automatic-eyebrow-pencil': {
    zoneId: 'makeup-wall',
    position3D: [-2.6, 2.55, -6.68],
    modelType: 'lipgloss',
    badge: '5 Shades • In Stock',
  },
  'single-pan-eyeshadow': {
    zoneId: 'makeup-wall',
    position3D: [0.0, 2.55, -6.68],
    modelType: 'palette',
    badge: '7 Shades • In Stock',
  },
  'glitter-dust': {
    zoneId: 'makeup-wall',
    position3D: [2.6, 2.55, -6.56],
    modelType: 'compact',
    badge: '4 Shades • In Stock',
  },
  'foundation-primer': {
    zoneId: 'beauty-counter',
    position3D: [-1.4, 1.38, -3.5],
    modelType: 'foundation',
    badge: 'Complexion Prep',
  },
  bronzer: {
    zoneId: 'beauty-counter',
    position3D: [1.4, 1.38, -3.5],
    modelType: 'compact',
    badge: '4 Shades • Sculpt',
  },
  'niacinamide-vitamin-boost-serum': {
    zoneId: 'collection',
    position3D: [-1.45, 1.32, 1.2],
    modelType: 'foundation',
    badge: 'Signature Elixir',
  },
  'luminizing-powder': {
    zoneId: 'collection',
    position3D: [1.45, 1.32, 2.2],
    modelType: 'compact',
    badge: '2 Shades • Glow',
  },
  'eyebrow-gel': {
    zoneId: 'bestsellers',
    position3D: [-5.8, 1.55, -0.9],
    modelType: 'lipgloss',
    badge: 'Bestseller',
  },
  'glycolic-acid-serum': {
    zoneId: 'bestsellers',
    position3D: [-5.8, 1.55, 1.3],
    modelType: 'foundation',
    badge: 'Bestseller',
  },
  'stipple-blend-foundation-brush': {
    zoneId: 'discovery-room',
    position3D: [5.8, 1.48, -0.9],
    modelType: 'brushset',
    badge: 'Artistry Brush',
  },
  'hydrating-facial-cleanser': {
    zoneId: 'discovery-room',
    position3D: [5.8, 1.48, 1.3],
    modelType: 'foundation',
    badge: 'New Drop',
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
    ? 'Complete INCI List Transcribed From Supplier Listing (Authoritative Manufacturer Certification Pending)'
    : 'UNVERIFIED — Purchase Locked Pending Authoritative Manufacturer INCI Sheet';

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
  manufacturerCertifiedDocOnFile?: boolean;
  ingredientEvidenceTier?: IngredientEvidenceTier;
  inciStatus: InciVerificationStatus;
  availabilityState?: AvailabilityState;
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

  // Strict deterministic 3-state availability derivation (never trust manual unlock flags)
  const inciStatus: InciVerificationStatus =
    item.inciStatus || 'UNVERIFIED_MISSING_SPEC';
  const manufacturerVerified =
    Boolean(item.manufacturerVerified) && inciStatus === 'VERIFIED_COMPLETE';
  const manufacturerCertifiedDocOnFile = Boolean(
    item.manufacturerCertifiedDocOnFile
  );
  const ingredientEvidenceTier: IngredientEvidenceTier =
    manufacturerCertifiedDocOnFile
      ? 'MANUFACTURER_CERTIFIED_DOC_ON_FILE'
      : manufacturerVerified
      ? 'SUPPLIER_LISTING_COMPLETE_TRANSCRIPTION'
      : 'INCOMPLETE_OR_MISSING_LISTING';
  const inStock = Boolean(item.inStock);
  const availabilityState: AvailabilityState = !manufacturerVerified
    ? 'UNVERIFIED_PURCHASE_LOCKED'
    : !inStock
    ? 'VERIFIED_OUT_OF_STOCK'
    : 'VERIFIED_IN_STOCK';
  const canPurchase = availabilityState === 'VERIFIED_IN_STOCK';

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
    // Resolved server-side to live numeric Shopify ProductVariant GIDs in POST /api/checkout
    shopifyVariantId: '',
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
    inStock,
    manufacturerVerified,
    manufacturerCertifiedDocOnFile,
    ingredientEvidenceTier,
    inciStatus,
    availabilityState,
    canPurchase,
    primaryImage: item.primaryImage,
    boxImage: item.boxImage,
    rating: 4.9,
    reviewCount: 1,
    badge:
      availabilityState === 'UNVERIFIED_PURCHASE_LOCKED'
        ? 'UNVERIFIED • Locked'
        : availabilityState === 'VERIFIED_OUT_OF_STOCK'
        ? 'Verified • Out of Stock'
        : heroPlacement?.badge ||
          (isBestseller
            ? 'Verified • Bestseller'
            : isNewArrival
            ? 'Verified • New'
            : 'Verified • In Stock'),
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

/** Authoritative reconciled counts matching MANUFACTURER_DOCUMENTATION_REGISTER.md & JSON */
export const CATALOG_RECONCILIATION: CatalogReconciliationSummary = {
  totalProducts: PRETTYPIGGIE_PRODUCTS.length,
  verifiedComplete: PRETTYPIGGIE_PRODUCTS.filter((p) => p.manufacturerVerified)
    .length,
  verifiedInStock: PRETTYPIGGIE_PRODUCTS.filter(
    (p) => p.availabilityState === 'VERIFIED_IN_STOCK'
  ).length,
  verifiedOutOfStock: PRETTYPIGGIE_PRODUCTS.filter(
    (p) => p.availabilityState === 'VERIFIED_OUT_OF_STOCK'
  ).length,
  unverifiedPurchaseLocked: PRETTYPIGGIE_PRODUCTS.filter(
    (p) => p.availabilityState === 'UNVERIFIED_PURCHASE_LOCKED'
  ).length,
  unverifiedTruncatedSpec: PRETTYPIGGIE_PRODUCTS.filter(
    (p) => p.inciStatus === 'UNVERIFIED_TRUNCATED_SPEC'
  ).length,
  unverifiedMissingSpec: PRETTYPIGGIE_PRODUCTS.filter(
    (p) => p.inciStatus === 'UNVERIFIED_MISSING_SPEC'
  ).length,
  supplierListingCompleteTranscriptions: PRETTYPIGGIE_PRODUCTS.filter(
    (p) => p.ingredientEvidenceTier === 'SUPPLIER_LISTING_COMPLETE_TRANSCRIPTION'
  ).length,
  manufacturerCertifiedDocumentsOnFile: PRETTYPIGGIE_PRODUCTS.filter(
    (p) => p.manufacturerCertifiedDocOnFile
  ).length,
};

const MENS_GROOMING_HANDLES = new Set([
  'beard-butter',
  'beard-oil',
  'foaming-beard-wash',
  'hemp-infused-beard-growth-oil',
  'men-s-face-moisturizer',
  'men-s-shampoo',
  'men-s-under-eye-cream',
]);

const CATEGORY_MERCH_PRIORITY: Record<BoutiqueProduct['category'], number> = {
  'Eye Couture': 1,
  'Blush & Glow': 2,
  Complexion: 3,
  Lipstick: 4,
  'Lip Gloss': 5,
  'Artistry Brushes': 6,
  'Skincare & Body': 7,
};

function getMerchandisingScore(product: BoutiqueProduct): number {
  let score = 0;
  // 1. Strict availability tiering: Buyable (52) -> Verified OOS (4) -> Preview Locked (54)
  if (product.availabilityState === 'VERIFIED_IN_STOCK') score += 10000;
  else if (product.availabilityState === 'VERIFIED_OUT_OF_STOCK') score += 5000;

  // 2. Hero showroom items & multi-shade color cosmetics surface first
  if (product.isShowroomFloorHero) score += 900;
  if (product.shades.length > 1) score += 450 + Math.min(product.shades.length, 15) * 15;
  if (product.isBestseller) score += 260;
  if (product.isNewArrival) score += 180;

  // 3. Keep luxury color makeup & tools ahead of specialty grooming while keeping all items discoverable
  score += (8 - (CATEGORY_MERCH_PRIORITY[product.category] ?? 7)) * 40;
  if (MENS_GROOMING_HANDLES.has(product.handle)) score -= 600;

  return score;
}

/** Deterministic luxury merchandising sort: 52 buyable heroes first, then 4 OOS, then 54 preview-locked */
export function sortProductsForMerchandising(
  items: BoutiqueProduct[]
): BoutiqueProduct[] {
  return [...items].sort((a, b) => {
    const diff = getMerchandisingScore(b) - getMerchandisingScore(a);
    if (diff !== 0) return diff;
    return a.title.localeCompare(b.title);
  });
}

const ROUTINE_PAIRING_HANDLES: Record<string, string[]> = {
  'Eye Couture': [
    'mini-crease-brush',
    'packing-eye-brush',
    'angled-liner-brush',
    'eyebrow-gel',
    'precision-tweezers',
  ],
  'Blush & Glow': [
    'cheek-fan-brush',
    'classic-blender',
    'setting-spray',
    'bronzer',
    'luminizing-powder',
  ],
  Complexion: [
    'classic-blender',
    'stipple-blend-foundation-brush',
    'setting-spray',
    'finishing-powder',
    'mattifying-face-primer',
  ],
  'Artistry Brushes': [
    'luminizing-powder',
    'bronzer',
    'single-pan-eyeshadow',
    'classic-blender',
    'foundation-primer',
  ],
  'Skincare & Body': [
    'natural-konjac-sponge',
    'makeup-remover-solution',
    'hydrating-facial-cleanser',
    'hydration-serum',
    'niacinamide-vitamin-boost-serum',
  ],
};

/**
 * Compliance-locked cross-sell engine for the Shopping Bag Drawer.
 * Strictly recommends ONLY VERIFIED_IN_STOCK (canPurchase) items not already in cart,
 * optimized to pair by routine and close the gap to $65 Free Express Shipping.
 */
export function getBagCrossSells(
  allProducts: BoutiqueProduct[],
  cartItems: Array<{ productId: string; category: string; productHandle: string }>,
  amountToFreeShipping: number,
  limit = 3
): BoutiqueProduct[] {
  const inCartIds = new Set(cartItems.map((i) => i.productId));
  const cartHasMens = cartItems.some((i) =>
    MENS_GROOMING_HANDLES.has(i.productHandle)
  );
  const preferredHandles = new Set<string>();
  for (const item of cartItems) {
    for (const h of ROUTINE_PAIRING_HANDLES[item.category] ?? []) {
      preferredHandles.add(h);
    }
  }

  const eligible = allProducts.filter(
    (p) =>
      p.availabilityState === 'VERIFIED_IN_STOCK' &&
      p.canPurchase &&
      p.manufacturerVerified &&
      p.inStock &&
      !inCartIds.has(p.id) &&
      (cartHasMens || !MENS_GROOMING_HANDLES.has(p.handle))
  );

  return eligible
    .sort((a, b) => {
      const score = (p: BoutiqueProduct) => {
        let s = 0;
        if (preferredHandles.has(p.handle)) s += 500;
        if (p.isShowroomFloorHero) s += 160;
        if (p.isBestseller) s += 140;
        if (amountToFreeShipping > 0) {
          // Strongly prioritize 1-item free-shipping threshold closers
          if (
            p.price >= amountToFreeShipping &&
            p.price <= amountToFreeShipping + 22
          ) {
            s += 420;
          } else if (p.price >= amountToFreeShipping) {
            s += 180;
          } else if (p.price <= 28) {
            s += 120;
          }
        } else if (p.price <= 35) {
          s += 100;
        }
        return s;
      };
      const diff = score(b) - score(a);
      return diff !== 0 ? diff : a.price - b.price;
    })
    .slice(0, limit);
}

/** Compliance-locked ready-to-ship alternatives for locked or out-of-stock product sheets */
export function getReadyToShipAlternatives(
  allProducts: BoutiqueProduct[],
  currentProduct: BoutiqueProduct,
  limit = 2
): BoutiqueProduct[] {
  const eligible = sortProductsForMerchandising(
    allProducts.filter(
      (p) =>
        p.id !== currentProduct.id &&
        p.availabilityState === 'VERIFIED_IN_STOCK' &&
        p.canPurchase &&
        p.manufacturerVerified &&
        p.inStock &&
        !MENS_GROOMING_HANDLES.has(p.handle)
    )
  );
  const sameCategory = eligible.filter(
    (p) => p.category === currentProduct.category
  );
  const combined = [
    ...sameCategory,
    ...eligible.filter((p) => p.category !== currentProduct.category),
  ];
  return combined.slice(0, limit);
}
