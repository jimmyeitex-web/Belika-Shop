import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Camera,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  ExternalLink,
  Heart,
  ImagePlus,
  Lock,
  LogOut,
  MapPin,
  MessageCircle,
  Minus,
  Navigation,
  Phone,
  Plus,
  Ruler,
  Search,
  Send,
  Settings,
  Share2,
  ShieldCheck,
  ShoppingBag,
  SlidersHorizontal,
  Sparkles,
  Star,
  Store,
  Tag,
  Trash2,
  Truck,
  User,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import expoAppSource from '../expo/App.tsx?raw';
import handoffGuideSource from '../HANDOFF_SETUP.md?raw';
import {
  ADDIS_SUBCITIES,
  AuthUser,
  BELIKA_SHOP_COORDS,
  BranchDepartment,
  BranchInfo,
  CartItem,
  colorSwatchHex,
  computeDistanceKm,
  COPY,
  CustomerProfile,
  DEFAULT_BRANCHES,
  DEFAULT_CATEGORIES,
  DEFAULT_PRODUCTS,
  DEFAULT_PROMO_CODES,
  DELIVERY_PROVIDERS,
  DeliveryCoordinates,
  DeliveryProvider,
  Department,
  estimateAddisDeliveryFee,
  ETHIOPIA_REGIONAL_CITIES,
  FREE_DELIVERY_THRESHOLD,
  getContextualSizes,
  HERO_PROMO_SLIDES,
  Language,
  OrderStatus,
  PaymentMethod,
  PriceBand,
  Product,
  ProductReview,
  PromoCode,
  resolveImageIndexForColor,
  SIZE_GUIDE_CHARTS,
  SortOption,
  StockMovement,
  STORAGE_KEYS,
  StoreCategory,
  StoreOrder,
  SupportMessage,
  TELEGRAM_PREVIEW_CANDIDATES,
  TelegramCandidate,
} from './data/belikaCatalog';
import { StaffConsole } from './components/StaffConsole';
import { CameraSearchModal } from './components/CameraSearchModal';
import {
  DeliveryAddressMap,
  SelectedDeliveryLocation,
} from './components/DeliveryAddressMap';
import { fileToOptimizedDataUrl } from './utils/imageHelper';
import belikaLogoTransparent from './assets/belika_logo_transparent.png';

type CustomerView = 'shop' | 'wishlist' | 'cart' | 'staff';

const BELIKA_ORIGINAL_LOGO = belikaLogoTransparent;

function safeLoad<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    if (Array.isArray(fallback)) {
      return Array.isArray(parsed) ? (parsed as T) : fallback;
    }
    return parsed && typeof parsed === 'object' ? (parsed as T) : fallback;
  } catch {
    return fallback;
  }
}

function convertCmTextToInches(text: string): string {
  return text.replace(/\d+(\.\d+)?/g, (num) => (Number(num) / 2.54).toFixed(1));
}

export default function App() {
  const [language, setLanguage] = useState<Language>('en');
  const [view, setView] = useState<CustomerView>('shop');
  const [department, setDepartment] = useState<Department>('All');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('All');
  const [query, setQuery] = useState('');
  const [showAnnouncement, setShowAnnouncement] = useState(true);

  // Multi-facet filters
  const [showFilters, setShowFilters] = useState(false);
  const [colorFilter, setColorFilter] = useState<string>('All');
  const [sizeFilter, setSizeFilter] = useState<string>('All');
  const [priceBand, setPriceBand] = useState<PriceBand>('all');
  const [sortBy, setSortBy] = useState<SortOption>('featured');

  // Persisted Store State
  const [products, setProducts] = useState<Product[]>(() =>
    safeLoad<Product[]>(STORAGE_KEYS.products, DEFAULT_PRODUCTS),
  );
  const [categories, setCategories] = useState<StoreCategory[]>(() =>
    safeLoad<StoreCategory[]>(STORAGE_KEYS.categories, DEFAULT_CATEGORIES),
  );
  const [promos, setPromos] = useState<PromoCode[]>(() =>
    safeLoad<PromoCode[]>(STORAGE_KEYS.promos, DEFAULT_PROMO_CODES),
  );
  const [favorites, setFavorites] = useState<string[]>(() =>
    safeLoad<string[]>(STORAGE_KEYS.favorites, []),
  );
  const [recentlyViewedIds, setRecentlyViewedIds] = useState<string[]>(() =>
    safeLoad<string[]>(STORAGE_KEYS.recentlyViewed, []),
  );
  const [cartItems, setCartItems] = useState<CartItem[]>(() =>
    safeLoad<CartItem[]>(STORAGE_KEYS.cart, []),
  );
  const [orders, setOrders] = useState<StoreOrder[]>(() =>
    safeLoad<StoreOrder[]>(STORAGE_KEYS.orders, []),
  );
  const [movements, setMovements] = useState<StockMovement[]>(() =>
    safeLoad<StockMovement[]>(STORAGE_KEYS.movements, []),
  );
  const [telegramCandidates, setTelegramCandidates] = useState<TelegramCandidate[]>(() =>
    safeLoad<TelegramCandidate[]>(STORAGE_KEYS.telegramCandidates, TELEGRAM_PREVIEW_CANDIDATES),
  );
  const [customerProfile, setCustomerProfile] = useState<CustomerProfile>(() =>
    safeLoad<CustomerProfile>(STORAGE_KEYS.profile, { name: '', phone: '' }),
  );
  const [branches, setBranches] = useState<Record<BranchDepartment, BranchInfo>>(() =>
    safeLoad<Record<BranchDepartment, BranchInfo>>(STORAGE_KEYS.branches, DEFAULT_BRANCHES),
  );
  const [supportMessages, setSupportMessages] = useState<SupportMessage[]>(() =>
    safeLoad<SupportMessage[]>(STORAGE_KEYS.supportMessages, []),
  );

  // Role-based Auth State (Bearer token held in memory only)
  const [authToken, setAuthToken] = useState<string>('');
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [authStatus, setAuthStatus] = useState<{ hasOwner: boolean; passcodeRequired: boolean }>({
    hasOwner: false,
    passcodeRequired: false,
  });
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup' | 'claim-owner'>('signin');
  const [authName, setAuthName] = useState('');
  const [authIdentifier, setAuthIdentifier] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authPasscode, setAuthPasscode] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Interactive Storefront & Modals State
  const [showSplash, setShowSplash] = useState(true);
  const [activeHeroIdx, setActiveHeroIdx] = useState(0);
  const [heroPaused, setHeroPaused] = useState(false);
  const [showBagDrawer, setShowBagDrawer] = useState(false);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [quickAddProductId, setQuickAddProductId] = useState<string | null>(null);
  const [cardSelectedColors, setCardSelectedColors] = useState<Record<string, string>>({});

  // Product Detail Modal State
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [zoomOffset, setZoomOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDraggingZoom, setIsDraggingZoom] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number; origX: number; origY: number } | null>(null);
  const [detailQty, setDetailQty] = useState(1);
  const [detailTab, setDetailTab] = useState<'overview' | 'size-guide' | 'reviews'>('overview');
  const [sizeUnit, setSizeUnit] = useState<'cm' | 'in'>('cm');
  const [customFitNote, setCustomFitNote] = useState('');
  const [detailError, setDetailError] = useState<string | null>(null);

  // SHEIN Live Flash Sale Countdown Timer
  const [flashTime, setFlashTime] = useState({ hours: 2, minutes: 48, seconds: 15 });
  useEffect(() => {
    const timer = setInterval(() => {
      setFlashTime((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 };
        if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return { hours: 3, minutes: 59, seconds: 59 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Review form inside product detail
  const [reviewAuthor, setReviewAuthor] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewFit, setReviewFit] = useState<ProductReview['fit']>('true-to-size');
  const [reviewComment, setReviewComment] = useState('');
  const [reviewFilterFit, setReviewFilterFit] = useState<'all' | ProductReview['fit']>('all');

  // Checkout, Promos, Payments, Delivery Providers & Support State
  const [customerName, setCustomerName] = useState(() => customerProfile.name || '');
  const [customerPhone, setCustomerPhone] = useState(() => customerProfile.phone || '');
  const [customerEmail, setCustomerEmail] = useState(() => customerProfile.email || '');
  const [saveProfileInfo, setSaveProfileInfo] = useState(true);
  const [fulfillment, setFulfillment] = useState<'pickup' | 'delivery'>('delivery');
  const [deliveryProvider, setDeliveryProvider] = useState<DeliveryProvider>('mela');
  const [deliveryCity, setDeliveryCity] = useState<string>(
    () => customerProfile.preferredCity || 'Addis Ababa',
  );
  const [customCityInput, setCustomCityInput] = useState('');
  const [deliverySubcity, setDeliverySubcity] = useState<string>(
    () => customerProfile.preferredSubcity || 'Bole',
  );
  const [gpsLoading, setGpsLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cod');
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentProofImage, setPaymentProofImage] = useState<string | null>(null);
  const [promoInput, setPromoInput] = useState('');
  const [appliedPromoCode, setAppliedPromoCode] = useState<string | null>(null);
  const [deliveryAddress, setDeliveryAddress] = useState(
    () => customerProfile.preferredAddress || '',
  );
  const [deliveryLandmark, setDeliveryLandmark] = useState(
    () => customerProfile.preferredLandmark || '',
  );
  const [deliveryCoords, setDeliveryCoords] = useState<DeliveryCoordinates | undefined>(
    () => customerProfile.preferredCoords,
  );
  const [deliveryZone, setDeliveryZone] = useState<string | undefined>(
    () => customerProfile.preferredZone,
  );
  const [deliveryDistanceKm, setDeliveryDistanceKm] = useState<number | undefined>(
    () => customerProfile.preferredDistanceKm,
  );
  const [estimatedDeliveryFee, setEstimatedDeliveryFee] = useState<number>(
    () => customerProfile.preferredFee || 0,
  );

  // Customer Support Modal
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [supportOrderId, setSupportOrderId] = useState<string | undefined>(undefined);
  const [supportDepartment, setSupportDepartment] = useState<Department>('Women');
  const [supportTopic, setSupportTopic] = useState('Order / Payment Verification');
  const [supportBody, setSupportBody] = useState('');
  const [supportContact, setSupportContact] = useState(() => customerProfile.phone || '');
  const [supportSending, setSupportSending] = useState(false);

  const [trackingOrder, setTrackingOrder] = useState<StoreOrder | null>(null);
  const [orderNotice, setOrderNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null,
  );
  const [toast, setToast] = useState<string | null>(null);
  const [showExpoModal, setShowExpoModal] = useState(false);
  const [downloadTab, setDownloadTab] = useState<'expo' | 'handoff'>('expo');
  const [downloadingZip, setDownloadingZip] = useState<string | null>(null);
  const [showCameraSearch, setShowCameraSearch] = useState(false);
  const [mapsQuotaExceeded, setMapsQuotaExceeded] = useState(false);

  const downloadZipFromApi = async (endpoint: string, filename: string) => {
    try {
      setDownloadingZip(filename);
      setToast(`Preparing ${filename}...`);
      const res = await fetch(endpoint);
      if (!res.ok) {
        throw new Error(`Download failed (HTTP ${res.status})`);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.setTimeout(() => URL.revokeObjectURL(url), 4000);
      setToast(`Downloaded ${filename} (${(blob.size / (1024 * 1024)).toFixed(1)} MB)`);
    } catch (err) {
      setToast(err instanceof Error ? err.message : `Could not download ${filename}`);
    } finally {
      setDownloadingZip(null);
    }
  };

  const catalogRef = useRef<HTMLDivElement>(null);
  const t = COPY[language];

  useEffect(() => {
    const onQuotaExceeded = () => setMapsQuotaExceeded(true);
    window.addEventListener('gmp-quota-exceeded', onQuotaExceeded);
    return () => window.removeEventListener('gmp-quota-exceeded', onQuotaExceeded);
  }, []);

  useEffect(() => {
    let active = true;
    fetch('/api/store/branches')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (active && data?.branches) {
          setBranches((prev) => ({ ...prev, ...data.branches }));
        }
      })
      .catch(() => {});

    fetch('/api/auth/status')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (active && data) {
          setAuthStatus({
            hasOwner: Boolean(data.hasOwner),
            passcodeRequired: Boolean(data.passcodeRequired),
          });
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!authToken || !currentUser || (currentUser.role !== 'merchant' && currentUser.role !== 'owner')) {
      return;
    }
    fetch('/api/support', { headers: { Authorization: `Bearer ${authToken}` } })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (Array.isArray(data?.messages)) {
          setSupportMessages(data.messages);
        }
      })
      .catch(() => {});
  }, [authToken, currentUser]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEYS.products, JSON.stringify(products));
      window.localStorage.setItem(STORAGE_KEYS.categories, JSON.stringify(categories));
      window.localStorage.setItem(STORAGE_KEYS.promos, JSON.stringify(promos));
      window.localStorage.setItem(STORAGE_KEYS.favorites, JSON.stringify(favorites));
      window.localStorage.setItem(
        STORAGE_KEYS.recentlyViewed,
        JSON.stringify(recentlyViewedIds),
      );
      window.localStorage.setItem(STORAGE_KEYS.cart, JSON.stringify(cartItems));
      window.localStorage.setItem(STORAGE_KEYS.orders, JSON.stringify(orders));
      window.localStorage.setItem(STORAGE_KEYS.movements, JSON.stringify(movements));
      window.localStorage.setItem(
        STORAGE_KEYS.telegramCandidates,
        JSON.stringify(telegramCandidates),
      );
      window.localStorage.setItem(STORAGE_KEYS.profile, JSON.stringify(customerProfile));
      window.localStorage.setItem(STORAGE_KEYS.branches, JSON.stringify(branches));
      window.localStorage.setItem(STORAGE_KEYS.supportMessages, JSON.stringify(supportMessages));
    } catch {
      // Ignore storage quota errors in restricted browsers
    }
  }, [
    products,
    categories,
    promos,
    favorites,
    recentlyViewedIds,
    cartItems,
    orders,
    movements,
    telegramCandidates,
    customerProfile,
    branches,
    supportMessages,
  ]);

  useEffect(() => {
    const timer = window.setTimeout(() => setShowSplash(false), 1500);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (heroPaused || view !== 'shop' || query.trim()) return;
    const interval = window.setInterval(() => {
      setActiveHeroIdx((prev) => (prev + 1) % HERO_PROMO_SLIDES.length);
    }, 4500);
    return () => window.clearInterval(interval);
  }, [heroPaused, view, query]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2800);
    return () => window.clearTimeout(timer);
  }, [toast]);

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

  const activePromo = useMemo(() => {
    if (!appliedPromoCode) return null;
    const found = promos.find(
      (p) => p.active && p.code.toUpperCase() === appliedPromoCode.toUpperCase(),
    );
    if (!found) return null;
    if (found.minSubtotal && cartSubtotal < found.minSubtotal) return null;
    return found;
  }, [appliedPromoCode, promos, cartSubtotal]);

  const promoDiscountAmount = useMemo(() => {
    if (!activePromo || cartSubtotal <= 0) return 0;
    if (activePromo.type === 'percent') {
      return Math.round((cartSubtotal * activePromo.value) / 100);
    }
    return Math.min(cartSubtotal, activePromo.value);
  }, [activePromo, cartSubtotal]);

  const qualifiesFreeDelivery = cartSubtotal >= FREE_DELIVERY_THRESHOLD;
  const effectiveDeliveryFee =
    fulfillment === 'delivery' ? (qualifiesFreeDelivery ? 0 : estimatedDeliveryFee) : 0;

  const orderTotalWithDelivery = Math.max(
    0,
    cartSubtotal - promoDiscountAmount + effectiveDeliveryFee,
  );

  const freeDeliveryRemaining = Math.max(0, FREE_DELIVERY_THRESHOLD - cartSubtotal);
  const freeDeliveryProgressPct = Math.min(
    100,
    Math.round((cartSubtotal / FREE_DELIVERY_THRESHOLD) * 100),
  );

  const publishedProducts = useMemo(
    () => products.filter((product) => product.status !== 'draft'),
    [products],
  );

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

  const flashDropPicks = useMemo(
    () =>
      publishedProducts
        .filter((p) => (p.compareAtPrice && p.compareAtPrice > p.price) || p.badge === 'Flash Drop')
        .slice(0, 4),
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
        (cat) =>
          department === 'All' || cat.department === 'All' || cat.department === department,
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
    () =>
      getContextualSizes(
        publishedProducts,
        department,
        selectedCategory,
        selectedSubcategory,
        query,
      ),
    [publishedProducts, department, selectedCategory, selectedSubcategory, query],
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
        (product.brand ?? '').toLowerCase().includes(search) ||
        product.category.toLowerCase().includes(search) ||
        (product.styleTags ?? []).some((tag) => tag.toLowerCase().includes(search)) ||
        (product.colorSwatches ?? []).some((sw) => sw.name.toLowerCase().includes(search));

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

      const isSaved = view !== 'wishlist' || favorites.includes(product.id);
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
    else if (sortBy === 'bestselling') {
      sorted.sort((a, b) => (b.soldCount ?? 0) - (a.soldCount ?? 0));
    } else if (sortBy === 'newest') {
      sorted.sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''));
    }
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
    view,
    favorites,
  ]);

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
    if (n.includes('skirt') || n.includes('tight') || n.includes('trouser') || n.includes('denim'))
      return '👖';
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

  const toggleCompare = (id: string) => {
    setCompareIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 2) return [prev[0], id];
      return [...prev, id];
    });
  };

  const openProductDetails = (product: Product, preferredColor?: string) => {
    const sizes = sizeOptions(product);
    const defaultSize = sizes.length === 1 ? sizes[0] : sizes[0] ?? null;
    const colors = colorOptions(product, defaultSize);
    const initialColor =
      preferredColor && colors.includes(preferredColor)
        ? preferredColor
        : colors.length === 1
          ? colors[0]
          : colors[0] ?? null;

    setSelectedProduct(product);
    setSelectedSize(defaultSize);
    setSelectedColor(initialColor);
    setSelectedImageIndex(
      initialColor ? resolveImageIndexForColor(product, initialColor) : 0,
    );
    setZoomLevel(1);
    setZoomOffset({ x: 0, y: 0 });
    setDetailQty(1);
    setDetailTab('overview');
    setReviewFilterFit('all');
    setCustomFitNote('');
    setDetailError(null);
    setRecentlyViewedIds((prev) => [product.id, ...prev.filter((id) => id !== product.id)].slice(0, 8));
  };

  const resetAllFilters = () => {
    setDepartment('All');
    setSelectedCategory('All');
    setSelectedSubcategory('All');
    setColorFilter('All');
    setSizeFilter('All');
    setPriceBand('all');
    setSortBy('featured');
    setQuery('');
  };

  const addToCart = (
    product: Product,
    size: string | null,
    color: string | null,
    qty = 1,
    noteOverride = '',
  ) => {
    if (!size || !color) {
      setDetailError(t.chooseVariant);
      return false;
    }
    const variant = findVariant(product, size, color);
    if (!variant) {
      setDetailError(t.chooseVariant);
      return false;
    }
    const trimmedNote = noteOverride.trim();
    const itemId = `${product.id}::${variant.id}::${trimmedNote}`;
    const totalForVariant = cartItems
      .filter((item) => item.productId === product.id && item.variantId === variant.id)
      .reduce((sum, item) => sum + item.quantity, 0);

    if (variant.stock < totalForVariant + qty) {
      setDetailError(t.stockError);
      setToast(t.stockError);
      return false;
    }

    setCartItems((current) => {
      const currentExisting = current.find((item) => item.id === itemId);
      if (currentExisting) {
        return current.map((item) =>
          item.id === itemId ? { ...item, quantity: item.quantity + qty } : item,
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
          quantity: qty,
          customNote: trimmedNote || undefined,
        },
      ];
    });
    setToast(
      language === 'en'
        ? `Added ${qty}× ${product.name} (${size} · ${color}) to bag`
        : `${product.nameAm} (${size} · ${color}) ወደ ጋሪ ተጨምሯል`,
    );
    return true;
  };

  const handleQuickAddSize = (product: Product, size: string) => {
    const availableColors = colorOptions(product, size);
    const chosenCardColor = cardSelectedColors[product.id];
    const colorToUse =
      chosenCardColor && availableColors.includes(chosenCardColor)
        ? chosenCardColor
        : availableColors[0] ?? null;
    if (addToCart(product, size, colorToUse, 1)) {
      setQuickAddProductId(null);
      setShowBagDrawer(true);
    }
  };

  const changeCartQuantity = (itemId: string, difference: number) => {
    const item = cartItems.find((candidate) => candidate.id === itemId);
    if (!item) return;
    const product = products.find((candidate) => candidate.id === item.productId);
    const variant = product?.variants?.find((candidate) => candidate.id === item.variantId);
    if (difference > 0 && variant && item.quantity >= variant.stock) {
      setOrderNotice({ type: 'error', text: t.stockError });
      setToast(t.stockError);
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

  const removeCartItem = (itemId: string) => {
    setCartItems((current) => current.filter((item) => item.id !== itemId));
  };

  const handleApplyPromoCode = (rawCode?: string) => {
    const code = (rawCode ?? promoInput).trim().toUpperCase();
    if (!code) return;
    const found = promos.find((p) => p.active && p.code.toUpperCase() === code);
    if (!found) {
      setToast(
        language === 'en'
          ? `Code "${code}" is invalid or paused.`
          : `ኮድ "${code}" ትክክል አይደለም።`,
      );
      return;
    }
    if (found.minSubtotal && cartSubtotal < found.minSubtotal) {
      setToast(
        language === 'en'
          ? `Add ETB ${(found.minSubtotal - cartSubtotal).toLocaleString('en-US')} more to use ${found.code}.`
          : `ኮድ ${found.code} ለመጠቀም ቢያንስ ETB ${found.minSubtotal} መግዛት አለብዎት።`,
      );
      return;
    }
    setAppliedPromoCode(found.code);
    setPromoInput(found.code);
    setToast(
      language === 'en'
        ? `Promo ${found.code} applied!`
        : `የቅናሽ ኮድ ${found.code} ተተግብሯል!`,
    );
  };

  const handleShareProduct = async (product: Product) => {
    const text = `${product.name} · ETB ${product.price.toLocaleString('en-US')} at Belika Online Store (Addis Ababa)`;
    try {
      if (navigator.share) {
        await navigator.share({ title: product.name, text, url: window.location.href });
      } else {
        await navigator.clipboard.writeText(`${text} — ${window.location.href}`);
        setToast(language === 'en' ? 'Product link copied to clipboard' : 'ሊንኩ ተቀድቷል');
      }
    } catch {
      // Ignore user cancel
    }
  };

  const handleAddReview = (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedProduct || !reviewComment.trim()) return;
    const nextReview: ProductReview = {
      id: `rev-${Date.now()}`,
      author: reviewAuthor.trim() || (language === 'en' ? 'Shopper' : 'ደንበኛ'),
      rating: reviewRating,
      fit: reviewFit,
      comment: reviewComment.trim(),
      createdAt: new Date().toISOString().slice(0, 10),
    };
    setProducts((current) =>
      current.map((p) => {
        if (p.id !== selectedProduct.id) return p;
        const reviews = [nextReview, ...(p.reviews ?? [])];
        const count = (p.reviewCount ?? 0) + 1;
        const prevTotal = (p.rating ?? 4.8) * (p.reviewCount ?? 0);
        const nextAvg = Number(((prevTotal + reviewRating) / count).toFixed(1));
        const updated = { ...p, reviews, reviewCount: count, rating: nextAvg };
        setSelectedProduct(updated);
        return updated;
      }),
    );
    setReviewAuthor('');
    setReviewComment('');
    setToast(language === 'en' ? 'Review saved locally' : 'ግምገማዎ ተቀምጧል');
  };

  const handleAdjustStock = (
    productId: string,
    variantId: string,
    difference: number,
    kind: StockMovement['kind'],
  ) => {
    const product = products.find((item) => item.id === productId);
    const variant = product?.variants?.find((item) => item.id === variantId);
    if (!variant) return { ok: false, message: 'Variant not found.' };
    if (difference < 0 && variant.stock < Math.abs(difference)) {
      return { ok: false, message: t.outOfStock };
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
    return { ok: true };
  };

  const isStaffUser =
    currentUser?.role === 'merchant' || currentUser?.role === 'owner';

  const applyAuthenticatedUser = (user: AuthUser, token: string) => {
    setCurrentUser(user);
    setAuthToken(token);
    if (user.name && !customerName) setCustomerName(user.name);
    if (user.phone && !customerPhone) setCustomerPhone(user.phone);
    if (user.email && !customerEmail) setCustomerEmail(user.email);
    setShowAuthModal(false);
    setAuthPassword('');
    setAuthPasscode('');
    setAuthError(null);
    if (user.role === 'merchant' || user.role === 'owner') {
      setView('staff');
      setToast(
        language === 'en'
          ? `Signed in as ${user.name} (${user.role === 'owner' ? 'Owner Admin' : 'Merchant'})`
          : `${user.name} በነጋዴ መለያ ገብተዋል`,
      );
    } else {
      setToast(
        language === 'en' ? `Welcome, ${user.name}!` : `እንኳን ደህና መጡ ${user.name}!`,
      );
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    if (!authIdentifier.trim() || !authPassword) {
      setAuthError(
        language === 'en'
          ? 'Enter your phone or email and password.'
          : 'ስልክ ወይም ኢሜይል እና የይለፍ ቃል ያስገቡ።',
      );
      return;
    }
    setAuthLoading(true);
    try {
      const endpoint =
        authMode === 'claim-owner'
          ? '/api/auth/claim-owner'
          : authMode === 'signup'
            ? '/api/auth/register'
            : '/api/auth/login';
      const payload =
        authMode === 'claim-owner'
          ? {
              name: authName.trim() || 'Belika Owner',
              identifier: authIdentifier.trim(),
              password: authPassword,
              adminPasscode: authPasscode.trim() || undefined,
            }
          : authMode === 'signup'
            ? {
                name: authName.trim(),
                identifier: authIdentifier.trim(),
                password: authPassword,
              }
            : {
                identifier: authIdentifier.trim(),
                password: authPassword,
              };
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || 'Authentication failed.');
      }
      if (authMode === 'claim-owner') {
        setAuthStatus((prev) => ({ ...prev, hasOwner: true }));
      }
      applyAuthenticatedUser(data.user, data.token);
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Authentication failed.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    if (authToken) {
      fetch('/api/auth/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${authToken}` },
      }).catch(() => {});
    }
    setAuthToken('');
    setCurrentUser(null);
    if (view === 'staff') setView('shop');
    setToast(language === 'en' ? 'Signed out' : 'ወጥተዋል');
  };

  const handleSaveBranches = async (next: Record<BranchDepartment, BranchInfo>): Promise<{ ok: boolean; error?: string }> => {
    setBranches(next);
    if (!authToken) return { ok: true };
    try {
      const res = await fetch('/api/admin/branches', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ branches: next }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        return { ok: false, error: data?.error || 'Could not sync branch settings.' };
      }
      setToast(language === 'en' ? 'Branch contacts & addresses updated' : 'የቅርንጫፍ አድራሻ ተቀምጧል');
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : 'Network error' };
    }
  };

  const handleSubmitSupport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportBody.trim()) return;
    setSupportSending(true);
    try {
      const payload = {
        orderId: supportOrderId,
        customerName: customerName.trim() || currentUser?.name || 'Customer',
        contact: supportContact.trim() || customerPhone.trim() || currentUser?.identifier || '',
        department: supportDepartment,
        topic: supportTopic,
        message: supportBody.trim(),
      };
      const res = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      const created: SupportMessage = data?.message ?? {
        id: `sup-${Date.now()}`,
        ...payload,
        status: 'open',
        createdAt: new Date().toISOString(),
      };
      setSupportMessages((prev) => [created, ...prev]);
      setSupportBody('');
      setShowSupportModal(false);
      setToast(
        language === 'en'
          ? 'Support message sent! Belika staff will reply shortly.'
          : 'መልእክትዎ ተልኳል! የበሊካ የድጋፍ ቡድን በቅርቡ ይመልሳል።',
      );
    } finally {
      setSupportSending(false);
    }
  };

  const handleReplySupport = async (
    id: string,
    reply: string,
    status: 'open' | 'resolved',
  ): Promise<{ ok: boolean }> => {
    setSupportMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, reply, status } : m)),
    );
    if (!authToken) return { ok: true };
    try {
      await fetch(`/api/support/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ reply, status }),
      });
      return { ok: true };
    } catch {
      return { ok: true };
    }
  };

  const handleShareMyGpsLocation = () => {
    if (!navigator.geolocation) {
      setToast('GPS location is unavailable on this browser.');
      return;
    }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        const dist = computeDistanceKm(BELIKA_SHOP_COORDS, coords);
        const isAddis = deliveryCity === 'Addis Ababa';
        const fee = isAddis ? estimateAddisDeliveryFee(dist) : 280;
        const zoneLabel = isAddis
          ? `${deliverySubcity} (${dist.toFixed(1)} km GPS)`
          : `${deliveryCity === 'Other' ? customCityInput || 'Regional' : deliveryCity} GPS`;
        setDeliveryCoords(coords);
        setDeliveryDistanceKm(dist);
        setEstimatedDeliveryFee(fee);
        setDeliveryZone(zoneLabel);
        let resolvedAddress = `GPS Pin (${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}), ${isAddis ? `${deliverySubcity}, Addis Ababa` : deliveryCity}`;
        try {
          const res = await fetch(
            `/api/maps/reverse-geocode?lat=${coords.lat}&lng=${coords.lng}&language=${language}`,
          );
          if (res.ok) {
            const data = await res.json();
            if (data?.formattedAddress) resolvedAddress = data.formattedAddress;
          }
        } catch {
          // Keep GPS coordinate address fallback
        }
        setDeliveryAddress(resolvedAddress);
        setGpsLoading(false);
        setToast(
          language === 'en'
            ? 'Current GPS location attached for courier!'
            : 'የአሁኑ ቦታዎ (GPS) ተያይዟል!',
        );
      },
      () => {
        setGpsLoading(false);
        setToast(
          language === 'en'
            ? 'Could not read GPS. Pick subcity or tap the map.'
            : 'GPS ማንበብ አልተቻለም። ክፍለ ከተማ ወይም ካርታውን ይምረጡ።',
        );
      },
      { enableHighAccuracy: true, timeout: 9000 },
    );
  };

  const handlePaymentProofSelect = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await fileToOptimizedDataUrl(file, 900, 0.78);
      setPaymentProofImage(dataUrl);
      setToast(
        language === 'en'
          ? 'Payment screenshot attached'
          : 'የክፍያ ማረጋገጫ ፎቶ ተያይዟል',
      );
    } catch {
      setToast('Could not read payment screenshot.');
    }
  };

  const handleDeliveryMapLocation = (loc: SelectedDeliveryLocation) => {
    setDeliveryAddress(loc.address);
    setDeliveryCoords(loc.coords);
    setDeliveryZone(loc.zone);
    setDeliveryDistanceKm(loc.distanceKm);
    setEstimatedDeliveryFee(loc.estimatedFeeEtb);
  };

  const handleRequestOrder = (event: React.FormEvent) => {
    event.preventDefault();
    if (!cartItems.length) return;
    if (!currentUser) {
      setOrderNotice({
        type: 'error',
        text:
          language === 'en'
            ? 'Please sign in or create an account with your phone/email & password to submit your order.'
            : 'ትዕዛዝ ለማስገባት እባክዎ በስልክ ወይም ኢሜይል ይግቡ ወይም መለያ ይፍጠሩ።',
      });
      setAuthMode('signup');
      setShowAuthModal(true);
      return;
    }
    const resolvedCity =
      deliveryCity === 'Other'
        ? customCityInput.trim() || 'Regional Ethiopia'
        : deliveryCity;
    if (!customerName.trim() || !customerPhone.trim()) {
      setOrderNotice({ type: 'error', text: t.contactRequired });
      return;
    }
    if (fulfillment === 'delivery' && !deliveryAddress.trim()) {
      setOrderNotice({ type: 'error', text: t.deliveryAddressRequired });
      return;
    }

    if (saveProfileInfo) {
      setCustomerProfile({
        name: customerName.trim(),
        phone: customerPhone.trim(),
        email: customerEmail.trim() || currentUser.email,
        preferredCity: resolvedCity,
        preferredSubcity: deliveryCity === 'Addis Ababa' ? deliverySubcity : undefined,
        preferredAddress: fulfillment === 'delivery' ? deliveryAddress.trim() : customerProfile.preferredAddress,
        preferredLandmark: fulfillment === 'delivery' ? deliveryLandmark.trim() : customerProfile.preferredLandmark,
        preferredCoords: fulfillment === 'delivery' ? deliveryCoords : customerProfile.preferredCoords,
        preferredZone: fulfillment === 'delivery' ? deliveryZone : customerProfile.preferredZone,
        preferredDistanceKm:
          fulfillment === 'delivery' ? deliveryDistanceKm : customerProfile.preferredDistanceKm,
        preferredFee:
          fulfillment === 'delivery' ? estimatedDeliveryFee : customerProfile.preferredFee,
      });
    }

    const order: StoreOrder = {
      id: `BL-${Date.now().toString().slice(-6)}`,
      userId: currentUser.id,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      customerEmail: customerEmail.trim() || currentUser.email,
      fulfillment,
      deliveryProvider: fulfillment === 'pickup' ? 'pickup' : deliveryProvider,
      deliveryCity: fulfillment === 'delivery' ? resolvedCity : undefined,
      deliverySubcity:
        fulfillment === 'delivery' && deliveryCity === 'Addis Ababa'
          ? deliverySubcity
          : undefined,
      paymentMethod,
      paymentReference: paymentReference.trim() || undefined,
      paymentProofImage:
        paymentMethod !== 'cod' ? paymentProofImage || undefined : undefined,
      promoCode: activePromo?.code,
      discountAmount: promoDiscountAmount > 0 ? promoDiscountAmount : undefined,
      deliveryAddress: fulfillment === 'delivery' ? deliveryAddress.trim() : undefined,
      deliveryLandmark:
        fulfillment === 'delivery' && deliveryLandmark.trim()
          ? deliveryLandmark.trim()
          : undefined,
      deliveryCoords: fulfillment === 'delivery' ? deliveryCoords : undefined,
      deliveryZone: fulfillment === 'delivery' ? deliveryZone : undefined,
      deliveryDistanceKm: fulfillment === 'delivery' ? deliveryDistanceKm : undefined,
      estimatedDeliveryFee: effectiveDeliveryFee > 0 ? effectiveDeliveryFee : undefined,
      items: cartItems.map((item) => ({ ...item })),
      subtotal: cartSubtotal,
      total: orderTotalWithDelivery,
      status: 'requested',
      createdAt: new Date().toISOString(),
    };
    setOrders((current) => [order, ...current]);
    setCartItems([]);
    setAppliedPromoCode(null);
    setPromoInput('');
    setPaymentReference('');
    setPaymentProofImage(null);
    setTrackingOrder(order);
    setOrderNotice({
      type: 'success',
      text: `${order.id} — ${t.orderSaved}`,
    });
  };

  const handleUpdateOrderStatus = (orderId: string, nextStatus: OrderStatus) => {
    const order = orders.find((item) => item.id === orderId);
    if (!order) return { ok: false };
    if (nextStatus === 'confirmed' && order.status === 'requested') {
      const enoughStock = order.items.every((line) => {
        const product = products.find((item) => item.id === line.productId);
        const variant = product?.variants?.find((item) => item.id === line.variantId);
        return Boolean(variant && variant.stock >= line.quantity);
      });
      if (!enoughStock) {
        return { ok: false, message: t.stockError };
      }
      setProducts((current) =>
        current.map((product) => ({
          ...product,
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
    } else if (nextStatus === 'cancelled' && order.status === 'confirmed') {
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
      current.map((item) =>
        item.id === orderId
          ? { ...item, status: nextStatus, statusUpdatedAt: new Date().toISOString() }
          : item,
      ),
    );
    return { ok: true };
  };

  const selectedVariant =
    selectedProduct && selectedSize && selectedColor
      ? findVariant(selectedProduct, selectedSize, selectedColor)
      : undefined;

  const similarProducts = useMemo(() => {
    if (!selectedProduct) return [];
    return publishedProducts
      .filter(
        (p) =>
          p.id !== selectedProduct.id &&
          (p.category === selectedProduct.category || p.department === selectedProduct.department),
      )
      .slice(0, 4);
  }, [selectedProduct, publishedProducts]);

  // Fit Distribution calculation for Product Detail Page
  const fitStats = useMemo(() => {
    if (!selectedProduct) return { smallPct: 10, truePct: 80, largePct: 10 };
    const revs = selectedProduct.reviews ?? [];
    if (revs.length === 0) return { smallPct: 10, truePct: 82, largePct: 8 };
    const small = revs.filter((r) => r.fit === 'runs-small').length;
    const trueFit = revs.filter((r) => r.fit === 'true-to-size').length;
    const large = revs.filter((r) => r.fit === 'runs-large').length;
    return {
      smallPct: Math.round((small / revs.length) * 100),
      truePct: Math.round((trueFit / revs.length) * 100),
      largePct: Math.round((large / revs.length) * 100),
    };
  }, [selectedProduct]);

  const filteredProductReviews = useMemo(() => {
    if (!selectedProduct) return [];
    const list = selectedProduct.reviews ?? [];
    if (reviewFilterFit === 'all') return list;
    return list.filter((r) => r.fit === reviewFilterFit);
  }, [selectedProduct, reviewFilterFit]);

  const departments: Department[] = ['All', 'Men', 'Women', 'Kids'];

  const orderStatusLabel = (status: OrderStatus) => {
    if (status === 'requested') return t.requested;
    if (status === 'confirmed') return t.confirmed;
    if (status === 'out-for-delivery') return t.outForDelivery;
    if (status === 'completed') return t.completed;
    return t.cancelled;
  };

  const renderOrderStepper = (status: OrderStatus) => {
    if (status === 'cancelled') {
      return (
        <div className="mt-2 rounded-lg bg-[#FDF2F2] px-3 py-1.5 text-xs font-semibold text-[#942C2C]">
          {t.cancelled}
        </div>
      );
    }
    const steps: Array<{ id: OrderStatus; label: string }> = [
      { id: 'requested', label: t.requested },
      { id: 'confirmed', label: t.confirmed },
      { id: 'out-for-delivery', label: t.outForDelivery },
      { id: 'completed', label: t.completed },
    ];
    const currentIndex = Math.max(
      0,
      steps.findIndex((s) => s.id === status),
    );
    return (
      <div className="mt-3 grid grid-cols-4 gap-1.5">
        {steps.map((step, idx) => {
          const done = idx <= currentIndex;
          return (
            <div key={step.id} className="space-y-1">
              <div
                className={`h-1.5 w-full rounded-full ${
                  done ? 'bg-[#1A332A]' : 'bg-[#E8E2D9]'
                }`}
              />
              <p
                className={`truncate text-[10px] font-semibold ${
                  done ? 'text-[#1A332A]' : 'text-[#8C938F]'
                }`}
              >
                {step.label}
              </p>
            </div>
          );
        })}
      </div>
    );
  };

  const activeBranchInfo =
    department === 'All' ? branches.Women : branches[department];
  const currentHeroSlide = HERO_PROMO_SLIDES[activeHeroIdx % HERO_PROMO_SLIDES.length];

  return (
    <div className="min-h-screen bg-[#FAF7F2] pb-20 text-[#1F2421] md:pb-0">
      {/* Belika Online Store Launch Splash - Pure Logo Presentation */}
      {showSplash && (
        <div
          onClick={() => setShowSplash(false)}
          className="fixed inset-0 z-[70] flex cursor-pointer flex-col items-center justify-center bg-[#FAF7F2] px-6 text-center transition-opacity"
        >
          {/* Subtle warm radial ambient glow */}
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(192,108,62,0.07)_0%,transparent_65%)]" />

          <div className="relative flex flex-col items-center justify-center">
            {/* Elegant soft backdrop circle */}
            <div className="absolute -inset-10 rounded-full bg-gradient-to-tr from-[#C06C3E]/10 via-[#1A332A]/5 to-transparent blur-2xl" />

            {/* Pristine authentic logo with no surrounding text */}
            <img
              src={BELIKA_ORIGINAL_LOGO}
              alt="Belika"
              className="relative h-20 sm:h-28 w-auto max-w-[85vw] object-contain drop-shadow-sm transition-transform duration-500 hover:scale-105"
            />

            {/* Minimalist boutique progress indicator */}
            <div className="mt-8 h-1 w-20 overflow-hidden rounded-full bg-[#E8E2D9]">
              <div className="h-full w-full bg-gradient-to-r from-[#C06C3E] via-[#1A332A] to-[#C06C3E] animate-pulse" />
            </div>
          </div>
        </div>
      )}

      {/* Slim Dismissible Announcement Bar */}
      {showAnnouncement && (
        <div className="flex h-8 items-center justify-between bg-[#1A332A] px-4 text-[11px] font-medium text-white">
          <div className="mx-auto flex items-center gap-2 truncate">
            <Truck className="h-3.5 w-3.5 shrink-0 text-[#E5B899]" />
            <span className="truncate">{t.announcementText}</span>
            <button
              type="button"
              onClick={() => {
                setPromoInput('BELIKA10');
                setShowBagDrawer(true);
              }}
              className="hidden shrink-0 rounded bg-[#C06C3E] px-2 py-0.5 text-[10px] font-bold text-white sm:inline-block"
            >
              BELIKA10
            </button>
          </div>
          <button
            type="button"
            onClick={() => setShowAnnouncement(false)}
            aria-label="Dismiss announcement"
            className="ml-2 shrink-0 text-white/75 hover:text-white"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Case A Sticky Google Maps Quota Exceeded Banner */}
      {mapsQuotaExceeded && (
        <div
          role="alert"
          className="sticky top-0 z-50 border-b border-amber-300 bg-amber-50 px-4 py-2.5 text-xs text-amber-950"
        >
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 text-amber-700" />
              <span>
                Google Maps daily quota has been reached for this preview key. You can still type
                your Addis delivery address manually, or{' '}
                <a
                  href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold underline"
                >
                  upgrade quota in Google Cloud
                </a>
                .
              </span>
            </div>
            <button
              type="button"
              onClick={() => setMapsQuotaExceeded(false)}
              className="rounded-lg border border-amber-300 bg-white px-2.5 py-1 text-[11px] font-semibold"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Three-Zone Single-Row Header */}
      <header className="sticky top-0 z-30 border-b border-[#E8E2D9] bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => setView('shop')}
            className="group flex shrink-0 items-center gap-2 whitespace-nowrap text-left"
          >
            <img
              src={BELIKA_ORIGINAL_LOGO}
              alt="Belika"
              className="h-7 sm:h-8 w-auto object-contain transition-transform group-hover:scale-[1.02]"
            />
            <span className="hidden xs:inline-block h-3.5 w-px bg-[#DFD8CD]" />
            <span className="text-[9.5px] sm:text-[10px] font-bold tracking-[0.16em] uppercase text-[#C06C3E] font-sans">
              ONLINE SHOPPING
            </span>
          </button>

          <nav className="hidden items-center gap-6 text-sm font-medium text-[#525A55] md:flex">
            <button
              type="button"
              onClick={() => setView('shop')}
              className={`shrink-0 whitespace-nowrap py-1 transition-colors ${
                view === 'shop'
                  ? 'border-b-2 border-[#1A332A] font-semibold text-[#1A332A]'
                  : 'hover:text-[#1F2421]'
              }`}
            >
              {t.shop}
            </button>
            <button
              type="button"
              onClick={() => setView('wishlist')}
              className={`shrink-0 whitespace-nowrap py-1 transition-colors ${
                view === 'wishlist'
                  ? 'border-b-2 border-[#1A332A] font-semibold text-[#1A332A]'
                  : 'hover:text-[#1F2421]'
              }`}
            >
              {t.wishlist} ({favorites.length})
            </button>
            <button
              type="button"
              onClick={() => {
                setOrderNotice(null);
                setView('cart');
              }}
              className={`shrink-0 whitespace-nowrap py-1 transition-colors ${
                view === 'cart'
                  ? 'border-b-2 border-[#1A332A] font-semibold text-[#1A332A]'
                  : 'hover:text-[#1F2421]'
              }`}
            >
              {t.bag} ({cartCount})
            </button>
            {isStaffUser && (
              <button
                type="button"
                onClick={() => setView('staff')}
                className={`shrink-0 whitespace-nowrap py-1 transition-colors ${
                  view === 'staff'
                    ? 'border-b-2 border-[#C06C3E] font-semibold text-[#C06C3E]'
                    : 'text-[#6D736E] hover:text-[#1F2421]'
                }`}
              >
                {t.staff}
              </button>
            )}
          </nav>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={() => {
                setAuthError(null);
                if (currentUser) {
                  if (isStaffUser && view !== 'staff') setView('staff');
                  else setShowAuthModal(true);
                } else {
                  setAuthMode('signin');
                  setShowAuthModal(true);
                }
              }}
              className={`inline-flex min-h-[38px] shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl border px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                currentUser
                  ? 'border-[#C7DDD2] bg-[#EFF7F3] text-[#1A332A]'
                  : 'border-[#DFD8CD] bg-white text-[#1F2421] hover:border-[#1A332A]'
              }`}
              title="Account Sign In"
            >
              <User className="h-3.5 w-3.5" />
              <span className="max-w-[80px] truncate">
                {currentUser
                  ? currentUser.name.split(' ')[0]
                  : language === 'en'
                    ? 'Sign In'
                    : 'ግባ'}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setLanguage((prev) => (prev === 'en' ? 'am' : 'en'))}
              className="min-h-[38px] shrink-0 whitespace-nowrap rounded-xl border border-[#DFD8CD] bg-white px-2.5 py-1.5 text-xs font-semibold text-[#1F2421] transition-colors hover:border-[#1A332A]"
              aria-label="Switch language"
            >
              {language === 'en' ? 'አማ' : 'EN'}
            </button>
            <button
              type="button"
              onClick={() => setShowBagDrawer(true)}
              className="inline-flex min-h-[38px] shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl bg-[#1A332A] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#234338]"
            >
              <ShoppingBag className="h-4 w-4" />
              <span className="tabular-nums">{cartCount}</span>
            </button>
          </div>
        </div>
      </header>

      {toast && (
        <div className="fixed bottom-20 left-1/2 z-[60] -translate-x-1/2 rounded-xl bg-[#1A332A] px-4 py-2.5 text-xs font-semibold text-white shadow-lg md:bottom-6">
          {toast}
        </div>
      )}

      {view === 'staff' && isStaffUser && currentUser && (
        <StaffConsole
          language={language}
          currentUser={currentUser}
          authToken={authToken}
          onSignOut={() => void handleSignOut()}
          branches={branches}
          onSaveBranches={handleSaveBranches}
          supportMessages={supportMessages}
          onReplySupport={handleReplySupport}
          products={products}
          setProducts={setProducts}
          categories={categories}
          setCategories={setCategories}
          promos={promos}
          setPromos={setPromos}
          orders={orders}
          movements={movements}
          telegramCandidates={telegramCandidates}
          setTelegramCandidates={setTelegramCandidates}
          onUpdateOrderStatus={handleUpdateOrderStatus}
          onAdjustStock={handleAdjustStock}
          onBackToShop={() => setView('shop')}
        />
      )}

      {(view === 'shop' || view === 'wishlist') && (
        <main className="mx-auto max-w-6xl px-4 pt-5 pb-12 sm:px-6 lg:px-8">
          {/* Search Bar + Camera Search Trigger + Filter Toggle */}
          <div className="mb-5 flex items-center gap-2.5">
            <div className="relative flex flex-1 items-center">
              <Search className="pointer-events-none absolute left-3.5 h-4 w-4 text-[#717873]" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t.search}
                className="min-h-[44px] w-full rounded-xl border border-[#E4DDD2] bg-white pr-28 pl-10 text-sm text-[#1F2421] placeholder:text-[#787F7A] focus:border-[#1A332A] focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowCameraSearch(true)}
                className="absolute right-1.5 inline-flex min-h-[34px] items-center gap-1.5 rounded-lg bg-[#1A332A] px-2.5 py-1 text-[11px] font-semibold text-white transition-colors hover:bg-[#234338]"
              >
                <Camera className="h-3.5 w-3.5 text-[#E5B899]" />
                <span className="hidden sm:inline">{t.cameraSearch}</span>
              </button>
              {hasSearchSuggestions && (
                <div className="absolute top-full right-0 left-0 z-40 mt-1.5 overflow-hidden rounded-xl border border-[#E4DDD2] bg-white shadow-xl">
                  {searchSuggestions.categories.length > 0 && (
                    <div className="border-b border-[#F1EDE6] px-3 py-2">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[#787F7A]">
                        {language === 'en' ? 'Categories' : 'ምድቦች'}
                      </p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {searchSuggestions.categories.map((catName) => (
                          <button
                            key={`sugg-cat-${catName}`}
                            type="button"
                            onClick={() => {
                              setSelectedCategory(catName);
                              setQuery('');
                            }}
                            className="rounded-lg bg-[#FAF7F2] px-2.5 py-1 text-xs font-semibold text-[#1A332A] hover:bg-[#1A332A] hover:text-white transition-colors"
                          >
                            {catName}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {searchSuggestions.brands.length > 0 && (
                    <div className="border-b border-[#F1EDE6] px-3 py-2">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[#787F7A]">
                        {language === 'en' ? 'Brands' : 'ብራንዶች'}
                      </p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {searchSuggestions.brands.map((brandName) => (
                          <button
                            key={`sugg-brand-${brandName}`}
                            type="button"
                            onClick={() => {
                              setQuery(brandName);
                            }}
                            className="rounded-lg bg-[#FAF7F2] px-2.5 py-1 text-xs font-semibold text-[#C06C3E] hover:bg-[#C06C3E] hover:text-white transition-colors"
                          >
                            {brandName}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {searchSuggestions.products.length > 0 && (
                    <div className="px-3 py-2">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[#787F7A]">
                        {language === 'en' ? 'Matching Products' : 'የሚዛመዱ ምርቶች'}
                      </p>
                      <div className="mt-1 flex flex-col gap-1">
                        {searchSuggestions.products.map((prodName, pIdx) => (
                          <button
                            key={`sugg-prod-${pIdx}`}
                            type="button"
                            onClick={() => {
                              setQuery(prodName);
                            }}
                            className="text-left text-xs font-medium text-[#1F2421] hover:text-[#C06C3E] py-1 truncate"
                          >
                            {prodName}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowFilters((v) => !v)}
              className={`inline-flex min-h-[44px] shrink-0 items-center gap-1.5 rounded-xl border px-3.5 text-xs font-semibold transition-colors ${
                showFilters || activeFilterCount > 0
                  ? 'border-[#1A332A] bg-[#1A332A] text-white'
                  : 'border-[#E4DDD2] bg-white text-[#1F2421]'
              }`}
            >
              <SlidersHorizontal className="h-4 w-4" />
              <span className="hidden sm:inline">{t.filters}</span>
              {activeFilterCount > 0 && (
                <span className="rounded-full bg-[#C06C3E] px-1.5 py-0.5 text-[10px] font-bold text-white tabular-nums">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {isStaffUser && (
              <button
                type="button"
                onClick={() => setView('staff')}
                className="inline-flex min-h-[44px] shrink-0 items-center gap-1.5 rounded-xl border border-[#E4DDD2] bg-white px-3 text-xs font-semibold text-[#4C524E] md:hidden"
                aria-label={t.staff}
              >
                <Settings className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Compact Shein-Inspired Auto-Switching Promo Hero Carousel */}
          {view === 'shop' && !query.trim() && activeFilterCount === 0 && (
            <section
              onMouseEnter={() => setHeroPaused(true)}
              onMouseLeave={() => setHeroPaused(false)}
              className="relative mb-5 overflow-hidden rounded-2xl sm:rounded-3xl border border-[#E6DFD4] bg-[#1A332A] shadow-xs"
            >
              <div className="grid grid-cols-1 items-stretch sm:grid-cols-12 min-h-[190px] sm:min-h-[220px]">
                <div className="flex flex-col justify-between p-4 sm:p-6 sm:col-span-7 z-10">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-[#C06C3E] px-2.5 py-0.5 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-white shadow-xs">
                        {language === 'en' ? currentHeroSlide.badge : currentHeroSlide.badgeAm}
                      </span>
                      {currentHeroSlide.id === 'promo-sale-all' && (
                        <span className="rounded-full bg-red-600 px-2 py-0.5 text-[9px] font-bold uppercase text-white animate-pulse">
                          HOT SALE
                        </span>
                      )}
                    </div>
                    <h1 className="mt-1.5 font-display text-lg sm:text-2xl lg:text-3xl font-bold leading-tight text-white">
                      {language === 'en' ? currentHeroSlide.title : currentHeroSlide.titleAm}
                    </h1>
                    <p className="mt-1 line-clamp-1 max-w-md text-[11px] sm:text-xs text-[#D8E1DC]">
                      {language === 'en' ? currentHeroSlide.subtitle : currentHeroSlide.subtitleAm}
                    </p>
                  </div>

                  {/* Horizontally Aligned Single Action Row */}
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setDepartment(currentHeroSlide.targetDepartment ?? 'All');
                        setSelectedCategory('All');
                        setSelectedSubcategory('All');
                        if (currentHeroSlide.id === 'promo-sale-all') setSortBy('bestselling');
                        catalogRef.current?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="inline-flex min-h-[34px] sm:min-h-[38px] items-center gap-1.5 rounded-xl bg-[#C06C3E] px-3.5 py-1.5 text-xs font-semibold text-white transition-all hover:bg-[#AE5D31] active:scale-95 shadow-sm"
                    >
                      <span>{t.bannerButton}</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const target = currentHeroSlide.targetDepartment ?? 'Women';
                        setDepartment(target === 'All' ? 'Women' : target);
                        setSelectedCategory('All');
                        catalogRef.current?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="inline-flex min-h-[34px] sm:min-h-[38px] items-center gap-1 rounded-xl border border-white/20 bg-white/10 backdrop-blur-xs px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-white/20"
                    >
                      <span>
                        {language === 'en'
                          ? `Shop ${(currentHeroSlide.targetDepartment ?? 'All') === 'All' ? 'All' : currentHeroSlide.targetDepartment}`
                          : 'ይመልከቱ'}
                      </span>
                    </button>

                    <div className="ml-auto flex items-center gap-1 sm:gap-1.5">
                      {HERO_PROMO_SLIDES.map((s, idx) => (
                        <button
                          key={s.id}
                          type="button"
                          aria-label={`Promo slide ${idx + 1}`}
                          onClick={() => setActiveHeroIdx(idx)}
                          className={`h-1.5 rounded-full transition-all ${
                            idx === activeHeroIdx ? 'w-4 sm:w-5 bg-[#C06C3E]' : 'w-1.5 bg-white/40'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="relative sm:col-span-5 h-36 sm:h-auto min-h-[140px] overflow-hidden">
                  <img
                    src={currentHeroSlide.image}
                    alt={currentHeroSlide.title}
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-cover object-center transition-transform duration-700 hover:scale-105"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#1A332A] via-[#1A332A]/20 to-transparent sm:bg-gradient-to-r sm:from-[#1A332A] sm:via-transparent" />
                </div>
              </div>
            </section>
          )}

          {/* Three Shops Bar + Branch Directory Card + Circular Category Rail */}
          {view === 'shop' && (
            <section className="mb-6 space-y-3">
              <div className="flex items-center gap-6 overflow-x-auto border-b border-[#E8E2D9] pb-0 scrollbar-none">
                {(['All', 'Women', 'Men', 'Kids'] as Department[]).map((shop) => {
                  const active = department === shop;
                  return (
                    <button
                      key={`shop-bar-${shop}`}
                      type="button"
                      onClick={() => {
                        setDepartment(shop);
                        setSelectedCategory('All');
                        setSelectedSubcategory('All');
                      }}
                      className={`relative shrink-0 pb-2.5 text-xs sm:text-sm font-extrabold uppercase tracking-wider transition-colors ${
                        active
                          ? 'text-[#1A332A]'
                          : 'text-[#7D8580] hover:text-[#1F2421]'
                      }`}
                    >
                      <span>{departmentLabel(shop)}</span>
                      {active && (
                        <span className="absolute right-0 bottom-0 left-0 h-0.5 rounded-full bg-[#1A332A]" />
                      )}
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={() => {
                    setDepartment('All');
                    setSelectedCategory('All');
                    setSortBy('bestselling');
                    catalogRef.current?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="relative shrink-0 pb-2.5 text-xs sm:text-sm font-extrabold uppercase tracking-wider text-[#E03A3A] hover:text-[#C02626] transition-colors flex items-center gap-1"
                >
                  <span>🔥 {language === 'en' ? 'SALE' : 'በቅናሽ'}</span>
                </button>
              </div>

              {/* Department Branch Store Address, Call Sales, Telegram & TikTok Card */}
              {department !== 'All' && (
                <div className="rounded-2xl border border-[#DFD8CD] bg-white p-4 shadow-2xs">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-[#C06C3E]" />
                        <h3 className="font-display text-base font-bold text-[#1A332A]">
                          {language === 'en' ? activeBranchInfo.title : activeBranchInfo.titleAm}
                        </h3>
                      </div>
                      <p className="text-xs font-medium text-[#1F2421]">
                        {language === 'en' ? activeBranchInfo.address : activeBranchInfo.addressAm}
                      </p>
                      <p className="text-[11px] text-[#646B66]">
                        {language === 'en' ? activeBranchInfo.landmark : activeBranchInfo.landmarkAm} ·{' '}
                        {language === 'en' ? activeBranchInfo.hours : activeBranchInfo.hoursAm}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <a
                        href={`tel:${activeBranchInfo.salesPhone}`}
                        className="inline-flex min-h-[36px] items-center gap-1.5 rounded-xl bg-[#1A332A] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#234338]"
                      >
                        <Phone className="h-3.5 w-3.5" />
                        <span>{language === 'en' ? 'Call Store' : 'ወደ ሱቅ ደውል'}</span>
                      </a>
                      <a
                        href={activeBranchInfo.mapsUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex min-h-[36px] items-center gap-1 rounded-xl border border-[#E1DBD0] bg-[#FAF7F2] px-3 py-1.5 text-xs font-semibold text-[#1F2421]"
                      >
                        <MapPin className="h-3.5 w-3.5 text-[#C06C3E]" />
                        <span>Maps</span>
                      </a>
                      <a
                        href={activeBranchInfo.telegramChannel}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex min-h-[36px] items-center gap-1 rounded-xl border border-[#CFE0EE] bg-[#F2F7FB] px-3 py-1.5 text-xs font-semibold text-[#1B5E8A]"
                      >
                        <Send className="h-3.5 w-3.5" />
                        <span>Telegram</span>
                      </a>
                      <a
                        href={activeBranchInfo.tiktokUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex min-h-[36px] items-center gap-1 rounded-xl border border-[#E1DBD0] bg-[#FAF7F2] px-3 py-1.5 text-xs font-semibold text-[#1F2421]"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        <span>TikTok</span>
                      </a>
                      <button
                        type="button"
                        onClick={() => {
                          setSupportDepartment(department);
                          setSupportOrderId(undefined);
                          setShowSupportModal(true);
                        }}
                        className="inline-flex min-h-[36px] items-center gap-1 rounded-xl border border-[#E4C9A8] bg-[#FDF6EB] px-3 py-1.5 text-xs font-semibold text-[#8A4D14]"
                      >
                        <MessageCircle className="h-3.5 w-3.5" />
                        <span>{language === 'en' ? 'Support' : 'ድጋፍ'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <h2 className="text-xs font-bold uppercase tracking-wider text-[#5C625E]">
                  {t.categories} ({visibleCategories.length})
                </h2>
                {isStaffUser && (
                  <button
                    type="button"
                    onClick={() => setView('staff')}
                    className="text-xs font-semibold text-[#C06C3E] hover:underline"
                  >
                    + {language === 'en' ? 'Manage categories / upload item' : 'ምድብ / እቃ ጨምር'}
                  </button>
                )}
              </div>
              <div className="flex gap-3 overflow-x-auto pb-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory('All');
                    setSelectedSubcategory('All');
                  }}
                  className="flex flex-col items-center gap-1.5 shrink-0"
                >
                  <div
                    className={`flex h-16 w-16 items-center justify-center rounded-full border-2 transition-transform hover:scale-105 ${
                      selectedCategory === 'All'
                        ? 'border-[#C06C3E] bg-[#1A332A] text-white shadow-md'
                        : 'border-[#E4DDD2] bg-white text-[#1F2421]'
                    }`}
                  >
                    <span className="text-xs font-bold">ALL</span>
                  </div>
                  <span
                    className={`text-[11px] font-semibold text-center max-w-[68px] truncate ${
                      selectedCategory === 'All' ? 'text-[#C06C3E]' : 'text-[#5C625E]'
                    }`}
                  >
                    {t.allCategories}
                  </span>
                </button>

                {visibleCategories.map((cat) => {
                  const active = selectedCategory === cat.name;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        setSelectedCategory(active ? 'All' : cat.name);
                        setSelectedSubcategory('All');
                      }}
                      className="flex flex-col items-center gap-1.5 shrink-0"
                    >
                      <div
                        className={`flex h-16 w-16 items-center justify-center rounded-full border-2 transition-transform hover:scale-105 overflow-hidden ${
                          active
                            ? 'border-[#C06C3E] bg-[#1A332A] text-white shadow-md ring-2 ring-[#C06C3E]/30'
                            : 'border-[#E4DDD2] bg-white text-[#1F2421]'
                        }`}
                        style={{ backgroundColor: active ? cat.accentColor : '#FAF7F2' }}
                      >
                        <span className="text-xl">{categoryIcon(cat)}</span>
                      </div>
                      <span
                        className={`text-[11px] font-semibold text-center max-w-[74px] truncate ${
                          active ? 'text-[#C06C3E]' : 'text-[#5C625E]'
                        }`}
                      >
                        {language === 'en' ? cat.name : cat.nameAm}
                      </span>
                    </button>
                  );
                })}
              </div>

              {activeCategoryObj && activeCategoryObj.subcategories.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => setSelectedSubcategory('All')}
                    className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold ${
                      selectedSubcategory === 'All'
                        ? 'bg-[#C06C3E] text-white'
                        : 'bg-[#EFE9DE] text-[#4C524E]'
                    }`}
                  >
                    {t.all}
                  </button>
                  {activeCategoryObj.subcategories.map((sub) => (
                    <button
                      key={sub}
                      type="button"
                      onClick={() =>
                        setSelectedSubcategory(selectedSubcategory === sub ? 'All' : sub)
                      }
                      className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold ${
                        selectedSubcategory === sub
                          ? 'bg-[#C06C3E] text-white'
                          : 'bg-[#EFE9DE] text-[#4C524E]'
                      }`}
                    >
                      {sub}
                    </button>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* Collapsible Multi-Facet Filter Bar */}
          {showFilters && (
            <section className="mb-6 rounded-2xl border border-[#E4DDD2] bg-white p-4 shadow-xs">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-[#F1EDE6] pb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-[#1A332A]">
                  {t.filters} & {t.sortBy}
                </span>
                <button
                  type="button"
                  onClick={resetAllFilters}
                  className="text-xs font-semibold text-[#C06C3E] hover:underline"
                >
                  {t.clearFilters}
                </button>
              </div>

              <div className="grid gap-4 md:grid-cols-4">
                <div>
                  <p className="mb-1.5 text-[11px] font-semibold text-[#5C625E]">{t.colorFilter}</p>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => setColorFilter('All')}
                      className={`rounded-lg border px-2 py-1 text-[11px] font-semibold ${
                        colorFilter === 'All'
                          ? 'border-[#1A332A] bg-[#1A332A] text-white'
                          : 'border-[#E1DBD0] bg-[#FAF7F2] text-[#1F2421]'
                      }`}
                    >
                      {t.all}
                    </button>
                    {availableColors.slice(0, 10).map((sw) => (
                      <button
                        key={sw.name}
                        type="button"
                        onClick={() =>
                          setColorFilter(colorFilter === sw.name ? 'All' : sw.name)
                        }
                        title={sw.name}
                        className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-medium ${
                          colorFilter === sw.name
                            ? 'border-[#1A332A] bg-[#1A332A] text-white'
                            : 'border-[#E1DBD0] bg-[#FAF7F2] text-[#1F2421]'
                        }`}
                      >
                        <span
                          className="h-2.5 w-2.5 rounded-full border border-black/20"
                          style={{ backgroundColor: sw.hex }}
                        />
                        <span>{sw.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="mb-1.5 text-[11px] font-semibold text-[#5C625E]">{t.sizeFilter}</p>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => setSizeFilter('All')}
                      className={`rounded-lg border px-2 py-1 text-[11px] font-semibold ${
                        sizeFilter === 'All'
                          ? 'border-[#1A332A] bg-[#1A332A] text-white'
                          : 'border-[#E1DBD0] bg-[#FAF7F2] text-[#1F2421]'
                      }`}
                    >
                      {t.all}
                    </button>
                    {availableSizes.map((sz) => (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => setSizeFilter(sizeFilter === sz ? 'All' : sz)}
                        className={`rounded-lg border px-2 py-1 text-[11px] font-semibold ${
                          sizeFilter === sz
                            ? 'border-[#1A332A] bg-[#1A332A] text-white'
                            : 'border-[#E1DBD0] bg-[#FAF7F2] text-[#1F2421]'
                        }`}
                      >
                        {sz}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="mb-1.5 text-[11px] font-semibold text-[#5C625E]">{t.priceFilter}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {(
                      [
                        { id: 'all', label: t.all },
                        { id: 'under-2500', label: '< 2,500 ETB' },
                        { id: '2500-5000', label: '2.5k – 5k' },
                        { id: 'over-5000', label: '5,000+ ETB' },
                      ] as const
                    ).map((band) => (
                      <button
                        key={band.id}
                        type="button"
                        onClick={() => setPriceBand(band.id)}
                        className={`rounded-lg border px-2 py-1 text-[11px] font-semibold ${
                          priceBand === band.id
                            ? 'border-[#1A332A] bg-[#1A332A] text-white'
                            : 'border-[#E1DBD0] bg-[#FAF7F2] text-[#1F2421]'
                        }`}
                      >
                        {band.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-[11px] font-semibold text-[#5C625E]">
                    {t.sortBy}
                  </label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    className="min-h-[38px] w-full rounded-xl border border-[#E1DBD0] bg-[#FAF7F2] px-3 text-xs font-semibold text-[#1F2421] focus:border-[#1A332A] focus:outline-none"
                  >
                    <option value="featured">
                      {language === 'en' ? 'Featured & Curated' : 'የተመረጡ'}
                    </option>
                    <option value="bestselling">
                      {language === 'en' ? 'Best Selling' : 'ብዙ የተሸጡ'}
                    </option>
                    <option value="newest">
                      {language === 'en' ? 'Newest Drops' : 'አዲስ የገቡ'}
                    </option>
                    <option value="price-asc">
                      {language === 'en' ? 'Price: Low to High' : 'ዋጋ፡ ከዝቅተኛ ወደ ከፍተኛ'}
                    </option>
                    <option value="price-desc">
                      {language === 'en' ? 'Price: High to Low' : 'ዋጋ፡ ከከፍተኛ ወደ ዝቅተኛ'}
                    </option>
                    <option value="rating">
                      {language === 'en' ? 'Top Rated' : 'ከፍተኛ ደረጃ'}
                    </option>
                  </select>
                </div>
              </div>
            </section>
          )}

          {/* SHEIN-Inspired Flash Sale Section */}
          {view === 'shop' &&
            !query.trim() &&
            department === 'All' &&
            selectedCategory === 'All' &&
            flashDropPicks.length > 0 && (
              <section className="mb-8 rounded-2xl bg-gradient-to-r from-[#FFF5F2] via-white to-[#FFF9F5] p-4 sm:p-5 border border-[#FADCD1] shadow-xs">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#E03A3A] text-white shadow-xs">
                      ⚡
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="font-display text-lg sm:text-xl font-black uppercase tracking-tight text-[#1F2421]">
                          {language === 'en' ? 'FLASH SALE' : 'የቅናሽ ሽያጭ'}
                        </h2>
                        <span className="rounded-full bg-[#E03A3A] px-2 py-0.5 text-[9px] font-extrabold uppercase text-white animate-pulse">
                          HOT
                        </span>
                      </div>
                      <p className="text-[10px] text-[#787F7A]">
                        {language === 'en' ? 'Limited deals refresh in' : 'ቅናሾች የሚያልቁበት ቀሪ ሰዓት'}
                      </p>
                    </div>
                  </div>

                  {/* SHEIN Countdown Timer Boxes */}
                  <div className="flex items-center gap-1.5">
                    <span className="rounded-md bg-[#1F2421] px-2 py-1 text-xs font-mono font-bold text-white shadow-2xs">
                      {String(flashTime.hours).padStart(2, '0')}
                    </span>
                    <span className="font-bold text-[#E03A3A]">:</span>
                    <span className="rounded-md bg-[#1F2421] px-2 py-1 text-xs font-mono font-bold text-white shadow-2xs">
                      {String(flashTime.minutes).padStart(2, '0')}
                    </span>
                    <span className="font-bold text-[#E03A3A]">:</span>
                    <span className="rounded-md bg-[#E03A3A] px-2 py-1 text-xs font-mono font-bold text-white shadow-2xs">
                      {String(flashTime.seconds).padStart(2, '0')}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
                  {flashDropPicks.map((item, idx) => {
                    const discountPct =
                      item.compareAtPrice && item.compareAtPrice > item.price
                        ? Math.round(
                            ((item.compareAtPrice - item.price) / item.compareAtPrice) * 100,
                          )
                        : 20;
                    const claimedPct = 65 + ((idx * 11) % 25);
                    return (
                      <button
                        key={`flash-${item.id}`}
                        type="button"
                        onClick={() => openProductDetails(item)}
                        className="group overflow-hidden rounded-xl border border-[#F3E7DC] bg-white text-left transition-all hover:shadow-md hover:-translate-y-0.5"
                      >
                        <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#FAF7F2]">
                          {item.images?.[0] ? (
                            <img
                              src={item.images[0]}
                              alt={language === 'en' ? item.name : item.nameAm}
                              referrerPolicy="no-referrer"
                              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center">
                              <Store className="h-7 w-7 text-[#8B7D6B]" />
                            </div>
                          )}
                          <span className="absolute top-2 left-2 rounded-md bg-[#E03A3A] px-1.5 py-0.5 text-[10px] font-black text-white shadow-xs">
                            -{discountPct}%
                          </span>
                        </div>
                        <div className="p-2.5">
                          <p className="truncate text-xs font-semibold text-[#1F2421]">
                            {language === 'en' ? item.name : item.nameAm}
                          </p>
                          <div className="mt-1 flex items-baseline gap-1.5">
                            <span className="text-xs sm:text-sm font-black text-[#E03A3A] tabular-nums">
                              ETB {item.price.toLocaleString('en-US')}
                            </span>
                            {item.compareAtPrice && (
                              <span className="text-[10px] text-[#9B9E9B] line-through tabular-nums">
                                {item.compareAtPrice.toLocaleString('en-US')}
                              </span>
                            )}
                          </div>
                          {/* Claimed Stock Progress Bar */}
                          <div className="mt-2">
                            <div className="flex justify-between text-[9px] font-semibold text-[#787F7A] mb-0.5">
                              <span>{claimedPct}% claimed</span>
                              <span className="text-[#E03A3A]">Selling Fast</span>
                            </div>
                            <div className="h-1.5 w-full rounded-full bg-[#F0EAE1] overflow-hidden">
                              <div
                                className="h-full rounded-full bg-[#E03A3A]"
                                style={{ width: `${claimedPct}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>
            )}

          {/* Department Filters & Catalog Grid */}
          <section ref={catalogRef}>
            <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="font-display text-2xl font-semibold text-[#1F2421]">
                  {view === 'wishlist' ? t.wishlist : t.featured}
                </h2>
                <p className="mt-0.5 text-xs text-[#646B66]">
                  {results.length} {language === 'en' ? 'items' : 'ምርቶች'} · {t.demoNotice}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-[#E8E2D9] bg-white p-1">
                {departments.map((item) => {
                  const active = department === item;
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => {
                        setDepartment(item);
                        if (view === 'wishlist') setView('shop');
                      }}
                      className={`min-h-[38px] whitespace-nowrap rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                        active
                          ? 'bg-[#1A332A] text-white'
                          : 'text-[#525A55] hover:text-[#1F2421]'
                      }`}
                    >
                      {departmentLabel(item)}
                    </button>
                  );
                })}
              </div>
            </div>

            {results.length === 0 ? (
              <div className="rounded-2xl border border-[#E8E2D9] bg-white px-6 py-12 text-center">
                <p className="text-sm font-medium text-[#525A55]">
                  {view === 'wishlist'
                    ? t.wishlistEmpty
                    : department === 'Kids' && activeFilterCount === 0
                      ? t.kidsSoon
                      : t.empty}
                </p>
                {activeFilterCount > 0 && (
                  <button
                    type="button"
                    onClick={resetAllFilters}
                    className="mt-4 rounded-xl bg-[#1A332A] px-4 py-2 text-xs font-semibold text-white"
                  >
                    {t.clearFilters}
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
                {results.map((product) => {
                  const isSaved = favorites.includes(product.id);
                  const isQuickAddOpen = quickAddProductId === product.id;
                  const swatches =
                    product.colorSwatches ??
                    (product.imageLabels ?? []).map((name) => ({
                      name,
                      hex: colorSwatchHex(name),
                    }));
                  const activeCardColor = cardSelectedColors[product.id] ?? swatches[0]?.name;
                  const discountPct =
                    product.compareAtPrice && product.compareAtPrice > product.price
                      ? Math.round(
                          ((product.compareAtPrice - product.price) / product.compareAtPrice) * 100,
                        )
                      : null;

                  return (
                    <article
                      key={product.id}
                      className="group relative flex flex-col overflow-hidden rounded-xl border border-[#E8E2D9] bg-white transition-all hover:shadow-md"
                    >
                      <div
                        className="relative aspect-[3/4] w-full overflow-hidden bg-[#FAF7F2]"
                        style={{ backgroundColor: product.tint }}
                      >
                        <button
                          type="button"
                          onClick={() => openProductDetails(product, activeCardColor)}
                          className="relative h-full w-full text-left focus:outline-none"
                        >
                          {(() => {
                            const cardImgIdx = activeCardColor
                              ? resolveImageIndexForColor(product, activeCardColor)
                              : 0;
                            const primarySrc =
                              product.images?.[cardImgIdx] ?? product.images?.[0];
                            const altSrc =
                              product.images?.find((_, idx) => idx !== cardImgIdx);
                            return primarySrc ? (
                              <>
                                <img
                                  src={primarySrc}
                                  alt={language === 'en' ? product.name : product.nameAm}
                                  referrerPolicy="no-referrer"
                                  className={`h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 ${
                                    altSrc ? 'group-hover:opacity-0' : ''
                                  }`}
                                />
                                {altSrc && (
                                  <img
                                    src={altSrc}
                                    alt={`${product.name} alternate view`}
                                    referrerPolicy="no-referrer"
                                    className="absolute inset-0 h-full w-full object-cover opacity-0 transition-all duration-500 group-hover:opacity-100 group-hover:scale-105"
                                  />
                                )}
                              </>
                            ) : (
                              <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-[#F4EFE7] to-[#E6DFD4] p-4 text-center">
                                <Store className="h-8 w-8 text-[#8B7D6B]" />
                                <span className="mt-2 text-xs font-semibold text-[#5E5448]">
                                  {language === 'en' ? product.name : product.nameAm}
                                </span>
                              </div>
                            );
                          })()}
                        </button>

                        {/* Top-Left Discount or Badge Pill */}
                        {discountPct ? (
                          <span className="absolute top-2 left-2 rounded-md bg-[#E03A3A] px-1.5 py-0.5 text-[10px] font-black text-white shadow-xs">
                            -{discountPct}%
                          </span>
                        ) : product.badge ? (
                          <span className="absolute top-2 left-2 rounded-md bg-[#1A332A]/90 px-1.5 py-0.5 text-[9px] font-bold uppercase text-white backdrop-blur-xs">
                            {product.badge}
                          </span>
                        ) : null}

                        {/* Bottom-Right Floating Thumb Heart */}
                        <button
                          type="button"
                          onClick={() => toggleFavorite(product.id)}
                          aria-label={isSaved ? 'Remove from wishlist' : 'Save to wishlist'}
                          className="absolute right-2 bottom-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-[#1F2421] shadow-sm backdrop-blur-xs transition-transform active:scale-90 hover:bg-white"
                        >
                          <Heart
                            className={`h-4 w-4 ${
                              isSaved ? 'fill-[#E03A3A] text-[#E03A3A]' : 'text-[#525A55]'
                            }`}
                          />
                        </button>
                      </div>


                      <div className="flex flex-1 flex-col justify-between p-3.5 sm:p-4">
                        <div>
                          <div className="flex items-center justify-between gap-1 text-[11px] font-medium text-[#6D736E]">
                            <span className="truncate">
                              {product.brand || departmentLabel(product.department)} · {product.category}
                            </span>
                            {product.rating && (
                              <span className="inline-flex shrink-0 items-center gap-0.5 font-semibold text-[#1F2421] tabular-nums">
                                <Star className="h-3 w-3 fill-[#D8B376] text-[#D8B376]" />
                                {product.rating}
                                {product.soldCount ? (
                                  <span className="text-[#8B8E8B]"> · {product.soldCount} sold</span>
                                ) : null}
                              </span>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => openProductDetails(product, activeCardColor)}
                            className="mt-1 block text-left"
                          >
                            <h3 className="line-clamp-2 text-sm font-semibold text-[#1F2421] hover:text-[#C06C3E] sm:text-base">
                              {language === 'en' ? product.name : product.nameAm}
                            </h3>
                          </button>

                          {/* Interactive Color Swatches */}
                          <div className="mt-2 flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5">
                              {swatches.slice(0, 4).map((sw) => {
                                const selectedSwatch = activeCardColor === sw.name;
                                return (
                                  <button
                                    key={sw.name}
                                    type="button"
                                    title={sw.name}
                                    onClick={() =>
                                      setCardSelectedColors((prev) => ({
                                        ...prev,
                                        [product.id]: sw.name,
                                      }))
                                    }
                                    className={`h-4 w-4 rounded-full border transition-transform ${
                                      selectedSwatch
                                        ? 'scale-110 border-[#1A332A] ring-2 ring-[#C06C3E]/50'
                                        : 'border-black/20 hover:scale-105'
                                    }`}
                                    style={{ backgroundColor: sw.hex }}
                                  />
                                );
                              })}
                              {swatches.length > 4 && (
                                <span className="text-[10px] text-[#646B66]">
                                  +{swatches.length - 4}
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] font-medium text-[#646B66]">
                              {product.sizes}
                            </span>
                          </div>

                          {/* 1-Tap Quick Add Size Picker Overlay */}
                          {isQuickAddOpen && (
                            <div className="mt-2.5 rounded-xl border border-[#DFD8CD] bg-[#FAF7F2] p-2.5">
                              <div className="mb-1.5 flex items-center justify-between">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-[#1A332A]">
                                  {t.chooseSize} ({activeCardColor || 'Standard'})
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setQuickAddProductId(null)}
                                  className="text-[11px] font-semibold text-[#646B66]"
                                >
                                  ✕
                                </button>
                              </div>
                              <div className="flex flex-wrap gap-1.5">
                                {sizeOptions(product).map((sz) => {
                                  const matchVar = activeCardColor
                                    ? findVariant(product, sz, activeCardColor)
                                    : product.variants?.find((v) => v.size === sz);
                                  const out = !matchVar || matchVar.stock <= 0;
                                  return (
                                    <button
                                      key={sz}
                                      type="button"
                                      disabled={out}
                                      onClick={() => handleQuickAddSize(product, sz)}
                                      className={`rounded-lg border px-2 py-1 text-[11px] font-semibold transition-colors ${
                                        out
                                          ? 'border-[#E8E2D9] bg-white/50 text-[#A8ABA9] line-through'
                                          : 'border-[#D5DDD8] bg-white text-[#1A332A] hover:bg-[#1A332A] hover:text-white'
                                      }`}
                                    >
                                      {sz}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-[#F2EEE7] pt-3">
                          <div>
                            <span className="text-sm font-bold text-[#1F2421] tabular-nums sm:text-base">
                              ETB {product.price.toLocaleString('en-US')}
                            </span>
                            {product.compareAtPrice && (
                              <span className="ml-1.5 text-[11px] text-[#8B8E8B] line-through tabular-nums">
                                {product.compareAtPrice.toLocaleString('en-US')}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => toggleCompare(product.id)}
                              className={`rounded-xl px-2 py-1.5 text-[11px] font-semibold transition-colors ${
                                compareIds.includes(product.id)
                                  ? 'bg-[#1A332A] text-white'
                                  : 'bg-[#FAF7F2] text-[#646B66] ring-1 ring-[#E1DBD0] hover:text-[#1F2421]'
                              }`}
                              title={t.compare}
                            >
                              ⚖️ {compareIds.includes(product.id) ? '✓' : t.compare}
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setQuickAddProductId((cur) =>
                                  cur === product.id ? null : product.id,
                                )
                              }
                              className="min-h-[36px] shrink-0 whitespace-nowrap rounded-xl bg-[#C06C3E] px-2.5 py-1.5 text-[11px] font-semibold text-white transition-colors hover:bg-[#AE5D31]"
                            >
                              + {t.quickAdd}
                            </button>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          {/* Recently Viewed Strip */}
          {view === 'shop' && recentlyViewedProducts.length > 0 && (
            <section className="mt-10 border-t border-[#E8E2D9] pt-6">
              <h2 className="mb-3 font-display text-xl font-semibold text-[#1F2421]">
                {t.recentlyViewed}
              </h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {recentlyViewedProducts.map((item) => (
                  <button
                    key={`recent-${item.id}`}
                    type="button"
                    onClick={() => openProductDetails(item)}
                    className="flex items-center gap-3 rounded-xl border border-[#E8E2D9] bg-white p-2.5 text-left hover:border-[#1A332A]"
                  >
                    <div
                      className="h-12 w-12 shrink-0 overflow-hidden rounded-lg"
                      style={{ backgroundColor: item.tint }}
                    >
                      {item.images?.[0] ? (
                        <img
                          src={item.images[0]}
                          alt={item.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <Store className="h-4 w-4 text-[#8B7D6B]" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-[#1F2421]">
                        {language === 'en' ? item.name : item.nameAm}
                      </p>
                      <p className="text-[11px] font-bold text-[#1A332A] tabular-nums">
                        ETB {item.price.toLocaleString('en-US')}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          )}
        </main>
      )}

      {/* Cart, Promos, Payments, Google Maps Delivery Picker & Order Tracker View */}
      {view === 'cart' && (
        <main className="mx-auto max-w-5xl px-4 py-6 pb-14 sm:px-6 lg:px-8">
          <div className="mb-6 flex items-center justify-between border-b border-[#E8E2D9] pb-4">
            <div>
              <button
                type="button"
                onClick={() => setView('shop')}
                className="mb-1 inline-flex min-h-[40px] items-center gap-1.5 text-sm font-medium text-[#1A332A] hover:text-[#C06C3E]"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>{t.backToShop}</span>
              </button>
              <h1 className="font-display text-3xl font-semibold text-[#1F2421]">
                {t.cartTitle}
              </h1>
            </div>
            <span className="text-sm font-semibold text-[#5C625E] tabular-nums">
              {cartCount} {language === 'en' ? 'items' : 'እቃ'}
            </span>
          </div>

          {orderNotice && (
            <div
              className={`mb-6 rounded-2xl border p-4 text-sm font-medium ${
                orderNotice.type === 'success'
                  ? 'border-[#C7DDD2] bg-[#EFF7F3] text-[#1A332A]'
                  : 'border-[#E6B8B8] bg-[#FDF2F2] text-[#942C2C]'
              }`}
            >
              {orderNotice.text}
            </div>
          )}

          {cartItems.length === 0 ? (
            <div className="rounded-2xl border border-[#E8E2D9] bg-white p-12 text-center">
              <ShoppingBag className="mx-auto h-10 w-10 text-[#9B958C]" />
              <p className="mt-3 text-sm text-[#5C625E]">{t.emptyCart}</p>
              <button
                type="button"
                onClick={() => setView('shop')}
                className="mt-5 min-h-[44px] rounded-xl bg-[#1A332A] px-5 py-2.5 text-sm font-semibold text-white"
              >
                {t.bannerButton}
              </button>
            </div>
          ) : (
            <div className="grid gap-8 lg:grid-cols-12">
              <div className="space-y-3 lg:col-span-6">
                {/* Free Addis Delivery Threshold Bar */}
                <div className="rounded-2xl border border-[#E8E2D9] bg-white p-4">
                  <div className="flex items-center justify-between text-xs font-semibold text-[#1A332A]">
                    <span className="inline-flex items-center gap-1.5">
                      <Truck className="h-4 w-4 text-[#C06C3E]" />
                      {qualifiesFreeDelivery
                        ? language === 'en'
                          ? 'Unlocked: Free Addis Ababa Delivery!'
                          : 'ነጻ የአዲስ አበባ ማድረስ ተከፍቷል!'
                        : language === 'en'
                          ? `Add ETB ${freeDeliveryRemaining.toLocaleString('en-US')} for Free Addis Delivery`
                          : `ለነጻ ማድረስ ETB ${freeDeliveryRemaining.toLocaleString('en-US')} ይጨምሩ`}
                    </span>
                    <span className="tabular-nums">{freeDeliveryProgressPct}%</span>
                  </div>
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[#EFE9DE]">
                    <div
                      className="h-full rounded-full bg-[#1A332A] transition-all duration-300"
                      style={{ width: `${freeDeliveryProgressPct}%` }}
                    />
                  </div>
                </div>

                {cartItems.map((item) => {
                  const product = products.find((candidate) => candidate.id === item.productId);
                  if (!product) return null;
                  return (
                    <div
                      key={item.id}
                      className="flex gap-4 rounded-2xl border border-[#E8E2D9] bg-white p-4"
                    >
                      <div
                        className="h-24 w-24 shrink-0 overflow-hidden rounded-xl"
                        style={{ backgroundColor: product.tint }}
                      >
                        {product.images?.[0] ? (
                          <img
                            src={product.images[0]}
                            alt={language === 'en' ? product.name : product.nameAm}
                            referrerPolicy="no-referrer"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <Store className="h-6 w-6 text-[#8B7D6B]" />
                          </div>
                        )}
                      </div>

                      <div className="flex flex-1 flex-col justify-between">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="text-sm font-semibold text-[#1F2421] sm:text-base">
                              {language === 'en' ? product.name : product.nameAm}
                            </h3>
                            <p className="mt-0.5 text-xs text-[#646B66]">
                              {t.sizes}: {item.size} · {item.color}
                            </p>
                            {item.customNote && (
                              <p className="mt-1 rounded-md bg-[#FDF6EB] px-2 py-0.5 text-[11px] font-medium text-[#6B4214]">
                                {language === 'en' ? 'Custom fit:' : 'ልዩ ማስታወሻ:'} {item.customNote}
                              </p>
                            )}
                          </div>
                          <span className="text-sm font-bold text-[#1F2421] tabular-nums">
                            ETB {(product.price * item.quantity).toLocaleString('en-US')}
                          </span>
                        </div>

                        <div className="mt-3 flex items-center justify-between">
                          <div className="inline-flex items-center rounded-xl border border-[#E1DBD0] bg-[#FAF7F2]">
                            <button
                              type="button"
                              onClick={() => changeCartQuantity(item.id, -1)}
                              aria-label="Decrease quantity"
                              className="flex min-h-[38px] min-w-[38px] items-center justify-center text-[#1F2421]"
                            >
                              <Minus className="h-3.5 w-3.5" />
                            </button>
                            <span className="min-w-[28px] text-center text-xs font-bold tabular-nums">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => changeCartQuantity(item.id, 1)}
                              aria-label="Increase quantity"
                              className="flex min-h-[38px] min-w-[38px] items-center justify-center text-[#1F2421]"
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => removeCartItem(item.id)}
                            className="inline-flex min-h-[38px] items-center gap-1 px-2 text-xs font-semibold text-[#942C2C] hover:underline"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span>{t.remove}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <form
                onSubmit={handleRequestOrder}
                className="h-fit rounded-2xl border border-[#E8E2D9] bg-white p-5 lg:col-span-6"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="font-display text-2xl font-semibold text-[#1F2421]">
                    {t.orderRequest}
                  </h2>
                  <button
                    type="button"
                    onClick={() => {
                      setSupportOrderId(undefined);
                      setShowSupportModal(true);
                    }}
                    className="inline-flex items-center gap-1 rounded-xl border border-[#E4C9A8] bg-[#FDF6EB] px-2.5 py-1.5 text-[11px] font-semibold text-[#8A4D14]"
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                    <span>{language === 'en' ? 'Customer Support' : 'የደንበኛ ድጋፍ'}</span>
                  </button>
                </div>

                {/* Account Gate Notice: guests browse freely, ordering requires account */}
                {!currentUser ? (
                  <div className="mt-3 rounded-xl border border-[#E4C9A8] bg-[#FDF6EB] p-3.5 text-xs">
                    <div className="flex items-start gap-2">
                      <Lock className="mt-0.5 h-4 w-4 shrink-0 text-[#C06C3E]" />
                      <div className="flex-1">
                        <p className="font-bold text-[#6B4214]">
                          {language === 'en'
                            ? 'Account required to place an order'
                            : 'ትዕዛዝ ለማስገባት መለያ ያስፈልጋል'}
                        </p>
                        <p className="mt-0.5 text-[#6B4214]">
                          {language === 'en'
                            ? 'Browsing as a guest is open. Sign up or sign in with your phone/email & password to confirm delivery and track your order.'
                            : 'እንደ እንግዳ ማየት ይችላሉ፤ ለማዘዝ ግን በስልክ ወይም ኢሜይል ይግቡ።'}
                        </p>
                        <div className="mt-2.5 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setAuthMode('signup');
                              setAuthError(null);
                              setShowAuthModal(true);
                            }}
                            className="rounded-xl bg-[#1A332A] px-3 py-1.5 text-xs font-semibold text-white"
                          >
                            {language === 'en' ? 'Create Account' : 'መለያ ፍጠር'}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setAuthMode('signin');
                              setAuthError(null);
                              setShowAuthModal(true);
                            }}
                            className="rounded-xl border border-[#1A332A] bg-white px-3 py-1.5 text-xs font-semibold text-[#1A332A]"
                          >
                            {language === 'en' ? 'Sign In' : 'ግባ'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="mt-2 rounded-xl bg-[#EFF7F3] px-3 py-2 text-xs font-semibold text-[#1A332A]">
                    ✓ {language === 'en' ? 'Ordering as' : 'በስም'} {currentUser.name} ({currentUser.identifier})
                  </p>
                )}

                <div className="mt-4 space-y-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-[#4C524E]">
                        {t.customerName}
                      </label>
                      <input
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder={t.customerName}
                        className="min-h-[42px] w-full rounded-xl border border-[#E1DBD0] bg-[#FAF7F2] px-3.5 text-sm text-[#1F2421] focus:border-[#1A332A] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-semibold text-[#4C524E]">
                        {t.customerPhone}
                      </label>
                      <input
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        placeholder="09..."
                        type="tel"
                        className="min-h-[42px] w-full rounded-xl border border-[#E1DBD0] bg-[#FAF7F2] px-3.5 text-sm text-[#1F2421] tabular-nums focus:border-[#1A332A] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-[#4C524E]">
                      {language === 'en' ? 'Email (optional)' : 'ኢሜይል (አማራጭ)'}
                    </label>
                    <input
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      placeholder="name@example.com"
                      type="email"
                      className="min-h-[40px] w-full rounded-xl border border-[#E1DBD0] bg-[#FAF7F2] px-3.5 text-sm text-[#1F2421] focus:border-[#1A332A] focus:outline-none"
                    />
                  </div>

                  <label className="flex items-center gap-2 text-xs font-medium text-[#5C625E]">
                    <input
                      type="checkbox"
                      checked={saveProfileInfo}
                      onChange={(e) => setSaveProfileInfo(e.target.checked)}
                      className="h-4 w-4 accent-[#1A332A]"
                    />
                    <span>
                      {language === 'en'
                        ? 'Save my contact & city address for faster checkout'
                        : 'ለቀጣይ ግዢ ስሜን እና አድራሻዬን አስቀምጥ'}
                    </span>
                  </label>

                  <div>
                    <span className="mb-1.5 block text-xs font-semibold text-[#4C524E]">
                      {t.fulfillment}
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      {(['delivery', 'pickup'] as const).map((choice) => (
                        <button
                          key={choice}
                          type="button"
                          onClick={() => setFulfillment(choice)}
                          className={`min-h-[42px] rounded-xl border px-3 py-2 text-xs font-semibold transition-colors ${
                            fulfillment === choice
                              ? 'border-[#1A332A] bg-[#1A332A] text-white'
                              : 'border-[#E1DBD0] bg-white text-[#1F2421]'
                          }`}
                        >
                          {choice === 'pickup' ? t.pickup : t.delivery}
                        </button>
                      ))}
                    </div>
                  </div>

                  {fulfillment === 'delivery' && (
                    <div className="space-y-3 rounded-xl border border-[#E8E2D9] bg-[#FAF7F2] p-3.5">
                      {/* Delivery Courier Provider Selector (Mela, Addis Courier, Regional Parcel) */}
                      <div>
                        <span className="mb-1.5 block text-xs font-bold text-[#1A332A]">
                          {language === 'en'
                            ? 'Delivery Partner'
                            : 'የማድረሻ አገልግሎት'}
                        </span>
                        <div className="grid gap-1.5 sm:grid-cols-3">
                          {DELIVERY_PROVIDERS.map((prov) => (
                            <button
                              key={prov.id}
                              type="button"
                              onClick={() => setDeliveryProvider(prov.id)}
                              className={`rounded-xl border p-2 text-left text-[11px] transition-colors ${
                                deliveryProvider === prov.id
                                  ? 'border-[#1A332A] bg-[#1A332A] text-white'
                                  : 'border-[#E1DBD0] bg-white text-[#1F2421]'
                              }`}
                            >
                              <p className="font-bold">
                                {language === 'en' ? prov.label : prov.labelAm}
                              </p>
                              <p
                                className={`text-[10px] ${
                                  deliveryProvider === prov.id
                                    ? 'text-[#D8E1DC]'
                                    : 'text-[#646B66]'
                                }`}
                              >
                                {language === 'en' ? prov.note : prov.noteAm}
                              </p>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* City & Addis Subcity Selectors */}
                      <div className="grid gap-2.5 sm:grid-cols-2">
                        <div>
                          <label className="mb-1 block text-xs font-semibold text-[#4C524E]">
                            {language === 'en' ? 'City / Region' : 'ከተማ / ክልል'}
                          </label>
                          <select
                            value={deliveryCity}
                            onChange={(e) => {
                              const nextCity = e.target.value;
                              setDeliveryCity(nextCity);
                              if (nextCity !== 'Addis Ababa') {
                                setEstimatedDeliveryFee(280);
                                setDeliveryZone(nextCity === 'Other' ? 'Regional Ethiopia' : nextCity);
                                if (deliveryProvider !== 'regional-parcel') {
                                  setDeliveryProvider('regional-parcel');
                                }
                              }
                            }}
                            className="min-h-[40px] w-full rounded-xl border border-[#E1DBD0] bg-white px-3 text-xs font-semibold text-[#1F2421]"
                          >
                            <option value="Addis Ababa">Addis Ababa (አዲስ አበባ)</option>
                            {ETHIOPIA_REGIONAL_CITIES.map((city) => (
                              <option key={city.id} value={city.label}>
                                {language === 'en' ? city.label : `${city.labelAm} (${city.label})`}
                              </option>
                            ))}
                          </select>
                        </div>

                        {deliveryCity === 'Addis Ababa' ? (
                          <div>
                            <label className="mb-1 block text-xs font-semibold text-[#4C524E]">
                              {language === 'en' ? 'Addis Subcity' : 'ክፍለ ከተማ'}
                            </label>
                            <select
                              value={deliverySubcity}
                              onChange={(e) => {
                                const sub = ADDIS_SUBCITIES.find((s) => s.label === e.target.value);
                                setDeliverySubcity(e.target.value);
                                if (sub) {
                                  const dist = computeDistanceKm(BELIKA_SHOP_COORDS, sub.coords);
                                  setDeliveryCoords(sub.coords);
                                  setDeliveryDistanceKm(dist);
                                  setEstimatedDeliveryFee(estimateAddisDeliveryFee(dist));
                                  setDeliveryZone(sub.label);
                                  if (!deliveryAddress.trim()) {
                                    setDeliveryAddress(`${sub.label} Subcity, Addis Ababa`);
                                  }
                                }
                              }}
                              className="min-h-[40px] w-full rounded-xl border border-[#E1DBD0] bg-white px-3 text-xs font-semibold text-[#1F2421]"
                            >
                              {ADDIS_SUBCITIES.map((s) => (
                                <option key={s.id} value={s.label}>
                                  {language === 'en' ? s.label : s.labelAm}
                                </option>
                              ))}
                            </select>
                          </div>
                        ) : deliveryCity === 'Other' ? (
                          <div>
                            <label className="mb-1 block text-xs font-semibold text-[#4C524E]">
                              {language === 'en' ? 'Specify City / Town' : 'ከተማውን ይጻፉ'}
                            </label>
                            <input
                              value={customCityInput}
                              onChange={(e) => setCustomCityInput(e.target.value)}
                              placeholder="e.g. Debre Birhan, Kombolcha…"
                              className="min-h-[40px] w-full rounded-xl border border-[#E1DBD0] bg-white px-3 text-xs text-[#1F2421]"
                            />
                          </div>
                        ) : (
                          <div className="flex items-end">
                            <p className="w-full rounded-xl border border-[#E1DBD0] bg-white px-3 py-2.5 text-[11px] font-medium text-[#1A332A]">
                              Regional dispatch via bus/courier · Est. ETB 280
                            </p>
                          </div>
                        )}
                      </div>

                      {/* One-Tap GPS Share My Location + Interactive Google Map */}
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-[#1A332A]">
                          <MapPin className="h-4 w-4 text-[#C06C3E]" />
                          <span>
                            {language === 'en'
                              ? 'Share GPS or Pin on Google Maps'
                              : 'GPS ያጋሩ ወይም በካርታ ይምረጡ'}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={handleShareMyGpsLocation}
                          disabled={gpsLoading}
                          className="inline-flex min-h-[36px] items-center gap-1.5 rounded-xl bg-[#1A332A] px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-[#234338] disabled:opacity-60"
                        >
                          <Navigation className="h-3.5 w-3.5 text-[#E5B899]" />
                          <span>
                            {gpsLoading
                              ? 'Locating…'
                              : language === 'en'
                                ? 'Use My Current Location'
                                : 'የአሁኑን ቦታዬን ተጠቀም'}
                          </span>
                        </button>
                      </div>

                      <DeliveryAddressMap
                        language={language}
                        address={deliveryAddress}
                        onLocationChange={handleDeliveryMapLocation}
                      />

                      <div>
                        <label className="mb-1 block text-xs font-semibold text-[#4C524E]">
                          {t.deliveryAddress}
                        </label>
                        <input
                          value={deliveryAddress}
                          onChange={(e) => setDeliveryAddress(e.target.value)}
                          placeholder={t.deliveryAddress}
                          className="min-h-[42px] w-full rounded-xl border border-[#E1DBD0] bg-white px-3.5 text-sm text-[#1F2421] focus:border-[#1A332A] focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-semibold text-[#4C524E]">
                          {t.deliveryLandmark}
                        </label>
                        <input
                          value={deliveryLandmark}
                          onChange={(e) => setDeliveryLandmark(e.target.value)}
                          placeholder={t.deliveryLandmark}
                          className="min-h-[42px] w-full rounded-xl border border-[#E1DBD0] bg-white px-3.5 text-sm text-[#1F2421] focus:border-[#1A332A] focus:outline-none"
                        />
                      </div>
                      <p className="text-[11px] text-[#646B66]">{t.deliveryFeeNote}</p>
                    </div>
                  )}

                  {/* Ethiopian Payment Methods + Optional Screenshot Proof */}
                  <div>
                    <span className="mb-1.5 block text-xs font-semibold text-[#4C524E]">
                      {t.paymentMethodLabel}
                    </span>
                    <div className="grid gap-2 sm:grid-cols-3">
                      {(
                        [
                          { id: 'cod', label: t.payCod },
                          { id: 'telebirr', label: t.payTelebirr },
                          { id: 'cbe', label: t.payCbe },
                        ] as const
                      ).map((method) => (
                        <button
                          key={method.id}
                          type="button"
                          onClick={() => setPaymentMethod(method.id)}
                          className={`min-h-[40px] rounded-xl border px-2.5 py-2 text-[11px] font-semibold transition-colors ${
                            paymentMethod === method.id
                              ? 'border-[#1A332A] bg-[#1A332A] text-white'
                              : 'border-[#E1DBD0] bg-[#FAF7F2] text-[#1F2421]'
                          }`}
                        >
                          {method.label}
                        </button>
                      ))}
                    </div>

                    {paymentMethod !== 'cod' && (
                      <div className="mt-2 space-y-2 rounded-xl border border-[#DFD8CD] bg-[#FAF7F2] p-3 text-xs">
                        <p className="font-semibold text-[#1A332A]">
                          {paymentMethod === 'telebirr'
                            ? `Telebirr Merchant: ${activeBranchInfo.telebirrAccount}`
                            : `CBE Account: ${activeBranchInfo.cbeAccount}`}
                        </p>
                        <input
                          value={paymentReference}
                          onChange={(e) => setPaymentReference(e.target.value)}
                          placeholder={
                            language === 'en'
                              ? 'Transfer reference / FT number (optional)'
                              : 'የክፍያ ማረጋገጫ ቁጥር (አማራጭ)'
                          }
                          className="w-full rounded-lg border border-[#E1DBD0] bg-white px-3 py-1.5 text-xs text-[#1F2421]"
                        />
                        <div className="flex flex-wrap items-center gap-2">
                          <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-[#D5DDD8] bg-white px-3 py-1.5 text-[11px] font-semibold text-[#1A332A] hover:bg-[#FAF7F2]">
                            <ImagePlus className="h-3.5 w-3.5 text-[#C06C3E]" />
                            <span>
                              {paymentProofImage
                                ? language === 'en'
                                  ? 'Change Payment Screenshot'
                                  : 'ማረጋገጫ ፎቶ ቀይር'
                                : language === 'en'
                                  ? 'Attach Payment Screenshot (Optional)'
                                  : 'የክፍያ ስክሪንሾት አያይዝ (አማራጭ)'}
                            </span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handlePaymentProofSelect}
                              className="sr-only"
                            />
                          </label>
                          {paymentProofImage && (
                            <div className="flex items-center gap-1.5">
                              <img
                                src={paymentProofImage}
                                alt="Payment proof"
                                className="h-9 w-9 rounded-lg border border-[#E1DBD0] object-cover"
                              />
                              <button
                                type="button"
                                onClick={() => setPaymentProofImage(null)}
                                className="text-[11px] font-semibold text-[#942C2C] hover:underline"
                              >
                                Remove
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Promo Code Input */}
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-[#4C524E]">
                      {language === 'en' ? 'Promo / Voucher Code' : 'የቅናሽ ኮድ'}
                    </label>
                    <div className="flex gap-2">
                      <input
                        value={promoInput}
                        onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                        placeholder={t.promoPlaceholder}
                        className="min-h-[40px] flex-1 rounded-xl border border-[#E1DBD0] bg-[#FAF7F2] px-3 text-xs font-semibold uppercase text-[#1F2421]"
                      />
                      <button
                        type="button"
                        onClick={() => handleApplyPromoCode()}
                        className="rounded-xl bg-[#1A332A] px-4 text-xs font-semibold text-white hover:bg-[#234338]"
                      >
                        {t.applyPromo}
                      </button>
                    </div>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {promos
                        .filter((p) => p.active)
                        .slice(0, 3)
                        .map((p) => (
                          <button
                            key={p.code}
                            type="button"
                            onClick={() => handleApplyPromoCode(p.code)}
                            className="inline-flex items-center gap-1 rounded-md border border-[#E1DBD0] bg-[#FAF7F2] px-2 py-0.5 text-[10px] font-semibold text-[#C06C3E] hover:border-[#C06C3E]"
                          >
                            <Tag className="h-2.5 w-2.5" />
                            {p.code}
                          </button>
                        ))}
                    </div>
                  </div>
                </div>

                {/* Order Summary */}
                <div className="mt-5 border-t border-[#E8E2D9] pt-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#646B66]">
                    {t.orderSummary}
                  </p>
                  <div className="mt-2 space-y-1.5 text-xs text-[#4C524E]">
                    <div className="flex justify-between">
                      <span>{t.subtotal}</span>
                      <span className="font-semibold text-[#1F2421] tabular-nums">
                        ETB {cartSubtotal.toLocaleString('en-US')}
                      </span>
                    </div>
                    {promoDiscountAmount > 0 && activePromo && (
                      <div className="flex justify-between text-[#1A5937]">
                        <span>Promo ({activePromo.code})</span>
                        <span className="font-semibold tabular-nums">
                          −ETB {promoDiscountAmount.toLocaleString('en-US')}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>{t.fulfillment}</span>
                      <span>
                        {fulfillment === 'pickup'
                          ? t.pickup
                          : `${DELIVERY_PROVIDERS.find((p) => p.id === deliveryProvider)?.label ?? 'Delivery'} · ${deliveryCity}`}
                      </span>
                    </div>
                    {fulfillment === 'delivery' && (
                      <div className="flex justify-between">
                        <span>
                          {language === 'en' ? 'Courier Fee' : 'የማድረሻ ክፍያ'}
                          {deliveryDistanceKm ? ` (${deliveryDistanceKm} km)` : ''}
                        </span>
                        <span className="font-semibold text-[#1A332A] tabular-nums">
                          {qualifiesFreeDelivery
                            ? 'FREE (ETB 5,000+)'
                            : estimatedDeliveryFee > 0
                              ? `ETB ${estimatedDeliveryFee.toLocaleString('en-US')}`
                              : 'TBD'}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="mt-3 flex items-center justify-between border-t border-[#F1EDE6] pt-3">
                    <span className="text-sm font-bold text-[#1F2421]">{t.total}</span>
                    <span className="text-lg font-bold text-[#1A332A] tabular-nums">
                      ETB {orderTotalWithDelivery.toLocaleString('en-US')}
                    </span>
                  </div>

                  <button
                    type="submit"
                    className="mt-4 min-h-[48px] w-full rounded-xl bg-[#C06C3E] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#AE5D31]"
                  >
                    {currentUser
                      ? t.submitRequest
                      : language === 'en'
                        ? 'Sign In / Create Account to Order'
                        : 'ለማዘዝ ይግቡ / መለያ ይፍጠሩ'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Customer 4-Step Order Tracker History */}
          {orders.length > 0 && (
            <section className="mt-10 border-t border-[#E8E2D9] pt-6">
              <h2 className="mb-3 font-display text-2xl font-semibold text-[#1F2421]">
                {t.myOrders}
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                {orders.slice(0, 6).map((order) => (
                  <div
                    key={`cust-${order.id}`}
                    className="rounded-2xl border border-[#E8E2D9] bg-white p-4"
                  >
                    <div className="flex items-center justify-between border-b border-[#F2EEE7] pb-2">
                      <span className="text-sm font-bold text-[#1F2421] tabular-nums">
                        {order.id}
                      </span>
                      <span className="rounded-lg bg-[#FAF7F2] px-2.5 py-1 text-xs font-semibold text-[#C06C3E]">
                        {orderStatusLabel(order.status)}
                      </span>
                    </div>
                    {renderOrderStepper(order.status)}
                    <p className="mt-2.5 text-xs text-[#646B66]">
                      {order.fulfillment === 'pickup' ? t.pickup : order.deliveryAddress}
                    </p>
                    <div className="mt-2 flex items-center justify-between">
                      <p className="text-sm font-bold text-[#1A332A] tabular-nums">
                        ETB {order.total.toLocaleString('en-US')} · {order.items.length}{' '}
                        {language === 'en' ? 'lines' : 'አይነት'}
                      </p>
                      <button
                        type="button"
                        onClick={() => setTrackingOrder(order)}
                        className="text-xs font-semibold text-[#C06C3E] hover:underline"
                      >
                        {language === 'en' ? 'View Receipt' : 'ደረሰኝ እይ'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </main>
      )}

      {/* Storefront Footer */}
      {view !== 'staff' && (
        <footer className="border-t border-[#E8E2D9] bg-white/70">
          <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 text-xs text-[#5C625E] sm:grid-cols-3 sm:px-6 lg:px-8">
            <div>
              <img
                src={BELIKA_ORIGINAL_LOGO}
                alt="Belika Online Store"
                className="h-9 w-auto object-contain"
              />
              <p className="mt-2 leading-relaxed">
                {activeBranchInfo.address} · {activeBranchInfo.hours}
              </p>
              <p className="mt-1 text-[#646B66]">
                7-day size exchange · Telebirr, CBE Birr & Cash on Delivery
              </p>
            </div>
            <div>
              <p className="font-semibold uppercase tracking-wider text-[#1F2421]">
                {t.departments}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {(['Women', 'Men', 'Kids'] as Department[]).map((dep) => (
                  <button
                    key={`foot-${dep}`}
                    type="button"
                    onClick={() => {
                      setDepartment(dep);
                      setView('shop');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="rounded-lg border border-[#E8E2D9] bg-[#FAF7F2] px-2.5 py-1 font-semibold text-[#1A332A] hover:border-[#C06C3E]"
                  >
                    {departmentLabel(dep)}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="font-semibold uppercase tracking-wider text-[#1F2421]">
                {language === 'en' ? 'Account, Support & App' : 'መለያ፣ ድጋፍ እና መተግበሪያ'}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSupportOrderId(undefined);
                    setShowSupportModal(true);
                  }}
                  className="inline-flex items-center gap-1 rounded-lg border border-[#E8E2D9] bg-[#FAF7F2] px-3 py-1.5 font-semibold text-[#1A332A]"
                >
                  <MessageCircle className="h-3.5 w-3.5 text-[#C06C3E]" />
                  <span>{language === 'en' ? 'Customer Support' : 'ድጋፍ'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthError(null);
                    setAuthMode('signin');
                    setShowAuthModal(true);
                  }}
                  className="rounded-lg bg-[#1A332A] px-3 py-1.5 font-semibold text-white"
                >
                  {currentUser
                    ? isStaffUser
                      ? t.staff
                      : currentUser.name
                    : language === 'en'
                      ? 'Account Sign In'
                      : 'መለያ ግባ'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowExpoModal(true)}
                  className="rounded-lg border border-[#E8E2D9] bg-[#FAF7F2] px-3 py-1.5 font-semibold text-[#1F2421]"
                >
                  Expo Go App.tsx
                </button>
              </div>
            </div>
          </div>
        </footer>
      )}

      {/* Slide-Over Shopping Bag Drawer */}
      {showBagDrawer && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-black/45 backdrop-blur-xs"
          onClick={() => setShowBagDrawer(false)}
        >
          <aside
            onClick={(e) => e.stopPropagation()}
            className="flex h-full w-full max-w-md flex-col bg-[#FAF7F2] shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-[#E8E2D9] bg-white px-5 py-4">
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-4 w-4 text-[#C06C3E]" />
                <h2 className="font-display text-xl font-bold text-[#1F2421]">
                  {t.bag} ({cartCount})
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowBagDrawer(false)}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#DFD8CD] bg-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Free Delivery Progress */}
            <div className="border-b border-[#E8E2D9] bg-white/80 px-5 py-3">
              <div className="flex items-center justify-between text-[11px] font-semibold text-[#1A332A]">
                <span>
                  {qualifiesFreeDelivery
                    ? language === 'en'
                      ? 'Free Addis delivery unlocked!'
                      : 'ነጻ ማድረስ ተከፍቷል!'
                    : language === 'en'
                      ? `ETB ${freeDeliveryRemaining.toLocaleString('en-US')} away from free delivery`
                      : `ETB ${freeDeliveryRemaining.toLocaleString('en-US')} ለነጻ ማድረስ ቀርቷል`}
                </span>
                <span className="tabular-nums">{freeDeliveryProgressPct}%</span>
              </div>
              <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-[#EFE9DE]">
                <div
                  className="h-full rounded-full bg-[#C06C3E] transition-all duration-300"
                  style={{ width: `${freeDeliveryProgressPct}%` }}
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              {cartItems.length === 0 ? (
                <div className="py-16 text-center">
                  <ShoppingBag className="mx-auto h-10 w-10 text-[#9B958C]" />
                  <p className="mt-3 text-sm text-[#5C625E]">{t.emptyCart}</p>
                </div>
              ) : (
                cartItems.map((item) => {
                  const product = products.find((p) => p.id === item.productId);
                  if (!product) return null;
                  return (
                    <div
                      key={`drawer-${item.id}`}
                      className="flex gap-3 rounded-2xl border border-[#E8E2D9] bg-white p-3"
                    >
                      <div
                        className="h-18 w-16 shrink-0 overflow-hidden rounded-xl"
                        style={{ backgroundColor: product.tint }}
                      >
                        {product.images?.[0] ? (
                          <img
                            src={product.images[0]}
                            alt={product.name}
                            className="h-full w-full object-cover"
                          />
                        ) : null}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="truncate text-xs font-bold text-[#1F2421]">
                            {language === 'en' ? product.name : product.nameAm}
                          </p>
                          <button
                            type="button"
                            onClick={() => removeCartItem(item.id)}
                            className="text-[#942C2C]"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <p className="mt-0.5 text-[11px] text-[#646B66]">
                          {item.size} · {item.color}
                        </p>
                        <div className="mt-2 flex items-center justify-between">
                          <div className="inline-flex items-center rounded-lg border border-[#E1DBD0] bg-[#FAF7F2]">
                            <button
                              type="button"
                              onClick={() => changeCartQuantity(item.id, -1)}
                              className="flex h-7 w-7 items-center justify-center"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="min-w-[22px] text-center text-xs font-bold tabular-nums">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => changeCartQuantity(item.id, 1)}
                              className="flex h-7 w-7 items-center justify-center"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                          <span className="text-xs font-bold text-[#1A332A] tabular-nums">
                            ETB {(product.price * item.quantity).toLocaleString('en-US')}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {cartItems.length > 0 && (
              <div className="border-t border-[#E8E2D9] bg-white p-5 space-y-3">
                <div className="flex gap-2">
                  <input
                    value={promoInput}
                    onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                    placeholder={t.promoPlaceholder}
                    className="min-h-[38px] flex-1 rounded-xl border border-[#E1DBD0] bg-[#FAF7F2] px-3 text-xs font-semibold uppercase"
                  />
                  <button
                    type="button"
                    onClick={() => handleApplyPromoCode()}
                    className="rounded-xl border border-[#1A332A] px-3 text-xs font-semibold text-[#1A332A]"
                  >
                    {t.applyPromo}
                  </button>
                </div>

                <div className="space-y-1 text-xs">
                  <div className="flex justify-between text-[#5C625E]">
                    <span>{t.subtotal}</span>
                    <span className="font-semibold text-[#1F2421] tabular-nums">
                      ETB {cartSubtotal.toLocaleString('en-US')}
                    </span>
                  </div>
                  {promoDiscountAmount > 0 && activePromo && (
                    <div className="flex justify-between text-[#1A5937]">
                      <span>{activePromo.code}</span>
                      <span className="font-semibold tabular-nums">
                        −ETB {promoDiscountAmount.toLocaleString('en-US')}
                      </span>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setShowBagDrawer(false);
                    setOrderNotice(null);
                    setView('cart');
                  }}
                  className="min-h-[46px] w-full rounded-xl bg-[#C06C3E] text-sm font-semibold text-white hover:bg-[#AE5D31]"
                >
                  {language === 'en' ? 'Proceed to Checkout' : 'ወደ ክፍያ ቀጥል'} · ETB{' '}
                  {(cartSubtotal - promoDiscountAmount).toLocaleString('en-US')}
                </button>
              </div>
            )}
          </aside>
        </div>
      )}

      {/* Product Detail Modal (PDP) */}
      {selectedProduct && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-xs sm:items-center sm:p-6"
          role="dialog"
          aria-modal="true"
        >
          <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-t-3xl bg-[#FAF7F2] sm:rounded-3xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#E8E2D9] bg-[#FAF7F2]/95 px-5 py-3.5 backdrop-blur-sm">
              <span className="text-sm font-semibold text-[#1F2421]">{t.details}</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => void handleShareProduct(selectedProduct)}
                  aria-label="Share product"
                  className="flex min-h-[38px] min-w-[38px] items-center justify-center rounded-full border border-[#E1DBD0] bg-white text-[#1F2421]"
                >
                  <Share2 className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedProduct(null)}
                  aria-label="Close product details"
                  className="flex min-h-[38px] min-w-[38px] items-center justify-center rounded-full border border-[#E1DBD0] bg-white text-[#1F2421]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="grid gap-6 p-5 sm:p-7 md:grid-cols-12">
              {/* Gallery + Interactive Zoom & Pan Drag */}
              <div className="md:col-span-6">
                <div
                  onPointerDown={(e) => {
                    if (zoomLevel <= 1) return;
                    setIsDraggingZoom(true);
                    dragStartRef.current = {
                      x: e.clientX,
                      y: e.clientY,
                      origX: zoomOffset.x,
                      origY: zoomOffset.y,
                    };
                  }}
                  onPointerMove={(e) => {
                    if (!isDraggingZoom || !dragStartRef.current || zoomLevel <= 1) return;
                    const maxShift = (zoomLevel - 1) * 140;
                    const nx = Math.max(
                      -maxShift,
                      Math.min(maxShift, dragStartRef.current.origX + (e.clientX - dragStartRef.current.x)),
                    );
                    const ny = Math.max(
                      -maxShift,
                      Math.min(maxShift, dragStartRef.current.origY + (e.clientY - dragStartRef.current.y)),
                    );
                    setZoomOffset({ x: nx, y: ny });
                  }}
                  onPointerUp={() => {
                    setIsDraggingZoom(false);
                    dragStartRef.current = null;
                  }}
                  onPointerLeave={() => {
                    setIsDraggingZoom(false);
                    dragStartRef.current = null;
                  }}
                  className={`relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-[#E8E2D9] select-none ${
                    zoomLevel > 1 ? 'cursor-grab touch-none active:cursor-grabbing' : ''
                  }`}
                  style={{ backgroundColor: selectedProduct.tint }}
                >
                  {selectedProduct.images && selectedProduct.images.length > 0 ? (
                    <img
                      src={
                        selectedProduct.images[selectedImageIndex] ?? selectedProduct.images[0]
                      }
                      alt={language === 'en' ? selectedProduct.name : selectedProduct.nameAm}
                      draggable={false}
                      referrerPolicy="no-referrer"
                      style={{
                        transform: `translate(${zoomOffset.x}px, ${zoomOffset.y}px) scale(${zoomLevel})`,
                      }}
                      className="h-full w-full object-contain transition-transform duration-150"
                    />
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-[#F4EFE7] to-[#E6DFD4] p-6 text-center">
                      <Store className="h-12 w-12 text-[#8B7D6B]" />
                      <p className="mt-2 text-sm font-semibold text-[#5E5448]">
                        {language === 'en' ? selectedProduct.name : selectedProduct.nameAm}
                      </p>
                      <p className="mt-0.5 text-xs text-[#7D7265]">{t.samplePhoto}</p>
                    </div>
                  )}

                  {selectedProduct.images && selectedProduct.images.length > 0 && (
                    <div className="absolute right-3 bottom-3 flex items-center gap-1.5 rounded-xl bg-[#1F2421]/80 p-1 text-white backdrop-blur-sm">
                      <button
                        type="button"
                        onClick={() =>
                          setZoomLevel((z) => {
                            const next = Math.max(1, Number((z - 0.5).toFixed(1)));
                            if (next === 1) setZoomOffset({ x: 0, y: 0 });
                            return next;
                          })
                        }
                        aria-label="Zoom out"
                        className="flex min-h-[34px] min-w-[34px] items-center justify-center rounded-lg hover:bg-white/15"
                      >
                        <ZoomOut className="h-4 w-4" />
                      </button>
                      <span className="px-1 text-xs font-semibold tabular-nums">{zoomLevel}×</span>
                      <button
                        type="button"
                        onClick={() => setZoomLevel((z) => Math.min(3, Number((z + 0.5).toFixed(1))))}
                        aria-label="Zoom in"
                        className="flex min-h-[34px] min-w-[34px] items-center justify-center rounded-lg hover:bg-white/15"
                      >
                        <ZoomIn className="h-4 w-4" />
                      </button>
                    </div>
                  )}

                  {selectedProduct.images && selectedProduct.images.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setZoomLevel(1);
                          setZoomOffset({ x: 0, y: 0 });
                          setSelectedImageIndex((idx) =>
                            idx === 0 ? selectedProduct.images!.length - 1 : idx - 1,
                          );
                        }}
                        aria-label="Previous image"
                        className="absolute top-1/2 left-2.5 flex min-h-[38px] min-w-[38px] -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-[#1F2421] shadow-sm"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setZoomLevel(1);
                          setZoomOffset({ x: 0, y: 0 });
                          setSelectedImageIndex((idx) =>
                            idx === selectedProduct.images!.length - 1 ? 0 : idx + 1,
                          );
                        }}
                        aria-label="Next image"
                        className="absolute top-1/2 right-2.5 flex min-h-[38px] min-w-[38px] -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-[#1F2421] shadow-sm"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </>
                  )}
                </div>

                {selectedProduct.images && selectedProduct.images.length > 1 && (
                  <div className="mt-3 flex gap-2.5 overflow-x-auto pb-1">
                    {selectedProduct.images.map((image, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => {
                          setSelectedImageIndex(index);
                          setZoomLevel(1);
                          setZoomOffset({ x: 0, y: 0 });
                        }}
                        className={`h-16 w-20 shrink-0 overflow-hidden rounded-xl border-2 transition-colors ${
                          selectedImageIndex === index
                            ? 'border-[#C06C3E]'
                            : 'border-[#E8E2D9] opacity-80'
                        }`}
                      >
                        <img
                          src={image}
                          alt={`View ${index + 1}`}
                          referrerPolicy="no-referrer"
                          className="h-full w-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
                <p className="mt-2 text-xs text-[#646B66]">
                  {zoomLevel > 1
                    ? language === 'en'
                      ? 'Drag photo in any direction to inspect stitching & fabric.'
                      : 'ጨርቁን ለማየት ፎቶውን ይጎትቱ።'
                    : t.zoomHint}
                </p>

                {/* Delivery & Guarantee Strip */}
                <div className="mt-4 grid grid-cols-2 gap-2.5 rounded-xl border border-[#E8E2D9] bg-white p-3 text-[11px] text-[#4C524E]">
                  <div className="flex items-start gap-2">
                    <Truck className="mt-0.5 h-4 w-4 shrink-0 text-[#C06C3E]" />
                    <span>
                      <strong className="block text-[#1F2421]">Addis Same-Day Dispatch</strong>
                      Free on orders ETB 5,000+
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#1A332A]" />
                    <span>
                      <strong className="block text-[#1F2421]">7-Day Size Exchange</strong>
                      Bole flagship & courier pickup
                    </span>
                  </div>
                </div>

                {/* Similar Items */}
                {similarProducts.length > 0 && (
                  <div className="mt-5 border-t border-[#E8E2D9] pt-4">
                    <p className="mb-2.5 text-xs font-bold uppercase tracking-wider text-[#5C625E]">
                      {language === 'en' ? 'Complete the Look' : 'ተመሳሳይ ዘይቤዎች'}
                    </p>
                    <div className="grid grid-cols-2 gap-2.5">
                      {similarProducts.map((sim) => (
                        <button
                          key={`sim-${sim.id}`}
                          type="button"
                          onClick={() => openProductDetails(sim)}
                          className="flex items-center gap-2.5 rounded-xl border border-[#E8E2D9] bg-white p-2 text-left hover:border-[#1A332A]"
                        >
                          <div
                            className="h-11 w-11 shrink-0 overflow-hidden rounded-lg"
                            style={{ backgroundColor: sim.tint }}
                          >
                            {sim.images?.[0] ? (
                              <img
                                src={sim.images[0]}
                                alt={sim.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center">
                                <Store className="h-4 w-4 text-[#8B7D6B]" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-xs font-semibold text-[#1F2421]">
                              {language === 'en' ? sim.name : sim.nameAm}
                            </p>
                            <p className="text-[11px] font-bold text-[#C06C3E] tabular-nums">
                              ETB {sim.price.toLocaleString('en-US')}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Purchase Module */}
              <div className="flex flex-col justify-between md:col-span-6">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-[#C06C3E]">
                      {selectedProduct.brand ? `${selectedProduct.brand} · ` : ''}
                      {departmentLabel(selectedProduct.department)} · {selectedProduct.category}
                    </p>
                    {selectedProduct.rating && (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-[#1F2421] tabular-nums">
                        <Star className="h-3.5 w-3.5 fill-[#D8B376] text-[#D8B376]" />
                        {selectedProduct.rating} ({selectedProduct.reviewCount ?? 0})
                      </span>
                    )}
                  </div>
                  <h2 className="mt-1 font-display text-2xl font-semibold text-[#1F2421] sm:text-3xl">
                    {language === 'en' ? selectedProduct.name : selectedProduct.nameAm}
                  </h2>
                  <div className="mt-2 flex flex-wrap items-center gap-2.5">
                    <p className="text-xl font-bold text-[#1A332A] tabular-nums">
                      ETB {selectedProduct.price.toLocaleString('en-US')}
                    </p>
                    {selectedProduct.compareAtPrice && (
                      <span className="text-sm text-[#8B8E8B] line-through tabular-nums">
                        ETB {selectedProduct.compareAtPrice.toLocaleString('en-US')}
                      </span>
                    )}
                    {(() => {
                      const totalAvailable = (selectedProduct.variants ?? []).reduce(
                        (sum, v) => sum + v.stock,
                        0,
                      );
                      const inStock = selectedVariant
                        ? selectedVariant.stock > 0
                        : totalAvailable > 0;
                      return (
                        <span
                          className={`rounded-lg px-2 py-0.5 text-[11px] font-bold ${
                            inStock
                              ? 'bg-[#E7F3EC] text-[#1A5937]'
                              : 'bg-[#FDF2F2] text-[#942C2C]'
                          }`}
                        >
                          {inStock
                            ? language === 'en'
                              ? 'In Stock'
                              : 'በክምችት አለ'
                            : t.outOfStock}
                        </span>
                      );
                    })()}
                    {selectedProduct.soldCount ? (
                      <span className="ml-auto text-xs text-[#646B66] tabular-nums">
                        {selectedProduct.soldCount} {language === 'en' ? 'sold' : 'ተሽጧል'}
                      </span>
                    ) : null}
                  </div>

                  {/* Size selector + quick size guide button */}
                  <div className="mt-5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-[#4C524E]">{t.chooseSize}</span>
                      <button
                        type="button"
                        onClick={() => setDetailTab('size-guide')}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-[#C06C3E] hover:underline"
                      >
                        <Ruler className="h-3.5 w-3.5" />
                        <span>{language === 'en' ? 'Size Guide' : 'የመጠን ሰንጠረዥ'}</span>
                      </button>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {sizeOptions(selectedProduct).map((size) => (
                        <button
                          key={size}
                          type="button"
                          onClick={() => {
                            setSelectedSize(size);
                            setDetailError(null);
                            const availableColors = colorOptions(selectedProduct, size);
                            const nextColor = availableColors.includes(selectedColor ?? '')
                              ? selectedColor
                              : availableColors[0] ?? null;
                            setSelectedColor(nextColor);
                            if (nextColor) {
                              setSelectedImageIndex(
                                resolveImageIndexForColor(selectedProduct, nextColor),
                              );
                            }
                          }}
                          className={`min-h-[40px] min-w-[50px] rounded-xl border px-3.5 py-2 text-xs font-semibold transition-colors ${
                            selectedSize === size
                              ? 'border-[#1A332A] bg-[#1A332A] text-white'
                              : 'border-[#E1DBD0] bg-white text-[#1F2421] hover:border-[#1A332A]'
                          }`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Color selector with Hex Swatch & Photo Sync */}
                  <div className="mt-4">
                    <span className="block text-xs font-semibold text-[#4C524E]">{t.colors}</span>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {colorOptions(selectedProduct, selectedSize).map((color) => {
                        const hex =
                          selectedProduct.colorSwatches?.find(
                            (s) => s.name.toLowerCase() === color.toLowerCase(),
                          )?.hex ?? colorSwatchHex(color);
                        return (
                          <button
                            key={color}
                            type="button"
                            onClick={() => {
                              setSelectedColor(color);
                              setDetailError(null);
                              setZoomLevel(1);
                              setZoomOffset({ x: 0, y: 0 });
                              setSelectedImageIndex(
                                resolveImageIndexForColor(selectedProduct, color),
                              );
                            }}
                            className={`inline-flex min-h-[40px] items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-semibold transition-colors ${
                              selectedColor === color
                                ? 'border-[#1A332A] bg-[#1A332A] text-white'
                                : 'border-[#E1DBD0] bg-white text-[#1F2421] hover:border-[#1A332A]'
                            }`}
                          >
                            <span
                              className="h-3.5 w-3.5 rounded-full border border-black/15"
                              style={{ backgroundColor: hex }}
                            />
                            <span>{color}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Quantity + Stock line */}
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                    <div className="inline-flex items-center rounded-xl border border-[#E1DBD0] bg-white">
                      <button
                        type="button"
                        onClick={() => setDetailQty((q) => Math.max(1, q - 1))}
                        aria-label="Decrease detail quantity"
                        className="flex min-h-[38px] min-w-[38px] items-center justify-center"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="min-w-[28px] text-center text-xs font-bold tabular-nums">
                        {detailQty}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setDetailQty((q) =>
                            selectedVariant ? Math.min(selectedVariant.stock, q + 1) : q + 1,
                          )
                        }
                        aria-label="Increase detail quantity"
                        className="flex min-h-[38px] min-w-[38px] items-center justify-center"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <p className="text-xs font-semibold text-[#1A332A] tabular-nums">
                      {selectedVariant
                        ? selectedVariant.stock > 0
                          ? `${selectedVariant.stock} ${t.remaining}`
                          : t.outOfStock
                        : t.chooseVariant}
                    </p>
                  </div>

                  {/* Custom Fit / Tailoring Note */}
                  <div className="mt-4">
                    <label className="mb-1 block text-xs font-semibold text-[#4C524E]">
                      {t.customFitLabel}
                    </label>
                    <input
                      value={customFitNote}
                      onChange={(e) => setCustomFitNote(e.target.value)}
                      placeholder={t.customFitPlaceholder}
                      className="min-h-[40px] w-full rounded-xl border border-[#E1DBD0] bg-white px-3 text-xs text-[#1F2421] focus:border-[#1A332A] focus:outline-none"
                    />
                  </div>

                  {detailError && (
                    <p className="mt-2 rounded-lg bg-[#FDF2F2] px-3 py-2 text-xs font-medium text-[#942C2C]">
                      {detailError}
                    </p>
                  )}

                  {/* PDP Tabs: Overview & Care | Size Guide & Fit | Reviews */}
                  <div className="mt-5 flex gap-1 rounded-xl border border-[#E8E2D9] bg-white p-1">
                    {(
                      [
                        { id: 'overview', label: language === 'en' ? 'Specs & Care' : 'ዝርዝር' },
                        { id: 'size-guide', label: language === 'en' ? 'Size Guide' : 'የመጠን ሰንጠረዥ' },
                        {
                          id: 'reviews',
                          label: `${language === 'en' ? 'Reviews' : 'አስተያየት'} (${selectedProduct.reviewCount ?? 0})`,
                        },
                      ] as const
                    ).map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setDetailTab(tab.id)}
                        className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition-colors ${
                          detailTab === tab.id
                            ? 'bg-[#1A332A] text-white'
                            : 'text-[#5C625E] hover:text-[#1F2421]'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {detailTab === 'overview' && (
                    <div className="mt-3 rounded-xl border border-[#E8E2D9] bg-white p-3.5 text-xs leading-relaxed text-[#525A55] space-y-1.5">
                      <p className="font-semibold text-[#1F2421]">{t.sizeGuidanceTitle}</p>
                      <p>
                        {language === 'en'
                          ? selectedProduct.sizeGuidance
                          : selectedProduct.sizeGuidanceAm}
                      </p>
                      {selectedProduct.fabric && (
                        <p className="text-[#1A332A]">
                          <strong>{language === 'en' ? 'Fabric:' : 'ጨርቅ:'}</strong>{' '}
                          {selectedProduct.fabric}
                        </p>
                      )}
                      {selectedProduct.careInstructions && (
                        <p className="text-[#1A332A]">
                          <strong>{language === 'en' ? 'Care:' : 'አጠባበቅ:'}</strong>{' '}
                          {selectedProduct.careInstructions}
                        </p>
                      )}
                      {selectedProduct.measurements && (
                        <p className="text-[#4C524E]">{selectedProduct.measurements}</p>
                      )}
                      <p className="text-[#6D736E]">{t.photoHelp}</p>
                    </div>
                  )}

                  {detailTab === 'size-guide' && (
                    <div className="mt-3 rounded-xl border border-[#E8E2D9] bg-white p-3.5 text-xs space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-[#1F2421]">
                          {language === 'en' ? 'Community Fit Scale' : 'የልክ ግምገማ'}
                        </span>
                        <div className="inline-flex rounded-lg border border-[#E1DBD0] bg-[#FAF7F2] p-0.5 text-[11px] font-semibold">
                          <button
                            type="button"
                            onClick={() => setSizeUnit('cm')}
                            className={`rounded px-2 py-0.5 ${
                              sizeUnit === 'cm' ? 'bg-[#1A332A] text-white' : 'text-[#5C625E]'
                            }`}
                          >
                            CM
                          </button>
                          <button
                            type="button"
                            onClick={() => setSizeUnit('in')}
                            className={`rounded px-2 py-0.5 ${
                              sizeUnit === 'in' ? 'bg-[#1A332A] text-white' : 'text-[#5C625E]'
                            }`}
                          >
                            IN
                          </button>
                        </div>
                      </div>

                      {/* Fit Bar */}
                      <div className="space-y-1">
                        <div className="flex h-2 w-full overflow-hidden rounded-full bg-[#EFE9DE]">
                          <div style={{ width: `${fitStats.smallPct}%` }} className="bg-[#D6A954]" />
                          <div style={{ width: `${fitStats.truePct}%` }} className="bg-[#1A332A]" />
                          <div style={{ width: `${fitStats.largePct}%` }} className="bg-[#C06C3E]" />
                        </div>
                        <div className="flex justify-between text-[10px] text-[#646B66]">
                          <span>Small ({fitStats.smallPct}%)</span>
                          <span className="font-semibold text-[#1A332A]">
                            True to Size ({fitStats.truePct}%)
                          </span>
                          <span>Large ({fitStats.largePct}%)</span>
                        </div>
                      </div>

                      {selectedProduct.category.toLowerCase().includes('shoe') ? (
                        <table className="w-full text-left text-[11px]">
                          <thead>
                            <tr className="border-b border-[#E8E2D9] text-[#646B66]">
                              <th className="py-1">EU</th>
                              <th className="py-1">Foot ({sizeUnit})</th>
                              <th className="py-1">UK</th>
                              <th className="py-1">US</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#F1EDE6] tabular-nums">
                            {SIZE_GUIDE_CHARTS.shoes.map((row) => (
                              <tr key={row.eu}>
                                <td className="py-1 font-bold text-[#1A332A]">{row.eu}</td>
                                <td className="py-1">
                                  {sizeUnit === 'cm' ? row.cm : convertCmTextToInches(row.cm)}
                                </td>
                                <td className="py-1">{row.uk}</td>
                                <td className="py-1">{row.usW}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <table className="w-full text-left text-[11px]">
                          <thead>
                            <tr className="border-b border-[#E8E2D9] text-[#646B66]">
                              <th className="py-1">Size</th>
                              <th className="py-1">Chest ({sizeUnit})</th>
                              <th className="py-1">Waist ({sizeUnit})</th>
                              <th className="py-1">Length ({sizeUnit})</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#F1EDE6] tabular-nums">
                            {SIZE_GUIDE_CHARTS.apparel.map((row) => (
                              <tr key={row.size}>
                                <td className="py-1 font-bold text-[#1A332A]">{row.size}</td>
                                <td className="py-1">
                                  {sizeUnit === 'cm'
                                    ? row.chestCm
                                    : convertCmTextToInches(row.chestCm)}
                                </td>
                                <td className="py-1">
                                  {sizeUnit === 'cm'
                                    ? row.waistCm
                                    : convertCmTextToInches(row.waistCm)}
                                </td>
                                <td className="py-1">
                                  {sizeUnit === 'cm'
                                    ? row.lengthCm
                                    : convertCmTextToInches(row.lengthCm)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  )}

                  {detailTab === 'reviews' && (
                    <div className="mt-3 rounded-xl border border-[#E8E2D9] bg-white p-3.5 text-xs">
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-2">
                        <p className="font-semibold text-[#1F2421]">
                          {language === 'en' ? 'Verified Fit Reviews' : 'የደንበኞች አስተያየት'}
                        </p>
                        <div className="flex gap-1">
                          {(['all', 'runs-small', 'true-to-size', 'runs-large'] as const).map(
                            (tag) => (
                              <button
                                key={tag}
                                type="button"
                                onClick={() => setReviewFilterFit(tag)}
                                className={`rounded px-2 py-0.5 text-[10px] font-semibold ${
                                  reviewFilterFit === tag
                                    ? 'bg-[#1A332A] text-white'
                                    : 'bg-[#FAF7F2] text-[#646B66]'
                                }`}
                              >
                                {tag === 'all' ? 'All' : tag.replace(/-/g, ' ')}
                              </button>
                            ),
                          )}
                        </div>
                      </div>

                      {filteredProductReviews.length > 0 ? (
                        <ul className="space-y-2 border-b border-[#F1EDE6] pb-3">
                          {filteredProductReviews.slice(0, 4).map((rev) => (
                            <li key={rev.id}>
                              <div className="flex items-center justify-between">
                                <span className="font-semibold text-[#1F2421]">{rev.author}</span>
                                <span className="text-[11px] text-[#C06C3E]">
                                  ★ {rev.rating} · {rev.fit.replace(/-/g, ' ')}
                                </span>
                              </div>
                              <p className="mt-0.5 text-[#5C625E]">{rev.comment}</p>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="border-b border-[#F1EDE6] pb-2 text-[#646B66]">
                          {language === 'en' ? 'No reviews in this filter yet.' : 'ገና አስተያየት የለም።'}
                        </p>
                      )}

                      <form onSubmit={handleAddReview} className="mt-2.5 space-y-2">
                        <div className="grid grid-cols-3 gap-1.5">
                          <input
                            value={reviewAuthor}
                            onChange={(e) => setReviewAuthor(e.target.value)}
                            placeholder={language === 'en' ? 'Your name' : 'ስም'}
                            className="rounded-lg border border-[#E1DBD0] bg-[#FAF7F2] px-2.5 py-1.5 text-[11px]"
                          />
                          <select
                            value={reviewRating}
                            onChange={(e) => setReviewRating(Number(e.target.value))}
                            className="rounded-lg border border-[#E1DBD0] bg-[#FAF7F2] px-2 py-1.5 text-[11px]"
                          >
                            <option value={5}>★★★★★ (5)</option>
                            <option value={4}>★★★★ (4)</option>
                            <option value={3}>★★★ (3)</option>
                          </select>
                          <select
                            value={reviewFit}
                            onChange={(e) => setReviewFit(e.target.value as ProductReview['fit'])}
                            className="rounded-lg border border-[#E1DBD0] bg-[#FAF7F2] px-2 py-1.5 text-[11px]"
                          >
                            <option value="true-to-size">True to size</option>
                            <option value="runs-small">Runs small</option>
                            <option value="runs-large">Runs large</option>
                          </select>
                        </div>
                        <div className="flex gap-2">
                          <input
                            value={reviewComment}
                            onChange={(e) => setReviewComment(e.target.value)}
                            placeholder={
                              language === 'en'
                                ? 'Share fit or fabric feedback…'
                                : 'ስለ ልኩ ወይም ጨርቁ አስተያየት ይጻፉ…'
                            }
                            className="flex-1 rounded-lg border border-[#E1DBD0] bg-[#FAF7F2] px-2.5 py-1.5 text-[11px]"
                          />
                          <button
                            type="submit"
                            className="rounded-lg bg-[#1A332A] px-3 py-1.5 text-[11px] font-semibold text-white"
                          >
                            {language === 'en' ? 'Post' : 'ላክ'}
                          </button>
                        </div>
                      </form>
                    </div>
                  )}
                </div>

                {/* Actions: Wishlist, Add to Bag, Buy Now */}
                <div className="mt-6 flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => toggleFavorite(selectedProduct.id)}
                    aria-label="Toggle wishlist"
                    className="flex min-h-[48px] min-w-[48px] items-center justify-center rounded-xl border border-[#E1DBD0] bg-white text-[#1F2421]"
                  >
                    <Heart
                      className={`h-5 w-5 ${
                        favorites.includes(selectedProduct.id)
                          ? 'fill-[#C06C3E] text-[#C06C3E]'
                          : ''
                      }`}
                    />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (
                        addToCart(
                          selectedProduct,
                          selectedSize,
                          selectedColor,
                          detailQty,
                          customFitNote,
                        )
                      ) {
                        setSelectedProduct(null);
                        setShowBagDrawer(true);
                      }
                    }}
                    className="min-h-[48px] flex-1 rounded-xl border border-[#1A332A] bg-white px-4 py-3 text-xs font-semibold text-[#1A332A] transition-colors hover:bg-[#FAF7F2] sm:text-sm"
                  >
                    {t.addToCart}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (
                        addToCart(
                          selectedProduct,
                          selectedSize,
                          selectedColor,
                          detailQty,
                          customFitNote,
                        )
                      ) {
                        setSelectedProduct(null);
                        setOrderNotice(null);
                        setView('cart');
                      }
                    }}
                    className="min-h-[48px] flex-1 rounded-xl bg-[#C06C3E] px-4 py-3 text-xs font-semibold text-white transition-colors hover:bg-[#AE5D31] sm:text-sm"
                  >
                    {t.buyNow}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Order Confirmation / Tracking Receipt Modal */}
      {trackingOrder && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-xs"
          onClick={() => setTrackingOrder(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-3xl border border-[#E8E2D9] bg-[#FAF7F2] p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E7F3EC] text-[#1A332A]">
                  <Check className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-display text-xl font-bold text-[#1F2421]">
                    {trackingOrder.id}
                  </h3>
                  <p className="text-xs text-[#646B66]">
                    {orderStatusLabel(trackingOrder.status)}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setTrackingOrder(null)}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#DFD8CD] bg-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {renderOrderStepper(trackingOrder.status)}

            <div className="mt-4 space-y-2 rounded-2xl border border-[#E8E2D9] bg-white p-4 text-xs">
              <p className="font-semibold text-[#1F2421]">
                {trackingOrder.customerName} · {trackingOrder.customerPhone}
              </p>
              <p className="text-[#5C625E]">
                {trackingOrder.fulfillment === 'pickup'
                  ? t.pickup
                  : `${trackingOrder.deliveryProvider ? `${trackingOrder.deliveryProvider.toUpperCase()} · ` : ''}${trackingOrder.deliveryCity ? `${trackingOrder.deliveryCity}${trackingOrder.deliverySubcity ? ` (${trackingOrder.deliverySubcity})` : ''} · ` : ''}${trackingOrder.deliveryAddress}`}
              </p>
              {trackingOrder.paymentMethod && (
                <p className="text-[#1A332A]">
                  Payment: {trackingOrder.paymentMethod.toUpperCase()}
                  {trackingOrder.paymentReference ? ` (${trackingOrder.paymentReference})` : ''}
                </p>
              )}
              {trackingOrder.paymentProofImage && (
                <div className="pt-1">
                  <img
                    src={trackingOrder.paymentProofImage}
                    alt="Payment screenshot"
                    className="h-24 w-auto rounded-lg border border-[#E8E2D9] object-contain"
                  />
                </div>
              )}
              <div className="flex justify-between border-t border-[#F1EDE6] pt-2 text-sm font-bold text-[#1A332A] tabular-nums">
                <span>{t.total}</span>
                <span>ETB {trackingOrder.total.toLocaleString('en-US')}</span>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  setSupportOrderId(trackingOrder.id);
                  setSupportTopic(`Order ${trackingOrder.id} inquiry`);
                  setTrackingOrder(null);
                  setShowSupportModal(true);
                }}
                className="flex-1 min-h-[40px] rounded-xl border border-[#E4C9A8] bg-[#FDF6EB] px-3 text-xs font-semibold text-[#8A4D14]"
              >
                {language === 'en' ? 'Message Support' : 'ድጋፍ ጠይቅ'}
              </button>
              <button
                type="button"
                onClick={() => setTrackingOrder(null)}
                className="flex-1 min-h-[40px] rounded-xl bg-[#1A332A] text-xs font-semibold text-white"
              >
                {language === 'en' ? 'Done' : 'ጨርስ'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Camera & Visual Search Modal */}
      <CameraSearchModal
        open={showCameraSearch}
        language={language}
        products={publishedProducts}
        onClose={() => setShowCameraSearch(false)}
        onSelectProduct={openProductDetails}
        onApplyColorFilter={(colorName) => {
          setShowFilters(true);
          setColorFilter(colorName);
          setView('shop');
        }}
      />

      {/* Shein-Inspired Mobile Bottom Navigation Bar */}
      <nav
        aria-label="Customer mobile navigation"
        className="fixed right-0 bottom-0 left-0 z-30 grid h-16 grid-cols-5 border-t border-[#E8E2D9] bg-white/95 backdrop-blur-md shadow-[0_-4px_20px_rgba(0,0,0,0.05)] md:hidden"
      >
        <button
          type="button"
          onClick={() => {
            setView('shop');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`flex flex-col items-center justify-center gap-0.5 text-[10px] font-semibold transition-colors active:scale-95 ${
            view === 'shop' && !showFilters ? 'text-[#1A332A]' : 'text-[#7D8580]'
          }`}
        >
          <div className="relative">
            <Store className={`h-5 w-5 ${view === 'shop' && !showFilters ? 'text-[#C06C3E]' : ''}`} />
          </div>
          <span className={view === 'shop' && !showFilters ? 'font-bold text-[#1A332A]' : ''}>{t.shop}</span>
        </button>

        <button
          type="button"
          onClick={() => {
            if (view !== 'shop') setView('shop');
            setShowFilters(true);
          }}
          className={`flex flex-col items-center justify-center gap-0.5 text-[10px] font-semibold transition-colors active:scale-95 ${
            showFilters ? 'text-[#1A332A]' : 'text-[#7D8580]'
          }`}
        >
          <div className="relative">
            <SlidersHorizontal className={`h-5 w-5 ${showFilters ? 'text-[#C06C3E]' : ''}`} />
            {activeFilterCount > 0 && (
              <span className="absolute -top-1 -right-2 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#C06C3E] text-[8px] font-bold text-white">
                {activeFilterCount}
              </span>
            )}
          </div>
          <span className={showFilters ? 'font-bold text-[#1A332A]' : ''}>
            {language === 'en' ? 'Category' : 'ምድቦች'}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setShowFilters(false);
            setView('wishlist');
          }}
          className={`flex flex-col items-center justify-center gap-0.5 text-[10px] font-semibold transition-colors active:scale-95 ${
            view === 'wishlist' ? 'text-[#1A332A]' : 'text-[#7D8580]'
          }`}
        >
          <div className="relative">
            <Heart className={`h-5 w-5 ${view === 'wishlist' ? 'fill-[#C06C3E] text-[#C06C3E]' : ''}`} />
            {favorites.length > 0 && (
              <span className="absolute -top-1 -right-2.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#C06C3E] px-1 text-[9px] font-bold text-white shadow-xs">
                {favorites.length}
              </span>
            )}
          </div>
          <span className={view === 'wishlist' ? 'font-bold text-[#1A332A]' : ''}>{t.wishlist}</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setShowFilters(false);
            setOrderNotice(null);
            setView('cart');
          }}
          className={`flex flex-col items-center justify-center gap-0.5 text-[10px] font-semibold transition-colors active:scale-95 ${
            view === 'cart' ? 'text-[#1A332A]' : 'text-[#7D8580]'
          }`}
        >
          <div className="relative">
            <ShoppingBag className={`h-5 w-5 ${view === 'cart' ? 'text-[#C06C3E]' : ''}`} />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-2.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#E03A3A] px-1 text-[9px] font-bold text-white shadow-xs">
                {cartCount}
              </span>
            )}
          </div>
          <span className={view === 'cart' ? 'font-bold text-[#1A332A]' : ''}>{t.bag}</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setShowFilters(false);
            if (currentUser && isStaffUser) {
              setView(view === 'staff' ? 'shop' : 'staff');
            } else {
              setAuthError(null);
              setAuthMode('signin');
              setShowAuthModal(true);
            }
          }}
          className={`flex flex-col items-center justify-center gap-0.5 text-[10px] font-semibold transition-colors active:scale-95 ${
            view === 'staff' ? 'text-[#1A332A]' : 'text-[#7D8580]'
          }`}
        >
          <div className="relative">
            <User className={`h-5 w-5 ${view === 'staff' ? 'text-[#C06C3E]' : ''}`} />
            {currentUser && (
              <span className="absolute -top-0.5 -right-1 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-white" />
            )}
          </div>
          <span className="max-w-[56px] truncate">
            {currentUser ? currentUser.name.split(' ')[0] : language === 'en' ? 'Me' : 'መለያ'}
          </span>
        </button>
      </nav>

      {/* Expo App.tsx Download Modal */}
      {showExpoModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs"
          onClick={() => setShowExpoModal(false)}
        >
          <div
            className="w-full max-w-xl rounded-2xl border border-[#E6DFD3] bg-[#FAF7F2] p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="font-display text-xl font-bold text-[#1F2421]">
                  {downloadTab === 'expo'
                    ? 'Full-Featured Expo App.tsx'
                    : 'Account Migration & Full Setup Guide'}
                </h3>
                <p className="text-xs text-[#646B66]">
                  {downloadTab === 'expo'
                    ? 'Includes Categories, AI Upload/Color Detection, Camera Search, Comparison, Promos & Order Tracking.'
                    : 'Complete architecture, Termux setup, API setup, and copy-paste prompt for a new AI Studio account.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowExpoModal(false)}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#DFD8CD] bg-white text-[#1F2421]"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mb-3 flex gap-1.5 rounded-xl border border-[#E6DFD3] bg-white p-1">
              <button
                type="button"
                onClick={() => setDownloadTab('expo')}
                className={`flex-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                  downloadTab === 'expo'
                    ? 'bg-[#1A332A] text-white'
                    : 'text-[#5C625E] hover:text-[#1F2421]'
                }`}
              >
                Expo App.tsx
              </button>
              <button
                type="button"
                onClick={() => setDownloadTab('handoff')}
                className={`flex-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                  downloadTab === 'handoff'
                    ? 'bg-[#1A332A] text-white'
                    : 'text-[#5C625E] hover:text-[#1F2421]'
                }`}
              >
                New Account Handoff (.md)
              </button>
            </div>

            <div className="mb-3 rounded-xl border border-[#E4C9A8] bg-[#FDF6EB] p-3 text-[11px] text-[#6B4214]">
              {downloadTab === 'expo' ? (
                <>
                  Tap <strong>Download Expo Bundle (.zip)</strong> so Expo Go loads all 10 studio
                  photos locally from <code>assets/</code> without any sign-in cookies. In Termux
                  run: <code>unzip -o ...belika-expo-bundle*.zip</code> then{' '}
                  <code>npx expo start -c</code>.
                </>
              ) : (
                <>
                  Download the full project archive below (<code>server.ts</code>, <code>src/</code>,{' '}
                  <code>expo/</code>, <code>package.json</code>, <code>HANDOFF_SETUP.md</code>) or
                  use AI Studio&apos;s toolbar <strong>Download App (ZIP)</strong> /{' '}
                  <strong>Save to GitHub</strong>.
                </>
              )}
            </div>

            <div className="mb-4 flex flex-wrap gap-2.5">
              {downloadTab === 'expo' && (
                <button
                  type="button"
                  disabled={downloadingZip !== null}
                  onClick={() => void downloadZipFromApi('/api/export-expo.zip', 'belika-expo-bundle.zip')}
                  className="inline-flex min-h-[42px] items-center gap-2 rounded-xl bg-[#C06C3E] px-4 py-2 text-xs font-bold text-white hover:bg-[#AE5D31] disabled:opacity-60"
                >
                  <Download className="h-4 w-4" />
                  {downloadingZip === 'belika-expo-bundle.zip'
                    ? 'Preparing Expo Bundle...'
                    : 'Download Expo Bundle (.zip with all Photos)'}
                </button>
              )}
              <button
                type="button"
                disabled={downloadingZip !== null}
                onClick={() =>
                  void downloadZipFromApi('/api/export-project.zip', 'belika-online-store-full-project.zip')
                }
                className="inline-flex min-h-[42px] items-center gap-2 rounded-xl bg-[#D8B376] px-4 py-2 text-xs font-bold text-[#1F2421] hover:bg-[#cca362] disabled:opacity-60"
              >
                <Download className="h-4 w-4" />
                {downloadingZip === 'belika-online-store-full-project.zip'
                  ? 'Preparing Full Project...'
                  : 'Download Full Project (.zip)'}
              </button>
              <button
                type="button"
                onClick={() => {
                  const content = downloadTab === 'expo' ? expoAppSource : handoffGuideSource;
                  const filename = downloadTab === 'expo' ? 'App.tsx' : 'HANDOFF_SETUP.md';
                  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = filename;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  URL.revokeObjectURL(url);
                  setToast(`Downloaded ${filename}`);
                }}
                className="inline-flex min-h-[42px] items-center gap-2 rounded-xl bg-[#1A332A] px-4 py-2 text-xs font-semibold text-white"
              >
                <Download className="h-4 w-4" />
                {downloadTab === 'expo' ? 'Download App.tsx only' : 'Download HANDOFF_SETUP.md'}
              </button>
              <button
                type="button"
                onClick={async () => {
                  const content = downloadTab === 'expo' ? expoAppSource : handoffGuideSource;
                  try {
                    await navigator.clipboard.writeText(content);
                    setToast(
                      downloadTab === 'expo'
                        ? 'Copied Expo App.tsx to clipboard'
                        : 'Copied Handoff Guide to clipboard',
                    );
                  } catch {
                    setToast('Select and copy from the box below');
                  }
                }}
                className="inline-flex min-h-[42px] items-center gap-2 rounded-xl border border-[#DFD8CD] bg-white px-4 py-2 text-xs font-semibold text-[#1F2421]"
              >
                <Copy className="h-4 w-4" />
                {downloadTab === 'expo' ? 'Copy Full Code' : 'Copy Handoff Guide'}
              </button>
            </div>

            <textarea
              readOnly
              value={downloadTab === 'expo' ? expoAppSource : handoffGuideSource}
              onFocus={(e) => e.currentTarget.select()}
              className="h-52 w-full rounded-xl border border-[#DFD8CD] bg-white p-3 font-mono text-[11px] text-[#1F2421] focus:outline-none"
            />
          </div>
        </div>
      )}

      {/* Floating Comparison Bar */}
      {compareIds.length > 0 && (
        <div className="fixed bottom-20 left-1/2 z-40 -translate-x-1/2 flex items-center gap-4 rounded-2xl bg-[#1A332A] px-5 py-3 text-white shadow-2xl ring-1 ring-white/10 md:bottom-6">
          <div className="flex items-center gap-2 text-xs font-semibold tabular-nums">
            <span>⚖️ Comparing {compareIds.length}/2 products</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowCompareModal(true)}
              className="rounded-xl bg-[#C06C3E] px-4 py-2 text-xs font-bold text-white hover:bg-[#AE5D31]"
            >
              {t.compareNow}
            </button>
            <button
              type="button"
              onClick={() => setCompareIds([])}
              className="rounded-xl bg-white/10 px-3 py-2 text-xs font-semibold hover:bg-white/20"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Side-by-Side Comparison Modal */}
      {showCompareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="relative max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
            <div className="flex items-center justify-between border-b border-[#E8E2D9] pb-4">
              <div>
                <h2 className="font-display text-2xl font-bold text-[#1F2421]">{t.compareTitle}</h2>
                <p className="text-xs text-[#646B66] mt-0.5">{t.compareMax}</p>
              </div>
              <button
                type="button"
                onClick={() => setShowCompareModal(false)}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#DFD8CD] bg-white text-[#1F2421] hover:bg-[#FAF7F2]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {compareIds.length === 0 ? (
              <div className="py-12 text-center text-sm text-[#646B66]">
                {t.compareEmpty}
              </div>
            ) : (
              <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-6">
                {compareIds.map((id) => {
                  const product = products.find((p) => p.id === id);
                  if (!product) return null;
                  const totalStock = (product.variants ?? []).reduce((sum, v) => sum + v.stock, 0);
                  const swatches = product.colorSwatches ?? [];

                  return (
                    <div
                      key={product.id}
                      className="relative space-y-3 rounded-2xl border border-[#E8E2D9] bg-[#FAF7F2]/40 p-3 sm:p-5"
                    >
                      <button
                        type="button"
                        onClick={() => toggleCompare(product.id)}
                        className="absolute top-3 right-3 z-10 rounded-lg border border-[#E6C7C7] bg-white px-2 py-0.5 text-[10px] font-semibold text-[#942C2C] hover:bg-[#FDF4F4]"
                      >
                        ✕
                      </button>

                      <div className="aspect-[4/3] w-full overflow-hidden rounded-xl border border-[#E8E2D9] bg-white">
                        {product.images?.[0] ? (
                          <img
                            src={product.images[0]}
                            alt={product.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <Store className="h-8 w-8 text-[#8B7D6B]" />
                          </div>
                        )}
                      </div>

                      <div>
                        <span className="block truncate text-[10px] font-bold uppercase tracking-wider text-[#C06C3E]">
                          {departmentLabel(product.department)} · {product.category}
                        </span>
                        <h3 className="mt-1 line-clamp-2 font-display text-sm font-bold text-[#1F2421] sm:text-lg">
                          {language === 'en' ? product.name : product.nameAm}
                        </h3>
                      </div>

                      <div className="space-y-1.5 border-t border-[#E8E2D9] pt-2.5 text-[11px] sm:text-xs">
                        <div className="flex flex-wrap justify-between gap-1 border-b border-[#F1EDE6] py-1">
                          <span className="font-semibold text-[#646B66]">Price</span>
                          <span className="font-bold text-[#1A332A] tabular-nums">
                            ETB {product.price.toLocaleString('en-US')}
                          </span>
                        </div>

                        <div className="flex flex-wrap justify-between gap-1 border-b border-[#F1EDE6] py-1">
                          <span className="font-semibold text-[#646B66]">Fabric</span>
                          <span className="text-right font-medium text-[#1F2421]">
                            {product.fabric || 'Cotton Blend'}
                          </span>
                        </div>

                        <div className="flex flex-wrap justify-between gap-1 border-b border-[#F1EDE6] py-1">
                          <span className="font-semibold text-[#646B66]">Care</span>
                          <span className="text-right font-medium text-[#1F2421]">
                            {product.careInstructions || 'Gentle wash'}
                          </span>
                        </div>

                        <div className="flex flex-wrap justify-between gap-1 border-b border-[#F1EDE6] py-1">
                          <span className="font-semibold text-[#646B66]">Sizes</span>
                          <span className="font-medium text-[#1F2421]">{product.sizes}</span>
                        </div>

                        <div className="flex flex-wrap justify-between gap-1 border-b border-[#F1EDE6] py-1">
                          <span className="font-semibold text-[#646B66]">Rating</span>
                          <span className="font-medium text-[#1F2421] tabular-nums">
                            ★ {product.rating ?? 4.8} ({product.soldCount ?? 0})
                          </span>
                        </div>

                        <div className="flex flex-wrap justify-between gap-1 border-b border-[#F1EDE6] py-1">
                          <span className="font-semibold text-[#646B66]">Stock</span>
                          <span
                            className={`font-bold tabular-nums ${
                              totalStock > 0 ? 'text-[#1A5937]' : 'text-[#942C2C]'
                            }`}
                          >
                            {totalStock > 0 ? `${totalStock} pcs` : t.outOfStock}
                          </span>
                        </div>

                        <div className="py-1">
                          <span className="mb-1 block font-semibold text-[#646B66]">Colors</span>
                          <div className="flex flex-wrap gap-1">
                            {swatches.map((sw) => (
                              <span
                                key={sw.name}
                                className="inline-flex items-center gap-1 rounded-md border border-[#E8E2D9] bg-white px-1.5 py-0.5 text-[10px] font-medium"
                              >
                                <span
                                  className="h-2 w-2 rounded-full border border-black/20"
                                  style={{ backgroundColor: sw.hex }}
                                />
                                {sw.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setShowCompareModal(false);
                          openProductDetails(product);
                        }}
                        className="w-full rounded-xl bg-[#1A332A] py-2 text-xs font-semibold text-white hover:bg-[#234338]"
                      >
                        {t.viewDetails}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Role-Based Account Sign In / Customer Sign Up / Owner Setup Modal */}
      {showAuthModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-xs"
          onClick={() => setShowAuthModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-3xl border border-[#E8E2D9] bg-[#FAF7F2] p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <img
                  src={BELIKA_ORIGINAL_LOGO}
                  alt="Belika"
                  className="h-9 w-auto object-contain"
                />
                <div>
                  <h3 className="font-display text-lg font-bold text-[#1F2421]">
                    {currentUser
                      ? language === 'en'
                        ? 'Your Belika Account'
                        : 'የበሊካ መለያዎ'
                      : authMode === 'signup'
                        ? language === 'en'
                          ? 'Create Customer Account'
                          : 'የደንበኛ መለያ ይፍጠሩ'
                        : authMode === 'claim-owner'
                          ? language === 'en'
                            ? 'Setup Store Owner Account'
                            : 'የባለቤት መለያ አዘጋጅ'
                          : language === 'en'
                            ? 'Sign In'
                            : 'ወደ መለያ ይግቡ'}
                  </h3>
                  <p className="text-[11px] text-[#646B66]">
                    {language === 'en'
                      ? 'Customers & Belika Staff use the same sign-in'
                      : 'ደንበኞች እና የበሊካ ሰራተኞች በአንድ መለያ ይገባሉ'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAuthModal(false)}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#DFD8CD] bg-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {currentUser ? (
              <div className="mt-4 space-y-3 rounded-2xl border border-[#E8E2D9] bg-white p-4 text-xs">
                <p className="text-sm font-bold text-[#1F2421]">{currentUser.name}</p>
                <p className="text-[#5C625E]">{currentUser.identifier}</p>
                <p className="inline-block rounded-lg bg-[#EFF7F3] px-2.5 py-1 font-bold uppercase text-[#1A332A]">
                  Role: {currentUser.role === 'owner' ? 'Owner Admin' : currentUser.role}
                </p>
                <div className="flex flex-wrap gap-2 pt-2">
                  {isStaffUser && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowAuthModal(false);
                        setView('staff');
                      }}
                      className="flex-1 rounded-xl bg-[#1A332A] py-2.5 text-xs font-semibold text-white"
                    >
                      {t.staff}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setShowAuthModal(false);
                      void handleSignOut();
                    }}
                    className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-[#E6C7C7] bg-[#FDF4F4] py-2.5 text-xs font-semibold text-[#942C2C]"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    <span>{language === 'en' ? 'Sign Out' : 'ውጣ'}</span>
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleAuthSubmit} className="mt-4 space-y-3">
                <div className="flex gap-1.5 rounded-xl border border-[#E8E2D9] bg-white p-1">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('signin');
                      setAuthError(null);
                    }}
                    className={`flex-1 rounded-lg py-1.5 text-xs font-semibold ${
                      authMode === 'signin' ? 'bg-[#1A332A] text-white' : 'text-[#5C625E]'
                    }`}
                  >
                    {language === 'en' ? 'Sign In' : 'ግባ'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('signup');
                      setAuthError(null);
                    }}
                    className={`flex-1 rounded-lg py-1.5 text-xs font-semibold ${
                      authMode === 'signup' ? 'bg-[#1A332A] text-white' : 'text-[#5C625E]'
                    }`}
                  >
                    {language === 'en' ? 'Sign Up' : 'ተመዝገብ'}
                  </button>
                  {!authStatus.hasOwner && (
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('claim-owner');
                        setAuthError(null);
                      }}
                      className={`flex-1 rounded-lg py-1.5 text-xs font-semibold ${
                        authMode === 'claim-owner' ? 'bg-[#C06C3E] text-white' : 'text-[#C06C3E]'
                      }`}
                    >
                      Owner Setup
                    </button>
                  )}
                </div>

                {(authMode === 'signup' || authMode === 'claim-owner') && (
                  <input
                    value={authName}
                    onChange={(e) => setAuthName(e.target.value)}
                    placeholder={language === 'en' ? 'Full Name' : 'ሙሉ ስም'}
                    className="min-h-[42px] w-full rounded-xl border border-[#DFD8CD] bg-white px-3.5 text-sm"
                  />
                )}
                <input
                  value={authIdentifier}
                  onChange={(e) => setAuthIdentifier(e.target.value)}
                  placeholder={
                    language === 'en'
                      ? 'Phone number (09...) or Email'
                      : 'ስልክ ቁጥር (09...) ወይም ኢሜይል'
                  }
                  className="min-h-[42px] w-full rounded-xl border border-[#DFD8CD] bg-white px-3.5 text-sm"
                />
                <input
                  type="password"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  placeholder={language === 'en' ? 'Password / Merchant PIN' : 'የይለፍ ቃል / ፒን'}
                  className="min-h-[42px] w-full rounded-xl border border-[#DFD8CD] bg-white px-3.5 text-sm"
                />
                {authMode === 'claim-owner' && authStatus.passcodeRequired && (
                  <input
                    type="password"
                    value={authPasscode}
                    onChange={(e) => setAuthPasscode(e.target.value)}
                    placeholder="Admin setup passcode"
                    className="min-h-[42px] w-full rounded-xl border border-[#DFD8CD] bg-white px-3.5 text-sm"
                  />
                )}
                {authError && (
                  <p className="rounded-xl bg-[#FDF2F2] px-3 py-2 text-xs font-semibold text-[#942C2C]">
                    {authError}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={authLoading}
                  className="min-h-[44px] w-full rounded-xl bg-[#1A332A] text-sm font-semibold text-white hover:bg-[#234338] disabled:opacity-60"
                >
                  {authLoading
                    ? 'Please wait…'
                    : authMode === 'signup'
                      ? language === 'en'
                        ? 'Create Account'
                        : 'መለያ ፍጠር'
                      : authMode === 'claim-owner'
                        ? 'Activate Owner Admin'
                        : language === 'en'
                          ? 'Sign In'
                          : 'ግባ'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Direct Customer Support Modal */}
      {showSupportModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-xs"
          onClick={() => setShowSupportModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-3xl border border-[#E8E2D9] bg-[#FAF7F2] p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-display text-xl font-bold text-[#1F2421]">
                  {language === 'en' ? 'Belika Customer Support' : 'የበሊካ የደንበኛ ድጋፍ'}
                </h3>
                <p className="text-xs text-[#646B66]">
                  {language === 'en'
                    ? 'Payment screenshot questions, delivery updates, or sizing help'
                    : 'ስለ ክፍያ፣ ማድረስ ወይም መጠን እርዳታ'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowSupportModal(false)}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#DFD8CD] bg-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <a
                href={`tel:${activeBranchInfo.supportPhone}`}
                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#1A332A] py-2 text-xs font-semibold text-white"
              >
                <Phone className="h-3.5 w-3.5" />
                <span>{activeBranchInfo.supportPhone}</span>
              </a>
              <a
                href={activeBranchInfo.telegramSupport}
                target="_blank"
                rel="noreferrer"
                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-[#CFE0EE] bg-[#F2F7FB] py-2 text-xs font-semibold text-[#1B5E8A]"
              >
                <Send className="h-3.5 w-3.5" />
                <span>Telegram Support</span>
              </a>
            </div>

            <form onSubmit={handleSubmitSupport} className="mt-4 space-y-2.5">
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={supportDepartment}
                  onChange={(e) => setSupportDepartment(e.target.value as Department)}
                  className="min-h-[38px] rounded-xl border border-[#DFD8CD] bg-white px-3 text-xs font-semibold"
                >
                  <option value="Women">Belika Women</option>
                  <option value="Men">Belika Man</option>
                  <option value="Kids">Belika Kids</option>
                </select>
                <input
                  value={supportContact}
                  onChange={(e) => setSupportContact(e.target.value)}
                  placeholder="Your phone / Telegram @"
                  className="min-h-[38px] rounded-xl border border-[#DFD8CD] bg-white px-3 text-xs"
                />
              </div>
              <input
                value={supportTopic}
                onChange={(e) => setSupportTopic(e.target.value)}
                placeholder="Topic"
                className="min-h-[38px] w-full rounded-xl border border-[#DFD8CD] bg-white px-3 text-xs font-semibold"
              />
              <textarea
                rows={3}
                value={supportBody}
                onChange={(e) => setSupportBody(e.target.value)}
                placeholder={
                  language === 'en'
                    ? 'Write your message or describe your payment confirmation issue…'
                    : 'መልእክትዎን ወይም የክፍያ ጥያቄዎን ይጻፉ…'
                }
                className="w-full rounded-xl border border-[#DFD8CD] bg-white p-3 text-xs"
              />
              <button
                type="submit"
                disabled={supportSending}
                className="min-h-[42px] w-full rounded-xl bg-[#C06C3E] text-xs font-semibold text-white hover:bg-[#AE5D31]"
              >
                {supportSending
                  ? 'Sending…'
                  : language === 'en'
                    ? 'Send Message to Belika'
                    : 'መልእክት ላክ'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
