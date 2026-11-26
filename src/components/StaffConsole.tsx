import React, { useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  Building2,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Copy,
  FolderPlus,
  ImagePlus,
  KeyRound,
  Loader2,
  LogOut,
  MapPin,
  MessageSquare,
  Package,
  Pencil,
  Plus,
  Search,
  Shield,
  Sparkles,
  Tag,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import {
  AiGarmentAnalysis,
  AuthUser,
  BranchDepartment,
  BranchInfo,
  ColorSwatch,
  colorSwatchHex,
  COPY,
  Department,
  Language,
  OrderStatus,
  Product,
  ProductVariant,
  PromoCode,
  SIZE_PRESETS,
  StockMovement,
  StoreCategory,
  StoreOrder,
  SupportMessage,
  TelegramCandidate,
} from '../data/belikaCatalog';
import { fileToOptimizedDataUrl } from '../utils/imageHelper';

interface StaffConsoleProps {
  language: Language;
  currentUser: AuthUser;
  authToken: string | null;
  onSignOut: () => void;
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  categories: StoreCategory[];
  setCategories: React.Dispatch<React.SetStateAction<StoreCategory[]>>;
  promos: PromoCode[];
  setPromos: React.Dispatch<React.SetStateAction<PromoCode[]>>;
  branches: Record<BranchDepartment, BranchInfo>;
  onSaveBranches: (next: Record<BranchDepartment, BranchInfo>) => Promise<{ ok: boolean; error?: string }>;
  orders: StoreOrder[];
  supportMessages: SupportMessage[];
  onReplySupport: (id: string, reply: string, status: 'open' | 'resolved') => Promise<{ ok: boolean; error?: string }>;
  movements: StockMovement[];
  telegramCandidates: TelegramCandidate[];
  setTelegramCandidates: React.Dispatch<React.SetStateAction<TelegramCandidate[]>>;
  onUpdateOrderStatus: (orderId: string, nextStatus: OrderStatus) => { ok: boolean; message?: string };
  onAdjustStock: (
    productId: string,
    variantId: string,
    difference: number,
    kind: StockMovement['kind'],
  ) => { ok: boolean; message?: string };
  onBackToShop: () => void;
}

export function StaffConsole({
  language,
  currentUser,
  authToken,
  onSignOut,
  products,
  setProducts,
  categories,
  setCategories,
  promos,
  setPromos,
  branches,
  onSaveBranches,
  orders,
  supportMessages,
  onReplySupport,
  movements,
  onUpdateOrderStatus,
  onAdjustStock,
  onBackToShop,
}: StaffConsoleProps) {
  const t = COPY[language];
  const isOwner = currentUser.role === 'owner';
  const defaultBranch: Exclude<Department, 'All'> =
    currentUser.assignedBranch === 'Men' ||
    currentUser.assignedBranch === 'Women' ||
    currentUser.assignedBranch === 'Kids'
      ? currentUser.assignedBranch
      : 'Women';

  const draftSectionRef = useRef<HTMLDivElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const editPhotoInputRef = useRef<HTMLInputElement>(null);

  const [staffTab, setStaffTab] = useState<'inventory' | 'categories' | 'promos' | 'orders' | 'admin'>('inventory');
  const [feedback, setFeedback] = useState<{ type: 'info' | 'error'; text: string } | null>(null);
  const [expandedProducts, setExpandedProducts] = useState<Record<string, boolean>>({});
  const [expandedSizes, setExpandedSizes] = useState<Record<string, boolean>>({});
  const [addColorInputs, setAddColorInputs] = useState<Record<string, { color: string; stock: string }>>({});
  const [showAddSizeForProduct, setShowAddSizeForProduct] = useState<string | null>(null);
  const [newSizeName, setNewSizeName] = useState('');
  const [newSizeColor, setNewSizeColor] = useState('');
  const [newSizeStock, setNewSizeStock] = useState('1');

  // Stock filtering & search
  const [stockQuery, setStockQuery] = useState('');
  const [stockDeptFilter, setStockDeptFilter] = useState<Department>(
    currentUser.assignedBranch === 'All' ? 'All' : currentUser.assignedBranch,
  );
  const [lowStockOnly, setLowStockOnly] = useState(false);

  // Edit product modal state
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Upload New Item + AI Recognition State + Color->Size->Qty Matrix Builder
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([]);
  const [perImageColors, setPerImageColors] = useState<string[]>([]);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [batchAnalyzing, setBatchAnalyzing] = useState(false);
  const [aiNote, setAiNote] = useState('');
  const [newName, setNewName] = useState('');
  const [newNameAm, setNewNameAm] = useState('');
  const [newBrand, setNewBrand] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newComparePrice, setNewComparePrice] = useState('');
  const [newBadge, setNewBadge] = useState<NonNullable<Product['badge']> | ''>('New');
  const [newDepartment, setNewDepartment] = useState<Exclude<Department, 'All'>>(defaultBranch);
  const [newCategory, setNewCategory] = useState(
    categories.find((c) => c.department === defaultBranch)?.name ?? categories[0]?.name ?? 'Dresses & Kemis',
  );
  const [newSubcategory, setNewSubcategory] = useState('');
  // Color -> Size -> Qty Matrix
  const [variantMatrix, setVariantMatrix] = useState<Record<string, Record<string, number>>>({
    Black: { M: 4, L: 4 },
  });
  const [activeBuilderColor, setActiveBuilderColor] = useState<string>('Black');
  const [customColorInput, setCustomColorInput] = useState('');
  const [customSizeInput, setCustomSizeInput] = useState('');
  const [sizePresetGroup, setSizePresetGroup] = useState<'apparel' | 'shoes' | 'kidsApparel' | 'free'>('apparel');
  const [bulkQtyInput, setBulkQtyInput] = useState('4');

  const [detectedSwatches, setDetectedSwatches] = useState<ColorSwatch[]>([]);
  const [newFabric, setNewFabric] = useState('');
  const [newPattern, setNewPattern] = useState('');
  const [newCareInstructions, setNewCareInstructions] = useState('');
  const [newSizeGuidance, setNewSizeGuidance] = useState('');
  const [newSizeGuidanceAm, setNewSizeGuidanceAm] = useState('');
  const [newStyleTags, setNewStyleTags] = useState('');
  const [newCustomizable, setNewCustomizable] = useState(false);

  // Category Builder & Strict Department View
  const [catViewDept, setCatViewDept] = useState<BranchDepartment>(defaultBranch);
  const [catName, setCatName] = useState('');
  const [catNameAm, setCatNameAm] = useState('');
  const [catDepartment, setCatDepartment] = useState<BranchDepartment>(defaultBranch);
  const [catSubcategories, setCatSubcategories] = useState('');
  const [catAccent, setCatAccent] = useState('#1A332A');

  // Promo Manager State
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [promoType, setPromoType] = useState<'percent' | 'fixed'>('percent');
  const [promoValue, setPromoValue] = useState('10');
  const [promoMinSubtotal, setPromoMinSubtotal] = useState('1500');
  const [promoLabel, setPromoLabel] = useState('');

  // Support reply draft per support message id
  const [supportReplies, setSupportReplies] = useState<Record<string, string>>({});

  // Owner Admin: Staff Management + Branch Editor
  const [staffAccounts, setStaffAccounts] = useState<AuthUser[]>([]);
  const [staffLoading, setStaffLoading] = useState(false);
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffIdentifier, setNewStaffIdentifier] = useState('');
  const [newStaffPin, setNewStaffPin] = useState('');
  const [newStaffBranch, setNewStaffBranch] = useState<Department>('Women');
  const [editingBranchTab, setEditingBranchTab] = useState<BranchDepartment>('Women');
  const [branchDrafts, setBranchDrafts] = useState<Record<BranchDepartment, BranchInfo>>(branches);
  const [savingBranches, setSavingBranches] = useState(false);

  // Sync branch drafts when branches prop updates
  React.useEffect(() => {
    setBranchDrafts(branches);
  }, [branches]);

  const loadStaffAccounts = React.useCallback(async () => {
    if (!isOwner || !authToken) return;
    setStaffLoading(true);
    try {
      const res = await fetch('/api/admin/staff', {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data?.staff)) {
          setStaffAccounts(data.staff);
        }
      }
    } catch {
      // Ignore offline error
    } finally {
      setStaffLoading(false);
    }
  }, [isOwner, authToken]);

  React.useEffect(() => {
    if (staffTab === 'admin' && isOwner) {
      void loadStaffAccounts();
    }
  }, [staffTab, isOwner, loadStaffAccounts]);

  // Analytics KPIs
  const kpis = useMemo(() => {
    const activeOrdersRevenue = orders
      .filter((o) => o.status !== 'cancelled')
      .reduce((sum, o) => sum + o.total, 0);
    const pendingOrdersCount = orders.filter(
      (o) => o.status === 'requested' || o.status === 'confirmed' || o.status === 'out-for-delivery',
    ).length;
    const lowStockVariants = products.reduce((count, p) => {
      return count + (p.variants ?? []).filter((v) => v.stock <= 2).length;
    }, 0);
    const publishedCount = products.filter((p) => p.status !== 'draft').length;
    return { activeOrdersRevenue, pendingOrdersCount, lowStockVariants, publishedCount };
  }, [orders, products]);

  const filteredStockProducts = useMemo(() => {
    const q = stockQuery.trim().toLowerCase();
    return products.filter((p) => {
      const matchesDept = stockDeptFilter === 'All' || p.department === stockDeptFilter;
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.nameAm.toLowerCase().includes(q) ||
        (p.brand ?? '').toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q);
      const hasLowStock = (p.variants ?? []).some((v) => v.stock <= 2);
      return matchesDept && matchesSearch && (!lowStockOnly || hasLowStock);
    });
  }, [products, stockQuery, stockDeptFilter, lowStockOnly]);

  const strictDepartmentCategories = useMemo(
    () => categories.filter((cat) => cat.department === catViewDept),
    [categories, catViewDept],
  );

  const uploadDepartmentCategories = useMemo(
    () => categories.filter((cat) => cat.department === newDepartment || cat.department === 'All'),
    [categories, newDepartment],
  );

  const departmentLabel = (item: Exclude<Department, 'All'>) => {
    if (language === 'en') return item;
    return { Men: t.men, Women: t.women, Kids: t.kids }[item];
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []).slice(0, 8 - uploadedPhotos.length);
    if (!files.length) return;
    try {
      const converted = await Promise.all(files.map((file) => fileToOptimizedDataUrl(file, 900, 0.78)));
      const nextPhotos = [...uploadedPhotos, ...converted].slice(0, 8);
      setUploadedPhotos(nextPhotos);
      setFeedback(null);
      void handleAnalyzeWithAi(nextPhotos);
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to process selected image.',
      });
    } finally {
      event.target.value = '';
    }
  };

  const handleEditPhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!editingProduct) return;
    const current = editingProduct.images ?? [];
    const files = Array.from(event.target.files ?? []).slice(0, 8 - current.length);
    if (!files.length) return;
    try {
      const converted = await Promise.all(files.map((file) => fileToOptimizedDataUrl(file, 900, 0.78)));
      setEditingProduct({
        ...editingProduct,
        images: [...current, ...converted].slice(0, 8),
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to process image.',
      });
    } finally {
      event.target.value = '';
    }
  };

  const handleAnalyzeWithAi = async (overridePhotos?: string[]) => {
    const targetPhotos = overridePhotos ?? uploadedPhotos;
    if (targetPhotos.length === 0) {
      setFeedback({
        type: 'error',
        text:
          language === 'en'
            ? 'Upload at least one garment photo first.'
            : 'መጀመሪያ ቢያንስ አንድ የልብስ ፎቶ ይጫኑ።',
      });
      return;
    }

    setAiAnalyzing(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/ai/analyze-garment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          images: targetPhotos,
          note: aiNote,
          existingCategories: categories.map((c) => c.name),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || 'AI garment analysis failed.');
      }

      const analysis = data as AiGarmentAnalysis;
      setNewName(analysis.name || '');
      setNewNameAm(analysis.nameAm || '');
      setNewBrand(analysis.brand || '');
      if (analysis.department === 'Men' || analysis.department === 'Women' || analysis.department === 'Kids') {
        setNewDepartment(analysis.department);
      }
      if (analysis.category) {
        const matchedCat = categories.find(
          (c) => c.name.toLowerCase() === analysis.category.toLowerCase(),
        );
        if (matchedCat) {
          setNewCategory(matchedCat.name);
        } else {
          const createdCat: StoreCategory = {
            id: `cat-${Date.now()}`,
            name: analysis.category,
            nameAm: analysis.category,
            department: analysis.department || 'All',
            subcategories: analysis.subcategory ? [analysis.subcategory] : [],
            accentColor: '#1A332A',
            isCustom: true,
          };
          setCategories((prev) => [...prev, createdCat]);
          setNewCategory(analysis.category);
        }
      }
      setNewSubcategory(analysis.subcategory || '');
      if (analysis.colors?.length) {
        setDetectedSwatches(analysis.colors);
        const firstColor = analysis.colors[0].name;
        const nextMatrix: Record<string, Record<string, number>> = {};
        const defaultQty = Math.max(1, Number.parseInt(bulkQtyInput, 10) || 4);
        const defaultSizes = analysis.category?.toLowerCase().includes('shoe')
          ? ['38', '39', '40']
          : analysis.department === 'Kids'
            ? ['6Y', '8Y']
            : ['M', 'L'];
        analysis.colors.forEach((c) => {
          nextMatrix[c.name] = {};
          defaultSizes.forEach((sz) => {
            nextMatrix[c.name][sz] = defaultQty;
          });
        });
        setVariantMatrix(nextMatrix);
        setActiveBuilderColor(firstColor);
        if (analysis.category?.toLowerCase().includes('shoe')) {
          setSizePresetGroup('shoes');
        } else if (analysis.department === 'Kids') {
          setSizePresetGroup('kidsApparel');
        } else {
          setSizePresetGroup('apparel');
        }
      }
      if (Array.isArray(analysis.perImageColors) && analysis.perImageColors.length) {
        setPerImageColors(analysis.perImageColors);
      } else {
        setPerImageColors([]);
      }
      setNewFabric(analysis.fabric || '');
      setNewPattern(analysis.pattern || '');
      setNewSizeGuidance(analysis.sizeGuidance || '');
      setNewSizeGuidanceAm(analysis.sizeGuidanceAm || '');
      setNewStyleTags((analysis.styleTags ?? []).join(', '));
      setNewCustomizable(Boolean(analysis.customizable));

      setFeedback({
        type: 'info',
        text:
          language === 'en'
            ? `AI identified "${analysis.name}" (${analysis.brand || 'Boutique'}) · Material: ${analysis.fabric}. Now enter Price and select Color → Size → Quantity below.`
            : `AI "${analysis.nameAm}" (${analysis.brand || ''}) እና ${analysis.fabric} ለይቷል። አሁን ዋጋ እና በቀለም መጠን/ብዛት ይምረጡ።`,
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'AI analysis error.',
      });
    } finally {
      setAiAnalyzing(false);
    }
  };

  const handleBatchCreateSeparateProducts = async () => {
    if (uploadedPhotos.length < 2) return;
    setBatchAnalyzing(true);
    setFeedback(null);
    let createdCount = 0;

    try {
      const createdProducts: Product[] = [];
      for (let i = 0; i < uploadedPhotos.length; i += 1) {
        const photo = uploadedPhotos[i];
        const res = await fetch('/api/ai/analyze-garment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            images: [photo],
            note: aiNote,
            existingCategories: categories.map((c) => c.name),
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data?.error || `Failed on photo #${i + 1}`);
        }
        const analysis = data as AiGarmentAnalysis;
        const sizeList = analysis.recommendedSizes?.length
          ? analysis.recommendedSizes
          : ['M', 'L', 'XL'];
        const colorList = analysis.colors?.length
          ? analysis.colors.map((c) => c.name)
          : ['Classic'];
        const id = `item-${Date.now()}-${i}`;
        const stockNum = Math.max(1, Number.parseInt(bulkQtyInput, 10) || 4);
        const variants = sizeList.flatMap((size, sIdx) =>
          colorList.map((color, cIdx) => ({
            id: `${id}-v${sIdx}-${cIdx}`,
            size,
            color,
            stock: stockNum,
          })),
        );
        createdProducts.push({
          id,
          department: analysis.department || 'Women',
          category: analysis.category || 'Apparel',
          subcategory: analysis.subcategory || undefined,
          name: analysis.name || `Item ${i + 1}`,
          nameAm: analysis.nameAm || analysis.name || `እቃ ${i + 1}`,
          brand: analysis.brand || undefined,
          price: analysis.suggestedPriceEtb > 0 ? analysis.suggestedPriceEtb : 2500,
          badge: 'New',
          sizes: sizeList.length > 1 ? `${sizeList[0]}–${sizeList[sizeList.length - 1]}` : sizeList[0],
          sizeGuidance: analysis.sizeGuidance || 'Verify measurements with Belika staff.',
          sizeGuidanceAm: analysis.sizeGuidanceAm || 'ልኩን ከቤሊካ ሰራተኞች ጋር ያረጋግጡ።',
          fabric: analysis.fabric || undefined,
          pattern: analysis.pattern || undefined,
          styleTags: analysis.styleTags ?? [],
          colorSwatches: analysis.colors ?? [],
          customizable: Boolean(analysis.customizable),
          rating: 5.0,
          reviewCount: 0,
          tint: analysis.colors?.[0]?.hex ? `${analysis.colors[0].hex}22` : '#EFEAE1',
          images: [photo],
          imageLabels: [analysis.perImageColors?.[0] || colorList[0]],
          variants,
          status: 'published',
          isSample: false,
          createdAt: new Date().toISOString(),
        });
        createdCount += 1;
      }

      if (createdProducts.length > 0) {
        setProducts((current) => [...createdProducts.reverse(), ...current]);
        setUploadedPhotos([]);
        setPerImageColors([]);
        setDetectedSwatches([]);
        setFeedback({
          type: 'info',
          text:
            language === 'en'
              ? `Batch AI created & published ${createdCount} separate products from your selected photos.`
              : `AI ${createdCount} የተለያዩ ምርቶችን ፈጥሮ አትሟል።`,
        });
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Batch AI import error.',
      });
    } finally {
      setBatchAnalyzing(false);
    }
  };

  const handleAddBuilderColor = (colorRaw: string) => {
    const clean = colorRaw.trim();
    if (!clean) return;
    setVariantMatrix((prev) => {
      if (prev[clean]) return prev;
      const defaultQty = Math.max(1, Number.parseInt(bulkQtyInput, 10) || 4);
      const starterSize = sizePresetGroup === 'shoes' ? '38' : sizePresetGroup === 'free' ? 'Free size' : 'M';
      return { ...prev, [clean]: { [starterSize]: defaultQty } };
    });
    setActiveBuilderColor(clean);
    setCustomColorInput('');
  };

  const handleToggleBuilderSize = (color: string, size: string) => {
    const defaultQty = Math.max(1, Number.parseInt(bulkQtyInput, 10) || 4);
    setVariantMatrix((prev) => {
      const colorMap = { ...(prev[color] || {}) };
      if (colorMap[size] !== undefined) {
        delete colorMap[size];
      } else {
        colorMap[size] = defaultQty;
      }
      return { ...prev, [color]: colorMap };
    });
  };

  const handleSetBuilderQty = (color: string, size: string, qty: number) => {
    setVariantMatrix((prev) => ({
      ...prev,
      [color]: {
        ...(prev[color] || {}),
        [size]: Math.max(0, qty),
      },
    }));
  };

  const handleSaveProduct = (publishImmediately: boolean) => {
    const price = Number(newPrice);
    const compareAt = newComparePrice.trim() ? Number(newComparePrice) : undefined;
    const id = `item-${Date.now()}`;

    const builtVariants: ProductVariant[] = [];
    const colorList: string[] = [];
    const uniqueSizes: string[] = [];

    Object.entries(variantMatrix).forEach(([colorName, sizeMap], cIdx) => {
      const entries = Object.entries(sizeMap).filter(([, qty]) => publishImmediately ? qty >= 0 : true);
      if (entries.length > 0 && !colorList.includes(colorName)) {
        colorList.push(colorName);
      }
      entries.forEach(([sz, qty], sIdx) => {
        if (!uniqueSizes.includes(sz)) uniqueSizes.push(sz);
        builtVariants.push({
          id: `${id}-v${cIdx}-${sIdx}`,
          size: sz,
          color: colorName,
          stock: publishImmediately ? Math.max(1, qty) : Math.max(0, qty),
        });
      });
    });

    if (
      !newName.trim() ||
      !Number.isFinite(price) ||
      price <= 0 ||
      builtVariants.length === 0
    ) {
      setFeedback({ type: 'error', text: t.productFieldsRequired });
      return;
    }

    const swatches: ColorSwatch[] = colorList.map((colorName) => {
      const matched = detectedSwatches.find(
        (s) => s.name.toLowerCase() === colorName.toLowerCase(),
      );
      return (
        matched ?? {
          name: colorName,
          hex: colorSwatchHex(colorName),
        }
      );
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
      compareAtPrice: compareAt && compareAt > price ? compareAt : undefined,
      badge: newBadge || (publishImmediately ? 'New' : undefined),
      sizes: uniqueSizes.length > 1 ? `${uniqueSizes[0]}–${uniqueSizes[uniqueSizes.length - 1]}` : uniqueSizes[0],
      sizeGuidance:
        newSizeGuidance.trim() || 'Verify measurements with Belika staff before confirming.',
      sizeGuidanceAm:
        newSizeGuidanceAm.trim() || 'ልኩን ከቤሊካ ሰራተኞች ጋር ያረጋግጡ።',
      fabric: newFabric.trim() || undefined,
      pattern: newPattern.trim() || undefined,
      careInstructions: newCareInstructions.trim() || undefined,
      soldCount: 0,
      styleTags: newStyleTags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
      colorSwatches: swatches,
      customizable: newCustomizable,
      rating: 5.0,
      reviewCount: 0,
      tint: swatches[0]?.hex ? `${swatches[0].hex}22` : '#EFEAE1',
      images: uploadedPhotos.length > 0 ? uploadedPhotos : undefined,
      imageLabels:
        perImageColors.length === uploadedPhotos.length && perImageColors.length > 0
          ? perImageColors
          : colorList,
      variants: builtVariants,
      status: publishImmediately ? 'published' : 'draft',
      isSample: false,
      createdAt: new Date().toISOString(),
    };

    setProducts((current) => [product, ...current]);
    setUploadedPhotos([]);
    setPerImageColors([]);
    setDetectedSwatches([]);
    setAiNote('');
    setNewName('');
    setNewNameAm('');
    setNewBrand('');
    setNewPrice('');
    setNewComparePrice('');
    setNewSubcategory('');
    setVariantMatrix({ Black: { M: 4, L: 4 } });
    setActiveBuilderColor('Black');
    setNewFabric('');
    setNewPattern('');
    setNewCareInstructions('');
    setNewSizeGuidance('');
    setNewSizeGuidanceAm('');
    setNewStyleTags('');
    setNewCustomizable(false);

    setFeedback({
      type: 'info',
      text: publishImmediately
        ? language === 'en'
          ? `"${product.name}" is now live in the Belika Shop catalog.`
          : `"${product.nameAm}" በመደብሩ ውስጥ ታትሟል።`
        : language === 'en'
          ? `Draft "${product.name}" saved.`
          : `ረቂቅ "${product.nameAm}" ተቀምጧል።`,
    });
  };

  const handleSaveEditedProduct = (event: React.FormEvent) => {
    event.preventDefault();
    if (!editingProduct) return;
    if (!editingProduct.name.trim() || !Number.isFinite(editingProduct.price) || editingProduct.price <= 0) {
      setFeedback({ type: 'error', text: t.productFieldsRequired });
      return;
    }
    const cleanCompare =
      editingProduct.compareAtPrice && editingProduct.compareAtPrice > editingProduct.price
        ? editingProduct.compareAtPrice
        : undefined;
    setProducts((prev) =>
      prev.map((p) =>
        p.id === editingProduct.id
          ? {
              ...editingProduct,
              compareAtPrice: cleanCompare,
            }
          : p,
      ),
    );
    setFeedback({
      type: 'info',
      text:
        language === 'en'
          ? `Updated "${editingProduct.name}" details & pricing.`
          : `የ"${editingProduct.nameAm}" መረጃ ተዘምኗል።`,
    });
    setEditingProduct(null);
  };

  const handleAddCategory = (event: React.FormEvent) => {
    event.preventDefault();
    if (!catName.trim()) {
      setFeedback({
        type: 'error',
        text: language === 'en' ? 'Enter a category name.' : 'የምድብ ስም ያስገቡ።',
      });
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
      accentColor: catAccent,
      isCustom: true,
    };
    setCategories((prev) => [...prev, created]);
    setNewCategory(created.name);
    setCatName('');
    setCatNameAm('');
    setCatSubcategories('');
    setFeedback({
      type: 'info',
      text:
        language === 'en'
          ? `Category "${created.name}" added to storefront navigation.`
          : `"${created.nameAm}" ምድብ ወደ መደብሩ ተጨምሯል።`,
    });
  };

  const handleAddPromo = (event: React.FormEvent) => {
    event.preventDefault();
    const cleanCode = promoCodeInput.trim().toUpperCase().replace(/\s+/g, '');
    const numericValue = Number(promoValue);
    const minSub = Number(promoMinSubtotal) || 0;
    if (!cleanCode || !Number.isFinite(numericValue) || numericValue <= 0) {
      setFeedback({
        type: 'error',
        text:
          language === 'en'
            ? 'Enter a valid promo code and positive discount value.'
            : 'ትክክለኛ የቅናሽ ኮድ እና ዋጋ ያስገቡ።',
      });
      return;
    }
    const nextPromo: PromoCode = {
      code: cleanCode,
      type: promoType,
      value: numericValue,
      minSubtotal: minSub > 0 ? minSub : undefined,
      label:
        promoLabel.trim() ||
        (promoType === 'percent'
          ? `${numericValue}% off${minSub ? ` over ETB ${minSub.toLocaleString('en-US')}` : ''}`
          : `ETB ${numericValue} off${minSub ? ` over ETB ${minSub.toLocaleString('en-US')}` : ''}`),
      labelAm: promoLabel.trim() || `${cleanCode} ቅናሽ`,
      active: true,
    };
    setPromos((prev) => [nextPromo, ...prev.filter((p) => p.code !== cleanCode)]);
    setPromoCodeInput('');
    setPromoLabel('');
    setFeedback({
      type: 'info',
      text:
        language === 'en'
          ? `Promo code "${cleanCode}" saved and active.`
          : `የቅናሽ ኮድ "${cleanCode}" ገብቷል።`,
    });
  };

  const handleCopyOrderSummary = async (order: StoreOrder) => {
    const lines = order.items
      .map((line) => {
        const prod = products.find((p) => p.id === line.productId);
        return `• ${prod?.name ?? line.productId} (${line.size} / ${line.color}) × ${line.quantity}${line.customNote ? ` [${line.customNote}]` : ''}`;
      })
      .join('\n');
    const summary = [
      `BELIKA ORDER ${order.id} (${order.status.toUpperCase()})`,
      `Customer: ${order.customerName} (${order.customerPhone})`,
      `Receiving: ${order.fulfillment === 'pickup' ? 'Shop Pickup (Bole)' : `Delivery: ${order.deliveryAddress ?? ''}`}`,
      order.paymentMethod ? `Payment: ${order.paymentMethod.toUpperCase()}${order.paymentReference ? ` · Ref: ${order.paymentReference}` : ''}` : null,
      lines,
      order.promoCode ? `Promo: ${order.promoCode} (-ETB ${order.discountAmount ?? 0})` : null,
      `Total: ETB ${order.total.toLocaleString('en-US')}`,
    ]
      .filter(Boolean)
      .join('\n');
    try {
      await navigator.clipboard.writeText(summary);
      setFeedback({
        type: 'info',
        text:
          language === 'en'
            ? `Copied ${order.id} dispatch summary for WhatsApp / Telegram.`
            : `የ${order.id} ትዕዛዝ ማጠቃለያ ተቀድቷል።`,
      });
    } catch {
      setFeedback({ type: 'error', text: 'Clipboard unavailable in this browser.' });
    }
  };

  const handleAddColorToSize = (productId: string, sizeName: string) => {
    const key = `${productId}::${sizeName}`;
    const input = addColorInputs[key];
    const colorName = input?.color?.trim();
    if (!colorName) {
      setFeedback({
        type: 'error',
        text: language === 'en' ? 'Please enter or select a color name.' : 'እባክዎ የቀለም ስም ያስገቡ ወይም ይምረጡ።',
      });
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

    setAddColorInputs((prev) => ({
      ...prev,
      [key]: { color: '', stock: '1' },
    }));

    setFeedback({
      type: 'info',
      text:
        language === 'en'
          ? `Added color "${colorName}" (${stockNum} in stock) to Size ${sizeName}.`
          : `ቀለም "${colorName}" (${stockNum} በክምችት) ወደ መጠን ${sizeName} ተጨምሯል።`,
    });
  };

  const handleRemoveVariant = (
    productId: string,
    variantId: string,
    sizeName: string,
    colorName: string,
  ) => {
    setProducts((prev) =>
      prev.map((prod) => {
        if (prod.id !== productId) return prod;
        return {
          ...prod,
          variants: (prod.variants || []).filter((v) => v.id !== variantId),
        };
      }),
    );
    setFeedback({
      type: 'info',
      text:
        language === 'en'
          ? `Removed variant Size ${sizeName} - Color ${colorName}.`
          : `መጠን ${sizeName} - ቀለም ${colorName} ተወግዷል።`,
    });
  };

  const handleAddSizeToProduct = (productId: string) => {
    const size = newSizeName.trim();
    if (!size) {
      setFeedback({
        type: 'error',
        text:
          language === 'en'
            ? 'Please enter a size name (e.g. S, M, XL, 38).'
            : 'እባክዎ የመጠን ስም ያስገቡ (ለምሳሌ S, M, XL, 38)።',
      });
      return;
    }
    const color = newSizeColor.trim() || 'Standard';
    const stock = Math.max(0, parseInt(newSizeStock || '1', 10) || 0);

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

    setExpandedSizes((prev) => ({
      ...prev,
      [`${productId}::${size}`]: true,
    }));

    setNewSizeName('');
    setNewSizeColor('');
    setNewSizeStock('1');
    setShowAddSizeForProduct(null);

    setFeedback({
      type: 'info',
      text:
        language === 'en'
          ? `Added Size "${size}" with color "${color}" (${stock} in stock).`
          : `መጠን "${size}" ከቀለም "${color}" ጋር (${stock} በክምችት) ተጨምሯል።`,
    });
  };

  const orderStatusBadgeText = (status: OrderStatus) => {
    if (status === 'requested') return t.requested;
    if (status === 'confirmed') return t.confirmed;
    if (status === 'out-for-delivery') return t.outForDelivery;
    if (status === 'completed') return t.completed;
    return t.cancelled;
  };

  const handleCreateOrUpdateStaff = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!authToken) {
      setFeedback({ type: 'error', text: 'Owner session token required.' });
      return;
    }
    try {
      const res = await fetch('/api/admin/staff', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          name: newStaffName,
          identifier: newStaffIdentifier,
          pin: newStaffPin,
          assignedBranch: newStaffBranch,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Could not save staff account.');
      setNewStaffName('');
      setNewStaffIdentifier('');
      setNewStaffPin('');
      await loadStaffAccounts();
      setFeedback({
        type: 'info',
        text: `Merchant account "${data.staff.name}" (${data.staff.assignedBranch}) saved.`,
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to save merchant account.',
      });
    }
  };

  const handleToggleStaffActive = async (staff: AuthUser) => {
    if (!authToken) return;
    try {
      const res = await fetch(`/api/admin/staff/${staff.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ active: !staff.active }),
      });
      if (res.ok) {
        await loadStaffAccounts();
      }
    } catch {
      // ignore
    }
  };

  const handleDeleteStaff = async (staff: AuthUser) => {
    if (!authToken) return;
    try {
      const res = await fetch(`/api/admin/staff/${staff.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) {
        await loadStaffAccounts();
        setFeedback({ type: 'info', text: `Removed staff account ${staff.name}.` });
      }
    } catch {
      // ignore
    }
  };

  const handleCommitBranches = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingBranches(true);
    const res = await onSaveBranches(branchDrafts);
    setSavingBranches(false);
    if (res.ok) {
      setFeedback({
        type: 'info',
        text:
          language === 'en'
            ? `Saved updated Belika ${editingBranchTab} address, phones, Telegram & TikTok links.`
            : `የቤሊካ ${editingBranchTab} አድራሻ እና ቻናሎች ተዘምነዋል።`,
      });
    } else {
      setFeedback({ type: 'error', text: res.error || 'Could not save branch settings.' });
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Header + Separated Tabs */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4 border-b border-[#E8E2D9] pb-5">
        <div>
          <div className="flex flex-wrap items-center gap-3 mb-2">
            <button
              type="button"
              onClick={onBackToShop}
              className="inline-flex min-h-[38px] items-center gap-1.5 text-sm font-medium text-[#1A332A] hover:text-[#C06C3E]"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>{t.backToShop}</span>
            </button>
            <span className="rounded-lg bg-[#EFF7F3] px-2.5 py-1 text-[11px] font-bold text-[#1A332A]">
              {isOwner ? 'Owner Admin' : 'Merchant Staff'} · {currentUser.name} ({currentUser.assignedBranch})
            </span>
            <button
              type="button"
              onClick={onSignOut}
              className="inline-flex items-center gap-1 rounded-lg border border-[#E1DBD0] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#942C2C] hover:bg-[#FDF4F4]"
            >
              <LogOut className="h-3 w-3" />
              <span>{language === 'en' ? 'Sign out' : 'ውጣ'}</span>
            </button>
          </div>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-[#1F2421]">
            {t.staffTitle}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-1 rounded-xl border border-[#E8E2D9] bg-white p-1">
          {(
            [
              { id: 'inventory', label: `${t.uploadPhotos} & ${t.stock} (${products.length})` },
              { id: 'categories', label: `${t.categories} (${categories.length})` },
              { id: 'promos', label: `${language === 'en' ? 'Promos' : 'ቅናሾች'} (${promos.length})` },
              { id: 'orders', label: `${t.orders} (${orders.length})` },
              ...(isOwner
                ? [{ id: 'admin', label: language === 'en' ? 'Owner Admin' : 'አስተዳዳሪ' }]
                : []),
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStaffTab(tab.id as typeof staffTab)}
              className={`min-h-[40px] whitespace-nowrap rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors ${
                staffTab === tab.id
                  ? 'bg-[#1A332A] text-white'
                  : 'text-[#5C625E] hover:text-[#1F2421]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Merchant KPI Analytics Strip */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-[#E8E2D9] bg-white p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#646B66]">
            {language === 'en' ? 'Active Sales Volume' : 'አጠቃላይ ሽያጭ'}
          </p>
          <p className="mt-1 text-xl font-bold text-[#1A332A] tabular-nums">
            ETB {kpis.activeOrdersRevenue.toLocaleString('en-US')}
          </p>
        </div>
        <div className="rounded-2xl border border-[#E8E2D9] bg-white p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#646B66]">
            {language === 'en' ? 'Open Orders' : 'በሂደት ላይ ያሉ ትዕዛዞች'}
          </p>
          <p className="mt-1 text-xl font-bold text-[#C06C3E] tabular-nums">
            {kpis.pendingOrdersCount}
          </p>
        </div>
        <div className="rounded-2xl border border-[#E8E2D9] bg-white p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#646B66]">
            {language === 'en' ? 'Low Stock Variants' : 'አነስተኛ ክምችት'}
          </p>
          <p className="mt-1 text-xl font-bold text-[#942C2C] tabular-nums">
            {kpis.lowStockVariants}
          </p>
        </div>
        <div className="rounded-2xl border border-[#E8E2D9] bg-white p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#646B66]">
            {language === 'en' ? 'Published Items' : 'የታተሙ እቃዎች'}
          </p>
          <p className="mt-1 text-xl font-bold text-[#1F2421] tabular-nums">
            {kpis.publishedCount}
          </p>
        </div>
      </div>

      <div className="mb-6 flex items-start gap-3 rounded-xl border border-[#E4C9A8] bg-[#FDF6EB] p-4 text-sm text-[#6B4214]">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-[#B46522]" />
        <div className="space-y-1">
          <p className="font-semibold">{t.staffNotice}</p>
          <p className="text-xs text-[#7D5324]">{t.sampleWarning}</p>
        </div>
      </div>

      {feedback && (
        <div
          className={`mb-6 flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm ${
            feedback.type === 'error'
              ? 'border-[#E6B8B8] bg-[#FDF2F2] text-[#942C2C]'
              : 'border-[#C7DDD2] bg-[#EFF7F3] text-[#1A332A]'
          }`}
        >
          <span>{feedback.text}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-xs font-semibold underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ORDERS & DISPATCH TAB */}
      {staffTab === 'orders' && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-[#1F2421]">{t.orders}</h2>
          {orders.length === 0 ? (
            <div className="rounded-2xl border border-[#E8E2D9] bg-white p-10 text-center text-sm text-[#646B66]">
              {t.noOrders}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="rounded-2xl border border-[#E8E2D9] bg-white p-5"
                >
                  <div className="flex items-start justify-between gap-3 border-b border-[#F1EDE6] pb-3">
                    <div>
                      <div className="flex items-center gap-2 text-sm font-bold text-[#1F2421] tabular-nums">
                        <span>{order.id}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-semibold text-[#C06C3E]">
                          {orderStatusBadgeText(order.status)}
                        </span>
                      </div>
                      <p className="mt-1 text-sm font-medium text-[#1F2421]">
                        {order.customerName} · <span className="tabular-nums">{order.customerPhone}</span>
                      </p>
                      <p className="mt-0.5 text-xs text-[#646B66]">
                        {order.fulfillment === 'pickup' ? t.pickup : t.delivery} ·{' '}
                        {new Date(order.createdAt).toLocaleString()}
                      </p>
                      {order.paymentMethod && (
                        <p className="mt-1 text-xs font-semibold text-[#1A332A]">
                          {language === 'en' ? 'Payment:' : 'ክፍያ:'}{' '}
                          {order.paymentMethod === 'cod'
                            ? t.payCod
                            : order.paymentMethod === 'telebirr'
                              ? t.payTelebirr
                              : t.payCbe}
                          {order.paymentReference ? ` · Ref: ${order.paymentReference}` : ''}
                        </p>
                      )}
                      {order.paymentProofImage && (
                        <a
                          href={order.paymentProofImage}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-1.5 inline-flex items-center gap-2 rounded-lg border border-[#D5DDD8] bg-[#FAF7F2] px-2 py-1 text-[11px] font-semibold text-[#1A332A]"
                        >
                          <img
                            src={order.paymentProofImage}
                            alt="Payment receipt"
                            className="h-7 w-7 rounded object-cover"
                          />
                          <span>{language === 'en' ? 'View Payment Receipt' : 'የክፍያ ደረሰኝ እይ'}</span>
                        </a>
                      )}
                      {order.promoCode && (
                        <p className="mt-0.5 text-xs font-semibold text-[#1A5937]">
                          Promo {order.promoCode}: −ETB {(order.discountAmount ?? 0).toLocaleString('en-US')}
                        </p>
                      )}
                      {order.fulfillment === 'delivery' && (order.deliveryAddress || order.deliveryCity || order.deliverySubcity) && (
                        <div className="mt-1.5 space-y-1 text-xs text-[#1A332A]">
                          <p>
                            {order.deliveryProvider ? `[${order.deliveryProvider.toUpperCase()}] ` : ''}
                            {order.deliveryCity ? `${order.deliveryCity} · ` : ''}
                            {order.deliverySubcity ? `${order.deliverySubcity} · ` : ''}
                            {order.deliveryAddress}
                            {order.deliveryLandmark ? ` (${order.deliveryLandmark})` : ''}
                          </p>
                          {order.deliveryCoords && (
                            <a
                              href={`https://www.google.com/maps/search/?api=1&query=${order.deliveryCoords.lat},${order.deliveryCoords.lng}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 font-semibold text-[#C06C3E] underline"
                            >
                              <MapPin className="h-3 w-3" />
                              <span>
                                {language === 'en' ? 'Open GPS pin in Google Maps' : 'በGoogle Maps ክፈት'}
                                {order.deliveryDistanceKm ? ` (${order.deliveryDistanceKm} km)` : ''}
                              </span>
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="text-right text-base font-bold text-[#1F2421] tabular-nums">
                      ETB {order.total.toLocaleString('en-US')}
                      {order.estimatedDeliveryFee ? (
                        <p className="text-[11px] font-normal text-[#646B66]">
                          incl. ETB {order.estimatedDeliveryFee} courier
                        </p>
                      ) : null}
                    </div>
                  </div>

                  <ul className="mt-3 space-y-1.5 text-xs text-[#4C524E]">
                    {order.items.map((line) => {
                      const product = products.find((item) => item.id === line.productId);
                      return (
                        <li key={`${order.id}-${line.id}`} className="space-y-0.5">
                          <div className="flex justify-between">
                            <span>
                              {product ? (language === 'en' ? product.name : product.nameAm) : line.productId}{' '}
                              ({line.size} / {line.color})
                            </span>
                            <span className="font-semibold tabular-nums">× {line.quantity}</span>
                          </div>
                          {line.customNote && (
                            <p className="text-[11px] text-[#C06C3E]">
                              Note: {line.customNote}
                            </p>
                          )}
                        </li>
                      );
                    })}
                  </ul>

                  <div className="mt-4 flex flex-wrap gap-2 pt-2">
                    {order.status === 'requested' && (
                      <button
                        type="button"
                        onClick={() => {
                          const res = onUpdateOrderStatus(order.id, 'confirmed');
                          if (!res.ok && res.message) {
                            setFeedback({ type: 'error', text: res.message });
                          }
                        }}
                        className="min-h-[38px] rounded-xl bg-[#1A332A] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#234338]"
                      >
                        {t.confirmOrder}
                      </button>
                    )}
                    {order.status === 'confirmed' && (
                      <button
                        type="button"
                        onClick={() => onUpdateOrderStatus(order.id, 'out-for-delivery')}
                        className="min-h-[38px] rounded-xl bg-[#C06C3E] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#AE5D31]"
                      >
                        {t.dispatchOrder}
                      </button>
                    )}
                    {(order.status === 'confirmed' || order.status === 'out-for-delivery') && (
                      <button
                        type="button"
                        onClick={() => onUpdateOrderStatus(order.id, 'completed')}
                        className="min-h-[38px] rounded-xl bg-[#1A332A] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#234338]"
                      >
                        {t.completeOrder}
                      </button>
                    )}
                    {(order.status === 'requested' || order.status === 'confirmed') && (
                      <button
                        type="button"
                        onClick={() => onUpdateOrderStatus(order.id, 'cancelled')}
                        className="min-h-[38px] rounded-xl border border-[#E6C7C7] bg-[#FDF4F4] px-3.5 py-2 text-xs font-semibold text-[#942C2C] hover:bg-[#FAEAEA]"
                      >
                        {t.cancelOrder}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => void handleCopyOrderSummary(order)}
                      className="ml-auto inline-flex min-h-[38px] items-center gap-1.5 rounded-xl border border-[#E1DBD0] bg-[#FAF7F2] px-3 py-2 text-xs font-semibold text-[#1F2421] hover:border-[#1A332A]"
                    >
                      <Copy className="h-3.5 w-3.5" />
                      <span>{language === 'en' ? 'Copy Summary' : 'ቅዳ'}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Customer Support Messages Inbox */}
          <div className="mt-8 border-t border-[#E8E2D9] pt-6">
            <div className="mb-3 flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-[#C06C3E]" />
              <h2 className="text-lg font-semibold text-[#1F2421]">
                {language === 'en' ? 'Customer Support Inbox' : 'የደንበኞች ድጋፍ መልዕክቶች'} ({supportMessages.length})
              </h2>
            </div>
            {supportMessages.length === 0 ? (
              <div className="rounded-2xl border border-[#E8E2D9] bg-white p-6 text-center text-xs text-[#646B66]">
                {language === 'en' ? 'No customer support inquiries yet.' : 'ገና የደንበኛ መልዕክት የለም።'}
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {supportMessages.map((msg) => (
                  <div key={msg.id} className="rounded-2xl border border-[#E8E2D9] bg-white p-4 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-xs font-bold text-[#1F2421]">
                          {msg.customerName} · <span className="text-[#C06C3E]">{msg.contact}</span>
                        </p>
                        <p className="text-[11px] text-[#646B66]">
                          {msg.topic}{msg.orderId ? ` · Order ${msg.orderId}` : ''} · {new Date(msg.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <span
                        className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ${
                          msg.status === 'resolved' ? 'bg-[#E7F3EC] text-[#1A5937]' : 'bg-[#FDF6EB] text-[#B46522]'
                        }`}
                      >
                        {msg.status}
                      </span>
                    </div>
                    <p className="rounded-xl bg-[#FAF7F2] p-2.5 text-xs text-[#1F2421]">{msg.message}</p>
                    {msg.reply && (
                      <p className="rounded-xl bg-[#EFF7F3] p-2.5 text-xs text-[#1A332A]">
                        <strong>Staff Reply:</strong> {msg.reply}
                      </p>
                    )}
                    <div className="flex gap-2">
                      <input
                        value={supportReplies[msg.id] ?? msg.reply ?? ''}
                        onChange={(e) =>
                          setSupportReplies((prev) => ({ ...prev, [msg.id]: e.target.value }))
                        }
                        placeholder={language === 'en' ? 'Write reply for customer…' : 'ምላሽ ይጻፉ…'}
                        className="flex-1 rounded-lg border border-[#E1DBD0] bg-[#FAF7F2] px-2.5 py-1.5 text-xs"
                      />
                      <button
                        type="button"
                        onClick={async () => {
                          const res = await onReplySupport(
                            msg.id,
                            supportReplies[msg.id] ?? msg.reply ?? 'Approved & checked by Belika team.',
                            'resolved',
                          );
                          if (res.ok) {
                            setFeedback({ type: 'info', text: 'Support reply saved & marked resolved.' });
                          }
                        }}
                        className="rounded-lg bg-[#1A332A] px-3 py-1.5 text-xs font-semibold text-white"
                      >
                        {language === 'en' ? 'Reply & Resolve' : 'መልስ ላክ'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* CATEGORIES TAB — Strictly separated & filtered by selected branch */}
      {staffTab === 'categories' && (
        <section className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#E8E2D9] bg-white p-4">
            <div>
              <h2 className="text-base font-semibold text-[#1F2421]">
                {language === 'en' ? 'Branch Category Explorer' : 'የክፍል ምድቦች'}
              </h2>
              <p className="text-xs text-[#646B66]">
                {language === 'en'
                  ? 'Select a shop branch to view and edit only that branch’s categories.'
                  : 'የአንድ ክፍል ምድቦችን ብቻ ለማየት ክፍሉን ይምረጡ።'}
              </p>
            </div>
            <div className="flex gap-1.5 rounded-xl border border-[#E8E2D9] bg-[#FAF7F2] p-1">
              {(['Women', 'Men', 'Kids'] as const).map((dep) => (
                <button
                  key={`cat-branch-${dep}`}
                  type="button"
                  onClick={() => {
                    setCatViewDept(dep);
                    setCatDepartment(dep);
                  }}
                  className={`min-h-[36px] rounded-lg px-3.5 text-xs font-bold transition-colors ${
                    catViewDept === dep
                      ? 'bg-[#1A332A] text-white'
                      : 'text-[#5C625E] hover:text-[#1F2421]'
                  }`}
                >
                  {departmentLabel(dep)}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-12">
            <form
              onSubmit={handleAddCategory}
              className="h-fit rounded-2xl border border-[#E8E2D9] bg-white p-5 lg:col-span-5"
            >
              <div className="flex items-center gap-2">
                <FolderPlus className="h-4 w-4 text-[#C06C3E]" />
                <h3 className="text-base font-semibold text-[#1F2421]">
                  {language === 'en' ? `Add Category to ${departmentLabel(catDepartment)}` : `ወደ ${departmentLabel(catDepartment)} ምድብ ጨምር`}
                </h3>
              </div>

              <div className="mt-4 space-y-3">
                <input
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  placeholder={language === 'en' ? 'Category name (e.g. Evening Kemis)' : 'የምድብ ስም'}
                  className="w-full rounded-xl border border-[#E1DBD0] bg-[#FAF7F2] px-3.5 py-2.5 text-sm text-[#1F2421] focus:border-[#1A332A] focus:outline-none"
                />
                <input
                  value={catNameAm}
                  onChange={(e) => setCatNameAm(e.target.value)}
                  placeholder={language === 'en' ? 'Amharic name (optional)' : 'የአማርኛ ስም'}
                  className="w-full rounded-xl border border-[#E1DBD0] bg-[#FAF7F2] px-3.5 py-2.5 text-sm text-[#1F2421] focus:border-[#1A332A] focus:outline-none"
                />
                <div>
                  <span className="mb-1.5 block text-xs font-semibold text-[#4C524E]">
                    {t.department}
                  </span>
                  <div className="flex gap-2">
                    {(['Women', 'Men', 'Kids'] as const).map((choice) => (
                      <button
                        key={choice}
                        type="button"
                        onClick={() => {
                          setCatDepartment(choice);
                          setCatViewDept(choice);
                        }}
                        className={`min-h-[38px] flex-1 rounded-xl border px-2 py-1.5 text-xs font-semibold ${
                          catDepartment === choice
                            ? 'border-[#1A332A] bg-[#1A332A] text-white'
                            : 'border-[#E1DBD0] bg-white text-[#1F2421]'
                        }`}
                      >
                        {departmentLabel(choice)}
                      </button>
                    ))}
                  </div>
                </div>
                <input
                  value={catSubcategories}
                  onChange={(e) => setCatSubcategories(e.target.value)}
                  placeholder={
                    language === 'en'
                      ? 'Subcategories (comma separated)'
                      : 'ንዑስ ምድቦች (በኮማ ይለዩ)'
                  }
                  className="w-full rounded-xl border border-[#E1DBD0] bg-[#FAF7F2] px-3.5 py-2.5 text-sm text-[#1F2421] focus:border-[#1A332A] focus:outline-none"
                />
                <div className="flex items-center gap-3">
                  <label className="text-xs font-semibold text-[#4C524E]">
                    {language === 'en' ? 'Accent color' : 'መለያ ቀለም'}
                  </label>
                  <input
                    type="color"
                    value={catAccent}
                    onChange={(e) => setCatAccent(e.target.value)}
                    className="h-9 w-12 cursor-pointer rounded-lg border border-[#E1DBD0] bg-white p-0.5"
                  />
                </div>
                <button
                  type="submit"
                  className="min-h-[44px] w-full rounded-xl bg-[#1A332A] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#234338]"
                >
                  {language === 'en' ? 'Add Category' : 'ምድብ ጨምር'}
                </button>
              </div>
            </form>

            <div className="space-y-3 lg:col-span-7">
              <h3 className="text-base font-semibold text-[#1F2421]">
                {departmentLabel(catViewDept)} · {strictDepartmentCategories.length}{' '}
                {language === 'en' ? 'Categories' : 'ምድቦች'}
              </h3>
              <div className="grid gap-3 sm:grid-cols-2">
                {strictDepartmentCategories.map((cat) => (
                  <div
                    key={cat.id}
                    className="flex flex-col justify-between rounded-2xl border border-[#E8E2D9] bg-white p-4"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span
                            className="h-3.5 w-3.5 rounded-full"
                            style={{ backgroundColor: cat.accentColor }}
                          />
                          <h4 className="text-sm font-bold text-[#1F2421]">
                            {language === 'en' ? cat.name : cat.nameAm}
                          </h4>
                        </div>
                        <span className="rounded-md bg-[#FAF7F2] px-2 py-0.5 text-[11px] font-semibold text-[#646B66]">
                          {cat.department}
                        </span>
                      </div>
                      {cat.subcategories.length > 0 && (
                        <div className="mt-2.5 flex flex-wrap gap-1.5">
                          {cat.subcategories.map((sub) => (
                            <span
                              key={sub}
                              className="rounded-md bg-[#EFE9DE] px-2 py-0.5 text-[11px] font-medium text-[#4C524E]"
                            >
                              {sub}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    {cat.isCustom && (
                      <button
                        type="button"
                        onClick={() =>
                          setCategories((prev) => prev.filter((item) => item.id !== cat.id))
                        }
                        className="mt-3 inline-flex items-center gap-1 self-start text-xs font-semibold text-[#942C2C] hover:underline"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>{t.remove}</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* PROMOS TAB — Dedicated Promo & Voucher Manager */}
      {staffTab === 'promos' && (
        <section className="grid gap-8 lg:grid-cols-12">
          <form
            onSubmit={handleAddPromo}
            className="h-fit rounded-2xl border border-[#E8E2D9] bg-white p-5 lg:col-span-5"
          >
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-[#C06C3E]" />
              <h2 className="text-base font-semibold text-[#1F2421]">
                {language === 'en' ? 'Create Promo / Voucher Code' : 'አዲስ የቅናሽ ኮድ ፍጠር'}
              </h2>
            </div>
            <div className="mt-4 space-y-3">
              <input
                value={promoCodeInput}
                onChange={(e) => setPromoCodeInput(e.target.value.toUpperCase())}
                placeholder={language === 'en' ? 'Code (e.g. HOLIDAY20)' : 'ኮድ (ለምሳሌ HOLIDAY20)'}
                className="w-full rounded-xl border border-[#E1DBD0] bg-[#FAF7F2] px-3.5 py-2.5 text-sm font-semibold uppercase text-[#1F2421] focus:border-[#1A332A] focus:outline-none"
              />
              <div className="grid grid-cols-3 gap-2">
                <select
                  value={promoType}
                  onChange={(e) => setPromoType(e.target.value as 'percent' | 'fixed')}
                  className="rounded-xl border border-[#E1DBD0] bg-[#FAF7F2] px-2.5 py-2.5 text-xs font-semibold text-[#1F2421]"
                >
                  <option value="percent">% Off</option>
                  <option value="fixed">ETB Off</option>
                </select>
                <input
                  type="number"
                  min={1}
                  value={promoValue}
                  onChange={(e) => setPromoValue(e.target.value)}
                  placeholder="Value"
                  className="rounded-xl border border-[#E1DBD0] bg-[#FAF7F2] px-3 py-2 text-xs text-[#1F2421] tabular-nums"
                />
                <input
                  type="number"
                  min={0}
                  value={promoMinSubtotal}
                  onChange={(e) => setPromoMinSubtotal(e.target.value)}
                  placeholder="Min ETB"
                  className="rounded-xl border border-[#E1DBD0] bg-[#FAF7F2] px-3 py-2 text-xs text-[#1F2421] tabular-nums"
                />
              </div>
              <input
                value={promoLabel}
                onChange={(e) => setPromoLabel(e.target.value)}
                placeholder={language === 'en' ? 'Short description (optional)' : 'ማብራሪያ (አማራጭ)'}
                className="w-full rounded-xl border border-[#E1DBD0] bg-[#FAF7F2] px-3.5 py-2 text-xs text-[#1F2421]"
              />
              <button
                type="submit"
                className="min-h-[42px] w-full rounded-xl bg-[#C06C3E] px-4 py-2 text-xs font-semibold text-white hover:bg-[#AE5D31]"
              >
                {language === 'en' ? 'Save Promo Code' : 'የቅናሽ ኮድ አስቀምጥ'}
              </button>
            </div>
          </form>

          <div className="space-y-3 lg:col-span-7">
            <h2 className="text-base font-semibold text-[#1F2421]">
              {language === 'en' ? 'Active Vouchers & Coupons' : 'የሚሰሩ የቅናሽ ኮዶች'}
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {promos.map((promo) => (
                <div
                  key={promo.code}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-[#E8E2D9] bg-white p-4"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-bold text-[#1A332A]">
                        {promo.code}
                      </span>
                      <span
                        className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                          promo.active
                            ? 'bg-[#E7F3EC] text-[#1A5937]'
                            : 'bg-[#F3EFE8] text-[#646B66]'
                        }`}
                      >
                        {promo.active ? 'Active' : 'Paused'}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-[#5C625E]">
                      {language === 'en' ? promo.label : promo.labelAm}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        setPromos((prev) =>
                          prev.map((item) =>
                            item.code === promo.code ? { ...item, active: !item.active } : item,
                          ),
                        )
                      }
                      className="rounded-lg border border-[#E1DBD0] bg-[#FAF7F2] px-2.5 py-1.5 text-[11px] font-semibold text-[#1F2421]"
                    >
                      {promo.active ? 'Pause' : 'Enable'}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setPromos((prev) => prev.filter((item) => item.code !== promo.code))
                      }
                      aria-label={`Delete ${promo.code}`}
                      className="rounded-lg p-1.5 text-[#942C2C] hover:bg-[#FDF4F4]"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* OWNER ADMIN TAB — Merchant Staff & Editable Store Branches */}
      {staffTab === 'admin' && isOwner && (
        <section className="space-y-8">
          {/* Merchant Staff Provisioning */}
          <div className="grid gap-8 lg:grid-cols-12">
            <form
              onSubmit={handleCreateOrUpdateStaff}
              className="h-fit rounded-2xl border border-[#E8E2D9] bg-white p-5 lg:col-span-5 space-y-3"
            >
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-[#C06C3E]" />
                <h2 className="text-base font-semibold text-[#1F2421]">
                  {language === 'en' ? 'Add / Update Merchant Account' : 'የነጋዴ መለያ ፍጠር / አርም'}
                </h2>
              </div>
              <p className="text-xs text-[#646B66]">
                {language === 'en'
                  ? 'Merchants sign in with their phone/email & PIN to unlock Merchant Studio inside the unified app.'
                  : 'ነጋዴዎች በስልክ ወይም በኢሜይል እና PIN በመግባት የነጋዴ ክፍሉን መጠቀም ይችላሉ።'}
              </p>
              <input
                value={newStaffName}
                onChange={(e) => setNewStaffName(e.target.value)}
                placeholder={language === 'en' ? 'Merchant Full Name' : 'ሙሉ ስም'}
                className="w-full rounded-xl border border-[#E1DBD0] bg-[#FAF7F2] px-3.5 py-2.5 text-sm text-[#1F2421]"
              />
              <input
                value={newStaffIdentifier}
                onChange={(e) => setNewStaffIdentifier(e.target.value)}
                placeholder={language === 'en' ? 'Login Phone or Email' : 'ስልክ ወይም ኢሜይል'}
                className="w-full rounded-xl border border-[#E1DBD0] bg-[#FAF7F2] px-3.5 py-2.5 text-sm text-[#1F2421]"
              />
              <div className="grid grid-cols-2 gap-2">
                <div className="relative">
                  <KeyRound className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-[#646B66]" />
                  <input
                    type="password"
                    value={newStaffPin}
                    onChange={(e) => setNewStaffPin(e.target.value)}
                    placeholder={language === 'en' ? 'PIN / Password (4+)' : 'ሚስጥር ቁጥር (4+)'}
                    className="w-full rounded-xl border border-[#E1DBD0] bg-[#FAF7F2] py-2.5 pr-3 pl-8 text-xs text-[#1F2421]"
                  />
                </div>
                <select
                  value={newStaffBranch}
                  onChange={(e) => setNewStaffBranch(e.target.value as Department)}
                  className="rounded-xl border border-[#E1DBD0] bg-[#FAF7F2] px-2.5 py-2 text-xs font-semibold text-[#1F2421]"
                >
                  <option value="Women">Belika Women</option>
                  <option value="Men">Belika Man</option>
                  <option value="Kids">Belika Kids</option>
                  <option value="All">All Shops</option>
                </select>
              </div>
              <button
                type="submit"
                className="min-h-[42px] w-full rounded-xl bg-[#1A332A] px-4 py-2 text-xs font-semibold text-white hover:bg-[#234338]"
              >
                {language === 'en' ? 'Save Merchant Account' : 'መለያ አስቀምጥ'}
              </button>
            </form>

            <div className="space-y-3 lg:col-span-7">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-[#1F2421]">
                  {language === 'en' ? 'Authorized Merchants & Admin' : 'የተፈቀደላቸው ነጋዴዎች'}
                </h2>
                {staffLoading && <Loader2 className="h-4 w-4 animate-spin text-[#C06C3E]" />}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {staffAccounts.map((stf) => (
                  <div key={stf.id} className="rounded-2xl border border-[#E8E2D9] bg-white p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-bold text-[#1F2421]">{stf.name}</p>
                        <p className="text-xs text-[#646B66]">{stf.identifier}</p>
                      </div>
                      <span className="rounded-md bg-[#FAF7F2] px-2 py-0.5 text-[10px] font-bold uppercase text-[#1A332A]">
                        {stf.role} · {stf.assignedBranch}
                      </span>
                    </div>
                    {stf.role !== 'owner' && (
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => void handleToggleStaffActive(stf)}
                          className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold ${
                            stf.active
                              ? 'bg-[#E7F3EC] text-[#1A5937]'
                              : 'bg-[#FDF4F4] text-[#942C2C]'
                          }`}
                        >
                          {stf.active ? 'Active' : 'Disabled'}
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDeleteStaff(stf)}
                          className="ml-auto text-xs font-semibold text-[#942C2C] hover:underline"
                        >
                          {t.remove}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Editable Branch Directory (Addresses, Phones, Telegram, TikTok, Payment Numbers) */}
          <form
            onSubmit={handleCommitBranches}
            className="rounded-2xl border border-[#E8E2D9] bg-white p-5 space-y-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#F1EDE6] pb-3">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-[#C06C3E]" />
                <div>
                  <h2 className="text-base font-semibold text-[#1F2421]">
                    {language === 'en'
                      ? 'Store Locations, Contacts, Telegram & TikTok Links'
                      : 'የሱቅ አድራሻዎች፣ ስልኮች፣ ቴሌግራም እና ቲክቶክ'}
                  </h2>
                  <p className="text-xs text-[#646B66]">
                    {language === 'en'
                      ? 'Customers see these details whenever they open Belika Women, Belika Man, or Belika Kids.'
                      : 'ደንበኞች የየሱቁን ክፍል ሲመርጡ እነዚህ መረጃዎች በቀጥታ ይታያሉ።'}
                  </p>
                </div>
              </div>

              <div className="flex gap-1 rounded-xl border border-[#E8E2D9] bg-[#FAF7F2] p-1">
                {(['Women', 'Men', 'Kids'] as const).map((dep) => (
                  <button
                    key={`br-edit-${dep}`}
                    type="button"
                    onClick={() => setEditingBranchTab(dep)}
                    className={`min-h-[36px] rounded-lg px-3.5 text-xs font-bold ${
                      editingBranchTab === dep
                        ? 'bg-[#1A332A] text-white'
                        : 'text-[#5C625E] hover:text-[#1F2421]'
                    }`}
                  >
                    {departmentLabel(dep)}
                  </button>
                ))}
              </div>
            </div>

            {(() => {
              const b = branchDrafts[editingBranchTab];
              const patchBranch = (patch: Partial<BranchInfo>) =>
                setBranchDrafts((prev) => ({
                  ...prev,
                  [editingBranchTab]: { ...prev[editingBranchTab], ...patch },
                }));
              return (
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-[11px] font-semibold text-[#4C524E]">
                      Shop Title (English)
                    </label>
                    <input
                      value={b.title}
                      onChange={(e) => patchBranch({ title: e.target.value })}
                      className="w-full rounded-xl border border-[#E1DBD0] bg-[#FAF7F2] px-3 py-2 text-xs text-[#1F2421]"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] font-semibold text-[#4C524E]">
                      Shop Title (Amharic)
                    </label>
                    <input
                      value={b.titleAm}
                      onChange={(e) => patchBranch({ titleAm: e.target.value })}
                      className="w-full rounded-xl border border-[#E1DBD0] bg-[#FAF7F2] px-3 py-2 text-xs text-[#1F2421]"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] font-semibold text-[#4C524E]">
                      Store Location / Building & Floor
                    </label>
                    <input
                      value={b.address}
                      onChange={(e) => patchBranch({ address: e.target.value })}
                      className="w-full rounded-xl border border-[#E1DBD0] bg-[#FAF7F2] px-3 py-2 text-xs text-[#1F2421]"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] font-semibold text-[#4C524E]">
                      Store Location (Amharic)
                    </label>
                    <input
                      value={b.addressAm}
                      onChange={(e) => patchBranch({ addressAm: e.target.value })}
                      className="w-full rounded-xl border border-[#E1DBD0] bg-[#FAF7F2] px-3 py-2 text-xs text-[#1F2421]"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] font-semibold text-[#4C524E]">
                      Sales Phone Number
                    </label>
                    <input
                      value={b.salesPhone}
                      onChange={(e) => patchBranch({ salesPhone: e.target.value })}
                      className="w-full rounded-xl border border-[#E1DBD0] bg-[#FAF7F2] px-3 py-2 text-xs text-[#1F2421] tabular-nums"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] font-semibold text-[#4C524E]">
                      Customer Support Phone
                    </label>
                    <input
                      value={b.supportPhone}
                      onChange={(e) => patchBranch({ supportPhone: e.target.value })}
                      className="w-full rounded-xl border border-[#E1DBD0] bg-[#FAF7F2] px-3 py-2 text-xs text-[#1F2421] tabular-nums"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] font-semibold text-[#4C524E]">
                      Telegram Channel URL
                    </label>
                    <input
                      value={b.telegramChannel}
                      onChange={(e) => patchBranch({ telegramChannel: e.target.value, telegramSupport: e.target.value })}
                      className="w-full rounded-xl border border-[#E1DBD0] bg-[#FAF7F2] px-3 py-2 text-xs text-[#1F2421]"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] font-semibold text-[#4C524E]">
                      TikTok Channel URL
                    </label>
                    <input
                      value={b.tiktokUrl}
                      onChange={(e) => patchBranch({ tiktokUrl: e.target.value })}
                      className="w-full rounded-xl border border-[#E1DBD0] bg-[#FAF7F2] px-3 py-2 text-xs text-[#1F2421]"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] font-semibold text-[#4C524E]">
                      Google Maps Link
                    </label>
                    <input
                      value={b.mapsUrl}
                      onChange={(e) => patchBranch({ mapsUrl: e.target.value })}
                      className="w-full rounded-xl border border-[#E1DBD0] bg-[#FAF7F2] px-3 py-2 text-xs text-[#1F2421]"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] font-semibold text-[#4C524E]">
                      Opening Hours
                    </label>
                    <input
                      value={b.hours}
                      onChange={(e) => patchBranch({ hours: e.target.value })}
                      className="w-full rounded-xl border border-[#E1DBD0] bg-[#FAF7F2] px-3 py-2 text-xs text-[#1F2421]"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] font-semibold text-[#4C524E]">
                      Telebirr Merchant Account
                    </label>
                    <input
                      value={b.telebirrAccount}
                      onChange={(e) => patchBranch({ telebirrAccount: e.target.value })}
                      className="w-full rounded-xl border border-[#E1DBD0] bg-[#FAF7F2] px-3 py-2 text-xs text-[#1F2421] tabular-nums"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] font-semibold text-[#4C524E]">
                      CBE Account Number
                    </label>
                    <input
                      value={b.cbeAccount}
                      onChange={(e) => patchBranch({ cbeAccount: e.target.value })}
                      className="w-full rounded-xl border border-[#E1DBD0] bg-[#FAF7F2] px-3 py-2 text-xs text-[#1F2421] tabular-nums"
                    />
                  </div>
                </div>
              );
            })()}

            <button
              type="submit"
              disabled={savingBranches}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[#C06C3E] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#AE5D31] disabled:opacity-60"
            >
              <Shield className="h-4 w-4" />
              <span>{savingBranches ? 'Saving…' : 'Save All Branch Settings'}</span>
            </button>
          </form>
        </section>
      )}

      {/* INVENTORY & STOCK TAB */}
      {staffTab === 'inventory' && (
        <div className="grid gap-8 lg:grid-cols-12">
          <div ref={draftSectionRef} className="lg:col-span-5">
            <div className="rounded-2xl border border-[#E8E2D9] bg-white p-5">
              <div className="flex items-center gap-2">
                <Plus className="h-4 w-4 text-[#C06C3E]" />
                <h2 className="text-base font-semibold text-[#1F2421]">
                  {language === 'en' ? 'Upload New Item (with AI)' : 'አዲስ እቃ ይጫኑ (በAI)'}
                </h2>
              </div>
              <p className="mt-1 text-xs text-[#646B66]">{t.addProductHelp}</p>

              {/* Multi-Photo Upload + AI Recognition Box */}
              <div className="mt-4 rounded-xl border border-dashed border-[#D3CBBF] bg-[#FAF7F2] p-3.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => photoInputRef.current?.click()}
                    className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl border border-[#DFD8CD] bg-white px-3 py-1.5 text-xs font-semibold text-[#1F2421] hover:border-[#1A332A]"
                  >
                    <ImagePlus className="h-4 w-4 text-[#C06C3E]" />
                    <span>
                      {language === 'en'
                        ? `Select Photos (${uploadedPhotos.length}/8)`
                        : `ፎቶ ይምረጡ (${uploadedPhotos.length}/8)`}
                    </span>
                  </button>

                  <button
                    type="button"
                    disabled={aiAnalyzing || batchAnalyzing || uploadedPhotos.length === 0}
                    onClick={() => void handleAnalyzeWithAi()}
                    className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl bg-[#1A332A] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-[#234338] disabled:opacity-50"
                  >
                    {aiAnalyzing ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="h-3.5 w-3.5 text-[#E5B899]" />
                    )}
                    <span>{t.analyzeWithAi}</span>
                  </button>

                  <input
                    ref={photoInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    onChange={(e) => void handlePhotoUpload(e)}
                    className="hidden"
                  />
                </div>

                {uploadedPhotos.length > 1 && (
                  <button
                    type="button"
                    disabled={aiAnalyzing || batchAnalyzing}
                    onClick={() => void handleBatchCreateSeparateProducts()}
                    className="mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-xl border border-[#1A332A]/25 bg-white px-3 py-2 text-xs font-semibold text-[#1A332A] hover:bg-[#EFE9DE] disabled:opacity-50"
                  >
                    {batchAnalyzing ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Package className="h-3.5 w-3.5 text-[#C06C3E]" />
                    )}
                    <span>
                      {language === 'en'
                        ? `Or Batch AI: Create ${uploadedPhotos.length} Separate Products`
                        : `ወይም ${uploadedPhotos.length} የተለያዩ ምርቶችን በAI አንድ ላይ ፍጠር`}
                    </span>
                  </button>
                )}

                {uploadedPhotos.length > 0 && (
                  <div className="mt-3 grid grid-cols-4 gap-2">
                    {uploadedPhotos.map((src, idx) => (
                      <div
                        key={`upload-${idx}`}
                        className="relative aspect-square overflow-hidden rounded-lg border border-[#E1DBD0] bg-white"
                      >
                        <img src={src} alt={`Upload ${idx + 1}`} className="h-full w-full object-cover" />
                        {perImageColors[idx] && (
                          <span className="absolute right-1 bottom-1 left-1 truncate rounded bg-black/70 px-1 py-0.5 text-center text-[9px] font-medium text-white">
                            {perImageColors[idx]}
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setUploadedPhotos((prev) => prev.filter((_, i) => i !== idx));
                            setPerImageColors((prev) => prev.filter((_, i) => i !== idx));
                          }}
                          aria-label="Remove photo"
                          className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/70 text-[10px] font-bold text-white"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <input
                  value={aiNote}
                  onChange={(e) => setAiNote(e.target.value)}
                  placeholder={
                    language === 'en'
                      ? 'Optional AI hint (e.g. kids sneakers size 30–35)'
                      : 'አማራጭ የAI ማብራሪያ (ለምሳሌ የልጆች ጫማ)'
                  }
                  className="mt-2.5 w-full rounded-lg border border-[#E1DBD0] bg-white px-3 py-1.5 text-xs text-[#1F2421] focus:border-[#1A332A] focus:outline-none"
                />

                {detectedSwatches.length > 0 && (
                  <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] font-semibold text-[#5C625E]">
                      {language === 'en' ? 'Detected colors:' : 'የተለዩ ቀለሞች:'}
                    </span>
                    {detectedSwatches.map((swatch, idx) => (
                      <span
                        key={`${swatch.name}-${idx}`}
                        className="inline-flex items-center gap-1 rounded-md border border-[#E1DBD0] bg-white px-2 py-0.5 text-[11px] font-medium text-[#1F2421]"
                      >
                        <span
                          className="h-2.5 w-2.5 rounded-full border border-black/15"
                          style={{ backgroundColor: swatch.hex }}
                        />
                        {swatch.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-4 space-y-3">
                <div className="grid grid-cols-2 gap-2.5">
                  <input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder={t.productName}
                    className="w-full rounded-xl border border-[#E1DBD0] bg-[#FAF7F2] px-3.5 py-2.5 text-sm text-[#1F2421] focus:border-[#1A332A] focus:outline-none"
                  />
                  <input
                    value={newBrand}
                    onChange={(e) => setNewBrand(e.target.value)}
                    placeholder={language === 'en' ? 'Brand (e.g. Belika Studio)' : 'ብራንድ'}
                    className="w-full rounded-xl border border-[#E1DBD0] bg-[#FAF7F2] px-3.5 py-2.5 text-sm text-[#1F2421] focus:border-[#1A332A] focus:outline-none"
                  />
                </div>
                <input
                  value={newNameAm}
                  onChange={(e) => setNewNameAm(e.target.value)}
                  placeholder={t.productNameAm}
                  className="w-full rounded-xl border border-[#E1DBD0] bg-[#FAF7F2] px-3.5 py-2.5 text-sm text-[#1F2421] focus:border-[#1A332A] focus:outline-none"
                />

                <div>
                  <span className="mb-1.5 block text-xs font-semibold text-[#4C524E]">
                    {t.department}
                  </span>
                  <div className="flex gap-2">
                    {(['Men', 'Women', 'Kids'] as const).map((choice) => (
                      <button
                        key={choice}
                        type="button"
                        onClick={() => setNewDepartment(choice)}
                        className={`min-h-[38px] flex-1 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-colors ${
                          newDepartment === choice
                            ? 'border-[#1A332A] bg-[#1A332A] text-white'
                            : 'border-[#E1DBD0] bg-white text-[#1F2421]'
                        }`}
                      >
                        {departmentLabel(choice)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="mb-1 block text-[11px] font-semibold text-[#4C524E]">
                      {t.categoryLabel}
                    </label>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      className="min-h-[40px] w-full rounded-xl border border-[#E1DBD0] bg-[#FAF7F2] px-2.5 text-xs text-[#1F2421] focus:border-[#1A332A] focus:outline-none"
                    >
                      {uploadDepartmentCategories.map((cat) => (
                        <option key={cat.id} value={cat.name}>
                          {language === 'en' ? cat.name : cat.nameAm}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] font-semibold text-[#4C524E]">
                      {language === 'en' ? 'Badge' : 'መለያ'}
                    </label>
                    <select
                      value={newBadge}
                      onChange={(e) => setNewBadge(e.target.value as any)}
                      className="min-h-[40px] w-full rounded-xl border border-[#E1DBD0] bg-[#FAF7F2] px-2.5 text-xs text-[#1F2421] focus:border-[#1A332A] focus:outline-none"
                    >
                      <option value="New">New</option>
                      <option value="Trending">Trending</option>
                      <option value="Flash Drop">Flash Drop</option>
                      <option value="Staple">Staple</option>
                      <option value="Handmade">Handmade</option>
                      <option value="">None</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <input
                    value={newFabric}
                    onChange={(e) => setNewFabric(e.target.value)}
                    placeholder={language === 'en' ? 'Material / Fabric' : 'የጨርቅ አይነት'}
                    className="w-full rounded-xl border border-[#E1DBD0] bg-[#FAF7F2] px-3 py-2 text-xs text-[#1F2421] focus:border-[#1A332A] focus:outline-none"
                  />
                  <input
                    value={newCareInstructions}
                    onChange={(e) => setNewCareInstructions(e.target.value)}
                    placeholder={language === 'en' ? 'Care instructions (opt.)' : 'የማጠቢያ መመሪያ'}
                    className="w-full rounded-xl border border-[#E1DBD0] bg-[#FAF7F2] px-3 py-2 text-xs text-[#1F2421] focus:border-[#1A332A] focus:outline-none"
                  />
                </div>

                {/* Manual Merchant Details: Price + Interactive Color → Size → Quantity Builder */}
                <div className="rounded-xl border border-[#E6DFD3] bg-[#FDFBF8] p-3.5 space-y-3">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-[#C06C3E]">
                    {language === 'en'
                      ? 'Manual Pricing & Color → Size → Qty Builder'
                      : 'ዋጋ እና በቀለም መጠን እና ብዛት መምረጫ'}
                  </p>
                  <div className="grid grid-cols-2 gap-2.5">
                    <input
                      value={newPrice}
                      onChange={(e) => setNewPrice(e.target.value)}
                      placeholder={t.priceETB}
                      type="number"
                      min={1}
                      className="w-full rounded-xl border border-[#E1DBD0] bg-white px-3 py-2 text-xs text-[#1F2421] tabular-nums focus:border-[#1A332A] focus:outline-none"
                    />
                    <input
                      value={newComparePrice}
                      onChange={(e) => setNewComparePrice(e.target.value)}
                      placeholder={language === 'en' ? 'Old price (opt.)' : 'የቀድሞ ዋጋ'}
                      type="number"
                      min={1}
                      className="w-full rounded-xl border border-[#E1DBD0] bg-white px-3 py-2 text-xs text-[#1F2421] tabular-nums focus:border-[#1A332A] focus:outline-none"
                    />
                  </div>

                  {/* Step 1: Select / Add Color */}
                  <div className="space-y-1.5">
                    <span className="block text-[11px] font-semibold text-[#1A332A]">
                      {language === 'en' ? '1. Select or Add Color:' : '1. ቀለም ይምረጡ ወይም ይጨምሩ፡'}
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {Object.keys(variantMatrix).map((clr) => (
                        <div key={clr} className="inline-flex items-center">
                          <button
                            type="button"
                            onClick={() => setActiveBuilderColor(clr)}
                            className={`inline-flex items-center gap-1.5 rounded-l-lg border px-2.5 py-1 text-[11px] font-semibold ${
                              activeBuilderColor === clr
                                ? 'border-[#1A332A] bg-[#1A332A] text-white'
                                : 'border-[#E1DBD0] bg-white text-[#1F2421]'
                            }`}
                          >
                            <span
                              className="h-2.5 w-2.5 rounded-full border border-black/20"
                              style={{ backgroundColor: colorSwatchHex(clr) }}
                            />
                            <span>{clr}</span>
                          </button>
                          {Object.keys(variantMatrix).length > 1 && (
                            <button
                              type="button"
                              onClick={() => {
                                setVariantMatrix((prev) => {
                                  const next = { ...prev };
                                  delete next[clr];
                                  return next;
                                });
                                const remaining = Object.keys(variantMatrix).filter((k) => k !== clr);
                                if (activeBuilderColor === clr && remaining[0]) {
                                  setActiveBuilderColor(remaining[0]);
                                }
                              }}
                              className="rounded-r-lg border border-l-0 border-[#E1DBD0] bg-[#FAF7F2] px-1.5 py-1 text-[11px] text-[#942C2C]"
                            >
                              ×
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-1 pt-0.5">
                      {['Black', 'White', 'Ivory Cream', 'Tan', 'Navy', 'Olive Green', 'Terracotta', 'Grey']
                        .filter((c) => !variantMatrix[c])
                        .slice(0, 5)
                        .map((quickClr) => (
                          <button
                            key={quickClr}
                            type="button"
                            onClick={() => handleAddBuilderColor(quickClr)}
                            className="inline-flex items-center gap-1 rounded-md border border-dashed border-[#D3CBBF] bg-white px-2 py-0.5 text-[10px] font-medium text-[#5C625E] hover:border-[#1A332A]"
                          >
                            + {quickClr}
                          </button>
                        ))}
                    </div>
                    <div className="flex gap-1.5">
                      <input
                        value={customColorInput}
                        onChange={(e) => setCustomColorInput(e.target.value)}
                        placeholder={language === 'en' ? 'Custom color name…' : 'ሌላ ቀለም…'}
                        className="flex-1 rounded-lg border border-[#E1DBD0] bg-white px-2.5 py-1.5 text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => handleAddBuilderColor(customColorInput)}
                        className="rounded-lg bg-[#1A332A] px-3 py-1.5 text-[11px] font-semibold text-white"
                      >
                        + {language === 'en' ? 'Add' : 'ጨምር'}
                      </button>
                    </div>
                  </div>

                  {/* Step 2: Toggle Sizes for Selected Color + Set Qty */}
                  {activeBuilderColor && (
                    <div className="space-y-2 border-t border-[#EAE2D6] pt-2.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-[11px] font-semibold text-[#1A332A]">
                          {language === 'en'
                            ? `2. Sizes & Qty for ${activeBuilderColor}:`
                            : `2. ለ${activeBuilderColor} መጠን እና ብዛት፡`}
                        </span>
                        <select
                          value={sizePresetGroup}
                          onChange={(e) =>
                            setSizePresetGroup(e.target.value as typeof sizePresetGroup)
                          }
                          className="rounded-lg border border-[#E1DBD0] bg-white px-2 py-1 text-[10px] font-semibold text-[#1F2421]"
                        >
                          <option value="apparel">Apparel (XS–3XL)</option>
                          <option value="shoes">Shoes (EU 28–43)</option>
                          <option value="kidsApparel">Kids (2Y–12Y)</option>
                          <option value="free">Free Size</option>
                        </select>
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {SIZE_PRESETS[sizePresetGroup].map((sz) => {
                          const selected = variantMatrix[activeBuilderColor]?.[sz] !== undefined;
                          return (
                            <button
                              key={sz}
                              type="button"
                              onClick={() => handleToggleBuilderSize(activeBuilderColor, sz)}
                              className={`min-w-[34px] rounded-lg border px-2 py-1 text-[11px] font-bold transition-colors ${
                                selected
                                  ? 'border-[#C06C3E] bg-[#C06C3E] text-white'
                                  : 'border-[#E1DBD0] bg-white text-[#5C625E] hover:border-[#1A332A]'
                              }`}
                            >
                              {sz}
                            </button>
                          );
                        })}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <input
                          value={customSizeInput}
                          onChange={(e) => setCustomSizeInput(e.target.value)}
                          placeholder={language === 'en' ? 'Other size…' : 'ሌላ መጠን…'}
                          className="w-28 rounded-lg border border-[#E1DBD0] bg-white px-2 py-1 text-[11px]"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (customSizeInput.trim()) {
                              handleToggleBuilderSize(activeBuilderColor, customSizeInput.trim());
                              setCustomSizeInput('');
                            }
                          }}
                          className="rounded-lg border border-[#E1DBD0] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#1A332A]"
                        >
                          + Size
                        </button>
                        <div className="ml-auto flex items-center gap-1">
                          <span className="text-[10px] text-[#646B66]">Default qty:</span>
                          <input
                            type="number"
                            min={1}
                            value={bulkQtyInput}
                            onChange={(e) => setBulkQtyInput(e.target.value)}
                            className="w-12 rounded-lg border border-[#E1DBD0] bg-white px-1.5 py-1 text-center text-[11px] tabular-nums"
                          />
                        </div>
                      </div>

                      {/* Quantity steppers per chosen size for this color */}
                      {Object.keys(variantMatrix[activeBuilderColor] || {}).length > 0 && (
                        <div className="grid grid-cols-2 gap-1.5 pt-1">
                          {Object.entries(variantMatrix[activeBuilderColor] || {}).map(([sz, qty]) => (
                            <div
                              key={`${activeBuilderColor}-${sz}`}
                              className="flex items-center justify-between rounded-lg border border-[#E8E2D9] bg-white px-2.5 py-1 text-[11px]"
                            >
                              <span className="font-bold text-[#1A332A]">{sz}</span>
                              <div className="flex items-center gap-1">
                                <span className="text-[10px] text-[#646B66]">Qty:</span>
                                <input
                                  type="number"
                                  min={0}
                                  value={qty}
                                  onChange={(e) =>
                                    handleSetBuilderQty(
                                      activeBuilderColor,
                                      sz,
                                      Number.parseInt(e.target.value || '0', 10) || 0,
                                    )
                                  }
                                  className="w-12 rounded border border-[#E1DBD0] bg-[#FAF7F2] px-1 py-0.5 text-center font-bold tabular-nums"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <input
                  value={newStyleTags}
                  onChange={(e) => setNewStyleTags(e.target.value)}
                  placeholder={
                    language === 'en' ? 'Style tags (comma separated)' : 'መለያ ቃላት (በኮማ)'
                  }
                  className="w-full rounded-xl border border-[#E1DBD0] bg-[#FAF7F2] px-3 py-2 text-xs text-[#1F2421] focus:border-[#1A332A] focus:outline-none"
                />

                <label className="flex items-center gap-2 text-xs font-medium text-[#1F2421]">
                  <input
                    type="checkbox"
                    checked={newCustomizable}
                    onChange={(e) => setNewCustomizable(e.target.checked)}
                    className="h-4 w-4 accent-[#1A332A]"
                  />
                  <span>
                    {language === 'en'
                      ? 'Allow custom tailoring / measurement note on checkout'
                      : 'ደንበኞች የልክ ማስተካከያ ማስታወሻ እንዲጽፉ ፍቀድ'}
                  </span>
                </label>

                <div className="grid grid-cols-2 gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => handleSaveProduct(false)}
                    className="min-h-[44px] rounded-xl border border-[#DFD8CD] bg-white px-3 py-2.5 text-xs font-semibold text-[#1F2421] hover:border-[#1A332A]"
                  >
                    {t.addDraft}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSaveProduct(true)}
                    className="min-h-[44px] rounded-xl bg-[#C06C3E] px-3 py-2.5 text-xs font-semibold text-white hover:bg-[#AE5D31]"
                  >
                    {t.publishNow}
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-[#E8E2D9] bg-white p-5">
              <h3 className="text-sm font-semibold text-[#1F2421]">{t.inventoryHistory}</h3>
              {movements.length === 0 ? (
                <p className="mt-2 text-xs text-[#646B66]">{t.noMovements}</p>
              ) : (
                <ul className="mt-3 divide-y divide-[#F1EDE6] text-xs">
                  {movements.slice(0, 15).map((movement) => {
                    const product = products.find((item) => item.id === movement.productId);
                    const variant = product?.variants?.find((item) => item.id === movement.variantId);
                    return (
                      <li key={movement.id} className="flex items-center justify-between gap-2 py-2">
                        <div>
                          <span className="font-medium text-[#1F2421]">
                            {product?.name ?? movement.productId}
                          </span>
                          <span className="text-[#646B66]">
                            {' '}
                            · {variant?.size ?? ''} {variant?.color ?? ''} ({movement.kind})
                          </span>
                        </div>
                        <span
                          className={`font-semibold tabular-nums ${
                            movement.quantity > 0 ? 'text-[#1E6B45]' : 'text-[#942C2C]'
                          }`}
                        >
                          {movement.quantity > 0 ? '+' : ''}
                          {movement.quantity}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>

          <div className="space-y-3 lg:col-span-7">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-base font-semibold text-[#1F2421]">{t.stock}</h2>
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={stockDeptFilter}
                  onChange={(e) => setStockDeptFilter(e.target.value as Department)}
                  className="min-h-[36px] rounded-xl border border-[#E1DBD0] bg-white px-2.5 text-xs font-semibold text-[#1F2421]"
                >
                  <option value="All">{t.all}</option>
                  <option value="Women">{t.women}</option>
                  <option value="Men">{t.men}</option>
                  <option value="Kids">{t.kids}</option>
                </select>
                <div className="relative">
                  <Search className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-[#646B66]" />
                  <input
                    value={stockQuery}
                    onChange={(e) => setStockQuery(e.target.value)}
                    placeholder={language === 'en' ? 'Filter stock…' : 'ክምችት ፈልግ…'}
                    className="min-h-[36px] w-40 rounded-xl border border-[#E1DBD0] bg-white pr-3 pl-8 text-xs text-[#1F2421] focus:border-[#1A332A] focus:outline-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setLowStockOnly((v) => !v)}
                  className={`min-h-[36px] rounded-xl border px-3 text-xs font-semibold transition-colors ${
                    lowStockOnly
                      ? 'border-[#942C2C] bg-[#FDF2F2] text-[#942C2C]'
                      : 'border-[#E1DBD0] bg-white text-[#5C625E]'
                  }`}
                >
                  {language === 'en' ? 'Low Stock ≤2' : 'ዝቅተኛ ክምችት'}
                </button>
              </div>
            </div>

            {filteredStockProducts.map((product) => {
              const isExpanded = Boolean(expandedProducts[product.id]);
              const totalStock = (product.variants ?? []).reduce((sum, v) => sum + v.stock, 0);
              return (
                <div
                  key={product.id}
                  className="rounded-2xl border border-[#E8E2D9] bg-white transition-all shadow-xs overflow-hidden"
                >
                  <div
                    onClick={() =>
                      setExpandedProducts((prev) => ({ ...prev, [product.id]: !prev[product.id] }))
                    }
                    className="flex flex-wrap items-center justify-between gap-2 p-4 cursor-pointer hover:bg-[#FAF7F2]/60"
                  >
                    <div className="flex items-center gap-3">
                      {product.images?.[0] && (
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="h-11 w-11 rounded-xl border border-[#E8E2D9] object-cover"
                        />
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-[#1F2421]">
                            {language === 'en' ? product.name : product.nameAm}
                          </h3>
                          <span className="rounded-md bg-[#EFE9DE] px-2 py-0.5 text-[10px] font-bold text-[#1A332A] tabular-nums">
                            Stock: {totalStock}
                          </span>
                        </div>
                        <p className="text-xs text-[#646B66] mt-0.5">
                          {product.department} · {product.category} ·{' '}
                          {product.status === 'draft' ? t.draft : t.published} ·{' '}
                          <span className="tabular-nums font-semibold text-[#1A332A]">
                            ETB {product.price.toLocaleString('en-US')}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                      {product.status === 'draft' && (
                        <button
                          type="button"
                          onClick={() =>
                            setProducts((current) =>
                              current.map((item) =>
                                item.id === product.id ? { ...item, status: 'published' } : item,
                              ),
                            )
                          }
                          className="inline-flex min-h-[36px] items-center gap-1 rounded-xl bg-[#1A332A] px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-[#234338]"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>{t.verifyPublish}</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setEditingProduct({ ...product })}
                        className="inline-flex min-h-[36px] items-center gap-1 rounded-xl border border-[#E1DBD0] bg-[#FAF7F2] px-2.5 py-1.5 text-xs font-semibold text-[#1A332A] hover:border-[#1A332A]"
                        title="Edit product"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">{language === 'en' ? 'Edit' : 'አርም'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setProducts((current) => current.filter((item) => item.id !== product.id));
                          setFeedback({
                            type: 'info',
                            text:
                              language === 'en'
                                ? `Deleted "${product.name}" from catalog.`
                                : `"${product.nameAm}" ተሰርዟል።`,
                          });
                        }}
                        className="inline-flex min-h-[36px] items-center gap-1 rounded-xl border border-[#E6C7C7] bg-[#FDF4F4] px-2.5 py-1.5 text-xs font-semibold text-[#942C2C] hover:bg-[#FAEAEA]"
                        title="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedProducts((prev) => ({ ...prev, [product.id]: !prev[product.id] }))
                        }
                        className="rounded-lg bg-[#FAF7F2] px-2.5 py-2 text-xs font-bold text-[#5C625E] hover:bg-[#EFE9DE] transition-colors"
                      >
                        {isExpanded ? '▲ Hide' : '▼ Stock'}
                      </button>
                    </div>
                  </div>

                  {isExpanded && (() => {
                    const variants = product.variants ?? [];
                    const sizeGroups: Record<string, ProductVariant[]> = {};
                    variants.forEach((v) => {
                      const s = v.size?.trim() || 'Standard';
                      if (!sizeGroups[s]) sizeGroups[s] = [];
                      sizeGroups[s].push(v);
                    });
                    const sizeNames = Object.keys(sizeGroups);

                    return (
                      <div className="border-t border-[#F1EDE6] bg-[#FAF7F2]/40 p-4 space-y-3">
                        <div className="flex items-center justify-between text-xs text-[#5C625E]">
                          <span className="font-semibold text-[#1F2421]">
                            {language === 'en'
                              ? `Sizes (${sizeNames.length}) · Click size to view colors`
                              : `መጠኖች (${sizeNames.length}) · ቀለሞችን ለማየት መጠንን ጠቅ ያድርጉ`}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setShowAddSizeForProduct((cur) => (cur === product.id ? null : product.id))
                            }
                            className="inline-flex items-center gap-1 text-xs font-semibold text-[#1A332A] hover:text-[#C06C3E] rounded-md px-2 py-1 bg-[#EAE4D9]/60 hover:bg-[#EAE4D9]"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            <span>{language === 'en' ? 'Add Size' : 'አዲስ መጠን'}</span>
                          </button>
                        </div>

                        {showAddSizeForProduct === product.id && (
                          <div className="rounded-xl border border-[#D5DDD8] bg-white p-3.5 shadow-xs space-y-2.5">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-[#1F2421]">
                                {language === 'en' ? 'Add New Size Variant' : 'አዲስ መጠን ጨምር'}
                              </span>
                              <button
                                type="button"
                                onClick={() => setShowAddSizeForProduct(null)}
                                className="text-[11px] text-[#646B66] hover:text-[#1F2421]"
                              >
                                {language === 'en' ? 'Cancel' : 'ይቅር'}
                              </button>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                              <div>
                                <label className="block text-[10px] font-medium text-[#646B66] mb-1">
                                  {language === 'en' ? 'Size (e.g. S, M, XL, 38)' : 'መጠን'}
                                </label>
                                <input
                                  type="text"
                                  placeholder="e.g. XL"
                                  value={newSizeName}
                                  onChange={(e) => setNewSizeName(e.target.value)}
                                  className="w-full rounded-lg border border-[#D9D3C7] bg-[#FAF7F2] px-2.5 py-1.5 text-xs text-[#1F2421] focus:border-[#1A332A] focus:outline-none"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-medium text-[#646B66] mb-1">
                                  {language === 'en' ? 'Initial Color' : 'የመጀመሪያ ቀለም'}
                                </label>
                                <input
                                  type="text"
                                  placeholder="e.g. Black / Navy"
                                  value={newSizeColor}
                                  onChange={(e) => setNewSizeColor(e.target.value)}
                                  className="w-full rounded-lg border border-[#D9D3C7] bg-[#FAF7F2] px-2.5 py-1.5 text-xs text-[#1F2421] focus:border-[#1A332A] focus:outline-none"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-medium text-[#646B66] mb-1">
                                  {language === 'en' ? 'Stock Quantity' : 'ብዛት'}
                                </label>
                                <div className="flex gap-1.5">
                                  <input
                                    type="number"
                                    min="0"
                                    value={newSizeStock}
                                    onChange={(e) => setNewSizeStock(e.target.value)}
                                    className="w-20 rounded-lg border border-[#D9D3C7] bg-[#FAF7F2] px-2 py-1.5 text-xs text-[#1F2421] focus:border-[#1A332A] focus:outline-none"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleAddSizeToProduct(product.id)}
                                    className="flex-1 rounded-lg bg-[#1A332A] px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-[#234338]"
                                  >
                                    {language === 'en' ? 'Save' : 'አስቀምጥ'}
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {sizeNames.length === 0 ? (
                          <div className="rounded-xl border border-dashed border-[#D9D3C7] bg-white p-4 text-center text-xs text-[#646B66]">
                            {language === 'en' ? 'No sizes or stock variants yet.' : 'ምንም መጠኖች ወይም ቀለሞች አልተጨመሩም።'}
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {sizeNames.map((sizeName) => {
                              const sizeKey = `${product.id}::${sizeName}`;
                              const isSizeExpanded = Boolean(expandedSizes[sizeKey]);
                              const colorVariants = sizeGroups[sizeName];
                              const sizeTotalStock = colorVariants.reduce((sum, v) => sum + v.stock, 0);
                              const addInput = addColorInputs[sizeKey] || { color: '', stock: '1' };

                              return (
                                <div
                                  key={sizeKey}
                                  className="rounded-xl border border-[#E8E2D9] bg-white shadow-2xs overflow-hidden transition-all"
                                >
                                  <div
                                    onClick={() =>
                                      setExpandedSizes((prev) => ({
                                        ...prev,
                                        [sizeKey]: !prev[sizeKey],
                                      }))
                                    }
                                    className="flex items-center justify-between gap-3 p-3 cursor-pointer hover:bg-[#FAF7F2]/80 transition-colors select-none"
                                  >
                                    <div className="flex items-center gap-2.5">
                                      <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[#FAF7F2] border border-[#E8E2D9] text-[#1A332A]">
                                        {isSizeExpanded ? (
                                          <ChevronDown className="h-3.5 w-3.5 text-[#1A332A]" />
                                        ) : (
                                          <ChevronRight className="h-3.5 w-3.5 text-[#646B66]" />
                                        )}
                                      </div>
                                      <span className="rounded-md bg-[#1A332A] px-2.5 py-0.5 text-xs font-bold text-white tracking-wide">
                                        Size: {sizeName}
                                      </span>
                                      <span className="text-xs font-medium text-[#5C625E]">
                                        {colorVariants.length} {colorVariants.length === 1 ? 'color' : 'colors'}
                                      </span>
                                      <div className="hidden sm:flex items-center gap-1 ml-1">
                                        {colorVariants.map((v) => (
                                          <span
                                            key={v.id}
                                            title={`${v.color} (${v.stock})`}
                                            className="h-2.5 w-2.5 rounded-full border border-black/20"
                                            style={{ backgroundColor: colorSwatchHex(v.color) }}
                                          />
                                        ))}
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                      <span
                                        className={`rounded-md px-2.5 py-0.5 text-[11px] font-bold tabular-nums ${
                                          sizeTotalStock > 0
                                            ? 'bg-[#E7F3EC] text-[#1A5937]'
                                            : 'bg-[#FAECEC] text-[#942C2C]'
                                        }`}
                                      >
                                        Total: {sizeTotalStock}
                                      </span>
                                      <span className="text-[11px] font-semibold text-[#8C938F]">
                                        {isSizeExpanded ? '▲ Fold' : '▼ View Colors'}
                                      </span>
                                    </div>
                                  </div>

                                  {isSizeExpanded && (
                                    <div className="border-t border-[#F1EDE6] bg-[#FAF7F2]/30 p-3 space-y-3">
                                      <div className="space-y-1.5 divide-y divide-[#F1EDE6]/80">
                                        {colorVariants.map((variant) => (
                                          <div
                                            key={variant.id}
                                            className="pt-1.5 first:pt-0 flex items-center justify-between gap-3 text-xs"
                                          >
                                            <div className="flex items-center gap-2.5">
                                              <span
                                                className="h-4 w-4 shrink-0 rounded-full border border-black/25 shadow-2xs"
                                                style={{ backgroundColor: colorSwatchHex(variant.color) }}
                                              />
                                              <div>
                                                <span className="font-semibold text-[#1F2421]">
                                                  {variant.color}
                                                </span>
                                                <span
                                                  className={`ml-2 rounded px-1.5 py-0.5 text-[10px] font-bold tabular-nums ${
                                                    variant.stock > 0
                                                      ? 'bg-[#E8F4EC] text-[#1A5937]'
                                                      : 'bg-[#FBEAEA] text-[#942C2C]'
                                                  }`}
                                                >
                                                  {t.stock}: {variant.stock}
                                                </span>
                                              </div>
                                            </div>

                                            <div className="flex items-center gap-1.5">
                                              <button
                                                type="button"
                                                title="Add 1 to stock"
                                                onClick={() => {
                                                  const res = onAdjustStock(product.id, variant.id, 1, 'restock');
                                                  if (!res.ok && res.message) {
                                                    setFeedback({ type: 'error', text: res.message });
                                                  }
                                                }}
                                                className="min-h-[28px] min-w-[32px] rounded-lg bg-[#E7F3EC] px-2 py-0.5 text-xs font-bold text-[#1A5937] hover:bg-[#D5EBDE] active:scale-95"
                                              >
                                                +1
                                              </button>
                                              <button
                                                type="button"
                                                title="Decrease stock by 1"
                                                onClick={() => {
                                                  const res = onAdjustStock(product.id, variant.id, -1, 'sale');
                                                  if (!res.ok && res.message) {
                                                    setFeedback({ type: 'error', text: res.message });
                                                  }
                                                }}
                                                className="min-h-[28px] min-w-[32px] rounded-lg bg-[#FAECEC] px-2 py-0.5 text-xs font-bold text-[#942C2C] hover:bg-[#F5D8D8] active:scale-95"
                                              >
                                                −1
                                              </button>
                                              <button
                                                type="button"
                                                title="Remove this color variant"
                                                onClick={() =>
                                                  handleRemoveVariant(
                                                    product.id,
                                                    variant.id,
                                                    variant.size,
                                                    variant.color,
                                                  )
                                                }
                                                className="p-1 rounded-md text-[#A85151] hover:bg-[#FAECEC]"
                                              >
                                                <Trash2 className="h-3 w-3" />
                                              </button>
                                            </div>
                                          </div>
                                        ))}
                                      </div>

                                      <div className="mt-2 rounded-lg border border-[#E4DDD3] bg-white p-2.5">
                                        <div className="flex items-center justify-between mb-1.5">
                                          <span className="text-[11px] font-semibold text-[#1A332A]">
                                            {language === 'en'
                                              ? `+ Add Color to Size ${sizeName}`
                                              : `+ ወደ መጠን ${sizeName} ቀለም ጨምር`}
                                          </span>
                                        </div>

                                        {product.colorSwatches && product.colorSwatches.length > 0 && (
                                          <div className="mb-2 flex flex-wrap items-center gap-1.5">
                                            <span className="text-[10px] text-[#8C938F]">Quick pick:</span>
                                            {product.colorSwatches.map((swatch) => {
                                              const alreadyInSize = colorVariants.some(
                                                (v) => v.color.toLowerCase() === swatch.name.toLowerCase(),
                                              );
                                              return (
                                                <button
                                                  key={swatch.name}
                                                  type="button"
                                                  onClick={() =>
                                                    setAddColorInputs((prev) => ({
                                                      ...prev,
                                                      [sizeKey]: {
                                                        color: swatch.name,
                                                        stock: prev[sizeKey]?.stock || '1',
                                                      },
                                                    }))
                                                  }
                                                  className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-medium transition-all ${
                                                    addInput.color.toLowerCase() === swatch.name.toLowerCase()
                                                      ? 'border border-[#1A332A] bg-[#1A332A] text-white'
                                                      : alreadyInSize
                                                        ? 'border border-[#E8E2D9] bg-[#FAF7F2] text-[#8C938F]'
                                                        : 'border border-[#D9D3C7] bg-[#FAF7F2] text-[#1F2421] hover:bg-[#EFE9DE]'
                                                  }`}
                                                >
                                                  <span
                                                    className="h-2 w-2 rounded-full border border-black/20"
                                                    style={{ backgroundColor: swatch.hex }}
                                                  />
                                                  <span>{swatch.name}</span>
                                                </button>
                                              );
                                            })}
                                          </div>
                                        )}

                                        <div className="flex flex-wrap items-center gap-2">
                                          <input
                                            type="text"
                                            placeholder={
                                              language === 'en'
                                                ? 'Color name (e.g. Navy, Beige)'
                                                : 'የቀለም ስም'
                                            }
                                            value={addInput.color}
                                            onChange={(e) =>
                                              setAddColorInputs((prev) => ({
                                                ...prev,
                                                [sizeKey]: {
                                                  color: e.target.value,
                                                  stock: prev[sizeKey]?.stock || '1',
                                                },
                                              }))
                                            }
                                            className="flex-1 min-w-[130px] rounded-lg border border-[#D9D3C7] bg-[#FAF7F2] px-2.5 py-1 text-xs text-[#1F2421] focus:border-[#1A332A] focus:outline-none"
                                          />
                                          <div className="flex items-center gap-1">
                                            <span className="text-[10px] text-[#646B66]">Qty:</span>
                                            <input
                                              type="number"
                                              min="0"
                                              value={addInput.stock}
                                              onChange={(e) =>
                                                setAddColorInputs((prev) => ({
                                                  ...prev,
                                                  [sizeKey]: {
                                                    color: prev[sizeKey]?.color || '',
                                                    stock: e.target.value,
                                                  },
                                                }))
                                              }
                                              className="w-14 rounded-lg border border-[#D9D3C7] bg-[#FAF7F2] px-2 py-1 text-xs text-[#1F2421] text-center focus:border-[#1A332A] focus:outline-none"
                                            />
                                          </div>
                                          <button
                                            type="button"
                                            onClick={() => handleAddColorToSize(product.id, sizeName)}
                                            className="inline-flex items-center gap-1 rounded-lg bg-[#1A332A] px-3 py-1 text-xs font-semibold text-white hover:bg-[#234338] active:scale-95"
                                          >
                                            <Plus className="h-3 w-3" />
                                            <span>{language === 'en' ? 'Add Color' : 'ቀለም ጨምር'}</span>
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Edit Existing Product Modal */}
      {editingProduct && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-xs"
          onClick={() => setEditingProduct(null)}
        >
          <form
            onSubmit={handleSaveEditedProduct}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-[#E8E2D9] bg-[#FAF7F2] p-6 shadow-2xl"
          >
            <div className="mb-4 flex items-center justify-between border-b border-[#E8E2D9] pb-3">
              <h3 className="font-display text-xl font-bold text-[#1F2421]">
                {language === 'en' ? 'Edit Product Details' : 'ምርት ያርሙ'}
              </h3>
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#DFD8CD] bg-white text-[#1F2421]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              {/* Photos */}
              <div className="rounded-xl border border-[#E8E2D9] bg-white p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#4C524E]">
                    {language === 'en' ? 'Product Photos' : 'የምርት ፎቶዎች'}
                  </span>
                  <button
                    type="button"
                    onClick={() => editPhotoInputRef.current?.click()}
                    className="inline-flex items-center gap-1 rounded-lg border border-[#E1DBD0] bg-[#FAF7F2] px-2.5 py-1 text-xs font-semibold text-[#1A332A]"
                  >
                    <ImagePlus className="h-3.5 w-3.5 text-[#C06C3E]" />
                    <span>+ {language === 'en' ? 'Add Photo' : 'ፎቶ ጨምር'}</span>
                  </button>
                  <input
                    ref={editPhotoInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    onChange={(e) => void handleEditPhotoUpload(e)}
                    className="hidden"
                  />
                </div>
                {(editingProduct.images ?? []).length > 0 && (
                  <div className="mt-2.5 flex flex-wrap gap-2">
                    {(editingProduct.images ?? []).map((src, idx) => (
                      <div key={`edit-img-${idx}`} className="relative h-16 w-16 overflow-hidden rounded-lg border border-[#E1DBD0]">
                        <img src={src} alt="Product" className="h-full w-full object-cover" />
                        <button
                          type="button"
                          onClick={() =>
                            setEditingProduct({
                              ...editingProduct,
                              images: (editingProduct.images ?? []).filter((_, i) => i !== idx),
                            })
                          }
                          className="absolute top-0.5 right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-black/75 text-[10px] text-white"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#4C524E]">{t.productName}</label>
                  <input
                    value={editingProduct.name}
                    onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                    className="w-full rounded-xl border border-[#E1DBD0] bg-white px-3 py-2 text-xs text-[#1F2421]"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#4C524E]">{t.productNameAm}</label>
                  <input
                    value={editingProduct.nameAm}
                    onChange={(e) => setEditingProduct({ ...editingProduct, nameAm: e.target.value })}
                    className="w-full rounded-xl border border-[#E1DBD0] bg-white px-3 py-2 text-xs text-[#1F2421]"
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#4C524E]">
                    {language === 'en' ? 'Brand' : 'ብራንድ'}
                  </label>
                  <input
                    value={editingProduct.brand ?? ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, brand: e.target.value })}
                    className="w-full rounded-xl border border-[#E1DBD0] bg-white px-3 py-2 text-xs text-[#1F2421]"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#4C524E]">{t.priceETB}</label>
                  <input
                    type="number"
                    min={1}
                    value={editingProduct.price}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, price: Number(e.target.value) })
                    }
                    className="w-full rounded-xl border border-[#E1DBD0] bg-white px-3 py-2 text-xs text-[#1F2421] tabular-nums"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#4C524E]">
                    {language === 'en' ? 'Compare-at Price' : 'የቀድሞ ዋጋ'}
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={editingProduct.compareAtPrice ?? ''}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        compareAtPrice: e.target.value ? Number(e.target.value) : undefined,
                      })
                    }
                    className="w-full rounded-xl border border-[#E1DBD0] bg-white px-3 py-2 text-xs text-[#1F2421] tabular-nums"
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#4C524E]">{t.department}</label>
                  <select
                    value={editingProduct.department}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        department: e.target.value as Exclude<Department, 'All'>,
                      })
                    }
                    className="w-full rounded-xl border border-[#E1DBD0] bg-white px-2.5 py-2 text-xs text-[#1F2421]"
                  >
                    <option value="Women">Women</option>
                    <option value="Men">Men</option>
                    <option value="Kids">Kids</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#4C524E]">{t.categoryLabel}</label>
                  <select
                    value={editingProduct.category}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, category: e.target.value })
                    }
                    className="w-full rounded-xl border border-[#E1DBD0] bg-white px-2.5 py-2 text-xs text-[#1F2421]"
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.name}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#4C524E]">
                    {language === 'en' ? 'Badge' : 'መለያ'}
                  </label>
                  <select
                    value={editingProduct.badge ?? ''}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        badge: (e.target.value || undefined) as Product['badge'],
                      })
                    }
                    className="w-full rounded-xl border border-[#E1DBD0] bg-white px-2.5 py-2 text-xs text-[#1F2421]"
                  >
                    <option value="">None</option>
                    <option value="New">New</option>
                    <option value="Trending">Trending</option>
                    <option value="Flash Drop">Flash Drop</option>
                    <option value="Staple">Staple</option>
                    <option value="Handmade">Handmade</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#4C524E]">
                    {language === 'en' ? 'Fabric / Material' : 'ጨርቅ'}
                  </label>
                  <input
                    value={editingProduct.fabric ?? ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, fabric: e.target.value })}
                    className="w-full rounded-xl border border-[#E1DBD0] bg-white px-3 py-2 text-xs text-[#1F2421]"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#4C524E]">
                    {language === 'en' ? 'Care Instructions' : 'የማጠቢያ መመሪያ'}
                  </label>
                  <input
                    value={editingProduct.careInstructions ?? ''}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, careInstructions: e.target.value })
                    }
                    className="w-full rounded-xl border border-[#E1DBD0] bg-white px-3 py-2 text-xs text-[#1F2421]"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-[#4C524E]">
                  {language === 'en' ? 'Fit Guidance (English)' : 'የልክ መመሪያ'}
                </label>
                <input
                  value={editingProduct.sizeGuidance}
                  onChange={(e) =>
                    setEditingProduct({ ...editingProduct, sizeGuidance: e.target.value })
                  }
                  className="w-full rounded-xl border border-[#E1DBD0] bg-white px-3 py-2 text-xs text-[#1F2421]"
                />
              </div>

              <label className="flex items-center gap-2 text-xs font-medium text-[#1F2421]">
                <input
                  type="checkbox"
                  checked={Boolean(editingProduct.customizable)}
                  onChange={(e) =>
                    setEditingProduct({ ...editingProduct, customizable: e.target.checked })
                  }
                  className="h-4 w-4 accent-[#1A332A]"
                />
                <span>
                  {language === 'en'
                    ? 'Allow custom tailoring / measurement note'
                    : 'የልክ ማስተካከያ ማስታወሻ ፍቀድ'}
                </span>
              </label>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="min-h-[42px] flex-1 rounded-xl border border-[#DFD8CD] bg-white text-xs font-semibold text-[#1F2421]"
                >
                  {language === 'en' ? 'Cancel' : 'ይቅር'}
                </button>
                <button
                  type="submit"
                  className="min-h-[42px] flex-1 rounded-xl bg-[#1A332A] text-xs font-semibold text-white hover:bg-[#234338]"
                >
                  {language === 'en' ? 'Save Changes' : 'ለውጦችን አስቀምጥ'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
