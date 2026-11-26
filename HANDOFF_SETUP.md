# Belika Online Store — Full Account Migration & Setup Guide

Use this guide to move the complete **Belika Online Store** project (Web App + Express AI/Maps Server + Expo Go Mobile App) to a **new Google AI Studio account** or run locally / on Termux.

---

## 1. Fastest Way to Export & Move to Another Account

### Step A — Download the Full Project ZIP
You have two instant ways to export the complete codebase:
1. **In-App Export**: Open the store preview header → tap **Expo App.tsx** (or **Export / Backup**) → click **Download Full Project (.zip)** (`belika-online-store-full-project.zip`). It automatically excludes `node_modules`, `dist`, cache folders, and private `.env` secrets.
2. **AI Studio Toolbar**: Click **Download App (ZIP)** or **Save to GitHub** in Google AI Studio's top-right toolbar.

To download only the mobile client for Android Termux, tap **Download App.tsx** inside the modal.

### Step B — Open in Your New Google AI Studio Account
1. Sign into your **new Google AI Studio account**.
2. Create a new Build project from GitHub or upload the extracted files from `belika-online-store-full-project.zip` (all source files: `server.ts`, `src/`, `expo/`, `public/`, `package.json`, `metadata.json`, `index.html`, `tsconfig.json`, `vite.config.ts`, `.env.example`, `HANDOFF_SETUP.md`).
3. Install dependencies (`npm install`) — `package.json` includes all dependencies:
   - `@google/genai`, `@vis.gl/react-google-maps`, `express`, `dotenv`, `jszip`, `lucide-react`, `motion`, `react`, `react-dom`, `tailwindcss`, `@tailwindcss/vite`, `tsx`, `vite`.
4. Provision API keys in the **new account** (never copy old keys into code):
   - **Gemini AI (`GEMINI_API_KEY`)**: Automatically injected by AI Studio runtime / Secrets.
   - **Google Maps (`VITE_GOOGLE_MAPS_API_KEY`)**: Ask the new AI Studio assistant *"Set up Google Maps Platform for DeliveryAddressMap"* to provision a fresh browser key.
5. **Share / Publish App (Required for Android Expo Go AI & Maps)**:
   - Click **Share / Publish App** in the top-right toolbar of your new AI Studio project.
   - Copy your new **Shared App URL** (`https://ais-pre-....run.app`).
   - Update `SHARED_API_BASE` in `expo/App.tsx` (or paste it inside Merchant Studio → Server URL on your phone).

---

## 2. Project File Architecture

### Backend (`server.ts`)
- Express server on port `3000` (`tsx server.ts` in dev with `vite.middlewares`, static `dist/` in production).
- CORS enabled on `/api/*` for Expo Go mobile requests.
- Body limit `25mb` for multi-photo uploads (up to 8 images).
- Routes:
  - `GET /api/health` → `{ ok, aiConfigured, mapsConfigured }`
  - `GET /api/maps/config` → returns public Maps browser key
  - `GET /api/maps/reverse-geocode?lat=...&lng=...&language=en|am` → Addis Ababa address lookup
  - `POST /api/ai/analyze-garment` → uses `gemini-4-hydrogen` (with automatic retry fallback to `gemini-3.1-flash-lite`) to auto-fill garment name, Amharic name, brand, fabric, department, category, subcategory, normalized hex colors, size guidance, and style tags
  - `POST /api/ai/visual-search` → ranks matching catalog products from a customer camera/gallery photo
  - `GET /api/export-project.zip` → builds and downloads a clean archive of the full project source
  - `GET /api/export-expo.zip` → builds and downloads `belika-expo-bundle.zip` (`App.tsx` + all 10 local catalog photos in `assets/`)

### Web Storefront & Merchant Studio (`src/`)
- `src/App.tsx` — Bilingual English + Amharic storefront: dismissible promo banner (`BELIKA10`), multi-facet search & filters, circular category explorer, hover secondary photos & quick-add cards, side-by-side 2-product Comparison Modal, interactive PDP (zoom gallery, quantity stepper, overview + CM/IN sizing chart + fit-filtered customer reviews & review form, `Buy Now`), slide-over Bag Drawer + ETB 5,000 Free Delivery bar, Promo Code redemption, Checkout (`COD` / `Telebirr` / `CBE Birr` + Google Maps delivery pin + saved profile), and 4-step Order Tracker.
- `src/components/StaffConsole.tsx` — Merchant Analytics KPI strip, AI Multi-Photo Upload (Price, Sizes, and Stock remain manual), Product Editor Modal, Low-Stock (`<= 2`) search filter, Promo Code Manager, Custom Category Builder, and Dispatch/Order Manager with WhatsApp/Telegram summary copy.
- `src/components/CameraSearchModal.tsx` — Customer visual & color search via camera/gallery.
- `src/components/DeliveryAddressMap.tsx` — Interactive Google Map centered on Addis Ababa (`9.0054, 38.7636`).
- `src/data/belikaCatalog.ts` — Typed bilingual catalog, sizing charts, promo defaults, and copy.

### Standalone Mobile Expo App (`expo/App.tsx` + `expo/assets/`)
- Full React Native / Expo Go app matching the web storefront and Merchant Studio: dismissible announcement banner, serif hero + editorial photo, quick-add variant modal, side-by-side product compare, CM/IN sizing chart, fit-filtered customer reviews + composer, ETB 5,000 free delivery progress bar, promo codes, `COD` / `Telebirr` / `CBE Birr` checkout, 4-step order tracker, AI multi-photo studio, product editor modal, boutique footer, and locally bundled `assets/*.jpg` photos.

---

## 3. Environment Variables Reference (`.env.example`)
Configure in your **new AI Studio account** (do not hardcode secrets in files):
- `GEMINI_API_KEY` — Gemini API key (server-side only, used in `server.ts`)
- `VITE_GOOGLE_MAPS_API_KEY` — Google Maps Platform key (`DeliveryAddressMap.tsx` & `/api/maps/reverse-geocode`)
- `APP_URL` — Automatically provided by AI Studio runtime

---

## 4. Android Expo Go + Termux Commands

### First-Time Expo Project Setup
```bash
npx create-expo-app@latest BelikaShop --template blank-typescript
cd BelikaShop
npx expo install expo-image-picker @react-native-async-storage/async-storage react-native-gesture-handler
```

### Updating `App.tsx` + `assets/*.jpg` in `~/BelikaShop`
After tapping **Expo App.tsx** → **Download Expo Bundle (.zip with all Photos)** in the Belika Store Chrome preview:
```bash
mkdir -p ~/BelikaShop_old_backups && mv ~/BelikaShop/App.before-redesign.tsx ~/BelikaShop/_backups ~/BelikaShop_old_backups/ 2>/dev/null; cd ~/BelikaShop && unzip -o "$(ls -t /storage/emulated/0/Download/belika-expo-bundle*.zip | head -n 1)" && npx tsc --noEmit && npx expo start -c
```

---

## 5. Copy-Paste Prompt for Your New AI Studio Account

> I migrated my **Belika Online Store** project (bilingual English + Amharic Ethiopian fashion storefront, Express + Gemini AI + Google Maps backend in `server.ts`, React web app in `src/`, and Expo Go mobile app in `expo/App.tsx`) from another AI Studio account. Please read `HANDOFF_SETUP.md`, `.env.example`, `package.json`, and `server.ts` first, verify/provision Google Maps Platform (`VITE_GOOGLE_MAPS_API_KEY`) and confirm `GEMINI_API_KEY` is active on this new account, and once I click Share / Publish App, help me update `SHARED_API_BASE` in `expo/App.tsx` to my new Shared App URL. Keep Price, Available Sizes, and Quantities strictly manual in Merchant Studio while AI auto-detects Name, Brand, Material/Fabric, Colors, Department, Category, and Collection on photo upload.
