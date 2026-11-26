import 'dotenv/config';
import express from 'express';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import JSZip from 'jszip';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const AI_MODEL = 'gemini-4-hydrogen';
const AI_FALLBACK_MODEL = 'gemini-3.1-flash-lite';

const ALLOWED_IMAGE_MIME = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
]);

const MAX_BASE64_LENGTH = 9_500_000; // ~7MB binary image cap

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: { 'User-Agent': 'aistudio-build' },
    },
  });
}

function parseImagePayload(
  imageBase64: unknown,
  explicitMimeType?: unknown,
): { ok: true; data: string; mimeType: string } | { ok: false; error: string } {
  if (typeof imageBase64 !== 'string' || !imageBase64.trim()) {
    return { ok: false, error: 'Image data is required.' };
  }

  let mimeType =
    typeof explicitMimeType === 'string' && explicitMimeType.trim()
      ? explicitMimeType.trim().toLowerCase()
      : 'image/jpeg';
  let rawData = imageBase64.trim();

  const dataUrlMatch = rawData.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/);
  if (dataUrlMatch) {
    mimeType = dataUrlMatch[1].toLowerCase();
    rawData = dataUrlMatch[2];
  }

  if (mimeType === 'image/jpg') {
    mimeType = 'image/jpeg';
  }

  if (!ALLOWED_IMAGE_MIME.has(mimeType)) {
    return {
      ok: false,
      error: 'Unsupported image format. Please upload a JPEG, PNG, or WebP photo.',
    };
  }

  if (rawData.length > MAX_BASE64_LENGTH) {
    return {
      ok: false,
      error: 'Image file is too large. Please use a photo smaller than 7 MB.',
    };
  }

  return { ok: true, data: rawData, mimeType };
}

function normalizeColors(colors: unknown): Array<{ name: string; nameAm: string; hex: string }> {
  if (!Array.isArray(colors)) return [];
  return colors.map((c: Record<string, unknown>) => {
    const rawHex = String(c?.hex ?? '').trim();
    const cleaned = rawHex.startsWith('#') ? rawHex : `#${rawHex.replace(/^#+/, '')}`;
    const validHex = /^#[0-9a-fA-F]{6}$/.test(cleaned) ? cleaned.toUpperCase() : '#8C857B';
    return {
      name: String(c?.name ?? 'Classic'),
      nameAm: String(c?.nameAm ?? c?.name ?? 'መደበኛ'),
      hex: validHex,
    };
  });
}

function isQuotaError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  const status = (err as { status?: number })?.status;
  return (
    status === 429 ||
    msg.includes('429') ||
    msg.includes('RESOURCE_EXHAUSTED') ||
    msg.includes('OVER_QUERY_LIMIT') ||
    msg.toLowerCase().includes('quota')
  );
}

function isTransientUnavailableError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  const status = (err as { status?: number })?.status;
  return status === 503 || msg.includes('503') || msg.includes('UNAVAILABLE') || msg.toLowerCase().includes('high demand');
}

async function generateContentWithFallback(
  ai: GoogleGenAI,
  params: Omit<Parameters<GoogleGenAI['models']['generateContent']>[0], 'model'>,
) {
  try {
    return await ai.models.generateContent({ model: AI_MODEL, ...params });
  } catch (err) {
    if (isTransientUnavailableError(err)) {
      await new Promise((r) => setTimeout(r, 800));
      return await ai.models.generateContent({ model: AI_FALLBACK_MODEL, ...params });
    }
    throw err;
  }
}

async function startServer() {
  const app = express();
  const STORE_DATA_FILE = path.resolve(__dirname, '.belika_store_data.json');

  type StoredRole = 'customer' | 'merchant' | 'owner';
  type StoredAccount = {
    id: string;
    name: string;
    identifier: string;
    phone?: string;
    email?: string;
    role: StoredRole;
    assignedBranch: 'All' | 'Men' | 'Women' | 'Kids';
    active: boolean;
    salt: string;
    passwordHash: string;
    createdAt: string;
  };
  type StoredSupport = {
    id: string;
    orderId?: string;
    customerName: string;
    contact: string;
    department?: string;
    topic: string;
    message: string;
    reply?: string;
    status: 'open' | 'resolved';
    createdAt: string;
  };
  type PersistedStore = {
    accounts: StoredAccount[];
    branches: Record<string, Record<string, unknown>>;
    supportMessages: StoredSupport[];
  };

  const DEFAULT_SERVER_BRANCHES: Record<string, Record<string, unknown>> = {
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

  function loadPersistedStore(): PersistedStore {
    try {
      if (fs.existsSync(STORE_DATA_FILE)) {
        const parsed = JSON.parse(fs.readFileSync(STORE_DATA_FILE, 'utf8')) as Partial<PersistedStore>;
        return {
          accounts: Array.isArray(parsed.accounts) ? parsed.accounts : [],
          branches: parsed.branches && typeof parsed.branches === 'object' ? parsed.branches : DEFAULT_SERVER_BRANCHES,
          supportMessages: Array.isArray(parsed.supportMessages) ? parsed.supportMessages : [],
        };
      }
    } catch {
      // Fallback to defaults
    }
    return {
      accounts: [],
      branches: DEFAULT_SERVER_BRANCHES,
      supportMessages: [],
    };
  }

  let storeData: PersistedStore = loadPersistedStore();
  function savePersistedStore() {
    try {
      fs.writeFileSync(STORE_DATA_FILE, JSON.stringify(storeData, null, 2), 'utf8');
    } catch {
      // Ignore write failures in read-only runtimes
    }
  }

  const activeTokens = new Map<string, string>(); // token -> accountId

  function normalizeIdentifier(raw: unknown): string {
    return String(raw ?? '').trim().toLowerCase().replace(/\s+/g, '');
  }

  function hashSecret(secret: string, salt?: string): { salt: string; hash: string } {
    const useSalt = salt || crypto.randomBytes(16).toString('hex');
    const derived = crypto.scryptSync(secret, useSalt, 64).toString('hex');
    return { salt: useSalt, hash: derived };
  }

  function verifySecret(secret: string, salt: string, expectedHex: string): boolean {
    const derived = crypto.scryptSync(secret, salt, 64);
    const expected = Buffer.from(expectedHex, 'hex');
    if (derived.length !== expected.length) return false;
    return crypto.timingSafeEqual(derived, expected);
  }

  function toPublicUser(acc: StoredAccount) {
    return {
      id: acc.id,
      name: acc.name,
      identifier: acc.identifier,
      phone: acc.phone,
      email: acc.email,
      role: acc.role,
      assignedBranch: acc.assignedBranch,
      active: acc.active,
      createdAt: acc.createdAt,
    };
  }

  function sanitizeHttpUrl(raw: unknown, fallback: string): string {
    const val = String(raw ?? '').trim();
    if (!val) return fallback;
    try {
      const parsed = new URL(val);
      if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
        return parsed.toString();
      }
    } catch {
      // ignore invalid url
    }
    return fallback;
  }

  function getAuthAccount(req: express.Request): StoredAccount | null {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
    const token = authHeader.slice(7).trim();
    const accountId = activeTokens.get(token);
    if (!accountId) return null;
    const acc = storeData.accounts.find((a) => a.id === accountId && a.active);
    return acc || null;
  }

  // Allow cross-origin requests from Expo Go mobile app on Android / Termux
  app.use('/api', (req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
      res.status(204).end();
      return;
    }
    next();
  });

  app.use(express.json({ limit: '25mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({
      ok: true,
      aiConfigured: Boolean(process.env.GEMINI_API_KEY?.trim()),
      mapsConfigured: Boolean(
        process.env.VITE_GOOGLE_MAPS_API_KEY?.trim() || process.env.GOOGLE_MAPS_API_KEY?.trim(),
      ),
    });
  });

  app.get('/api/maps/config', (_req, res) => {
    const apiKey =
      process.env.VITE_GOOGLE_MAPS_API_KEY?.trim() ||
      process.env.GOOGLE_MAPS_API_KEY?.trim() ||
      '';
    res.json({ apiKey });
  });

  // Storefront Branch Directory & Auth Endpoints
  app.get('/api/store/branches', (_req, res) => {
    res.json({ branches: storeData.branches });
  });

  app.get('/api/auth/status', (_req, res) => {
    const hasOwner = storeData.accounts.some((a) => a.role === 'owner' && a.active);
    const passcodeRequired = Boolean(process.env.BELIKA_ADMIN_PASSCODE?.trim());
    res.json({ hasOwner, passcodeRequired });
  });

  app.post('/api/auth/claim-owner', (req, res) => {
    const existingOwner = storeData.accounts.some((a) => a.role === 'owner' && a.active);
    if (existingOwner) {
      res.status(409).json({ error: 'An Owner Admin account already exists. Please sign in.' });
      return;
    }
    const requiredPasscode = process.env.BELIKA_ADMIN_PASSCODE?.trim();
    if (requiredPasscode) {
      const provided = String(req.body?.passcode ?? '').trim();
      if (!provided || provided !== requiredPasscode) {
        res.status(403).json({ error: 'Invalid admin setup passcode.' });
        return;
      }
    }
    const name = String(req.body?.name ?? '').trim();
    const identifier = normalizeIdentifier(req.body?.identifier);
    const password = String(req.body?.password ?? '');
    if (!name || !identifier || password.length < 4) {
      res.status(400).json({ error: 'Name, phone/email login, and password (4+ chars) are required.' });
      return;
    }
    if (storeData.accounts.some((a) => a.identifier === identifier)) {
      res.status(409).json({ error: 'An account with this phone or email already exists.' });
      return;
    }
    const { salt, hash } = hashSecret(password);
    const account: StoredAccount = {
      id: `usr-${Date.now()}`,
      name,
      identifier,
      phone: identifier.includes('@') ? undefined : identifier,
      email: identifier.includes('@') ? identifier : undefined,
      role: 'owner',
      assignedBranch: 'All',
      active: true,
      salt,
      passwordHash: hash,
      createdAt: new Date().toISOString(),
    };
    storeData.accounts.push(account);
    savePersistedStore();
    const token = crypto.randomBytes(32).toString('hex');
    activeTokens.set(token, account.id);
    res.status(201).json({ token, user: toPublicUser(account) });
  });

  app.post('/api/auth/register', (req, res) => {
    const name = String(req.body?.name ?? '').trim();
    const identifier = normalizeIdentifier(req.body?.identifier);
    const password = String(req.body?.password ?? '');
    if (!name || !identifier || password.length < 4) {
      res.status(400).json({ error: 'Full name, phone or email, and a password (4+ chars) are required.' });
      return;
    }
    if (storeData.accounts.some((a) => a.identifier === identifier)) {
      res.status(409).json({ error: 'This phone number or email is already registered. Please sign in.' });
      return;
    }
    const { salt, hash } = hashSecret(password);
    const account: StoredAccount = {
      id: `usr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name,
      identifier,
      phone: identifier.includes('@') ? String(req.body?.phone ?? '').trim() || undefined : identifier,
      email: identifier.includes('@') ? identifier : undefined,
      role: 'customer',
      assignedBranch: 'All',
      active: true,
      salt,
      passwordHash: hash,
      createdAt: new Date().toISOString(),
    };
    storeData.accounts.push(account);
    savePersistedStore();
    const token = crypto.randomBytes(32).toString('hex');
    activeTokens.set(token, account.id);
    res.status(201).json({ token, user: toPublicUser(account) });
  });

  app.post('/api/auth/login', (req, res) => {
    const identifier = normalizeIdentifier(req.body?.identifier);
    const password = String(req.body?.password ?? '');
    if (!identifier || !password) {
      res.status(400).json({ error: 'Phone/email and password or PIN are required.' });
      return;
    }
    const account = storeData.accounts.find((a) => a.identifier === identifier);
    if (!account || !verifySecret(password, account.salt, account.passwordHash)) {
      res.status(401).json({ error: 'Invalid login credentials.' });
      return;
    }
    if (!account.active) {
      res.status(403).json({ error: 'This account is currently deactivated. Contact store admin.' });
      return;
    }
    const token = crypto.randomBytes(32).toString('hex');
    activeTokens.set(token, account.id);
    res.json({ token, user: toPublicUser(account) });
  });

  app.get('/api/auth/me', (req, res) => {
    const acc = getAuthAccount(req);
    if (!acc) {
      res.status(401).json({ error: 'Not signed in.' });
      return;
    }
    res.json({ user: toPublicUser(acc) });
  });

  app.post('/api/auth/logout', (req, res) => {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      activeTokens.delete(authHeader.slice(7).trim());
    }
    res.json({ ok: true });
  });

  app.get('/api/admin/staff', (req, res) => {
    const acc = getAuthAccount(req);
    if (!acc || acc.role !== 'owner') {
      res.status(403).json({ error: 'Owner Admin access required.' });
      return;
    }
    const staff = storeData.accounts
      .filter((a) => a.role === 'merchant' || a.role === 'owner')
      .map(toPublicUser);
    res.json({ staff });
  });

  app.post('/api/admin/staff', (req, res) => {
    const acc = getAuthAccount(req);
    if (!acc || acc.role !== 'owner') {
      res.status(403).json({ error: 'Owner Admin access required.' });
      return;
    }
    const name = String(req.body?.name ?? '').trim();
    const identifier = normalizeIdentifier(req.body?.identifier);
    const pin = String(req.body?.pin ?? '');
    const branchRaw = String(req.body?.assignedBranch ?? 'All');
    const assignedBranch: StoredAccount['assignedBranch'] =
      branchRaw === 'Men' || branchRaw === 'Women' || branchRaw === 'Kids' ? branchRaw : 'All';

    if (!name || !identifier || pin.length < 4) {
      res.status(400).json({ error: 'Merchant name, login phone/email, and PIN (4+ digits/chars) are required.' });
      return;
    }
    const existing = storeData.accounts.find((a) => a.identifier === identifier);
    const { salt, hash } = hashSecret(pin);
    if (existing) {
      if (existing.role === 'owner' && existing.id !== acc.id) {
        res.status(409).json({ error: 'Cannot overwrite another Owner account.' });
        return;
      }
      existing.name = name;
      existing.role = existing.role === 'owner' ? 'owner' : 'merchant';
      existing.assignedBranch = assignedBranch;
      existing.active = true;
      existing.salt = salt;
      existing.passwordHash = hash;
      savePersistedStore();
      res.json({ staff: toPublicUser(existing) });
      return;
    }
    const created: StoredAccount = {
      id: `stf-${Date.now()}`,
      name,
      identifier,
      phone: identifier.includes('@') ? undefined : identifier,
      email: identifier.includes('@') ? identifier : undefined,
      role: 'merchant',
      assignedBranch,
      active: true,
      salt,
      passwordHash: hash,
      createdAt: new Date().toISOString(),
    };
    storeData.accounts.push(created);
    savePersistedStore();
    res.status(201).json({ staff: toPublicUser(created) });
  });

  app.patch('/api/admin/staff/:id', (req, res) => {
    const acc = getAuthAccount(req);
    if (!acc || acc.role !== 'owner') {
      res.status(403).json({ error: 'Owner Admin access required.' });
      return;
    }
    const target = storeData.accounts.find((a) => a.id === req.params.id);
    if (!target) {
      res.status(404).json({ error: 'Staff account not found.' });
      return;
    }
    if (typeof req.body?.active === 'boolean' && target.id !== acc.id) {
      target.active = req.body.active;
    }
    const branchRaw = String(req.body?.assignedBranch ?? '');
    if (branchRaw === 'All' || branchRaw === 'Men' || branchRaw === 'Women' || branchRaw === 'Kids') {
      target.assignedBranch = branchRaw;
    }
    if (typeof req.body?.pin === 'string' && req.body.pin.trim().length >= 4) {
      const { salt, hash } = hashSecret(req.body.pin.trim());
      target.salt = salt;
      target.passwordHash = hash;
    }
    savePersistedStore();
    res.json({ staff: toPublicUser(target) });
  });

  app.delete('/api/admin/staff/:id', (req, res) => {
    const acc = getAuthAccount(req);
    if (!acc || acc.role !== 'owner') {
      res.status(403).json({ error: 'Owner Admin access required.' });
      return;
    }
    if (req.params.id === acc.id) {
      res.status(400).json({ error: 'You cannot delete the active Owner account.' });
      return;
    }
    storeData.accounts = storeData.accounts.filter((a) => a.id !== req.params.id);
    savePersistedStore();
    res.json({ ok: true });
  });

  app.put('/api/admin/branches', (req, res) => {
    const acc = getAuthAccount(req);
    if (!acc || acc.role !== 'owner') {
      res.status(403).json({ error: 'Owner Admin access required to edit branch info.' });
      return;
    }
    const incoming = req.body?.branches;
    if (!incoming || typeof incoming !== 'object') {
      res.status(400).json({ error: 'Invalid branches payload.' });
      return;
    }
    const nextBranches: Record<string, Record<string, unknown>> = { ...storeData.branches };
    for (const key of ['Women', 'Men', 'Kids'] as const) {
      const src = incoming[key];
      const base = nextBranches[key] || DEFAULT_SERVER_BRANCHES[key];
      if (!src || typeof src !== 'object') continue;
      nextBranches[key] = {
        ...base,
        title: String(src.title ?? base.title).trim().slice(0, 100),
        titleAm: String(src.titleAm ?? base.titleAm).trim().slice(0, 100),
        address: String(src.address ?? base.address).trim().slice(0, 220),
        addressAm: String(src.addressAm ?? base.addressAm).trim().slice(0, 220),
        landmark: String(src.landmark ?? base.landmark).trim().slice(0, 180),
        landmarkAm: String(src.landmarkAm ?? base.landmarkAm).trim().slice(0, 180),
        salesPhone: String(src.salesPhone ?? base.salesPhone).trim().slice(0, 40),
        supportPhone: String(src.supportPhone ?? base.supportPhone).trim().slice(0, 40),
        telegramChannel: sanitizeHttpUrl(src.telegramChannel, String(base.telegramChannel)),
        telegramSupport: sanitizeHttpUrl(src.telegramSupport, String(base.telegramSupport)),
        tiktokUrl: sanitizeHttpUrl(src.tiktokUrl, String(base.tiktokUrl)),
        mapsUrl: sanitizeHttpUrl(src.mapsUrl, String(base.mapsUrl)),
        hours: String(src.hours ?? base.hours).trim().slice(0, 100),
        hoursAm: String(src.hoursAm ?? base.hoursAm).trim().slice(0, 100),
        telebirrAccount: String(src.telebirrAccount ?? base.telebirrAccount).trim().slice(0, 60),
        cbeAccount: String(src.cbeAccount ?? base.cbeAccount).trim().slice(0, 60),
        coords:
          src.coords && Number.isFinite(Number(src.coords.lat)) && Number.isFinite(Number(src.coords.lng))
            ? { lat: Number(src.coords.lat), lng: Number(src.coords.lng) }
            : base.coords,
      };
    }
    storeData.branches = nextBranches;
    savePersistedStore();
    res.json({ branches: storeData.branches });
  });

  app.post('/api/support', (req, res) => {
    const customerName = String(req.body?.customerName ?? '').trim().slice(0, 80);
    const contact = String(req.body?.contact ?? '').trim().slice(0, 80);
    const message = String(req.body?.message ?? '').trim().slice(0, 800);
    const topic = String(req.body?.topic ?? 'Order Support').trim().slice(0, 80);
    const orderId = String(req.body?.orderId ?? '').trim().slice(0, 40) || undefined;
    const department = String(req.body?.department ?? '').trim().slice(0, 20) || undefined;
    if (!customerName || !contact || !message) {
      res.status(400).json({ error: 'Name, contact phone/email, and support message are required.' });
      return;
    }
    const created: StoredSupport = {
      id: `sup-${Date.now()}`,
      orderId,
      customerName,
      contact,
      department,
      topic,
      message,
      status: 'open',
      createdAt: new Date().toISOString(),
    };
    storeData.supportMessages.unshift(created);
    storeData.supportMessages = storeData.supportMessages.slice(0, 200);
    savePersistedStore();
    res.status(201).json({ supportMessage: created });
  });

  app.get('/api/support', (req, res) => {
    const acc = getAuthAccount(req);
    if (acc && (acc.role === 'merchant' || acc.role === 'owner')) {
      res.json({ messages: storeData.supportMessages });
      return;
    }
    const contactFilter = String(req.query.contact ?? '').trim().toLowerCase();
    if (contactFilter) {
      res.json({
        messages: storeData.supportMessages.filter(
          (m) => m.contact.toLowerCase() === contactFilter || (acc && m.contact.toLowerCase() === acc.identifier),
        ),
      });
      return;
    }
    res.json({ messages: [] });
  });

  app.patch('/api/support/:id', (req, res) => {
    const acc = getAuthAccount(req);
    if (!acc || (acc.role !== 'merchant' && acc.role !== 'owner')) {
      res.status(403).json({ error: 'Merchant or Owner access required.' });
      return;
    }
    const msg = storeData.supportMessages.find((m) => m.id === req.params.id);
    if (!msg) {
      res.status(404).json({ error: 'Support message not found.' });
      return;
    }
    if (typeof req.body?.reply === 'string') {
      msg.reply = req.body.reply.trim().slice(0, 800);
    }
    if (req.body?.status === 'open' || req.body?.status === 'resolved') {
      msg.status = req.body.status;
    }
    savePersistedStore();
    res.json({ supportMessage: msg });
  });

  app.get('/api/export-project.zip', async (_req, res) => {
    try {
      const zip = new JSZip();
      const rootDir = path.resolve(__dirname);
      const EXCLUDED_DIRS = new Set([
        'node_modules',
        'dist',
        '.git',
        '.gmp_cache',
        '.vite',
        '.aistudio',
      ]);
      const EXCLUDED_FILES = new Set([
        '.env',
        '.env.local',
        '.env.production',
        '.DS_Store',
        'server.js',
        '.belika_store_data.json',
      ]);

      const addDirectoryToZip = (currentDir: string, relPrefix: string) => {
        const entries = fs.readdirSync(currentDir, { withFileTypes: true });
        for (const entry of entries) {
          if (entry.isDirectory()) {
            if (EXCLUDED_DIRS.has(entry.name)) continue;
            const nextRel = relPrefix ? `${relPrefix}/${entry.name}` : entry.name;
            addDirectoryToZip(path.join(currentDir, entry.name), nextRel);
          } else if (entry.isFile()) {
            if (EXCLUDED_FILES.has(entry.name) || entry.name.startsWith('.env.')) {
              if (entry.name !== '.env.example') continue;
            }
            const filePath = path.join(currentDir, entry.name);
            const zipPath = relPrefix ? `${relPrefix}/${entry.name}` : entry.name;
            const content = fs.readFileSync(filePath);
            zip.file(zipPath, content);
          }
        }
      };

      addDirectoryToZip(rootDir, '');
      const buffer = await zip.generateAsync({
        type: 'nodebuffer',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 },
      });

      res.setHeader('Content-Type', 'application/zip');
      res.setHeader(
        'Content-Disposition',
        'attachment; filename="belika-online-store-full-project.zip"',
      );
      res.setHeader('Content-Length', String(buffer.length));
      res.send(buffer);
    } catch (error) {
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to build project ZIP archive.',
      });
    }
  });

  app.get('/api/export-expo.zip', async (_req, res) => {
    try {
      const zip = new JSZip();
      const expoAppPath = path.resolve(__dirname, 'expo/App.tsx');
      const expoAssetsDir = path.resolve(__dirname, 'expo/assets');

      if (!fs.existsSync(expoAppPath)) {
        res.status(404).json({ error: 'expo/App.tsx not found.' });
        return;
      }

      zip.file('App.tsx', fs.readFileSync(expoAppPath));

      if (fs.existsSync(expoAssetsDir)) {
        const assetFiles = fs.readdirSync(expoAssetsDir, { withFileTypes: true });
        for (const entry of assetFiles) {
          if (entry.isFile()) {
            zip.file(`assets/${entry.name}`, fs.readFileSync(path.join(expoAssetsDir, entry.name)));
          }
        }
      }

      const buffer = await zip.generateAsync({
        type: 'nodebuffer',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 },
      });

      res.setHeader('Content-Type', 'application/zip');
      res.setHeader(
        'Content-Disposition',
        'attachment; filename="belika-expo-bundle.zip"',
      );
      res.setHeader('Content-Length', String(buffer.length));
      res.send(buffer);
    } catch (error) {
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to build Expo bundle ZIP.',
      });
    }
  });

  app.use('/catalog-images', express.static(path.resolve(__dirname, 'src/assets/images')));

  app.get('/api/maps/reverse-geocode', async (req, res) => {
    const lat = Number(req.query.lat);
    const lng = Number(req.query.lng);
    const lang = req.query.language === 'am' ? 'am' : 'en';

    if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      res.status(400).json({ error: 'Invalid latitude or longitude coordinates.' });
      return;
    }

    const mapsKey =
      process.env.GOOGLE_MAPS_API_KEY?.trim() || process.env.VITE_GOOGLE_MAPS_API_KEY?.trim();
    if (!mapsKey) {
      res.status(503).json({ error: 'Google Maps API key is not configured on the server.' });
      return;
    }

    try {
      const url = new URL('https://maps.googleapis.com/maps/api/geocode/json');
      url.searchParams.set('latlng', `${lat},${lng}`);
      url.searchParams.set('language', lang);
      url.searchParams.set('key', mapsKey);

      const response = await fetch(url.toString());
      const data = (await response.json()) as {
        status?: string;
        error_message?: string;
        results?: Array<{
          formatted_address?: string;
          place_id?: string;
          address_components?: Array<{
            long_name: string;
            types: string[];
          }>;
        }>;
      };

      if (response.status === 429 || data.status === 'OVER_QUERY_LIMIT' || data.status === 'OVER_DAILY_LIMIT') {
        res.status(429).json({
          error: data.error_message || 'Google Maps Geocoding quota exceeded.',
          quotaExceeded: true,
        });
        return;
      }

      if (!response.ok || (data.status && data.status !== 'OK' && data.status !== 'ZERO_RESULTS')) {
        res.status(502).json({
          error: data.error_message || `Geocoding failed with status: ${data.status ?? response.status}`,
        });
        return;
      }

      const first = data.results?.[0];
      if (!first) {
        res.json({
          formattedAddress: `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
          neighborhood: '',
          subcity: '',
          placeId: '',
        });
        return;
      }

      const components = first.address_components ?? [];
      const findComponent = (types: string[]) =>
        components.find((comp) => types.some((t) => comp.types.includes(t)))?.long_name ?? '';

      res.json({
        formattedAddress: first.formatted_address ?? `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
        neighborhood: findComponent(['neighborhood', 'sublocality_level_2', 'sublocality_level_1', 'route']),
        subcity: findComponent(['sublocality_level_1', 'administrative_area_level_2', 'locality']),
        placeId: first.place_id ?? '',
      });
    } catch (error) {
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to reverse-geocode location.',
      });
    }
  });

  app.post('/api/ai/analyze-garment', async (req, res) => {
    const ai = getGeminiClient();
    if (!ai) {
      res.status(503).json({
        error: 'GEMINI_API_KEY is not configured. Add it in AI Studio Secrets to enable AI garment recognition.',
      });
      return;
    }

    const rawImages: unknown[] = Array.isArray(req.body?.images) && req.body.images.length > 0
      ? req.body.images.slice(0, 8)
      : req.body?.imageBase64
        ? [req.body.imageBase64]
        : [];

    const parsedImages: Array<{ data: string; mimeType: string }> = [];
    for (const raw of rawImages) {
      const parsed = parseImagePayload(raw, req.body?.mimeType);
      if (!parsed.ok) {
        res.status(400).json({ error: parsed.error });
        return;
      }
      parsedImages.push({ data: parsed.data, mimeType: parsed.mimeType });
    }

    if (parsedImages.length === 0) {
      res.status(400).json({ error: 'At least one garment image is required.' });
      return;
    }

    const note = typeof req.body?.note === 'string' ? req.body.note.trim().slice(0, 300) : '';
    const existingCategories = Array.isArray(req.body?.existingCategories)
      ? req.body.existingCategories.filter((c: unknown): c is string => typeof c === 'string').slice(0, 20)
      : [];

    const categoryHint = existingCategories.length
      ? `Prefer matching one of these store categories if appropriate: ${existingCategories.join(', ')}.`
      : 'Use standard fashion categories such as Dresses & Kemis, Tops & Polos, Jackets & Outerwear, Trousers & Denim, Footwear, or Accessories & Sets.';

    try {
      const imageParts = parsedImages.map((img) => ({
        inlineData: {
          data: img.data,
          mimeType: img.mimeType,
        },
      }));

      const response = await generateContentWithFallback(ai, {
        contents: [
          {
            role: 'user',
            parts: [
              ...imageParts,
              {
                text: `You are a fashion merchandiser and textile analyst for Belika Shop, a modern Ethiopian boutique in Addis Ababa.
You are analyzing ${parsedImages.length} photo(s) representing one product (often multiple color variants of the same garment).
Extract accurate catalog metadata:
${categoryHint}
${note ? `Merchant note: ${note}` : ''}
1. Inspect tags, collars, chest logos, embroidery, patches, prints, and hangtags closely to detect the BRAND name (for example "Jeep", "Polo Ralph Lauren", "Nike", "New Balance", "Zara", or "Belika Select" if no brand mark is visible).
2. Identify the exact product name in clear English and natural Amharic, including the brand if detected (for example, brand "Jeep" -> name "Jeep Short-Sleeve Pocket Utility Shirt").
3. Identify the exact material / fabric type (for example "100% Cotton Twill", "Pique Cotton Knit", "Washed Denim", "Linen Blend").
4. Select the department ("Men", "Women", or "Kids"), the best matching store "category", and the collection/style line in "subcategory" (for example "Utility Shirts", "Streetwear", "Everyday Polos", "Evening Kemis").
5. Inspect EVERY uploaded photo from 1 to ${parsedImages.length} and list EVERY distinct garment color across all photos with CSS hex codes (#RRGGBB), English names, and Amharic names in "colors", plus "perImageColors" of length ${parsedImages.length} in exact photo order.`,
              },
            ],
          },
        ],
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              nameAm: { type: Type.STRING },
              brand: { type: Type.STRING },
              department: { type: Type.STRING, enum: ['Men', 'Women', 'Kids'] },
              category: { type: Type.STRING },
              subcategory: { type: Type.STRING },
              colors: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    nameAm: { type: Type.STRING },
                    hex: { type: Type.STRING },
                  },
                  required: ['name', 'nameAm', 'hex'],
                },
              },
              perImageColors: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              pattern: { type: Type.STRING },
              fabric: { type: Type.STRING },
              suggestedPriceEtb: { type: Type.INTEGER },
              recommendedSizes: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              sizeGuidance: { type: Type.STRING },
              sizeGuidanceAm: { type: Type.STRING },
              styleTags: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              customizable: { type: Type.BOOLEAN },
              description: { type: Type.STRING },
            },
            required: [
              'name',
              'nameAm',
              'brand',
              'department',
              'category',
              'subcategory',
              'colors',
              'perImageColors',
              'pattern',
              'fabric',
              'suggestedPriceEtb',
              'recommendedSizes',
              'sizeGuidance',
              'sizeGuidanceAm',
              'styleTags',
              'customizable',
              'description',
            ],
          },
        },
      });

      const text = response.text;
      if (!text) {
        res.status(502).json({ error: 'AI returned an empty analysis response.' });
        return;
      }

      const data = JSON.parse(text);
      data.colors = normalizeColors(data.colors);
      res.json(data);
    } catch (error) {
      if (isQuotaError(error)) {
        res.status(429).json({ error: 'Gemini AI rate limit reached. Please retry shortly.' });
        return;
      }
      if (isTransientUnavailableError(error)) {
        res.status(503).json({
          error: 'Gemini AI is temporarily experiencing high demand. Wait a few seconds and tap AI Recognize again.',
        });
        return;
      }
      res.status(502).json({
        error: error instanceof Error ? error.message : 'Failed to analyze garment image.',
      });
    }
  });

  app.post('/api/ai/visual-search', async (req, res) => {
    const ai = getGeminiClient();
    if (!ai) {
      res.status(503).json({
        error: 'GEMINI_API_KEY is not configured. Visual search requires a Gemini API key.',
      });
      return;
    }

    const parsedImage = parseImagePayload(req.body?.imageBase64, req.body?.mimeType);
    if (!parsedImage.ok) {
      res.status(400).json({ error: parsedImage.error });
      return;
    }

    const rawCatalog = Array.isArray(req.body?.catalog) ? req.body.catalog : [];
    const catalog = rawCatalog.slice(0, 120).map((item: Record<string, unknown>) => ({
      id: String(item.id ?? ''),
      name: String(item.name ?? ''),
      nameAm: String(item.nameAm ?? ''),
      department: String(item.department ?? ''),
      category: String(item.category ?? ''),
      subcategory: String(item.subcategory ?? ''),
      colors: Array.isArray(item.colors) ? item.colors : [],
      styleTags: Array.isArray(item.styleTags) ? item.styleTags : [],
      price: Number(item.price ?? 0),
    }));

    try {
      const response = await generateContentWithFallback(ai, {
        contents: [
          {
            role: 'user',
            parts: [
              {
                inlineData: {
                  data: parsedImage.data,
                  mimeType: parsedImage.mimeType,
                },
              },
              {
                text: `You are Belika Shop's visual search engine.
1. Inspect the uploaded fashion photo: identify the garment/shoe/accessory, its likely department (Men, Women, Kids, or All), category, visible colors (with CSS #RRGGBB hex codes + English & Amharic names), and style keywords.
2. Rank the best matching products from this Belika catalog JSON based on garment type, silhouette, color palette, department, and style similarity. Return only real IDs from the catalog.

Catalog:
${JSON.stringify(catalog)}`,
              },
            ],
          },
        ],
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              detectedItem: { type: Type.STRING },
              detectedItemAm: { type: Type.STRING },
              department: { type: Type.STRING, enum: ['All', 'Men', 'Women', 'Kids'] },
              category: { type: Type.STRING },
              colors: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    nameAm: { type: Type.STRING },
                    hex: { type: Type.STRING },
                  },
                  required: ['name', 'nameAm', 'hex'],
                },
              },
              styleKeywords: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              matches: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    score: { type: Type.INTEGER },
                    reason: { type: Type.STRING },
                    reasonAm: { type: Type.STRING },
                  },
                  required: ['id', 'score', 'reason', 'reasonAm'],
                },
              },
            },
            required: [
              'detectedItem',
              'detectedItemAm',
              'department',
              'category',
              'colors',
              'styleKeywords',
              'matches',
            ],
          },
        },
      });

      const text = response.text;
      if (!text) {
        res.status(502).json({ error: 'Visual search returned an empty response.' });
        return;
      }

      const data = JSON.parse(text);
      data.colors = normalizeColors(data.colors);
      res.json(data);
    } catch (error) {
      if (isQuotaError(error)) {
        res.status(429).json({ error: 'Gemini AI rate limit reached. Please retry shortly.' });
        return;
      }
      if (isTransientUnavailableError(error)) {
        res.status(503).json({
          error: 'Gemini AI is temporarily experiencing high demand. Wait a few seconds and try again.',
        });
        return;
      }
      res.status(502).json({
        error: error instanceof Error ? error.message : 'Visual search failed.',
      });
    }
  });

  if (IS_PRODUCTION) {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Belika Shop server running on http://0.0.0.0:${PORT}`);
  });
}

void startServer();
