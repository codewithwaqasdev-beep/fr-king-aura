import { createFileRoute } from "@tanstack/react-router";
import { CURRENCY_PAIRS } from "@/app/constants";

// Single API router mirroring the original Express backend (/api/*), backed by Lovable Cloud.
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey",
};
const json = (data: unknown, status = 200) => Response.json(data, { status, headers: CORS });
const DEFAULT_PW = "FRK@2026#WaqasKing!Secure9x";
const PUBLIC_SCHEMA_ERROR =
  "The Supabase project does not expose the public schema. In Supabase Dashboard, open Project Settings > API > Exposed schemas, add public, and save. Then apply the database migration.";
interface CandleIntervalConfig {
  providerInterval: string;
  factor: number;
  bucketMilliseconds?: number;
  calendarMonths?: boolean;
}
const CANDLE_INTERVALS: Record<string, CandleIntervalConfig> = {
  "1m": { providerInterval: "1min", factor: 1 },
  "3m": { providerInterval: "1min", factor: 3, bucketMilliseconds: 3 * 60000 },
  "5m": { providerInterval: "5min", factor: 1 },
  "15m": { providerInterval: "15min", factor: 1 },
  "30m": { providerInterval: "30min", factor: 1 },
  "45m": { providerInterval: "45min", factor: 1 },
  "1h": { providerInterval: "1h", factor: 1 },
  "2h": { providerInterval: "2h", factor: 1 },
  "3h": { providerInterval: "1h", factor: 3, bucketMilliseconds: 3 * 3600000 },
  "4h": { providerInterval: "4h", factor: 1 },
  "1d": { providerInterval: "1day", factor: 1 },
  "1w": { providerInterval: "1week", factor: 1 },
  "1mo": { providerInterval: "1month", factor: 1 },
  "3mo": { providerInterval: "1month", factor: 3, calendarMonths: true },
  "6mo": { providerInterval: "1month", factor: 6, calendarMonths: true },
  "12mo": { providerInterval: "1month", factor: 12, calendarMonths: true },
};
const candleCache = new Map<
  string,
  { expiresAt: number; candles: MarketCandle[] }
>();
const DAY = 86400000;
const DUR: Record<string, number> = {
  "1 Day": 1, "2 Days": 2, "3 Days": 3, "5 Days": 5, "1 Week": 7, "15 Days": 15,
  "1 Month": 30, "3 Months": 90, "6 Months": 180, "1 Year": 365,
};
interface MarketCandle {
  datetime: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

function aggregateCandles(
  candles: MarketCandle[],
  config: CandleIntervalConfig,
): MarketCandle[] {
  if (config.factor === 1) return candles.slice(-48);

  const grouped = new Map<number, MarketCandle[]>();
  for (const candle of candles) {
    let bucket: number;
    if (config.calendarMonths) {
      const month = new Date(`${candle.datetime.replace(" ", "T")}Z`);
      const monthIndex = month.getUTCFullYear() * 12 + month.getUTCMonth();
      bucket = Math.floor(monthIndex / config.factor) * config.factor;
    } else {
      const timestamp = new Date(`${candle.datetime.replace(" ", "T")}Z`).getTime();
      bucket = Math.floor(timestamp / (config.bucketMilliseconds ?? 1));
    }

    const bucketCandles = grouped.get(bucket);
    if (bucketCandles) bucketCandles.push(candle);
    else grouped.set(bucket, [candle]);
  }

  return [...grouped.entries()]
    .sort(([left], [right]) => left - right)
    .slice(-48)
    .map(([bucket, values]) => {
      const first = values[0];
      const last = values[values.length - 1];
      const datetime = config.calendarMonths
        ? (() => {
            const year = Math.floor(bucket / 12);
            const month = bucket % 12;
            return `${year}-${String(month + 1).padStart(2, "0")}-01 00:00:00`;
          })()
        : new Date(bucket * (config.bucketMilliseconds ?? 1)).toISOString().replace("T", " ").slice(0, 19);
      const volumes = values.map(({ volume }) => volume);
      return {
        datetime,
        open: first.open,
        high: Math.max(...values.map(({ high }) => high)),
        low: Math.min(...values.map(({ low }) => low)),
        close: last.close,
        volume: volumes.every((volume) => volume !== undefined)
          ? volumes.reduce((sum, volume) => sum + (volume ?? 0), 0)
          : undefined,
      };
    });
}

async function getMarketCandles(request: Request) {
  const url = new URL(request.url);
  const symbol = url.searchParams.get("symbol") ?? "";
  const interval = url.searchParams.get("interval") ?? "";

  const intervalConfig = CANDLE_INTERVALS[interval];
  if (!CURRENCY_PAIRS.includes(symbol) || !intervalConfig) {
    return json({ ok: false, error: "Unsupported forex pair or chart interval." }, 400);
  }

  const apiKey = process.env["TWELVE_DATA_API_KEY"];
  if (!apiKey) {
    return json({ ok: false, error: "Twelve Data API key is not configured on the server." }, 503);
  }

  const cacheKey = `${symbol}:${interval}`;
  const cached = candleCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return json({ ok: true, symbol, interval, candles: cached.candles });
  }

  const providerUrl = new URL("https://api.twelvedata.com/time_series");
  providerUrl.searchParams.set("symbol", symbol);
  providerUrl.searchParams.set("interval", intervalConfig.providerInterval);
  providerUrl.searchParams.set("outputsize", String(Math.min(5000, 48 * intervalConfig.factor)));
  providerUrl.searchParams.set("timezone", "UTC");
  providerUrl.searchParams.set("apikey", apiKey);

  try {
    const response = await fetch(providerUrl, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(10000),
    });
    const payload = (await response.json()) as {
      values?: Array<Record<string, unknown>>;
      message?: string;
      status?: string;
    };

    if (!response.ok || !Array.isArray(payload.values)) {
      const error =
        typeof payload.message === "string"
          ? payload.message.slice(0, 240)
          : "Market data provider returned an invalid response.";
      return json({ ok: false, error }, 502);
    }

    const candles = payload.values
      .map((value) => ({
        datetime: String(value.datetime ?? ""),
        open: Number(value.open),
        high: Number(value.high),
        low: Number(value.low),
        close: Number(value.close),
        volume:
          value.volume !== undefined &&
          value.volume !== null &&
          String(value.volume).trim() !== "" &&
          Number.isFinite(Number(value.volume))
            ? Number(value.volume)
            : undefined,
      }))
      .filter(
        (candle) =>
          candle.datetime.length > 0 &&
          !Number.isNaN(new Date(`${candle.datetime.replace(" ", "T")}Z`).getTime()) &&
          [candle.open, candle.high, candle.low, candle.close].every(Number.isFinite),
      )
      .reverse();

    const chartCandles = aggregateCandles(candles, intervalConfig);
    if (chartCandles.length === 0) {
      return json({ ok: false, error: "No forex candles are available for this pair." }, 502);
    }

    candleCache.set(cacheKey, { candles: chartCandles, expiresAt: Date.now() + 60000 });
    if (candleCache.size > 64) {
      const oldestKey = candleCache.keys().next().value;
      if (oldestKey) candleCache.delete(oldestKey);
    }

    return json({ ok: true, symbol, interval, candles: chartCandles });
  } catch {
    return json({ ok: false, error: "Unable to reach the market data provider." }, 502);
  }
}
export function calculateExpiry(label: string) {
  if (label === "Lifetime") return { expires_at: null as string | null, lifetime: true };
  return { expires_at: new Date(Date.now() + (DUR[label] ?? 30) * DAY).toISOString(), lifetime: false };
}

async function db() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin as any;
}
async function getConfig(sb: any) {
  const { data } = await sb.from("app_config").select("data").eq("id", 1).maybeSingle();
  return (data?.data ?? {}) as any;
}
const isAdmin = (cfg: any, pw: unknown) => typeof pw === "string" && pw.length > 0 && pw === (cfg.adminPassword || DEFAULT_PW);
const rnd = () => Math.floor(1000 + Math.random() * 9000);

async function createLicense(sb: any, i: any) {
  const duration = i.duration || "1 Month";
  const exp = calculateExpiry(duration);
  const now = new Date().toISOString();
  const lic = {
    id: `lic_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    license_key: (i.custom_key?.trim().toUpperCase()) || `FRK-${rnd()}-${rnd()}-${rnd()}`,
    full_name: String(i.full_name).trim().slice(0, 200),
    phone: String(i.phone).trim().slice(0, 50),
    email: String(i.email).trim().slice(0, 200),
    amount: String(i.amount || "Paid").trim().slice(0, 100),
    status: i.status || "pending",
    duration_label: duration,
    ...exp,
    max_devices: Number(i.max_devices) || 1,
    license_devices: [],
    created_at: now,
    updated_at: now,
  };
  const { error } = await sb.from("licenses").insert(lic);
  if (error) {
    if (error.code === "23505") throw new Error("License key already exists.");
    if (error.code === "PGRST106" && error.message === "Invalid schema: public") {
      throw new Error(PUBLIC_SCHEMA_ERROR);
    }
    throw new Error(error.message);
  }
  return lic;
}

async function handle(request: Request, path: string) {
  if (path === "market/candles") {
    if (request.method !== "GET") {
      return json({ ok: false, error: "Method not allowed." }, 405);
    }
    return getMarketCandles(request);
  }

  const sb = await db();
  const method = request.method;
  const body: any = method === "POST" ? await request.json().catch(() => ({})) : {};

  if (path === "health") return json({ ok: true, service: "FR-KING AURA Terminal Backend", status: "online", timestamp: new Date().toISOString() });

  if (path === "config") {
    const cfg = await getConfig(sb);
    if (method === "GET") { const { adminPassword, ...safe } = cfg; return json(safe); }
    if (!isAdmin(cfg, body.password)) return json({ ok: false, error: "Unauthorized: Invalid admin password." }, 401);
    const u: any = {};
    for (const k of ["apiKey", "supabaseUrl", "supabaseAnonKey", "authMode"]) if (body[k] !== undefined) u[k] = body[k];
    if (body.allowMasterApiKeyBypass !== undefined) u.allowMasterApiKeyBypass = Boolean(body.allowMasterApiKeyBypass);
    if (typeof body.adminPassword === "string" && body.adminPassword.trim()) u.adminPassword = body.adminPassword.trim();
    const next = { ...cfg, ...u };
    await sb.from("app_config").update({ data: next }).eq("id", 1);
    const { adminPassword, ...safe } = next;
    return json({ ok: true, config: safe });
  }

  if (path === "verify-key") {
    if (!body.key || typeof body.key !== "string") return json({ ok: false, error: "License key is required." }, 400);
    const key = body.key.trim().toUpperCase();
    const device = typeof body.device === "string" ? body.device.trim().slice(0, 200) : "device-unknown";
    const cfg = await getConfig(sb);
    if (cfg.allowMasterApiKeyBypass && cfg.apiKey && key === String(cfg.apiKey).toUpperCase()) {
      return json({ ok: true, license: { id: "master_api_key", license_key: key, full_name: "VIP Master Admin", status: "approved", lifetime: true, duration_label: "Master API Key", max_devices: 999, license_devices: [device], created_at: new Date().toISOString() } });
    }
    const { data: lic } = await sb.from("licenses").select("*").ilike("license_key", key).maybeSingle();
    if (!lic) return json({ ok: false, error: "License key not found. Please register or contact @codetrader to purchase." });
    if (lic.status === "blocked") return json({ ok: false, error: "This license has been blocked by administrator." });
    if (lic.status === "pending") return json({ ok: false, error: "Payment verification pending. Please wait for admin approval in the Admin Panel." });
    if (!lic.lifetime && lic.expires_at && new Date(lic.expires_at) < new Date())
      return json({ ok: false, error: `License key expired on ${new Date(lic.expires_at).toLocaleDateString()}. Please renew with admin.` });
    const devices: string[] = lic.license_devices || [];
    if (!devices.some((d) => d.trim().toLowerCase() === device.toLowerCase())) {
      if (devices.length >= lic.max_devices)
        return json({ ok: false, error: `Device limit reached (${devices.length}/${lic.max_devices} bound). Please ask admin to reset devices or upgrade limit.` });
      devices.push(device);
      lic.license_devices = devices;
      lic.updated_at = new Date().toISOString();
      await sb.from("licenses").update({ license_devices: devices, updated_at: lic.updated_at }).eq("id", lic.id);
    }
    return json({ ok: true, license: lic });
  }

  if (path === "register-key") {
    if (!body.full_name || !body.phone || !body.email) return json({ ok: false, error: "Full name, phone, and Gmail are required." }, 400);
    try {
      const lic = await createLicense(sb, { full_name: body.full_name, phone: body.phone, email: body.email, amount: body.amount || "Pending Payment", duration: "1 Month", max_devices: 1, status: "pending" });
      return json({ ok: true, key: lic.license_key, license: lic });
    } catch (e: any) { return json({ ok: false, error: e.message || "Registration failed." }, 500); }
  }

  if (path.startsWith("admin/")) {
    const cfg = await getConfig(sb);
    if (!isAdmin(cfg, body.password)) return json({ ok: false, error: path === "admin/login" ? "Invalid admin password." : "Invalid admin credentials." }, 401);
    if (path === "admin/login") return json({ ok: true });
    if (path === "admin/keys") {
      const { data } = await sb.from("licenses").select("*").order("created_at", { ascending: false });
      return json({ ok: true, keys: data ?? [] });
    }
    if (path === "admin/create-key") {
      try {
        const lic = await createLicense(sb, { custom_key: body.custom_key, full_name: body.full_name || "VIP Client", phone: body.phone || "+966554573612", email: body.email || "client@frkings.pro", amount: "Admin Minted", duration: body.duration || "1 Month", max_devices: body.max_devices || 1, status: "approved" });
        return json({ ok: true, license: lic });
      } catch (e: any) { return json({ ok: false, error: e.message || "Failed to mint key." }, 500); }
    }
    if (path === "admin/action") {
      const { id, action, duration, max_devices, deviceId } = body;
      if (!id || !action) return json({ ok: false, error: "License ID and action are required." }, 400);
      const { data: lic } = await sb.from("licenses").select("*").or(`id.eq.${String(id).replace(/[,()]/g, "")},license_key.eq.${String(id).replace(/[,()]/g, "")}`).maybeSingle();
      if (!lic) return json({ ok: false, error: "License not found." }, 400);
      if (action === "delete") { await sb.from("licenses").delete().eq("id", lic.id); return json({ ok: true }); }
      const u: any = { updated_at: new Date().toISOString() };
      if (action === "approve") {
        u.status = "approved";
        if (duration) { u.duration_label = duration; Object.assign(u, calculateExpiry(duration)); }
        if (Number(max_devices) > 0) u.max_devices = Number(max_devices);
      } else if (action === "block") u.status = "blocked";
      else if (action === "reset_devices") u.license_devices = [];
      else if (action === "remove_device" && deviceId)
        u.license_devices = (lic.license_devices || []).filter((d: string) => d.trim().toLowerCase() !== String(deviceId).trim().toLowerCase());
      else return json({ ok: false, error: `Unknown action: ${action}` }, 400);
      const { data: updated } = await sb.from("licenses").update(u).eq("id", lic.id).select("*").single();
      return json({ ok: true, license: updated });
    }
  }

  if (path === "supabase/test") {
    if (!body.url) return json({ ok: false, error: "Supabase URL is required." }, 400);
    try {
      const h: any = {};
      if (body.key) { h.apikey = body.key; h.Authorization = `Bearer ${body.key}`; }
      const r = await fetch(`${String(body.url).replace(/\/+$/, "")}/rest/v1/`, { headers: h });
      if ([200, 401, 404].includes(r.status) || r.ok) return json({ ok: true, message: "Successfully reached Supabase URL endpoint.", tableStatus: "Active" });
      return json({ ok: false, error: `Supabase returned HTTP status ${r.status}` });
    } catch (e: any) { return json({ ok: false, error: `Could not reach ${body.url}: ${e.message || "Network error"}` }); }
  }

  if (path === "signals") {
    if (method === "GET") {
      const { data } = await sb.from("signals").select("*").order("created_at", { ascending: false }).limit(50);
      return json({ ok: true, signals: data ?? [] });
    }
    const s = body.signal;
    if (!s || !s.pair || !s.direction) return json({ ok: false, error: "Invalid signal payload." }, 400);
    const rec = { id: String(s.id || `sig_${Date.now()}`).slice(0, 100), pair: String(s.pair), market: s.market, timer: s.timer, mode: s.mode, direction: s.direction, entry: s.entry, expiry: s.expiry, accuracy: s.accuracy != null ? String(s.accuracy) : null, strength: s.strength != null ? String(s.strength) : null, created_at: new Date().toISOString() };
    await sb.from("signals").upsert(rec);
    return json({ ok: true, signal: rec });
  }

  return json({ ok: false, error: "Not found" }, 404);
}

export const Route = createFileRoute("/api/public/$")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),
      GET: async ({ request, params }) => handle(request, params._splat ?? ""),
      POST: async ({ request, params }) => handle(request, params._splat ?? ""),
    },
  },
});
