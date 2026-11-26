import React, { useEffect, useRef, useState } from 'react';
import { Camera, Loader2, Sparkles, Store, Upload, X } from 'lucide-react';
import {
  AiVisualSearchResult,
  Language,
  Product,
} from '../data/belikaCatalog';
import { canvasFrameToDataUrl, fileToOptimizedDataUrl } from '../utils/imageHelper';

interface CameraSearchModalProps {
  open: boolean;
  language: Language;
  products: Product[];
  onClose: () => void;
  onSelectProduct: (product: Product) => void;
  onApplyColorFilter?: (colorName: string) => void;
}

export function CameraSearchModal({
  open,
  language,
  products,
  onClose,
  onSelectProduct,
  onApplyColorFilter,
}: CameraSearchModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AiVisualSearchResult | null>(null);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  useEffect(() => {
    if (!open) {
      stopCamera();
    }
    return () => stopCamera();
  }, [open]);

  if (!open) return null;

  const startCamera = async () => {
    setCameraError(null);
    setError(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError(
        language === 'en'
          ? 'Camera stream is unavailable in this browser. Upload a photo instead.'
          : 'በዚህ ብራውዘር ውስጥ ካሜራ መጠቀም አይቻልም፤ እባክዎ ፎቶ ይጫኑ።',
      );
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      });
      streamRef.current = stream;
      setCameraActive(true);
      window.setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          void videoRef.current.play();
        }
      }, 40);
    } catch {
      setCameraError(
        language === 'en'
          ? 'Camera permission denied or no camera detected. You can upload any outfit photo below.'
          : 'የካሜራ ፈቃድ አልተሰጠም ወይም ካሜራ አልተገኘም። ከታች ፎቶ መጫን ይችላሉ።',
      );
    }
  };

  const runVisualSearch = async (dataUrl: string) => {
    setCapturedImage(dataUrl);
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const catalog = products
        .filter((p) => p.status !== 'draft')
        .map((p) => ({
          id: p.id,
          name: p.name,
          nameAm: p.nameAm,
          department: p.department,
          category: p.category,
          subcategory: p.subcategory ?? '',
          colors: (p.colorSwatches ?? []).map((c) => c.name).concat(p.imageLabels ?? []),
          styleTags: p.styleTags ?? [],
          price: p.price,
        }));

      const res = await fetch('/api/ai/visual-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: dataUrl,
          catalog,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || 'Visual search request failed.');
      }
      setResult(data as AiVisualSearchResult);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : language === 'en'
            ? 'Could not analyze photo.'
            : 'ፎቶውን መተንተን አልተቻለም።',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCaptureFrame = () => {
    if (!videoRef.current) return;
    try {
      const frame = canvasFrameToDataUrl(videoRef.current);
      stopCamera();
      void runVisualSearch(frame);
    } catch {
      setError(language === 'en' ? 'Failed to capture camera frame.' : 'ፎቶ ማንሳት አልተቻለም።');
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    stopCamera();
    try {
      const dataUrl = await fileToOptimizedDataUrl(file);
      void runVisualSearch(dataUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load image.');
    } finally {
      event.target.value = '';
    }
  };

  const matchedProducts = (result?.matches ?? [])
    .map((m) => ({
      match: m,
      product: products.find((p) => p.id === m.id),
    }))
    .filter((entry): entry is { match: AiVisualSearchResult['matches'][number]; product: Product } =>
      Boolean(entry.product),
    );

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 p-0 backdrop-blur-xs sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      onClick={() => {
        stopCamera();
        onClose();
      }}
    >
      <div
        className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-t-3xl border border-[#E6DFD3] bg-[#FAF7F2] shadow-2xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#E8E2D9] bg-[#FAF7F2]/95 px-5 py-3.5 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#1A332A] text-white">
              <Camera className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#1F2421]">
                {language === 'en' ? 'AI Camera & Visual Search' : 'የAI ካሜራ እና ፎቶ ፍለጋ'}
              </h2>
              <p className="text-[11px] text-[#646B66]">
                {language === 'en'
                  ? 'Snap or upload an outfit to detect clothing type, fabric colors, and shop matches'
                  : 'ማንኛውንም ልብስ ፎቶ ያንሱ ወይም ይጫኑ፤ ቀለሙን እና ተመሳሳይ እቃዎችን ያግኙ'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[#DFD8CD] bg-white text-[#1F2421]"
            aria-label="Close visual search"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-5 p-5">
          {/* Action controls */}
          <div className="flex flex-wrap gap-2.5">
            <button
              type="button"
              onClick={cameraActive ? stopCamera : () => void startCamera()}
              className="inline-flex min-h-[42px] items-center gap-2 rounded-xl bg-[#1A332A] px-4 py-2 text-xs font-semibold text-white hover:bg-[#234338]"
            >
              <Camera className="h-4 w-4" />
              <span>
                {cameraActive
                  ? language === 'en'
                    ? 'Stop Camera'
                    : 'ካሜራ አቁም'
                  : language === 'en'
                    ? 'Open Live Camera'
                    : 'ቀጥታ ካሜራ ክፈት'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex min-h-[42px] items-center gap-2 rounded-xl border border-[#DFD8CD] bg-white px-4 py-2 text-xs font-semibold text-[#1F2421] hover:border-[#1A332A]"
            >
              <Upload className="h-4 w-4" />
              <span>{language === 'en' ? 'Upload Clothing Photo' : 'የልብስ ፎቶ ይጫኑ'}</span>
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => void handleFileChange(e)}
              className="hidden"
            />
          </div>

          {cameraError && (
            <div className="rounded-xl border border-[#E4C9A8] bg-[#FDF6EB] px-4 py-3 text-xs text-[#6B4214]">
              {cameraError}
            </div>
          )}

          {cameraActive && (
            <div className="overflow-hidden rounded-2xl border border-[#E6DFD3] bg-black">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="max-h-[300px] w-full object-cover"
              />
              <div className="flex items-center justify-center bg-[#1A332A] p-3">
                <button
                  type="button"
                  onClick={handleCaptureFrame}
                  className="inline-flex min-h-[42px] items-center gap-2 rounded-xl bg-[#C06C3E] px-5 py-2 text-xs font-bold text-white hover:bg-[#AE5D31]"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>{language === 'en' ? 'Snap & Identify Outfit' : 'ፎቶ አንሳ እና ፈልግ'}</span>
                </button>
              </div>
            </div>
          )}

          {capturedImage && (
            <div className="grid gap-4 rounded-2xl border border-[#E6DFD3] bg-white p-4 sm:grid-cols-12">
              <div className="sm:col-span-4">
                <div className="aspect-square overflow-hidden rounded-xl border border-[#EFE9DE] bg-[#FAF7F2]">
                  <img
                    src={capturedImage}
                    alt="Visual search preview"
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>

              <div className="flex flex-col justify-center sm:col-span-8">
                {loading && (
                  <div className="flex items-center gap-2.5 text-sm font-semibold text-[#1A332A]">
                    <Loader2 className="h-4 w-4 animate-spin text-[#C06C3E]" />
                    <span>
                      {language === 'en'
                        ? 'Identifying garment style & fabric colors…'
                        : 'የልብሱን አይነት እና ቀለሞች በመለየት ላይ…'}
                    </span>
                  </div>
                )}

                {error && (
                  <div className="rounded-xl border border-[#E6B8B8] bg-[#FDF2F2] p-3 text-xs text-[#942C2C]">
                    {error}
                  </div>
                )}

                {result && (
                  <div className="space-y-3">
                    <div>
                      <span className="text-[11px] font-semibold uppercase tracking-wide text-[#C06C3E]">
                        {result.department} · {result.category}
                      </span>
                      <h3 className="mt-0.5 text-base font-bold text-[#1F2421]">
                        {language === 'en' ? result.detectedItem : result.detectedItemAm}
                      </h3>
                    </div>

                    <div>
                      <p className="mb-1.5 text-[11px] font-semibold text-[#5C625E]">
                        {language === 'en' ? 'Identified Colors' : 'የተለዩ ቀለሞች'}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {result.colors.map((c, idx) => (
                          <button
                            key={`${c.name}-${idx}`}
                            type="button"
                            onClick={() => {
                              if (onApplyColorFilter) {
                                onApplyColorFilter(c.name);
                                onClose();
                              }
                            }}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-[#E6DFD3] bg-[#FAF7F2] px-2.5 py-1 text-xs font-medium text-[#1F2421] hover:border-[#1A332A]"
                          >
                            <span
                              className="h-3.5 w-3.5 rounded-full border border-black/15"
                              style={{ backgroundColor: c.hex || '#B8AEA0' }}
                            />
                            <span>{language === 'en' ? c.name : c.nameAm}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {result.styleKeywords.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {result.styleKeywords.map((kw) => (
                          <span
                            key={kw}
                            className="rounded-md bg-[#EFE9DE] px-2 py-0.5 text-[11px] font-medium text-[#4C524E]"
                          >
                            #{kw}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {result && (
            <div>
              <h3 className="mb-3 text-sm font-bold text-[#1F2421]">
                {language === 'en'
                  ? `Shop Matches (${matchedProducts.length})`
                  : `ከመደብራችን የተገኙ ተመሳሳይ እቃዎች (${matchedProducts.length})`}
              </h3>
              {matchedProducts.length === 0 ? (
                <p className="rounded-xl border border-[#E8E2D9] bg-white p-4 text-xs text-[#646B66]">
                  {language === 'en'
                    ? 'No close matches found in current stock.'
                    : 'በአሁኑ ክምችት ውስጥ ተመሳሳይ እቃ አልተገኘም።'}
                </p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {matchedProducts.map(({ match, product }) => (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => {
                        onSelectProduct(product);
                        onClose();
                      }}
                      className="flex gap-3 rounded-2xl border border-[#E8E2D9] bg-white p-3 text-left transition-colors hover:border-[#1A332A]"
                    >
                      <div
                        className="h-20 w-20 shrink-0 overflow-hidden rounded-xl"
                        style={{ backgroundColor: product.tint }}
                      >
                        {product.images?.[0] ? (
                          <img
                            src={product.images[0]}
                            alt={language === 'en' ? product.name : product.nameAm}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <Store className="h-5 w-5 text-[#8B7D6B]" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="truncate text-xs font-bold text-[#1F2421]">
                            {language === 'en' ? product.name : product.nameAm}
                          </span>
                          <span className="shrink-0 rounded-md bg-[#EFF7F3] px-1.5 py-0.5 text-[10px] font-bold text-[#1A332A] tabular-nums">
                            {match.score}%
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs font-semibold text-[#C06C3E] tabular-nums">
                          ETB {product.price.toLocaleString('en-US')}
                        </p>
                        <p className="mt-1 line-clamp-2 text-[11px] text-[#646B66]">
                          {language === 'en' ? match.reason : match.reasonAm}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
