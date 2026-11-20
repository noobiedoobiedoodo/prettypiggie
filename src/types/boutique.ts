export type BoutiqueZoneId =
  | 'rotunda'
  | 'makeup-wall'
  | 'beauty-counter'
  | 'collection'
  | 'bestsellers'
  | 'discovery-room';

export type ProductModelType =
  | 'lipstick'
  | 'lipgloss'
  | 'compact'
  | 'foundation'
  | 'palette'
  | 'brushset';

export type FinishType =
  | 'Satin Crème'
  | 'Velvet Matte'
  | 'Mirror Gloss'
  | 'Luminous Silk'
  | 'Rose Shimmer';

export interface CameraWaypoint {
  position: [number, number, number];
  target: [number, number, number];
  fov: number;
}

export interface BoutiqueZone {
  id: BoutiqueZoneId;
  name: string;
  shortName: string;
  subtitle: string;
  description: string;
  badge: string;
  referenceImage: string;
  accentColor: string;
  /** Portrait-first mobile camera waypoint (9:16 aspect ratio priority) */
  mobileCamera: CameraWaypoint;
  /** Tablet camera waypoint */
  tabletCamera: CameraWaypoint;
  /** Expansive desktop showroom camera waypoint */
  desktopCamera: CameraWaypoint;
}

export interface ProductShade {
  id: string;
  name: string;
  hex: string;
  secondaryHex?: string;
  finish: FinishType;
  sku: string;
  inStock: boolean;
  shopifyVariantId: string;
}

export interface ProductReview {
  id: string;
  author: string;
  handle?: string;
  rating: number;
  date: string;
  shadeName: string;
  comment: string;
  verified: boolean;
}

export interface BoutiqueProduct {
  id: string;
  handle: string;
  sku: string;
  title: string;
  subtitle: string;
  category:
    | 'Lipstick'
    | 'Lip Gloss'
    | 'Blush & Glow'
    | 'Complexion'
    | 'Eye Couture'
    | 'Artistry Brushes'
    | 'Skincare & Body';
  modelType: ProductModelType;
  zoneId: Exclude<BoutiqueZoneId, 'rotunda'>;
  /** Whether this product is physically mounted on the 3D showroom floor/shelves */
  isShowroomFloorHero?: boolean;
  /** 3D coordinates inside the virtual boutique showroom */
  position3D: [number, number, number];
  rotation3D?: [number, number, number];
  /** Retail selling price */
  price: number;
  inStock: boolean;
  /** Real Pretty Piggie Makeup Branded Product Render URL */
  primaryImage?: string | null;
  /** Real Pretty Piggie Makeup Branded Packaging Box Render URL */
  boxImage?: string | null;
  compareAtPrice?: number;
  rating: number;
  reviewCount: number;
  badge?: string;
  isBestseller?: boolean;
  isNewArrival?: boolean;
  /** Verified from INCI declaration */
  isVegan: boolean;
  /** Verified from INCI declaration */
  isParabenFree: boolean;
  /** Verified Country of Origin label */
  originLabel: string;
  /** Context-sensitive FDA / MoCRA / CPSC safety & external-use advisory */
  safetyAdvisory: string;
  description: string;
  highlights: string[];
  ingredients: string;
  howToApply: string;
  shades: ProductShade[];
  reviews: ProductReview[];
}

export interface CartItem {
  key: string;
  productId: string;
  productHandle: string;
  sku: string;
  title: string;
  category: string;
  modelType: ProductModelType;
  shadeId: string;
  shadeName: string;
  shadeHex: string;
  finish: FinishType;
  price: number;
  primaryImage?: string | null;
  quantity: number;
  shopifyVariantId: string;
}

export type PerformanceTier = 'high' | 'medium' | 'low';

export interface DeviceCapabilityProfile {
  tier: PerformanceTier;
  isMobile: boolean;
  isTablet: boolean;
  isPortrait: boolean;
  supportsWebGL: boolean;
  prefersReducedMotion: boolean;
  saveData: boolean;
  dpr: [number, number];
  particleCount: number;
  enableReflections: boolean;
  recommendFallback2D: boolean;
  gpuRenderer: string;
}

export type LegalPolicyTab =
  | 'privacy'
  | 'terms'
  | 'shipping'
  | 'safety'
  | 'accessibility';
