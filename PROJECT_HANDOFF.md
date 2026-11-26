# Belika Online Store — Complete Project Handoff Document

This document captures the entire architecture, user requirements, current codebase status, remaining tasks, and next-step execution instructions for the **Belika Online Store** project across both the **Full-Stack Web App** (`src/`, `server.ts`) and the **Mobile Expo Go Client** (`expo/App.tsx`).

---

## 1. Core Project & Architecture Summary

### Project Identity & Stack
- **App Name**: Belika Online Store (ቤሊካ የመስመር ላይ ሱቅ)
- **Brand Essence**: High-end Ethiopian boutique e-commerce platform covering three physical department branches in Addis Ababa: **Belika Women** (Bole Medhanialem), **Belika Man** (Bole Olympia Dembel), and **Belika Kids** (Megenagna Zefmesh Grand Mall).
- **Frontend Stack (Web)**: React 19 SPA, TypeScript, Vite, Tailwind CSS (imported via `@import "tailwindcss";`), Lucide React icons.
- **Backend Stack**: Node.js, Express, TypeScript runtime (`tsx server.ts` running on port `3000`), `@google/genai` TypeScript SDK (model: `gemini-4-hydrogen` with automatic fallback to `gemini-3.1-flash-lite`), `@vis.gl/react-google-maps` for delivery pin mapping, JSZip for project exports.
- **Mobile Stack**: Standalone React Native / Expo Go client (`expo/App.tsx`) with zero extra native binary dependencies (`@react-native-async-storage/async-storage`, `react-native-gesture-handler`, `expo-image-picker`).

### Core Business, Payment, and Currency Requirements
- **Currency**: Ethiopian Birr (ETB / ብር) strictly formatted across all products, cart summaries, and checkout invoices.
- **Payment Methods**:
  1. Cash on Delivery (COD) / Pay at Store
  2. Telebirr (ቴሌብር) — Branch-specific merchant accounts with optional payment screenshot upload
  3. Commercial Bank of Ethiopia (CBE / ሲቢኢ ብር) — Branch-specific account numbers with optional transaction reference & screenshot upload
- **Delivery System**:
  - Threshold: Free Addis Ababa delivery on orders ETB 5,000+
  - Providers: Mela Delivery (Same-day doorstep), Addis Bike Courier (2–4 hrs), Regional Parcel / Bus (Nationwide 1–2 days), In-Store Pickup
  - Coverage: 11 Addis Ababa Subcities (Bole, Kirkos, Yeka, Arada, Lideta, Addis Ketema, Nifas Silk-Lafto, Kolfe Keranio, Gulele, Lemi Kura, Akaky Kaliti) + 13 Ethiopian Regional Cities (Adama, Bishoftu, Hawassa, Bahir Dar, Dire Dawa, Mekelle, Gondar, Jimma, Dessie, Shashamane, Harar, Arba Minch, Other) + GPS One-Tap Geolocation Pinning.
- **Language**: 100% Bilingual in English (`en`) and Amharic (`am`).

### Workspace Folder Structure
```
/
├── server.ts                    # Express API server (Auth, Support, Staff Admin, AI Recognition, Maps, Zip Exports)
├── package.json                 # Dependencies & scripts ("dev": "tsx server.ts")
├── vite.config.ts               # Vite configuration with React & Tailwind plugins
├── index.html                   # HTML entry point with synchronized Belika SEO metadata
├── HANDOFF_SETUP.md             # Account migration & Termux guide
├── PROJECT_HANDOFF.md           # This handoff document
├── public/
│   └── assets/aistudio/         # Original logos and media assets (belika_logo_transparent.png, etc.)
├── src/
│   ├── main.tsx                 # React entry point
│   ├── index.css                # Global CSS with Tailwind setup
│   ├── App.tsx                  # Primary Web storefront, PDP, checkout, auth, and routing
│   ├── assets/                  # High-resolution catalog product images and transparent logo
│   ├── components/
│   │   ├── StaffConsole.tsx     # Belika Merchant Studio & Owner Admin console (5 separated tabs)
│   │   ├── CameraSearchModal.tsx# AI Visual & Color search modal
│   │   └── DeliveryAddressMap.tsx# Google Maps interactive delivery picker
│   ├── data/
│   │   └── belikaCatalog.ts     # Catalog data, types, sizing charts, presets, and translations
│   └── utils/
│       └── imageHelper.ts       # Canvas-based client-side image optimization
└── expo/
    ├── App.tsx                  # Standalone bilingual mobile app matching Web features
    └── assets/                  # Bundled offline assets for mobile Expo Go
```

---

## 2. All User Requirements & Rules

1. **Role-Based Login & Security**:
   - Single unified app for Customers, Merchants, and Owner.
   - Customers can browse and add items as guests, but checkout order placement requires an account (`email or phone + password`).
   - Merchant accounts have department assignments (`Women`, `Men`, `Kids`, or `All`).
   - Owner Admin account has full authority to manage staff (passcodes/PINs) and live edit department branch details.
   - Merchant Studio must remain hidden from guest and customer views (no public studio links).
2. **Authentic Belika Logo**:
   - Must use the original brand logo (the intertwined polygon emblem + custom "Belika" typography).
   - Because the logo already spells "Belika", the header must NOT duplicate the word "Belika"; it should pair the logo cleanly with `ONLINE SHOPPING` / `ONLINE STORE`.
   - The launch splash screen must feature **only the authentic Belika logo** centered on a clean luxury canvas without distracting text.
3. **Department Branch Directory & Socials**:
   - Selecting a department tab (`Belika Women`, `Belika Man`, `Belika Kids`) must display the department-specific store info card:
     - Exact branch address & landmark in Addis Ababa
     - Sales Phone (`tel:`) & Support Phone
     - Direct Telegram channels (`t.me/a_z0blc` for Women, `t.me/Belika2016` for Men, `t.me/KB05q` for Kids)
     - TikTok URL
     - Google Maps pin URL
4. **Hero Promotional Banner & Shein Styling**:
   - Must NOT take over the entire screen on mobile (~200–220px compact height).
   - Auto-rotating promotional carousel highlighting: New Arrivals, Trending Now, and Seasonal Sale / በቅናሽ.
   - Single horizontal row for actions (`Explore Collection`, `Shop Department`) and promo slide indicator dots.
   - 5-tab Shein-inspired mobile bottom bar: `Shop`, `Category`, `Wishlist`, `Bag`, and `Account` with floating numeric notification pills.
5. **Contextual Filter by Size**:
   - Size filter must adapt dynamically to what is being viewed/searched:
     - If searching/filtering shoes, show only shoe sizes (e.g. EU 36–43).
     - If viewing apparel, show only clothing sizes (e.g. XS–3XL).
6. **Product Details Page (PDP)**:
   - Clean, uncluttered layout: remove collision between variant chips and title; place stock pill (`In Stock` / `Out of Stock`) right below price.
   - Color swatch clicks must sync immediately with the corresponding photo of that color.
   - Drag-to-pan zoom capability on product photos.
   - Include Complete the Look / You May Also Like carousel at the bottom of the PDP.
7. **Strict 2-Item Side-by-Side Compare**:
   - Clean 50/50 two-column compare modal comparing specs, fabric, fit, price, and sizes.
8. **Checkout, Delivery & Proof of Payment**:
   - Address picker with 11 Addis Subcities and 13 Regional Ethiopian cities.
   - Delivery partner selection: Mela Delivery, Addis Courier, Regional Bus Parcel, or In-Store Pickup.
   - One-tap "Share My GPS Location" calculating precise distance and courier fees.
   - Optional Telebirr/CBE payment proof screenshot attachment.
   - In-app Customer Support contact modal and direct message submission for order issues.
9. **Merchant Studio Workflow**:
   - 5 distinct tabs: Inventory, Categories (filtered by department), Promos, Orders (with Support Inbox and payment proof previews), and Admin (Staff & Branch Directory).
   - Manual Price, Size Presets, and Stock control (AI must NOT auto-fill price or invent fake quantities).
   - Color → Size preset matrix builder when creating or editing items.

---

## 3. Completed & Applied Work (File-by-File)

### `server.ts`
- Express full-stack server running with Vite middleware in dev and static files in production.
- Cryptographically secure authentication via `scryptSync` and `timingSafeEqual`.
- In-memory Bearer token session cache with persistent JSON storage (`.belika_store_data.json`) for users, support tickets, and branch configs.
- REST Endpoints:
  - `GET /api/store/branches`: Returns current branch directory (Women, Men, Kids).
  - `GET /api/auth/status`: Checks if an owner account exists.
  - `POST /api/auth/claim-owner`: Allows first-time administrative claim.
  - `POST /api/auth/register` & `POST /api/auth/login`: Customer & merchant authentication.
  - `GET /api/auth/me` & `POST /api/auth/logout`: Profile & session termination.
  - `GET/POST /api/admin/staff`, `PATCH/DELETE /api/admin/staff/:id`: Owner management of merchant logins.
  - `PUT /api/admin/branches`: Live update of branch locations, phone numbers, and social links.
  - `POST/GET/PATCH /api/support`: Customer ticket submission, inbox retrieval, and reply workflow.
  - `POST /api/ai/analyze-garment` & `POST /api/ai/visual-search`: Gemini AI image recognition.
  - `GET /api/export-project.zip` & `GET /api/export-expo.zip`: Source code and mobile bundle download routes.

### `src/data/belikaCatalog.ts`
- Fully typed data models for `BranchInfo`, `AuthUser`, `SupportMessage`, `HeroPromoSlide`, `DeliveryProvider`, `Product`, `PromoCode`, and `StoreCategory`.
- `ADDIS_SUBCITIES` with coordinates and calibrated delivery fees across all 11 subcities.
- `ETHIOPIA_REGIONAL_CITIES` with 13 regional cities and regional shipping rates.
- `DELIVERY_PROVIDERS`: Mela Delivery, Addis Bike Courier, Regional Parcel / Bus, and Pickup.
- `DEFAULT_BRANCHES`: Pre-configured details for Belika Women, Belika Man, and Belika Kids with live Telegram, TikTok, and phone contacts.
- `HERO_PROMO_SLIDES`: 4 promotional carousel slides with bilingual copy and department targets.
- `getContextualSizes()`: Dynamically filters sizes based on whether shoes or apparel are active in search.
- `resolveImageIndexForColor()`: Maps clicked color swatches to corresponding product gallery images.
- Complete English (`en`) and Amharic (`am`) UI string dictionaries (`COPY`).

### `src/App.tsx`
- **Branding**: Uses trimmed `belika_logo_transparent.png` with no empty borders. Clean header pairing the logo with `ONLINE SHOPPING`.
- **Launch Splash**: Shows purely the authentic Belika logo on an ambient cream background.
- **SHEIN UI Layout**:
  - Rounded pill search bar with internal camera button and trending search suggestions.
  - Sticky department navigation tabs (`ALL`, `WOMEN`, `MEN`, `KIDS`, `🔥 SALE`) with signature active underline indicators.
  - Compact Shein-inspired ~200px responsive banner with auto-slide timer, hot sale badge, and horizontally aligned action buttons.
  - SHEIN Flash Sale section with live ticking countdown timer (`02:48:15`), percentage discount badges, and "Claimed" progress indicators.
  - Catalog product feed with high-fashion portrait cards (`aspect-[3/4]`), floating thumb wishlist hearts, star ratings, and quick add buttons.
  - 5-tab elevated mobile bottom bar (`Shop`, `Category`, `Wishlist`, `Bag`, `Me`) with floating red/terracotta notification badges.
- **Department Store Cards**: Responsive contact/info card for Women, Men, and Kids.
- **Product Details (PDP)**: Clean layout with stock badge under price, drag-to-pan image zoom, color-to-photo sync, and "Complete the Look" recommendations.
- **Compare Modal**: Strict 50/50 side-by-side comparison.
- **Checkout Flow**: Authentication modal gate for order submission, subcity and regional city select, GPS location picker, optional payment screenshot upload, and customer support ticket launcher.

### `src/components/StaffConsole.tsx`
- Gated behind `merchant` or `owner` role authentication.
- 5 clean separated tabs:
  1. `Inventory`: Product list, stock movements, and AI/manual product creator with Color → Size matrix.
  2. `Categories`: Category creator filtered by department (`Women`, `Men`, `Kids`).
  3. `Promos`: Dedicated coupon manager with discount rules.
  4. `Orders & Support`: Order tracking, customer payment screenshot previews, and Customer Support Inbox with staff reply thread.
  5. `Admin Settings` (Owner only): Add/remove merchant staff accounts and edit live branch contacts/channels.

### `src/components/CameraSearchModal.tsx` & `DeliveryAddressMap.tsx`
- Interactive visual AI search using device camera or file upload, returning matching items with visual thumbnails.
- Google Maps interactive pin dropping for Addis Ababa delivery coordinates.

### `expo/App.tsx` & `expo/assets/`
- Full-featured standalone mobile Expo app synchronized with the web codebase.
- Splash screen rendering only the logo.
- Header displaying the trimmed logo and `ONLINE SHOPPING`.
- Native gesture-handler zoom gallery with clamped panning.
- Complete role-based authentication and offline-ready local catalog assets.

---

## 4. Incomplete / Remaining Tasks

The core architecture, UI, and backend routes are complete and verified. The following potential enhancements can be picked up:

1. **Push Notifications for Orders (Mobile)** (Priority: High):
   - Add push notification tokens via Expo Notifications to alert customers when order status changes to "out-for-delivery" or "completed".
2. **Bulk Stock CSV / Excel Import & Export** (Priority: Medium):
   - Add a "Bulk Upload" button in Merchant Studio to import or export products and inventory levels via CSV.
3. **Automated Telegram Bot Webhook** (Priority: Medium):
   - Connect the backend `/api/support` or order dispatch directly to a Telegram Bot token to notify store staff on their official Telegram channels in real time.
4. **Offline Persistent Cart Sync** (Priority: Low):
   - Synchronize customer cart items to backend user accounts so the bag transfers seamlessly across mobile and web.

---

## 5. Exact Next-Step Prompt

When opening a new workspace or continuing in a fresh session with this project ZIP, paste the following prompt:

```text
I have uploaded the full project ZIP for the Belika Online Store (Ethiopian boutique e-commerce web app + Express backend + Expo Go mobile app). 

Please inspect `PROJECT_HANDOFF.md`, `server.ts`, and `src/App.tsx`. All core features (role-based login, Belika Merchant Studio, 3 department branches, authentic logo, Shein-inspired 5-tab navigation, compact promo hero banner, contextual sizing, and payment proof uploads) are already built and verified.

Do not rewrite or regress any completed files. Please run `compile_applet` and `lint_applet` to confirm the project builds cleanly, and continue from Section 4 of `PROJECT_HANDOFF.md`.
```
