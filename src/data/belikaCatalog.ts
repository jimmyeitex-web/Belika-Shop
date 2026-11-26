import heroEditorialImg from '/src/assets/images/belika_hero_editorial_1795607166084.jpg';
import poloTrioImg from '/src/assets/images/belika_polo_trio_1795607162911.jpg';
import mensJacketImg from '/src/assets/images/belika_mens_jacket_1795607163902.jpg';
import womensKemisImg from '/src/assets/images/belika_womens_kemis_1795607165539.jpg';
import kidsSneakersImg from '/src/assets/images/belika_kids_sneakers_1795607164963.jpg';
import cottonTeeImg from '/src/assets/images/product_cotton_tee_1795708828630.jpg';
import cargoTrousersImg from '/src/assets/images/product_cargo_trousers_1795708829626.jpg';
import womensFlatsImg from '/src/assets/images/product_womens_flats_1795708829767.jpg';
import womensJumpsuitImg from '/src/assets/images/product_womens_jumpsuit_1795708830374.jpg';
import mensSuitImg from '/src/assets/images/product_mens_suit_1795708831098.jpg';

export {
  heroEditorialImg,
  poloTrioImg,
  mensJacketImg,
  womensKemisImg,
  kidsSneakersImg,
  cottonTeeImg,
  cargoTrousersImg,
  womensFlatsImg,
  womensJumpsuitImg,
  mensSuitImg,
};

export type Department = 'All' | 'Men' | 'Women' | 'Kids';
export type BranchDepartment = Exclude<Department, 'All'>;
export type Language = 'en' | 'am';
export type SortOption = 'featured' | 'price-asc' | 'price-desc' | 'rating' | 'newest' | 'bestselling';
export type PriceBand = 'all' | 'under-2500' | '2500-5000' | 'over-5000';
export type PaymentMethod = 'cod' | 'telebirr' | 'cbe';
export type DeliveryProvider = 'mela' | 'addis-courier' | 'regional-parcel' | 'pickup';
export type UserRole = 'customer' | 'merchant' | 'owner';

export type ColorSwatch = {
  name: string;
  nameAm?: string;
  hex: string;
};

export type BranchInfo = {
  department: BranchDepartment;
  title: string;
  titleAm: string;
  address: string;
  addressAm: string;
  landmark: string;
  landmarkAm: string;
  salesPhone: string;
  supportPhone: string;
  telegramChannel: string;
  telegramSupport: string;
  tiktokUrl: string;
  mapsUrl: string;
  coords: DeliveryCoordinates;
  hours: string;
  hoursAm: string;
  telebirrAccount: string;
  cbeAccount: string;
};

export type AuthUser = {
  id: string;
  name: string;
  identifier: string;
  phone?: string;
  email?: string;
  role: UserRole;
  assignedBranch: Department;
  active: boolean;
  createdAt: string;
};

export type SupportMessage = {
  id: string;
  orderId?: string;
  customerName: string;
  contact: string;
  department?: Department;
  topic: string;
  message: string;
  reply?: string;
  status: 'open' | 'resolved';
  createdAt: string;
};

export type StoreCategory = {
  id: string;
  name: string;
  nameAm: string;
  department: Department;
  subcategories: string[];
  accentColor: string;
  isCustom?: boolean;
};

export type ProductReview = {
  id: string;
  author: string;
  rating: number;
  fit: 'runs-small' | 'true-to-size' | 'runs-large';
  comment: string;
  createdAt: string;
};

export type ProductVariant = {
  id: string;
  size: string;
  color: string;
  stock: number;
};

export type Product = {
  id: string;
  department: Exclude<Department, 'All'>;
  category: string;
  subcategory?: string;
  name: string;
  nameAm: string;
  brand?: string;
  price: number;
  compareAtPrice?: number;
  badge?: 'Trending' | 'Flash Drop' | 'New' | 'Handmade' | 'Staple';
  sizes: string;
  sizeGuidance: string;
  sizeGuidanceAm: string;
  fabric?: string;
  pattern?: string;
  careInstructions?: string;
  soldCount?: number;
  styleTags?: string[];
  colorSwatches?: ColorSwatch[];
  customizable?: boolean;
  measurements?: string;
  rating?: number;
  reviewCount?: number;
  reviews?: ProductReview[];
  tint: string;
  images?: string[];
  imageLabels?: string[];
  imageLabelsAm?: string[];
  variants?: ProductVariant[];
  status?: 'draft' | 'published';
  isSample?: boolean;
  createdAt?: string;
  sourceUrl?: string;
  sourceChannel?: string;
  sourceDate?: string;
};

export type CartItem = {
  id: string;
  productId: string;
  variantId: string;
  size: string;
  color: string;
  quantity: number;
  customNote?: string;
};

export type OrderStatus = 'requested' | 'confirmed' | 'out-for-delivery' | 'completed' | 'cancelled';
export type CandidateKind = 'product' | 'possible-duplicate' | 'restock';
export type CandidateStatus =
  | 'pending'
  | 'prepared'
  | 'drafted'
  | 'duplicate'
  | 'kept'
  | 'restock-reviewed'
  | 'ignored';
export type CandidateFilter = 'pending' | 'all' | 'matches' | 'restocks';

export type TelegramCandidate = {
  id: string;
  department: Exclude<Department, 'All'>;
  name: string;
  price: number;
  sizeSpec: string;
  postedAt: string;
  channel: string;
  postUrl: string;
  kind: CandidateKind;
  groupId?: string;
  note?: string;
  status?: CandidateStatus;
};

export type DeliveryCoordinates = {
  lat: number;
  lng: number;
};

export type PromoCode = {
  code: string;
  type: 'percent' | 'fixed';
  value: number;
  minSubtotal?: number;
  label: string;
  labelAm: string;
  active: boolean;
};

export type CustomerProfile = {
  name: string;
  phone: string;
  email?: string;
  preferredCity?: string;
  preferredSubcity?: string;
  preferredAddress?: string;
  preferredLandmark?: string;
  preferredCoords?: DeliveryCoordinates;
  preferredZone?: string;
  preferredDistanceKm?: number;
  preferredFee?: number;
};

export type StoreOrder = {
  id: string;
  userId?: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  fulfillment: 'pickup' | 'delivery';
  deliveryProvider?: DeliveryProvider;
  deliveryCity?: string;
  deliverySubcity?: string;
  paymentMethod?: PaymentMethod;
  paymentReference?: string;
  paymentProofImage?: string;
  promoCode?: string;
  discountAmount?: number;
  deliveryAddress?: string;
  deliveryLandmark?: string;
  deliveryCoords?: DeliveryCoordinates;
  deliveryZone?: string;
  deliveryDistanceKm?: number;
  estimatedDeliveryFee?: number;
  items: CartItem[];
  subtotal: number;
  total: number;
  status: OrderStatus;
  createdAt: string;
  statusUpdatedAt?: string;
};

export type StockMovement = {
  id: string;
  productId: string;
  variantId: string;
  kind: 'restock' | 'sale' | 'order' | 'return';
  quantity: number;
  createdAt: string;
};

export type AiGarmentAnalysis = {
  name: string;
  nameAm: string;
  brand: string;
  department: Exclude<Department, 'All'>;
  category: string;
  subcategory: string;
  colors: Array<{ name: string; nameAm: string; hex: string }>;
  perImageColors?: string[];
  pattern: string;
  fabric: string;
  suggestedPriceEtb: number;
  recommendedSizes: string[];
  sizeGuidance: string;
  sizeGuidanceAm: string;
  styleTags: string[];
  customizable: boolean;
  description: string;
};

export type AiVisualSearchResult = {
  detectedItem: string;
  detectedItemAm: string;
  department: Department;
  category: string;
  colors: Array<{ name: string; nameAm: string; hex: string }>;
  styleKeywords: string[];
  matches: Array<{
    id: string;
    score: number;
    reason: string;
    reasonAm: string;
  }>;
};

export const HERO_IMAGE = heroEditorialImg;
export const FREE_DELIVERY_THRESHOLD = 5000;

export const BELIKA_SHOP_COORDS: DeliveryCoordinates = {
  lat: 9.0054,
  lng: 38.7636, // Bole / Olympia central Addis Ababa
};

export function computeDistanceKm(c1: DeliveryCoordinates, c2: DeliveryCoordinates): number {
  const R = 6371; // Earth radius in km
  const dLat = ((c2.lat - c1.lat) * Math.PI) / 180;
  const dLng = ((c2.lng - c1.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((c1.lat * Math.PI) / 180) *
      Math.cos((c2.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export function estimateAddisDeliveryFee(distanceKm: number): number {
  if (distanceKm <= 3) return 130;
  if (distanceKm <= 6) return 170;
  if (distanceKm <= 10) return 220;
  return Math.round(220 + (distanceKm - 10) * 20);
}

export const ADDIS_SUBCITIES: Array<{
  id: string;
  label: string;
  labelAm: string;
  en: string;
  am: string;
  feeEtb: number;
  coords: DeliveryCoordinates;
}> = [
  { id: 'bole', label: 'Bole Subcity', labelAm: 'ቦሌ ክፍለ ከተማ', en: 'Bole Subcity', am: 'ቦሌ ክፍለ ከተማ', feeEtb: 140, coords: { lat: 8.9974, lng: 38.7868 } },
  { id: 'kirkos', label: 'Kirkos Subcity', labelAm: 'ቂርቆስ ክፍለ ከተማ', en: 'Kirkos Subcity', am: 'ቂርቆስ ክፍለ ከተማ', feeEtb: 150, coords: { lat: 9.0102, lng: 38.7612 } },
  { id: 'yeka', label: 'Yeka Subcity', labelAm: 'የካ ክፍለ ከተማ', en: 'Yeka Subcity', am: 'የካ ክፍለ ከተማ', feeEtb: 180, coords: { lat: 9.0321, lng: 38.7901 } },
  { id: 'arada', label: 'Arada Subcity', labelAm: 'አራዳ ክፍለ ከተማ', en: 'Arada Subcity', am: 'አራዳ ክፍለ ከተማ', feeEtb: 180, coords: { lat: 9.0301, lng: 38.7521 } },
  { id: 'lideta', label: 'Lideta Subcity', labelAm: 'ልደታ ክፍለ ከተማ', en: 'Lideta Subcity', am: 'ልደታ ክፍለ ከተማ', feeEtb: 180, coords: { lat: 9.0081, lng: 38.7392 } },
  { id: 'addis-ketema', label: 'Addis Ketema Subcity', labelAm: 'አዲስ ከተማ ክፍለ ከተማ', en: 'Addis Ketema Subcity', am: 'አዲስ ከተማ ክፍለ ከተማ', feeEtb: 200, coords: { lat: 9.0274, lng: 38.7365 } },
  { id: 'nifas-silk', label: 'Nifas Silk-Lafto', labelAm: 'ንፋስ ስልክ ላፍቶ', en: 'Nifas Silk-Lafto', am: 'ንፋስ ስልክ ላፍቶ', feeEtb: 220, coords: { lat: 8.9754, lng: 38.7281 } },
  { id: 'kolfe', label: 'Kolfe Keranio', labelAm: 'ኮልፌ ቀራኒዮ', en: 'Kolfe Keranio', am: 'ኮልፌ ቀራኒዮ', feeEtb: 240, coords: { lat: 9.0154, lng: 38.7052 } },
  { id: 'gulele', label: 'Gulele Subcity', labelAm: 'ጉለሌ ክፍለ ከተማ', en: 'Gulele Subcity', am: 'ጉለሌ ክፍለ ከተማ', feeEtb: 240, coords: { lat: 9.0554, lng: 38.7382 } },
  { id: 'lemi-kura', label: 'Lemi Kura Subcity', labelAm: 'ለሚ ኩራ ክፍለ ከተማ', en: 'Lemi Kura Subcity', am: 'ለሚ ኩራ ክፍለ ከተማ', feeEtb: 240, coords: { lat: 9.0254, lng: 38.8521 } },
  { id: 'akaky', label: 'Akaky Kaliti', labelAm: 'አቃቂ ቃሊቲ', en: 'Akaky Kaliti', am: 'አቃቂ ቃሊቲ', feeEtb: 280, coords: { lat: 8.8754, lng: 38.7852 } },
];

export const ETHIOPIA_REGIONAL_CITIES: Array<{
  id: string;
  label: string;
  labelAm: string;
  en: string;
  am: string;
  feeEtb: number;
}> = [
  { id: 'adama', label: 'Adama / Nazret', labelAm: 'አዳማ / ናዝሬት', en: 'Adama / Nazret', am: 'አዳማ / ናዝሬት', feeEtb: 380 },
  { id: 'bishoftu', label: 'Bishoftu / Debre Zeit', labelAm: 'ቢሾፍቱ / ደብረ ዘይት', en: 'Bishoftu / Debre Zeit', am: 'ቢሾፍቱ / ደብረ ዘይት', feeEtb: 320 },
  { id: 'hawassa', label: 'Hawassa', labelAm: 'ሐዋሳ', en: 'Hawassa', am: 'ሐዋሳ', feeEtb: 450 },
  { id: 'bahir-dar', label: 'Bahir Dar', labelAm: 'ባሕር ዳር', en: 'Bahir Dar', am: 'ባሕር ዳር', feeEtb: 480 },
  { id: 'dire-dawa', label: 'Dire Dawa', labelAm: 'ድሬዳዋ', en: 'Dire Dawa', am: 'ድሬዳዋ', feeEtb: 480 },
  { id: 'mekelle', label: 'Mekelle', labelAm: 'መቀሌ', en: 'Mekelle', am: 'መቀሌ', feeEtb: 520 },
  { id: 'gondar', label: 'Gondar', labelAm: 'ጎንደር', en: 'Gondar', am: 'ጎንደር', feeEtb: 520 },
  { id: 'jimma', label: 'Jimma', labelAm: 'ጅማ', en: 'Jimma', am: 'ጅማ', feeEtb: 450 },
  { id: 'dessie', label: 'Dessie', labelAm: 'ደሴ', en: 'Dessie', am: 'ደሴ', feeEtb: 450 },
  { id: 'shashamane', label: 'Shashamane', labelAm: 'ሻሸመኔ', en: 'Shashamane', am: 'ሻሸመኔ', feeEtb: 420 },
  { id: 'harar', label: 'Harar', labelAm: 'ሐረር', en: 'Harar', am: 'ሐረር', feeEtb: 490 },
  { id: 'arba-minch', label: 'Arba Minch', labelAm: 'አርባ ምንጭ', en: 'Arba Minch', am: 'አርባ ምንጭ', feeEtb: 490 },
  { id: 'other-city', label: 'Other Ethiopian City', labelAm: 'ሌላ ከተማ', en: 'Other Ethiopian City', am: 'ሌላ ከተማ', feeEtb: 450 },
];

export const DELIVERY_PROVIDERS: Array<{
  id: DeliveryProvider;
  label: string;
  labelAm: string;
  en: string;
  am: string;
  note: string;
  noteAm: string;
  eta: string;
  etaAm: string;
}> = [
  { id: 'mela', label: 'Mela Delivery', labelAm: 'መላ ዴሊቨሪ (Mela)', en: 'Mela Delivery', am: 'መላ ዴሊቨሪ (Mela)', note: 'Same-day Addis doorstep', noteAm: 'በዚያው ቀን ቤትዎ ድረስ', eta: 'Same-day Addis doorstep', etaAm: 'በዚያው ቀን ቤትዎ ድረስ' },
  { id: 'addis-courier', label: 'Addis Bike Courier', labelAm: 'አዲስ ሞተር ኩሪየር', en: 'Addis Bike Courier', am: 'አዲስ ሞተር ኩሪየር', note: '2–4 hrs in Addis', noteAm: '2–4 ሰዓት በአዲስ አበባ', eta: '2–4 hrs in Addis', etaAm: '2–4 ሰዓት በአዲስ አበባ' },
  { id: 'regional-parcel', label: 'Regional Parcel / Bus', labelAm: 'የክልል ፓርሴል / አውቶብስ', en: 'Regional Parcel / Bus', am: 'የክልል ፓርሴል / አውቶብስ', note: '1–2 days nationwide', noteAm: '1–2 ቀናት ወደ ክልል', eta: '1–2 days nationwide', etaAm: '1–2 ቀናት ወደ ክልል' },
  { id: 'pickup', label: 'In-Store Pickup', labelAm: 'ከሱቅ መውሰድ', en: 'In-Store Pickup', am: 'ከሱቅ መውሰድ', note: 'Ready in 30 mins', noteAm: 'በ30 ደቂቃ ዝግጁ', eta: 'Ready in 30 mins', etaAm: 'በ30 ደቂቃ ዝግጁ' },
];

export const DEFAULT_BRANCHES: Record<BranchDepartment, BranchInfo> = {
  Women: {
    department: 'Women',
    title: 'Belika Women Boutique',
    titleAm: 'ቤሊካ ሴቶች ቡቲክ',
    address: 'Bole Medhanialem · Morning Star Mall Area, 2nd Floor',
    addressAm: 'ቦሌ መድኃኔዓለም · ሞርኒንግ ስታር አካባቢ፣ 2ኛ ፎቅ',
    landmark: 'Near Bole Medhanialem Church',
    landmarkAm: 'ቦሌ መድኃኔዓለም ቤተክርስቲያን አጠገብ',
    salesPhone: '+251 911 24 00 11',
    supportPhone: '+251 911 24 00 99',
    telegramChannel: 'https://t.me/a_z0blc',
    telegramSupport: 'https://t.me/a_z0blc',
    tiktokUrl: 'https://www.tiktok.com/@belika.women',
    mapsUrl: 'https://www.google.com/maps/search/?api=1&query=8.9974,38.7868',
    coords: { lat: 8.9974, lng: 38.7868 },
    hours: 'Mon–Sat 9:00 AM – 8:00 PM',
    hoursAm: 'ሰኞ–ቅዳሜ 3:00–2:00',
    telebirrAccount: '0911-240-011',
    cbeAccount: '1000-2400-11001',
  },
  Men: {
    department: 'Men',
    title: 'Belika Man Flagship',
    titleAm: 'ቤሊካ ወንዶች መደብር',
    address: 'Bole Olympia · Dembel City Center Wing, Ground Floor',
    addressAm: 'ቦሌ ኦሎምፒያ · ደምበል ሲቲ ሴንተር፣ ምድር ቤት',
    landmark: 'Opposite Olympia Traffic Light',
    landmarkAm: 'ኦሎምፒያ መብራት ፊት ለፊት',
    salesPhone: '+251 911 24 00 22',
    supportPhone: '+251 911 24 00 99',
    telegramChannel: 'https://t.me/Belika2016',
    telegramSupport: 'https://t.me/Belika2016',
    tiktokUrl: 'https://www.tiktok.com/@belika.man',
    mapsUrl: 'https://www.google.com/maps/search/?api=1&query=9.0054,38.7636',
    coords: { lat: 9.0054, lng: 38.7636 },
    hours: 'Mon–Sat 9:00 AM – 8:30 PM',
    hoursAm: 'ሰኞ–ቅዳሜ 3:00–2:30',
    telebirrAccount: '0911-240-022',
    cbeAccount: '1000-2400-22002',
  },
  Kids: {
    department: 'Kids',
    title: 'Belika Kids Corner',
    titleAm: 'ቤሊካ ልጆች ክፍል',
    address: 'Megenagna · Zefmesh Grand Mall, 3rd Floor',
    addressAm: 'መገናኛ · ዘፍመሽ ግራንድ ሞል፣ 3ኛ ፎቅ',
    landmark: 'Near Megenagna Square',
    landmarkAm: 'መገናኛ አደባባይ አጠገብ',
    salesPhone: '+251 911 24 00 33',
    supportPhone: '+251 911 24 00 99',
    telegramChannel: 'https://t.me/KB05q',
    telegramSupport: 'https://t.me/KB05q',
    tiktokUrl: 'https://www.tiktok.com/@belika.kids',
    mapsUrl: 'https://www.google.com/maps/search/?api=1&query=9.0205,38.8022',
    coords: { lat: 9.0205, lng: 38.8022 },
    hours: 'Mon–Sat 9:30 AM – 7:30 PM',
    hoursAm: 'ሰኞ–ቅዳሜ 3:30–1:30',
    telebirrAccount: '0911-240-033',
    cbeAccount: '1000-2400-33003',
  },
};

export type HeroPromoSlide = {
  id: string;
  department: Department;
  badge?: string;
  badgeEn: string;
  badgeAm: string;
  kicker?: string;
  kickerAm?: string;
  title?: string;
  titleEn: string;
  titleAm: string;
  subtitle?: string;
  subtitleEn: string;
  subtitleAm: string;
  ctaEn: string;
  ctaAm: string;
  image: string;
  accentHex: string;
  targetDepartment?: Department;
};

export const HERO_PROMO_SLIDES: HeroPromoSlide[] = [
  {
    id: 'promo-women-new',
    department: 'Women',
    badge: 'NEW ARRIVALS · BELIKA WOMEN',
    badgeEn: 'NEW ARRIVALS · BELIKA WOMEN',
    badgeAm: 'አዲስ የገቡ · ቤሊካ ሴቶች',
    kicker: 'Handwoven Kemis & Linen Edit',
    kickerAm: 'አዲስ የጥበብ ቀሚስ እና ሊነን ስብስብ',
    title: 'Handwoven Kemis & Linen Edit',
    titleEn: 'Handwoven Kemis & Linen Edit',
    titleAm: 'አዲስ የጥበብ ቀሚስ እና ሊነን ስብስብ',
    subtitle: 'Fresh Ethiopian studio silhouettes tailored for Addis evenings.',
    subtitleEn: 'Fresh Ethiopian studio silhouettes tailored for Addis evenings.',
    subtitleAm: 'ለአዲስ አበባ ፋሽን የተዘጋጁ ዘመናዊ የሴቶች አልባሳት።',
    ctaEn: 'Explore Collection',
    ctaAm: 'ስብስቡን ይመልከቱ',
    image: heroEditorialImg,
    accentHex: '#C06C3E',
    targetDepartment: 'Women',
  },
  {
    id: 'promo-men-trending',
    department: 'Men',
    badge: 'TRENDING NOW · BELIKA MAN',
    badgeEn: 'TRENDING NOW · BELIKA MAN',
    badgeAm: 'ተወዳጅ ምርቶች · ቤሊካ ወንዶች',
    kicker: 'Diplomat Tailoring & Smart Polos',
    kickerAm: 'ዘመናዊ ዲፕሎማት ጃኬት እና ፖሎ',
    title: 'Diplomat Tailoring & Smart Polos',
    titleEn: 'Diplomat Tailoring & Smart Polos',
    titleAm: 'ዘመናዊ ዲፕሎማት ጃኬት እና ፖሎ',
    subtitle: 'Sharp charcoal suits, breathable cotton knitwear & utility cargos.',
    subtitleEn: 'Sharp charcoal suits, breathable cotton knitwear & utility cargos.',
    subtitleAm: 'ለቢሮ እና ለእረፍት የሚሆኑ ጥራት ያላቸው የወንዶች ልብሶች።',
    ctaEn: 'Shop Belika Man',
    ctaAm: 'የወንዶች ክፍል ይዩ',
    image: mensSuitImg,
    accentHex: '#244035',
    targetDepartment: 'Men',
  },
  {
    id: 'promo-sale-all',
    department: 'All',
    badge: 'SEASONAL SALE · በቅናሽ',
    badgeEn: 'SEASONAL SALE · በቅናሽ',
    badgeAm: 'ልዩ የወቅቱ ቅናሽ · በቅናሽ',
    kicker: 'Boutique Picks Up to 25% Off',
    kickerAm: 'እስከ 25% ቅናሽ',
    title: 'Boutique Picks Up to 25% Off',
    titleEn: 'Boutique Picks Up to 25% Off',
    titleAm: 'እስከ 25% ቅናሽ + በBELIKA10 ተጨማሪ ቅናሽ',
    subtitle: 'Free Addis delivery on orders ETB 5,000+ via Mela Delivery.',
    subtitleEn: 'Free Addis delivery on orders ETB 5,000+ via Mela Delivery.',
    subtitleAm: 'ከ5,000 ብር በላይ ለሆነ ግዢ ነጻ የአዲስ አበባ ማድረስ።',
    ctaEn: 'Explore Deals',
    ctaAm: 'ቅናሾችን ይመልከቱ',
    image: poloTrioImg,
    accentHex: '#A6562D',
    targetDepartment: 'All',
  },
  {
    id: 'promo-kids-new',
    department: 'Kids',
    badge: 'NEW DROP · BELIKA KIDS',
    badgeEn: 'NEW DROP · BELIKA KIDS',
    badgeAm: 'አዲስ · ቤሊካ ልጆች',
    kicker: 'Comfort Court Sneakers & Sets',
    kickerAm: 'ለልጆች ምቹ ጫማዎች እና አልባሳት',
    title: 'Comfort Court Sneakers & Sets',
    titleEn: 'Comfort Court Sneakers & Sets',
    titleAm: 'ለልጆች ምቹ ጫማዎች እና አልባሳት',
    subtitle: 'Breathable school-to-weekend footwear in EU sizes 28–35.',
    subtitleEn: 'Breathable school-to-weekend footwear in EU sizes 28–35.',
    subtitleAm: 'ለትምህርት ቤት እና ለእረፍት ቀን የተመረጡ የልጆች ጫማዎች።',
    ctaEn: 'Shop Belika Kids',
    ctaAm: 'የልጆች ክፍል ይዩ',
    image: kidsSneakersImg,
    accentHex: '#275E52',
    targetDepartment: 'Kids',
  },
];

export const SIZE_PRESETS = {
  apparel: ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'],
  kidsApparel: ['2Y', '4Y', '6Y', '8Y', '10Y', '12Y'],
  shoes: ['28', '30', '32', '34', '35', '36', '37', '38', '39', '40', '41', '42', '43'],
  free: ['Free size'],
};

export function getContextualSizes(
  products: Product[],
  department: Department,
  selectedCategory: string,
  selectedSubcategory: string,
  query: string,
): string[] {
  const q = query.trim().toLowerCase();
  const shoeKeywords = ['shoe', 'shoes', 'sneaker', 'flat', 'heel', 'sandal', 'boot', 'ጫማ', 'ስኒከር'];
  const searchingShoes = shoeKeywords.some((kw) => q.includes(kw)) || selectedCategory.toLowerCase().includes('shoe');
  const searchingApparel = ['shirt', 'tee', 'polo', 'top', 'dress', 'kemis', 'suit', 'jacket', 'pant', 'cargo', 'trouser', 'skirt', 'jumpsuit', 'ቲሸርት', 'ቀሚስ', 'ሱሪ'].some((kw) => q.includes(kw));

  const contextMatches = products.filter((product) => {
    if (product.status === 'draft') return false;
    const inDept = department === 'All' || product.department === department;
    const inCat =
      selectedCategory === 'All' ||
      product.category.toLowerCase() === selectedCategory.toLowerCase();
    const inSub =
      selectedSubcategory === 'All' ||
      (product.subcategory ?? '').toLowerCase() === selectedSubcategory.toLowerCase();
    const matchesQ =
      !q ||
      product.name.toLowerCase().includes(q) ||
      product.nameAm.includes(query.trim()) ||
      (product.brand ?? '').toLowerCase().includes(q) ||
      product.category.toLowerCase().includes(q) ||
      (product.subcategory ?? '').toLowerCase().includes(q) ||
      (product.styleTags ?? []).some((tag) => tag.toLowerCase().includes(q));
    return inDept && inCat && inSub && matchesQ;
  });

  const sizes: string[] = [];
  for (const p of contextMatches) {
    const isShoeItem = p.category.toLowerCase().includes('shoe');
    if (searchingShoes && !isShoeItem) continue;
    if (searchingApparel && !searchingShoes && isShoeItem) continue;
    for (const v of p.variants ?? []) {
      if (v.size && v.size !== 'Unspecified' && !sizes.includes(v.size)) {
        sizes.push(v.size);
      }
    }
  }
  return sizes.slice(0, 14);
}

export function resolveImageIndexForColor(product: Product, colorName: string): number {
  const labels = product.imageLabels ?? [];
  if (!labels.length || !colorName) return 0;
  const target = colorName.trim().toLowerCase();
  const exactIdx = labels.findIndex((lbl) => lbl.trim().toLowerCase() === target);
  if (exactIdx >= 0 && exactIdx < (product.images?.length ?? 0)) return exactIdx;
  const partialIdx = labels.findIndex(
    (lbl) => lbl.toLowerCase().includes(target) || target.includes(lbl.toLowerCase()),
  );
  if (partialIdx >= 0 && partialIdx < (product.images?.length ?? 0)) return partialIdx;
  const swatchIdx = (product.colorSwatches ?? []).findIndex(
    (s) => s.name.toLowerCase() === target,
  );
  if (swatchIdx >= 0 && swatchIdx < (product.images?.length ?? 0)) return swatchIdx;
  return 0;
}

export const DEFAULT_PROMO_CODES: PromoCode[] = [
  {
    code: 'BELIKA10',
    type: 'percent',
    value: 10,
    minSubtotal: 1500,
    label: '10% off orders over ETB 1,500',
    labelAm: 'ከ1,500 ብር በላይ 10% ቅናሽ',
    active: true,
  },
  {
    code: 'ADDIS500',
    type: 'fixed',
    value: 500,
    minSubtotal: 4000,
    label: 'ETB 500 off orders over ETB 4,000',
    labelAm: 'ከ4,000 ብር በላይ 500 ብር ቅናሽ',
    active: true,
  },
  {
    code: 'KEMIS15',
    type: 'percent',
    value: 15,
    minSubtotal: 3000,
    label: '15% off Habesha & Boutique sets (ETB 3,000+)',
    labelAm: 'ከ3,000 ብር በላይ 15% ቅናሽ',
    active: true,
  },
];

export const SIZE_GUIDE_CHARTS = {
  apparel: [
    { size: 'S', chestCm: '90–95', waistCm: '74–79', lengthCm: '68' },
    { size: 'M', chestCm: '96–104', waistCm: '80–85', lengthCm: '71' },
    { size: 'L', chestCm: '105–111', waistCm: '86–92', lengthCm: '73' },
    { size: 'XL', chestCm: '112–118', waistCm: '93–99', lengthCm: '75' },
    { size: 'XXL', chestCm: '119–125', waistCm: '100–106', lengthCm: '77' },
    { size: '3XL', chestCm: '126–132', waistCm: '107–114', lengthCm: '79' },
  ],
  shoes: [
    { eu: '36', cm: '23.0', uk: '3.5', usW: '6' },
    { eu: '37', cm: '23.5', uk: '4', usW: '6.5' },
    { eu: '38', cm: '24.2', uk: '5', usW: '7.5' },
    { eu: '39', cm: '25.0', uk: '6', usW: '8.5' },
    { eu: '40', cm: '25.6', uk: '6.5', usW: '9' },
    { eu: '41', cm: '26.3', uk: '7.5', usW: '10' },
  ],
};

export const DEFAULT_CATEGORIES: StoreCategory[] = [
  // Belika Women Categories
  {
    id: 'cat-w-kemis',
    name: 'Dresses & Kemis',
    nameAm: 'ቀሚሶች እና ባህላዊ',
    department: 'Women',
    subcategories: ['Kemis Dress', 'Evening', 'Casual Dresses', 'Two-Piece Sets'],
    accentColor: '#C06C3E',
  },
  {
    id: 'cat-w-jumpsuits',
    name: 'Jumpsuits & Sets',
    nameAm: 'ጃምፕሱት እና ሰቶች',
    department: 'Women',
    subcategories: ['Jumpsuits', 'Rompers', 'Co-ord Sets'],
    accentColor: '#B55D38',
  },
  {
    id: 'cat-w-tops',
    name: 'Tops & Crops',
    nameAm: 'ቲሸርቶች እና ክሮፕ',
    department: 'Women',
    subcategories: ['Crop Tops', 'Blouses', 'Tees', 'Tank Tops'],
    accentColor: '#D8705C',
  },
  {
    id: 'cat-w-bottoms',
    name: 'Skirts & Tights',
    nameAm: 'ቀሚሶች እና ታይት',
    department: 'Women',
    subcategories: ['Skirts', 'Tights & Leggings', 'Jeans', 'Trousers'],
    accentColor: '#9E5434',
  },
  {
    id: 'cat-w-shoes',
    name: 'Women Shoes',
    nameAm: 'የሴቶች ጫማዎች',
    department: 'Women',
    subcategories: ['Flats', 'Heels', 'Sneakers', 'Sandals'],
    accentColor: '#8B5E3C',
  },
  {
    id: 'cat-w-outerwear',
    name: 'Outerwear & Jackets',
    nameAm: 'ጃኬቶች እና ኮቶች',
    department: 'Women',
    subcategories: ['Leather Jackets', 'Cardigans', 'Blazers', 'Overshirts'],
    accentColor: '#5B4636',
  },

  // Belika Man Categories
  {
    id: 'cat-m-polos',
    name: 'Tops & Polos',
    nameAm: 'ፖሎ እና ቲሸርት',
    department: 'Men',
    subcategories: ['Pique Polo', 'Cotton Tees', 'Shemiz Shirts', 'Tank Tops'],
    accentColor: '#1A332A',
  },
  {
    id: 'cat-m-suits',
    name: 'Suits & Sets',
    nameAm: 'ሱት እና ሰቶች',
    department: 'Men',
    subcategories: ['Complete Suits', 'Two-Piece Sets', 'Traditional Sets'],
    accentColor: '#244035',
  },
  {
    id: 'cat-m-trousers',
    name: 'Trousers & Denim',
    nameAm: 'ሱሪዎች እና ጂንስ',
    department: 'Men',
    subcategories: ['Cargo Pants', 'Jeans', 'Chinos', 'Cherki Suri'],
    accentColor: '#2D4A3E',
  },
  {
    id: 'cat-m-shoes',
    name: 'Men Shoes',
    nameAm: 'የወንዶች ጫማዎች',
    department: 'Men',
    subcategories: ['Sneakers', 'Flats & Loafers', 'Dress Shoes', 'Boots'],
    accentColor: '#3A5248',
  },
  {
    id: 'cat-m-outerwear',
    name: 'Jackets & Outerwear',
    nameAm: 'ጃኬቶች እና ኮቶች',
    department: 'Men',
    subcategories: ['Diplomat Jacket', 'Denim Overshirt', 'Leather Jackets', 'Hoodies'],
    accentColor: '#435B50',
  },

  // Belika Kids Categories
  {
    id: 'cat-k-dresses',
    name: 'Kids Dresses & Sets',
    nameAm: 'የልጆች ቀሚስ እና ሰቶች',
    department: 'Kids',
    subcategories: ['Dresses', 'Jumpsuits & Rompers', 'Two-Piece Sets'],
    accentColor: '#275E52',
  },
  {
    id: 'cat-k-playwear',
    name: 'Kids Tops & Bottoms',
    nameAm: 'የልጆች ቲሸርት እና ሱሪ',
    department: 'Kids',
    subcategories: ['Tees & Tops', 'Skirts & Tights', 'Trousers & Shorts'],
    accentColor: '#2E6B5E',
  },
  {
    id: 'cat-k-shoes',
    name: 'Kids Shoes',
    nameAm: 'የልጆች ጫማዎች',
    department: 'Kids',
    subcategories: ['Sneakers', 'Flats', 'Heels & Party', 'Sandals'],
    accentColor: '#3C8274',
  },
  {
    id: 'cat-k-outerwear',
    name: 'Kids Outerwear',
    nameAm: 'የልጆች ጃኬቶች',
    department: 'Kids',
    subcategories: ['Hoodies', 'Light Jackets', 'Sweaters'],
    accentColor: '#499889',
  },
];

export function colorSwatchHex(color: string): string {
  const key = color.trim().toLowerCase();
  if (key.includes('tan') || key.includes('sand') || key.includes('camel') || key.includes('beige')) return '#C8A57B';
  if (key.includes('white') || key.includes('ivory') || key.includes('cream')) return '#F5F2EB';
  if (key.includes('grey') || key.includes('gray') || key.includes('silver')) return '#B8BDC0';
  if (key.includes('forest') || key.includes('olive') || key.includes('green') || key.includes('sage')) return '#284B3C';
  if (key.includes('navy') || key.includes('blue') || key.includes('denim')) return '#2B425B';
  if (key.includes('black') || key.includes('charcoal') || key.includes('onyx')) return '#232625';
  if (key.includes('brown') || key.includes('terracotta') || key.includes('rust')) return '#9E5434';
  if (key.includes('gold') || key.includes('mustard') || key.includes('yellow')) return '#D6A954';
  if (key.includes('red') || key.includes('burgundy') || key.includes('wine')) return '#8F2D2D';
  if (key.includes('pink') || key.includes('blush') || key.includes('rose')) return '#D48A92';
  return '#B8AEA0';
}

const RAW_PRODUCTS: Omit<Product, 'variants' | 'status'>[] = [
  {
    id: 'kemis',
    department: 'Women',
    category: 'Dresses & Kemis',
    subcategory: 'Kemis Dress',
    name: 'Handwoven Tibeb Kemis Dress',
    nameAm: 'ዘመናዊ ጥበብ ቀሚስ',
    brand: 'Belika Atelier',
    price: 1800,
    compareAtPrice: 2400,
    badge: 'Flash Drop',
    sizes: 'Free size',
    sizeGuidance: 'Flowing free-size silhouette with woven border detailing. Custom hem length on request.',
    sizeGuidanceAm: 'ለሁሉም የሚሆን ምቹ እና ነፃ መጠን ያለው ዘመናዊ ቀሚስ።',
    fabric: 'Breathable Cotton Blend with Tibeb Trim',
    pattern: 'Woven Border',
    careInstructions: 'Cold gentle hand wash · Line dry in shade',
    soldCount: 142,
    styleTags: ['traditional', 'kemis', 'habesha', 'dress', 'woven'],
    colorSwatches: [
      { name: 'Ivory Cream', nameAm: 'ነጭ ክሬም', hex: '#F4EFE4' },
      { name: 'Terracotta', nameAm: 'ሸክላ ቀይ', hex: '#C06C3E' },
    ],
    customizable: true,
    measurements: 'Free size · Waist tie adjustable · Length 138cm (custom hem available)',
    rating: 4.9,
    reviewCount: 38,
    reviews: [
      {
        id: 'rev-kemis-1',
        author: 'Selamawit T.',
        rating: 5,
        fit: 'true-to-size',
        comment: 'Lightweight for Addis afternoons and the woven border looks clean.',
        createdAt: '2026-11-18',
      },
      {
        id: 'rev-kemis-2',
        author: 'Hanna G.',
        rating: 5,
        fit: 'true-to-size',
        comment: 'Requested a 132cm hem in checkout and Belika tailored it cleanly.',
        createdAt: '2026-11-21',
      },
    ],
    tint: '#F2EBE5',
    images: [womensKemisImg, womensJumpsuitImg],
    imageLabels: ['Ivory Cream', 'Terracotta'],
    imageLabelsAm: ['ነጭ ክሬም', 'ሸክላ ቀይ'],
    isSample: true,
    createdAt: '2026-11-24T08:00:00Z',
  },
  {
    id: 'womens-linen-jumpsuit',
    department: 'Women',
    category: 'Jumpsuits & Sets',
    subcategory: 'Jumpsuits',
    name: 'Belted Terracotta Linen Jumpsuit',
    nameAm: 'የተጠቀለለ ሊነን ጃምፕሱት',
    brand: 'Belika Studio',
    price: 4200,
    compareAtPrice: 4950,
    badge: 'New',
    sizes: 'M–XXL',
    sizeGuidance: 'Tailored waist with wide-leg drape. True to size with adjustable fabric belt.',
    sizeGuidanceAm: 'የተስተካከለ ወገብ እና ሰፊ እግር ያለው ዘመናዊ ጃምፕሱት።',
    fabric: '70% Linen · 30% Combed Cotton',
    pattern: 'Solid Terracotta Matte',
    careInstructions: 'Gentle wash 30°C · Steam press',
    soldCount: 64,
    styleTags: ['jumpsuit', 'linen', 'office', 'dinner', 'co-ord'],
    colorSwatches: [
      { name: 'Terracotta', nameAm: 'ሸክላ ቀይ', hex: '#C06C3E' },
      { name: 'Ivory Cream', nameAm: 'ነጭ ክሬም', hex: '#F4EFE4' },
    ],
    customizable: true,
    measurements: 'M: Bust 92cm, Waist 76cm · L: Bust 98cm, Waist 82cm · XL: Bust 104cm',
    rating: 4.9,
    reviewCount: 21,
    reviews: [
      {
        id: 'rev-jump-1',
        author: 'Bethelhem K.',
        rating: 5,
        fit: 'true-to-size',
        comment: 'Breathable linen weight and great structure for work or dinner.',
        createdAt: '2026-11-22',
      },
    ],
    tint: '#EFE3D8',
    images: [womensJumpsuitImg, womensKemisImg],
    imageLabels: ['Terracotta', 'Ivory Cream'],
    imageLabelsAm: ['ሸክላ ቀይ', 'ነጭ ክሬም'],
    isSample: true,
    createdAt: '2026-11-25T10:00:00Z',
  },
  {
    id: 'comfort-flats',
    department: 'Women',
    category: 'Women Shoes',
    subcategory: 'Flats',
    name: 'Buckle Leather Comfort Flats',
    nameAm: 'ምቹ የቆዳ ጫማ',
    brand: 'Belika Footwear',
    price: 3200,
    compareAtPrice: 3750,
    badge: 'Staple',
    sizes: 'EU 36–41',
    sizeGuidance: 'Cushioned memory-foam insole for all-day walking. Runs true to EU size.',
    sizeGuidanceAm: 'ለረጅም ጉዞ ምቹ የሆነ ለስላሳ ጫማ። ትክክለኛውን የEU ቁጥር ይምረጡ።',
    fabric: 'Soft Leather Upper & Cushioned Sole',
    pattern: 'Minimal Buckle',
    careInstructions: 'Wipe with soft dry cloth · Condition leather monthly',
    soldCount: 118,
    styleTags: ['footwear', 'flats', 'comfort', 'workwear', 'shoes'],
    colorSwatches: [
      { name: 'Tan', nameAm: 'ቡናማ', hex: '#C8A57B' },
      { name: 'Black', nameAm: 'ጥቁር', hex: '#232625' },
    ],
    customizable: false,
    measurements: 'EU 36 (23cm) to EU 41 (26.3cm) · Heel height 1.8cm',
    rating: 4.8,
    reviewCount: 31,
    reviews: [
      {
        id: 'rev-flats-1',
        author: 'Rahel A.',
        rating: 5,
        fit: 'true-to-size',
        comment: 'Zero break-in needed. Wore the Tan pair all day around Bole.',
        createdAt: '2026-11-19',
      },
    ],
    tint: '#EFE6DE',
    images: [womensFlatsImg],
    imageLabels: ['Tan', 'Black'],
    imageLabelsAm: ['ቡናማ', 'ጥቁር'],
    isSample: true,
    createdAt: '2026-11-22T12:00:00Z',
  },
  {
    id: 'polo',
    department: 'Men',
    category: 'Tops & Polos',
    subcategory: 'Pique Polo',
    name: 'Boutique Knit Polo T-shirt',
    nameAm: 'ፖሎ ቲሸርት',
    brand: 'Belika Man',
    price: 3200,
    compareAtPrice: 3800,
    badge: 'Trending',
    sizes: 'M–XXL',
    sizeGuidance: 'Regular boutique fit in breathable pique cotton. Choose your usual size.',
    sizeGuidanceAm: 'መደበኛ የጥጥ ፖሎ ልክ። የሚለብሱትን መደበኛ መጠን ይምረጡ።',
    fabric: '100% Pique Cotton Knit',
    pattern: 'Solid Knit Collar',
    careInstructions: 'Machine wash cold 30°C · Do not tumble dry',
    soldCount: 185,
    styleTags: ['smart-casual', 'breathable', 'office', 'cotton', 'polo'],
    colorSwatches: [
      { name: 'Tan', nameAm: 'ቡናማ', hex: '#C8A57B' },
      { name: 'White', nameAm: 'ነጭ', hex: '#F5F2EB' },
      { name: 'Pale grey', nameAm: 'ፈዛዛ ግራጫ', hex: '#C4C7C8' },
    ],
    customizable: false,
    measurements: 'M: Chest 104cm · L: 110cm · XL: 116cm · XXL: 122cm',
    rating: 4.8,
    reviewCount: 24,
    reviews: [
      {
        id: 'rev-polo-1',
        author: 'Dawit M.',
        rating: 5,
        fit: 'true-to-size',
        comment: 'Soft cotton collar holds shape well after washing.',
        createdAt: '2026-11-12',
      },
    ],
    tint: '#EFEAE1',
    images: [poloTrioImg, cottonTeeImg],
    imageLabels: ['Tan', 'White', 'Pale grey'],
    imageLabelsAm: ['ቡናማ', 'ነጭ', 'ፈዛዛ ግራጫ'],
    isSample: true,
    createdAt: '2026-11-23T10:00:00Z',
  },
  {
    id: 'mens-tailored-suit',
    department: 'Men',
    category: 'Suits & Sets',
    subcategory: 'Complete Suits',
    name: 'Modern Charcoal Two-Piece Suit',
    nameAm: 'ዘመናዊ ባለ ሁለት ክፍል ሱት',
    brand: 'Belika Tailored',
    price: 11500,
    compareAtPrice: 13200,
    badge: 'Staple',
    sizes: 'L–XXL',
    sizeGuidance: 'Slim-tailored Ethiopian evening cut. Includes jacket + matching trousers.',
    sizeGuidanceAm: 'ዘመናዊ ባለ ሁለት ክፍል ሙሉ ሱት (ጃኬት እና ሱሪ)።',
    fabric: 'Fine Wool-Linen Suiting Blend',
    pattern: 'Matte Charcoal',
    careInstructions: 'Dry clean only · Steam to refresh',
    soldCount: 41,
    styleTags: ['suit', 'formal', 'wedding', 'business', 'tailored'],
    colorSwatches: [
      { name: 'Charcoal', nameAm: 'ከሰል ግራጫ', hex: '#2B2E2D' },
      { name: 'Navy', nameAm: 'ጥቁር ሰማያዊ', hex: '#24364D' },
    ],
    customizable: true,
    measurements: 'L (EU 50) · XL (EU 52) · XXL (EU 54) · Custom trouser hem included',
    rating: 4.9,
    reviewCount: 18,
    reviews: [
      {
        id: 'rev-suit-1',
        author: 'Yohannes B.',
        rating: 5,
        fit: 'true-to-size',
        comment: 'Sharp lapel and lightweight lining that breathes nicely.',
        createdAt: '2026-11-20',
      },
    ],
    tint: '#E5E7E6',
    images: [mensSuitImg, mensJacketImg],
    imageLabels: ['Charcoal', 'Navy'],
    imageLabelsAm: ['ከሰል ግራጫ', 'ጥቁር ሰማያዊ'],
    isSample: true,
    createdAt: '2026-11-24T15:00:00Z',
  },
  {
    id: 'diplomat-jacket',
    department: 'Men',
    category: 'Jackets & Outerwear',
    subcategory: 'Diplomat Jacket',
    name: 'Structured Diplomat Jacket',
    nameAm: 'ዲፕሎማት ጃኬት',
    brand: 'Belika Tailored',
    price: 7500,
    compareAtPrice: 8600,
    badge: 'Staple',
    sizes: 'L–XXL',
    sizeGuidance: 'Structured shoulder tailoring. Size up if layering over thick knitwear.',
    sizeGuidanceAm: 'የተስተካከለ ትከሻ ያለው ጃኬት። ከወፍራም ሹራብ በላይ ከለበሱ አንድ መጠን ይጨምሩ።',
    fabric: 'Structured Wool-Blend Twill',
    pattern: 'Minimal Tailored Solid',
    careInstructions: 'Dry clean recommended',
    soldCount: 73,
    styleTags: ['formal', 'tailored', 'evening', 'outerwear', 'jacket'],
    colorSwatches: [
      { name: 'Charcoal', nameAm: 'ከሰል ግራጫ', hex: '#2B2E2D' },
      { name: 'Navy', nameAm: 'ጥቁር ሰማያዊ', hex: '#24364D' },
    ],
    customizable: true,
    measurements: 'L: Shoulder 47cm · XL: 49cm · XXL: 52cm (Sleeve tailoring available)',
    rating: 4.9,
    reviewCount: 16,
    tint: '#E7E4DD',
    images: [mensJacketImg, mensSuitImg],
    imageLabels: ['Charcoal', 'Navy'],
    imageLabelsAm: ['ከሰል ግራጫ', 'ጥቁር ሰማያዊ'],
    isSample: true,
    createdAt: '2026-11-20T09:00:00Z',
  },
  {
    id: 'cotton-tee',
    department: 'Men',
    category: 'Tops & Polos',
    subcategory: 'Cotton Tees',
    name: 'Heavyweight Combed Cotton Tee',
    nameAm: 'ወፍራም የጥጥ ቲሸርት',
    brand: 'Belika Basics',
    price: 2200,
    compareAtPrice: 2800,
    badge: 'Flash Drop',
    sizes: 'M–XXL',
    sizeGuidance: 'Relaxed everyday 240gsm cotton jersey. True to size.',
    sizeGuidanceAm: 'የዕለት ተዕለት ወፍራም የጥጥ ቲሸርት።',
    fabric: '100% Combed 240gsm Cotton Jersey',
    pattern: 'Solid Matte',
    careInstructions: 'Machine wash cold · Wash inside out',
    soldCount: 210,
    styleTags: ['casual', 'minimal', 'basic', 't-shirt', 'cotton'],
    colorSwatches: [
      { name: 'Ivory', nameAm: 'ነጭ', hex: '#F5F2EB' },
      { name: 'Black', nameAm: 'ጥቁር', hex: '#232625' },
      { name: 'Forest Green', nameAm: 'አረንጓዴ', hex: '#284B3C' },
    ],
    customizable: false,
    measurements: 'M: Chest 106cm · L: 112cm · XL: 118cm · XXL: 124cm',
    rating: 4.7,
    reviewCount: 27,
    tint: '#ECE7DF',
    images: [cottonTeeImg, poloTrioImg],
    imageLabels: ['Ivory', 'Black', 'Forest Green'],
    imageLabelsAm: ['ነጭ', 'ጥቁር', 'አረንጓዴ'],
    isSample: true,
    createdAt: '2026-11-15T10:00:00Z',
  },
  {
    id: 'cargo',
    department: 'Men',
    category: 'Trousers & Denim',
    subcategory: 'Cargo Pants',
    name: 'Utility Ripstop Cargo Trousers',
    nameAm: 'ካርጎ ሱሪ',
    brand: 'Belika Street',
    price: 4500,
    compareAtPrice: 5100,
    badge: 'Trending',
    sizes: 'M–3XL',
    sizeGuidance: 'Relaxed utility pockets with clean tapered cuff. Runs true to waist.',
    sizeGuidanceAm: 'ሰፊ ኪሶች ያሉት ካርጎ ሱሪ። የወገብ ልክን ከሱቁ ጋር ያረጋግጡ።',
    fabric: 'Heavy Cotton Ripstop Twill',
    pattern: 'Solid Utility',
    careInstructions: 'Machine wash 30°C · Warm iron',
    soldCount: 96,
    styleTags: ['streetwear', 'cargo', 'trousers', 'pockets'],
    colorSwatches: [
      { name: 'Olive Green', nameAm: 'ወይራ አረንጓዴ', hex: '#4B5943' },
      { name: 'Sand Khaki', nameAm: 'ካኪ', hex: '#C2AA84' },
      { name: 'Black', nameAm: 'ጥቁር', hex: '#232625' },
    ],
    customizable: true,
    measurements: 'M (30-31") · L (32-33") · XL (34-35") · XXL (36") · 3XL (38")',
    rating: 4.8,
    reviewCount: 29,
    reviews: [
      {
        id: 'rev-cargo-1',
        author: 'Natnael S.',
        rating: 5,
        fit: 'true-to-size',
        comment: 'Thick ripstop fabric and clean stitching on all pocket flaps.',
        createdAt: '2026-11-17',
      },
    ],
    tint: '#E5E7DF',
    images: [cargoTrousersImg],
    imageLabels: ['Olive Green', 'Sand Khaki', 'Black'],
    imageLabelsAm: ['ወይራ አረንጓዴ', 'ካኪ', 'ጥቁር'],
    isSample: true,
    createdAt: '2026-11-19T14:00:00Z',
  },
  {
    id: 'jeans-shirt',
    department: 'Men',
    category: 'Jackets & Outerwear',
    subcategory: 'Denim Overshirt',
    name: 'Washed Denim Shirt Jacket',
    nameAm: 'የጂንስ ሸሚዝ ጃኬት',
    brand: 'Belika Street',
    price: 4800,
    badge: 'New',
    sizes: 'M–XXL',
    sizeGuidance: 'Relaxed overshirt cut designed for layering over tees.',
    sizeGuidanceAm: 'ከቲሸርት በላይ ለመልበስ የተዘጋጀ ምቹ የጂንስ ሸሚዝ ጃኬት።',
    fabric: 'Washed Midweight Denim',
    pattern: 'Indigo Wash',
    careInstructions: 'Wash separately cold · Hang dry',
    soldCount: 52,
    styleTags: ['denim', 'streetwear', 'layering', 'casual'],
    colorSwatches: [
      { name: 'Indigo Denim', nameAm: 'ሰማያዊ ጂንስ', hex: '#2E4A6B' },
      { name: 'Slate Grey', nameAm: 'ግራጫ', hex: '#636A70' },
    ],
    customizable: false,
    measurements: 'Relaxed shoulder · Length 73–78cm',
    rating: 4.7,
    reviewCount: 11,
    tint: '#E6E9EB',
    images: [mensJacketImg],
    imageLabels: ['Indigo Denim', 'Slate Grey'],
    imageLabelsAm: ['ሰማያዊ ጂንስ', 'ግራጫ'],
    isSample: true,
    createdAt: '2026-11-21T11:00:00Z',
  },
  {
    id: 'kids-sneakers-sample',
    department: 'Kids',
    category: 'Kids Shoes',
    subcategory: 'Sneakers',
    name: 'Kids Everyday Court Sneakers',
    nameAm: 'የልጆች ስኒከር ጫማ',
    brand: 'Belika Kids',
    price: 2800,
    compareAtPrice: 3200,
    badge: 'Flash Drop',
    sizes: 'EU 28–35',
    sizeGuidance: 'Lightweight cushioned sole for school and weekend wear. True to EU size.',
    sizeGuidanceAm: 'ለትምህርት ቤት እና ለእረፍት ቀን ምቹ የልጆች ጫማ። ቁጥሩን ከሱቁ ጋር ያረጋግጡ።',
    fabric: 'Breathable Mesh & Non-Slip Rubber Sole',
    pattern: 'Sport Trim',
    careInstructions: 'Wipe with damp sponge · Air dry',
    soldCount: 87,
    styleTags: ['kids', 'sneakers', 'shoes', 'school'],
    colorSwatches: [
      { name: 'White', nameAm: 'ነጭ', hex: '#F5F2EB' },
      { name: 'Navy', nameAm: 'ሰማያዊ', hex: '#24364D' },
    ],
    customizable: false,
    measurements: 'EU 28 (17.5cm) to EU 35 (22.2cm)',
    rating: 4.9,
    reviewCount: 15,
    reviews: [
      {
        id: 'rev-kids-1',
        author: 'Mekdes F.',
        rating: 5,
        fit: 'true-to-size',
        comment: 'Easy for kids to put on and very light sole.',
        createdAt: '2026-11-23',
      },
    ],
    tint: '#E6EEEA',
    images: [kidsSneakersImg],
    imageLabels: ['White', 'Navy'],
    imageLabelsAm: ['ነጭ', 'ሰማያዊ'],
    isSample: true,
    createdAt: '2026-11-24T09:00:00Z',
  },
];

const getInitialSizes = (sizes: string) => {
  if (sizes === 'M–XXL') return ['M', 'L', 'XL', 'XXL'];
  if (sizes === 'M–3XL') return ['M', 'L', 'XL', 'XXL', '3XL'];
  if (sizes === 'L–XXL') return ['L', 'XL', 'XXL'];
  if (sizes === 'EU 36–41') return ['36', '37', '38', '39', '40', '41'];
  if (sizes === 'EU 28–35') return ['28', '30', '32', '34', '35'];
  if (sizes === 'Free size') return ['Free size'];
  return ['Unspecified'];
};

export const DEFAULT_PRODUCTS: Product[] = RAW_PRODUCTS.map((product) => {
  const colors = product.imageLabels?.length ? product.imageLabels : ['Unspecified'];
  const variants = getInitialSizes(product.sizes).flatMap((size, sizeIndex) =>
    colors.map((color, colorIndex) => ({
      id: `${product.id}-v${sizeIndex}-${colorIndex}`,
      size,
      color,
      stock: 4,
    })),
  );
  return { ...product, variants, status: 'published' };
});

export const TELEGRAM_PREVIEW_CANDIDATES: TelegramCandidate[] = [
  { id: 'm-1067', department: 'Men', name: 'Cargo pant', price: 4000, sizeSpec: 'M-XXXL', postedAt: '2026-10-03', channel: 'Belika Man', postUrl: 'https://t.me/Belika2016/1067', kind: 'possible-duplicate', groupId: 'men-cargo' },
  { id: 'm-1071', department: 'Men', name: 'Old money', price: 4500, sizeSpec: 'M-XXL', postedAt: '2026-10-03', channel: 'Belika Man', postUrl: 'https://t.me/Belika2016/1071', kind: 'product' },
  { id: 'w-1660', department: 'Women', name: 'New Balance 530', price: 5500, sizeSpec: 'Sizes available', postedAt: '2026-10-15', channel: 'Belika woman', postUrl: 'https://t.me/a_z0blc/1660', kind: 'product' },
  { id: 'k-637', department: 'Kids', name: 'Master Quality shoes', price: 3200, sizeSpec: '32-37', postedAt: '2026-09-30', channel: 'Belika kids', postUrl: 'https://t.me/KB05q/637', kind: 'product' },
];

export const STORAGE_KEYS = {
  products: 'belika:v3:products',
  categories: 'belika:v3:categories',
  telegramCandidates: 'belika:v1:telegramCandidates',
  cart: 'belika:v2:cart',
  favorites: 'belika:v1:favorites',
  recentlyViewed: 'belika:v2:recentlyViewed',
  orders: 'belika:v3:orders',
  movements: 'belika:v1:movements',
  promos: 'belika:v1:promos',
  profile: 'belika:v1:profile',
  branches: 'belika:v1:branches',
  supportMessages: 'belika:v1:supportMessages',
};

export const COPY = {
  en: {
    shop: 'Shop',
    wishlist: 'Wishlist',
    bag: 'Bag',
    staff: 'Staff Studio',
    search: 'Search outfits, Kemis, colors, brands, or Amharic…',
    cameraSearch: 'Camera Search',
    departments: 'Our Shops',
    categories: 'Categories',
    allCategories: 'All Categories',
    featured: 'Curated Boutique Feed',
    flashDrops: 'Flash Drops & Deals',
    recentlyViewed: 'Recently Viewed',
    newArrivals: 'New arrivals & staples',
    all: 'All Shops',
    men: 'Belika Man',
    women: 'Belika Women',
    kids: 'Belika Kids',
    bannerKicker: 'Addis Ababa, Ethiopia · Belika Online Store',
    bannerTitle: 'Modern Ethiopian fashion, smartly curated.',
    bannerText:
      'Snap any outfit to find matching colors & styles, check exact garment sizing, or pin your Addis Ababa delivery spot on Google Maps.',
    bannerButton: 'Explore collection',
    sizes: 'Sizes',
    demoNotice: 'Sample catalog · confirm final price, size, and stock directly with Belika.',
    samplePhoto: 'Studio preview',
    empty: 'No matching pieces found with current filters.',
    kidsSoon: 'Kids catalog items will appear here once verified Belika kids stock is added.',
    wishlistEmpty: 'Your wishlist is empty. Tap the heart on any item to save it here.',
    viewDetails: 'View',
    details: 'Item Details',
    chooseSize: 'Select size',
    sizeGuidanceTitle: 'Fit, Fabric & Measurements',
    sizeHelp: 'Listed sizes follow the boutique post. Confirm exact fit availability with Belika staff.',
    photoHelp: 'Colors are extracted from studio photos; confirm exact shade with the shop.',
    customFitLabel: 'Custom Fit / Tailoring Note (optional)',
    customFitPlaceholder: 'e.g., Hem 132cm, slim waist, or gift wrap note…',
    addToCart: 'Add to bag',
    buyNow: 'Buy now',
    quickAdd: 'Quick Add',
    cartTitle: 'Shopping Bag & Delivery',
    emptyCart: 'Your bag is empty.',
    subtotal: 'Items Subtotal',
    checkoutNote: 'Orders save on this device with your payment method, promo savings, and pinned Addis delivery address.',
    remove: 'Remove',
    staffTitle: 'Belika Merchant Studio',
    staffNotice: 'Local store database · AI photo analysis runs securely via server Gemini API.',
    productName: 'Product name (English)',
    productNameAm: 'Amharic name (አማርኛ)',
    priceETB: 'Price (ETB)',
    department: 'Department',
    categoryLabel: 'Category',
    subcategoryLabel: 'Subcategory (optional)',
    colors: 'Colors',
    sizesInput: 'Sizes (comma separated)',
    colorsInput: 'Colors (comma separated)',
    addDraft: 'Save as draft',
    publishNow: 'Publish immediately',
    draft: 'Draft',
    published: 'Published',
    verifyPublish: 'Verify & publish',
    stock: 'Stock',
    orders: 'Orders & Dispatch',
    noOrders: 'No order requests recorded on this device yet.',
    orderRequest: 'Checkout, Payment & Delivery',
    customerName: 'Full name',
    customerPhone: 'Phone number',
    fulfillment: 'Receiving method',
    pickup: 'Shop pickup (Bole)',
    delivery: 'Addis delivery',
    deliveryAddress: 'Delivery address / Sub-city & street',
    deliveryLandmark: 'Nearby landmark / floor / gate code',
    deliveryFeeNote: 'Free Addis delivery on orders ETB 5,000+. Otherwise fee estimates by distance from Belika Bole.',
    deliveryAddressRequired: 'Please select or enter a delivery address.',
    orderSummary: 'Order summary',
    submitRequest: 'Place Order',
    requested: 'Requested',
    confirmed: 'Confirmed',
    outForDelivery: 'Out for Delivery',
    completed: 'Completed',
    cancelled: 'Cancelled',
    confirmOrder: 'Confirm & reserve stock',
    dispatchOrder: 'Mark out for delivery',
    completeOrder: 'Mark completed',
    cancelOrder: 'Cancel',
    stockError: 'Not enough stock remaining for this variant.',
    chooseVariant: 'Select a size and color to continue.',
    remaining: 'in stock',
    outOfStock: 'Out of stock',
    orderSaved: 'Order saved! Track status below.',
    contactRequired: 'Enter your name and phone number.',
    sampleWarning: 'Sample inventory counts (4 per variant) can be edited or restocked below.',
    total: 'Total',
    inventoryHistory: 'Stock movement log',
    noMovements: 'No stock movements logged yet.',
    addProductHelp: 'Upload garment photos and tap "AI Recognize & Detect Colors" to auto-fill details.',
    productFieldsRequired: 'Enter product name, a valid ETB price, and at least one size and color.',
    zoomHint: 'Use zoom controls or pinch on mobile to inspect fabric texture.',
    backToShop: 'Back to shop',
    filters: 'Filters',
    clearFilters: 'Reset filters',
    colorFilter: 'Color',
    sizeFilter: 'Size',
    priceFilter: 'Price',
    sortBy: 'Sort',
    myOrders: 'Track My Orders',
    uploadPhotos: 'Upload Item Photos',
    analyzeWithAi: 'AI Recognize & Detect Colors',
    categoryManager: 'Categories & Promos',
    compare: 'Compare',
    compareTitle: 'Side-by-Side Product Comparison',
    compareMax: 'Select up to 2 products to compare specs, fabric & value',
    compareEmpty: 'No products selected for comparison. Click "Compare" on any two product cards.',
    compareNow: 'Compare Now',
    promoPlaceholder: 'Promo code (e.g. BELIKA10)',
    applyPromo: 'Apply',
    paymentMethodLabel: 'Payment Method',
    payCod: 'Cash on Delivery / Pickup',
    payTelebirr: 'Telebirr Mobile Money',
    payCbe: 'CBE Birr / Bank Transfer',
    announcementText: 'Free Addis Ababa delivery on orders ETB 5,000+ · Use code BELIKA10 for 10% off',
  },
  am: {
    shop: 'መደብር',
    wishlist: 'የምወዳቸው',
    bag: 'ጋሪ',
    staff: 'የነጋዴ ክፍል',
    search: 'ልብሶችን፣ ቀሚስን፣ ቀለምን ይፈልጉ…',
    cameraSearch: 'በካሜራ ፈልግ',
    departments: 'ክፍሎቻችን',
    categories: 'ምድቦች',
    allCategories: 'ሁሉም ምድቦች',
    featured: 'የተመረጡ ምርቶች',
    flashDrops: 'ፈጣን ቅናሾች',
    recentlyViewed: 'በቅርብ የታዩ',
    newArrivals: 'አዲስ እና ተወዳጅ',
    all: 'ሁሉም ሱቆች',
    men: 'ቤሊካ ወንዶች',
    women: 'ቤሊካ ሴቶች',
    kids: 'ቤሊካ ልጆች',
    bannerKicker: 'አዲስ አበባ፣ ኢትዮጵያ · ቤሊካ ኦንላይን ስቶር',
    bannerTitle: 'ዘመናዊ የኢትዮጵያ ፋሽን እና ብልህ ግዢ።',
    bannerText: 'በካሜራ ፎቶ አንስተው ተመሳሳይ ልብሶችንና ቀለሞችን ይፈልጉ፣ ልክዎን ያስተካክሉ፣ እና በGoogle Maps አድራሻ ይምረጡ።',
    bannerButton: 'ስብስቡን ይመልከቱ',
    sizes: 'መጠን',
    demoNotice: 'የሙከራ ካታሎግ · ትክክለኛውን ዋጋ፣ መጠንና ክምችት ከሱቁ ጋር ያረጋግጡ።',
    samplePhoto: 'የናሙና ምስል',
    empty: 'በተመረጡት ማጣሪያዎች የሚዛመድ ምርት አልተገኘም።',
    kidsSoon: 'የተረጋገጡ የልጆች ምርቶች ሲጨመሩ እዚህ ይታያሉ።',
    wishlistEmpty: 'የምወዳቸው ዝርዝር ባዶ ነው። ለማስቀመጥ የልብ ምልክቱን ይንኩ።',
    viewDetails: 'ዝርዝር',
    details: 'የምርት ዝርዝር',
    chooseSize: 'መጠን ይምረጡ',
    sizeGuidanceTitle: 'የመጠን እና የጨርቅ መረጃ',
    sizeHelp: 'መጠኖቹ ከፖስቱ የተወሰዱ ናቸው፤ ትክክለኛውን ልክ ከቤሊካ ሰራተኞች ጋር ያረጋግጡ።',
    photoHelp: 'ቀለሞቹ ከፎቶዎቹ የተለዩ ናቸው፤ ትክክለኛውን ቀለም ከሱቁ ጋር ያረጋግጡ።',
    customFitLabel: 'የልክ ማስተካከያ / ልዩ ማስታወሻ (አማራጭ)',
    customFitPlaceholder: 'ለምሳሌ፦ ርዝመት 132 ሴ.ሜ ወይም የስጦታ ማሸጊያ…',
    addToCart: 'ወደ ጋሪ ጨምር',
    buyNow: 'አሁን ግዛ',
    quickAdd: 'በፍጥነት ጨምር',
    cartTitle: 'የግዢ ጋሪ እና ማድረሻ',
    emptyCart: 'ጋሪዎ ባዶ ነው።',
    subtotal: 'የእቃዎች ድምር',
    checkoutNote: 'በዚህ መሳሪያ ላይ ከክፍያ አማራጭ፣ ከቅናሽ ኮድ እና ከማድረሻ ካርታ አድራሻ ጋር ይቀመጣል።',
    remove: 'አስወግድ',
    staffTitle: 'የቤሊካ ነጋዴ መቆጣጠሪያ',
    staffNotice: 'በዚህ መሳሪያ ላይ ይቀመጣል · የAI የፎቶ ትንተና በደህንነቱ የተጠበቀ ሰርቨር ይሰራል።',
    productName: 'የምርት ስም (እንግሊዝኛ)',
    productNameAm: 'የአማርኛ ስም',
    priceETB: 'ዋጋ በብር',
    department: 'ክፍል',
    categoryLabel: 'ምድብ',
    subcategoryLabel: 'ንዑስ ምድብ (አማራጭ)',
    colors: 'ቀለሞች',
    sizesInput: 'መጠኖች (በኮማ ይለዩ)',
    colorsInput: 'ቀለሞች (በኮማ ይለዩ)',
    addDraft: 'እንደ ረቂቅ አስቀምጥ',
    publishNow: 'ወዲያውኑ አትም',
    draft: 'ረቂቅ',
    published: 'ታትሟል',
    verifyPublish: 'አረጋግጥ እና አትም',
    stock: 'ክምችት',
    orders: 'ትዕዛዞች እና አቅርቦት',
    noOrders: 'ገና የትዕዛዝ ጥያቄ የለም።',
    orderRequest: 'አድራሻ፣ ክፍያ እና ትዕዛዝ',
    customerName: 'ሙሉ ስም',
    customerPhone: 'ስልክ ቁጥር',
    fulfillment: 'የመቀበያ መንገድ',
    pickup: 'ከሱቅ መውሰድ (ቦሌ)',
    delivery: 'አዲስ አበባ ማድረስ',
    deliveryAddress: 'የማድረሻ አድራሻ / ክፍለ ከተማ እና ሰፈር',
    deliveryLandmark: 'የቅርብ ምልክት / ፎቅ / በር',
    deliveryFeeNote: 'ከ5,000 ብር በላይ ለአዲስ አበባ ማድረስ ነጻ ነው።',
    deliveryAddressRequired: 'እባክዎ የማድረሻ አድራሻ ይምረጡ ወይም ያስገቡ።',
    orderSummary: 'የትዕዛዝ ማጠቃለያ',
    submitRequest: 'ትዕዛዝ አስገባ',
    requested: 'ተጠይቋል',
    confirmed: 'ተረጋግጧል',
    outForDelivery: 'በመንገድ ላይ ነው',
    completed: 'ተጠናቋል',
    cancelled: 'ተሰርዟል',
    confirmOrder: 'አረጋግጥ እና ክምችት ያዝ',
    dispatchOrder: 'ለማድረስ ወጥቷል በል',
    completeOrder: 'ተጠናቋል በል',
    cancelOrder: 'ሰርዝ',
    stockError: 'ለዚህ ምርት በቂ ክምችት የለም።',
    chooseVariant: 'መጠን እና ቀለም ይምረጡ።',
    remaining: 'ቀሪ',
    outOfStock: 'ከክምችት ውጪ',
    orderSaved: 'ትዕዛዝዎ ተቀምጧል! ሁኔታውን ከታች ይከታተሉ።',
    contactRequired: 'ስምዎን እና ስልክ ቁጥርዎን ያስገቡ።',
    sampleWarning: 'የናሙና ክምችት ቁጥሮችን ማስተካከል ወይም መጨመር ይችላሉ።',
    total: 'ጠቅላላ',
    inventoryHistory: 'የክምችት ለውጥ መዝገብ',
    noMovements: 'ገና የክምችት ለውጥ አልተመዘገበም።',
    addProductHelp: 'የልብስ ፎቶ ይጫኑ እና "AI ምስሉን ይለይ" የሚለውን ይጫኑ።',
    productFieldsRequired: 'የምርት ስም፣ ትክክለኛ ዋጋ፣ እና ቢያንስ አንድ መጠንና ቀለም ያስገቡ።',
    zoomHint: 'የጨርቁን ጥራት ለማየት ማጉያውን ይጠቀሙ።',
    backToShop: 'ወደ መደብር ተመለስ',
    filters: 'ማጣሪያ',
    clearFilters: 'ማጣሪያ አጽዳ',
    colorFilter: 'ቀለም',
    sizeFilter: 'መጠን',
    priceFilter: 'ዋጋ',
    sortBy: 'ደርድር',
    myOrders: 'የትዕዛዝ ክትትል',
    uploadPhotos: 'ፎቶዎችን ይጫኑ',
    analyzeWithAi: 'AI ምስሉንና ቀለሞችን ይለይ',
    categoryManager: 'ምድቦች እና ቅናሾች',
    compare: 'አወዳድር',
    compareTitle: 'ጎን ለጎን የምርት ንጽጽር',
    compareMax: 'ለማወዳደር እስከ 2 ምርቶችን ይምረጡ',
    compareEmpty: 'ለንጽጽር የተመረጡ ምርቶች የሉም። በማንኛውም ሁለት ምርቶች ላይ "አወዳድር" ይጫኑ።',
    compareNow: 'አሁን አወዳድር',
    promoPlaceholder: 'የቅናሽ ኮድ (ለምሳሌ BELIKA10)',
    applyPromo: 'ተግብር',
    paymentMethodLabel: 'የክፍያ ዘዴ',
    payCod: 'በጥሬ ገንዘብ (ሲደርስ / በሱቅ)',
    payTelebirr: 'ቴሌብር (Telebirr)',
    payCbe: 'ሲቢኢ ብር / ባንክ',
    announcementText: 'ከ5,000 ብር በላይ ነጻ የአዲስ አበባ ማድረስ · በBELIKA10 10% ቅናሽ ያግኙ',
  },
};
