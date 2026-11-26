import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AdvancedMarker,
  APIProvider,
  Map as GoogleMap,
  MapMouseEvent,
  Pin,
  useMap,
  useMapsLibrary,
} from '@vis.gl/react-google-maps';
import { LocateFixed, MapPin, Navigation, Search } from 'lucide-react';
import {
  BELIKA_SHOP_COORDS,
  DeliveryCoordinates,
  Language,
} from '../data/belikaCatalog';

export interface SelectedDeliveryLocation {
  address: string;
  coords: DeliveryCoordinates;
  zone: string;
  distanceKm: number;
  estimatedFeeEtb: number;
}

interface DeliveryAddressMapProps {
  language: Language;
  address: string;
  onLocationChange: (loc: SelectedDeliveryLocation) => void;
}

const ADDIS_ZONES: Array<{
  label: string;
  labelAm: string;
  coords: DeliveryCoordinates;
}> = [
  { label: 'Bole Medhanialem', labelAm: 'ቦሌ መድኃኔዓለም', coords: { lat: 8.9974, lng: 38.7868 } },
  { label: 'Kazanchis', labelAm: 'ካዛንቺስ', coords: { lat: 9.0175, lng: 38.7681 } },
  { label: 'Piazza', labelAm: 'ፒያሳ', coords: { lat: 9.0331, lng: 38.7501 } },
  { label: 'Sarbet / Old Airport', labelAm: 'ሳርቤት', coords: { lat: 8.9962, lng: 38.7385 } },
  { label: 'Megenagna', labelAm: 'መገናኛ', coords: { lat: 9.0205, lng: 38.8022 } },
  { label: 'CMC / Ayat', labelAm: 'ሲኤምሲ', coords: { lat: 9.0254, lng: 38.8421 } },
];

function computeDistanceKm(a: DeliveryCoordinates, b: DeliveryCoordinates): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const r = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h =
    sinLat * sinLat +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinLng * sinLng;
  return Number((2 * r * Math.asin(Math.sqrt(h))).toFixed(1));
}

export function estimateAddisDeliveryFee(distanceKm: number): number {
  if (distanceKm <= 3.5) return 120;
  if (distanceKm <= 8) return 180;
  if (distanceKm <= 14) return 260;
  return 350;
}

function checkQuotaInError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err ?? '');
  if (
    msg.includes('429') ||
    msg.includes('RESOURCE_EXHAUSTED') ||
    msg.includes('OVER_QUERY_LIMIT') ||
    msg.includes('QuotaExceeded')
  ) {
    window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
    return true;
  }
  return false;
}

interface PlacesSuggestionPrediction {
  placeId?: string;
  text: { text: string };
  toPlace: () => {
    displayName?: string | null;
    formattedAddress?: string | null;
    location?: { lat: () => number; lng: () => number } | null;
    viewport?: unknown;
    fetchFields: (opts: { fields: string[] }) => Promise<void>;
  };
}

export interface PlacesAutocompleteSuggestion {
  placePrediction?: PlacesSuggestionPrediction | null;
}

interface PlacesLibraryLike {
  AutocompleteSessionToken: new () => unknown;
  AutocompleteSuggestion: {
    fetchAutocompleteSuggestions: (request: {
      input: string;
      includedRegionCodes?: string[];
      locationBias?: { center: DeliveryCoordinates; radius: number };
      sessionToken?: unknown;
    }) => Promise<{ suggestions?: PlacesAutocompleteSuggestion[] }>;
  };
}

function useAutocompleteSuggestions(
  inputString: string,
): {
  suggestions: PlacesAutocompleteSuggestion[];
  isLoading: boolean;
  resetSession: () => void;
} {
  const placesLib = useMapsLibrary('places') as unknown as PlacesLibraryLike | null;
  const sessionTokenRef = useRef<unknown>(null);
  const [suggestions, setSuggestions] = useState<PlacesAutocompleteSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!placesLib) return;
    const trimmed = inputString.trim();
    if (trimmed.length < 2) {
      setSuggestions([]);
      return;
    }

    const { AutocompleteSessionToken, AutocompleteSuggestion } = placesLib;
    if (!sessionTokenRef.current) {
      sessionTokenRef.current = new AutocompleteSessionToken();
    }

    let cancelled = false;
    setIsLoading(true);

    const request = {
      input: trimmed,
      includedRegionCodes: ['et'],
      locationBias: {
        center: BELIKA_SHOP_COORDS,
        radius: 25000,
      },
      sessionToken: sessionTokenRef.current,
    };

    const timer = window.setTimeout(() => {
      AutocompleteSuggestion.fetchAutocompleteSuggestions(request)
        .then((res) => {
          if (!cancelled) {
            setSuggestions(res.suggestions ?? []);
          }
        })
        .catch((err: unknown) => {
          checkQuotaInError(err);
          if (!cancelled) setSuggestions([]);
        })
        .finally(() => {
          if (!cancelled) setIsLoading(false);
        });
    }, 240);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [placesLib, inputString]);

  const resetSession = useCallback(() => {
    sessionTokenRef.current = null;
    setSuggestions([]);
  }, []);

  return { suggestions, isLoading, resetSession };
}

function InteractiveDeliveryMapInner({
  language,
  address,
  onLocationChange,
}: DeliveryAddressMapProps) {
  const map = useMap();
  const placesLib = useMapsLibrary('places');

  const [searchText, setSearchText] = useState('');
  const [pinCoords, setPinCoords] = useState<DeliveryCoordinates>(BELIKA_SHOP_COORDS);
  const [zoneName, setZoneName] = useState('Bole / Olympia');
  const [resolvingAddress, setResolvingAddress] = useState(false);
  const [mapNotice, setMapNotice] = useState<string | null>(null);

  const { suggestions, isLoading, resetSession } = useAutocompleteSuggestions(searchText);

  const emitLocation = useCallback(
    (nextAddress: string, coords: DeliveryCoordinates, zone: string) => {
      const distanceKm = computeDistanceKm(BELIKA_SHOP_COORDS, coords);
      const estimatedFeeEtb = estimateAddisDeliveryFee(distanceKm);
      onLocationChange({
        address: nextAddress,
        coords,
        zone,
        distanceKm,
        estimatedFeeEtb,
      });
    },
    [onLocationChange],
  );

  const reverseGeocodeCoords = useCallback(
    async (coords: DeliveryCoordinates, fallbackLabel?: string) => {
      setResolvingAddress(true);
      setMapNotice(null);
      try {
        const params = new URLSearchParams({
          lat: String(coords.lat),
          lng: String(coords.lng),
          language: language === 'am' ? 'am' : 'en',
        });
        const response = await fetch(`/api/maps/reverse-geocode?${params.toString()}`);
        const data = await response.json();
        if (response.status === 429 || data?.quotaExceeded) {
          window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
        }
        if (response.ok && data?.formattedAddress) {
          const zone = data.subcity || data.neighborhood || fallbackLabel || 'Addis Ababa';
          setZoneName(zone);
          emitLocation(data.formattedAddress, coords, zone);
          return;
        }
        const label =
          fallbackLabel || `${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)} (Addis Ababa)`;
        setZoneName(fallbackLabel || 'Addis Ababa');
        emitLocation(label, coords, fallbackLabel || 'Addis Ababa');
      } catch {
        const label =
          fallbackLabel || `${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)} (Addis Ababa)`;
        setZoneName(fallbackLabel || 'Addis Ababa');
        emitLocation(label, coords, fallbackLabel || 'Addis Ababa');
      } finally {
        setResolvingAddress(false);
      }
    },
    [emitLocation, language],
  );

  const handleSelectSuggestion = async (
    suggestion: PlacesAutocompleteSuggestion,
  ) => {
    if (!placesLib || !suggestion.placePrediction) return;
    try {
      const place = suggestion.placePrediction.toPlace();
      await place.fetchFields({
        fields: ['displayName', 'formattedAddress', 'location', 'viewport'],
      });
      resetSession();
      setSearchText('');

      if (place.location) {
        const coords = {
          lat: place.location.lat(),
          lng: place.location.lng(),
        };
        setPinCoords(coords);
        if (map) {
          if (place.viewport) {
            map.fitBounds(place.viewport as Parameters<typeof map.fitBounds>[0]);
          } else {
            map.panTo(coords);
            map.setZoom(15);
          }
        }
        const formatted =
          place.formattedAddress ||
          place.displayName ||
          suggestion.placePrediction.text.text;
        const zone = place.displayName || 'Addis Ababa';
        setZoneName(zone);
        emitLocation(formatted, coords, zone);
      }
    } catch (err) {
      checkQuotaInError(err);
      setMapNotice(
        language === 'en'
          ? 'Could not load place details. Tap the map directly to place your delivery pin.'
          : 'የቦታውን ዝርዝር ማምጣት አልተቻለም። በካርታው ላይ በመንካት ቦታዎን ይምረጡ።',
      );
    }
  };

  const handleMapClick = (event: MapMouseEvent) => {
    const latLng = event.detail.latLng;
    if (!latLng) return;
    const coords = { lat: latLng.lat, lng: latLng.lng };
    setPinCoords(coords);
    void reverseGeocodeCoords(coords);
  };

  const handleUseCurrentGps = () => {
    if (!navigator.geolocation) {
      setMapNotice(
        language === 'en'
          ? 'GPS location is unavailable in this browser.'
          : 'በዚህ ብራውዘር ውስጥ GPS አይገኝም።',
      );
      return;
    }
    setResolvingAddress(true);
    setMapNotice(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setPinCoords(coords);
        map?.panTo(coords);
        map?.setZoom(15);
        void reverseGeocodeCoords(coords);
      },
      () => {
        setResolvingAddress(false);
        setMapNotice(
          language === 'en'
            ? 'Could not access GPS permission. Search or tap the map instead.'
            : 'የGPS ፈቃድ አልተገኘም። ቦታውን ይፈልጉ ወይም በካርታው ላይ ይንኩ።',
        );
      },
      { enableHighAccuracy: true, timeout: 8000 },
    );
  };

  const distanceKm = computeDistanceKm(BELIKA_SHOP_COORDS, pinCoords);
  const feeEtb = estimateAddisDeliveryFee(distanceKm);

  return (
    <div className="space-y-3">
      {/* Search Box */}
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[#646B66]" />
        <input
          type="text"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          placeholder={
            language === 'en'
              ? 'Search Addis neighborhood, building, or street…'
              : 'በአዲስ አበባ ሰፈር፣ ሕንፃ ወይም መንገድ ይፈልጉ…'
          }
          className="min-h-[42px] w-full rounded-xl border border-[#DFD8CD] bg-white pr-3 pl-9 text-xs text-[#1F2421] focus:border-[#1A332A] focus:outline-none"
        />

        {(isLoading || suggestions.length > 0) && (
          <div className="absolute right-0 left-0 z-20 mt-1 max-h-52 overflow-y-auto rounded-xl border border-[#E6DFD3] bg-white shadow-lg">
            {isLoading && suggestions.length === 0 ? (
              <div className="px-3.5 py-2.5 text-xs text-[#646B66]">
                {language === 'en' ? 'Searching places…' : 'ቦታዎችን በመፈለግ ላይ…'}
              </div>
            ) : (
              suggestions.map((suggestion, idx) => (
                <button
                  key={`${suggestion.placePrediction?.placeId ?? idx}`}
                  type="button"
                  onClick={() => void handleSelectSuggestion(suggestion)}
                  className="flex w-full items-start gap-2 border-b border-[#F3EFE8] px-3.5 py-2.5 text-left text-xs text-[#1F2421] last:border-b-0 hover:bg-[#FAF7F2]"
                >
                  <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#C06C3E]" />
                  <span>{suggestion.placePrediction?.text.text}</span>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* Quick Addis Ababa hubs + GPS button */}
      <div className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          onClick={handleUseCurrentGps}
          className="inline-flex min-h-[32px] items-center gap-1 rounded-lg bg-[#1A332A] px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-[#234338]"
        >
          <LocateFixed className="h-3 w-3" />
          <span>{language === 'en' ? 'Use GPS' : 'GPS ተጠቀም'}</span>
        </button>

        {ADDIS_ZONES.map((hub) => (
          <button
            key={hub.label}
            type="button"
            onClick={() => {
              setPinCoords(hub.coords);
              map?.panTo(hub.coords);
              map?.setZoom(14);
              void reverseGeocodeCoords(
                hub.coords,
                language === 'en' ? hub.label : hub.labelAm,
              );
            }}
            className="min-h-[32px] rounded-lg border border-[#E1DBD0] bg-white px-2.5 py-1 text-[11px] font-medium text-[#1F2421] hover:border-[#1A332A]"
          >
            {language === 'en' ? hub.label : hub.labelAm}
          </button>
        ))}
      </div>

      {/* Interactive Map */}
      <div className="relative h-[260px] w-full overflow-hidden rounded-xl border border-[#DFD8CD]">
        <GoogleMap
          mapId="DEMO_MAP_ID"
          defaultCenter={BELIKA_SHOP_COORDS}
          defaultZoom={13}
          gestureHandling="greedy"
          disableDefaultUI={false}
          internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
          onClick={handleMapClick}
          style={{ width: '100%', height: '100%' }}
        >
          {/* Belika Boutique Marker */}
          <AdvancedMarker
            position={BELIKA_SHOP_COORDS}
            title="Belika Boutique (Bole)"
          >
            <Pin background="#1A332A" borderColor="#FFFFFF" glyphColor="#D8B376" />
          </AdvancedMarker>

          {/* Draggable Customer Delivery Marker */}
          <AdvancedMarker
            position={pinCoords}
            draggable
            title="Delivery Pin"
            onDragEnd={(event) => {
              if (event.latLng) {
                const next = { lat: event.latLng.lat(), lng: event.latLng.lng() };
                setPinCoords(next);
                void reverseGeocodeCoords(next);
              }
            }}
          >
            <Pin background="#C06C3E" borderColor="#FFFFFF" glyphColor="#FFFFFF" />
          </AdvancedMarker>
        </GoogleMap>

        {resolvingAddress && (
          <div className="pointer-events-none absolute top-2.5 left-2.5 rounded-lg bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-[#1A332A] shadow-sm">
            {language === 'en' ? 'Resolving pin address…' : 'አድራሻውን በመለየት ላይ…'}
          </div>
        )}
      </div>

      {mapNotice && (
        <p className="text-[11px] text-[#942C2C]">{mapNotice}</p>
      )}

      {/* Distance & Fee Estimate Summary */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#E6DFD3] bg-white px-3 py-2 text-[11px]">
        <div className="flex items-center gap-1.5 text-[#4C524E]">
          <Navigation className="h-3.5 w-3.5 text-[#C06C3E]" />
          <span>
            {zoneName} · <strong className="tabular-nums">{distanceKm} km</strong>{' '}
            {language === 'en' ? 'from Bole shop' : 'ከቦሌ ሱቅ'}
          </span>
        </div>
        <span className="font-bold text-[#1A332A] tabular-nums">
          {language === 'en' ? `Est. courier: ETB ${feeEtb}` : `የማድረሻ ግምት፡ ${feeEtb} ብር`}
        </span>
      </div>
      {address && (
        <p className="text-[11px] text-[#525A55]">
          <strong>{language === 'en' ? 'Pinned:' : 'የተመረጠው:'}</strong> {address}
        </p>
      )}
    </div>
  );
}

export function DeliveryAddressMap({
  language,
  address,
  onLocationChange,
}: DeliveryAddressMapProps) {
  const envKey = (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined)?.trim() || '';
  const [apiKey, setApiKey] = useState(envKey);
  const [loadingKey, setLoadingKey] = useState(!envKey);

  useEffect(() => {
    if (envKey) return;
    let active = true;
    fetch('/api/maps/config')
      .then((res) => res.json())
      .then((data) => {
        if (active && typeof data?.apiKey === 'string' && data.apiKey.trim()) {
          setApiKey(data.apiKey.trim());
        }
      })
      .catch(() => undefined)
      .finally(() => {
        if (active) setLoadingKey(false);
      });
    return () => {
      active = false;
    };
  }, [envKey]);

  if (loadingKey) {
    return (
      <div className="flex h-40 items-center justify-center rounded-xl border border-[#DFD8CD] bg-white text-xs text-[#646B66]">
        {language === 'en' ? 'Loading Google Maps picker…' : 'Google Maps በመጫን ላይ…'}
      </div>
    );
  }

  if (!apiKey) {
    return (
      <div className="space-y-2 rounded-xl border border-[#E4C9A8] bg-[#FDF6EB] p-3 text-xs text-[#6B4214]">
        <p className="font-semibold">
          {language === 'en'
            ? 'Google Maps browser key unavailable — select an Addis Ababa delivery zone or enter your street address below:'
            : 'የGoogle Maps ቁልፍ አልተገኘም — ከታች የአዲስ አበባ ሰፈር ይምረጡ ወይም አድራሻ ያስገቡ፡'}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {ADDIS_ZONES.map((hub) => {
            const dist = computeDistanceKm(BELIKA_SHOP_COORDS, hub.coords);
            const fee = estimateAddisDeliveryFee(dist);
            return (
              <button
                key={hub.label}
                type="button"
                onClick={() =>
                  onLocationChange({
                    address: `${language === 'en' ? hub.label : hub.labelAm}, Addis Ababa`,
                    coords: hub.coords,
                    zone: language === 'en' ? hub.label : hub.labelAm,
                    distanceKm: dist,
                    estimatedFeeEtb: fee,
                  })
                }
                className="rounded-lg border border-[#DFD8CD] bg-white px-2.5 py-1 text-[11px] font-medium text-[#1F2421]"
              >
                {language === 'en' ? hub.label : hub.labelAm} (~ETB {fee})
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <APIProvider
      apiKey={apiKey}
      libraries={['places', 'marker']}
      language={language === 'am' ? 'am' : 'en'}
      region="ET"
    >
      <InteractiveDeliveryMapInner
        language={language}
        address={address}
        onLocationChange={onLocationChange}
      />
    </APIProvider>
  );
}
