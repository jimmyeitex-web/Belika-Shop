import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Image,
  Linking,
  Modal,
  Platform,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';

type Department = 'All' | 'Men' | 'Women' | 'Kids';
type BranchDepartment = Exclude<Department, 'All'>;
type Language = 'en' | 'am';
type CustomerTab = 'shop' | 'wishlist' | 'cart';
type StaffSection = 'orders' | 'catalog' | 'categories' | 'promos' | 'stock' | 'admin';
type SortOption = 'featured' | 'bestselling' | 'price-asc' | 'price-desc' | 'rating';
type PriceBand = 'all' | 'under-2500' | '2500-5000' | 'over-5000';
type PaymentMethod = 'cod' | 'telebirr' | 'cbe';
type DeliveryProvider = 'mela' | 'addis-courier' | 'regional-parcel' | 'pickup';
type UserRole = 'customer' | 'merchant' | 'owner';

type BranchInfo = {
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

type AuthUser = {
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

type SupportMessage = {
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

type HeroPromoSlide = {
  id: string;
  department: Department;
  badgeEn: string;
  badgeAm: string;
  titleEn: string;
  titleAm: string;
  subtitleEn: string;
  subtitleAm: string;
  ctaEn: string;
  ctaAm: string;
  image: any;
  accentHex: string;
};

type MatrixRow = {
  color: string;
  size: string;
  stock: number;
};

type ColorSwatch = {
  name: string;
  nameAm?: string;
  hex: string;
};

type StoreCategory = {
  id: string;
  name: string;
  nameAm: string;
  department: Department;
  subcategories: string[];
  accentColor: string;
  isCustom?: boolean;
};

type ProductReview = {
  id: string;
  author: string;
  rating: number;
  fit: 'runs-small' | 'true-to-size' | 'runs-large';
  comment: string;
  createdAt: string;
};

type ProductVariant = {
  id: string;
  size: string;
  color: string;
  stock: number;
};

type Product = {
  id: string;
  department: Exclude<Department, 'All'>;
  category: string;
  subcategory?: string;
  name: string;
  nameAm: string;
  brand?: string;
  price: number;
  compareAtPrice?: number;
  badge?: string;
  sizes: string;
  sizeGuidance?: string;
  sizeGuidanceAm?: string;
  fabric?: string;
  careInstructions?: string;
  soldCount?: number;
  measurements?: string;
  styleTags?: string[];
  colorSwatches?: ColorSwatch[];
  customizable?: boolean;
  rating?: number;
  reviewCount?: number;
  reviews?: ProductReview[];
  emoji: string;
  tint: string;
  images?: any[];
  imageLabels?: string[];
  variants?: ProductVariant[];
  status?: 'draft' | 'published';
  sourceUrl?: string;
  sourceChannel?: string;
  sourceDate?: string;
};

type CartItem = {
  id: string;
  productId: string;
  variantId: string;
  size: string;
  color: string;
  quantity: number;
  customNote?: string;
};

type OrderStatus = 'requested' | 'confirmed' | 'out-for-delivery' | 'completed' | 'cancelled';
type CandidateKind = 'product' | 'possible-duplicate' | 'restock';
type CandidateStatus =
  | 'pending'
  | 'prepared'
  | 'drafted'
  | 'duplicate'
  | 'kept'
  | 'restock-reviewed'
  | 'ignored';
type CandidateFilter = 'pending' | 'all' | 'matches' | 'restocks';

type TelegramCandidate = {
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

type DeliveryCoordinates = {
  lat: number;
  lng: number;
};

type PromoCode = {
  code: string;
  type: 'percent' | 'fixed';
  value: number;
  minSubtotal?: number;
  label: string;
  labelAm: string;
  active: boolean;
};

type CustomerProfile = {
  name: string;
  phone: string;
  email?: string;
  preferredCity?: string;
  preferredSubcity?: string;
  preferredAddress?: string;
  preferredLandmark?: string;
  preferredZone?: string;
};

type StoreOrder = {
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
  subtotal?: number;
  total: number;
  status: OrderStatus;
  createdAt: string;
};

type StockMovement = {
  id: string;
  productId: string;
  variantId: string;
  kind: 'restock' | 'sale' | 'order' | 'return';
  quantity: number;
  createdAt: string;
};

type VisualSearchResult = {
  detectedItem: string;
  detectedItemAm: string;
  department: Department;
  category: string;
  colors: Array<{ name: string; nameAm: string; hex: string }>;
  styleKeywords: string[];
  matches: Array<{ id: string; score: number; reason: string; reasonAm: string }>;
};

const SHARED_API_BASE = 'https://ais-pre-yz7izvq72qmobesx2qkbpb-269677610561.europe-west2.run.app';
const DEV_API_BASE = 'https://ais-dev-yz7izvq72qmobesx2qkbpb-269677610561.europe-west2.run.app';
const DEFAULT_API_BASE = SHARED_API_BASE;
const BELIKA_SHOP_COORDS: DeliveryCoordinates = { lat: 9.0054, lng: 38.7636 };
const FREE_DELIVERY_THRESHOLD = 5000;

const DEFAULT_PROMO_CODES: PromoCode[] = [
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

const SIZE_GUIDE_CHARTS = {
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

async function safeFetchJson<T = any>(
  url: string,
  options?: RequestInit,
): Promise<T> {
  const res = await fetch(url, options);
  const rawText = await res.text();
  const trimmed = rawText.trim();
  const contentType = res.headers.get('content-type') || '';

  if (trimmed.startsWith('<') || contentType.includes('text/html')) {
    if (res.url?.includes('__cookie_check') || url.includes('ais-dev-')) {
      throw new Error(
        'The AI Studio Dev URL (ais-dev-...) requires a browser sign-in cookie, so Expo Go cannot call it from your phone. In AI Studio click Share / Publish so your Shared URL (ais-pre-...) goes live, or test AI directly in the web preview.',
      );
    }
    if (res.status === 404 && url.includes('ais-pre-')) {
      throw new Error(
        'Your Shared App URL (ais-pre-...) is not published yet (404). Open AI Studio, click Share / Publish App to activate it, then tap Test Server below.',
      );
    }
    throw new Error(`Server returned an HTML page (HTTP ${res.status}) instead of JSON.`);
  }

  let data: any;
  try {
    data = trimmed ? JSON.parse(trimmed) : {};
  } catch {
    throw new Error(`Invalid JSON response from server (HTTP ${res.status}).`);
  }

  if (!res.ok) {
    throw new Error(data?.error || `Request failed (HTTP ${res.status}).`);
  }
  return data as T;
}

const ADDIS_ZONES: Array<{ label: string; labelAm: string; coords: DeliveryCoordinates }> = [
  { label: 'Bole Medhanialem', labelAm: 'ቦሌ መድኃኔዓለም', coords: { lat: 8.9974, lng: 38.7868 } },
  { label: 'Kazanchis', labelAm: 'ካዛንቺስ', coords: { lat: 9.0175, lng: 38.7681 } },
  { label: 'Piazza', labelAm: 'ፒያሳ', coords: { lat: 9.0331, lng: 38.7501 } },
  { label: 'Sarbet', labelAm: 'ሳርቤት', coords: { lat: 8.9962, lng: 38.7385 } },
  { label: 'Megenagna', labelAm: 'መገናኛ', coords: { lat: 9.0205, lng: 38.8022 } },
  { label: 'CMC / Ayat', labelAm: 'ሲኤምሲ', coords: { lat: 9.0254, lng: 38.8421 } },
];

const ADDIS_SUBCITIES: Array<{ id: string; en: string; am: string; feeEtb: number; coords: DeliveryCoordinates }> = [
  { id: 'bole', en: 'Bole Subcity', am: 'ቦሌ ክፍለ ከተማ', feeEtb: 140, coords: { lat: 8.9974, lng: 38.7868 } },
  { id: 'kirkos', en: 'Kirkos Subcity', am: 'ቂርቆስ ክፍለ ከተማ', feeEtb: 150, coords: { lat: 9.0054, lng: 38.7636 } },
  { id: 'yeka', en: 'Yeka Subcity', am: 'የካ ክፍለ ከተማ', feeEtb: 180, coords: { lat: 9.0265, lng: 38.8042 } },
  { id: 'arada', en: 'Arada Subcity', am: 'አራዳ ክፍለ ከተማ', feeEtb: 180, coords: { lat: 9.0331, lng: 38.7501 } },
  { id: 'lideta', en: 'Lideta Subcity', am: 'ልደታ ክፍለ ከተማ', feeEtb: 180, coords: { lat: 9.0126, lng: 38.7364 } },
  { id: 'addis-ketema', en: 'Addis Ketema Subcity', am: 'አዲስ ከተማ ክፍለ ከተማ', feeEtb: 200, coords: { lat: 9.0308, lng: 38.7294 } },
  { id: 'nifas-silk', en: 'Nifas Silk-Lafto', am: 'ንፋስ ስልክ ላፍቶ', feeEtb: 220, coords: { lat: 8.9698, lng: 38.7361 } },
  { id: 'kolfe', en: 'Kolfe Keranio', am: 'ኮልፌ ቀራኒዮ', feeEtb: 240, coords: { lat: 9.0185, lng: 38.7042 } },
  { id: 'gulele', en: 'Gulele Subcity', am: 'ጉለሌ ክፍለ ከተማ', feeEtb: 240, coords: { lat: 9.0545, lng: 38.7385 } },
  { id: 'lemi-kura', en: 'Lemi Kura Subcity', am: 'ለሚ ኩራ ክፍለ ከተማ', feeEtb: 240, coords: { lat: 9.0254, lng: 38.8421 } },
  { id: 'akaky', en: 'Akaky Kaliti', am: 'አቃቂ ቃሊቲ', feeEtb: 280, coords: { lat: 8.8989, lng: 38.7896 } },
];

const ETHIOPIA_REGIONAL_CITIES: Array<{ id: string; en: string; am: string; feeEtb: number }> = [
  { id: 'adama', en: 'Adama / Nazret', am: 'አዳማ / ናዝሬት', feeEtb: 380 },
  { id: 'bishoftu', en: 'Bishoftu / Debre Zeit', am: 'ቢሾፍቱ / ደብረ ዘይት', feeEtb: 320 },
  { id: 'hawassa', en: 'Hawassa', am: 'ሐዋሳ', feeEtb: 450 },
  { id: 'bahir-dar', en: 'Bahir Dar', am: 'ባሕር ዳር', feeEtb: 480 },
  { id: 'dire-dawa', en: 'Dire Dawa', am: 'ድሬዳዋ', feeEtb: 480 },
  { id: 'mekelle', en: 'Mekelle', am: 'መቀሌ', feeEtb: 520 },
  { id: 'gondar', en: 'Gondar', am: 'ጎንደር', feeEtb: 520 },
  { id: 'jimma', en: 'Jimma', am: 'ጅማ', feeEtb: 450 },
  { id: 'dessie', en: 'Dessie', am: 'ደሴ', feeEtb: 450 },
  { id: 'shashamane', en: 'Shashamane', am: 'ሻሸመኔ', feeEtb: 420 },
  { id: 'harar', en: 'Harar', am: 'ሐረር', feeEtb: 490 },
  { id: 'arba-minch', en: 'Arba Minch', am: 'አርባ ምንጭ', feeEtb: 490 },
  { id: 'other-city', en: 'Other Ethiopian City', am: 'ሌላ ከተማ', feeEtb: 450 },
];

const DELIVERY_PROVIDERS: Array<{
  id: DeliveryProvider;
  en: string;
  am: string;
  eta: string;
  etaAm: string;
}> = [
  { id: 'mela', en: 'Mela Delivery', am: 'መላ ዴሊቨሪ (Mela)', eta: 'Same-day Addis doorstep', etaAm: 'በዚያው ቀን ቤትዎ ድረስ' },
  { id: 'addis-courier', en: 'Addis Bike Courier', am: 'አዲስ ሞተር ኩሪየር', eta: '2–4 hrs in Addis', etaAm: '2–4 ሰዓት በአዲስ አበባ' },
  { id: 'regional-parcel', en: 'Regional Parcel / Bus', am: 'የክልል ፓርሴል / አውቶብስ', eta: '1–2 days nationwide', etaAm: '1–2 ቀናት ወደ ክልል' },
];

const DEFAULT_BRANCHES: Record<BranchDepartment, BranchInfo> = {
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

const SIZE_PRESETS = {
  apparel: ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'],
  kidsApparel: ['2Y', '4Y', '6Y', '8Y', '10Y', '12Y'],
  shoes: ['28', '30', '32', '34', '35', '36', '37', '38', '39', '40', '41', '42', '43'],
  free: ['Free size'],
};

function getContextualSizes(
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

function resolveImageIndexForColor(product: Product, colorName: string): number {
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

const DEFAULT_CATEGORIES: StoreCategory[] = [
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

const PRODUCTS: Product[] = [
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
    careInstructions: 'Cold gentle hand wash · Line dry in shade',
    soldCount: 142,
    customizable: true,
    styleTags: ['kemis', 'habesha', 'dress'],
    colorSwatches: [
      { name: 'Ivory Cream', hex: '#F4EFE4' },
      { name: 'Terracotta', hex: '#C06C3E' },
    ],
    rating: 4.9,
    reviewCount: 38,
    reviews: [
      { id: 'rev-kemis-1', author: 'Selamawit T.', rating: 5, fit: 'true-to-size', comment: 'Lightweight for Addis afternoons and the woven border looks clean.', createdAt: '2026-11-18' },
      { id: 'rev-kemis-2', author: 'Hanna G.', rating: 5, fit: 'true-to-size', comment: 'Requested a 132cm hem in checkout and Belika tailored it cleanly.', createdAt: '2026-11-21' },
    ],
    emoji: '👗',
    tint: '#F2EBE5',
    images: [
      require('./assets/womens_kemis.jpg'),
      require('./assets/womens_jumpsuit.jpg'),
    ],
    imageLabels: ['Ivory Cream', 'Terracotta'],
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
    careInstructions: 'Gentle wash 30°C · Steam press',
    soldCount: 64,
    customizable: true,
    measurements: 'M: Bust 92cm, Waist 76cm · L: Bust 98cm, Waist 82cm',
    styleTags: ['jumpsuit', 'linen', 'office', 'co-ord'],
    colorSwatches: [
      { name: 'Terracotta', hex: '#C06C3E' },
      { name: 'Ivory Cream', hex: '#F4EFE4' },
    ],
    rating: 4.9,
    reviewCount: 21,
    reviews: [
      { id: 'rev-jump-1', author: 'Bethelhem K.', rating: 5, fit: 'true-to-size', comment: 'Breathable linen weight and great structure for work or dinner.', createdAt: '2026-11-22' },
    ],
    emoji: '🦺',
    tint: '#EFE3D8',
    images: [
      require('./assets/womens_jumpsuit.jpg'),
      require('./assets/womens_kemis.jpg'),
    ],
    imageLabels: ['Terracotta', 'Ivory Cream'],
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
    sizeGuidanceAm: 'ትክክለኛውን የጫማ ቁጥር (36–41) ሲጠይቁ ያረጋግጡ።',
    fabric: 'Soft Leather Upper & Cushioned Sole',
    careInstructions: 'Wipe with soft dry cloth · Condition leather monthly',
    soldCount: 118,
    styleTags: ['shoes', 'flats', 'comfort'],
    colorSwatches: [
      { name: 'Tan', hex: '#C8A57B' },
      { name: 'Black', hex: '#232625' },
    ],
    rating: 4.8,
    reviewCount: 31,
    reviews: [
      { id: 'rev-flats-1', author: 'Rahel A.', rating: 5, fit: 'true-to-size', comment: 'Zero break-in needed. Wore the Tan pair all day around Bole.', createdAt: '2026-11-19' },
    ],
    emoji: '🥿',
    tint: '#EFE6DE',
    images: [require('./assets/womens_flats.jpg')],
    imageLabels: ['Tan', 'Black'],
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
    sizeGuidanceAm: 'መደበኛ የጥጥ ፖሎ ልክ።',
    fabric: '100% Pique Cotton Knit',
    careInstructions: 'Machine wash cold 30°C · Do not tumble dry',
    soldCount: 185,
    measurements: 'M: 104cm · L: 110cm · XL: 116cm · XXL: 122cm',
    styleTags: ['polo', 'casual', 'cotton'],
    colorSwatches: [
      { name: 'Tan', hex: '#C8A57B' },
      { name: 'White', hex: '#F5F2EB' },
      { name: 'Pale grey', hex: '#C4C7C8' },
    ],
    rating: 4.8,
    reviewCount: 24,
    reviews: [
      { id: 'rev-polo-1', author: 'Dawit M.', rating: 5, fit: 'true-to-size', comment: 'Soft cotton collar holds shape well after washing.', createdAt: '2026-11-12' },
    ],
    emoji: '👕',
    tint: '#EFEAE1',
    images: [
      require('./assets/polo_trio.jpg'),
      require('./assets/cotton_tee.jpg'),
    ],
    imageLabels: ['Tan', 'White', 'Pale grey'],
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
    sizeGuidanceAm: 'ዘመናዊ ባለ ሁለት ክፍል ሙሉ ሱት።',
    fabric: 'Fine Wool-Linen Suiting Blend',
    careInstructions: 'Dry clean only · Steam to refresh',
    soldCount: 41,
    customizable: true,
    measurements: 'L (EU 50) · XL (EU 52) · XXL (EU 54)',
    styleTags: ['suit', 'formal', 'wedding', 'tailored'],
    colorSwatches: [
      { name: 'Charcoal', hex: '#2B2E2D' },
      { name: 'Navy', hex: '#24364D' },
    ],
    rating: 4.9,
    reviewCount: 18,
    reviews: [
      { id: 'rev-suit-1', author: 'Yohannes B.', rating: 5, fit: 'true-to-size', comment: 'Sharp lapel and lightweight lining that breathes nicely.', createdAt: '2026-11-20' },
    ],
    emoji: '🤵',
    tint: '#E5E7E6',
    images: [
      require('./assets/mens_suit.jpg'),
      require('./assets/mens_jacket.jpg'),
    ],
    imageLabels: ['Charcoal', 'Navy'],
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
    sizeGuidance: 'Structured shoulder tailoring. Size up if layering thick sweaters.',
    sizeGuidanceAm: 'የተስተካከለ ትከሻ ያለው ጃኬት።',
    fabric: 'Structured Wool-Blend Twill',
    careInstructions: 'Dry clean recommended',
    soldCount: 73,
    customizable: true,
    styleTags: ['formal', 'jacket', 'outerwear'],
    colorSwatches: [
      { name: 'Charcoal', hex: '#2B2E2D' },
      { name: 'Navy', hex: '#24364D' },
    ],
    rating: 4.9,
    reviewCount: 16,
    emoji: '🧥',
    tint: '#E7E4DD',
    images: [
      require('./assets/mens_jacket.jpg'),
      require('./assets/mens_suit.jpg'),
    ],
    imageLabels: ['Charcoal', 'Navy'],
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
    careInstructions: 'Machine wash cold · Wash inside out',
    soldCount: 210,
    styleTags: ['casual', 'tee', 'basic'],
    colorSwatches: [
      { name: 'Ivory', hex: '#F5F2EB' },
      { name: 'Black', hex: '#232625' },
      { name: 'Forest Green', hex: '#284B3C' },
    ],
    rating: 4.7,
    reviewCount: 27,
    emoji: '👕',
    tint: '#ECE7DF',
    images: [
      require('./assets/cotton_tee.jpg'),
      require('./assets/polo_trio.jpg'),
    ],
    imageLabels: ['Ivory', 'Black', 'Forest Green'],
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
    sizeGuidanceAm: 'ሰፊ ኪሶች ያሉት ካርጎ ሱሪ። የወገብ ልክን ያረጋግጡ።',
    fabric: 'Heavy Cotton Ripstop Twill',
    careInstructions: 'Machine wash 30°C · Warm iron',
    soldCount: 96,
    customizable: true,
    styleTags: ['cargo', 'trousers', 'streetwear'],
    colorSwatches: [
      { name: 'Olive Green', hex: '#4B5943' },
      { name: 'Sand Khaki', hex: '#C2AA84' },
      { name: 'Black', hex: '#232625' },
    ],
    rating: 4.8,
    reviewCount: 29,
    reviews: [
      { id: 'rev-cargo-1', author: 'Natnael S.', rating: 5, fit: 'true-to-size', comment: 'Thick ripstop fabric and clean stitching on all pocket flaps.', createdAt: '2026-11-17' },
    ],
    emoji: '👖',
    tint: '#E5E7DF',
    images: [require('./assets/cargo_trousers.jpg')],
    imageLabels: ['Olive Green', 'Sand Khaki', 'Black'],
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
    careInstructions: 'Wash separately cold · Hang dry',
    soldCount: 52,
    styleTags: ['denim', 'jacket', 'casual'],
    colorSwatches: [
      { name: 'Indigo Denim', hex: '#2E4A6B' },
      { name: 'Slate Grey', hex: '#636A70' },
    ],
    rating: 4.7,
    reviewCount: 11,
    emoji: '👔',
    tint: '#E6E9EB',
    images: [require('./assets/mens_jacket.jpg')],
    imageLabels: ['Indigo Denim', 'Slate Grey'],
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
    sizeGuidanceAm: 'ለትምህርት ቤት እና ለእረፍት ቀን ምቹ የልጆች ጫማ።',
    fabric: 'Breathable Mesh & Non-Slip Rubber Sole',
    careInstructions: 'Wipe with damp sponge · Air dry',
    soldCount: 87,
    styleTags: ['kids', 'sneakers', 'shoes'],
    colorSwatches: [
      { name: 'White', hex: '#F5F2EB' },
      { name: 'Navy', hex: '#24364D' },
    ],
    rating: 4.9,
    reviewCount: 15,
    reviews: [
      { id: 'rev-kids-1', author: 'Mekdes F.', rating: 5, fit: 'true-to-size', comment: 'Easy for kids to put on and very light sole.', createdAt: '2026-11-23' },
    ],
    emoji: '👟',
    tint: '#E6EEEA',
    images: [require('./assets/kids_sneakers.jpg')],
    imageLabels: ['White', 'Navy'],
  },
];

const TELEGRAM_PREVIEW_CANDIDATES: TelegramCandidate[] = [
  { id: 'm-1067', department: 'Men', name: 'Cargo pant', price: 4000, sizeSpec: 'M-XXXL', postedAt: '2026-10-03', channel: 'Belika Man', postUrl: 'https://t.me/Belika2016/1067', kind: 'possible-duplicate', groupId: 'men-cargo' },
  { id: 'm-1071', department: 'Men', name: 'Old money', price: 4500, sizeSpec: 'M-XXL', postedAt: '2026-10-03', channel: 'Belika Man', postUrl: 'https://t.me/Belika2016/1071', kind: 'product' },
  { id: 'm-1074', department: 'Men', name: 'Original Jeep', price: 5000, sizeSpec: 'M-3XL', postedAt: '2026-10-09', channel: 'Belika Man', postUrl: 'https://t.me/Belika2016/1074', kind: 'product' },
  { id: 'm-1078', department: 'Men', name: 'Cargo', price: 4500, sizeSpec: 'M-3XL', postedAt: '2026-10-09', channel: 'Belika Man', postUrl: 'https://t.me/Belika2016/1078', kind: 'possible-duplicate', groupId: 'men-cargo', note: 'Similar caption to another cargo post; compare the original photos and price before deciding.' },
  { id: 'm-1086', department: 'Men', name: 'Jeans jacket', price: 5000, sizeSpec: 'M-XXL', postedAt: '2026-10-19', channel: 'Belika Man', postUrl: 'https://t.me/Belika2016/1086', kind: 'product' },
  { id: 'w-1660', department: 'Women', name: 'New Balance 530', price: 5500, sizeSpec: 'Sizes available', postedAt: '2026-10-15', channel: 'Belika woman', postUrl: 'https://t.me/a_z0blc/1660', kind: 'product' },
  { id: 'w-1673', department: 'Women', name: 'Cherki suri', price: 4000, sizeSpec: 'Up to 4XL', postedAt: '2026-10-17', channel: 'Belika woman', postUrl: 'https://t.me/a_z0blc/1673', kind: 'product' },
  { id: 'w-1747', department: 'Women', name: 'Cherki suri', price: 800, sizeSpec: 'Free size', postedAt: '2026-10-25', channel: 'Belika woman', postUrl: 'https://t.me/a_z0blc/1747', kind: 'restock', groupId: 'women-cherki-restock', note: 'Caption indicates it came in again; preserve as a restock event.' },
  { id: 'w-1864', department: 'Women', name: 'Kemis', price: 1800, sizeSpec: 'Free size', postedAt: '2026-11-18', channel: 'Belika woman', postUrl: 'https://t.me/a_z0blc/1864', kind: 'product' },
  { id: 'k-637', department: 'Kids', name: 'Master Quality shoes', price: 3200, sizeSpec: '32-37', postedAt: '2026-09-30', channel: 'Belika kids', postUrl: 'https://t.me/KB05q/637', kind: 'product' },
  { id: 'k-653', department: 'Kids', name: 'Sneakers', price: 3000, sizeSpec: '32-40', postedAt: '2026-10-21', channel: 'Belika kids', postUrl: 'https://t.me/KB05q/653', kind: 'product' },
  { id: 'k-711', department: 'Kids', name: 'Samba style', price: 2600, sizeSpec: '26-36', postedAt: '2026-11-20', channel: 'Belika kids', postUrl: 'https://t.me/KB05q/711', kind: 'product' },
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

const DEFAULT_PRODUCTS: Product[] = PRODUCTS.map((product) => {
  const colors = product.imageLabels?.length ? product.imageLabels : ['Unspecified'];
  const variants = getInitialSizes(product.sizes).flatMap((size, sizeIndex) =>
    colors.map((color, colorIndex) => ({
      id: `${product.id}-v${sizeIndex}-${colorIndex}`,
      size,
      color,
      stock: 3,
    })),
  );
  return { ...product, variants, status: 'published' };
});

const STORAGE_KEYS = {
  products: 'belika:v5:products',
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
  apiBaseUrl: 'belika:v2:apiBaseUrl',
};

const COPY = {
  en: {
    shop: 'Shop',
    bag: 'Bag',
    search: 'Search outfits, Kemis, colors…',
    cameraBtn: 'Camera Search',
    departments: 'Our Shops',
    categories: 'Categories',
    allCategories: 'All',
    featured: 'Curated Boutique Feed',
    flashDrops: 'Flash Drops',
    recentlyViewed: 'Recently Viewed',
    all: 'All Shops',
    men: 'Belika Man',
    women: 'Belika Women',
    kids: 'Belika Kids',
    bannerTop: 'Addis Ababa, Ethiopia · Belika Online Store',
    bannerTitle: 'Modern Ethiopian fashion, smartly curated.',
    bannerText: 'Snap any outfit to find matching colors & styles, check exact garment sizing, or pin your Addis Ababa delivery spot on Google Maps.',
    bannerButton: 'Explore collection',
    sizes: 'Sizes',
    demo: 'Sample catalog · confirm price, size, and stock directly with Belika.',
    empty: 'No matching products found.',
    kidsSoon: 'Kids products will appear here once verified items are added.',
    wishlist: 'Wishlist',
    wishlistEmpty: 'Your wishlist is empty. Tap ♡ on any item to save it here.',
    samplePhoto: 'SAMPLE PHOTO',
    viewDetails: 'View',
    details: 'Item details',
    chooseSize: 'Choose size',
    sizeGuidance: 'Fit & fabric notes',
    sizeHelp: 'Sizes come from shop notes. Confirm exact fit availability with staff.',
    photoHelp: 'Colors are extracted from photos; confirm exact shade with the shop.',
    customFitLabel: 'Custom fit / tailoring note (optional)',
    customFitPlaceholder: 'e.g., Hem 132cm or slim waist…',
    addToCart: 'Add to bag',
    cartTitle: 'Your bag',
    emptyCart: 'Your bag is empty.',
    subtotal: 'Subtotal',
    checkoutLater: 'Saved locally on this phone with your pinned Addis delivery address.',
    remove: 'Remove',
    staff: 'Studio',
    staffTitle: 'Belika Merchant Studio',
    localOnly: 'Saved on this phone. AI photo recognition & reverse-geocoding connect to your Belika server URL.',
    productName: 'Product name (English)',
    productNameAm: 'Amharic name (አማርኛ)',
    priceETB: 'Price in ETB',
    department: 'Department',
    colors: 'Colors',
    sizesInput: 'Sizes, comma separated',
    colorsInput: 'Colors, comma separated',
    addDraft: 'Save as draft',
    publishNow: 'Publish now',
    draft: 'Draft',
    published: 'Published',
    verifyPublish: 'Verify & publish',
    stock: 'Stock',
    orders: 'Orders',
    noOrders: 'No order requests yet.',
    orderRequest: 'Checkout & Delivery Pin',
    customerName: 'Customer name',
    customerPhone: 'Contact phone',
    fulfillment: 'Receiving method',
    pickup: 'Shop pickup (Bole)',
    delivery: 'Addis delivery',
    deliveryAddress: 'Delivery address (Sub-city & street)',
    deliveryLandmark: 'Nearby landmark / gate / floor',
    deliveryFeeNote: 'Estimated courier fee is calculated by Addis zone distance from Bole.',
    deliveryAddressRequired: 'Enter or select a delivery address.',
    orderSummary: 'Order summary',
    submitRequest: 'Submit order request',
    requested: 'Requested',
    confirmOrder: 'Confirm & reserve stock',
    completeOrder: 'Mark completed',
    cancelOrder: 'Cancel',
    stockError: 'Not enough stock for this variant.',
    chooseVariant: 'Choose a size and color.',
    remaining: 'available',
    outOfStock: 'Out of stock',
    orderSaved: 'Order request saved on this phone.',
    contactRequired: 'Enter customer name and phone.',
    sampleWarning: 'Sample stock (3 per variant) is for testing. Update with verified counts.',
    confirmed: 'Confirmed',
    outForDelivery: 'Out for delivery',
    completed: 'Completed',
    cancelled: 'Cancelled',
    total: 'Est. Total',
    inventoryHistory: 'Recent stock movements',
    noMovements: 'No stock movements recorded yet.',
    addProductHelp: 'Upload garment photos to auto-detect name, brand, material, colors, department & category. Enter price, sizes & quantities manually.',
    productFieldsRequired: 'Enter a product name, valid price, available sizes, and colors.',
    filters: 'Filters',
    clearFilters: 'Reset',
    myOrders: 'Recent Orders & Tracking',
  },
  am: {
    shop: 'መደብር',
    bag: 'ጋሪ',
    search: 'ልብሶችን፣ ቀሚስን፣ ቀለምን ይፈልጉ',
    cameraBtn: 'በካሜራ ፈልግ',
    departments: 'ክፍሎቻችን',
    categories: 'ምድቦች',
    allCategories: 'ሁሉም',
    featured: 'የተመረጡ ምርቶች',
    flashDrops: 'ፈጣን ቅናሾች',
    recentlyViewed: 'በቅርብ የታዩ',
    all: 'ሁሉም ሱቆች',
    men: 'ቤሊካ ወንዶች',
    women: 'ቤሊካ ሴቶች',
    kids: 'ቤሊካ ልጆች',
    bannerTop: 'አዲስ አበባ፣ ኢትዮጵያ · ቤሊካ ኦንላይን ስቶር',
    bannerTitle: 'ዘመናዊ የኢትዮጵያ ፋሽን እና ብልህ ግዢ።',
    bannerText: 'በካሜራ ፎቶ አንስተው ተመሳሳይ ልብሶችንና ቀለሞችን ይፈልጉ፣ ልክዎን ያስተካክሉ፣ እና በGoogle Maps አድራሻ ይምረጡ።',
    bannerButton: 'ስብስቡን ይመልከቱ',
    sizes: 'መጠን',
    demo: 'የሙከራ ካታሎግ · ዋጋን፣ መጠንን እና ክምችትን ከሱቁ ጋር ያረጋግጡ።',
    samplePhoto: 'የናሙና ምስል',
    empty: 'የሚዛመድ ምርት አልተገኘም።',
    kidsSoon: 'የተረጋገጡ የልጆች ምርቶች ሲጨመሩ እዚህ ይታያሉ።',
    wishlist: 'የምወዳቸው',
    wishlistEmpty: 'የምወዳቸው ዝርዝር ባዶ ነው።',
    viewDetails: 'ዝርዝር',
    details: 'የምርት ዝርዝር',
    chooseSize: 'መጠን ይምረጡ',
    sizeGuidance: 'የመጠን እና የጨርቅ መመሪያ',
    sizeHelp: 'መጠኖቹ ከፖስቱ የተወሰዱ ናቸው፤ ከሱቁ ጋር ያረጋግጡ።',
    photoHelp: 'ቀለሞቹ ከፎቶዎቹ የተለዩ ናቸው፤ ከሱቁ ጋር ያረጋግጡ።',
    customFitLabel: 'የልክ ማስተካከያ / ማስታወሻ (አማራጭ)',
    customFitPlaceholder: 'ለምሳሌ፦ ርዝመት 132 ሴ.ሜ…',
    addToCart: 'ወደ ጋሪ ጨምር',
    cartTitle: 'ጋሪዎ',
    emptyCart: 'ጋሪዎ ባዶ ነው።',
    subtotal: 'ንዑስ ድምር',
    checkoutLater: 'በዚህ ስልክ ላይ ከማድረሻ አድራሻዎ ጋር ይቀመጣል።',
    remove: 'አስወግድ',
    staff: 'ነጋዴ',
    staffTitle: 'የቤሊካ ነጋዴ ክፍል',
    localOnly: 'በዚህ ስልክ ላይ ይቀመጣል። የAI ምስል መለያ ከቤሊካ ሰርቨር ጋር ይገናኛል።',
    productName: 'የምርት ስም (እንግሊዝኛ)',
    productNameAm: 'የአማርኛ ስም',
    priceETB: 'ዋጋ በብር',
    department: 'ክፍል',
    colors: 'ቀለሞች',
    sizesInput: 'መጠኖች፣ በኮማ ይለዩ',
    colorsInput: 'ቀለሞች፣ በኮማ ይለዩ',
    addDraft: 'እንደ ረቂቅ ጨምር',
    publishNow: 'ወዲያውኑ አትም',
    draft: 'ረቂቅ',
    published: 'ታትሟል',
    verifyPublish: 'አረጋግጥ እና አትም',
    stock: 'ክምችት',
    orders: 'ትዕዛዞች',
    noOrders: 'ገና የትዕዛዝ ጥያቄ የለም።',
    orderRequest: 'አድራሻ እና ትዕዛዝ መላኪያ',
    customerName: 'የደንበኛ ስም',
    customerPhone: 'ስልክ ቁጥር',
    fulfillment: 'የመቀበያ መንገድ',
    pickup: 'በሱቅ መውሰድ (ቦሌ)',
    delivery: 'አዲስ አበባ ማድረስ',
    deliveryAddress: 'የማድረሻ አድራሻ (ክፍለ ከተማና ሰፈር)',
    deliveryLandmark: 'የቅርብ ምልክት / በር',
    deliveryFeeNote: 'የማድረሻ ዋጋ ከቦሌ ሱቃችን ርቀት አንጻር ይገመታል።',
    deliveryAddressRequired: 'እባክዎ የማድረሻ አድራሻ ይምረጡ ወይም ያስገቡ።',
    orderSummary: 'የትዕዛዝ ማጠቃለያ',
    submitRequest: 'የትዕዛዝ ጥያቄ አስቀምጥ',
    requested: 'ተጠይቋል',
    confirmOrder: 'አረጋግጥ እና ክምችት ያዝ',
    completeOrder: 'ተጠናቋል በል',
    cancelOrder: 'ሰርዝ',
    stockError: 'ለዚህ ትዕዛዝ በቂ ክምችት የለም።',
    chooseVariant: 'መጠንና ቀለም ይምረጡ።',
    remaining: 'ቀሪ',
    outOfStock: 'ከክምችት ውጪ',
    orderSaved: 'የትዕዛዝ ጥያቄው በዚህ ስልክ ተቀምጧል።',
    contactRequired: 'የደንበኛ ስምና ስልክ ያስገቡ።',
    sampleWarning: 'የናሙና ክምችት ለሙከራ ብቻ ነው። በተረጋገጠ ቁጥር ይተኩ።',
    confirmed: 'ተረጋግጧል',
    outForDelivery: 'በመንገድ ላይ ነው',
    completed: 'ተጠናቋል',
    cancelled: 'ተሰርዟል',
    total: 'ጠቅላላ ግምት',
    inventoryHistory: 'የቅርብ የክምችት ለውጦች',
    noMovements: 'ገና የክምችት ለውጥ አልተመዘገበም።',
    addProductHelp: 'ፎቶ ሲጫኑ AI ስም፣ ብራንድ፣ ጨርቅ፣ ቀለም፣ ክፍል እና ምድብን በራሱ ይለያል። ዋጋ፣ መጠንና ብዛትን እርስዎ ያስገቡ።',
    productFieldsRequired: 'የምርት ስም፣ ትክክክለኛ ዋጋ፣ መጠኖችና ቀለሞች ያስገቡ።',
    filters: 'ማጣሪያ',
    clearFilters: 'አጽዳ',
    myOrders: 'የቅርብ ትዕዛዞች እና ክትትል',
  },
};

const COLORS = {
  ivory: '#FAF7F2',
  forest: '#1A332A',
  forestSoft: '#27473B',
  ink: '#1F2421',
  terracotta: '#C06C3E',
  gold: '#D8B376',
  white: '#FFFFFF',
  muted: '#646B66',
  line: '#E6DFD3',
  sand: '#EFE9DE',
};

const HERO_PREVIEW_PHOTO = require('./assets/hero_editorial.jpg');
const BELIKA_LOGO_ICON = require('./assets/belika_logo_icon.jpg');
const BELIKA_LOGO_SPLASH = require('./assets/belika_logo_splash.jpg');

const HERO_PROMO_SLIDES: HeroPromoSlide[] = [
  {
    id: 'promo-women-new',
    department: 'Women',
    badgeEn: 'NEW ARRIVALS · BELIKA WOMEN',
    badgeAm: 'አዲስ የገቡ · ቤሊካ ሴቶች',
    titleEn: 'Handwoven Kemis & Linen Edit',
    titleAm: 'አዲስ የጥበብ ቀሚስ እና ሊነን',
    subtitleEn: 'Fresh Ethiopian studio silhouettes tailored for Addis evenings.',
    subtitleAm: 'ለአዲስ አበባ ፋሽን የተዘጋጁ ዘመናዊ የሴቶች አልባሳት።',
    ctaEn: 'Explore Collection',
    ctaAm: 'ስብስቡን ይመልከቱ',
    image: require('./assets/hero_editorial.jpg'),
    accentHex: '#C06C3E',
  },
  {
    id: 'promo-men-trending',
    department: 'Men',
    badgeEn: 'TRENDING NOW · BELIKA MAN',
    badgeAm: 'ተወዳጅ ምርቶች · ቤሊካ ወንዶች',
    titleEn: 'Diplomat Tailoring & Polos',
    titleAm: 'ዘመናዊ ዲፕሎማት ጃኬት እና ፖሎ',
    subtitleEn: 'Sharp charcoal suits, breathable cotton knitwear & utility cargos.',
    subtitleAm: 'ለቢሮ እና ለእረፍት የሚሆኑ ጥራት ያላቸው የወንዶች ልብሶች።',
    ctaEn: 'Shop Belika Man',
    ctaAm: 'የወንዶች ክፍል ይዩ',
    image: require('./assets/mens_suit.jpg'),
    accentHex: '#244035',
  },
  {
    id: 'promo-sale-all',
    department: 'All',
    badgeEn: 'SEASONAL SALE · በቅናሽ',
    badgeAm: 'ልዩ የወቅቱ ቅናሽ · በቅናሽ',
    titleEn: 'Boutique Picks Up to 25% Off',
    titleAm: 'እስከ 25% ቅናሽ · በBELIKA10',
    subtitleEn: 'Free Addis delivery on orders ETB 5,000+ via Mela Delivery.',
    subtitleAm: 'ከ5,000 ብር በላይ ነጻ የአዲስ አበባ ማድረስ።',
    ctaEn: 'Explore Deals',
    ctaAm: 'ቅናሾችን ይመልከቱ',
    image: require('./assets/polo_trio.jpg'),
    accentHex: '#A6562D',
  },
  {
    id: 'promo-kids-new',
    department: 'Kids',
    badgeEn: 'NEW DROP · BELIKA KIDS',
    badgeAm: 'አዲስ · ቤሊካ ልጆች',
    titleEn: 'Comfort Court Sneakers & Sets',
    titleAm: 'ለልጆች ምቹ ጫማዎች እና አልባሳት',
    subtitleEn: 'Breathable school-to-weekend footwear in EU sizes 28–35.',
    subtitleAm: 'ለትምህርት ቤት እና ለእረፍት ቀን የተመረጡ ጫማዎች።',
    ctaEn: 'Shop Belika Kids',
    ctaAm: 'የልጆች ክፍል ይዩ',
    image: require('./assets/kids_sneakers.jpg'),
    accentHex: '#275E52',
  },
];

function colorSwatchHex(color: string): string {
  const key = color.trim().toLowerCase();
  if (key.includes('tan') || key.includes('sand') || key.includes('camel') || key.includes('khaki')) return '#C8A57B';
  if (key.includes('white') || key.includes('ivory') || key.includes('cream')) return '#F5F2EB';
  if (key.includes('grey') || key.includes('gray') || key.includes('silver')) return '#B8BDC0';
  if (key.includes('forest') || key.includes('olive') || key.includes('green')) return '#284B3C';
  if (key.includes('navy') || key.includes('blue') || key.includes('denim')) return '#24364D';
  if (key.includes('black') || key.includes('charcoal')) return '#232625';
  if (key.includes('brown') || key.includes('terracotta')) return '#9E5434';
  if (key.includes('gold') || key.includes('yellow')) return '#D6A954';
  if (key.includes('red') || key.includes('wine')) return '#8F2D2D';
  return '#B8AEA0';
}

function monogramFor(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length >= 2) return `${words[0][0]}${words[1][0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase() || 'BL';
}

function resolveImageSource(img: any, baseUrl: string = SHARED_API_BASE) {
  if (!img) return HERO_PREVIEW_PHOTO;
  if (typeof img === 'string') {
    const clean = img.trim();
    if (clean.startsWith('/')) {
      return { uri: `${baseUrl.replace(/\/+$/, '')}${clean}` };
    }
    return { uri: clean };
  }
  return img;
}

function computeDistanceKm(a: DeliveryCoordinates, b: DeliveryCoordinates): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const r = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h = sinLat * sinLat + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinLng * sinLng;
  return Number((2 * r * Math.asin(Math.sqrt(h))).toFixed(1));
}

function estimateAddisDeliveryFee(distanceKm: number): number {
  if (distanceKm <= 3.5) return 120;
  if (distanceKm <= 8) return 180;
  if (distanceKm <= 14) return 260;
  return 350;
}

function BoutiqueSearchIcon({ color = COLORS.muted }: { color?: string }) {
  return (
    <View style={{ width: 18, height: 18, justifyContent: 'center', alignItems: 'center', marginRight: 8 }}>
      <View
        style={{
          width: 12,
          height: 12,
          borderRadius: 6,
          borderWidth: 1.8,
          borderColor: color,
          transform: [{ translateX: -1 }, { translateY: -1 }],
        }}
      />
      <View
        style={{
          width: 6,
          height: 1.8,
          backgroundColor: color,
          position: 'absolute',
          right: 1,
          bottom: 2,
          borderRadius: 1,
          transform: [{ rotate: '45deg' }],
        }}
      />
    </View>
  );
}

function BoutiqueHomeIcon({ color }: { color: string }) {
  return (
    <View style={{ width: 18, height: 18, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ flexDirection: 'row', gap: 2.5, marginBottom: 2.5 }}>
        <View style={{ width: 6.5, height: 6.5, borderRadius: 1.5, borderWidth: 1.7, borderColor: color }} />
        <View style={{ width: 6.5, height: 6.5, borderRadius: 1.5, borderWidth: 1.7, borderColor: color }} />
      </View>
      <View style={{ flexDirection: 'row', gap: 2.5 }}>
        <View style={{ width: 6.5, height: 6.5, borderRadius: 1.5, borderWidth: 1.7, borderColor: color }} />
        <View style={{ width: 6.5, height: 6.5, borderRadius: 1.5, backgroundColor: color }} />
      </View>
    </View>
  );
}

function BoutiqueBagIcon({ color }: { color: string }) {
  return (
    <View style={{ width: 18, height: 19, alignItems: 'center', justifyContent: 'flex-end' }}>
      <View
        style={{
          width: 8,
          height: 5,
          borderTopLeftRadius: 4,
          borderTopRightRadius: 4,
          borderWidth: 1.7,
          borderBottomWidth: 0,
          borderColor: color,
          marginBottom: -1,
        }}
      />
      <View
        style={{
          width: 14,
          height: 12,
          borderRadius: 2.5,
          borderWidth: 1.7,
          borderColor: color,
        }}
      />
    </View>
  );
}

function TibebStrip() {
  return (
    <View style={styles.tibebStrip}>
      <View style={[styles.tibebSegment, { backgroundColor: COLORS.terracotta, flex: 2 }]} />
      <View style={[styles.tibebSegment, { backgroundColor: COLORS.gold, flex: 1 }]} />
      <View style={[styles.tibebSegment, { backgroundColor: COLORS.ivory, flex: 1 }]} />
      <View style={[styles.tibebSegment, { backgroundColor: COLORS.terracotta, flex: 2 }]} />
      <View style={[styles.tibebSegment, { backgroundColor: COLORS.gold, flex: 1 }]} />
    </View>
  );
}

const SCREEN_WIDTH = Dimensions.get('window').width;
const GALLERY_WIDTH = SCREEN_WIDTH - 36;
const TOP_INSET = Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 44;

function ZoomablePhoto({
  source,
  resizeMode,
  onZoomChange,
}: {
  source: any;
  resizeMode: 'contain' | 'cover';
  onZoomChange?: (zoomed: boolean) => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const currentScale = useRef(1);
  const startScale = useRef(1);
  const currentPan = useRef({ x: 0, y: 0 });
  const startPan = useRef({ x: 0, y: 0 });
  const [isZoomed, setIsZoomed] = useState(false);

  const clampPan = (x: number, y: number, s: number) => {
    const maxX = Math.max(0, ((s - 1) * GALLERY_WIDTH) / 2);
    const maxY = Math.max(0, ((s - 1) * 310) / 2);
    return {
      x: Math.min(maxX, Math.max(-maxX, x)),
      y: Math.min(maxY, Math.max(-maxY, y)),
    };
  };

  const updateZoomState = (zoomed: boolean) => {
    setIsZoomed(zoomed);
    onZoomChange?.(zoomed);
  };

  const resetZoom = () => {
    currentScale.current = 1;
    startScale.current = 1;
    currentPan.current = { x: 0, y: 0 };
    startPan.current = { x: 0, y: 0 };
    updateZoomState(false);
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, useNativeDriver: true }),
      Animated.spring(translateX, { toValue: 0, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true }),
    ]).start();
  };

  const toggleDoubleTapZoom = () => {
    if (currentScale.current > 1.1) {
      resetZoom();
    } else {
      currentScale.current = 2.2;
      startScale.current = 2.2;
      updateZoomState(true);
      Animated.spring(scale, { toValue: 2.2, useNativeDriver: true }).start();
    }
  };

  const pinchGesture = useMemo(
    () =>
      Gesture.Pinch()
        .runOnJS(true)
        .onBegin(() => {
          startScale.current = currentScale.current;
        })
        .onUpdate((event) => {
          const nextScale = Math.min(3.5, Math.max(1, startScale.current * event.scale));
          currentScale.current = nextScale;
          scale.setValue(nextScale);
          const clamped = clampPan(currentPan.current.x, currentPan.current.y, nextScale);
          currentPan.current = clamped;
          translateX.setValue(clamped.x);
          translateY.setValue(clamped.y);
          updateZoomState(nextScale > 1.05);
        })
        .onEnd(() => {
          startScale.current = currentScale.current;
          if (currentScale.current <= 1.05) {
            resetZoom();
          }
        }),
    [scale, translateX, translateY],
  );

  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .runOnJS(true)
        .enabled(isZoomed)
        .maxPointers(1)
        .onBegin(() => {
          startPan.current = { ...currentPan.current };
        })
        .onUpdate((event) => {
          if (currentScale.current <= 1.05) return;
          const clamped = clampPan(
            startPan.current.x + event.translationX,
            startPan.current.y + event.translationY,
            currentScale.current,
          );
          currentPan.current = clamped;
          translateX.setValue(clamped.x);
          translateY.setValue(clamped.y);
        })
        .onEnd(() => {
          startPan.current = { ...currentPan.current };
        }),
    [isZoomed, translateX, translateY],
  );

  const doubleTapGesture = useMemo(
    () =>
      Gesture.Tap()
        .numberOfTaps(2)
        .runOnJS(true)
        .onEnd(() => {
          toggleDoubleTapZoom();
        }),
    [],
  );

  const composedGesture = useMemo(
    () => Gesture.Simultaneous(pinchGesture, panGesture, doubleTapGesture),
    [pinchGesture, panGesture, doubleTapGesture],
  );

  return (
    <View style={styles.zoomWrapper}>
      <GestureDetector gesture={composedGesture}>
        <View style={styles.zoomTouchArea} collapsable={false}>
          <Animated.Image
            source={resolveImageSource(source)}
            style={[
              styles.detailRealPhoto,
              {
                transform: [{ translateX }, { translateY }, { scale }],
              },
            ]}
            resizeMode={resizeMode}
          />
        </View>
      </GestureDetector>
      {isZoomed ? (
        <TouchableOpacity style={styles.resetZoomButton} onPress={resetZoom}>
          <Text style={styles.resetZoomText}>Reset 1×</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.zoomHintBadge}>
          <Text style={styles.zoomHintText}>Pinch or 2× tap to zoom & drag</Text>
        </View>
      )}
    </View>
  );
}

export default function App() {
  const [language, setLanguage] = useState<Language>('en');
  const [activeTab, setActiveTab] = useState<CustomerTab>('shop');
  const [department, setDepartment] = useState<Department>('All');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('All');
  const [query, setQuery] = useState('');

  const [showFilters, setShowFilters] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [showPromoBanner, setShowPromoBanner] = useState(true);
  const [colorFilter, setColorFilter] = useState<string>('All');
  const [sizeFilter, setSizeFilter] = useState<string>('All');
  const [priceBand, setPriceBand] = useState<PriceBand>('all');
  const [sortBy, setSortBy] = useState<SortOption>('featured');

  const [products, setProducts] = useState<Product[]>(DEFAULT_PRODUCTS);
  const [categories, setCategories] = useState<StoreCategory[]>(DEFAULT_CATEGORIES);
  const [promos, setPromos] = useState<PromoCode[]>(DEFAULT_PROMO_CODES);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [recentlyViewedIds, setRecentlyViewedIds] = useState<string[]>([]);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [quickAddProduct, setQuickAddProduct] = useState<Product | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [showStaff, setShowStaff] = useState(false);
  const [staffSection, setStaffSection] = useState<StaffSection>('catalog');
  const [showOrderRequest, setShowOrderRequest] = useState(false);
  const [orders, setOrders] = useState<StoreOrder[]>([]);
  const [trackingOrder, setTrackingOrder] = useState<StoreOrder | null>(null);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [telegramCandidates, setTelegramCandidates] = useState<TelegramCandidate[]>(
    TELEGRAM_PREVIEW_CANDIDATES,
  );
  const [candidateFilter, setCandidateFilter] = useState<CandidateFilter>('pending');
  const [draftSourceId, setDraftSourceId] = useState<string | null>(null);
  const [apiBaseUrl, setApiBaseUrl] = useState<string>(DEFAULT_API_BASE);
  const [expandedExpoProducts, setExpandedExpoProducts] = useState<Record<string, boolean>>({});
  const [expandedExpoSizes, setExpandedExpoSizes] = useState<Record<string, boolean>>({});
  const [addExpoColorInputs, setAddExpoColorInputs] = useState<
    Record<string, { color: string; stock: string }>
  >({});
  const [showAddExpoSizeForProduct, setShowAddExpoSizeForProduct] = useState<string | null>(null);
  const [newExpoSizeName, setNewExpoSizeName] = useState('');
  const [newExpoSizeColor, setNewExpoSizeColor] = useState('');
  const [newExpoSizeStock, setNewExpoSizeStock] = useState('1');

  // Stock filter, Edit Product & Promo Builder states
  const [stockQuery, setStockQuery] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [newPromoCode, setNewPromoCode] = useState('');
  const [newPromoType, setNewPromoType] = useState<'percent' | 'fixed'>('percent');
  const [newPromoValue, setNewPromoValue] = useState('');
  const [newPromoMin, setNewPromoMin] = useState('');

  // Hero Carousel, Card Color Preview & PDP Zoom Pan Lock
  const [heroSlideIndex, setHeroSlideIndex] = useState(0);
  const [cardPreviewColors, setCardPreviewColors] = useState<Record<string, string>>({});
  const [isImageZoomed, setIsImageZoomed] = useState(false);

  // Role-Based Auth, Editable Branch Directory & Customer Support
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [hasOwnerSetup, setHasOwnerSetup] = useState<boolean>(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup' | 'claim-owner'>('signin');
  const [authName, setAuthName] = useState('');
  const [authIdentifier, setAuthIdentifier] = useState('');
  const [authPhone, setAuthPhone] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authOwnerPin, setAuthOwnerPin] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSubmitting, setAuthSubmitting] = useState(false);

  const [branches, setBranches] = useState<Record<BranchDepartment, BranchInfo>>(DEFAULT_BRANCHES);
  const [supportMessages, setSupportMessages] = useState<SupportMessage[]>([]);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [supportTopic, setSupportTopic] = useState('Order & Payment');
  const [supportOrderId, setSupportOrderId] = useState('');
  const [supportMessageText, setSupportMessageText] = useState('');
  const [supportFeedback, setSupportFeedback] = useState<string | null>(null);

  // Studio Category Filter + Matrix Variant Builder + Owner Admin
  const [catViewDept, setCatViewDept] = useState<Department>('All');
  const [matrixPreset, setMatrixPreset] = useState<keyof typeof SIZE_PRESETS>('apparel');
  const [matrixSelectedColor, setMatrixSelectedColor] = useState('');
  const [matrixCustomColor, setMatrixCustomColor] = useState('');
  const [matrixPickedSizes, setMatrixPickedSizes] = useState<string[]>([]);
  const [matrixQtyInput, setMatrixQtyInput] = useState('5');
  const [uploadMatrix, setUploadMatrix] = useState<MatrixRow[]>([]);

  const [staffAccounts, setStaffAccounts] = useState<AuthUser[]>([]);
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffIdentifier, setNewStaffIdentifier] = useState('');
  const [newStaffPhone, setNewStaffPhone] = useState('');
  const [newStaffPassword, setNewStaffPassword] = useState('');
  const [newStaffRole, setNewStaffRole] = useState<UserRole>('merchant');
  const [newStaffBranch, setNewStaffBranch] = useState<Department>('All');
  const [editingBranchDept, setEditingBranchDept] = useState<BranchDepartment>('Women');
  const [adminFeedback, setAdminFeedback] = useState<string | null>(null);

  const mainScrollRef = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const staffScrollRef = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const galleryScrollRef = useRef<React.ComponentRef<typeof ScrollView>>(null);

  const [storageReady, setStorageReady] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [customFitNote, setCustomFitNote] = useState('');
  const [pdpQty, setPdpQty] = useState(1);
  const [pdpTab, setPdpTab] = useState<'overview' | 'size-guide' | 'reviews'>('overview');
  const [sizeUnit, setSizeUnit] = useState<'cm' | 'in'>('cm');
  const [reviewFilter, setReviewFilter] = useState<'all' | 'true-to-size' | 'runs-small' | 'runs-large'>('all');
  const [reviewAuthor, setReviewAuthor] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewFit, setReviewFit] = useState<'runs-small' | 'true-to-size' | 'runs-large'>('true-to-size');
  const [reviewComment, setReviewComment] = useState('');

  // Customer Camera Visual Search Modal
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [visualPreviewUri, setVisualPreviewUri] = useState<string | null>(null);
  const [visualLoading, setVisualLoading] = useState(false);
  const [visualError, setVisualError] = useState<string | null>(null);
  const [visualResult, setVisualResult] = useState<VisualSearchResult | null>(null);

  // Staff Upload & AI State
  const [uploadedPhotoUris, setUploadedPhotoUris] = useState<string[]>([]);
  const [uploadedBase64Images, setUploadedBase64Images] = useState<string[]>([]);
  const [perImageColors, setPerImageColors] = useState<string[]>([]);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [batchAiAnalyzing, setBatchAiAnalyzing] = useState(false);
  const [aiStatusMsg, setAiStatusMsg] = useState<string | null>(null);
  const [serverTestMsg, setServerTestMsg] = useState<string | null>(null);
  const [detectedSwatches, setDetectedSwatches] = useState<ColorSwatch[]>([]);
  const [newName, setNewName] = useState('');
  const [newNameAm, setNewNameAm] = useState('');
  const [newBrand, setNewBrand] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newDepartment, setNewDepartment] = useState<Exclude<Department, 'All'>>('Women');
  const [newCategory, setNewCategory] = useState('Dresses & Kemis');
  const [newSubcategory, setNewSubcategory] = useState('');
  const [newSizes, setNewSizes] = useState('');
  const [newColors, setNewColors] = useState('');
  const [newInitialStock, setNewInitialStock] = useState('');
  const [newFabric, setNewFabric] = useState('');
  const [newSizeGuidance, setNewSizeGuidance] = useState('');
  const [newSizeGuidanceAm, setNewSizeGuidanceAm] = useState('');
  const [newCustomizable, setNewCustomizable] = useState(false);

  // Staff Category Builder
  const [catName, setCatName] = useState('');
  const [catNameAm, setCatNameAm] = useState('');
  const [catDepartment, setCatDepartment] = useState<Department>('All');
  const [catSubcategories, setCatSubcategories] = useState('');

  // Checkout + Promo + Payment Proof + Delivery Provider & Subcity State
  const [customerProfile, setCustomerProfile] = useState<CustomerProfile | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [fulfillment, setFulfillment] = useState<'pickup' | 'delivery'>('pickup');
  const [deliveryProvider, setDeliveryProvider] = useState<DeliveryProvider>('mela');
  const [deliveryCity, setDeliveryCity] = useState('Addis Ababa');
  const [customCityInput, setCustomCityInput] = useState('');
  const [deliverySubcity, setDeliverySubcity] = useState('Bole Subcity');
  const [gpsLoading, setGpsLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cod');
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentProofImage, setPaymentProofImage] = useState<string | undefined>(undefined);
  const [promoInput, setPromoInput] = useState('');
  const [appliedPromoCode, setAppliedPromoCode] = useState<string | null>(null);
  const [promoFeedback, setPromoFeedback] = useState<string | null>(null);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryLandmark, setDeliveryLandmark] = useState('');
  const [deliveryCoords, setDeliveryCoords] = useState<DeliveryCoordinates | undefined>(undefined);
  const [deliveryZone, setDeliveryZone] = useState<string | undefined>(undefined);
  const [deliveryDistanceKm, setDeliveryDistanceKm] = useState<number | undefined>(undefined);
  const [estimatedDeliveryFee, setEstimatedDeliveryFee] = useState<number>(140);

  const t = COPY[language];
  const isStaffUser = currentUser?.role === 'merchant' || currentUser?.role === 'owner';

  useEffect(() => {
    let active = true;
    const loadSavedStore = async () => {
      try {
        const entries = await AsyncStorage.multiGet(Object.values(STORAGE_KEYS));
        const saved = new Map(entries);
        const savedProducts = saved.get(STORAGE_KEYS.products);
        const savedCategories = saved.get(STORAGE_KEYS.categories);
        const savedCart = saved.get(STORAGE_KEYS.cart);
        const savedFavorites = saved.get(STORAGE_KEYS.favorites);
        const savedRecent = saved.get(STORAGE_KEYS.recentlyViewed);
        const savedOrders = saved.get(STORAGE_KEYS.orders);
        const savedMovements = saved.get(STORAGE_KEYS.movements);
        const savedPromos = saved.get(STORAGE_KEYS.promos);
        const savedProfile = saved.get(STORAGE_KEYS.profile);
        const savedTelegramCandidates = saved.get(STORAGE_KEYS.telegramCandidates);
        const savedBranches = saved.get(STORAGE_KEYS.branches);
        const savedSupport = saved.get(STORAGE_KEYS.supportMessages);
        const savedApiBase = saved.get(STORAGE_KEYS.apiBaseUrl);

        if (savedProducts) {
          const parsed = JSON.parse(savedProducts);
          if (Array.isArray(parsed)) {
            setProducts(
              parsed.map((item: Product) => {
                const defaultMatch = DEFAULT_PRODUCTS.find((d) => d.id === item.id);
                return {
                  ...defaultMatch,
                  ...item,
                  category: item.category || defaultMatch?.category || 'Dresses & Kemis',
                  images: defaultMatch?.images ?? item.images,
                  variants: item.variants?.length ? item.variants : defaultMatch?.variants,
                };
              }),
            );
          }
        }
        if (savedCategories) {
          const parsed = JSON.parse(savedCategories);
          if (Array.isArray(parsed) && parsed.length > 0) setCategories(parsed);
        }
        if (savedCart) {
          const parsed = JSON.parse(savedCart);
          if (Array.isArray(parsed)) setCartItems(parsed);
        }
        if (savedFavorites) {
          const parsed = JSON.parse(savedFavorites);
          if (Array.isArray(parsed)) setFavorites(parsed);
        }
        if (savedRecent) {
          const parsed = JSON.parse(savedRecent);
          if (Array.isArray(parsed)) setRecentlyViewedIds(parsed);
        }
        if (savedOrders) {
          const parsed = JSON.parse(savedOrders);
          if (Array.isArray(parsed)) setOrders(parsed);
        }
        if (savedMovements) {
          const parsed = JSON.parse(savedMovements);
          if (Array.isArray(parsed)) setMovements(parsed);
        }
        if (savedPromos) {
          const parsed = JSON.parse(savedPromos);
          if (Array.isArray(parsed) && parsed.length > 0) setPromos(parsed);
        }
        if (savedProfile) {
          const parsed = JSON.parse(savedProfile) as CustomerProfile;
          if (parsed && typeof parsed === 'object') {
            setCustomerProfile(parsed);
            if (parsed.name) setCustomerName(parsed.name);
            if (parsed.phone) setCustomerPhone(parsed.phone);
            if (parsed.preferredCity) setDeliveryCity(parsed.preferredCity);
            if (parsed.preferredSubcity) setDeliverySubcity(parsed.preferredSubcity);
            if (parsed.preferredAddress) setDeliveryAddress(parsed.preferredAddress);
            if (parsed.preferredLandmark) setDeliveryLandmark(parsed.preferredLandmark);
            if (parsed.preferredZone) setDeliveryZone(parsed.preferredZone);
          }
        }
        if (savedBranches) {
          const parsed = JSON.parse(savedBranches);
          if (parsed && parsed.Women && parsed.Men && parsed.Kids) {
            setBranches(parsed);
          }
        }
        if (savedSupport) {
          const parsed = JSON.parse(savedSupport);
          if (Array.isArray(parsed)) setSupportMessages(parsed);
        }
        if (savedTelegramCandidates) {
          const parsed = JSON.parse(savedTelegramCandidates);
          if (Array.isArray(parsed)) setTelegramCandidates(parsed);
        }
        if (savedApiBase && savedApiBase.trim()) {
          const cleaned = savedApiBase.trim();
          setApiBaseUrl(cleaned === DEV_API_BASE ? SHARED_API_BASE : cleaned);
        }
      } catch (error) {
        console.warn('Could not load Belika local data', error);
      } finally {
        if (active) setStorageReady(true);
      }
    };
    void loadSavedStore();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!storageReady) return;
    const timer = setTimeout(() => setShowSplash(false), 1500);
    return () => clearTimeout(timer);
  }, [storageReady]);

  useEffect(() => {
    const interval = setInterval(() => {
      setHeroSlideIndex((prev) => (prev + 1) % HERO_PROMO_SLIDES.length);
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const base = apiBaseUrl.replace(/\/+$/, '');
    fetch(`${base}/api/store/branches`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.branches?.Women) setBranches(data.branches);
      })
      .catch(() => {});
    fetch(`${base}/api/auth/status`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (typeof data?.hasOwner === 'boolean') setHasOwnerSetup(data.hasOwner);
      })
      .catch(() => {});
  }, [apiBaseUrl]);

  useEffect(() => {
    if (!storageReady) return;
    void AsyncStorage.multiSet([
      [STORAGE_KEYS.products, JSON.stringify(products)],
      [STORAGE_KEYS.categories, JSON.stringify(categories)],
      [STORAGE_KEYS.cart, JSON.stringify(cartItems)],
      [STORAGE_KEYS.favorites, JSON.stringify(favorites)],
      [STORAGE_KEYS.recentlyViewed, JSON.stringify(recentlyViewedIds)],
      [STORAGE_KEYS.orders, JSON.stringify(orders)],
      [STORAGE_KEYS.movements, JSON.stringify(movements)],
      [STORAGE_KEYS.promos, JSON.stringify(promos)],
      [STORAGE_KEYS.profile, JSON.stringify(customerProfile || {})],
      [STORAGE_KEYS.branches, JSON.stringify(branches)],
      [STORAGE_KEYS.supportMessages, JSON.stringify(supportMessages)],
      [STORAGE_KEYS.telegramCandidates, JSON.stringify(telegramCandidates)],
      [STORAGE_KEYS.apiBaseUrl, apiBaseUrl],
    ]).catch((error) => console.warn('Could not save Belika local data', error));
  }, [
    storageReady,
    products,
    categories,
    cartItems,
    favorites,
    recentlyViewedIds,
    orders,
    movements,
    promos,
    customerProfile,
    branches,
    supportMessages,
    telegramCandidates,
    apiBaseUrl,
  ]);

  const cartCount = useMemo(
    () => cartItems.reduce((count, item) => count + item.quantity, 0),
    [cartItems],
  );

  const cartSubtotal = useMemo(
    () =>
      cartItems.reduce((total, item) => {
        const product = products.find((candidate) => candidate.id === item.productId);
        return total + (product?.price ?? 0) * item.quantity;
      }, 0),
    [cartItems, products],
  );

  const activePromo = useMemo(
    () =>
      appliedPromoCode
        ? promos.find((p) => p.code.toUpperCase() === appliedPromoCode.toUpperCase() && p.active)
        : undefined,
    [appliedPromoCode, promos],
  );

  const promoDiscountAmount = useMemo(() => {
    if (!activePromo) return 0;
    if (activePromo.minSubtotal && cartSubtotal < activePromo.minSubtotal) return 0;
    return activePromo.type === 'percent'
      ? Math.round((cartSubtotal * activePromo.value) / 100)
      : Math.min(cartSubtotal, activePromo.value);
  }, [activePromo, cartSubtotal]);

  const qualifiesForFreeDelivery = cartSubtotal >= FREE_DELIVERY_THRESHOLD;
  const effectiveDeliveryFee =
    fulfillment === 'delivery' ? (qualifiesForFreeDelivery ? 0 : estimatedDeliveryFee) : 0;
  const orderTotal = Math.max(0, cartSubtotal - promoDiscountAmount + effectiveDeliveryFee);

  const compareProducts = useMemo(
    () =>
      compareIds
        .map((id) => products.find((p) => p.id === id))
        .filter((p): p is Product => Boolean(p))
        .slice(0, 2),
    [compareIds, products],
  );

  const merchantMetrics = useMemo(() => {
    const activeRevenue = orders
      .filter((o) => o.status !== 'cancelled')
      .reduce((sum, o) => sum + o.total, 0);
    const openOrders = orders.filter((o) =>
      o.status === 'requested' || o.status === 'confirmed' || o.status === 'out-for-delivery',
    ).length;
    const lowStockVariants = products.reduce(
      (sum, p) => sum + (p.variants ?? []).filter((v) => v.stock <= 2).length,
      0,
    );
    const publishedCount = products.filter((p) => p.status !== 'draft').length;
    return { activeRevenue, openOrders, lowStockVariants, publishedCount };
  }, [orders, products]);

  const filteredStockProducts = useMemo(() => {
    const q = stockQuery.trim().toLowerCase();
    return products.filter((p) => {
      const matchesQ =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.nameAm.includes(stockQuery.trim()) ||
        (p.brand ?? '').toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q);
      const hasLow = (p.variants ?? []).some((v) => v.stock <= 2);
      return matchesQ && (!lowStockOnly || hasLow);
    });
  }, [products, stockQuery, lowStockOnly]);

  const publishedProducts = useMemo(
    () => products.filter((product) => product.status !== 'draft'),
    [products],
  );

  const flashDrops = useMemo(
    () => publishedProducts.filter((p) => (p.compareAtPrice && p.compareAtPrice > p.price) || p.badge === 'Flash Drop'),
    [publishedProducts],
  );

  const recentlyViewedProducts = useMemo(
    () =>
      recentlyViewedIds
        .map((id) => publishedProducts.find((p) => p.id === id))
        .filter((p): p is Product => Boolean(p))
        .slice(0, 4),
    [recentlyViewedIds, publishedProducts],
  );

  const visibleCategories = useMemo(
    () =>
      categories.filter(
        (cat) => department === 'All' || cat.department === 'All' || cat.department === department,
      ),
    [categories, department],
  );

  const activeCategoryObj = useMemo(
    () => categories.find((c) => c.name === selectedCategory),
    [categories, selectedCategory],
  );

  const availableColors = useMemo(() => {
    const seen: Record<string, string> = {};
    for (const p of publishedProducts) {
      for (const sw of p.colorSwatches ?? []) {
        if (!seen[sw.name]) seen[sw.name] = sw.hex;
      }
      for (const v of p.variants ?? []) {
        if (v.color && v.color !== 'Unspecified' && !seen[v.color]) {
          seen[v.color] = colorSwatchHex(v.color);
        }
      }
    }
    return Object.entries(seen).map(([name, hex]) => ({ name, hex }));
  }, [publishedProducts]);

  const availableSizes = useMemo(
    () => getContextualSizes(products, department, selectedCategory, selectedSubcategory, query),
    [products, department, selectedCategory, selectedSubcategory, query],
  );

  useEffect(() => {
    if (sizeFilter !== 'All' && !availableSizes.includes(sizeFilter)) {
      setSizeFilter('All');
    }
  }, [availableSizes, sizeFilter]);

  const activeFilterCount =
    (selectedCategory !== 'All' ? 1 : 0) +
    (selectedSubcategory !== 'All' ? 1 : 0) +
    (colorFilter !== 'All' ? 1 : 0) +
    (sizeFilter !== 'All' ? 1 : 0) +
    (priceBand !== 'all' ? 1 : 0) +
    (sortBy !== 'featured' ? 1 : 0);

  const results = useMemo(() => {
    const search = query.trim().toLowerCase();
    const filtered = publishedProducts.filter((product) => {
      const inDepartment = department === 'All' || product.department === department;
      const inCategory =
        selectedCategory === 'All' ||
        product.category.toLowerCase() === selectedCategory.toLowerCase();
      const inSubcategory =
        selectedSubcategory === 'All' ||
        (product.subcategory ?? '').toLowerCase() === selectedSubcategory.toLowerCase();
      const matchesSearch =
        !search ||
        product.name.toLowerCase().includes(search) ||
        product.nameAm.includes(query.trim()) ||
        product.category.toLowerCase().includes(search) ||
        (product.styleTags ?? []).some((tag) => tag.toLowerCase().includes(search));
      const matchesColor =
        colorFilter === 'All' ||
        (product.colorSwatches ?? []).some((sw) =>
          sw.name.toLowerCase().includes(colorFilter.toLowerCase()),
        ) ||
        (product.variants ?? []).some((v) =>
          v.color.toLowerCase().includes(colorFilter.toLowerCase()),
        );
      const matchesSize =
        sizeFilter === 'All' ||
        (product.variants ?? []).some(
          (v) => v.size.toLowerCase() === sizeFilter.toLowerCase() && v.stock > 0,
        );
      const matchesPrice =
        priceBand === 'all' ||
        (priceBand === 'under-2500' && product.price < 2500) ||
        (priceBand === '2500-5000' && product.price >= 2500 && product.price <= 5000) ||
        (priceBand === 'over-5000' && product.price > 5000);
      const isSaved = activeTab !== 'wishlist' || favorites.includes(product.id);
      return (
        inDepartment &&
        inCategory &&
        inSubcategory &&
        matchesSearch &&
        matchesColor &&
        matchesSize &&
        matchesPrice &&
        isSaved
      );
    });

    const sorted = [...filtered];
    if (sortBy === 'price-asc') sorted.sort((a, b) => a.price - b.price);
    else if (sortBy === 'price-desc') sorted.sort((a, b) => b.price - a.price);
    else if (sortBy === 'rating') sorted.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    else if (sortBy === 'bestselling') sorted.sort((a, b) => (b.soldCount ?? 0) - (a.soldCount ?? 0));
    return sorted;
  }, [
    publishedProducts,
    department,
    selectedCategory,
    selectedSubcategory,
    query,
    colorFilter,
    sizeFilter,
    priceBand,
    sortBy,
    activeTab,
    favorites,
  ]);

  const searchSuggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 1) return { categories: [], brands: [], products: [] };
    const cats = categories
      .filter((c) => c.name.toLowerCase().includes(q) || c.nameAm.toLowerCase().includes(q))
      .map((c) => c.name)
      .slice(0, 4);
    const brandsSet = new Set<string>();
    for (const p of publishedProducts) {
      if (p.brand && p.brand.toLowerCase().includes(q)) {
        brandsSet.add(p.brand);
      }
    }
    const brands = Array.from(brandsSet).slice(0, 4);
    const prods = publishedProducts
      .filter((p) => p.name.toLowerCase().includes(q) || p.nameAm.toLowerCase().includes(q))
      .map((p) => (language === 'en' ? p.name : p.nameAm))
      .slice(0, 4);
    return { categories: cats, brands, products: prods };
  }, [query, categories, publishedProducts, language]);

  const hasSearchSuggestions =
    query.trim().length > 0 &&
    (searchSuggestions.categories.length > 0 ||
      searchSuggestions.brands.length > 0 ||
      searchSuggestions.products.length > 0);

  const filteredTelegramCandidates = useMemo(() => {
    if (candidateFilter === 'all') return telegramCandidates;
    if (candidateFilter === 'matches') {
      return telegramCandidates.filter((item) => item.kind === 'possible-duplicate');
    }
    if (candidateFilter === 'restocks') {
      return telegramCandidates.filter((item) => item.kind === 'restock');
    }
    return telegramCandidates.filter(
      (item) => !item.status || item.status === 'pending' || item.status === 'prepared',
    );
  }, [telegramCandidates, candidateFilter]);

  const pendingTelegramCount = telegramCandidates.filter(
    (item) => !item.status || item.status === 'pending' || item.status === 'prepared',
  ).length;

  const updateTelegramCandidate = (id: string, status: CandidateStatus) => {
    setTelegramCandidates((current) =>
      current.map((item) => (item.id === id ? { ...item, status } : item)),
    );
  };

  const updateTelegramGroup = (groupId: string, status: CandidateStatus) => {
    setTelegramCandidates((current) =>
      current.map((item) => (item.groupId === groupId ? { ...item, status } : item)),
    );
  };

  const openExternalUrl = async (url: string, label: string) => {
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert(label, 'Could not open this link on your device.');
    }
  };

  const formSizesFromPost = (sizeSpec: string) => {
    const normalized = sizeSpec.trim().replace(/[–—]/g, '-');
    const numericRange = normalized.match(/^(\d+)\s*-\s*(\d+)$/);
    if (numericRange) {
      const start = Number(numericRange[1]);
      const end = Number(numericRange[2]);
      if (end >= start && end - start <= 20) {
        return Array.from({ length: end - start + 1 }, (_, index) => String(start + index)).join(', ');
      }
    }
    if (/^M-XXL$/i.test(normalized)) return 'M, L, XL, XXL';
    if (/^M-(3XL|XXXL)$/i.test(normalized)) return 'M, L, XL, XXL, 3XL';
    if (/^L-XXL$/i.test(normalized)) return 'L, XL, XXL';
    if (/free size/i.test(normalized)) return 'Free size';
    if (/not stated|available|plus size/i.test(normalized)) return '';
    return sizeSpec;
  };

  const prepareTelegramDraft = (candidate: TelegramCandidate) => {
    setNewName(candidate.name);
    setNewNameAm('');
    setNewPrice(String(candidate.price));
    setNewDepartment(candidate.department);
    setNewSizes(formSizesFromPost(candidate.sizeSpec) || 'Unspecified');
    setNewColors('Unspecified');
    setDraftSourceId(candidate.id);
    updateTelegramCandidate(candidate.id, 'prepared');
    setStaffSection('catalog');
    staffScrollRef.current?.scrollTo({ y: 0, animated: true });
    Alert.alert(
      language === 'en' ? 'Draft form filled' : 'የረቂቅ ቅጹ ተሞልቷል',
      language === 'en'
        ? 'Upload a photo to run AI color & category recognition, or save as draft.'
        : 'ቀለምና ምድብ በAI ለመለየት ፎቶ ይጫኑ ወይም እንደ ረቂቅ ያስቀምጡ።',
    );
  };

  const pickImageForVisualSearch = async (source: 'camera' | 'gallery') => {
    try {
      const perm =
        source === 'camera'
          ? await ImagePicker.requestCameraPermissionsAsync()
          : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permission needed', 'Allow camera or photo access to use visual search.');
        return;
      }

      const pickerResult =
        source === 'camera'
          ? await ImagePicker.launchCameraAsync({
              mediaTypes: ['images'],
              quality: 0.7,
              base64: true,
            })
          : await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ['images'],
              quality: 0.7,
              base64: true,
            });

      if (pickerResult.canceled || !pickerResult.assets?.[0]) return;
      const asset = pickerResult.assets[0];
      if (!asset.base64) {
        setVisualError('Could not read image data from selected photo.');
        return;
      }

      setVisualPreviewUri(asset.uri);
      setVisualLoading(true);
      setVisualError(null);
      setVisualResult(null);

      const base = apiBaseUrl.replace(/\/+$/, '');
      const data = await safeFetchJson<VisualSearchResult>(`${base}/api/ai/visual-search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: asset.base64,
          mimeType: asset.mimeType || 'image/jpeg',
          catalog: publishedProducts.map((p) => ({
            id: p.id,
            name: p.name,
            nameAm: p.nameAm,
            department: p.department,
            category: p.category,
            subcategory: p.subcategory ?? '',
            colors: (p.colorSwatches ?? []).map((c) => c.name).concat(p.imageLabels ?? []),
            styleTags: p.styleTags ?? [],
            price: p.price,
          })),
        }),
      });
      setVisualResult(data);
    } catch (err) {
      setVisualError(err instanceof Error ? err.message : 'Could not run AI visual search.');
    } finally {
      setVisualLoading(false);
    }
  };

  const pickImageForStaffUpload = async (source: 'camera' | 'gallery') => {
    try {
      const perm =
        source === 'camera'
          ? await ImagePicker.requestCameraPermissionsAsync()
          : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permission needed', 'Allow camera or photo library access.');
        return;
      }

      const pickerResult =
        source === 'camera'
          ? await ImagePicker.launchCameraAsync({
              mediaTypes: ['images'],
              quality: 0.55,
              base64: true,
            })
          : await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ['images'],
              allowsMultipleSelection: true,
              selectionLimit: 8,
              quality: 0.55,
              base64: true,
            });

      if (pickerResult.canceled || !pickerResult.assets?.length) return;

      const addedUris: string[] = [];
      const addedBase64s: string[] = [];
      for (const asset of pickerResult.assets) {
        const mime = asset.mimeType || 'image/jpeg';
        if (asset.base64) {
          const dataUri = `data:${mime};base64,${asset.base64}`;
          addedUris.push(dataUri);
          addedBase64s.push(dataUri);
        } else if (asset.uri) {
          addedUris.push(asset.uri);
        }
      }

      const nextUris = [...uploadedPhotoUris, ...addedUris].slice(0, 8);
      const nextBase64s = [...uploadedBase64Images, ...addedBase64s].slice(0, 8);
      setUploadedPhotoUris(nextUris);
      setUploadedBase64Images(nextBase64s);
      setPerImageColors([]);
      if (nextBase64s.length > 0) {
        void runAiRecognizeUpload(nextBase64s, true);
      }
    } catch {
      Alert.alert('Photo error', 'Could not select image.');
    }
  };

  const removeUploadedPhotoAt = (index: number) => {
    setUploadedPhotoUris((prev) => prev.filter((_, i) => i !== index));
    setUploadedBase64Images((prev) => prev.filter((_, i) => i !== index));
    setPerImageColors((prev) => prev.filter((_, i) => i !== index));
  };

  const runAiRecognizeUpload = async (overrideImages?: string[], silentErrors = false) => {
    const targetImages = overrideImages ?? uploadedBase64Images;
    if (targetImages.length === 0) {
      Alert.alert('Photo required', 'Take or choose at least one garment photo first.');
      return;
    }
    setAiAnalyzing(true);
    setAiStatusMsg(
      language === 'en'
        ? 'AI analyzing product, brand, material, colors & category…'
        : 'AI ምርቱን፣ ብራንዱን፣ ጨርቁንና ቀለሞቹን በመለየት ላይ ነው…',
    );
    try {
      const base = apiBaseUrl.replace(/\/+$/, '');
      const data = await safeFetchJson<any>(`${base}/api/ai/analyze-garment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          images: targetImages,
          existingCategories: categories.map((c) => c.name),
        }),
      });

      setNewName(data.name || '');
      setNewNameAm(data.nameAm || '');
      setNewBrand(data.brand || '');
      if (data.department === 'Men' || data.department === 'Women' || data.department === 'Kids') {
        setNewDepartment(data.department);
      }
      if (data.category) {
        const matchedCat = categories.find(
          (c) => c.name.toLowerCase() === String(data.category).toLowerCase(),
        );
        if (matchedCat) {
          setNewCategory(matchedCat.name);
        } else {
          setNewCategory(String(data.category));
          setCategories((prev) => [
            ...prev,
            {
              id: `cat-${Date.now()}`,
              name: String(data.category),
              nameAm: String(data.category),
              department: data.department || 'All',
              subcategories: data.subcategory ? [String(data.subcategory)] : [],
              accentColor: COLORS.forest,
              isCustom: true,
            },
          ]);
        }
      }
      setNewSubcategory(data.subcategory || '');
      if (Array.isArray(data.colors) && data.colors.length) {
        setDetectedSwatches(data.colors);
        setNewColors(data.colors.map((c: ColorSwatch) => c.name).join(', '));
      }
      if (Array.isArray(data.perImageColors) && data.perImageColors.length) {
        setPerImageColors(data.perImageColors);
      }
      setNewFabric(data.fabric || '');
      setNewSizeGuidance(data.sizeGuidance || '');
      setNewSizeGuidanceAm(data.sizeGuidanceAm || '');
      setNewCustomizable(Boolean(data.customizable));

      const summary =
        language === 'en'
          ? `AI detected "${data.name}"${data.brand ? ` (${data.brand})` : ''} · ${data.fabric || 'Material'} · ${data.department} → ${data.category}. Now enter Price, Sizes & Quantity manually.`
          : `AI "${data.nameAm || data.name}"${data.brand ? ` (${data.brand})` : ''} እና ${data.fabric || ''} ለይቷል። አሁን ዋጋ፣ መጠንና ብዛት ያስገቡ።`;
      setAiStatusMsg(summary);
      if (!silentErrors) {
        Alert.alert('AI Recognized', summary);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to analyze photo.';
      setAiStatusMsg(msg);
      if (!silentErrors) {
        Alert.alert('AI Error', msg);
      }
    } finally {
      setAiAnalyzing(false);
    }
  };

  const runBatchCreateSeparateProducts = async () => {
    if (uploadedBase64Images.length < 2) return;
    setBatchAiAnalyzing(true);
    try {
      const base = apiBaseUrl.replace(/\/+$/, '');
      const created: Product[] = [];
      for (let i = 0; i < uploadedBase64Images.length; i += 1) {
        const data = await safeFetchJson<any>(`${base}/api/ai/analyze-garment`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            images: [uploadedBase64Images[i]],
            existingCategories: categories.map((c) => c.name),
          }),
        });
        const sizeList: string[] =
          Array.isArray(data.recommendedSizes) && data.recommendedSizes.length
            ? data.recommendedSizes
            : ['M', 'L', 'XL'];
        const swatches: ColorSwatch[] = Array.isArray(data.colors) ? data.colors : [];
        const colorNames = swatches.length ? swatches.map((c) => c.name) : ['Classic'];
        const id = `item-${Date.now()}-${i}`;
        const variants = sizeList.flatMap((size, sIdx) =>
          colorNames.map((color, cIdx) => ({
            id: `${id}-v${sIdx}-${cIdx}`,
            size,
            color,
            stock: 4,
          })),
        );
        created.push({
          id,
          department:
            data.department === 'Men' || data.department === 'Women' || data.department === 'Kids'
              ? data.department
              : 'Women',
          category: data.category || 'Apparel',
          subcategory: data.subcategory || undefined,
          name: data.name || `Item ${i + 1}`,
          nameAm: data.nameAm || data.name || `እቃ ${i + 1}`,
          brand: data.brand || undefined,
          price: data.suggestedPriceEtb > 0 ? data.suggestedPriceEtb : 2500,
          badge: 'New',
          sizes: sizeList.length > 1 ? `${sizeList[0]}–${sizeList[sizeList.length - 1]}` : sizeList[0],
          sizeGuidance: data.sizeGuidance || undefined,
          sizeGuidanceAm: data.sizeGuidanceAm || undefined,
          fabric: data.fabric || undefined,
          colorSwatches: swatches,
          customizable: Boolean(data.customizable),
          rating: 5.0,
          reviewCount: 0,
          emoji: '🛍️',
          tint: swatches[0]?.hex ? `${swatches[0].hex}22` : '#EFEAE1',
          images: [uploadedPhotoUris[i] || uploadedBase64Images[i]],
          imageLabels: [data.perImageColors?.[0] || colorNames[0]],
          variants,
          status: 'published',
        });
      }

      if (created.length > 0) {
        setProducts((prev) => [...created.reverse(), ...prev]);
        setUploadedPhotoUris([]);
        setUploadedBase64Images([]);
        setPerImageColors([]);
        setDetectedSwatches([]);
        Alert.alert(
          language === 'en' ? 'Products Added' : 'ምርቶች ታክለዋል',
          language === 'en'
            ? `Created ${created.length} separate products from your selected photos.`
            : `${created.length} የተለያዩ ምርቶች ተፈጥረው ታትመዋል።`,
        );
      }
    } catch (err) {
      Alert.alert('Batch AI Error', err instanceof Error ? err.message : 'Batch analysis failed.');
    } finally {
      setBatchAiAnalyzing(false);
    }
  };

  const testServerConnection = async () => {
    setServerTestMsg(language === 'en' ? 'Checking server…' : 'በመፈተሽ ላይ…');
    try {
      const base = apiBaseUrl.replace(/\/+$/, '');
      const health = await safeFetchJson<{ ok?: boolean; aiConfigured?: boolean; mapsConfigured?: boolean }>(
        `${base}/api/health`,
      );
      setServerTestMsg(
        health.ok
          ? `Connected ✅ · AI: ${health.aiConfigured ? 'Ready' : 'No key'} · Maps: ${health.mapsConfigured ? 'Ready' : 'No key'}`
          : 'Server responded, but status was not OK.',
      );
    } catch (err) {
      setServerTestMsg(err instanceof Error ? err.message : 'Connection failed.');
    }
  };

  const selectAddisZone = async (hub: { label: string; labelAm: string; coords: DeliveryCoordinates }) => {
    const dist = computeDistanceKm(BELIKA_SHOP_COORDS, hub.coords);
    const fee = estimateAddisDeliveryFee(dist);
    const zoneLabel = language === 'en' ? hub.label : hub.labelAm;
    setDeliveryCoords(hub.coords);
    setDeliveryZone(zoneLabel);
    setDeliveryDistanceKm(dist);
    setEstimatedDeliveryFee(fee);
    setDeliveryAddress(`${zoneLabel}, Addis Ababa`);

    try {
      const base = apiBaseUrl.replace(/\/+$/, '');
      const res = await fetch(
        `${base}/api/maps/reverse-geocode?lat=${hub.coords.lat}&lng=${hub.coords.lng}&language=${language}`,
      );
      if (res.ok) {
        const data = await res.json();
        if (data?.formattedAddress) setDeliveryAddress(data.formattedAddress);
      }
    } catch {
      // Keep zone label fallback cleanly
    }
  };

  const selectAddisSubcity = (sub: (typeof ADDIS_SUBCITIES)[number]) => {
    const label = language === 'en' ? sub.en : sub.am;
    setDeliveryCity('Addis Ababa');
    setDeliverySubcity(label);
    setDeliveryZone(label);
    setDeliveryCoords(sub.coords);
    setDeliveryDistanceKm(computeDistanceKm(BELIKA_SHOP_COORDS, sub.coords));
    setEstimatedDeliveryFee(sub.feeEtb);
    if (!deliveryAddress.trim() || deliveryAddress.includes('Subcity') || deliveryAddress.includes('ክፍለ ከተማ')) {
      setDeliveryAddress(`${label}, Addis Ababa`);
    }
  };

  const selectRegionalCity = (city: (typeof ETHIOPIA_REGIONAL_CITIES)[number]) => {
    const label = language === 'en' ? city.en : city.am;
    setDeliveryCity(city.id === 'other-city' ? 'Other' : label);
    setDeliverySubcity('');
    setDeliveryZone(label);
    setDeliveryDistanceKm(undefined);
    setEstimatedDeliveryFee(city.feeEtb);
    setDeliveryProvider('regional-parcel');
    if (city.id !== 'other-city') setDeliveryAddress(`${label}, Ethiopia`);
  };

  const shareMyCurrentLocation = () => {
    const geo = (globalThis as any)?.navigator?.geolocation;
    if (!geo?.getCurrentPosition) {
      Alert.alert(
        language === 'en' ? 'Select Subcity or Maps Pin' : 'ክፍለ ከተማ ወይም ካርታ ይምረጡ',
        language === 'en'
          ? 'GPS is unavailable in this Expo runtime. Select your Addis subcity chip below or preview the pin in Google Maps.'
          : 'GPS በዚህ ስልክ አልተገኘም። ከታች ክፍለ ከተማዎን ይምረጡ ወይም Google Maps ይክፈቱ።',
      );
      return;
    }
    setGpsLoading(true);
    geo.getCurrentPosition(
      async (pos: any) => {
        const coords: DeliveryCoordinates = {
          lat: Number(pos.coords.latitude.toFixed(6)),
          lng: Number(pos.coords.longitude.toFixed(6)),
        };
        const dist = computeDistanceKm(BELIKA_SHOP_COORDS, coords);
        setDeliveryCoords(coords);
        setDeliveryDistanceKm(dist);
        setEstimatedDeliveryFee(estimateAddisDeliveryFee(dist));
        setDeliveryZone(`GPS (${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)})`);
        try {
          const base = apiBaseUrl.replace(/\/+$/, '');
          const res = await fetch(
            `${base}/api/maps/reverse-geocode?lat=${coords.lat}&lng=${coords.lng}&language=${language}`,
          );
          if (res.ok) {
            const data = await res.json();
            if (data?.formattedAddress) setDeliveryAddress(data.formattedAddress);
          } else {
            setDeliveryAddress(`GPS Pin: ${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`);
          }
        } catch {
          setDeliveryAddress(`GPS Pin: ${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`);
        } finally {
          setGpsLoading(false);
        }
      },
      () => {
        setGpsLoading(false);
        Alert.alert(
          language === 'en' ? 'GPS unavailable' : 'ቦታዎን ማግኘት አልተቻለም',
          language === 'en'
            ? 'Please enable Location Services or choose your Addis subcity below.'
            : 'እባክዎ Location ያብሩ ወይም ከታች ክፍለ ከተማዎን ይምረጡ።',
        );
      },
      { enableHighAccuracy: true, timeout: 8000 },
    );
  };

  const pickPaymentProofImage = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permission needed', 'Allow photo access to attach transfer proof.');
        return;
      }
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.5,
        base64: true,
      });
      if (res.canceled || !res.assets?.[0]) return;
      const asset = res.assets[0];
      if (asset.base64) {
        setPaymentProofImage(`data:${asset.mimeType || 'image/jpeg'};base64,${asset.base64}`);
      } else if (asset.uri) {
        setPaymentProofImage(asset.uri);
      }
    } catch {
      Alert.alert('Error', 'Could not attach payment proof screenshot.');
    }
  };

  const loadOwnerDirectory = async (token: string) => {
    try {
      const base = apiBaseUrl.replace(/\/+$/, '');
      const data = await safeFetchJson<{ users?: AuthUser[] }>(`${base}/api/admin/staff`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (Array.isArray(data.users)) setStaffAccounts(data.users);
    } catch {
      // ignore if offline
    }
    try {
      const base = apiBaseUrl.replace(/\/+$/, '');
      const sData = await safeFetchJson<{ messages?: SupportMessage[] }>(`${base}/api/support`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (Array.isArray(sData.messages)) setSupportMessages(sData.messages);
    } catch {
      // ignore
    }
  };

  const submitAuth = async () => {
    setAuthError(null);
    setAuthSubmitting(true);
    try {
      const base = apiBaseUrl.replace(/\/+$/, '');
      if (authMode === 'claim-owner') {
        const data = await safeFetchJson<{ token: string; user: AuthUser }>(
          `${base}/api/auth/claim-owner`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: authName.trim() || 'Belika Owner',
              identifier: authIdentifier.trim(),
              password: authPassword,
              ownerPin: authOwnerPin.trim(),
            }),
          },
        );
        setAuthToken(data.token);
        setCurrentUser(data.user);
        setHasOwnerSetup(true);
        setCustomerName(data.user.name);
        if (data.user.phone) setCustomerPhone(data.user.phone);
        setShowAuthModal(false);
        setAuthPassword('');
        setAuthOwnerPin('');
        void loadOwnerDirectory(data.token);
        setShowStaff(true);
        return;
      }

      const endpoint = authMode === 'signup' ? '/api/auth/register' : '/api/auth/login';
      const payload =
        authMode === 'signup'
          ? {
              name: authName.trim(),
              identifier: authIdentifier.trim(),
              phone: authPhone.trim() || authIdentifier.trim(),
              password: authPassword,
            }
          : {
              identifier: authIdentifier.trim(),
              password: authPassword,
            };

      const data = await safeFetchJson<{ token: string; user: AuthUser }>(`${base}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      setAuthToken(data.token);
      setCurrentUser(data.user);
      setCustomerName(data.user.name);
      if (data.user.phone) setCustomerPhone(data.user.phone);
      setShowAuthModal(false);
      setAuthPassword('');
      if (data.user.role === 'owner' || data.user.role === 'merchant') {
        void loadOwnerDirectory(data.token);
        setShowStaff(true);
      }
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Authentication failed.');
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleLogout = () => {
    if (authToken) {
      const base = apiBaseUrl.replace(/\/+$/, '');
      void fetch(`${base}/api/auth/logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${authToken}` },
      }).catch(() => {});
    }
    setCurrentUser(null);
    setAuthToken(null);
    setShowStaff(false);
  };

  const submitSupportMessage = async () => {
    if (!supportMessageText.trim()) {
      setSupportFeedback(language === 'en' ? 'Please write your question or order issue.' : 'እባክዎ መልዕክትዎን ይጻፉ።');
      return;
    }
    const newMsg: SupportMessage = {
      id: `SUP-${Date.now().toString().slice(-6)}`,
      orderId: supportOrderId.trim() || undefined,
      customerName: customerName.trim() || currentUser?.name || 'Guest Customer',
      contact: customerPhone.trim() || currentUser?.identifier || 'Not provided',
      department,
      topic: supportTopic,
      message: supportMessageText.trim(),
      status: 'open',
      createdAt: new Date().toISOString(),
    };
    setSupportMessages((prev) => [newMsg, ...prev]);
    try {
      const base = apiBaseUrl.replace(/\/+$/, '');
      await fetch(`${base}/api/support`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMsg),
      });
    } catch {
      // Kept locally even when offline
    }
    setSupportMessageText('');
    setSupportFeedback(language === 'en' ? 'Message sent to Belika Support!' : 'መልዕክትዎ ወደ ቤሊካ ድጋፍ ተልኳል!');
  };

  const addMatrixToUpload = () => {
    const color = (matrixCustomColor.trim() || matrixSelectedColor).trim();
    if (!color || matrixPickedSizes.length === 0) {
      Alert.alert(
        language === 'en' ? 'Select Color & Sizes' : 'ቀለምና መጠን ይምረጡ',
        language === 'en' ? 'Choose a color and tap one or more size chips first.' : 'ቀለምና መጠኖችን ይምረጡ።',
      );
      return;
    }
    const qty = Math.max(0, parseInt(matrixQtyInput || '1', 10) || 1);
    setUploadMatrix((prev) => {
      const next = [...prev];
      for (const sz of matrixPickedSizes) {
        const idx = next.findIndex(
          (r) => r.color.toLowerCase() === color.toLowerCase() && r.size.toLowerCase() === sz.toLowerCase(),
        );
        if (idx >= 0) next[idx] = { ...next[idx], stock: next[idx].stock + qty };
        else next.push({ color, size: sz, stock: qty });
      }
      return next;
    });
    setMatrixPickedSizes([]);
  };

  const createStaffAccount = async () => {
    if (!authToken || currentUser?.role !== 'owner') return;
    setAdminFeedback(null);
    try {
      const base = apiBaseUrl.replace(/\/+$/, '');
      const data = await safeFetchJson<{ user: AuthUser }>(`${base}/api/admin/staff`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          name: newStaffName.trim(),
          identifier: newStaffIdentifier.trim(),
          phone: newStaffPhone.trim() || newStaffIdentifier.trim(),
          password: newStaffPassword,
          role: newStaffRole,
          assignedBranch: newStaffBranch,
        }),
      });
      setStaffAccounts((prev) => [data.user, ...prev]);
      setNewStaffName('');
      setNewStaffIdentifier('');
      setNewStaffPhone('');
      setNewStaffPassword('');
      setAdminFeedback(`Added ${data.user.name} (${data.user.role})`);
    } catch (err) {
      setAdminFeedback(err instanceof Error ? err.message : 'Failed to create staff account.');
    }
  };

  const saveBranchesToServer = async () => {
    if (!authToken || currentUser?.role !== 'owner') {
      Alert.alert('Saved locally', 'Owner sign-in syncs branch directory to all devices.');
      return;
    }
    try {
      const base = apiBaseUrl.replace(/\/+$/, '');
      const data = await safeFetchJson<{ branches?: Record<BranchDepartment, BranchInfo> }>(
        `${base}/api/admin/branches`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({ branches }),
        },
      );
      if (data.branches) setBranches(data.branches);
      setAdminFeedback(language === 'en' ? 'Branch directory saved & published!' : 'የሱቅ አድራሻዎች ተዘምነዋል!');
    } catch (err) {
      setAdminFeedback(err instanceof Error ? err.message : 'Failed to save branch directory.');
    }
  };

  const sizeOptions = (product: Product): string[] => {
    if (product.variants?.length) {
      return [...new Set(product.variants.map((variant) => variant.size))];
    }
    return ['Unspecified'];
  };

  const colorOptions = (product: Product, size?: string | null): string[] => {
    const variants = product.variants ?? [];
    return [
      ...new Set(
        variants
          .filter((variant) => !size || variant.size === size)
          .map((variant) => variant.color),
      ),
    ];
  };

  const findVariant = (product: Product, size: string, color: string) =>
    product.variants?.find((variant) => variant.size === size && variant.color === color);

  const departmentLabel = (item: Department) =>
    ({ All: t.all, Men: t.men, Women: t.women, Kids: t.kids }[item]);

  const categoryIcon = (cat: StoreCategory) => {
    const n = cat.name.toLowerCase();
    if (n.includes('shoe') || n.includes('footwear')) {
      return cat.department === 'Women' ? '👠' : '👟';
    }
    if (n.includes('jumpsuit')) return '🦺';
    if (n.includes('dress') || n.includes('kemis')) return '👗';
    if (n.includes('skirt') || n.includes('tight') || n.includes('trouser') || n.includes('denim')) return '👖';
    if (n.includes('suit')) return '🤵';
    if (n.includes('jacket') || n.includes('outerwear')) return '🧥';
    if (n.includes('top') || n.includes('crop') || n.includes('polo')) return '👚';
    return cat.department === 'Women' ? '👗' : cat.department === 'Men' ? '👔' : '🧸';
  };

  const toggleFavorite = (id: string) => {
    setFavorites((current) =>
      current.includes(id) ? current.filter((saved) => saved !== id) : [...current, id],
    );
  };

  const openProductDetails = (product: Product) => {
    const sizes = sizeOptions(product);
    const defaultSize = sizes.length === 1 ? sizes[0] : null;
    const colors = colorOptions(product, defaultSize);
    const defaultColor = colors.length === 1 ? colors[0] : null;

    setSelectedProduct(product);
    setSelectedSize(defaultSize);
    setSelectedColor(defaultColor);
    const imgIdx = defaultColor ? resolveImageIndexForColor(product, defaultColor) : 0;
    setSelectedImageIndex(imgIdx);
    setIsImageZoomed(false);
    setCustomFitNote('');
    setPdpQty(1);
    setPdpTab('overview');
    setRecentlyViewedIds((prev) => [product.id, ...prev.filter((id) => id !== product.id)].slice(0, 8));
  };

  const toggleCompare = (productId: string) => {
    setCompareIds((prev) => {
      if (prev.includes(productId)) return prev.filter((id) => id !== productId);
      if (prev.length >= 2) return [prev[1], productId];
      return [...prev, productId];
    });
  };

  const applyPromoCode = (codeToApply?: string) => {
    const clean = (codeToApply ?? promoInput).trim().toUpperCase();
    if (!clean) return;
    const match = promos.find((p) => p.code.toUpperCase() === clean && p.active);
    if (!match) {
      setPromoFeedback(language === 'en' ? 'Invalid or inactive promo code.' : 'የቅናሽ ኮዱ ልክ አይደለም።');
      return;
    }
    if (match.minSubtotal && cartSubtotal < match.minSubtotal) {
      setPromoFeedback(
        language === 'en'
          ? `Requires ETB ${match.minSubtotal.toLocaleString('en-US')} minimum bag.`
          : `ቢያንስ ${match.minSubtotal.toLocaleString('en-US')} ብር ያስፈልጋል።`,
      );
      return;
    }
    setAppliedPromoCode(match.code);
    setPromoInput(match.code);
    setPromoFeedback(language === 'en' ? `Applied ${match.code}: ${match.label}` : `${match.code} ተተግብሯል።`);
  };

  const shareProduct = async (product: Product) => {
    try {
      await Share.share({
        message: `${product.name} (${product.nameAm}) · ETB ${product.price.toLocaleString('en-US')} at Belika Online Store · Bole, Addis Ababa`,
      });
    } catch {
      // ignore cancelled share
    }
  };

  const submitProductReview = () => {
    if (!selectedProduct || !reviewComment.trim()) return;
    const newRev: ProductReview = {
      id: `rev-${Date.now()}`,
      author: reviewAuthor.trim() || 'Belika Shopper',
      rating: reviewRating,
      fit: reviewFit,
      comment: reviewComment.trim(),
      createdAt: new Date().toISOString().slice(0, 10),
    };
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== selectedProduct.id) return p;
        const nextRevs = [newRev, ...(p.reviews ?? [])];
        const nextCount = (p.reviewCount ?? 0) + 1;
        const nextRating = Number(
          (((p.rating ?? 4.8) * (p.reviewCount ?? 1) + reviewRating) / ((p.reviewCount ?? 1) + 1)).toFixed(1),
        );
        return { ...p, reviews: nextRevs, reviewCount: nextCount, rating: nextRating };
      }),
    );
    setSelectedProduct((prev) =>
      prev && prev.id === selectedProduct.id
        ? {
            ...prev,
            reviews: [newRev, ...(prev.reviews ?? [])],
            reviewCount: (prev.reviewCount ?? 0) + 1,
          }
        : prev,
    );
    setReviewComment('');
    Alert.alert(language === 'en' ? 'Review posted' : 'ግምገማዎ ተቀምጧል');
  };

  const saveEditedProduct = () => {
    if (!editingProduct) return;
    setProducts((prev) => prev.map((p) => (p.id === editingProduct.id ? editingProduct : p)));
    setEditingProduct(null);
    Alert.alert(language === 'en' ? 'Product updated' : 'ምርቱ ተሻሽሏል');
  };

  const createPromoCode = () => {
    const clean = newPromoCode.trim().toUpperCase();
    const val = Number(newPromoValue);
    if (!clean || !Number.isFinite(val) || val <= 0) {
      Alert.alert('Promo', 'Enter a valid code and discount value.');
      return;
    }
    const min = Number(newPromoMin) || 0;
    const created: PromoCode = {
      code: clean,
      type: newPromoType,
      value: val,
      minSubtotal: min > 0 ? min : undefined,
      label: newPromoType === 'percent' ? `${val}% off` : `ETB ${val} off`,
      labelAm: newPromoType === 'percent' ? `${val}% ቅናሽ` : `${val} ብር ቅናሽ`,
      active: true,
    };
    setPromos((prev) => [created, ...prev.filter((p) => p.code !== clean)]);
    setNewPromoCode('');
    setNewPromoValue('');
    setNewPromoMin('');
  };

  const addToCart = (
    product: Product,
    size: string | null,
    color: string | null,
    quantityToAdd = 1,
  ) => {
    if (!size || !color) {
      Alert.alert(t.chooseVariant);
      return false;
    }
    const variant = findVariant(product, size, color);
    if (!variant) {
      Alert.alert(t.chooseVariant);
      return false;
    }
    const note = customFitNote.trim();
    const itemId = `${product.id}::${variant.id}::${note}`;
    const totalForVariant = cartItems
      .filter((item) => item.productId === product.id && item.variantId === variant.id)
      .reduce((sum, item) => sum + item.quantity, 0);
    if (variant.stock < totalForVariant + quantityToAdd) {
      Alert.alert(t.outOfStock, t.stockError);
      return false;
    }
    setCartItems((current) => {
      const currentExisting = current.find((item) => item.id === itemId);
      if (currentExisting) {
        return current.map((item) =>
          item.id === itemId ? { ...item, quantity: item.quantity + quantityToAdd } : item,
        );
      }
      return [
        ...current,
        {
          id: itemId,
          productId: product.id,
          variantId: variant.id,
          size,
          color,
          quantity: quantityToAdd,
          customNote: note || undefined,
        },
      ];
    });
    return true;
  };

  const changeCartQuantity = (itemId: string, difference: number) => {
    const item = cartItems.find((candidate) => candidate.id === itemId);
    if (!item) return;
    const product = products.find((candidate) => candidate.id === item.productId);
    const variant = product?.variants?.find((candidate) => candidate.id === item.variantId);
    if (difference > 0 && variant && item.quantity >= variant.stock) {
      Alert.alert(t.outOfStock, t.stockError);
      return;
    }
    setCartItems((current) =>
      current.map((entry) =>
        entry.id === itemId
          ? { ...entry, quantity: Math.max(1, entry.quantity + difference) }
          : entry,
      ),
    );
  };

  const adjustStock = (
    productId: string,
    variantId: string,
    difference: number,
    kind: StockMovement['kind'],
  ) => {
    const product = products.find((item) => item.id === productId);
    const variant = product?.variants?.find((item) => item.id === variantId);
    if (!variant) return;
    if (difference < 0 && variant.stock < Math.abs(difference)) {
      Alert.alert(t.outOfStock);
      return;
    }
    setProducts((current) =>
      current.map((item) =>
        item.id !== productId
          ? item
          : {
              ...item,
              variants: item.variants?.map((entry) =>
                entry.id === variantId
                  ? { ...entry, stock: Math.max(0, entry.stock + difference) }
                  : entry,
              ),
            },
      ),
    );
    setMovements((current) =>
      [
        {
          id: `move-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          productId,
          variantId,
          kind,
          quantity: difference,
          createdAt: new Date().toISOString(),
        },
        ...current,
      ].slice(0, 200),
    );
  };

  const handleAddColorToSize = (productId: string, sizeName: string) => {
    const key = `${productId}::${sizeName}`;
    const input = addExpoColorInputs[key];
    const colorName = input?.color?.trim();
    if (!colorName) {
      Alert.alert(
        language === 'en' ? 'Color required' : 'ቀለም ያስፈልጋል',
        language === 'en' ? 'Please enter or select a color name.' : 'እባክዎ የቀለም ስም ያስገቡ ወይም ይምረጡ።',
      );
      return;
    }
    const stockNum = Math.max(0, parseInt(input?.stock || '1', 10) || 0);

    setProducts((prev) =>
      prev.map((prod) => {
        if (prod.id !== productId) return prod;
        const existingVariants = prod.variants || [];
        const existingIndex = existingVariants.findIndex(
          (v) =>
            v.size.trim().toLowerCase() === sizeName.trim().toLowerCase() &&
            v.color.trim().toLowerCase() === colorName.toLowerCase(),
        );

        let nextVariants: ProductVariant[];
        if (existingIndex >= 0) {
          nextVariants = existingVariants.map((v, i) =>
            i === existingIndex ? { ...v, stock: v.stock + stockNum } : v,
          );
        } else {
          const newVariant: ProductVariant = {
            id: `${prod.id}-${sizeName.toLowerCase().replace(/\s+/g, '-')}-${colorName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
            size: sizeName,
            color: colorName,
            stock: stockNum,
          };
          nextVariants = [...existingVariants, newVariant];
        }

        const swatchHex = colorSwatchHex(colorName);
        const swatchExists = prod.colorSwatches?.some(
          (s) => s.name.toLowerCase() === colorName.toLowerCase(),
        );
        const updatedSwatches = swatchExists
          ? prod.colorSwatches
          : [...(prod.colorSwatches || []), { name: colorName, hex: swatchHex }];

        return {
          ...prod,
          variants: nextVariants,
          colorSwatches: updatedSwatches,
        };
      }),
    );

    setAddExpoColorInputs((prev) => ({
      ...prev,
      [key]: { color: '', stock: '1' },
    }));
  };

  const handleRemoveVariant = (
    productId: string,
    variantId: string,
    sizeName: string,
    colorName: string,
  ) => {
    Alert.alert(
      language === 'en' ? 'Remove Variant?' : 'ልዩነቱን ያጥፉ?',
      language === 'en'
        ? `Delete Size ${sizeName} · Color ${colorName}?`
        : `መጠን ${sizeName} · ቀለም ${colorName} ይወገድ?`,
      [
        { text: language === 'en' ? 'Cancel' : 'ይቅር', style: 'cancel' },
        {
          text: language === 'en' ? 'Remove' : 'አጥፋ',
          style: 'destructive',
          onPress: () =>
            setProducts((prev) =>
              prev.map((prod) =>
                prod.id !== productId
                  ? prod
                  : {
                      ...prod,
                      variants: (prod.variants || []).filter((v) => v.id !== variantId),
                    },
              ),
            ),
        },
      ],
    );
  };

  const handleAddSizeToProduct = (productId: string) => {
    const size = newExpoSizeName.trim();
    if (!size) {
      Alert.alert(
        language === 'en' ? 'Size required' : 'መጠን ያስፈልጋል',
        language === 'en' ? 'Enter a size (e.g. S, M, XL, 38).' : 'እባክዎ መጠን ያስገቡ።',
      );
      return;
    }
    const color = newExpoSizeColor.trim() || 'Standard';
    const stock = Math.max(0, parseInt(newExpoSizeStock || '1', 10) || 0);

    setProducts((prev) =>
      prev.map((prod) => {
        if (prod.id !== productId) return prod;
        const newVariant: ProductVariant = {
          id: `${prod.id}-${size.toLowerCase().replace(/\s+/g, '-')}-${color.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
          size,
          color,
          stock,
        };
        const swatchHex = colorSwatchHex(color);
        const swatchExists = prod.colorSwatches?.some(
          (s) => s.name.toLowerCase() === color.toLowerCase(),
        );
        const updatedSwatches = swatchExists
          ? prod.colorSwatches
          : [...(prod.colorSwatches || []), { name: color, hex: swatchHex }];

        return {
          ...prod,
          variants: [...(prod.variants || []), newVariant],
          colorSwatches: updatedSwatches,
        };
      }),
    );

    setExpandedExpoSizes((prev) => ({
      ...prev,
      [`${productId}::${size}`]: true,
    }));
    setNewExpoSizeName('');
    setNewExpoSizeColor('');
    setNewExpoSizeStock('1');
    setShowAddExpoSizeForProduct(null);
  };

  const handleDeleteProduct = (product: Product) => {
    Alert.alert(
      language === 'en' ? 'Delete Product?' : 'ምርቱን ያጥፉ?',
      language === 'en'
        ? `Are you sure you want to delete "${product.name}"?`
        : `"${product.nameAm}"ን ማጥፋት ይፈልጋሉ?`,
      [
        { text: language === 'en' ? 'Cancel' : 'ይቅር', style: 'cancel' },
        {
          text: language === 'en' ? 'Delete' : 'አጥፋ',
          style: 'destructive',
          onPress: () =>
            setProducts((current) => current.filter((item) => item.id !== product.id)),
        },
      ],
    );
  };

  const saveProductFromStaff = (publishImmediately: boolean) => {
    const price = Number(newPrice);
    const parsedStock = Number.parseInt(newInitialStock, 10);
    const stockCount = Number.isFinite(parsedStock) && parsedStock >= 0
      ? parsedStock
      : publishImmediately
        ? 1
        : 0;

    let variants: ProductVariant[] = [];
    let sizeList: string[] = [];
    let colorList: string[] = [];
    const id = `item-${Date.now()}`;

    if (uploadMatrix.length > 0) {
      variants = uploadMatrix.map((row, idx) => ({
        id: `${id}-m${idx}`,
        size: row.size,
        color: row.color,
        stock: row.stock,
      }));
      sizeList = [...new Set(uploadMatrix.map((r) => r.size))];
      colorList = [...new Set(uploadMatrix.map((r) => r.color))];
    } else {
      sizeList = newSizes
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
      colorList = newColors
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
      if (sizeList.length && colorList.length) {
        variants = sizeList.flatMap((size, sizeIndex) =>
          colorList.map((color, colorIndex) => ({
            id: `${id}-v${sizeIndex}-${colorIndex}`,
            size,
            color,
            stock: publishImmediately ? Math.max(1, stockCount) : stockCount,
          })),
        );
      }
    }

    if (
      !newName.trim() ||
      !Number.isFinite(price) ||
      price <= 0 ||
      !variants.length
    ) {
      Alert.alert(t.addDraft, t.productFieldsRequired);
      return;
    }

    const swatches: ColorSwatch[] = colorList.map((name) => {
      const found = detectedSwatches.find((s) => s.name.toLowerCase() === name.toLowerCase());
      return found ?? { name, hex: colorSwatchHex(name) };
    });

    const product: Product = {
      id,
      department: newDepartment,
      category: newCategory || 'Apparel',
      subcategory: newSubcategory.trim() || undefined,
      name: newName.trim(),
      nameAm: newNameAm.trim() || newName.trim(),
      brand: newBrand.trim() || undefined,
      price,
      badge: publishImmediately ? 'New' : undefined,
      sizes: sizeList.length > 1 ? `${sizeList[0]}–${sizeList[sizeList.length - 1]}` : sizeList[0],
      sizeGuidance: newSizeGuidance.trim() || undefined,
      sizeGuidanceAm: newSizeGuidanceAm.trim() || undefined,
      fabric: newFabric.trim() || undefined,
      colorSwatches: swatches,
      customizable: newCustomizable,
      rating: 5.0,
      reviewCount: 0,
      emoji: '🛍️',
      tint: '#EFEAE1',
      images: uploadedPhotoUris.length > 0 ? uploadedPhotoUris : undefined,
      imageLabels:
        perImageColors.length === uploadedPhotoUris.length && perImageColors.length > 0
          ? perImageColors
          : colorList,
      variants,
      status: publishImmediately ? 'published' : 'draft',
      sourceUrl: draftSourceId
        ? telegramCandidates.find((item) => item.id === draftSourceId)?.postUrl
        : undefined,
      sourceChannel: draftSourceId
        ? telegramCandidates.find((item) => item.id === draftSourceId)?.channel
        : undefined,
      sourceDate: draftSourceId
        ? telegramCandidates.find((item) => item.id === draftSourceId)?.postedAt
        : undefined,
    };
    setProducts((current) => [product, ...current]);
    if (draftSourceId) updateTelegramCandidate(draftSourceId, 'drafted');
    setDraftSourceId(null);
    setUploadedPhotoUris([]);
    setUploadedBase64Images([]);
    setPerImageColors([]);
    setDetectedSwatches([]);
    setUploadMatrix([]);
    setMatrixPickedSizes([]);
    setAiStatusMsg(null);
    setNewName('');
    setNewNameAm('');
    setNewBrand('');
    setNewPrice('');
    setNewSubcategory('');
    setNewSizes('');
    setNewColors('');
    setNewInitialStock('');
    setNewFabric('');
    setNewSizeGuidance('');
    setNewSizeGuidanceAm('');
    Alert.alert(publishImmediately ? t.published : t.draft, publishImmediately ? product.name : t.verifyPublish);
  };

  const addCustomCategory = () => {
    if (!catName.trim()) {
      Alert.alert('Category name', 'Enter a category name first.');
      return;
    }
    const created: StoreCategory = {
      id: `cat-${Date.now()}`,
      name: catName.trim(),
      nameAm: catNameAm.trim() || catName.trim(),
      department: catDepartment,
      subcategories: catSubcategories
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      accentColor: COLORS.terracotta,
      isCustom: true,
    };
    setCategories((prev) => [...prev, created]);
    setNewCategory(created.name);
    setCatName('');
    setCatNameAm('');
    setCatSubcategories('');
    Alert.alert('Category added', created.name);
  };

  const requestOrder = () => {
    if (!cartItems.length) return;
    if (!currentUser) {
      setAuthMode('signup');
      setAuthError(
        language === 'en'
          ? 'Please sign up or sign in to place and track your Belika order.'
          : 'ትዕዛዝ ለማስገባት እባክዎ ይመዝገቡ ወይም ይግቡ።',
      );
      setShowAuthModal(true);
      return;
    }
    if (!customerName.trim() || !customerPhone.trim()) {
      Alert.alert(t.contactRequired);
      return;
    }
    const resolvedCity =
      deliveryCity === 'Other' ? customCityInput.trim() || 'Other City' : deliveryCity;
    if (fulfillment === 'delivery' && !deliveryAddress.trim()) {
      Alert.alert(t.deliveryAddressRequired);
      return;
    }
    const fee = effectiveDeliveryFee;
    const order: StoreOrder = {
      id: `BL-${Date.now().toString().slice(-6)}`,
      userId: currentUser.id,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      customerEmail: currentUser.email,
      fulfillment,
      deliveryProvider: fulfillment === 'pickup' ? 'pickup' : deliveryProvider,
      deliveryCity: fulfillment === 'delivery' ? resolvedCity : 'Addis Ababa',
      deliverySubcity: fulfillment === 'delivery' && resolvedCity === 'Addis Ababa' ? deliverySubcity : undefined,
      paymentMethod,
      paymentReference: paymentMethod !== 'cod' ? paymentReference.trim() || undefined : undefined,
      paymentProofImage: paymentMethod !== 'cod' ? paymentProofImage : undefined,
      promoCode: promoDiscountAmount > 0 ? appliedPromoCode || undefined : undefined,
      discountAmount: promoDiscountAmount > 0 ? promoDiscountAmount : undefined,
      deliveryAddress: fulfillment === 'delivery' ? deliveryAddress.trim() : undefined,
      deliveryLandmark:
        fulfillment === 'delivery' && deliveryLandmark.trim()
          ? deliveryLandmark.trim()
          : undefined,
      deliveryCoords: fulfillment === 'delivery' ? deliveryCoords : undefined,
      deliveryZone: fulfillment === 'delivery' ? deliveryZone : undefined,
      deliveryDistanceKm: fulfillment === 'delivery' ? deliveryDistanceKm : undefined,
      estimatedDeliveryFee: fee > 0 ? fee : undefined,
      items: cartItems.map((item) => ({ ...item })),
      subtotal: cartSubtotal,
      total: orderTotal,
      status: 'requested',
      createdAt: new Date().toISOString(),
    };
    setCustomerProfile({
      name: customerName.trim(),
      phone: customerPhone.trim(),
      email: currentUser.email,
      preferredCity: resolvedCity,
      preferredSubcity: deliverySubcity,
      preferredAddress: fulfillment === 'delivery' ? deliveryAddress.trim() : customerProfile?.preferredAddress,
      preferredLandmark: fulfillment === 'delivery' ? deliveryLandmark.trim() : customerProfile?.preferredLandmark,
      preferredZone: fulfillment === 'delivery' ? deliveryZone : customerProfile?.preferredZone,
    });
    setOrders((current) => [order, ...current]);
    setCartItems([]);
    setAppliedPromoCode(null);
    setPromoInput('');
    setPromoFeedback(null);
    setPaymentReference('');
    setPaymentProofImage(undefined);
    setShowOrderRequest(false);
    setTrackingOrder(order);
    setActiveTab('cart');
  };

  const updateOrderStatus = (orderId: string, nextStatus: OrderStatus) => {
    const order = orders.find((item) => item.id === orderId);
    if (!order) return;
    if (nextStatus === 'confirmed' && order.status === 'requested') {
      const enoughStock = order.items.every((line) => {
        const product = products.find((item) => item.id === line.productId);
        const variant = product?.variants?.find((item) => item.id === line.variantId);
        return Boolean(variant && variant.stock >= line.quantity);
      });
      if (!enoughStock) {
        Alert.alert(t.stockError);
        return;
      }
      setProducts((current) =>
        current.map((product) => ({
          ...product,
          soldCount:
            (product.soldCount ?? 0) +
            order.items.filter((i) => i.productId === product.id).reduce((s, i) => s + i.quantity, 0),
          variants: product.variants?.map((variant) => {
            const line = order.items.find(
              (item) => item.productId === product.id && item.variantId === variant.id,
            );
            return line ? { ...variant, stock: variant.stock - line.quantity } : variant;
          }),
        })),
      );
      setMovements((current) =>
        [
          ...order.items.map((line) => ({
            id: `move-${Date.now()}-${line.id}`,
            productId: line.productId,
            variantId: line.variantId,
            kind: 'order' as const,
            quantity: -line.quantity,
            createdAt: new Date().toISOString(),
          })),
          ...current,
        ].slice(0, 200),
      );
    } else if (
      nextStatus === 'cancelled' &&
      (order.status === 'confirmed' || order.status === 'out-for-delivery')
    ) {
      setProducts((current) =>
        current.map((product) => ({
          ...product,
          variants: product.variants?.map((variant) => {
            const line = order.items.find(
              (item) => item.productId === product.id && item.variantId === variant.id,
            );
            return line ? { ...variant, stock: variant.stock + line.quantity } : variant;
          }),
        })),
      );
      setMovements((current) =>
        [
          ...order.items.map((line) => ({
            id: `return-${Date.now()}-${line.id}`,
            productId: line.productId,
            variantId: line.variantId,
            kind: 'return' as const,
            quantity: line.quantity,
            createdAt: new Date().toISOString(),
          })),
          ...current,
        ].slice(0, 200),
      );
    }
    setOrders((current) =>
      current.map((item) => (item.id === orderId ? { ...item, status: nextStatus } : item)),
    );
  };

  const removeCartItem = (itemId: string) => {
    setCartItems((current) => current.filter((item) => item.id !== itemId));
  };

  const resetFilters = () => {
    setDepartment('All');
    setSelectedCategory('All');
    setSelectedSubcategory('All');
    setColorFilter('All');
    setSizeFilter('All');
    setPriceBand('all');
    setSortBy('featured');
    setQuery('');
  };

  const departments: Department[] = ['All', 'Men', 'Women', 'Kids'];
  const selectedVariant =
    selectedProduct && selectedSize && selectedColor
      ? findVariant(selectedProduct, selectedSize, selectedColor)
      : undefined;

  const activeHeroSlide = HERO_PROMO_SLIDES[heroSlideIndex % HERO_PROMO_SLIDES.length];
  const activeBranchInfo = department !== 'All' ? branches[department] : null;

  if (!storageReady || showSplash) {
    return (
      <GestureHandlerRootView style={styles.gestureRoot}>
        <StatusBar barStyle="dark-content" />
        <TouchableOpacity
          activeOpacity={1}
          style={styles.splashOverlay}
          onPress={() => {
            if (storageReady) setShowSplash(false);
          }}
        >
          <Image
            source={BELIKA_LOGO_SPLASH}
            style={styles.splashLogoImage}
            resizeMode="contain"
          />
        </TouchableOpacity>
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={styles.gestureRoot}>
      <View style={styles.safe}>
        <StatusBar barStyle="dark-content" />

        {/* Slim Top Announcement Bar */}
        {showPromoBanner && (
          <View style={styles.promoBanner}>
            <TouchableOpacity
              onPress={() => {
                setPromoInput('BELIKA10');
                setActiveTab('cart');
              }}
              style={{ flex: 1 }}
            >
              <Text style={styles.promoBannerText} numberOfLines={1}>
                {language === 'en'
                  ? 'Free Addis delivery ETB 5,000+ · Code BELIKA10 (10% off)'
                  : 'ከ5,000 ብር በላይ ነፃ ማድረስ · ኮድ BELIKA10'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowPromoBanner(false)} style={styles.promoCloseBtn}>
              <Text style={styles.promoCloseText}>×</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.brand}
            onPress={() => setActiveTab('shop')}
            accessibilityLabel="Belika home"
          >
            <Image
              source={BELIKA_LOGO_SPLASH}
              style={styles.brandWordmarkImage}
              resizeMode="contain"
            />
          </TouchableOpacity>

          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.langToggleBtn}
              onPress={() => setLanguage((prev) => (prev === 'en' ? 'am' : 'en'))}
              accessibilityLabel="Switch language"
            >
              <Text style={styles.languageText} numberOfLines={1}>
                {language === 'en' ? 'አማ' : 'EN'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.staffChipButton}
              onPress={() => {
                setAuthError(null);
                setShowAuthModal(true);
              }}
              accessibilityLabel="Account"
            >
              <Text style={styles.staffChipText} numberOfLines={1}>
                {currentUser
                  ? currentUser.name.split(' ')[0]
                  : language === 'en'
                    ? 'Sign In'
                    : 'ግባ'}
              </Text>
            </TouchableOpacity>
            {isStaffUser && (
              <TouchableOpacity
                style={[styles.staffChipButton, { backgroundColor: COLORS.forest }]}
                onPress={() => setShowStaff(true)}
                accessibilityLabel={t.staff}
              >
                <Text style={[styles.staffChipText, { color: COLORS.white }]} numberOfLines={1}>
                  {t.staff}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Shop / Wishlist Content */}
        {activeTab !== 'cart' ? (
          <ScrollView
            ref={mainScrollRef}
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
          >
            {/* Search + Camera AI Visual Search Inside Bar + Filter Toggle */}
            <View style={styles.searchRow}>
              <View style={styles.searchBox}>
                <BoutiqueSearchIcon />
                <TextInput
                  value={query}
                  onChangeText={setQuery}
                  placeholder={t.search}
                  placeholderTextColor={COLORS.muted}
                  style={styles.searchInput}
                />
                {query.length > 0 && (
                  <TouchableOpacity onPress={() => setQuery('')} style={styles.clearSearchBtn}>
                    <Text style={styles.clearSearchText}>×</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={styles.cameraInlineBtn}
                  onPress={() => setShowCameraModal(true)}
                  accessibilityLabel="Camera AI Search"
                >
                  <Text style={styles.cameraInlineText}>📷</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[styles.filterTriggerBtn, (showFilters || activeFilterCount > 0) && styles.filterTriggerActive]}
                onPress={() => setShowFilters((v) => !v)}
              >
                <Text
                  style={[
                    styles.filterTriggerText,
                    (showFilters || activeFilterCount > 0) && styles.filterTriggerTextActive,
                  ]}
                >
                  {activeFilterCount > 0 ? `${t.filters} (${activeFilterCount})` : t.filters}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Real-Time Search Suggestions Overlay */}
            {hasSearchSuggestions && (
              <View style={styles.suggestionsDropdown}>
                {searchSuggestions.categories.length > 0 && (
                  <View style={styles.suggestionSection}>
                    <Text style={styles.suggestionSectionLabel}>
                      {language === 'en' ? 'CATEGORIES' : 'ምድቦች'}
                    </Text>
                    <View style={styles.suggestionChipRow}>
                      {searchSuggestions.categories.map((catName) => (
                        <TouchableOpacity
                          key={`sugg-cat-${catName}`}
                          onPress={() => {
                            setSelectedCategory(catName);
                            setQuery('');
                          }}
                          style={styles.suggestionCatChip}
                        >
                          <Text style={styles.suggestionCatChipText}>{catName}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}

                {searchSuggestions.brands.length > 0 && (
                  <View style={styles.suggestionSection}>
                    <Text style={styles.suggestionSectionLabel}>
                      {language === 'en' ? 'BRANDS' : 'ብራንዶች'}
                    </Text>
                    <View style={styles.suggestionChipRow}>
                      {searchSuggestions.brands.map((brandName) => (
                        <TouchableOpacity
                          key={`sugg-brand-${brandName}`}
                          onPress={() => setQuery(brandName)}
                          style={styles.suggestionBrandChip}
                        >
                          <Text style={styles.suggestionBrandChipText}>{brandName}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}

                {searchSuggestions.products.length > 0 && (
                  <View style={styles.suggestionProdSection}>
                    <Text style={styles.suggestionSectionLabel}>
                      {language === 'en' ? 'MATCHING PRODUCTS' : 'የሚዛመዱ ምርቶች'}
                    </Text>
                    {searchSuggestions.products.map((prodName, idx) => (
                      <TouchableOpacity
                        key={`sugg-prod-${idx}`}
                        onPress={() => setQuery(prodName)}
                        style={styles.suggestionProdRow}
                      >
                        <Text style={styles.suggestionProdText} numberOfLines={1}>
                          {prodName}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            )}

            {/* Collapsible Multi-Facet Filter Panel */}
            {showFilters && (
              <View style={styles.filterPanel}>
                <View style={styles.filterPanelHead}>
                  <Text style={styles.filterPanelTitle}>{t.filters}</Text>
                  <TouchableOpacity onPress={resetFilters}>
                    <Text style={styles.resetFilterLink}>{t.clearFilters}</Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.filterSubLabel}>{t.colors}</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.miniChipRow}>
                  <TouchableOpacity
                    onPress={() => setColorFilter('All')}
                    style={[styles.miniChip, colorFilter === 'All' && styles.miniChipActive]}
                  >
                    <Text style={[styles.miniChipText, colorFilter === 'All' && styles.miniChipTextActive]}>
                      {t.all}
                    </Text>
                  </TouchableOpacity>
                  {availableColors.map((sw) => (
                    <TouchableOpacity
                      key={sw.name}
                      onPress={() => setColorFilter(colorFilter === sw.name ? 'All' : sw.name)}
                      style={[styles.miniChip, colorFilter === sw.name && styles.miniChipActive]}
                    >
                      <View style={[styles.miniDot, { backgroundColor: sw.hex }]} />
                      <Text style={[styles.miniChipText, colorFilter === sw.name && styles.miniChipTextActive]}>
                        {sw.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <Text style={styles.filterSubLabel}>{t.sizes}</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.miniChipRow}>
                  <TouchableOpacity
                    onPress={() => setSizeFilter('All')}
                    style={[styles.miniChip, sizeFilter === 'All' && styles.miniChipActive]}
                  >
                    <Text style={[styles.miniChipText, sizeFilter === 'All' && styles.miniChipTextActive]}>
                      {t.all}
                    </Text>
                  </TouchableOpacity>
                  {availableSizes.map((sz) => (
                    <TouchableOpacity
                      key={sz}
                      onPress={() => setSizeFilter(sizeFilter === sz ? 'All' : sz)}
                      style={[styles.miniChip, sizeFilter === sz && styles.miniChipActive]}
                    >
                      <Text style={[styles.miniChipText, sizeFilter === sz && styles.miniChipTextActive]}>
                        {sz}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <Text style={styles.filterSubLabel}>ETB / Sort</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.miniChipRow}>
                  {(
                    [
                      { id: 'all', label: t.all },
                      { id: 'under-2500', label: '< 2,500' },
                      { id: '2500-5000', label: '2.5k–5k' },
                      { id: 'over-5000', label: '5,000+' },
                    ] as const
                  ).map((b) => (
                    <TouchableOpacity
                      key={b.id}
                      onPress={() => setPriceBand(b.id)}
                      style={[styles.miniChip, priceBand === b.id && styles.miniChipActive]}
                    >
                      <Text style={[styles.miniChipText, priceBand === b.id && styles.miniChipTextActive]}>
                        {b.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                  {(
                    [
                      { id: 'featured', label: 'Featured' },
                      { id: 'bestselling', label: 'Best Selling' },
                      { id: 'price-asc', label: 'ETB ↑' },
                      { id: 'price-desc', label: 'ETB ↓' },
                      { id: 'rating', label: '★ Top' },
                    ] as const
                  ).map((s) => (
                    <TouchableOpacity
                      key={s.id}
                      onPress={() => setSortBy(s.id)}
                      style={[styles.miniChip, sortBy === s.id && styles.miniChipActive]}
                    >
                      <Text style={[styles.miniChipText, sortBy === s.id && styles.miniChipTextActive]}>
                        {s.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Compact Auto-Rotating Promotion Hero Carousel */}
            {activeTab === 'shop' && !query.trim() && activeFilterCount === 0 && (
              <View style={[styles.banner, { backgroundColor: COLORS.forest }]}>
                <View style={styles.bannerEditorialCopy}>
                  <View style={[styles.promoSlideBadge, { backgroundColor: activeHeroSlide.accentHex }]}>
                    <Text style={styles.promoSlideBadgeText}>
                      {language === 'en' ? activeHeroSlide.badgeEn : activeHeroSlide.badgeAm}
                    </Text>
                  </View>
                  <Text style={styles.bannerTitleCompact}>
                    {language === 'en' ? activeHeroSlide.titleEn : activeHeroSlide.titleAm}
                  </Text>
                  <Text style={styles.bannerTextCompact}>
                    {language === 'en' ? activeHeroSlide.subtitleEn : activeHeroSlide.subtitleAm}
                  </Text>
                  <View style={styles.bannerButtonsRowHorizontal}>
                    <TouchableOpacity
                      style={[styles.bannerButton, { flex: 1 }]}
                      onPress={() => {
                        setDepartment(activeHeroSlide.department);
                        setSelectedCategory('All');
                        setSelectedSubcategory('All');
                      }}
                    >
                      <Text style={styles.bannerButtonText} numberOfLines={1}>
                        {language === 'en' ? activeHeroSlide.ctaEn : activeHeroSlide.ctaAm} →
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.bannerSecondaryButtonHorizontal}
                      onPress={() => {
                        setDepartment('All');
                        setSelectedCategory('All');
                      }}
                    >
                      <Text style={styles.bannerSecondaryText} numberOfLines={1}>
                        {t.all}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
                <Image
                  source={activeHeroSlide.image}
                  style={styles.bannerHeroCompactImage}
                  resizeMode="cover"
                />
                <View style={styles.heroDotsRow}>
                  {HERO_PROMO_SLIDES.map((sl, idx) => (
                    <TouchableOpacity
                      key={sl.id}
                      onPress={() => setHeroSlideIndex(idx)}
                      style={[
                        styles.heroDot,
                        heroSlideIndex % HERO_PROMO_SLIDES.length === idx && styles.heroDotActive,
                      ]}
                    />
                  ))}
                </View>
              </View>
            )}

            {/* Department-Specific Store Directory Card (when Belika Man / Women / Kids selected) */}
            {activeTab === 'shop' && activeBranchInfo && (
              <View style={styles.branchDirCard}>
                <Text style={styles.branchDirEyebrow}>
                  {language === 'en' ? activeBranchInfo.title : activeBranchInfo.titleAm}
                </Text>
                <Text style={styles.branchDirAddress}>
                  📍 {language === 'en' ? activeBranchInfo.address : activeBranchInfo.addressAm}
                </Text>
                <Text style={styles.branchDirMeta}>
                  {language === 'en' ? activeBranchInfo.landmark : activeBranchInfo.landmarkAm} ·{' '}
                  {language === 'en' ? activeBranchInfo.hours : activeBranchInfo.hoursAm}
                </Text>
                <View style={styles.branchActionRow}>
                  <TouchableOpacity
                    style={styles.branchActionBtn}
                    onPress={() =>
                      void openExternalUrl(`tel:${activeBranchInfo.salesPhone.replace(/\s+/g, '')}`, 'Call Sales')
                    }
                  >
                    <Text style={styles.branchActionText}>📞 {language === 'en' ? 'Call Store' : 'ይደውሉ'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.branchActionBtn}
                    onPress={() => void openExternalUrl(activeBranchInfo.mapsUrl, 'Store Map')}
                  >
                    <Text style={styles.branchActionText}>🗺️ Maps</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.branchActionBtn}
                    onPress={() => void openExternalUrl(activeBranchInfo.telegramChannel, 'Telegram')}
                  >
                    <Text style={styles.branchActionText}>✈️ Telegram</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.branchActionBtn}
                    onPress={() => void openExternalUrl(activeBranchInfo.tiktokUrl, 'TikTok')}
                  >
                    <Text style={styles.branchActionText}>🎵 TikTok</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.branchActionBtn, { backgroundColor: COLORS.forest }]}
                    onPress={() => {
                      setSupportFeedback(null);
                      setShowSupportModal(true);
                    }}
                  >
                    <Text style={[styles.branchActionText, { color: COLORS.white }]}>
                      💬 {language === 'en' ? 'Support' : 'ድጋፍ'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Circular Category Rail (matches web preview order: Hero -> Categories -> Flash Drops -> Feed) */}
            {activeTab === 'shop' && (
              <View style={styles.categoryWrap}>

                <View style={styles.listHeading}>
                  <Text style={styles.sectionTitle}>
                    {t.categories} ({visibleCategories.length})
                  </Text>
                  {isStaffUser && (
                    <TouchableOpacity
                      onPress={() => {
                        setStaffSection('categories');
                        setShowStaff(true);
                      }}
                    >
                      <Text style={styles.manageCatsLink}>+ {t.categories}</Text>
                    </TouchableOpacity>
                  )}
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.circularCatRow}>
                  <TouchableOpacity
                    onPress={() => {
                      setSelectedCategory('All');
                      setSelectedSubcategory('All');
                    }}
                    style={styles.circularCatItem}
                  >
                    <View
                      style={[
                        styles.circularCatBubble,
                        selectedCategory === 'All' && styles.circularCatBubbleActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.circularAllText,
                          selectedCategory === 'All' && styles.circularAllTextActive,
                        ]}
                      >
                        ALL
                      </Text>
                    </View>
                    <Text
                      numberOfLines={1}
                      style={[
                        styles.circularCatLabel,
                        selectedCategory === 'All' && styles.circularCatLabelActive,
                      ]}
                    >
                      {t.allCategories}
                    </Text>
                  </TouchableOpacity>

                  {visibleCategories.map((cat) => {
                    const isActive = selectedCategory === cat.name;
                    return (
                      <TouchableOpacity
                        key={cat.id}
                        onPress={() => {
                          setSelectedCategory(isActive ? 'All' : cat.name);
                          setSelectedSubcategory('All');
                        }}
                        style={styles.circularCatItem}
                      >
                        <View
                          style={[
                            styles.circularCatBubble,
                            isActive && styles.circularCatBubbleActive,
                            isActive && { backgroundColor: cat.accentColor || COLORS.forest },
                          ]}
                        >
                          <Text style={styles.circularCatEmoji}>{categoryIcon(cat)}</Text>
                        </View>
                        <Text
                          numberOfLines={1}
                          style={[styles.circularCatLabel, isActive && styles.circularCatLabelActive]}
                        >
                          {language === 'en' ? cat.name : cat.nameAm}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                {activeCategoryObj && activeCategoryObj.subcategories.length > 0 && (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.miniChipRow}>
                    <TouchableOpacity
                      onPress={() => setSelectedSubcategory('All')}
                      style={[styles.miniChip, selectedSubcategory === 'All' && styles.miniChipActive]}
                    >
                      <Text
                        style={[
                          styles.miniChipText,
                          selectedSubcategory === 'All' && styles.miniChipTextActive,
                        ]}
                      >
                        {t.all}
                      </Text>
                    </TouchableOpacity>
                    {activeCategoryObj.subcategories.map((sub) => (
                      <TouchableOpacity
                        key={sub}
                        onPress={() =>
                          setSelectedSubcategory(selectedSubcategory === sub ? 'All' : sub)
                        }
                        style={[styles.miniChip, selectedSubcategory === sub && styles.miniChipActive]}
                      >
                        <Text
                          style={[
                            styles.miniChipText,
                            selectedSubcategory === sub && styles.miniChipTextActive,
                          ]}
                        >
                          {sub}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}
              </View>
            )}

            {/* Flash Drops 2x2 Grid (matches web preview) */}
            {activeTab === 'shop' &&
              !query.trim() &&
              department === 'All' &&
              selectedCategory === 'All' &&
              flashDrops.length > 0 && (
                <View style={styles.featuredStrip}>
                  <View style={styles.listHeading}>
                    <Text style={styles.sectionTitleSerif}>✨ {t.flashDrops}</Text>
                    <Text style={styles.countText}>ETB Deals</Text>
                  </View>
                  <View style={styles.grid}>
                    {flashDrops.map((item) => {
                      const discountPct =
                        item.compareAtPrice && item.compareAtPrice > item.price
                          ? Math.round(
                              ((item.compareAtPrice - item.price) / item.compareAtPrice) * 100,
                            )
                          : null;
                      return (
                        <TouchableOpacity
                          key={`flash-${item.id}`}
                          style={styles.flashGridCard}
                          onPress={() => openProductDetails(item)}
                        >
                          <View style={styles.flashPhotoWrap}>
                            {item.images?.[0] ? (
                              <Image
                                source={resolveImageSource(item.images[0], apiBaseUrl)}
                                style={styles.flashGridImage}
                                resizeMode="cover"
                              />
                            ) : (
                              <View style={[styles.flashGridImage, { alignItems: 'center', justifyContent: 'center' }]}>
                                <Text style={styles.placardMonogram}>{monogramFor(item.name)}</Text>
                              </View>
                            )}
                            {discountPct ? (
                              <View style={[styles.badgeTag, { backgroundColor: COLORS.terracotta }]}>
                                <Text style={styles.badgeTagText}>-{discountPct}%</Text>
                              </View>
                            ) : null}
                          </View>
                          <View style={{ padding: 10 }}>
                            <Text style={styles.featuredName} numberOfLines={1}>
                              {language === 'en' ? item.name : item.nameAm}
                            </Text>
                            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 3 }}>
                              <Text style={styles.featuredPrice}>
                                ETB {item.price.toLocaleString('en-US')}
                              </Text>
                              {item.compareAtPrice ? (
                                <Text style={styles.strikePrice}>
                                  {item.compareAtPrice.toLocaleString('en-US')}
                                </Text>
                              ) : null}
                            </View>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}

            {/* Curated Boutique Feed Header + Shop Switcher Card */}
            <View style={{ marginBottom: 12 }}>
              <Text style={styles.sectionTitleSerif}>
                {activeTab === 'wishlist' ? t.wishlist : t.featured}
              </Text>
              <Text style={styles.feedSubtitle}>
                {results.length} {language === 'en' ? 'items' : 'ዕቃዎች'} · {t.demo}
              </Text>

              {activeTab === 'shop' && (
                <View style={styles.shopBarCard}>
                  {(['All', 'Men', 'Women', 'Kids'] as Department[]).map((shop) => {
                    const active = department === shop;
                    return (
                      <TouchableOpacity
                        key={`shop-bar-${shop}`}
                        onPress={() => {
                          setDepartment(shop);
                          setSelectedCategory('All');
                          setSelectedSubcategory('All');
                        }}
                        style={[styles.shopBarPill, active && styles.shopBarPillActive]}
                      >
                        <Text style={[styles.shopBarPillText, active && styles.shopBarPillTextActive]}>
                          {departmentLabel(shop)}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>

            {results.length === 0 ? (
              <View style={styles.emptyBox}>
                <View style={styles.emptyBadge}>
                  <Text style={styles.emptyIcon}>{activeTab === 'wishlist' ? '♡' : '✦'}</Text>
                </View>
                <Text style={styles.emptyText}>
                  {activeTab === 'wishlist'
                    ? t.wishlistEmpty
                    : department === 'Kids' && activeFilterCount === 0
                      ? t.kidsSoon
                      : t.empty}
                </Text>
              </View>
            ) : (
              <View style={styles.grid}>
                {results.map((product) => {
                  const isSaved = favorites.includes(product.id);
                  const hasRealPhoto = Boolean(product.images && product.images.length > 0);
                  const swatches =
                    product.colorSwatches ??
                    (product.imageLabels ?? []).map((name) => ({
                      name,
                      hex: colorSwatchHex(name),
                    }));
                  const discountPct =
                    product.compareAtPrice && product.compareAtPrice > product.price
                      ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
                      : null;
                    const previewColor = cardPreviewColors[product.id];
                    const previewIdx = previewColor
                      ? resolveImageIndexForColor(product, previewColor)
                      : 0;
                    const displayImg = product.images?.[previewIdx] ?? product.images?.[0];
                    return (
                    <View key={product.id} style={styles.card}>
                      <View style={[styles.productPhoto, { backgroundColor: product.tint }]}>
                        <TouchableOpacity
                          activeOpacity={0.85}
                          style={styles.photoTapArea}
                          onPress={() => openProductDetails(product)}
                        >
                          {hasRealPhoto && displayImg ? (
                            <Image
                              source={resolveImageSource(displayImg, apiBaseUrl)}
                              style={styles.productRealPhoto}
                              resizeMode="cover"
                            />
                          ) : (
                            <View style={styles.placardWrap}>
                              <View style={styles.placardHairline} />
                              <Text style={styles.placardDept}>
                                {departmentLabel(product.department).toUpperCase()}
                              </Text>
                              <View style={styles.placardMonogramCircle}>
                                <Text style={styles.placardMonogram}>
                                  {monogramFor(product.name)}
                                </Text>
                              </View>
                              <Text style={styles.placardNote}>{t.samplePhoto}</Text>
                            </View>
                          )}
                        </TouchableOpacity>
                        {product.badge ? (
                          <View style={styles.badgeTag}>
                            <Text style={styles.badgeTagText}>{product.badge}</Text>
                          </View>
                        ) : null}
                        {discountPct ? (
                          <View style={[styles.badgeTagBottom, { backgroundColor: COLORS.terracotta }]}>
                            <Text style={styles.badgeTagText}>-{discountPct}%</Text>
                          </View>
                        ) : null}
                        <TouchableOpacity
                          style={styles.heartButton}
                          onPress={() => toggleFavorite(product.id)}
                        >
                          <Text style={[styles.heartText, isSaved && styles.heartTextActive]}>
                            {isSaved ? '♥' : '♡'}
                          </Text>
                        </TouchableOpacity>
                      </View>

                      <View style={styles.cardMetaTopRow}>
                        <Text style={styles.cardMetaSource} numberOfLines={1}>
                          {product.brand || departmentLabel(product.department)}
                        </Text>
                        {product.rating ? (
                          <Text style={styles.ratingMini} numberOfLines={1}>
                            <Text style={{ color: COLORS.gold }}>★ </Text>
                            {product.rating}
                            {product.soldCount ? ` · ${product.soldCount} sold` : ''}
                          </Text>
                        ) : null}
                      </View>

                      <TouchableOpacity onPress={() => openProductDetails(product)}>
                        <Text style={styles.productName} numberOfLines={2}>
                          {language === 'en' ? product.name : product.nameAm}
                        </Text>
                      </TouchableOpacity>

                      <View style={styles.swatchRow}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                          {swatches.slice(0, 4).map((sw) => {
                            const activeSw = previewColor === sw.name;
                            return (
                              <TouchableOpacity
                                key={sw.name}
                                onPress={() =>
                                  setCardPreviewColors((prev) => ({
                                    ...prev,
                                    [product.id]: sw.name,
                                  }))
                                }
                                style={[
                                  styles.cardSwatchDot,
                                  { backgroundColor: sw.hex },
                                  activeSw && { borderColor: COLORS.terracotta, borderWidth: 2 },
                                ]}
                              />
                            );
                          })}
                        </View>
                        <Text style={styles.cardSizeSummary} numberOfLines={1}>
                          {product.sizes}
                        </Text>
                      </View>

                      <View style={styles.cardBottom}>
                        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6, flexWrap: 'wrap' }}>
                          <Text style={styles.price}>
                            ETB {product.price.toLocaleString('en-US')}
                          </Text>
                          {product.compareAtPrice && product.compareAtPrice > product.price ? (
                            <Text style={styles.strikePrice}>
                              {product.compareAtPrice.toLocaleString('en-US')}
                            </Text>
                          ) : null}
                        </View>
                      </View>

                      <View style={styles.cardActionsRow}>
                        <TouchableOpacity
                          style={[
                            styles.cardComparePill,
                            compareIds.includes(product.id) && styles.cardComparePillActive,
                          ]}
                          onPress={() => toggleCompare(product.id)}
                        >
                          <Text
                            style={[
                              styles.cardComparePillText,
                              compareIds.includes(product.id) && styles.cardComparePillTextActive,
                            ]}
                            numberOfLines={1}
                          >
                            ⚖️ {language === 'en' ? 'Compare' : 'አወዳድር'}
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.cardQuickAddPill}
                          onPress={() => {
                            const sizes = sizeOptions(product);
                            const colors = colorOptions(product, sizes[0]);
                            setSelectedSize(sizes[0] ?? null);
                            setSelectedColor(colors[0] ?? null);
                            setQuickAddProduct(product);
                          }}
                        >
                          <Text style={styles.cardQuickAddPillText} numberOfLines={1}>
                            + {language === 'en' ? 'Quick Add' : 'ጨምር'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}

            {/* Recently Viewed */}
            {activeTab === 'shop' && recentlyViewedProducts.length > 0 && (
              <View style={styles.featuredStrip}>
                <Text style={styles.sectionTitle}>{t.recentlyViewed}</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.featuredRow}
                >
                  {recentlyViewedProducts.map((item) => (
                    <TouchableOpacity
                      key={`recent-${item.id}`}
                      style={styles.featuredCard}
                      onPress={() => openProductDetails(item)}
                    >
                      {item.images?.[0] ? (
                        <Image
                          source={resolveImageSource(item.images[0], apiBaseUrl)}
                          style={styles.featuredImage}
                          resizeMode="cover"
                        />
                      ) : null}
                      <Text style={styles.featuredName} numberOfLines={1}>
                        {language === 'en' ? item.name : item.nameAm}
                      </Text>
                      <Text style={styles.featuredPrice}>
                        ETB {item.price.toLocaleString('en-US')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Boutique Footer Card (matches web preview) */}
            <View style={styles.footerCard}>
              <Text style={styles.footerTitle}>Belika Online Store</Text>
              <Text style={styles.footerCopy}>
                Bole Medhanialem, Addis Ababa, Ethiopia · Mon–Sat 9:00 AM – 8:00 PM
              </Text>
              <Text style={styles.footerSub}>
                7-day size exchange · Telebirr, CBE Birr & Cash on Delivery
              </Text>

              <Text style={styles.footerSectionLabel}>{t.departments.toUpperCase()}</Text>
              <View style={styles.footerChipsRow}>
                {(['Women', 'Men', 'Kids'] as Department[]).map((dep) => (
                  <TouchableOpacity
                    key={`foot-${dep}`}
                    style={styles.footerChip}
                    onPress={() => {
                      setDepartment(dep);
                      setSelectedCategory('All');
                      setSelectedSubcategory('All');
                      mainScrollRef.current?.scrollTo({ y: 0, animated: true });
                    }}
                  >
                    <Text style={styles.footerChipText}>{departmentLabel(dep)}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.footerSectionLabel}>
                {language === 'en' ? 'SUPPORT & CHANNELS' : 'ድጋፍ እና መገናኛ'}
              </Text>
              <View style={styles.footerChipsRow}>
                <TouchableOpacity
                  style={styles.footerChip}
                  onPress={() => {
                    setSupportFeedback(null);
                    setShowSupportModal(true);
                  }}
                >
                  <Text style={styles.footerChipText}>
                    💬 {language === 'en' ? 'Customer Support' : 'የደንበኞች ድጋፍ'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.footerChip}
                  onPress={() => void openExternalUrl(branches.Women.telegramChannel, 'Telegram')}
                >
                  <Text style={styles.footerChipText}>✈️ Telegram</Text>
                </TouchableOpacity>
                {isStaffUser ? (
                  <TouchableOpacity
                    style={styles.footerStaffBtn}
                    onPress={() => setShowStaff(true)}
                  >
                    <Text style={styles.footerStaffBtnText}>
                      {language === 'en' ? 'Merchant Studio' : 'የነጋዴ ክፍል'}
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={styles.footerChip}
                    onPress={() => {
                      setAuthError(null);
                      setShowAuthModal(true);
                    }}
                  >
                    <Text style={styles.footerChipText}>
                      👤 {currentUser ? currentUser.name : language === 'en' ? 'Account / Sign In' : 'መለያ / ግባ'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            <Text style={styles.demoNote}>{t.demo}</Text>
          </ScrollView>
        ) : (
          /* Cart Tab View + Local Order History */
          <View style={styles.cartTabContainer}>
            {cartItems.length === 0 ? (
              <ScrollView contentContainerStyle={styles.cartContent}>
                <View style={styles.emptyCartBox}>
                  <View style={styles.emptyBadge}>
                    <BoutiqueBagIcon color={COLORS.terracotta} />
                  </View>
                  <Text style={styles.emptyText}>{t.emptyCart}</Text>
                  <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={() => setActiveTab('shop')}
                  >
                    <Text style={styles.primaryButtonText}>{t.bannerButton}</Text>
                  </TouchableOpacity>
                </View>

                {orders.length > 0 && (
                  <View style={styles.historyBlock}>
                    <Text style={styles.sectionTitle}>{t.myOrders}</Text>
                    {orders.slice(0, 6).map((ord) => (
                      <TouchableOpacity
                        key={`hist-${ord.id}`}
                        style={styles.staffCard}
                        onPress={() => setTrackingOrder(ord)}
                      >
                        <Text style={styles.staffCardTitle}>
                          {ord.id} · {ord.status.toUpperCase()} ›
                        </Text>
                        <Text style={styles.staffMeta}>
                          ETB {ord.total.toLocaleString('en-US')} ·{' '}
                          {ord.paymentMethod ? `${ord.paymentMethod.toUpperCase()} · ` : ''}
                          {ord.fulfillment === 'pickup' ? t.pickup : ord.deliveryAddress}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </ScrollView>
            ) : (
              <>
                <ScrollView contentContainerStyle={styles.cartContent}>
                  <Text style={styles.sectionTitle}>{t.cartTitle}</Text>

                  {/* Free Delivery Progress Bar */}
                  <View style={styles.freeDeliveryBar}>
                    <Text style={styles.freeDeliveryText}>
                      {qualifiesForFreeDelivery
                        ? language === 'en'
                          ? '🎉 Unlocked FREE Addis Delivery (ETB 5,000+)'
                          : '🎉 ነፃ የአዲስ አበባ ማድረስ ተከፍቷል!'
                        : language === 'en'
                          ? `Add ETB ${(FREE_DELIVERY_THRESHOLD - cartSubtotal).toLocaleString('en-US')} more for FREE Addis delivery`
                          : `ለነፃ ማድረስ ${(FREE_DELIVERY_THRESHOLD - cartSubtotal).toLocaleString('en-US')} ብር ይጨምሩ`}
                    </Text>
                    <View style={styles.progressTrack}>
                      <View
                        style={[
                          styles.progressFill,
                          { width: `${Math.min(100, Math.round((cartSubtotal / FREE_DELIVERY_THRESHOLD) * 100))}%` },
                        ]}
                      />
                    </View>
                  </View>

                  <View style={{ height: 10 }} />
                  {cartItems.map((item) => {
                    const product = products.find((candidate) => candidate.id === item.productId);
                    if (!product) return null;
                    return (
                      <View key={item.id} style={styles.cartItem}>
                        <View style={[styles.cartThumb, { backgroundColor: product.tint }]}>
                          {product.images && product.images.length > 0 ? (
                            <Image
                              source={resolveImageSource(product.images[0], apiBaseUrl)}
                              style={styles.cartThumbImage}
                              resizeMode="cover"
                            />
                          ) : (
                            <Text style={styles.placardMonogram}>
                              {monogramFor(product.name)}
                            </Text>
                          )}
                        </View>
                        <View style={styles.cartItemInfo}>
                          <Text style={styles.cartItemName}>
                            {language === 'en' ? product.name : product.nameAm}
                          </Text>
                          <Text style={styles.cartItemMeta}>
                            {`${t.sizes}: ${item.size} · ${item.color}`}
                          </Text>
                          {item.customNote ? (
                            <Text style={styles.customNoteTag}>{item.customNote}</Text>
                          ) : null}
                          <Text style={styles.cartItemPrice}>
                            ETB {(product.price * item.quantity).toLocaleString('en-US')}
                          </Text>
                          <View style={styles.cartControls}>
                            <TouchableOpacity
                              style={styles.quantityButton}
                              onPress={() => changeCartQuantity(item.id, -1)}
                            >
                              <Text style={styles.quantityButtonText}>−</Text>
                            </TouchableOpacity>
                            <Text style={styles.quantityText}>{item.quantity}</Text>
                            <TouchableOpacity
                              style={styles.quantityButton}
                              onPress={() => changeCartQuantity(item.id, 1)}
                            >
                              <Text style={styles.quantityButtonText}>+</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={styles.removeButton}
                              onPress={() => removeCartItem(item.id)}
                            >
                              <Text style={styles.removeText}>{t.remove}</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      </View>
                    );
                  })}

                  {/* Promo Code Box */}
                  <View style={styles.guidanceCard}>
                    <Text style={styles.guidanceTitle}>
                      {language === 'en' ? 'Promo Code & Savings' : 'የቅናሽ ኮድ'}
                    </Text>
                    <View style={{ flexDirection: 'row', gap: 6, marginTop: 6 }}>
                      <TextInput
                        value={promoInput}
                        onChangeText={setPromoInput}
                        placeholder="BELIKA10"
                        placeholderTextColor={COLORS.muted}
                        autoCapitalize="characters"
                        style={[styles.inlineInput, { flex: 1 }]}
                      />
                      <TouchableOpacity
                        style={styles.primarySmallButton}
                        onPress={() => applyPromoCode()}
                      >
                        <Text style={styles.primarySmallButtonText}>
                          {language === 'en' ? 'Apply' : 'ተግብር'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
                      {promos.filter((p) => p.active).map((p) => (
                        <TouchableOpacity
                          key={p.code}
                          onPress={() => applyPromoCode(p.code)}
                          style={[
                            styles.miniChip,
                            appliedPromoCode === p.code && styles.miniChipActive,
                          ]}
                        >
                          <Text
                            style={[
                              styles.miniChipText,
                              appliedPromoCode === p.code && styles.miniChipTextActive,
                            ]}
                          >
                            {p.code}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                    {promoFeedback ? <Text style={styles.staffMeta}>{promoFeedback}</Text> : null}
                  </View>
                </ScrollView>
                <View style={styles.cartFooter}>
                  <View style={styles.cartSubtotalRow}>
                    <Text style={styles.cartSubtotalLabel}>{t.subtotal}</Text>
                    <Text style={styles.cartSubtotalValue}>
                      ETB {(cartSubtotal - promoDiscountAmount).toLocaleString('en-US')}
                    </Text>
                  </View>
                  {promoDiscountAmount > 0 && (
                    <Text style={[styles.staffMeta, { color: COLORS.terracotta }]}>
                      ✓ Promo {appliedPromoCode}: −ETB {promoDiscountAmount.toLocaleString('en-US')}
                    </Text>
                  )}
                  <TouchableOpacity
                    style={styles.orderRequestButton}
                    onPress={() => setShowOrderRequest(true)}
                  >
                    <Text style={styles.orderRequestButtonText}>{t.orderRequest}</Text>
                  </TouchableOpacity>
                  <Text style={styles.checkoutNote}>{t.checkoutLater}</Text>
                </View>
              </>
            )}
          </View>
        )}

        {/* Floating Compare Tray */}
        {compareIds.length > 0 && activeTab !== 'cart' && (
          <View style={styles.compareTray}>
            <View style={{ flex: 1 }}>
              <Text style={styles.compareTrayTitle}>
                ⚖️ {language === 'en' ? `Compare (${compareIds.length}/2)` : `ንጽጽር (${compareIds.length}/2)`}
              </Text>
              <Text style={styles.compareTraySub} numberOfLines={1}>
                {compareProducts.map((p) => (language === 'en' ? p.name : p.nameAm)).join(' vs ')}
              </Text>
            </View>
            {compareIds.length === 2 && (
              <TouchableOpacity
                style={styles.compareNowBtn}
                onPress={() => setShowCompareModal(true)}
              >
                <Text style={styles.compareNowText}>
                  {language === 'en' ? 'Compare' : 'አወዳድር'}
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={() => setCompareIds([])} style={styles.compareClearBtn}>
              <Text style={styles.compareClearText}>×</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Bottom Tab Bar */}
        <View style={styles.bottomBar}>
          <TouchableOpacity style={styles.bottomTab} onPress={() => setActiveTab('shop')}>
            {activeTab === 'shop' && <View style={styles.bottomActiveIndicator} />}
            <BoutiqueHomeIcon color={activeTab === 'shop' ? COLORS.forest : COLORS.muted} />
            <Text style={[styles.bottomTabLabel, activeTab === 'shop' && styles.bottomTabActiveText]}>
              {t.shop}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.bottomTab} onPress={() => setActiveTab('wishlist')}>
            {activeTab === 'wishlist' && <View style={styles.bottomActiveIndicator} />}
            <View style={styles.tabIconWrap}>
              <Text
                style={[
                  styles.bottomHeartGlyph,
                  activeTab === 'wishlist' && { color: COLORS.terracotta },
                ]}
              >
                {activeTab === 'wishlist' ? '♥' : '♡'}
              </Text>
              {favorites.length > 0 && (
                <View style={styles.tabBadge}>
                  <Text style={styles.tabBadgeText}>{favorites.length}</Text>
                </View>
              )}
            </View>
            <Text
              style={[styles.bottomTabLabel, activeTab === 'wishlist' && styles.bottomTabActiveText]}
            >
              {t.wishlist}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.bottomTab} onPress={() => setActiveTab('cart')}>
            {activeTab === 'cart' && <View style={styles.bottomActiveIndicator} />}
            <View style={styles.tabIconWrap}>
              <BoutiqueBagIcon color={activeTab === 'cart' ? COLORS.forest : COLORS.muted} />
              {cartCount > 0 && (
                <View style={styles.tabBadge}>
                  <Text style={styles.tabBadgeText}>{cartCount}</Text>
                </View>
              )}
            </View>
            <Text style={[styles.bottomTabLabel, activeTab === 'cart' && styles.bottomTabActiveText]}>
              {t.bag}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Quick-Add Sheet Modal */}
        <Modal
          visible={quickAddProduct !== null}
          transparent
          animationType="fade"
          onRequestClose={() => setQuickAddProduct(null)}
        >
          <View style={styles.quickModalOverlay}>
            {quickAddProduct && (
              <View style={styles.quickModalCard}>
                <View style={styles.filterPanelHead}>
                  <Text style={styles.detailName} numberOfLines={1}>
                    {language === 'en' ? quickAddProduct.name : quickAddProduct.nameAm}
                  </Text>
                  <TouchableOpacity onPress={() => setQuickAddProduct(null)}>
                    <Text style={styles.clearSearchText}>×</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.price}>ETB {quickAddProduct.price.toLocaleString('en-US')}</Text>

                <Text style={styles.filterSubLabel}>{t.chooseSize}</Text>
                <View style={styles.sizeRow}>
                  {sizeOptions(quickAddProduct).map((sz) => (
                    <TouchableOpacity
                      key={sz}
                      onPress={() => {
                        setSelectedSize(sz);
                        const c = colorOptions(quickAddProduct, sz);
                        if (!c.includes(selectedColor ?? '')) setSelectedColor(c[0] ?? null);
                      }}
                      style={[styles.sizeChip, selectedSize === sz && styles.sizeChipActive]}
                    >
                      <Text style={[styles.sizeChipText, selectedSize === sz && styles.sizeChipTextActive]}>
                        {sz}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.filterSubLabel}>{t.colors}</Text>
                <View style={styles.sizeRow}>
                  {colorOptions(quickAddProduct, selectedSize).map((col) => (
                    <TouchableOpacity
                      key={col}
                      onPress={() => setSelectedColor(col)}
                      style={[styles.colorChip, selectedColor === col && styles.sizeChipActive]}
                    >
                      <View style={[styles.colorSwatchDot, { backgroundColor: colorSwatchHex(col) }]} />
                      <Text style={[styles.sizeChipText, selectedColor === col && styles.sizeChipTextActive]}>
                        {col}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={styles.staffActions}>
                  <TouchableOpacity
                    style={[styles.primaryButton, { flex: 1 }]}
                    onPress={() => {
                      if (addToCart(quickAddProduct, selectedSize, selectedColor, 1)) {
                        setQuickAddProduct(null);
                        setActiveTab('cart');
                      }
                    }}
                  >
                    <Text style={styles.primaryButtonText}>{t.addToCart}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.secondarySmallButton, { marginTop: 16, minHeight: 48 }]}
                    onPress={() => {
                      const prod = quickAddProduct;
                      setQuickAddProduct(null);
                      openProductDetails(prod);
                    }}
                  >
                    <Text style={styles.secondarySmallButtonText}>{t.viewDetails}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </Modal>

        {/* Side-by-Side Comparison Modal */}
        <Modal
          visible={showCompareModal}
          animationType="slide"
          onRequestClose={() => setShowCompareModal(false)}
        >
          <View style={styles.modalSafe}>
            <View style={styles.detailHeader}>
              <TouchableOpacity onPress={() => setShowCompareModal(false)} style={styles.backButton}>
                <Text style={styles.backText}>‹</Text>
              </TouchableOpacity>
              <Text style={styles.detailHeaderTitle}>
                {language === 'en' ? 'Side-by-Side Compare' : 'ምርቶችን ማወዳደሪያ'}
              </Text>
              <View style={styles.backButton} />
            </View>
            <ScrollView contentContainerStyle={styles.detailContent}>
              {compareProducts.length < 2 ? (
                <Text style={styles.emptyText}>Select 2 products to compare specs and pricing.</Text>
              ) : (
                <>
                  <View style={styles.compareColsRow}>
                    {compareProducts.map((p) => (
                      <TouchableOpacity
                        key={`cmp-head-${p.id}`}
                        style={styles.compareColCard}
                        onPress={() => {
                          setShowCompareModal(false);
                          openProductDetails(p);
                        }}
                      >
                        {p.images?.[0] ? (
                          <Image
                            source={resolveImageSource(p.images[0], apiBaseUrl)}
                            style={styles.compareColImg}
                            resizeMode="cover"
                          />
                        ) : (
                          <View style={[styles.compareColImg, { alignItems: 'center', justifyContent: 'center', backgroundColor: p.tint }]}>
                            <Text style={styles.placardMonogram}>{monogramFor(p.name)}</Text>
                          </View>
                        )}
                        <Text style={styles.staffCardTitle} numberOfLines={2}>
                          {language === 'en' ? p.name : p.nameAm}
                        </Text>
                        <Text style={styles.price}>ETB {p.price.toLocaleString('en-US')}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {[
                    {
                      label: language === 'en' ? 'Department & Category' : 'ክፍል እና ምድብ',
                      vals: compareProducts.map((p) => `${p.department} · ${p.category}`),
                    },
                    {
                      label: language === 'en' ? 'Material / Fabric' : 'ጨርቅ',
                      vals: compareProducts.map((p) => p.fabric || 'Boutique Quality'),
                    },
                    {
                      label: language === 'en' ? 'Care Instructions' : 'ጥንቃቄ',
                      vals: compareProducts.map((p) => p.careInstructions || 'Gentle wash'),
                    },
                    {
                      label: language === 'en' ? 'Sizes & Fit' : 'መጠን',
                      vals: compareProducts.map((p) => `${p.sizes} · ${p.sizeGuidance || ''}`),
                    },
                    {
                      label: language === 'en' ? 'Rating & Popularity' : 'ደረጃ',
                      vals: compareProducts.map(
                        (p) => `★ ${p.rating ?? 4.8} (${p.reviewCount ?? 0}) · ${p.soldCount ?? 0} sold`,
                      ),
                    },
                    {
                      label: language === 'en' ? 'Total Available Stock' : 'ቀሪ ክምችት',
                      vals: compareProducts.map(
                        (p) => `${(p.variants ?? []).reduce((s, v) => s + v.stock, 0)} pcs`,
                      ),
                    },
                  ].map((row) => (
                    <View key={row.label} style={styles.compareSpecRow}>
                      <Text style={styles.compareSpecLabel}>{row.label}</Text>
                      <View style={styles.compareColsRow}>
                        <Text style={[styles.compareSpecVal, { flex: 1 }]}>{row.vals[0]}</Text>
                        <Text style={[styles.compareSpecVal, { flex: 1 }]}>{row.vals[1]}</Text>
                      </View>
                    </View>
                  ))}
                </>
              )}
            </ScrollView>
          </View>
        </Modal>

        {/* AI Camera Visual Search Modal */}
        <Modal
          visible={showCameraModal}
          animationType="slide"
          onRequestClose={() => setShowCameraModal(false)}
        >
          <View style={styles.modalSafe}>
            <View style={styles.detailHeader}>
              <TouchableOpacity onPress={() => setShowCameraModal(false)} style={styles.backButton}>
                <Text style={styles.backText}>‹</Text>
              </TouchableOpacity>
              <Text style={styles.detailHeaderTitle}>
                {language === 'en' ? 'AI Camera & Color Search' : 'የAI ካሜራ ፍለጋ'}
              </Text>
              <View style={styles.backButton} />
            </View>

            <ScrollView contentContainerStyle={styles.detailContent}>
              <View style={styles.staffActions}>
                <TouchableOpacity
                  style={styles.primarySmallButton}
                  onPress={() => void pickImageForVisualSearch('camera')}
                >
                  <Text style={styles.primarySmallButtonText}>
                    📷 {language === 'en' ? 'Take Outfit Photo' : 'በካሜራ አንሳ'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.secondarySmallButton}
                  onPress={() => void pickImageForVisualSearch('gallery')}
                >
                  <Text style={styles.secondarySmallButtonText}>
                    🖼️ {language === 'en' ? 'Choose Photo' : 'ከጋለሪ ምረጥ'}
                  </Text>
                </TouchableOpacity>
              </View>

              {visualPreviewUri && (
                <Image
                  source={{ uri: visualPreviewUri }}
                  style={styles.visualSearchPreview}
                  resizeMode="cover"
                />
              )}

              {visualLoading && (
                <View style={styles.loadingBox}>
                  <ActivityIndicator color={COLORS.forest} />
                  <Text style={styles.staffMeta}>
                    {language === 'en'
                      ? 'Recognizing garment & identifying colors…'
                      : 'ልብሱንና ቀለሞቹን በመለየት ላይ…'}
                  </Text>
                </View>
              )}

              {visualError ? <Text style={styles.localWarning}>{visualError}</Text> : null}

              {visualResult && (
                <View style={styles.guidanceCard}>
                  <Text style={styles.detailEyebrow}>
                    {visualResult.department} · {visualResult.category}
                  </Text>
                  <Text style={styles.detailName}>
                    {language === 'en' ? visualResult.detectedItem : visualResult.detectedItemAm}
                  </Text>
                  <Text style={styles.filterSubLabel}>{t.colors}</Text>
                  <View style={styles.sizeRow}>
                    {visualResult.colors.map((c, idx) => (
                      <TouchableOpacity
                        key={`${c.name}-${idx}`}
                        style={styles.colorChip}
                        onPress={() => {
                          setColorFilter(c.name);
                          setShowFilters(true);
                          setShowCameraModal(false);
                        }}
                      >
                        <View style={[styles.colorSwatchDot, { backgroundColor: c.hex }]} />
                        <Text style={styles.sizeChipText}>
                          {language === 'en' ? c.name : c.nameAm}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={styles.detailSizeLabel}>
                    {language === 'en' ? 'Matching Shop Items' : 'ተመሳሳይ የሱቅ እቃዎች'}
                  </Text>
                  {visualResult.matches.map((m) => {
                    const prod = publishedProducts.find((p) => p.id === m.id);
                    if (!prod) return null;
                    return (
                      <TouchableOpacity
                        key={m.id}
                        style={styles.matchRowCardHorizontal}
                        onPress={() => {
                          setShowCameraModal(false);
                          openProductDetails(prod);
                        }}
                      >
                        {prod.images?.[0] ? (
                          <Image
                            source={resolveImageSource(prod.images[0], apiBaseUrl)}
                            style={styles.matchThumbImage}
                            resizeMode="cover"
                          />
                        ) : (
                          <View style={[styles.matchThumbImage, { alignItems: 'center', justifyContent: 'center', backgroundColor: prod.tint }]}>
                            <Text style={styles.placardMonogram}>{monogramFor(prod.name)}</Text>
                          </View>
                        )}
                        <View style={{ flex: 1 }}>
                          <Text style={styles.staffCardTitle} numberOfLines={2}>
                            {language === 'en' ? prod.name : prod.nameAm}
                          </Text>
                          <Text style={styles.price}>ETB {prod.price.toLocaleString('en-US')}</Text>
                          <Text style={styles.staffMeta} numberOfLines={2}>
                            {m.score}% match · {language === 'en' ? m.reason : m.reasonAm}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </ScrollView>
          </View>
        </Modal>

        {/* Product Detail Modal */}
        <Modal
          visible={selectedProduct !== null}
          animationType="slide"
          onRequestClose={() => setSelectedProduct(null)}
        >
          <GestureHandlerRootView style={styles.gestureRoot}>
            <View style={styles.modalSafe}>
              {selectedProduct && (
                <>
                  <View style={styles.detailHeader}>
                    <TouchableOpacity
                      onPress={() => setSelectedProduct(null)}
                      style={styles.backButton}
                    >
                      <Text style={styles.backText}>‹</Text>
                    </TouchableOpacity>
                    <Text style={styles.detailHeaderTitle}>{t.details}</Text>
                    <View style={{ flexDirection: 'row', gap: 6 }}>
                      <TouchableOpacity
                        onPress={() => void shareProduct(selectedProduct)}
                        style={styles.backButton}
                      >
                        <Text style={styles.heartText}>↗</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => toggleFavorite(selectedProduct.id)}
                        style={styles.backButton}
                      >
                        <Text
                          style={[
                            styles.heartText,
                            favorites.includes(selectedProduct.id) && styles.heartTextActive,
                          ]}
                        >
                          {favorites.includes(selectedProduct.id) ? '♥' : '♡'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <ScrollView contentContainerStyle={styles.detailContent}>
                    <View style={[styles.detailPhoto, { backgroundColor: selectedProduct.tint }]}>
                      {selectedProduct.images && selectedProduct.images.length > 0 ? (
                        <ScrollView
                          ref={galleryScrollRef}
                          horizontal
                          pagingEnabled
                          scrollEnabled={!isImageZoomed}
                          showsHorizontalScrollIndicator={false}
                          onMomentumScrollEnd={(event) => {
                            const index = Math.round(
                              event.nativeEvent.contentOffset.x / GALLERY_WIDTH,
                            );
                            setSelectedImageIndex(index);
                            setIsImageZoomed(false);
                          }}
                        >
                          {selectedProduct.images.map((img, idx) => (
                            <View
                              key={`${selectedProduct.id}-slide-${idx}`}
                              style={{ width: GALLERY_WIDTH, height: 310 }}
                            >
                              <ZoomablePhoto
                                source={resolveImageSource(img, apiBaseUrl)}
                                resizeMode="cover"
                                onZoomChange={setIsImageZoomed}
                              />
                            </View>
                          ))}
                        </ScrollView>
                      ) : (
                        <View style={styles.placardWrap}>
                          <View style={styles.placardHairline} />
                          <Text style={styles.placardDept}>
                            {departmentLabel(selectedProduct.department).toUpperCase()}
                          </Text>
                          <View style={styles.placardMonogramLarge}>
                            <Text style={styles.placardMonogramLargeText}>
                              {monogramFor(selectedProduct.name)}
                            </Text>
                          </View>
                          <Text style={styles.placardNote}>{t.samplePhoto}</Text>
                        </View>
                      )}

                      {selectedProduct.images && selectedProduct.images.length > 1 && (
                        <>
                          <View style={styles.dotsOverlay}>
                            {selectedProduct.images.map((_, dotIdx) => (
                              <View
                                key={`dot-${dotIdx}`}
                                style={[
                                  styles.galleryDot,
                                  selectedImageIndex === dotIdx && styles.galleryDotActive,
                                ]}
                              />
                            ))}
                          </View>
                          <View style={styles.photoCounter}>
                            <Text style={styles.photoCounterText}>
                              {selectedImageIndex + 1} / {selectedProduct.images.length}
                            </Text>
                          </View>
                        </>
                      )}
                    </View>

                    {selectedProduct.images && selectedProduct.images.length > 1 && (
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={styles.galleryRow}
                      >
                        {selectedProduct.images.map((image, index) => (
                          <TouchableOpacity
                            key={index}
                            onPress={() => {
                              setSelectedImageIndex(index);
                              galleryScrollRef.current?.scrollTo({
                                x: index * GALLERY_WIDTH,
                                animated: true,
                              });
                            }}
                            style={[
                              styles.galleryThumb,
                              selectedImageIndex === index && styles.galleryThumbActive,
                            ]}
                          >
                            <Image
                              source={resolveImageSource(image, apiBaseUrl)}
                              style={styles.galleryThumbImage}
                              resizeMode="cover"
                            />
                            <Text style={styles.galleryCaption}>
                              {selectedProduct.imageLabels?.[index] ?? ''}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    )}

                    <View style={styles.detailTitleRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.detailEyebrow}>
                          {selectedProduct.brand ? `${selectedProduct.brand.toUpperCase()} · ` : ''}
                          {departmentLabel(selectedProduct.department).toUpperCase()} ·{' '}
                          {selectedProduct.category}
                          {selectedProduct.subcategory ? ` · ${selectedProduct.subcategory}` : ''}
                        </Text>
                        <Text style={styles.detailName}>
                          {language === 'en' ? selectedProduct.name : selectedProduct.nameAm}
                        </Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
                          <Text style={styles.detailPriceInline}>
                            ETB {selectedProduct.price.toLocaleString('en-US')}
                          </Text>
                          {(() => {
                            const totalProductStock = (selectedProduct.variants ?? []).reduce(
                              (sum, v) => sum + v.stock,
                              0,
                            );
                            const activeStock = selectedVariant ? selectedVariant.stock : totalProductStock;
                            const inStock = activeStock > 0;
                            return (
                              <View style={[styles.stockPill, !inStock && styles.stockPillEmpty, { marginTop: 0 }]}>
                                <Text style={[styles.stockPillText, !inStock && styles.stockPillEmptyText]}>
                                  {inStock
                                    ? language === 'en'
                                      ? `In Stock (${activeStock})`
                                      : `በክምችት አለ (${activeStock})`
                                    : t.outOfStock}
                                </Text>
                              </View>
                            );
                          })()}
                          <Text style={styles.staffMeta}>
                            ★ {selectedProduct.rating ?? 4.8} ({selectedProduct.reviewCount ?? 0})
                          </Text>
                        </View>
                      </View>
                    </View>

                    <Text style={styles.detailSizeLabel}>{t.chooseSize}</Text>
                    <View style={styles.sizeRow}>
                      {sizeOptions(selectedProduct).map((size) => (
                        <TouchableOpacity
                          key={size}
                          onPress={() => {
                            setSelectedSize(size);
                            const availableColors = colorOptions(selectedProduct, size);
                            if (availableColors.length === 1) {
                              const c = availableColors[0];
                              setSelectedColor(c);
                              const idx = resolveImageIndexForColor(selectedProduct, c);
                              setSelectedImageIndex(idx);
                              galleryScrollRef.current?.scrollTo({ x: idx * GALLERY_WIDTH, animated: true });
                            } else if (!availableColors.includes(selectedColor ?? '')) {
                              setSelectedColor(null);
                            }
                          }}
                          style={[styles.sizeChip, selectedSize === size && styles.sizeChipActive]}
                        >
                          <Text
                            style={[
                              styles.sizeChipText,
                              selectedSize === size && styles.sizeChipTextActive,
                            ]}
                          >
                            {size}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    <Text style={styles.detailSizeLabel}>{t.colors}</Text>
                    <View style={styles.sizeRow}>
                      {colorOptions(selectedProduct, selectedSize).map((color) => {
                        const swatchHex =
                          selectedProduct.colorSwatches?.find(
                            (s) => s.name.toLowerCase() === color.toLowerCase(),
                          )?.hex ?? colorSwatchHex(color);
                        return (
                          <TouchableOpacity
                            key={color}
                            onPress={() => {
                              setSelectedColor(color);
                              const imgIdx = resolveImageIndexForColor(selectedProduct, color);
                              setSelectedImageIndex(imgIdx);
                              setIsImageZoomed(false);
                              galleryScrollRef.current?.scrollTo({
                                x: imgIdx * GALLERY_WIDTH,
                                animated: true,
                              });
                            }}
                            style={[
                              styles.colorChip,
                              selectedColor === color && styles.sizeChipActive,
                            ]}
                          >
                            <View style={[styles.colorSwatchDot, { backgroundColor: swatchHex }]} />
                            <Text
                              style={[
                                styles.sizeChipText,
                                selectedColor === color && styles.sizeChipTextActive,
                              ]}
                            >
                              {color}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>

                    <View style={styles.pdpQtyRow}>
                      <View>
                        <Text style={styles.detailSizeLabel}>
                          {language === 'en' ? 'Quantity' : 'ብዛት'}
                        </Text>
                        {selectedVariant && (
                          <Text style={styles.staffMeta}>
                            {selectedVariant.stock} {t.remaining}
                          </Text>
                        )}
                      </View>
                      <View style={styles.cartControls}>
                        <TouchableOpacity
                          style={styles.quantityButton}
                          onPress={() => setPdpQty((q) => Math.max(1, q - 1))}
                        >
                          <Text style={styles.quantityButtonText}>−</Text>
                        </TouchableOpacity>
                        <Text style={styles.quantityText}>{pdpQty}</Text>
                        <TouchableOpacity
                          style={styles.quantityButton}
                          onPress={() => setPdpQty((q) => Math.min(selectedVariant?.stock ?? 10, q + 1))}
                        >
                          <Text style={styles.quantityButtonText}>+</Text>
                        </TouchableOpacity>
                      </View>
                    </View>

                    <Text style={styles.detailSizeLabel}>{t.customFitLabel}</Text>
                    <TextInput
                      value={customFitNote}
                      onChangeText={setCustomFitNote}
                      placeholder={t.customFitPlaceholder}
                      placeholderTextColor={COLORS.muted}
                      style={styles.formInput}
                    />

                    {/* PDP 3 Tabs: Overview / Size Guide / Reviews */}
                    <View style={styles.pdpTabsBar}>
                      {(
                        [
                          { id: 'overview', label: language === 'en' ? 'Specs & Care' : 'መረጃ' },
                          { id: 'size-guide', label: language === 'en' ? 'Size Guide' : 'የልክ ሰንጠረዥ' },
                          {
                            id: 'reviews',
                            label: `${language === 'en' ? 'Reviews' : 'ግምገማ'} (${selectedProduct.reviews?.length ?? 0})`,
                          },
                        ] as const
                      ).map((tab) => (
                        <TouchableOpacity
                          key={tab.id}
                          onPress={() => setPdpTab(tab.id)}
                          style={[styles.pdpTabBtn, pdpTab === tab.id && styles.pdpTabBtnActive]}
                        >
                          <Text
                            style={[
                              styles.pdpTabText,
                              pdpTab === tab.id && styles.pdpTabTextActive,
                            ]}
                          >
                            {tab.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    {pdpTab === 'overview' && (
                      <View style={styles.guidanceCard}>
                        <Text style={styles.guidanceTitle}>{t.sizeGuidance}</Text>
                        <Text style={styles.detailNote}>
                          {language === 'en'
                            ? selectedProduct.sizeGuidance ?? t.sizeHelp
                            : selectedProduct.sizeGuidanceAm ?? t.sizeHelp}
                        </Text>
                        {selectedProduct.fabric ? (
                          <Text style={styles.detailNote}>
                            🧵 {selectedProduct.fabric}
                            {selectedProduct.measurements ? ` · ${selectedProduct.measurements}` : ''}
                          </Text>
                        ) : null}
                        {selectedProduct.careInstructions ? (
                          <Text style={styles.detailNote}>🧼 {selectedProduct.careInstructions}</Text>
                        ) : null}
                        <Text style={styles.detailNote}>✓ 7-day Bole Boutique size exchange</Text>
                      </View>
                    )}

                    {pdpTab === 'size-guide' && (
                      <View style={styles.guidanceCard}>
                        <View style={styles.filterPanelHead}>
                          <Text style={styles.guidanceTitle}>
                            {language === 'en' ? 'Belika Sizing Chart' : 'የቤሊካ የመጠን ሰንጠረዥ'}
                          </Text>
                          <View style={styles.langSwitch}>
                            {(['cm', 'in'] as const).map((u) => (
                              <TouchableOpacity
                                key={u}
                                onPress={() => setSizeUnit(u)}
                                style={[styles.langOption, sizeUnit === u && styles.langOptionActive]}
                              >
                                <Text style={[styles.languageText, sizeUnit === u && styles.languageTextActive]}>
                                  {u.toUpperCase()}
                                </Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                        </View>
                        {selectedProduct.category.toLowerCase().includes('shoe')
                          ? SIZE_GUIDE_CHARTS.shoes.map((row) => (
                              <View key={row.eu} style={styles.summaryRow}>
                                <Text style={styles.staffCardTitle}>EU {row.eu}</Text>
                                <Text style={styles.staffMeta}>
                                  {sizeUnit === 'cm' ? `${row.cm} cm` : `${(Number(row.cm) / 2.54).toFixed(1)} in`} · UK {row.uk}
                                </Text>
                              </View>
                            ))
                          : SIZE_GUIDE_CHARTS.apparel.map((row) => (
                              <View key={row.size} style={styles.summaryRow}>
                                <Text style={styles.staffCardTitle}>{row.size}</Text>
                                <Text style={styles.staffMeta}>
                                  Chest {row.chestCm}cm · Waist {row.waistCm}cm · Len {row.lengthCm}cm
                                </Text>
                              </View>
                            ))}
                      </View>
                    )}

                    {pdpTab === 'reviews' && (
                      <View style={styles.guidanceCard}>
                        <Text style={styles.guidanceTitle}>
                          {language === 'en' ? 'Customer Fit Feedback' : 'የደንበኞች አስተያየት'}
                        </Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.miniChipRow}>
                          {(
                            [
                              { id: 'all', label: t.all },
                              { id: 'true-to-size', label: 'True to Size' },
                              { id: 'runs-small', label: 'Runs Small' },
                              { id: 'runs-large', label: 'Runs Large' },
                            ] as const
                          ).map((rf) => (
                            <TouchableOpacity
                              key={rf.id}
                              onPress={() => setReviewFilter(rf.id)}
                              style={[styles.miniChip, reviewFilter === rf.id && styles.miniChipActive]}
                            >
                              <Text
                                style={[
                                  styles.miniChipText,
                                  reviewFilter === rf.id && styles.miniChipTextActive,
                                ]}
                              >
                                {rf.label}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>

                        {(selectedProduct.reviews ?? [])
                          .filter((r) => reviewFilter === 'all' || r.fit === reviewFilter)
                          .map((r) => (
                            <View key={r.id} style={styles.reviewItemBox}>
                              <Text style={styles.staffCardTitle}>
                                {r.author} · {'★'.repeat(r.rating)} · {r.fit}
                              </Text>
                              <Text style={styles.staffMeta}>{r.comment}</Text>
                            </View>
                          ))}

                        <TextInput
                          value={reviewAuthor}
                          onChangeText={setReviewAuthor}
                          placeholder={language === 'en' ? 'Your name' : 'ስምዎ'}
                          placeholderTextColor={COLORS.muted}
                          style={styles.formInput}
                        />
                        <TextInput
                          value={reviewComment}
                          onChangeText={setReviewComment}
                          placeholder={language === 'en' ? 'Share fit & fabric feedback…' : 'አስተያየት ይጻፉ…'}
                          placeholderTextColor={COLORS.muted}
                          style={styles.formInput}
                        />
                        <View style={styles.sizeRow}>
                          {(['runs-small', 'true-to-size', 'runs-large'] as const).map((fitOpt) => (
                            <TouchableOpacity
                              key={fitOpt}
                              onPress={() => setReviewFit(fitOpt)}
                              style={[styles.miniChip, reviewFit === fitOpt && styles.miniChipActive]}
                            >
                              <Text style={[styles.miniChipText, reviewFit === fitOpt && styles.miniChipTextActive]}>
                                {fitOpt}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                        <TouchableOpacity style={styles.primarySmallButton} onPress={submitProductReview}>
                          <Text style={styles.primarySmallButtonText}>
                            {language === 'en' ? 'Post Review' : 'ግምገማ ላክ'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    )}

                    {/* Complete the Look & Similar Pieces */}
                    {(() => {
                      const related = publishedProducts
                        .filter(
                          (cand) =>
                            cand.id !== selectedProduct.id &&
                            (cand.department === selectedProduct.department ||
                              cand.category === selectedProduct.category),
                        )
                        .slice(0, 6);
                      if (related.length === 0) return null;
                      return (
                        <View style={{ marginTop: 20 }}>
                          <Text style={styles.detailSizeLabel}>
                            {language === 'en'
                              ? 'Complete the Look & Similar Styles'
                              : 'ተመሳሳይ እና ተዛማጅ ምርቶች'}
                          </Text>
                          <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            style={styles.featuredRow}
                          >
                            {related.map((rel) => (
                              <TouchableOpacity
                                key={`rel-${rel.id}`}
                                style={styles.featuredCard}
                                onPress={() => openProductDetails(rel)}
                              >
                                {rel.images?.[0] ? (
                                  <Image
                                    source={resolveImageSource(rel.images[0], apiBaseUrl)}
                                    style={styles.featuredImage}
                                    resizeMode="cover"
                                  />
                                ) : null}
                                <Text style={styles.featuredName} numberOfLines={1}>
                                  {language === 'en' ? rel.name : rel.nameAm}
                                </Text>
                                <Text style={styles.featuredPrice}>
                                  ETB {rel.price.toLocaleString('en-US')}
                                </Text>
                              </TouchableOpacity>
                            ))}
                          </ScrollView>
                        </View>
                      );
                    })()}
                  </ScrollView>

                  <View style={styles.detailFooter}>
                    <View>
                      <Text style={styles.detailFooterLabel}>{t.total}</Text>
                      <Text style={styles.detailFooterPrice}>
                        ETB {(selectedProduct.price * pdpQty).toLocaleString('en-US')}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={[styles.detailAddButton, { backgroundColor: COLORS.forest }]}
                      onPress={() => {
                        if (
                          selectedProduct &&
                          addToCart(selectedProduct, selectedSize, selectedColor, pdpQty)
                        ) {
                          setSelectedProduct(null);
                          setShowOrderRequest(true);
                        }
                      }}
                    >
                      <Text style={styles.detailAddButtonText}>
                        {language === 'en' ? 'Buy Now' : 'አሁን ይዘዙ'}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.detailAddButton}
                      onPress={() => {
                        if (
                          selectedProduct &&
                          addToCart(selectedProduct, selectedSize, selectedColor, pdpQty)
                        ) {
                          setSelectedProduct(null);
                          setActiveTab('cart');
                        }
                      }}
                    >
                      <Text style={styles.detailAddButtonText}>{t.addToCart}</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
          </GestureHandlerRootView>
        </Modal>

        {/* Order Request Modal with Addis Delivery Map Zones & Google Maps Link */}
        <Modal
          visible={showOrderRequest}
          animationType="slide"
          onRequestClose={() => setShowOrderRequest(false)}
        >
          <View style={styles.cartModalSafe}>
            <View style={styles.cartHeader}>
              <TouchableOpacity
                onPress={() => setShowOrderRequest(false)}
                style={styles.backButton}
              >
                <Text style={styles.backText}>‹</Text>
              </TouchableOpacity>
              <Text style={styles.cartHeaderTitle}>{t.orderRequest}</Text>
              <View style={styles.backButton} />
            </View>
            <ScrollView
              contentContainerStyle={styles.formContent}
              keyboardShouldPersistTaps="handled"
            >
              {!currentUser ? (
                <TouchableOpacity
                  style={styles.authPromptBanner}
                  onPress={() => {
                    setAuthMode('signup');
                    setAuthError(null);
                    setShowAuthModal(true);
                  }}
                >
                  <Text style={styles.authPromptTitle}>
                    {language === 'en'
                      ? '👤 Sign in or Create Account to Place Order'
                      : '👤 ትዕዛዝ ለማስገባት መለያ ይፍጠሩ ወይም ይግቡ'}
                  </Text>
                  <Text style={styles.authPromptSub}>
                    {language === 'en'
                      ? 'Guests can browse & add to bag, while ordering requires a customer phone/email account.'
                      : 'ምርቶችን መመልከት ይችላሉ፤ ለማዘዝ ግን በስልክ ወይም በኢሜል ይመዝገቡ።'}
                  </Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.signedInPill}>
                  <Text style={styles.signedInText}>
                    ✓ {language === 'en' ? 'Signed in as' : 'ገብተዋል፦'} {currentUser.name}
                  </Text>
                </View>
              )}

              <TextInput
                value={customerName}
                onChangeText={setCustomerName}
                placeholder={t.customerName}
                placeholderTextColor={COLORS.muted}
                style={styles.formInput}
              />
              <TextInput
                value={customerPhone}
                onChangeText={setCustomerPhone}
                placeholder={t.customerPhone}
                placeholderTextColor={COLORS.muted}
                keyboardType="phone-pad"
                style={styles.formInput}
              />

              <Text style={styles.formLabel}>{t.fulfillment}</Text>
              <View style={styles.sizeRow}>
                {(['pickup', 'delivery'] as const).map((choice) => (
                  <TouchableOpacity
                    key={choice}
                    onPress={() => setFulfillment(choice)}
                    style={[styles.sizeChip, fulfillment === choice && styles.sizeChipActive]}
                  >
                    <Text
                      style={[
                        styles.sizeChipText,
                        fulfillment === choice && styles.sizeChipTextActive,
                      ]}
                    >
                      {choice === 'pickup' ? t.pickup : t.delivery}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {fulfillment === 'delivery' && (
                <View style={styles.deliveryBox}>
                  <Text style={styles.guidanceTitle}>
                    {language === 'en' ? 'Delivery Partner' : 'የማድረስ አገልግሎት'}
                  </Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.miniChipRow}>
                    {DELIVERY_PROVIDERS.map((dp) => (
                      <TouchableOpacity
                        key={dp.id}
                        onPress={() => setDeliveryProvider(dp.id)}
                        style={[styles.miniChip, deliveryProvider === dp.id && styles.miniChipActive]}
                      >
                        <Text style={[styles.miniChipText, deliveryProvider === dp.id && styles.miniChipTextActive]}>
                          {language === 'en' ? dp.en : dp.am}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>

                  <Text style={styles.filterSubLabel}>
                    {language === 'en' ? 'City & Subcity (Addis Ababa + Regions)' : 'ከተማ እና ክፍለ ከተማ'}
                  </Text>
                  <View style={styles.sizeRow}>
                    <TouchableOpacity
                      onPress={() => {
                        setDeliveryCity('Addis Ababa');
                        setEstimatedDeliveryFee(140);
                      }}
                      style={[styles.miniChip, deliveryCity === 'Addis Ababa' && styles.miniChipActive]}
                    >
                      <Text style={[styles.miniChipText, deliveryCity === 'Addis Ababa' && styles.miniChipTextActive]}>
                        Addis Ababa
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => {
                        setDeliveryCity('Adama / Nazret');
                        setEstimatedDeliveryFee(380);
                        setDeliveryProvider('regional-parcel');
                      }}
                      style={[styles.miniChip, deliveryCity !== 'Addis Ababa' && styles.miniChipActive]}
                    >
                      <Text style={[styles.miniChipText, deliveryCity !== 'Addis Ababa' && styles.miniChipTextActive]}>
                        {language === 'en' ? 'Outside Addis / Region' : 'ከአዲስ አበባ ውጭ'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {deliveryCity === 'Addis Ababa' ? (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.miniChipRow}>
                      {ADDIS_SUBCITIES.map((sub) => {
                        const lbl = language === 'en' ? sub.en : sub.am;
                        const active = deliverySubcity === lbl || deliveryZone === lbl;
                        return (
                          <TouchableOpacity
                            key={sub.id}
                            onPress={() => selectAddisSubcity(sub)}
                            style={[styles.miniChip, active && styles.miniChipActive]}
                          >
                            <Text style={[styles.miniChipText, active && styles.miniChipTextActive]}>
                              {lbl} (ETB {sub.feeEtb})
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  ) : (
                    <>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.miniChipRow}>
                        {ETHIOPIA_REGIONAL_CITIES.map((rc) => {
                          const lbl = language === 'en' ? rc.en : rc.am;
                          const active = deliveryCity === lbl || (rc.id === 'other-city' && deliveryCity === 'Other');
                          return (
                            <TouchableOpacity
                              key={rc.id}
                              onPress={() => selectRegionalCity(rc)}
                              style={[styles.miniChip, active && styles.miniChipActive]}
                            >
                              <Text style={[styles.miniChipText, active && styles.miniChipTextActive]}>
                                {lbl} (ETB {rc.feeEtb})
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </ScrollView>
                      {deliveryCity === 'Other' && (
                        <TextInput
                          value={customCityInput}
                          onChangeText={setCustomCityInput}
                          placeholder={language === 'en' ? 'Enter your city name' : 'የከተማ ስም ያስገቡ'}
                          placeholderTextColor={COLORS.muted}
                          style={styles.formInput}
                        />
                      )}
                    </>
                  )}

                  <View style={{ flexDirection: 'row', gap: 6, marginTop: 8 }}>
                    <TouchableOpacity
                      style={[styles.openMapBtn, { flex: 1, marginTop: 0, backgroundColor: COLORS.terracotta }]}
                      onPress={shareMyCurrentLocation}
                      disabled={gpsLoading}
                    >
                      <Text style={styles.openMapBtnText}>
                        {gpsLoading
                          ? 'Locating…'
                          : language === 'en'
                            ? '📡 Share My Location'
                            : '📡 አሁን ያለሁበትን ላክ'}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.openMapBtn, { flex: 1, marginTop: 0 }]}
                      onPress={() => {
                        const coords = deliveryCoords ?? BELIKA_SHOP_COORDS;
                        void openExternalUrl(
                          `https://www.google.com/maps/search/?api=1&query=${coords.lat},${coords.lng}`,
                          'Google Maps',
                        );
                      }}
                    >
                      <Text style={styles.openMapBtnText}>📍 Google Maps</Text>
                    </TouchableOpacity>
                  </View>

                  <TextInput
                    value={deliveryAddress}
                    onChangeText={setDeliveryAddress}
                    placeholder={t.deliveryAddress}
                    placeholderTextColor={COLORS.muted}
                    style={styles.formInput}
                  />
                  <TextInput
                    value={deliveryLandmark}
                    onChangeText={setDeliveryLandmark}
                    placeholder={t.deliveryLandmark}
                    placeholderTextColor={COLORS.muted}
                    style={styles.formInput}
                  />
                  <Text style={styles.deliveryNote}>
                    {deliveryDistanceKm
                      ? `${deliveryDistanceKm} km from Bole · Est. fee: ETB ${estimatedDeliveryFee}. `
                      : ''}
                    {t.deliveryFeeNote}
                  </Text>
                </View>
              )}

              <Text style={styles.formLabel}>
                {language === 'en' ? 'Payment Method' : 'የመክፈያ ዘዴ'}
              </Text>
              <View style={styles.sizeRow}>
                {(
                  [
                    { id: 'cod', label: language === 'en' ? 'Cash on Delivery' : 'በጥሬ ገንዘብ' },
                    { id: 'telebirr', label: 'Telebirr' },
                    { id: 'cbe', label: 'CBE Birr' },
                  ] as const
                ).map((pm) => (
                  <TouchableOpacity
                    key={pm.id}
                    onPress={() => setPaymentMethod(pm.id)}
                    style={[styles.sizeChip, paymentMethod === pm.id && styles.sizeChipActive]}
                  >
                    <Text
                      style={[
                        styles.sizeChipText,
                        paymentMethod === pm.id && styles.sizeChipTextActive,
                      ]}
                    >
                      {pm.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {paymentMethod !== 'cod' && (
                <View style={styles.deliveryBox}>
                  <Text style={styles.guidanceTitle}>
                    {paymentMethod === 'telebirr'
                      ? `Telebirr · ${branches.Women.telebirrAccount} (Belika)`
                      : `CBE · ${branches.Women.cbeAccount} (Belika)`}
                  </Text>
                  <TextInput
                    value={paymentReference}
                    onChangeText={setPaymentReference}
                    placeholder={
                      language === 'en' ? 'Transfer / Ref ID (optional)' : 'የክፍያ ማረጋገጫ ቁጥር'
                    }
                    placeholderTextColor={COLORS.muted}
                    style={styles.formInput}
                  />
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10 }}>
                    <TouchableOpacity
                      style={[styles.secondarySmallButton, { flex: 1 }]}
                      onPress={() => void pickPaymentProofImage()}
                    >
                      <Text style={styles.secondarySmallButtonText}>
                        📎{' '}
                        {paymentProofImage
                          ? language === 'en'
                            ? 'Change Screenshot'
                            : 'ፎቶ ቀይር'
                          : language === 'en'
                            ? 'Attach Payment Screenshot (Optional)'
                            : 'የክፍያ ፎቶ አያይዝ (አማራጭ)'}
                      </Text>
                    </TouchableOpacity>
                    {paymentProofImage && (
                      <TouchableOpacity onPress={() => setPaymentProofImage(undefined)}>
                        <Text style={styles.removeText}>✕</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  {paymentProofImage && (
                    <Image
                      source={{ uri: paymentProofImage }}
                      style={styles.proofPreviewThumb}
                      resizeMode="cover"
                    />
                  )}
                </View>
              )}

              <View style={styles.summaryCard}>
                <Text style={styles.summaryTitle}>{t.orderSummary}</Text>
                {cartItems.map((line) => {
                  const product = products.find((p) => p.id === line.productId);
                  return (
                    <View key={`sum-${line.id}`} style={styles.summaryRow}>
                      <Text style={styles.summaryItemText}>
                        {product ? (language === 'en' ? product.name : product.nameAm) : line.productId}{' '}
                        ({line.size} · {line.color}) × {line.quantity}
                      </Text>
                      <Text style={styles.summaryItemPrice}>
                        ETB {((product?.price ?? 0) * line.quantity).toLocaleString('en-US')}
                      </Text>
                    </View>
                  );
                })}
                {promoDiscountAmount > 0 && (
                  <View style={styles.summaryRow}>
                    <Text style={[styles.summaryItemText, { color: COLORS.terracotta }]}>
                      Promo ({appliedPromoCode})
                    </Text>
                    <Text style={[styles.summaryItemPrice, { color: COLORS.terracotta }]}>
                      −ETB {promoDiscountAmount.toLocaleString('en-US')}
                    </Text>
                  </View>
                )}
                {fulfillment === 'delivery' && (
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryItemText}>
                      {deliveryProvider.toUpperCase()} {deliveryZone ? `(${deliveryZone})` : ''}
                    </Text>
                    <Text style={styles.summaryItemPrice}>
                      {qualifiesForFreeDelivery ? 'FREE' : `ETB ${effectiveDeliveryFee}`}
                    </Text>
                  </View>
                )}
                <View style={styles.summaryTotalRow}>
                  <Text style={styles.cartSubtotalLabel}>{t.total}</Text>
                  <Text style={styles.cartSubtotalValue}>
                    ETB {orderTotal.toLocaleString('en-US')}
                  </Text>
                </View>
              </View>

              <TouchableOpacity style={styles.primaryButton} onPress={requestOrder}>
                <Text style={styles.primaryButtonText}>{t.submitRequest}</Text>
              </TouchableOpacity>
              <Text style={styles.checkoutNote}>{t.checkoutLater}</Text>
            </ScrollView>
          </View>
        </Modal>

        {/* Order Receipt & 4-Step Tracking Modal */}
        <Modal
          visible={trackingOrder !== null}
          animationType="slide"
          onRequestClose={() => setTrackingOrder(null)}
        >
          <View style={styles.modalSafe}>
            {trackingOrder && (
              <>
                <View style={styles.detailHeader}>
                  <TouchableOpacity onPress={() => setTrackingOrder(null)} style={styles.backButton}>
                    <Text style={styles.backText}>‹</Text>
                  </TouchableOpacity>
                  <Text style={styles.detailHeaderTitle}>
                    {language === 'en' ? 'Order Tracker' : 'የትዕዛዝ ክትትል'}
                  </Text>
                  <View style={styles.backButton} />
                </View>
                <ScrollView contentContainerStyle={styles.detailContent}>
                  <View style={styles.guidanceCard}>
                    <Text style={styles.detailEyebrow}>{trackingOrder.id}</Text>
                    <Text style={styles.detailName}>
                      ETB {trackingOrder.total.toLocaleString('en-US')}
                    </Text>
                    <Text style={styles.staffMeta}>
                      {trackingOrder.customerName} · {trackingOrder.customerPhone}
                    </Text>
                    {trackingOrder.deliveryCity && (
                      <Text style={styles.staffMeta}>
                        {trackingOrder.deliveryProvider?.toUpperCase() ?? 'DELIVERY'} ·{' '}
                        {trackingOrder.deliverySubcity
                          ? `${trackingOrder.deliverySubcity}, `
                          : ''}
                        {trackingOrder.deliveryCity}
                      </Text>
                    )}
                    {trackingOrder.paymentMethod && (
                      <Text style={styles.staffMeta}>
                        Payment: {trackingOrder.paymentMethod.toUpperCase()}
                        {trackingOrder.paymentReference ? ` (${trackingOrder.paymentReference})` : ''}
                      </Text>
                    )}
                    {trackingOrder.paymentProofImage && (
                      <Image
                        source={{ uri: trackingOrder.paymentProofImage }}
                        style={styles.proofPreviewThumb}
                        resizeMode="cover"
                      />
                    )}

                    <View style={styles.trackerStepsWrap}>
                      {(['requested', 'confirmed', 'out-for-delivery', 'completed'] as const).map(
                        (step, idx) => {
                          const orderRank =
                            trackingOrder.status === 'cancelled'
                              ? -1
                              : ['requested', 'confirmed', 'out-for-delivery', 'completed'].indexOf(
                                  trackingOrder.status,
                                );
                          const done = orderRank >= idx;
                          return (
                            <View key={step} style={styles.trackerStepRow}>
                              <View style={[styles.trackerDot, done && styles.trackerDotActive]} />
                              <Text style={[styles.trackerStepText, done && styles.trackerStepTextActive]}>
                                {step === 'requested'
                                  ? t.requested
                                  : step === 'confirmed'
                                    ? t.confirmed
                                    : step === 'out-for-delivery'
                                      ? t.outForDelivery
                                      : t.completed}
                              </Text>
                            </View>
                          );
                        },
                      )}
                    </View>

                    <View style={[styles.staffActions, { marginTop: 14 }]}>
                      <TouchableOpacity
                        style={styles.primarySmallButton}
                        onPress={() => {
                          setSupportOrderId(trackingOrder.id);
                          setSupportTopic('Order & Payment');
                          setSupportFeedback(null);
                          setTrackingOrder(null);
                          setShowSupportModal(true);
                        }}
                      >
                        <Text style={styles.primarySmallButtonText}>
                          💬 {language === 'en' ? 'Message Customer Support' : 'የደንበኞች ድጋፍን ያግኙ'}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.secondarySmallButton}
                        onPress={() =>
                          void openExternalUrl(
                            `tel:${branches.Women.supportPhone.replace(/\s+/g, '')}`,
                            'Support Call',
                          )
                        }
                      >
                        <Text style={styles.secondarySmallButtonText}>
                          📞 {language === 'en' ? 'Call Support' : 'ይደውሉ'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </ScrollView>
              </>
            )}
          </View>
        </Modal>

        {/* Role-Based Account Auth Modal (Customer / Merchant / Owner) */}
        <Modal
          visible={showAuthModal}
          animationType="slide"
          onRequestClose={() => setShowAuthModal(false)}
        >
          <View style={styles.modalSafe}>
            <View style={styles.detailHeader}>
              <TouchableOpacity onPress={() => setShowAuthModal(false)} style={styles.backButton}>
                <Text style={styles.backText}>‹</Text>
              </TouchableOpacity>
              <Text style={styles.detailHeaderTitle}>
                {language === 'en' ? 'Belika Account' : 'የቤሊካ መለያ'}
              </Text>
              <View style={styles.backButton} />
            </View>
            <ScrollView contentContainerStyle={styles.formContent} keyboardShouldPersistTaps="handled">
              {currentUser ? (
                <View style={styles.guidanceCard}>
                  <Text style={styles.detailEyebrow}>{currentUser.role.toUpperCase()}</Text>
                  <Text style={styles.detailName}>{currentUser.name}</Text>
                  <Text style={styles.staffMeta}>{currentUser.identifier}</Text>
                  {isStaffUser && (
                    <TouchableOpacity
                      style={[styles.primaryButton, { backgroundColor: COLORS.forest }]}
                      onPress={() => {
                        setShowAuthModal(false);
                        setShowStaff(true);
                      }}
                    >
                      <Text style={styles.primaryButtonText}>{t.staffTitle}</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={[styles.secondarySmallButton, { marginTop: 12, minHeight: 44 }]}
                    onPress={handleLogout}
                  >
                    <Text style={styles.secondarySmallButtonText}>
                      {language === 'en' ? 'Sign Out' : 'ውጣ'}
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  <View style={styles.staffWebTabsCard}>
                    {(
                      [
                        { id: 'signin', label: language === 'en' ? 'Sign In' : 'ግባ' },
                        { id: 'signup', label: language === 'en' ? 'Create Account' : 'ተመዝገብ' },
                        ...(!hasOwnerSetup
                          ? [{ id: 'claim-owner', label: language === 'en' ? 'Owner Setup' : 'ባለቤት' }]
                          : []),
                      ] as const
                    ).map((m) => (
                      <TouchableOpacity
                        key={m.id}
                        onPress={() => {
                          setAuthMode(m.id);
                          setAuthError(null);
                        }}
                        style={[styles.staffWebTabBtn, authMode === m.id && styles.staffWebTabBtnActive]}
                      >
                        <Text
                          style={[
                            styles.staffWebTabText,
                            authMode === m.id && styles.staffWebTabTextActive,
                          ]}
                        >
                          {m.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {authError ? <Text style={styles.localWarning}>{authError}</Text> : null}

                  {(authMode === 'signup' || authMode === 'claim-owner') && (
                    <TextInput
                      value={authName}
                      onChangeText={setAuthName}
                      placeholder={language === 'en' ? 'Full Name' : 'ሙሉ ስም'}
                      placeholderTextColor={COLORS.muted}
                      style={styles.formInput}
                    />
                  )}
                  <TextInput
                    value={authIdentifier}
                    onChangeText={setAuthIdentifier}
                    placeholder={
                      language === 'en'
                        ? 'Phone (+2519…) or Email Address'
                        : 'ስልክ ቁጥር ወይም ኢሜል'
                    }
                    placeholderTextColor={COLORS.muted}
                    autoCapitalize="none"
                    style={styles.formInput}
                  />
                  {authMode === 'signup' && (
                    <TextInput
                      value={authPhone}
                      onChangeText={setAuthPhone}
                      placeholder={language === 'en' ? 'Phone number (for delivery)' : 'ስልክ ቁጥር'}
                      placeholderTextColor={COLORS.muted}
                      keyboardType="phone-pad"
                      style={styles.formInput}
                    />
                  )}
                  <TextInput
                    value={authPassword}
                    onChangeText={setAuthPassword}
                    placeholder={
                      authMode === 'claim-owner'
                        ? 'New Owner Password / PIN'
                        : language === 'en'
                          ? 'Password or Staff PIN'
                          : 'የይለፍ ቃል / ፒን'
                    }
                    placeholderTextColor={COLORS.muted}
                    secureTextEntry
                    style={styles.formInput}
                  />
                  {authMode === 'claim-owner' && (
                    <TextInput
                      value={authOwnerPin}
                      onChangeText={setAuthOwnerPin}
                      placeholder="Server Setup Code (if configured)"
                      placeholderTextColor={COLORS.muted}
                      secureTextEntry
                      style={styles.formInput}
                    />
                  )}
                  <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={() => void submitAuth()}
                    disabled={authSubmitting}
                  >
                    <Text style={styles.primaryButtonText}>
                      {authSubmitting
                        ? 'Please wait…'
                        : authMode === 'signup'
                          ? language === 'en'
                            ? 'Create Customer Account'
                            : 'መለያ ፍጠር'
                          : authMode === 'claim-owner'
                            ? 'Claim Owner Admin'
                            : language === 'en'
                              ? 'Sign In'
                              : 'ግባ'}
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </ScrollView>
          </View>
        </Modal>

        {/* Direct Customer Support Modal */}
        <Modal
          visible={showSupportModal}
          animationType="slide"
          onRequestClose={() => setShowSupportModal(false)}
        >
          <View style={styles.modalSafe}>
            <View style={styles.detailHeader}>
              <TouchableOpacity onPress={() => setShowSupportModal(false)} style={styles.backButton}>
                <Text style={styles.backText}>‹</Text>
              </TouchableOpacity>
              <Text style={styles.detailHeaderTitle}>
                {language === 'en' ? 'Belika Customer Support' : 'የቤሊካ ደንበኞች ድጋፍ'}
              </Text>
              <View style={styles.backButton} />
            </View>
            <ScrollView contentContainerStyle={styles.formContent} keyboardShouldPersistTaps="handled">
              <View style={styles.guidanceCard}>
                <Text style={styles.guidanceTitle}>
                  {language === 'en' ? 'Need urgent payment or delivery help?' : 'ፈጣን እገዛ ይፈልጋሉ?'}
                </Text>
                <View style={styles.branchActionRow}>
                  <TouchableOpacity
                    style={styles.branchActionBtn}
                    onPress={() =>
                      void openExternalUrl(`tel:${branches.Women.supportPhone.replace(/\s+/g, '')}`, 'Call Support')
                    }
                  >
                    <Text style={styles.branchActionText}>📞 {branches.Women.supportPhone}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.branchActionBtn}
                    onPress={() => void openExternalUrl(branches.Women.telegramSupport, 'Telegram Support')}
                  >
                    <Text style={styles.branchActionText}>✈️ Telegram</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <Text style={styles.formLabel}>{language === 'en' ? 'Topic' : 'ርዕስ'}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.miniChipRow}>
                {['Order & Payment', 'Delivery / Location', 'Size Exchange', 'Product Question'].map((top) => (
                  <TouchableOpacity
                    key={top}
                    onPress={() => setSupportTopic(top)}
                    style={[styles.miniChip, supportTopic === top && styles.miniChipActive]}
                  >
                    <Text style={[styles.miniChipText, supportTopic === top && styles.miniChipTextActive]}>
                      {top}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <TextInput
                value={supportOrderId}
                onChangeText={setSupportOrderId}
                placeholder={language === 'en' ? 'Order ID (optional, e.g. BL-123456)' : 'የትዕዛዝ መለያ (አማራጭ)'}
                placeholderTextColor={COLORS.muted}
                style={styles.formInput}
              />
              <TextInput
                value={supportMessageText}
                onChangeText={setSupportMessageText}
                placeholder={
                  language === 'en'
                    ? 'Explain your issue (e.g. payment approval delay, location change)…'
                    : 'መልዕክትዎን እዚህ ይጻፉ…'
                }
                placeholderTextColor={COLORS.muted}
                multiline
                style={[styles.formInput, { minHeight: 96, textAlignVertical: 'top' }]}
              />
              {supportFeedback ? <Text style={styles.serverStatusText}>{supportFeedback}</Text> : null}

              <TouchableOpacity style={styles.primaryButton} onPress={() => void submitSupportMessage()}>
                <Text style={styles.primaryButtonText}>
                  {language === 'en' ? 'Send to Support Team' : 'መልዕክት ላክ'}
                </Text>
              </TouchableOpacity>

              {supportMessages.length > 0 && (
                <View style={{ marginTop: 18 }}>
                  <Text style={styles.staffSectionTitle}>
                    {language === 'en' ? 'Your Recent Messages' : 'የቅርብ መልዕክቶች'}
                  </Text>
                  {supportMessages.slice(0, 6).map((msg) => (
                    <View key={msg.id} style={styles.staffCard}>
                      <Text style={styles.staffCardTitle}>
                        {msg.topic} · {msg.status.toUpperCase()}
                      </Text>
                      <Text style={styles.staffMeta}>{msg.message}</Text>
                      {msg.reply ? (
                        <Text style={[styles.staffMeta, { color: COLORS.forest, fontWeight: '700' }]}>
                          Belika Reply: {msg.reply}
                        </Text>
                      ) : null}
                    </View>
                  ))}
                </View>
              )}
            </ScrollView>
          </View>
        </Modal>

        {/* Staff Tools Modal */}
        <Modal
          visible={showStaff}
          animationType="slide"
          onRequestClose={() => setShowStaff(false)}
        >
          <View style={styles.staffSafe}>
            <ScrollView
              ref={staffScrollRef}
              contentContainerStyle={styles.staffContent}
              keyboardShouldPersistTaps="handled"
            >
              {/* Ivory Editorial Header & Tab Switcher (matches Chrome web Studio) */}
              <View style={styles.staffWebHeaderWrap}>
                <TouchableOpacity onPress={() => setShowStaff(false)} style={styles.staffBackLink}>
                  <Text style={styles.staffBackLinkText}>
                    ← {language === 'en' ? 'Back to shop' : 'ወደ መደብር ተመለስ'}
                  </Text>
                </TouchableOpacity>
                <Text style={styles.staffWebTitle}>{t.staffTitle}</Text>

                <View style={styles.staffWebTabsCard}>
                  {(
                    [
                      { id: 'catalog', label: language === 'en' ? 'Upload Item' : 'አዲስ ዕቃ' },
                      { id: 'stock', label: `${t.stock} (${products.length})` },
                      { id: 'categories', label: `${t.categories} (${categories.length})` },
                      { id: 'promos', label: `${language === 'en' ? 'Promos' : 'ቅናሾች'} (${promos.length})` },
                      { id: 'orders', label: `${t.orders} (${orders.length})` },
                      ...(currentUser?.role === 'owner'
                        ? [{ id: 'admin' as const, label: language === 'en' ? 'Admin' : 'አስተዳዳሪ' }]
                        : []),
                    ] as const
                  ).map((tab) => {
                    const isActive = staffSection === tab.id;
                    return (
                      <TouchableOpacity
                        key={tab.id}
                        onPress={() => setStaffSection(tab.id)}
                        style={[styles.staffWebTabBtn, isActive && styles.staffWebTabBtnActive]}
                      >
                        <Text style={[styles.staffWebTabText, isActive && styles.staffWebTabTextActive]}>
                          {tab.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* 2x2 Merchant KPI Grid (matches Chrome mobile preview) */}
              <View style={styles.kpiGrid}>
                <View style={styles.kpiCard}>
                  <Text style={styles.kpiLabel}>{language === 'en' ? 'ACTIVE SALES VOLUME' : 'አጠቃላይ ሽያጭ'}</Text>
                  <Text style={styles.kpiVal}>ETB {merchantMetrics.activeRevenue.toLocaleString('en-US')}</Text>
                </View>
                <View style={styles.kpiCard}>
                  <Text style={styles.kpiLabel}>{language === 'en' ? 'OPEN ORDERS' : 'በሂደት ላይ ያሉ'}</Text>
                  <Text style={[styles.kpiVal, { color: COLORS.terracotta }]}>{merchantMetrics.openOrders}</Text>
                </View>
                <View style={styles.kpiCard}>
                  <Text style={styles.kpiLabel}>{language === 'en' ? 'LOW STOCK VARIANTS' : 'አነስተኛ ክምችት'}</Text>
                  <Text style={[styles.kpiVal, { color: '#942C2C' }]}>
                    {merchantMetrics.lowStockVariants}
                  </Text>
                </View>
                <View style={styles.kpiCard}>
                  <Text style={styles.kpiLabel}>{language === 'en' ? 'PUBLISHED ITEMS' : 'የታተሙ ዕቃዎች'}</Text>
                  <Text style={styles.kpiVal}>{merchantMetrics.publishedCount}</Text>
                </View>
              </View>

              <Text style={styles.localWarning}>{t.localOnly}</Text>

              {staffSection === 'orders' && (
                <>
                  <Text style={styles.staffSectionTitle}>{t.orders}</Text>
                  {orders.length === 0 ? (
                    <Text style={styles.emptyText}>{t.noOrders}</Text>
                  ) : (
                    orders.map((order) => (
                      <View key={order.id} style={styles.staffCard}>
                        <Text style={styles.staffCardTitle}>
                          {order.id} ·{' '}
                          {order.status === 'requested'
                            ? t.requested
                            : order.status === 'confirmed'
                              ? t.confirmed
                              : order.status === 'out-for-delivery'
                                ? t.outForDelivery
                                : order.status === 'completed'
                                  ? t.completed
                                  : t.cancelled}
                        </Text>
                        <Text style={styles.staffMeta}>
                          {order.customerName} · {order.customerPhone}
                        </Text>
                        <Text style={styles.staffMeta}>
                          {order.fulfillment === 'pickup'
                            ? t.pickup
                            : `${order.deliveryProvider?.toUpperCase() ?? 'DELIVERY'} · ${order.deliverySubcity ? `${order.deliverySubcity}, ` : ''}${order.deliveryCity ?? 'Addis Ababa'}`}{' '}
                          · ETB {order.total.toLocaleString('en-US')}
                          {order.paymentMethod ? ` · ${order.paymentMethod.toUpperCase()}` : ''}
                          {order.promoCode ? ` · ${order.promoCode}` : ''}
                        </Text>
                        {order.fulfillment === 'delivery' && order.deliveryAddress ? (
                          <Text style={styles.staffMeta}>
                            {order.deliveryAddress}
                            {order.deliveryLandmark ? ` (${order.deliveryLandmark})` : ''}
                          </Text>
                        ) : null}
                        {order.paymentProofImage && (
                          <Image
                            source={{ uri: order.paymentProofImage }}
                            style={styles.proofPreviewThumb}
                            resizeMode="cover"
                          />
                        )}
                        {order.deliveryCoords && (
                          <TouchableOpacity
                            style={styles.compareLink}
                            onPress={() =>
                              void openExternalUrl(
                                `https://www.google.com/maps/search/?api=1&query=${order.deliveryCoords!.lat},${order.deliveryCoords!.lng}`,
                                'Google Maps',
                              )
                            }
                          >
                            <Text style={styles.compareLinkText}>📍 Open Pin in Google Maps ↗</Text>
                          </TouchableOpacity>
                        )}
                        {order.items.map((line) => {
                          const product = products.find((item) => item.id === line.productId);
                          return (
                            <Text key={`${order.id}-${line.id}`} style={styles.staffMeta}>
                              {product?.name ?? line.productId} · {line.size} / {line.color} ×{' '}
                              {line.quantity}
                              {line.customNote ? ` (${line.customNote})` : ''}
                            </Text>
                          );
                        })}
                        {order.status === 'requested' && (
                          <View style={styles.staffActions}>
                            <TouchableOpacity
                              style={styles.primarySmallButton}
                              onPress={() => updateOrderStatus(order.id, 'confirmed')}
                            >
                              <Text style={styles.primarySmallButtonText}>{t.confirmOrder}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={styles.secondarySmallButton}
                              onPress={() => updateOrderStatus(order.id, 'cancelled')}
                            >
                              <Text style={styles.secondarySmallButtonText}>{t.cancelOrder}</Text>
                            </TouchableOpacity>
                          </View>
                        )}
                        {order.status === 'confirmed' && (
                          <View style={styles.staffActions}>
                            <TouchableOpacity
                              style={[styles.primarySmallButton, { backgroundColor: COLORS.terracotta }]}
                              onPress={() => updateOrderStatus(order.id, 'out-for-delivery')}
                            >
                              <Text style={styles.primarySmallButtonText}>{t.outForDelivery}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={styles.primarySmallButton}
                              onPress={() => updateOrderStatus(order.id, 'completed')}
                            >
                              <Text style={styles.primarySmallButtonText}>{t.completeOrder}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={styles.secondarySmallButton}
                              onPress={() => updateOrderStatus(order.id, 'cancelled')}
                            >
                              <Text style={styles.secondarySmallButtonText}>{t.cancelOrder}</Text>
                            </TouchableOpacity>
                          </View>
                        )}
                        {order.status === 'out-for-delivery' && (
                          <View style={styles.staffActions}>
                            <TouchableOpacity
                              style={styles.primarySmallButton}
                              onPress={() => updateOrderStatus(order.id, 'completed')}
                            >
                              <Text style={styles.primarySmallButtonText}>{t.completeOrder}</Text>
                            </TouchableOpacity>
                          </View>
                        )}
                      </View>
                    ))
                  )}

                  <Text style={styles.staffSectionTitle}>
                    {language === 'en' ? 'Customer Support Inbox' : 'የደንበኞች ድጋፍ መልዕክቶች'} ({supportMessages.length})
                  </Text>
                  {supportMessages.length === 0 ? (
                    <Text style={styles.emptyText}>No support inquiries yet.</Text>
                  ) : (
                    supportMessages.map((msg) => (
                      <View key={msg.id} style={styles.staffCard}>
                        <Text style={styles.staffCardTitle}>
                          {msg.topic} · {msg.customerName} ({msg.status.toUpperCase()})
                        </Text>
                        <Text style={styles.staffMeta}>{msg.contact}</Text>
                        <Text style={styles.staffMeta}>{msg.message}</Text>
                        {msg.status === 'open' && (
                          <TouchableOpacity
                            style={[styles.primarySmallButton, { marginTop: 8, alignSelf: 'flex-start' }]}
                            onPress={() =>
                              setSupportMessages((prev) =>
                                prev.map((x) =>
                                  x.id === msg.id ? { ...x, status: 'resolved', reply: 'Handled by Belika Staff' } : x,
                                ),
                              )
                            }
                          >
                            <Text style={styles.primarySmallButtonText}>Mark Resolved</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    ))
                  )}
                </>
              )}

              {staffSection === 'categories' && (
                <>
                  <Text style={styles.staffSectionTitle}>
                    {language === 'en' ? 'Department Categories' : 'የክፍል ምድቦች'}
                  </Text>
                  <View style={styles.sizeRow}>
                    {(['All', 'Women', 'Men', 'Kids'] as Department[]).map((dep) => (
                      <TouchableOpacity
                        key={`cat-view-${dep}`}
                        onPress={() => {
                          setCatViewDept(dep);
                          setCatDepartment(dep);
                        }}
                        style={[styles.sizeChip, catViewDept === dep && styles.sizeChipActive]}
                      >
                        <Text
                          style={[
                            styles.sizeChipText,
                            catViewDept === dep && styles.sizeChipTextActive,
                          ]}
                        >
                          {departmentLabel(dep)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {categories
                    .filter((cat) => catViewDept === 'All' || cat.department === catViewDept)
                    .map((cat) => (
                      <View key={cat.id} style={[styles.staffCard, { marginTop: 8 }]}>
                        <Text style={styles.staffCardTitle}>
                          {categoryIcon(cat)} {language === 'en' ? cat.name : cat.nameAm} ({cat.department})
                        </Text>
                        {cat.subcategories.length > 0 && (
                          <Text style={styles.staffMeta}>{cat.subcategories.join(' · ')}</Text>
                        )}
                      </View>
                    ))}

                  <Text style={styles.staffSectionTitle}>
                    {language === 'en' ? 'Add Category' : 'አዲስ ምድብ ይጨምሩ'}
                  </Text>
                  <TextInput
                    value={catName}
                    onChangeText={setCatName}
                    placeholder={language === 'en' ? 'Category name' : 'የምድብ ስም'}
                    placeholderTextColor={COLORS.muted}
                    style={styles.formInput}
                  />
                  <TextInput
                    value={catNameAm}
                    onChangeText={setCatNameAm}
                    placeholder={language === 'en' ? 'Amharic name' : 'የአማርኛ ስም'}
                    placeholderTextColor={COLORS.muted}
                    style={styles.formInput}
                  />
                  <TextInput
                    value={catSubcategories}
                    onChangeText={setCatSubcategories}
                    placeholder="Subcategories (comma separated)"
                    placeholderTextColor={COLORS.muted}
                    style={styles.formInput}
                  />
                  <TouchableOpacity style={styles.primaryButton} onPress={addCustomCategory}>
                    <Text style={styles.primaryButtonText}>
                      {language === 'en' ? `Add to ${departmentLabel(catDepartment)}` : 'ምድብ ጨምር'}
                    </Text>
                  </TouchableOpacity>
                </>
              )}

              {staffSection === 'promos' && (
                <>
                  <Text style={styles.staffSectionTitle}>
                    {language === 'en' ? 'Promo Codes Manager' : 'የቅናሽ ኮዶች'}
                  </Text>
                  <View style={{ flexDirection: 'row', gap: 6 }}>
                    <TextInput
                      value={newPromoCode}
                      onChangeText={setNewPromoCode}
                      placeholder="CODE (BELIKA15)"
                      placeholderTextColor={COLORS.muted}
                      autoCapitalize="characters"
                      style={[styles.inlineInput, { flex: 1 }]}
                    />
                    <TextInput
                      value={newPromoValue}
                      onChangeText={setNewPromoValue}
                      placeholder={newPromoType === 'percent' ? '%' : 'ETB'}
                      placeholderTextColor={COLORS.muted}
                      keyboardType="numeric"
                      style={[styles.inlineInput, { width: 65, textAlign: 'center' }]}
                    />
                    <TouchableOpacity
                      style={styles.secondarySmallButton}
                      onPress={() => setNewPromoType((pt) => (pt === 'percent' ? 'fixed' : 'percent'))}
                    >
                      <Text style={styles.secondarySmallButtonText}>
                        {newPromoType === 'percent' ? '%' : 'ETB'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 6, marginTop: 6 }}>
                    <TextInput
                      value={newPromoMin}
                      onChangeText={setNewPromoMin}
                      placeholder="Min order ETB (optional)"
                      placeholderTextColor={COLORS.muted}
                      keyboardType="numeric"
                      style={[styles.inlineInput, { flex: 1 }]}
                    />
                    <TouchableOpacity style={styles.primarySmallButton} onPress={createPromoCode}>
                      <Text style={styles.primarySmallButtonText}>+ Promo</Text>
                    </TouchableOpacity>
                  </View>
                  {promos.map((pr) => (
                    <View key={pr.code} style={[styles.staffCard, { marginTop: 8 }]}>
                      <View style={styles.filterPanelHead}>
                        <Text style={styles.staffCardTitle}>
                          {pr.code} · {pr.type === 'percent' ? `${pr.value}%` : `ETB ${pr.value}`}
                        </Text>
                        <View style={{ flexDirection: 'row', gap: 6 }}>
                          <TouchableOpacity
                            style={styles.foldToggleBadge}
                            onPress={() =>
                              setPromos((prev) =>
                                prev.map((x) => (x.code === pr.code ? { ...x, active: !x.active } : x)),
                              )
                            }
                          >
                            <Text style={styles.foldToggleText}>{pr.active ? 'Active' : 'Paused'}</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.deleteIconBtn}
                            onPress={() => setPromos((prev) => prev.filter((x) => x.code !== pr.code))}
                          >
                            <Text style={styles.deleteIconText}>🗑</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                      <Text style={styles.staffMeta}>{pr.label}</Text>
                    </View>
                  ))}
                </>
              )}

              {staffSection === 'admin' && currentUser?.role === 'owner' && (
                <>
                  <Text style={styles.staffSectionTitle}>
                    {language === 'en' ? 'Add Merchant / Staff Account' : 'አዲስ ነጋዴ / ሰራተኛ ጨምር'}
                  </Text>
                  {adminFeedback ? <Text style={styles.serverStatusText}>{adminFeedback}</Text> : null}
                  <TextInput
                    value={newStaffName}
                    onChangeText={setNewStaffName}
                    placeholder="Staff Name"
                    placeholderTextColor={COLORS.muted}
                    style={styles.formInput}
                  />
                  <TextInput
                    value={newStaffIdentifier}
                    onChangeText={setNewStaffIdentifier}
                    placeholder="Login Email or Phone (+2519…)"
                    placeholderTextColor={COLORS.muted}
                    autoCapitalize="none"
                    style={styles.formInput}
                  />
                  <TextInput
                    value={newStaffPassword}
                    onChangeText={setNewStaffPassword}
                    placeholder="PIN or Password"
                    placeholderTextColor={COLORS.muted}
                    secureTextEntry
                    style={styles.formInput}
                  />
                  <View style={styles.sizeRow}>
                    {(['All', 'Women', 'Men', 'Kids'] as Department[]).map((dep) => (
                      <TouchableOpacity
                        key={`st-dep-${dep}`}
                        onPress={() => setNewStaffBranch(dep)}
                        style={[styles.miniChip, newStaffBranch === dep && styles.miniChipActive]}
                      >
                        <Text style={[styles.miniChipText, newStaffBranch === dep && styles.miniChipTextActive]}>
                          {dep}
                        </Text>
                      </TouchableOpacity>
                    ))}
                    <TouchableOpacity
                      onPress={() => setNewStaffRole((r) => (r === 'merchant' ? 'owner' : 'merchant'))}
                      style={styles.miniChip}
                    >
                      <Text style={styles.miniChipText}>Role: {newStaffRole}</Text>
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity style={styles.primaryButton} onPress={() => void createStaffAccount()}>
                    <Text style={styles.primaryButtonText}>Create Merchant Login</Text>
                  </TouchableOpacity>

                  {staffAccounts.map((st) => (
                    <View key={st.id} style={[styles.staffCard, { marginTop: 8 }]}>
                      <Text style={styles.staffCardTitle}>
                        {st.name} · {st.role.toUpperCase()} ({st.assignedBranch})
                      </Text>
                      <Text style={styles.staffMeta}>{st.identifier}</Text>
                    </View>
                  ))}

                  <Text style={styles.staffSectionTitle}>
                    {language === 'en' ? 'Edit Store Locations & Channels' : 'የሱቅ አድራሻ እና ቻናሎች'}
                  </Text>
                  <View style={styles.sizeRow}>
                    {(['Women', 'Men', 'Kids'] as BranchDepartment[]).map((bDept) => (
                      <TouchableOpacity
                        key={`br-edit-${bDept}`}
                        onPress={() => setEditingBranchDept(bDept)}
                        style={[styles.sizeChip, editingBranchDept === bDept && styles.sizeChipActive]}
                      >
                        <Text
                          style={[
                            styles.sizeChipText,
                            editingBranchDept === bDept && styles.sizeChipTextActive,
                          ]}
                        >
                          {departmentLabel(bDept)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  {(() => {
                    const br = branches[editingBranchDept];
                    const updateBr = (field: keyof BranchInfo, val: string) =>
                      setBranches((prev) => ({
                        ...prev,
                        [editingBranchDept]: { ...prev[editingBranchDept], [field]: val },
                      }));
                    return (
                      <View>
                        <Text style={styles.filterSubLabel}>Address</Text>
                        <TextInput value={br.address} onChangeText={(v) => updateBr('address', v)} style={styles.formInput} />
                        <Text style={styles.filterSubLabel}>Landmark</Text>
                        <TextInput value={br.landmark} onChangeText={(v) => updateBr('landmark', v)} style={styles.formInput} />
                        <Text style={styles.filterSubLabel}>Sales Phone</Text>
                        <TextInput value={br.salesPhone} onChangeText={(v) => updateBr('salesPhone', v)} style={styles.formInput} />
                        <Text style={styles.filterSubLabel}>Telegram Channel URL</Text>
                        <TextInput value={br.telegramChannel} onChangeText={(v) => updateBr('telegramChannel', v)} autoCapitalize="none" style={styles.formInput} />
                        <Text style={styles.filterSubLabel}>TikTok URL</Text>
                        <TextInput value={br.tiktokUrl} onChangeText={(v) => updateBr('tiktokUrl', v)} autoCapitalize="none" style={styles.formInput} />
                        <Text style={styles.filterSubLabel}>Google Maps URL</Text>
                        <TextInput value={br.mapsUrl} onChangeText={(v) => updateBr('mapsUrl', v)} autoCapitalize="none" style={styles.formInput} />
                        <TouchableOpacity style={styles.primaryButton} onPress={() => void saveBranchesToServer()}>
                          <Text style={styles.primaryButtonText}>Save Branch Directory</Text>
                        </TouchableOpacity>
                      </View>
                    );
                  })()}
                </>
              )}

              {staffSection === 'catalog' && (
                <>
                  <Text style={styles.staffSectionTitle}>
                    {language === 'en' ? 'Upload New Item (AI Assisted)' : 'አዲስ እቃ ይጫኑ (በAI)'}
                  </Text>
                  <Text style={styles.staffMeta}>{t.addProductHelp}</Text>

                  <View style={styles.staffActions}>
                    <TouchableOpacity
                      style={styles.primarySmallButton}
                      onPress={() => void pickImageForStaffUpload('camera')}
                    >
                      <Text style={styles.primarySmallButtonText}>📷 Camera</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.secondarySmallButton}
                      onPress={() => void pickImageForStaffUpload('gallery')}
                    >
                      <Text style={styles.secondarySmallButtonText}>
                        🖼️ Gallery ({uploadedPhotoUris.length}/8)
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.primarySmallButton}
                      disabled={aiAnalyzing || batchAiAnalyzing}
                      onPress={() => void runAiRecognizeUpload()}
                    >
                      <Text style={styles.primarySmallButtonText}>
                        {aiAnalyzing ? 'Analyzing…' : '✨ AI Recognize'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {uploadedBase64Images.length > 1 && (
                    <TouchableOpacity
                      style={styles.batchAiButton}
                      disabled={aiAnalyzing || batchAiAnalyzing}
                      onPress={() => void runBatchCreateSeparateProducts()}
                    >
                      <Text style={styles.batchAiButtonText}>
                        {batchAiAnalyzing
                          ? 'Creating separate products…'
                          : `📦 Batch AI: Create ${uploadedBase64Images.length} Separate Products`}
                      </Text>
                    </TouchableOpacity>
                  )}

                  {uploadedPhotoUris.length > 0 && (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.galleryRow}>
                      {uploadedPhotoUris.map((uri, idx) => (
                        <View key={`staff-up-${idx}`} style={styles.uploadThumbWrap}>
                          <Image
                            source={{ uri }}
                            style={styles.galleryThumbImage}
                            resizeMode="cover"
                          />
                          <TouchableOpacity
                            style={styles.uploadRemoveBadge}
                            onPress={() => removeUploadedPhotoAt(idx)}
                          >
                            <Text style={styles.uploadRemoveText}>×</Text>
                          </TouchableOpacity>
                          {perImageColors[idx] ? (
                            <Text style={styles.uploadColorTag} numberOfLines={1}>
                              {perImageColors[idx]}
                            </Text>
                          ) : null}
                        </View>
                      ))}
                    </ScrollView>
                  )}

                  {detectedSwatches.length > 0 && (
                    <View style={styles.sizeRow}>
                      {detectedSwatches.map((sw, idx) => (
                        <View key={`${sw.name}-${idx}`} style={styles.colorChip}>
                          <View style={[styles.colorSwatchDot, { backgroundColor: sw.hex }]} />
                          <Text style={styles.sizeChipText}>{sw.name}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {aiStatusMsg ? (
                    <View style={styles.aiBannerBox}>
                      <Text style={styles.aiBannerText}>{aiStatusMsg}</Text>
                    </View>
                  ) : null}

                  <TextInput
                    value={newName}
                    onChangeText={setNewName}
                    placeholder={t.productName}
                    placeholderTextColor={COLORS.muted}
                    style={styles.formInput}
                  />
                  <TextInput
                    value={newNameAm}
                    onChangeText={setNewNameAm}
                    placeholder={t.productNameAm}
                    placeholderTextColor={COLORS.muted}
                    style={styles.formInput}
                  />
                  <TextInput
                    value={newBrand}
                    onChangeText={setNewBrand}
                    placeholder={language === 'en' ? 'Brand (AI detected, e.g. Jeep, Belika Select)' : 'ብራንድ (በAI የተለየ)'}
                    placeholderTextColor={COLORS.muted}
                    style={styles.formInput}
                  />
                  <Text style={styles.formLabel}>{t.department}</Text>
                  <View style={styles.sizeRow}>
                    {(['Men', 'Women', 'Kids'] as const).map((choice) => (
                      <TouchableOpacity
                        key={choice}
                        onPress={() => setNewDepartment(choice)}
                        style={[styles.sizeChip, newDepartment === choice && styles.sizeChipActive]}
                      >
                        <Text
                          style={[
                            styles.sizeChipText,
                            newDepartment === choice && styles.sizeChipTextActive,
                          ]}
                        >
                          {departmentLabel(choice)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={styles.formLabel}>{t.categories}</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.miniChipRow}>
                    {categories.map((cat) => (
                      <TouchableOpacity
                        key={cat.id}
                        onPress={() => setNewCategory(cat.name)}
                        style={[styles.miniChip, newCategory === cat.name && styles.miniChipActive]}
                      >
                        <Text
                          style={[
                            styles.miniChipText,
                            newCategory === cat.name && styles.miniChipTextActive,
                          ]}
                        >
                          {cat.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>

                  <TextInput
                    value={newSubcategory}
                    onChangeText={setNewSubcategory}
                    placeholder={language === 'en' ? 'Collection (AI detected, e.g. Casual Shirts)' : 'ስብስብ (Collection)'}
                    placeholderTextColor={COLORS.muted}
                    style={styles.formInput}
                  />
                  <TextInput
                    value={newFabric}
                    onChangeText={setNewFabric}
                    placeholder={language === 'en' ? 'Material / Fabric (AI detected, e.g. 100% Cotton)' : 'የጨርቅ አይነት (በAI የተለየ)'}
                    placeholderTextColor={COLORS.muted}
                    style={styles.formInput}
                  />
                  <TextInput
                    value={newColors}
                    onChangeText={setNewColors}
                    placeholder={t.colorsInput}
                    placeholderTextColor={COLORS.muted}
                    style={styles.formInput}
                  />

                  <View style={styles.manualSectionBox}>
                    <Text style={styles.manualSectionLabel}>
                      {language === 'en'
                        ? 'Manual Entry: Price & Color → Size → Quantity Matrix'
                        : 'በእጅ የሚገባ፦ ዋጋ እና ቀለም → መጠን → ብዛት'}
                    </Text>
                    <TextInput
                      value={newPrice}
                      onChangeText={setNewPrice}
                      placeholder={t.priceETB}
                      placeholderTextColor={COLORS.muted}
                      keyboardType="numeric"
                      style={styles.formInput}
                    />

                    <Text style={styles.filterSubLabel}>
                      {language === 'en' ? '1) Pick Size Preset' : '1) የመጠን ዓይነት ይምረጡ'}
                    </Text>
                    <View style={styles.sizeRow}>
                      {(
                        [
                          { id: 'apparel', label: 'Apparel (XS–3XL)' },
                          { id: 'kidsApparel', label: 'Kids (2Y–12Y)' },
                          { id: 'shoes', label: 'Shoes (28–43)' },
                          { id: 'free', label: 'Free Size' },
                        ] as const
                      ).map((pr) => (
                        <TouchableOpacity
                          key={pr.id}
                          onPress={() => {
                            setMatrixPreset(pr.id);
                            setMatrixPickedSizes([]);
                          }}
                          style={[styles.miniChip, matrixPreset === pr.id && styles.miniChipActive]}
                        >
                          <Text style={[styles.miniChipText, matrixPreset === pr.id && styles.miniChipTextActive]}>
                            {pr.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    <Text style={styles.filterSubLabel}>
                      {language === 'en' ? '2) Select or Enter Color' : '2) ቀለም ይምረጡ'}
                    </Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.miniChipRow}>
                      {[...new Set([
                        ...detectedSwatches.map((s) => s.name),
                        'Black',
                        'White',
                        'Olive',
                        'Navy',
                        'Beige',
                        'Terracotta',
                      ])].map((colName) => (
                        <TouchableOpacity
                          key={`mat-col-${colName}`}
                          onPress={() => {
                            setMatrixSelectedColor(colName);
                            setMatrixCustomColor('');
                          }}
                          style={[
                            styles.miniChip,
                            matrixSelectedColor === colName && styles.miniChipActive,
                          ]}
                        >
                          <View style={[styles.miniDot, { backgroundColor: colorSwatchHex(colName) }]} />
                          <Text
                            style={[
                              styles.miniChipText,
                              matrixSelectedColor === colName && styles.miniChipTextActive,
                            ]}
                          >
                            {colName}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                    <TextInput
                      value={matrixCustomColor}
                      onChangeText={(v) => {
                        setMatrixCustomColor(v);
                        if (v.trim()) setMatrixSelectedColor('');
                      }}
                      placeholder={language === 'en' ? 'Or custom color name…' : 'ወይም ሌላ ቀለም ይጻፉ…'}
                      placeholderTextColor={COLORS.muted}
                      style={styles.formInput}
                    />

                    <Text style={styles.filterSubLabel}>
                      {language === 'en' ? '3) Tap Available Sizes & Qty' : '3) መጠኖችንና ብዛት ይምረጡ'}
                    </Text>
                    <View style={styles.sizeRow}>
                      {SIZE_PRESETS[matrixPreset].map((sz) => {
                        const active = matrixPickedSizes.includes(sz);
                        return (
                          <TouchableOpacity
                            key={`mat-sz-${sz}`}
                            onPress={() =>
                              setMatrixPickedSizes((prev) =>
                                prev.includes(sz) ? prev.filter((x) => x !== sz) : [...prev, sz],
                              )
                            }
                            style={[styles.miniChip, active && styles.miniChipActive]}
                          >
                            <Text style={[styles.miniChipText, active && styles.miniChipTextActive]}>
                              {sz}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                    <View style={{ flexDirection: 'row', gap: 8, marginTop: 8, alignItems: 'center' }}>
                      <TextInput
                        value={matrixQtyInput}
                        onChangeText={setMatrixQtyInput}
                        keyboardType="numeric"
                        placeholder="Qty"
                        placeholderTextColor={COLORS.muted}
                        style={[styles.inlineInput, { width: 64, textAlign: 'center', minHeight: 38 }]}
                      />
                      <TouchableOpacity
                        style={[styles.primarySmallButton, { flex: 1 }]}
                        onPress={addMatrixToUpload}
                      >
                        <Text style={styles.primarySmallButtonText}>
                          + Add Sizes for {matrixCustomColor.trim() || matrixSelectedColor || 'Color'}
                        </Text>
                      </TouchableOpacity>
                    </View>

                    {uploadMatrix.length > 0 && (
                      <View style={{ marginTop: 10 }}>
                        {uploadMatrix.map((row, rIdx) => (
                          <View key={`${row.color}-${row.size}-${rIdx}`} style={styles.matrixSummaryRow}>
                            <View style={[styles.miniDot, { backgroundColor: colorSwatchHex(row.color) }]} />
                            <Text style={[styles.staffCardTitle, { flex: 1 }]}>
                              {row.color} · {row.size}
                            </Text>
                            <Text style={styles.staffMeta}>Qty: {row.stock}</Text>
                            <TouchableOpacity
                              onPress={() =>
                                setUploadMatrix((prev) => prev.filter((_, i) => i !== rIdx))
                              }
                            >
                              <Text style={styles.removeText}>✕</Text>
                            </TouchableOpacity>
                          </View>
                        ))}
                      </View>
                    )}

                    <TextInput
                      value={newSizes}
                      onChangeText={setNewSizes}
                      placeholder={language === 'en' ? 'Or quick comma sizes (optional)' : t.sizesInput}
                      placeholderTextColor={COLORS.muted}
                      style={styles.formInput}
                    />
                  </View>

                  <View style={styles.staffActions}>
                    <TouchableOpacity
                      style={styles.secondarySmallButton}
                      onPress={() => saveProductFromStaff(false)}
                    >
                      <Text style={styles.secondarySmallButtonText}>{t.addDraft}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.primarySmallButton}
                      onPress={() => saveProductFromStaff(true)}
                    >
                      <Text style={styles.primarySmallButtonText}>{t.publishNow}</Text>
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.formLabel}>Belika AI & Maps Server URL</Text>
                  <TextInput
                    value={apiBaseUrl}
                    onChangeText={setApiBaseUrl}
                    placeholder="https://..."
                    placeholderTextColor={COLORS.muted}
                    autoCapitalize="none"
                    style={styles.formInput}
                  />
                  <View style={styles.staffActions}>
                    <TouchableOpacity
                      style={styles.primarySmallButton}
                      onPress={() => void testServerConnection()}
                    >
                      <Text style={styles.primarySmallButtonText}>Test Server</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.secondarySmallButton}
                      onPress={() => {
                        setApiBaseUrl(SHARED_API_BASE);
                        setServerTestMsg(null);
                      }}
                    >
                      <Text style={styles.secondarySmallButtonText}>Use Shared URL</Text>
                    </TouchableOpacity>
                  </View>
                  {serverTestMsg ? (
                    <Text style={styles.serverStatusText}>{serverTestMsg}</Text>
                  ) : null}
                </>
              )}

              {staffSection === 'stock' && (
                <>
                  <Text style={styles.staffSectionTitle}>{t.stock}</Text>
                  <View style={{ flexDirection: 'row', gap: 6, marginBottom: 8 }}>
                    <TextInput
                      value={stockQuery}
                      onChangeText={setStockQuery}
                      placeholder={language === 'en' ? 'Search stock by name/brand…' : 'ክምችት ይፈልጉ…'}
                      placeholderTextColor={COLORS.muted}
                      style={[styles.inlineInput, { flex: 1 }]}
                    />
                    <TouchableOpacity
                      onPress={() => setLowStockOnly((v) => !v)}
                      style={[styles.foldToggleBadge, lowStockOnly && styles.staffTabBtnActive]}
                    >
                      <Text style={[styles.foldToggleText, lowStockOnly && { color: COLORS.white }]}>
                        Low ≤2
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.demoNote}>{t.sampleWarning}</Text>
                  {filteredStockProducts.map((product) => {
                    const isProductExpanded = Boolean(expandedExpoProducts[product.id]);
                    const totalStock = (product.variants ?? []).reduce((sum, v) => sum + v.stock, 0);

                    return (
                      <View key={product.id} style={styles.staffCard}>
                        <TouchableOpacity
                          activeOpacity={0.8}
                          onPress={() =>
                            setExpandedExpoProducts((prev) => ({
                              ...prev,
                              [product.id]: !prev[product.id],
                            }))
                          }
                          style={styles.staffProductHeading}
                        >
                          <View style={{ flex: 1 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                              <Text style={styles.staffCardTitle}>
                                {language === 'en' ? product.name : product.nameAm}
                              </Text>
                              <View style={styles.stockCountPill}>
                                <Text style={styles.stockCountPillText}>Stock: {totalStock}</Text>
                              </View>
                            </View>
                            <Text style={styles.staffMeta}>
                              {product.department} · {product.category} ·{' '}
                              {product.status === 'draft' ? t.draft : t.published} · ETB{' '}
                              {product.price.toLocaleString('en-US')}
                            </Text>
                          </View>

                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            {product.status === 'draft' && (
                              <TouchableOpacity
                                style={styles.primarySmallButton}
                                onPress={() =>
                                  setProducts((current) =>
                                    current.map((item) =>
                                      item.id === product.id ? { ...item, status: 'published' } : item,
                                    ),
                                  )
                                }
                              >
                                <Text style={styles.primarySmallButtonText}>{t.verifyPublish}</Text>
                              </TouchableOpacity>
                            )}
                            <TouchableOpacity
                              style={styles.foldToggleBadge}
                              onPress={() => setEditingProduct({ ...product })}
                            >
                              <Text style={styles.foldToggleText}>✎</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={styles.deleteIconBtn}
                              onPress={() => handleDeleteProduct(product)}
                            >
                              <Text style={styles.deleteIconText}>🗑</Text>
                            </TouchableOpacity>
                            <View style={styles.foldToggleBadge}>
                              <Text style={styles.foldToggleText}>
                                {isProductExpanded ? '▲ Fold' : '▼ Sizes'}
                              </Text>
                            </View>
                          </View>
                        </TouchableOpacity>

                        {/* Expanded Product: Size Accordions + Add Size */}
                        {isProductExpanded && (() => {
                          const variants = product.variants ?? [];
                          const sizeGroups: Record<string, ProductVariant[]> = {};
                          variants.forEach((v) => {
                            const s = v.size?.trim() || 'Standard';
                            if (!sizeGroups[s]) sizeGroups[s] = [];
                            sizeGroups[s].push(v);
                          });
                          const sizeNames = Object.keys(sizeGroups);

                          return (
                            <View style={{ marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: COLORS.line }}>
                              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                <Text style={{ fontSize: 12, fontWeight: '700', color: COLORS.ink }}>
                                  {language === 'en'
                                    ? `Sizes (${sizeNames.length}) · Tap size for colors`
                                    : `መጠኖች (${sizeNames.length}) · ቀለሞችን ለማየት መጠንን ይንኩ`}
                                </Text>
                                <TouchableOpacity
                                  style={styles.addSizeBtn}
                                  onPress={() =>
                                    setShowAddExpoSizeForProduct((cur) =>
                                      cur === product.id ? null : product.id,
                                    )
                                  }
                                >
                                  <Text style={styles.addSizeBtnText}>
                                    {language === 'en' ? '+ Add Size' : '+ መጠን ጨምር'}
                                  </Text>
                                </TouchableOpacity>
                              </View>

                              {showAddExpoSizeForProduct === product.id && (
                                <View style={styles.inlineFormCard}>
                                  <Text style={styles.inlineFormTitle}>
                                    {language === 'en' ? 'Add New Size' : 'አዲስ መጠን ጨምር'}
                                  </Text>
                                  <View style={{ flexDirection: 'row', gap: 6, marginTop: 6 }}>
                                    <TextInput
                                      placeholder="Size (S, M, XL, 38)"
                                      placeholderTextColor={COLORS.muted}
                                      value={newExpoSizeName}
                                      onChangeText={setNewExpoSizeName}
                                      style={[styles.inlineInput, { flex: 1 }]}
                                    />
                                    <TextInput
                                      placeholder="Color (Black)"
                                      placeholderTextColor={COLORS.muted}
                                      value={newExpoSizeColor}
                                      onChangeText={setNewExpoSizeColor}
                                      style={[styles.inlineInput, { flex: 1 }]}
                                    />
                                    <TextInput
                                      placeholder="Qty"
                                      placeholderTextColor={COLORS.muted}
                                      keyboardType="numeric"
                                      value={newExpoSizeStock}
                                      onChangeText={setNewExpoSizeStock}
                                      style={[styles.inlineInput, { width: 52, textAlign: 'center' }]}
                                    />
                                  </View>
                                  <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
                                    <TouchableOpacity
                                      onPress={() => setShowAddExpoSizeForProduct(null)}
                                      style={styles.secondarySmallButton}
                                    >
                                      <Text style={styles.secondarySmallButtonText}>
                                        {language === 'en' ? 'Cancel' : 'ይቅር'}
                                      </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                      onPress={() => handleAddSizeToProduct(product.id)}
                                      style={styles.primarySmallButton}
                                    >
                                      <Text style={styles.primarySmallButtonText}>
                                        {language === 'en' ? 'Save Size' : 'አስቀምጥ'}
                                      </Text>
                                    </TouchableOpacity>
                                  </View>
                                </View>
                              )}

                              {sizeNames.length === 0 ? (
                                <Text style={[styles.staffMeta, { paddingVertical: 8, fontStyle: 'italic' }]}>
                                  No sizes or stock variants yet.
                                </Text>
                              ) : (
                                sizeNames.map((sizeName) => {
                                  const sizeKey = `${product.id}::${sizeName}`;
                                  const isSizeExpanded = Boolean(expandedExpoSizes[sizeKey]);
                                  const colorVariants = sizeGroups[sizeName];
                                  const sizeTotalStock = colorVariants.reduce((sum, v) => sum + v.stock, 0);
                                  const addInput = addExpoColorInputs[sizeKey] || { color: '', stock: '1' };

                                  return (
                                    <View
                                      key={sizeKey}
                                      style={{
                                        marginTop: 8,
                                        borderWidth: 1,
                                        borderColor: '#E8E2D9',
                                        borderRadius: 10,
                                        overflow: 'hidden',
                                      }}
                                    >
                                      <TouchableOpacity
                                        style={{
                                          flexDirection: 'row',
                                          alignItems: 'center',
                                          justifyContent: 'space-between',
                                          padding: 10,
                                          backgroundColor: '#FAF7F2',
                                        }}
                                        onPress={() =>
                                          setExpandedExpoSizes((prev) => ({
                                            ...prev,
                                            [sizeKey]: !prev[sizeKey],
                                          }))
                                        }
                                      >
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                          <Text style={{ fontWeight: '800', fontSize: 13, color: '#1A332A' }}>
                                            Size: {sizeName}
                                          </Text>
                                          <Text style={{ fontSize: 12, color: '#5C625E' }}>
                                            ({colorVariants.length}{' '}
                                            {colorVariants.length === 1 ? 'color' : 'colors'})
                                          </Text>
                                        </View>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                          <Text
                                            style={{
                                              fontSize: 12,
                                              fontWeight: '700',
                                              color: sizeTotalStock > 0 ? '#1A5937' : '#942C2C',
                                            }}
                                          >
                                            Total: {sizeTotalStock}
                                          </Text>
                                          <Text style={{ fontSize: 11, color: '#8C938F', fontWeight: '700' }}>
                                            {isSizeExpanded ? '▲ Fold' : '▼ Colors'}
                                          </Text>
                                        </View>
                                      </TouchableOpacity>

                                      {isSizeExpanded && (
                                        <View style={{ padding: 10, backgroundColor: '#FFFFFF' }}>
                                          {colorVariants.map((variant) => (
                                            <View key={variant.id} style={styles.stockRow}>
                                              <View style={[styles.colorSwatchDot, { backgroundColor: colorSwatchHex(variant.color), marginRight: 8 }]} />
                                              <View style={styles.stockTextWrap}>
                                                <Text style={styles.staffMeta}>
                                                  {variant.color}
                                                </Text>
                                                <Text style={styles.stockNumber}>
                                                  {t.stock}: {variant.stock}
                                                </Text>
                                              </View>
                                              <TouchableOpacity
                                                style={styles.stockAdjustButton}
                                                onPress={() => adjustStock(product.id, variant.id, 1, 'restock')}
                                              >
                                                <Text style={styles.stockAdjustText}>+1</Text>
                                              </TouchableOpacity>
                                              <TouchableOpacity
                                                style={styles.saleAdjustButton}
                                                onPress={() => adjustStock(product.id, variant.id, -1, 'sale')}
                                              >
                                                <Text style={styles.saleAdjustText}>−1</Text>
                                              </TouchableOpacity>
                                              <TouchableOpacity
                                                style={styles.deleteVariantBtn}
                                                onPress={() =>
                                                  handleRemoveVariant(
                                                    product.id,
                                                    variant.id,
                                                    variant.size,
                                                    variant.color,
                                                  )
                                                }
                                              >
                                                <Text style={styles.deleteIconText}>✕</Text>
                                              </TouchableOpacity>
                                            </View>
                                          ))}

                                          {/* Inline Add Color to Size */}
                                          <View style={styles.addColorBox}>
                                            <Text style={styles.addColorTitle}>
                                              {language === 'en'
                                                ? `+ Add Color to Size ${sizeName}`
                                                : `+ ወደ መጠን ${sizeName} ቀለም ጨምር`}
                                            </Text>
                                            {product.colorSwatches && product.colorSwatches.length > 0 && (
                                              <ScrollView
                                                horizontal
                                                showsHorizontalScrollIndicator={false}
                                                style={{ marginVertical: 6 }}
                                              >
                                                {product.colorSwatches.map((swatch) => (
                                                  <TouchableOpacity
                                                    key={swatch.name}
                                                    onPress={() =>
                                                      setAddExpoColorInputs((prev) => ({
                                                        ...prev,
                                                        [sizeKey]: {
                                                          color: swatch.name,
                                                          stock: prev[sizeKey]?.stock || '1',
                                                        },
                                                      }))
                                                    }
                                                    style={[
                                                      styles.miniChip,
                                                      addInput.color.toLowerCase() === swatch.name.toLowerCase() &&
                                                        styles.miniChipActive,
                                                    ]}
                                                  >
                                                    <View
                                                      style={[styles.miniDot, { backgroundColor: swatch.hex }]}
                                                    />
                                                    <Text
                                                      style={[
                                                        styles.miniChipText,
                                                        addInput.color.toLowerCase() === swatch.name.toLowerCase() &&
                                                          styles.miniChipTextActive,
                                                      ]}
                                                    >
                                                      {swatch.name}
                                                    </Text>
                                                  </TouchableOpacity>
                                                ))}
                                              </ScrollView>
                                            )}
                                            <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center', marginTop: 4 }}>
                                              <TextInput
                                                placeholder={
                                                  language === 'en' ? 'Color (e.g. Navy)' : 'ቀለም (ለምሳሌ ኔቪ)'
                                                }
                                                placeholderTextColor={COLORS.muted}
                                                value={addInput.color}
                                                onChangeText={(val) =>
                                                  setAddExpoColorInputs((prev) => ({
                                                    ...prev,
                                                    [sizeKey]: {
                                                      color: val,
                                                      stock: prev[sizeKey]?.stock || '1',
                                                    },
                                                  }))
                                                }
                                                style={[styles.inlineInput, { flex: 1 }]}
                                              />
                                              <TextInput
                                                placeholder="Qty"
                                                placeholderTextColor={COLORS.muted}
                                                keyboardType="numeric"
                                                value={addInput.stock}
                                                onChangeText={(val) =>
                                                  setAddExpoColorInputs((prev) => ({
                                                    ...prev,
                                                    [sizeKey]: {
                                                      color: prev[sizeKey]?.color || '',
                                                      stock: val,
                                                    },
                                                  }))
                                                }
                                                style={[styles.inlineInput, { width: 48, textAlign: 'center' }]}
                                              />
                                              <TouchableOpacity
                                                onPress={() => handleAddColorToSize(product.id, sizeName)}
                                                style={styles.primarySmallButton}
                                              >
                                                <Text style={styles.primarySmallButtonText}>
                                                  {language === 'en' ? '+ Add' : '+ ጨምር'}
                                                </Text>
                                              </TouchableOpacity>
                                            </View>
                                          </View>
                                        </View>
                                      )}
                                    </View>
                                  );
                                })
                              )}
                            </View>
                          );
                        })()}
                      </View>
                    );
                  })}

                  <Text style={styles.staffSectionTitle}>{t.inventoryHistory}</Text>
                  {movements.length === 0 ? (
                    <Text style={styles.emptyText}>{t.noMovements}</Text>
                  ) : (
                    movements.slice(0, 20).map((movement) => {
                      const product = products.find((item) => item.id === movement.productId);
                      const variant = product?.variants?.find(
                        (item) => item.id === movement.variantId,
                      );
                      return (
                        <Text key={movement.id} style={styles.staffMeta}>
                          {new Date(movement.createdAt).toLocaleString()} ·{' '}
                          {product?.name ?? movement.productId} · {variant?.size ?? ''}{' '}
                          {variant?.color ?? ''} · {movement.kind}{' '}
                          {movement.quantity > 0 ? '+' : ''}
                          {movement.quantity}
                        </Text>
                      );
                    })
                  )}
                </>
              )}
            </ScrollView>

            {/* Merchant Edit Product Modal */}
            <Modal
              visible={editingProduct !== null}
              transparent
              animationType="fade"
              onRequestClose={() => setEditingProduct(null)}
            >
              <View style={styles.quickModalOverlay}>
                {editingProduct && (
                  <View style={[styles.quickModalCard, { maxHeight: '88%' }]}>
                    <View style={styles.filterPanelHead}>
                      <Text style={styles.detailName} numberOfLines={1}>
                        {language === 'en' ? 'Edit Product' : 'ምርት አስተካክል'}
                      </Text>
                      <TouchableOpacity onPress={() => setEditingProduct(null)}>
                        <Text style={styles.clearSearchText}>×</Text>
                      </TouchableOpacity>
                    </View>
                    <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                      <Text style={styles.formLabel}>
                        {language === 'en' ? 'Product Name (EN)' : 'የምርት ስም (እንግሊዝኛ)'}
                      </Text>
                      <TextInput
                        value={editingProduct.name}
                        onChangeText={(val) =>
                          setEditingProduct((prev) => (prev ? { ...prev, name: val } : prev))
                        }
                        placeholder="Product name"
                        placeholderTextColor={COLORS.muted}
                        style={styles.formInput}
                      />

                      <Text style={styles.formLabel}>
                        {language === 'en' ? 'Product Name (AM)' : 'የምርት ስም (አማርኛ)'}
                      </Text>
                      <TextInput
                        value={editingProduct.nameAm}
                        onChangeText={(val) =>
                          setEditingProduct((prev) => (prev ? { ...prev, nameAm: val } : prev))
                        }
                        placeholder="Amharic name"
                        placeholderTextColor={COLORS.muted}
                        style={styles.formInput}
                      />

                      <View style={{ flexDirection: 'row', gap: 8 }}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.formLabel}>
                            {language === 'en' ? 'Brand' : 'ብራንድ'}
                          </Text>
                          <TextInput
                            value={editingProduct.brand ?? ''}
                            onChangeText={(val) =>
                              setEditingProduct((prev) => (prev ? { ...prev, brand: val } : prev))
                            }
                            placeholder="Belika Signature"
                            placeholderTextColor={COLORS.muted}
                            style={styles.formInput}
                          />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.formLabel}>
                            {language === 'en' ? 'Badge' : 'መለያ'}
                          </Text>
                          <TextInput
                            value={editingProduct.badge ?? ''}
                            onChangeText={(val) =>
                              setEditingProduct((prev) => (prev ? { ...prev, badge: val } : prev))
                            }
                            placeholder="Best Seller"
                            placeholderTextColor={COLORS.muted}
                            style={styles.formInput}
                          />
                        </View>
                      </View>

                      <View style={{ flexDirection: 'row', gap: 8 }}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.formLabel}>
                            {language === 'en' ? 'Price (ETB)' : 'ዋጋ (ብር)'}
                          </Text>
                          <TextInput
                            value={String(editingProduct.price)}
                            keyboardType="numeric"
                            onChangeText={(val) => {
                              const num = Number(val.replace(/[^0-9.]/g, ''));
                              setEditingProduct((prev) =>
                                prev ? { ...prev, price: Number.isFinite(num) ? num : 0 } : prev,
                              );
                            }}
                            style={styles.formInput}
                          />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.formLabel}>
                            {language === 'en' ? 'Compare At (ETB)' : 'የቀድሞ ዋጋ (ብር)'}
                          </Text>
                          <TextInput
                            value={
                              editingProduct.compareAtPrice
                                ? String(editingProduct.compareAtPrice)
                                : ''
                            }
                            keyboardType="numeric"
                            placeholder="Optional"
                            placeholderTextColor={COLORS.muted}
                            onChangeText={(val) => {
                              const trimmed = val.trim();
                              const num = Number(trimmed.replace(/[^0-9.]/g, ''));
                              setEditingProduct((prev) =>
                                prev
                                  ? {
                                      ...prev,
                                      compareAtPrice:
                                        trimmed && Number.isFinite(num) && num > 0
                                          ? num
                                          : undefined,
                                    }
                                  : prev,
                              );
                            }}
                            style={styles.formInput}
                          />
                        </View>
                      </View>

                      <Text style={styles.formLabel}>
                        {language === 'en' ? 'Category' : 'ምድብ'}
                      </Text>
                      <TextInput
                        value={editingProduct.category}
                        onChangeText={(val) =>
                          setEditingProduct((prev) => (prev ? { ...prev, category: val } : prev))
                        }
                        placeholder="Category"
                        placeholderTextColor={COLORS.muted}
                        style={styles.formInput}
                      />

                      <Text style={styles.formLabel}>
                        {language === 'en' ? 'Fabric & Material' : 'ጨርቅ እና ቁሳቁስ'}
                      </Text>
                      <TextInput
                        value={editingProduct.fabric ?? ''}
                        onChangeText={(val) =>
                          setEditingProduct((prev) => (prev ? { ...prev, fabric: val } : prev))
                        }
                        placeholder="100% Cotton"
                        placeholderTextColor={COLORS.muted}
                        style={styles.formInput}
                      />

                      <Text style={styles.formLabel}>
                        {language === 'en' ? 'Care Instructions' : 'የጥንቃቄ መመሪያ'}
                      </Text>
                      <TextInput
                        value={editingProduct.careInstructions ?? ''}
                        onChangeText={(val) =>
                          setEditingProduct((prev) =>
                            prev ? { ...prev, careInstructions: val } : prev,
                          )
                        }
                        placeholder="Cold gentle wash"
                        placeholderTextColor={COLORS.muted}
                        style={styles.formInput}
                      />

                      <Text style={styles.formLabel}>
                        {language === 'en' ? 'Size Guidance' : 'የመጠን ምክር'}
                      </Text>
                      <TextInput
                        value={editingProduct.sizeGuidance ?? ''}
                        onChangeText={(val) =>
                          setEditingProduct((prev) =>
                            prev ? { ...prev, sizeGuidance: val } : prev,
                          )
                        }
                        placeholder="True to size"
                        placeholderTextColor={COLORS.muted}
                        style={styles.formInput}
                      />

                      <View style={[styles.staffActions, { marginTop: 16 }]}>
                        <TouchableOpacity
                          style={[styles.secondarySmallButton, { flex: 1, minHeight: 44 }]}
                          onPress={() => setEditingProduct(null)}
                        >
                          <Text style={styles.secondarySmallButtonText}>
                            {language === 'en' ? 'Cancel' : 'ይቅር'}
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.primarySmallButton, { flex: 1, minHeight: 44 }]}
                          onPress={saveEditedProduct}
                        >
                          <Text style={styles.primarySmallButtonText}>
                            {language === 'en' ? 'Save Changes' : 'አስቀምጥ'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </ScrollView>
                  </View>
                )}
              </View>
            </Modal>
          </View>
        </Modal>
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  gestureRoot: { flex: 1 },
  safe: { flex: 1, backgroundColor: COLORS.ivory, paddingTop: TOP_INSET },
  header: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.line,
  },
  brand: { flex: 1, flexDirection: 'row', alignItems: 'center', marginRight: 8 },
  brandMark: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: '#E4DDD2',
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 9,
    overflow: 'hidden',
  },
  brandLogoImage: {
    width: '100%',
    height: '100%',
    borderRadius: 9,
  },
  splashOverlay: {
    flex: 1,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  splashLogoImage: {
    width: 240,
    height: 144,
  },
  splashTitle: {
    marginTop: 10,
    fontSize: 18,
    fontWeight: '800',
    color: '#F59342',
    letterSpacing: 0.3,
  },
  splashTitleAccent: {
    fontWeight: '700',
    color: COLORS.ink,
  },
  splashSub: {
    marginTop: 5,
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.muted,
    textAlign: 'center',
  },
  brandMarkText: { color: COLORS.ivory, fontSize: 18, fontWeight: '900' },
  brandMarkDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: COLORS.terracotta,
    position: 'absolute',
    bottom: 5,
    right: 5,
  },
  brandName: { color: '#F59342', fontSize: 15, fontWeight: '800', letterSpacing: -0.2 },
  brandSub: { color: COLORS.muted, fontSize: 10, fontWeight: '500', marginTop: 1 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 0 },
  langSwitch: {
    flexDirection: 'row',
    backgroundColor: COLORS.sand,
    borderRadius: 12,
    padding: 3,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  langOption: {
    minHeight: 34,
    minWidth: 36,
    borderRadius: 9,
    paddingHorizontal: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  langOptionActive: { backgroundColor: COLORS.forest },
  languageText: { color: COLORS.ink, fontWeight: '700', fontSize: 12 },
  languageTextActive: { color: COLORS.white },
  staffChipButton: {
    minHeight: 40,
    paddingHorizontal: 13,
    borderRadius: 12,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  staffChipText: { color: COLORS.forest, fontSize: 12, fontWeight: '800' },
  content: { paddingHorizontal: 18, paddingTop: 14, paddingBottom: 32 },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  searchBox: {
    flex: 1,
    minHeight: 44,
    borderRadius: 12,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.line,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  searchInput: { flex: 1, color: COLORS.ink, fontSize: 13 },
  clearSearchBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.sand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearSearchText: { color: COLORS.ink, fontSize: 16, fontWeight: '700', marginTop: -1 },
  cameraTriggerBtn: {
    minHeight: 44,
    paddingHorizontal: 11,
    borderRadius: 12,
    backgroundColor: COLORS.forest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraTriggerText: { color: COLORS.white, fontSize: 11, fontWeight: '800' },
  filterTriggerBtn: {
    minHeight: 44,
    paddingHorizontal: 11,
    borderRadius: 12,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterTriggerActive: { backgroundColor: COLORS.terracotta, borderColor: COLORS.terracotta },
  filterTriggerText: { color: COLORS.ink, fontSize: 11, fontWeight: '700' },
  filterTriggerTextActive: { color: COLORS.white },
  filterPanel: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.line,
    padding: 12,
    marginBottom: 16,
  },
  filterPanelHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  filterPanelTitle: { color: COLORS.ink, fontSize: 13, fontWeight: '800' },
  resetFilterLink: { color: COLORS.terracotta, fontSize: 12, fontWeight: '700' },
  filterSubLabel: { color: COLORS.muted, fontSize: 11, fontWeight: '700', marginTop: 8, marginBottom: 5 },
  miniChipRow: { marginBottom: 4 },
  miniChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: COLORS.line,
    backgroundColor: COLORS.ivory,
    marginRight: 6,
  },
  miniChipActive: { backgroundColor: COLORS.forest, borderColor: COLORS.forest },
  miniChipText: { color: COLORS.ink, fontSize: 11, fontWeight: '600' },
  miniChipTextActive: { color: COLORS.white },
  miniDot: { width: 10, height: 10, borderRadius: 5, borderWidth: 1, borderColor: 'rgba(0,0,0,0.2)' },
  tibebStrip: { flexDirection: 'row', height: 5, width: '100%' },
  tibebSegment: { height: '100%' },
  banner: { borderRadius: 22, backgroundColor: COLORS.forest, overflow: 'hidden', marginBottom: 20 },
  bannerBody: { flexDirection: 'row', alignItems: 'center', padding: 18, gap: 12 },
  bannerCopy: { flex: 1 },
  bannerTop: { color: '#E5B899', fontSize: 11, fontWeight: '600', marginBottom: 8 },
  bannerTitle: {
    color: COLORS.white,
    fontSize: 27,
    fontWeight: '700',
    lineHeight: 33,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  bannerText: { color: '#D8E1DC', fontSize: 13, marginTop: 10, lineHeight: 20 },
  bannerButton: {
    alignSelf: 'flex-start',
    minHeight: 42,
    backgroundColor: COLORS.terracotta,
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 10,
    justifyContent: 'center',
  },
  bannerButtonText: { color: COLORS.white, fontSize: 13, fontWeight: '700' },
  heroLookbookCard: {
    width: 108,
    backgroundColor: COLORS.ivory,
    borderRadius: 14,
    padding: 5,
    transform: [{ rotate: '2deg' }],
  },
  heroLookbookImage: { width: '100%', height: 108, borderRadius: 10 },
  heroLookbookCaption: { paddingTop: 6, paddingBottom: 3, paddingHorizontal: 3 },
  heroLookbookName: { color: COLORS.ink, fontSize: 11, fontWeight: '700' },
  heroLookbookPrice: { color: COLORS.terracotta, fontSize: 11, fontWeight: '800', marginTop: 1 },
  categoryWrap: { marginBottom: 14 },
  manageCatsLink: { color: COLORS.terracotta, fontSize: 12, fontWeight: '700' },
  featuredStrip: { marginBottom: 20 },
  featuredRow: { marginTop: 6 },
  featuredCard: {
    width: 140,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.line,
    padding: 8,
    marginRight: 10,
  },
  featuredImage: { width: '100%', height: 104, borderRadius: 11, backgroundColor: COLORS.sand },
  featuredName: { color: COLORS.ink, fontSize: 13, fontWeight: '700', marginTop: 8 },
  featuredPrice: { color: COLORS.forest, fontSize: 12, fontWeight: '800', marginTop: 2 },
  sectionTitle: { color: COLORS.ink, fontSize: 17, fontWeight: '800' },
  chipRow: { marginTop: 10, marginBottom: 16 },
  chip: {
    minHeight: 40,
    paddingHorizontal: 16,
    paddingVertical: 9,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    marginRight: 8,
    borderWidth: 1,
    borderColor: COLORS.line,
    justifyContent: 'center',
  },
  chipActive: { backgroundColor: COLORS.forest, borderColor: COLORS.forest },
  chipText: { color: COLORS.ink, fontSize: 13, fontWeight: '600' },
  chipTextActive: { color: COLORS.white },
  listHeading: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  countText: { color: COLORS.muted, fontSize: 12, fontWeight: '600' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  card: {
    width: '48.5%',
    backgroundColor: COLORS.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.line,
    padding: 9,
    marginBottom: 14,
  },
  productPhoto: {
    height: 144,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  productRealPhoto: {
    width: '100%',
    height: '100%',
    borderRadius: 13,
  },
  badgeTag: {
    position: 'absolute',
    top: 7,
    left: 7,
    backgroundColor: 'rgba(26, 51, 42, 0.90)',
    borderRadius: 7,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  badgeTagBottom: {
    position: 'absolute',
    bottom: 7,
    left: 7,
    borderRadius: 7,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  badgeTagText: { color: COLORS.white, fontSize: 9, fontWeight: '800' },
  placardWrap: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 10,
  },
  placardHairline: {
    width: 34,
    height: 3,
    borderRadius: 2,
    backgroundColor: COLORS.terracotta,
    opacity: 0.7,
  },
  placardDept: { color: COLORS.muted, fontSize: 9, fontWeight: '800', letterSpacing: 1.2 },
  placardMonogramCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: COLORS.ivory,
    borderWidth: 1.5,
    borderColor: COLORS.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placardMonogram: { color: COLORS.forest, fontSize: 17, fontWeight: '900', letterSpacing: 1 },
  placardMonogramLarge: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: COLORS.ivory,
    borderWidth: 2,
    borderColor: COLORS.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placardMonogramLargeText: { color: COLORS.forest, fontSize: 30, fontWeight: '900', letterSpacing: 2 },
  placardNote: { color: COLORS.muted, fontSize: 8, letterSpacing: 0.9, fontWeight: '700' },
  photoTapArea: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 13,
  },
  heartButton: {
    position: 'absolute',
    top: 7,
    right: 7,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(250, 247, 242, 0.94)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heartText: { color: COLORS.ink, fontSize: 16 },
  heartTextActive: { color: COLORS.terracotta },
  productName: { color: COLORS.ink, fontSize: 13, fontWeight: '700', marginTop: 4, minHeight: 34 },
  swatchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 },
  cardSwatchDot: { width: 12, height: 12, borderRadius: 6, borderWidth: 1, borderColor: 'rgba(0,0,0,0.2)' },
  ratingMini: { color: COLORS.ink, fontSize: 10, fontWeight: '700' },
  cardBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1EDE6',
  },
  price: { color: COLORS.forest, fontSize: 13, fontWeight: '800' },
  addButton: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: COLORS.terracotta,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: { color: COLORS.white, fontSize: 19, fontWeight: '700', marginTop: -2 },
  emptyBox: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.line,
    padding: 28,
    alignItems: 'center',
    marginBottom: 15,
  },
  emptyBadge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.sand,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyIcon: { fontSize: 24, color: COLORS.terracotta },
  emptyText: { color: COLORS.muted, textAlign: 'center', fontSize: 13, lineHeight: 19 },
  demoNote: {
    color: COLORS.muted,
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 14,
  },
  bottomBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: COLORS.line,
    backgroundColor: COLORS.white,
    paddingBottom: Platform.OS === 'ios' ? 6 : 8,
    paddingTop: 8,
  },
  bottomTab: {
    flex: 1,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  tabIconWrap: { position: 'relative', alignItems: 'center', justifyContent: 'center' },
  bottomHeartGlyph: { fontSize: 20, lineHeight: 20, color: COLORS.muted },
  tabBadge: {
    position: 'absolute',
    top: -5,
    right: -11,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.terracotta,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  tabBadgeText: { color: COLORS.white, fontSize: 9, fontWeight: '800' },
  bottomTabLabel: { fontSize: 11, fontWeight: '600', color: COLORS.muted, marginTop: 4 },
  bottomTabActiveText: { color: COLORS.forest, fontWeight: '800' },
  bottomActiveIndicator: {
    position: 'absolute',
    top: -8,
    width: 30,
    height: 3,
    borderRadius: 2,
    backgroundColor: COLORS.terracotta,
  },
  modalSafe: { flex: 1, backgroundColor: COLORS.ivory, paddingTop: TOP_INSET },
  detailHeader: {
    height: 56,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.line,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: { color: COLORS.ink, fontSize: 30, marginTop: -4 },
  detailHeaderTitle: { color: COLORS.ink, fontSize: 16, fontWeight: '800' },
  detailContent: { padding: 18, paddingBottom: 28 },
  detailPhoto: {
    height: 310,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  zoomWrapper: { width: '100%', height: '100%', position: 'relative' },
  zoomTouchArea: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  detailRealPhoto: { width: '100%', height: '100%' },
  resetZoomButton: {
    position: 'absolute',
    left: 10,
    bottom: 10,
    backgroundColor: 'rgba(26, 51, 42, 0.85)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  resetZoomText: { color: COLORS.white, fontSize: 11, fontWeight: '700' },
  dotsOverlay: {
    position: 'absolute',
    bottom: 12,
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 5,
    backgroundColor: 'rgba(31, 36, 33, 0.45)',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 10,
  },
  galleryDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.5)' },
  galleryDotActive: { width: 14, backgroundColor: COLORS.white },
  photoCounter: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    backgroundColor: 'rgba(31, 36, 33, 0.8)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  photoCounterText: { color: COLORS.white, fontSize: 11, fontWeight: '800' },
  galleryRow: { marginTop: 12, marginBottom: 8 },
  galleryThumb: {
    width: 82,
    padding: 4,
    marginRight: 8,
    borderRadius: 12,
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.line,
    alignItems: 'center',
  },
  galleryThumbActive: { borderColor: COLORS.terracotta },
  galleryThumbImage: { width: 68, height: 68, borderRadius: 8, marginRight: 6 },
  galleryCaption: { color: COLORS.ink, fontSize: 10, marginTop: 4 },
  detailTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 16,
  },
  detailEyebrow: {
    color: COLORS.muted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.1,
    marginBottom: 4,
  },
  detailName: { color: COLORS.ink, fontSize: 22, fontWeight: '800' },
  stockPill: {
    backgroundColor: '#E7F3EC',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    marginTop: 4,
  },
  stockPillText: { color: '#1A5937', fontSize: 11, fontWeight: '800' },
  stockPillEmpty: { backgroundColor: '#FAECEC' },
  stockPillEmptyText: { color: '#942C2C' },
  detailSizeLabel: { color: COLORS.ink, fontSize: 14, fontWeight: '700', marginTop: 18 },
  sizeRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 10, gap: 8 },
  sizeChip: {
    minWidth: 52,
    minHeight: 42,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorChip: {
    minHeight: 42,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.line,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  colorSwatchDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.18)',
  },
  sizeChipActive: { backgroundColor: COLORS.forest, borderColor: COLORS.forest },
  sizeChipText: { color: COLORS.ink, fontWeight: '700', fontSize: 12 },
  sizeChipTextActive: { color: COLORS.white },
  guidanceCard: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.line,
    padding: 14,
    marginTop: 16,
  },
  guidanceTitle: { color: COLORS.ink, fontSize: 13, fontWeight: '800', marginBottom: 4 },
  detailNote: { color: COLORS.muted, fontSize: 12, lineHeight: 18, marginTop: 6 },
  detailFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.line,
    gap: 14,
  },
  detailFooterLabel: { color: COLORS.muted, fontSize: 11, fontWeight: '600' },
  detailFooterPrice: { color: COLORS.forest, fontSize: 19, fontWeight: '900' },
  detailAddButton: {
    flex: 1,
    minHeight: 48,
    backgroundColor: COLORS.terracotta,
    paddingVertical: 13,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailAddButtonText: { color: COLORS.white, fontSize: 15, fontWeight: '800' },
  cartTabContainer: { flex: 1 },
  cartModalSafe: { flex: 1, backgroundColor: COLORS.ivory, paddingTop: TOP_INSET },
  cartHeader: {
    height: 58,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.line,
  },
  cartHeaderTitle: { color: COLORS.ink, fontSize: 18, fontWeight: '800' },
  cartContent: { paddingHorizontal: 18, paddingTop: 14, paddingBottom: 24 },
  emptyCartBox: { alignItems: 'center', justifyContent: 'center', padding: 24 },
  historyBlock: { marginTop: 22 },
  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.line,
    padding: 10,
    marginBottom: 11,
  },
  cartThumb: {
    width: 78,
    height: 86,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  cartThumbImage: { width: '100%', height: '100%' },
  cartItemInfo: { flex: 1, marginLeft: 12 },
  cartItemName: { color: COLORS.ink, fontSize: 14, fontWeight: '800' },
  cartItemMeta: { color: COLORS.muted, fontSize: 11, marginTop: 3 },
  customNoteTag: { color: COLORS.terracotta, fontSize: 11, fontWeight: '600', marginTop: 3 },
  cartItemPrice: { color: COLORS.forest, fontSize: 13, fontWeight: '800', marginTop: 4 },
  cartControls: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  quantityButton: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: COLORS.ivory,
    borderWidth: 1,
    borderColor: COLORS.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityButtonText: { color: COLORS.ink, fontSize: 18, fontWeight: '700' },
  quantityText: { minWidth: 28, color: COLORS.ink, fontSize: 13, fontWeight: '800', textAlign: 'center' },
  removeButton: { marginLeft: 'auto', paddingHorizontal: 10, paddingVertical: 8 },
  removeText: { color: '#942C2C', fontSize: 12, fontWeight: '700' },
  cartFooter: {
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 16,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.line,
  },
  cartSubtotalRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cartSubtotalLabel: { color: COLORS.ink, fontSize: 15, fontWeight: '700' },
  cartSubtotalValue: { color: COLORS.forest, fontSize: 18, fontWeight: '900' },
  checkoutNote: { color: COLORS.muted, fontSize: 11, lineHeight: 16, marginTop: 8 },
  loadingText: { color: COLORS.ink, textAlign: 'center', marginTop: 40, fontSize: 16, fontWeight: '700' },
  loadingBox: { alignItems: 'center', justifyContent: 'center', paddingVertical: 20, gap: 8 },
  visualSearchPreview: { width: '100%', height: 210, borderRadius: 14, marginTop: 14 },
  matchRowCard: {
    marginTop: 10,
    padding: 10,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: COLORS.line,
    backgroundColor: COLORS.ivory,
  },
  formContent: { padding: 18, paddingBottom: 36 },
  formInput: {
    minHeight: 44,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.line,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: COLORS.ink,
    fontSize: 14,
    marginTop: 10,
  },
  formLabel: { color: COLORS.ink, fontSize: 13, fontWeight: '700', marginTop: 16 },
  deliveryBox: {
    marginTop: 12,
    padding: 12,
    borderRadius: 14,
    backgroundColor: COLORS.sand,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  openMapBtn: {
    marginTop: 8,
    backgroundColor: COLORS.forest,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  openMapBtnText: { color: COLORS.white, fontSize: 12, fontWeight: '700' },
  deliveryNote: { color: COLORS.muted, fontSize: 11, marginTop: 8 },
  summaryCard: {
    marginTop: 18,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.line,
    padding: 14,
  },
  summaryTitle: { color: COLORS.ink, fontSize: 13, fontWeight: '800', marginBottom: 8 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  summaryItemText: { color: COLORS.muted, fontSize: 12, flex: 1, marginRight: 8 },
  summaryItemPrice: { color: COLORS.ink, fontSize: 12, fontWeight: '700' },
  summaryTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.line,
  },
  localWarning: {
    color: '#6B4214',
    backgroundColor: '#FDF6EB',
    borderWidth: 1,
    borderColor: '#E4C9A8',
    padding: 12,
    borderRadius: 12,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 12,
  },
  primaryButton: {
    minHeight: 48,
    backgroundColor: COLORS.terracotta,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  primaryButtonText: { color: COLORS.white, fontSize: 14, fontWeight: '800' },
  orderRequestButton: {
    minHeight: 48,
    backgroundColor: COLORS.forest,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  orderRequestButtonText: { color: COLORS.white, fontSize: 14, fontWeight: '800' },
  staffSafe: { flex: 1, backgroundColor: COLORS.ivory, paddingTop: TOP_INSET },
  staffTopHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.forest,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  staffBackButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.forestSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  staffBackButtonPlaceholder: { width: 40, height: 40 },
  staffBackText: { color: COLORS.white, fontSize: 28, marginTop: -3 },
  staffHeaderTitle: { color: COLORS.white, fontSize: 16, fontWeight: '800' },
  staffHeaderSub: { color: COLORS.gold, fontSize: 9, fontWeight: '700', letterSpacing: 1 },
  staffTabsBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    padding: 6,
    gap: 5,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.line,
  },
  staffTabBtn: {
    flex: 1,
    minHeight: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.ivory,
  },
  staffTabBtnActive: { backgroundColor: COLORS.forest },
  staffTabBtnText: { color: COLORS.ink, fontSize: 11, fontWeight: '700' },
  staffTabBtnTextActive: { color: COLORS.white },
  staffContent: { padding: 16, paddingBottom: 40 },
  staffSectionTitle: {
    color: COLORS.ink,
    fontSize: 17,
    fontWeight: '900',
    marginTop: 18,
    marginBottom: 10,
  },
  staffCard: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 13,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  staffCardTitle: { color: COLORS.ink, fontSize: 14, fontWeight: '800' },
  staffMeta: { color: COLORS.muted, fontSize: 12, lineHeight: 17, marginTop: 4 },
  candidateTag: { color: COLORS.terracotta, fontSize: 10, fontWeight: '900', letterSpacing: 0.4, marginBottom: 4 },
  candidateStatus: { color: COLORS.forest, fontSize: 11, fontWeight: '800', marginTop: 5 },
  compareLink: { paddingVertical: 6 },
  compareLinkText: { color: COLORS.terracotta, fontSize: 12, fontWeight: '800' },
  staffActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  staffProductHeading: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  primarySmallButton: {
    minHeight: 38,
    backgroundColor: COLORS.forest,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primarySmallButtonText: { color: COLORS.white, fontSize: 11, fontWeight: '800' },
  secondarySmallButton: {
    minHeight: 38,
    backgroundColor: '#FDF2F2',
    borderWidth: 1,
    borderColor: '#E6C7C7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondarySmallButtonText: { color: '#942C2C', fontSize: 11, fontWeight: '800' },
  stockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.line,
    gap: 8,
  },
  stockTextWrap: { flex: 1 },
  stockNumber: { color: COLORS.ink, fontSize: 12, fontWeight: '800', marginTop: 2 },
  stockAdjustButton: {
    minWidth: 44,
    minHeight: 38,
    borderRadius: 9,
    backgroundColor: '#E7F3EC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stockAdjustText: { color: '#1A5937', fontSize: 12, fontWeight: '800' },
  saleAdjustButton: {
    minWidth: 44,
    minHeight: 38,
    borderRadius: 9,
    backgroundColor: '#FAECEC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saleAdjustText: { color: '#942C2C', fontSize: 12, fontWeight: '800' },
  batchAiButton: {
    marginTop: 8,
    minHeight: 38,
    borderRadius: 10,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.forest,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  batchAiButtonText: { color: COLORS.forest, fontSize: 11, fontWeight: '800' },
  uploadThumbWrap: { position: 'relative', marginRight: 8, alignItems: 'center', width: 72 },
  uploadRemoveBadge: {
    position: 'absolute',
    top: 3,
    right: 6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.72)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadRemoveText: { color: COLORS.white, fontSize: 13, fontWeight: '800', marginTop: -1 },
  uploadColorTag: {
    marginTop: 4,
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.forest,
    maxWidth: 68,
    textAlign: 'center',
  },
  serverStatusText: {
    marginTop: 8,
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '700',
    color: COLORS.forest,
  },
  cardBrandText: {
    color: COLORS.terracotta,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
    marginTop: 7,
    marginBottom: -4,
  },
  aiBannerBox: {
    marginTop: 10,
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#EFF7F3',
    borderWidth: 1,
    borderColor: '#C7DDD2',
  },
  aiBannerText: {
    color: COLORS.forest,
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '700',
  },
  manualSectionBox: {
    marginTop: 14,
    padding: 12,
    borderRadius: 12,
    backgroundColor: COLORS.sand,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  manualSectionLabel: {
    color: COLORS.ink,
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 2,
  },
  brandNameAccent: { color: COLORS.forest, fontWeight: '700' },
  cameraInlineBtn: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: COLORS.forest,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  cameraInlineText: { fontSize: 15 },
  suggestionsDropdown: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.line,
    marginBottom: 14,
    overflow: 'hidden',
    elevation: 4,
  },
  suggestionSection: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1EDE6',
  },
  suggestionProdSection: { padding: 10 },
  suggestionSectionLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.muted,
    letterSpacing: 0.7,
    marginBottom: 6,
  },
  suggestionChipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  suggestionCatChip: {
    backgroundColor: COLORS.ivory,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  suggestionCatChipText: { fontSize: 12, fontWeight: '700', color: COLORS.forest },
  suggestionBrandChip: {
    backgroundColor: '#FDF6EB',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E4C9A8',
  },
  suggestionBrandChipText: { fontSize: 12, fontWeight: '700', color: COLORS.terracotta },
  suggestionProdRow: { paddingVertical: 6 },
  suggestionProdText: { fontSize: 12, fontWeight: '600', color: COLORS.ink },
  circularCatRow: { marginTop: 8, marginBottom: 10 },
  circularCatItem: { alignItems: 'center', marginRight: 14, width: 68 },
  circularCatBubble: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.line,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 5,
  },
  circularCatBubbleActive: {
    borderColor: COLORS.terracotta,
    backgroundColor: COLORS.forest,
  },
  circularAllText: { fontSize: 12, fontWeight: '800', color: COLORS.ink },
  circularAllTextActive: { color: COLORS.white },
  circularCatEmoji: { fontSize: 22 },
  circularCatLabel: { fontSize: 11, fontWeight: '600', color: COLORS.muted, textAlign: 'center' },
  circularCatLabelActive: { color: COLORS.terracotta, fontWeight: '800' },
  stockCountPill: {
    backgroundColor: '#EFE9DE',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  stockCountPillText: { fontSize: 10, fontWeight: '800', color: COLORS.forest },
  deleteIconBtn: {
    backgroundColor: '#FDF4F4',
    borderWidth: 1,
    borderColor: '#E6C7C7',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  deleteIconText: { fontSize: 12, color: '#942C2C', fontWeight: '700' },
  deleteVariantBtn: {
    backgroundColor: '#FDF4F4',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 5,
    marginLeft: 4,
  },
  foldToggleBadge: {
    backgroundColor: COLORS.ivory,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  foldToggleText: { fontSize: 11, fontWeight: '700', color: COLORS.muted },
  addSizeBtn: {
    backgroundColor: '#EAE4D9',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  addSizeBtnText: { fontSize: 11, fontWeight: '700', color: COLORS.forest },
  inlineFormCard: {
    marginTop: 6,
    marginBottom: 8,
    padding: 10,
    borderRadius: 10,
    backgroundColor: COLORS.ivory,
    borderWidth: 1,
    borderColor: '#D5DDD8',
  },
  inlineFormTitle: { fontSize: 12, fontWeight: '800', color: COLORS.ink },
  inlineInput: {
    borderWidth: 1,
    borderColor: '#D9D3C7',
    borderRadius: 8,
    backgroundColor: COLORS.white,
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontSize: 12,
    color: COLORS.ink,
  },
  addColorBox: {
    marginTop: 8,
    padding: 8,
    borderRadius: 8,
    backgroundColor: COLORS.ivory,
    borderWidth: 1,
    borderColor: '#E4DDD3',
  },
  addColorTitle: { fontSize: 11, fontWeight: '700', color: COLORS.forest },
  promoBanner: {
    backgroundColor: COLORS.forest,
    paddingHorizontal: 14,
    paddingVertical: 7,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  promoBannerText: {
    color: COLORS.gold,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  promoCloseBtn: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  promoCloseText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
  },
  cardCompareBtn: {
    position: 'absolute',
    bottom: 7,
    right: 7,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(250, 247, 242, 0.94)',
    borderWidth: 1,
    borderColor: COLORS.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardCompareBtnActive: {
    backgroundColor: COLORS.forest,
    borderColor: COLORS.forest,
  },
  cardCompareText: {
    fontSize: 13,
    color: COLORS.ink,
  },
  cardCompareTextActive: {
    color: COLORS.white,
  },
  strikePrice: {
    color: COLORS.muted,
    fontSize: 11,
    textDecorationLine: 'line-through',
  },
  freeDeliveryBar: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.line,
    padding: 12,
    marginTop: 6,
  },
  freeDeliveryText: {
    color: COLORS.ink,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
  },
  progressTrack: {
    height: 7,
    borderRadius: 4,
    backgroundColor: COLORS.sand,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: COLORS.forest,
  },
  compareTray: {
    position: 'absolute',
    left: 14,
    right: 14,
    bottom: 78,
    backgroundColor: COLORS.forest,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 11,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    elevation: 6,
  },
  compareTrayTitle: {
    color: COLORS.gold,
    fontSize: 12,
    fontWeight: '800',
  },
  compareTraySub: {
    color: COLORS.white,
    fontSize: 11,
    marginTop: 2,
  },
  compareNowBtn: {
    backgroundColor: COLORS.terracotta,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  compareNowText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '800',
  },
  compareClearBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  compareClearText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '700',
  },
  quickModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(20, 26, 22, 0.55)',
    justifyContent: 'center',
    padding: 18,
  },
  quickModalCard: {
    backgroundColor: COLORS.ivory,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.line,
    padding: 18,
  },
  compareColsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  compareColCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.line,
    padding: 10,
    gap: 6,
  },
  compareColImg: {
    width: '100%',
    height: 140,
    borderRadius: 10,
  },
  compareSpecRow: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.line,
    padding: 12,
    marginBottom: 8,
  },
  compareSpecLabel: {
    color: COLORS.muted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  compareSpecVal: {
    color: COLORS.ink,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 17,
  },
  pdpQtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
  },
  pdpTabsBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.sand,
    borderRadius: 12,
    padding: 4,
    gap: 4,
    marginTop: 18,
  },
  pdpTabBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pdpTabBtnActive: {
    backgroundColor: COLORS.forest,
  },
  pdpTabText: {
    color: COLORS.ink,
    fontSize: 11,
    fontWeight: '700',
  },
  pdpTabTextActive: {
    color: COLORS.white,
  },
  reviewItemBox: {
    paddingVertical: 9,
    borderTopWidth: 1,
    borderTopColor: COLORS.line,
    marginTop: 6,
  },
  trackerStepsWrap: {
    marginTop: 14,
    gap: 10,
  },
  trackerStepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  trackerDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.line,
  },
  trackerDotActive: {
    backgroundColor: COLORS.forest,
  },
  trackerStepText: {
    color: COLORS.muted,
    fontSize: 13,
    fontWeight: '600',
  },
  trackerStepTextActive: {
    color: COLORS.forest,
    fontWeight: '800',
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 14,
  },
  kpiCard: {
    width: '48.2%',
    backgroundColor: COLORS.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.line,
    padding: 14,
    alignItems: 'flex-start',
  },
  kpiLabel: {
    color: COLORS.muted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  kpiVal: {
    color: COLORS.forest,
    fontSize: 18,
    fontWeight: '900',
  },
  langToggleBtn: {
    minHeight: 38,
    minWidth: 42,
    paddingHorizontal: 11,
    borderRadius: 11,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitleSerif: {
    color: COLORS.ink,
    fontSize: 20,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  feedSubtitle: {
    color: COLORS.muted,
    fontSize: 11,
    marginTop: 2,
    marginBottom: 10,
  },
  flashGridCard: {
    width: '48.5%',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.line,
    overflow: 'hidden',
    marginBottom: 12,
  },
  flashPhotoWrap: {
    position: 'relative',
    width: '100%',
    height: 116,
    backgroundColor: COLORS.sand,
  },
  flashGridImage: {
    width: '100%',
    height: '100%',
  },
  shopBarCard: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    backgroundColor: COLORS.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.line,
    padding: 6,
  },
  shopBarPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  shopBarPillActive: {
    backgroundColor: COLORS.forest,
  },
  shopBarPillText: {
    color: '#525A55',
    fontSize: 12,
    fontWeight: '700',
  },
  shopBarPillTextActive: {
    color: COLORS.white,
  },
  cardMetaTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 4,
    marginTop: 8,
  },
  cardMetaSource: {
    flex: 1,
    color: COLORS.muted,
    fontSize: 10,
    fontWeight: '600',
  },
  cardSizeSummary: {
    color: COLORS.muted,
    fontSize: 10,
    fontWeight: '600',
  },
  staffWebHeaderWrap: {
    marginBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.line,
    paddingBottom: 14,
  },
  staffBackLink: {
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  staffBackLinkText: {
    color: COLORS.forest,
    fontSize: 13,
    fontWeight: '700',
  },
  staffWebTitle: {
    color: COLORS.ink,
    fontSize: 26,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    marginTop: 4,
    marginBottom: 12,
  },
  staffWebTabsCard: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    backgroundColor: COLORS.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.line,
    padding: 6,
  },
  staffWebTabBtn: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
  },
  staffWebTabBtnActive: {
    backgroundColor: COLORS.forest,
  },
  staffWebTabText: {
    color: '#5C625E',
    fontSize: 12,
    fontWeight: '700',
  },
  staffWebTabTextActive: {
    color: COLORS.white,
  },
  bannerEditorialCopy: {
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 18,
  },
  bannerButtonsRow: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 10,
    marginTop: 16,
  },
  bannerSecondaryButton: {
    minHeight: 42,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
    backgroundColor: 'rgba(255,255,255,0.10)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerSecondaryText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '700',
  },
  bannerHeroFullImage: {
    width: '100%',
    height: 215,
    backgroundColor: COLORS.forestSoft,
  },
  cardActionsRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 9,
  },
  cardComparePill: {
    flex: 1,
    minHeight: 34,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.line,
    backgroundColor: COLORS.ivory,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  cardComparePillActive: {
    backgroundColor: COLORS.forest,
    borderColor: COLORS.forest,
  },
  cardComparePillText: {
    color: COLORS.ink,
    fontSize: 10,
    fontWeight: '700',
  },
  cardComparePillTextActive: {
    color: COLORS.white,
  },
  cardQuickAddPill: {
    flex: 1.15,
    minHeight: 34,
    borderRadius: 10,
    backgroundColor: COLORS.terracotta,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  cardQuickAddPillText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '800',
  },
  footerCard: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.line,
    padding: 18,
    marginTop: 6,
    marginBottom: 8,
  },
  footerTitle: {
    color: COLORS.forest,
    fontSize: 18,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  footerCopy: {
    color: '#5C625E',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 6,
  },
  footerSub: {
    color: COLORS.muted,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 4,
  },
  footerSectionLabel: {
    color: COLORS.ink,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.7,
    marginTop: 14,
    marginBottom: 8,
  },
  footerChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  footerChip: {
    borderRadius: 9,
    borderWidth: 1,
    borderColor: COLORS.line,
    backgroundColor: COLORS.ivory,
    paddingHorizontal: 11,
    paddingVertical: 7,
  },
  footerChipText: {
    color: COLORS.forest,
    fontSize: 12,
    fontWeight: '700',
  },
  footerStaffBtn: {
    borderRadius: 9,
    backgroundColor: COLORS.forest,
    paddingHorizontal: 13,
    paddingVertical: 8,
  },
  footerStaffBtnText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '700',
  },
  brandWordmarkImage: {
    width: 148,
    height: 38,
  },
  zoomHintBadge: {
    position: 'absolute',
    left: 10,
    top: 10,
    backgroundColor: 'rgba(26, 51, 42, 0.78)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
  },
  zoomHintText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '700',
  },
  promoSlideBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 8,
  },
  promoSlideBadgeText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.7,
  },
  bannerTitleCompact: {
    color: COLORS.white,
    fontSize: 21,
    fontWeight: '700',
    lineHeight: 26,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  bannerTextCompact: {
    color: '#D8E1DC',
    fontSize: 12,
    marginTop: 6,
    lineHeight: 17,
  },
  bannerButtonsRowHorizontal: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },
  bannerSecondaryButtonHorizontal: {
    minHeight: 42,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerHeroCompactImage: {
    width: '100%',
    height: 155,
    backgroundColor: COLORS.forestSoft,
  },
  heroDotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    backgroundColor: 'rgba(20, 40, 33, 0.92)',
  },
  heroDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  heroDotActive: {
    width: 18,
    backgroundColor: COLORS.terracotta,
  },
  branchDirCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.line,
    padding: 14,
    marginBottom: 14,
  },
  branchDirEyebrow: {
    color: COLORS.forest,
    fontSize: 14,
    fontWeight: '800',
  },
  branchDirAddress: {
    color: COLORS.ink,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  branchDirMeta: {
    color: COLORS.muted,
    fontSize: 11,
    marginTop: 3,
  },
  branchActionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
  },
  branchActionBtn: {
    backgroundColor: COLORS.ivory,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 9,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  branchActionText: {
    color: COLORS.forest,
    fontSize: 11,
    fontWeight: '700',
  },
  matchRowCardHorizontal: {
    marginTop: 10,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.line,
    backgroundColor: COLORS.ivory,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  matchThumbImage: {
    width: 68,
    height: 68,
    borderRadius: 10,
    backgroundColor: COLORS.sand,
  },
  detailPriceInline: {
    color: COLORS.forest,
    fontSize: 18,
    fontWeight: '900',
  },
  authPromptBanner: {
    backgroundColor: '#FDF6EB',
    borderWidth: 1,
    borderColor: '#E4C9A8',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  authPromptTitle: {
    color: '#6B4214',
    fontSize: 13,
    fontWeight: '800',
  },
  authPromptSub: {
    color: COLORS.muted,
    fontSize: 11,
    marginTop: 3,
  },
  signedInPill: {
    backgroundColor: '#E7F3EC',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 8,
  },
  signedInText: {
    color: '#1A5937',
    fontSize: 12,
    fontWeight: '800',
  },
  proofPreviewThumb: {
    width: 90,
    height: 90,
    borderRadius: 10,
    marginTop: 8,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  matrixSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    marginBottom: 6,
  },
});
