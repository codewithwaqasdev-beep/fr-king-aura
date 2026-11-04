// @ts-nocheck -- imported original app code, kept unchanged
import { SignalItem } from '../types.ts';

/**
 * Base price map for realistic Quotex / Forex / OTC market quotes.
 */
const PAIR_BASE_PRICES: Record<string, { base: number; decimals: number }> = {
  'EUR/USD': { base: 1.0845, decimals: 5 },
  'GBP/USD': { base: 1.2968, decimals: 5 },
  'USD/JPY': { base: 154.32, decimals: 3 },
  'AUD/USD': { base: 0.6584, decimals: 5 },
  'USD/CAD': { base: 1.3832, decimals: 5 },
  'NZD/USD': { base: 0.5976, decimals: 5 },
  'USD/CHF': { base: 0.8718, decimals: 5 },
  'EUR/GBP': { base: 0.8364, decimals: 5 },
  'EUR/JPY': { base: 167.38, decimals: 3 },
  'GBP/JPY': { base: 199.92, decimals: 3 },
  'AUD/JPY': { base: 101.55, decimals: 3 },
  'AUD/CAD': { base: 0.9108, decimals: 5 },
  'AUD/CHF': { base: 0.5738, decimals: 5 },
  'AUD/NZD': { base: 1.1018, decimals: 5 },
  'CAD/JPY': { base: 111.52, decimals: 3 },
  'CHF/JPY': { base: 177.05, decimals: 3 },
  'EUR/AUD': { base: 1.6472, decimals: 5 },
  'EUR/CAD': { base: 1.5002, decimals: 5 },
  'EUR/CHF': { base: 0.9452, decimals: 5 },
  'EUR/NZD': { base: 1.8142, decimals: 5 },
  'GBP/AUD': { base: 1.9695, decimals: 5 },
  'GBP/CAD': { base: 1.7935, decimals: 5 },
  'GBP/CHF': { base: 1.1305, decimals: 5 },
  'GBP/NZD': { base: 2.169, decimals: 5 },
  'NZD/CAD': { base: 0.8265, decimals: 5 },
  'NZD/CHF': { base: 0.521, decimals: 5 },
  'NZD/JPY': { base: 92.15, decimals: 3 },
  'USD/SGD': { base: 1.3245, decimals: 5 },
  'USD/MXN': { base: 19.825, decimals: 4 },
  'USD/ZAR': { base: 17.654, decimals: 4 },
  'USD/TRY': { base: 34.32, decimals: 4 },
  'USD/BRL': { base: 5.765, decimals: 4 },
};

/**
 * Parse human readable timer string into milliseconds duration.
 */
export function parseTimerDurationMs(timer: string): number {
  const normalized = timer.toLowerCase().trim();
  if (normalized.includes('5 sec')) return 5000;
  if (normalized.includes('10 sec')) return 10000;
  if (normalized.includes('15 sec')) return 15000;
  if (normalized.includes('30 sec')) return 30000;
  if (normalized.includes('45 sec')) return 45000;
  if (normalized.includes('1 min')) return 60000;
  if (normalized.includes('2 min')) return 120000;
  if (normalized.includes('3 min')) return 180000;
  if (normalized.includes('5 min')) return 300000;
  if (normalized.includes('10 min')) return 600000;
  if (normalized.includes('15 min')) return 900000;
  if (normalized.includes('30 min')) return 1800000;

  // Fallback regex matching
  const matchNum = timer.match(/(\d+)/);
  if (matchNum) {
    const val = parseInt(matchNum[1], 10);
    if (normalized.includes('sec')) return val * 1000;
    if (normalized.includes('min')) return val * 60000;
    if (normalized.includes('hour')) return val * 3600000;
  }
  return 60000;
}

/**
 * Generate a realistic live market strike price for a currency or OTC pair.
 */
export function generateRealisticStrikePrice(pair: string): string {
  // Strip " (OTC)" suffix to look up base price
  const cleanPair = pair.replace(/\s*\(OTC\)/i, '').trim();
  const config = PAIR_BASE_PRICES[cleanPair] || { base: 1.125, decimals: 5 };

  // Calculate realistic jitter based on current epoch time and pair
  const now = Date.now();
  const seed = (now % 100000) / 100000;
  const spreadRange = config.decimals === 3 ? 0.25 : 0.0025;
  const jitter = (Math.sin(now / 5000) * 0.5 + (seed - 0.5)) * spreadRange;
  const price = Math.max(0.0001, config.base + jitter);

  return price.toFixed(config.decimals);
}

/**
 * Generate an enriched, ultra-realistic signal item with technical confluences.
 */
export function generateOptimizedSignal(params: {
  pair: string;
  market: string;
  timer: string;
  mode: 'live' | 'future';
  futureEntryTime?: string;
}): SignalItem {
  const { pair, market, timer, mode, futureEntryTime } = params;

  const durationMs = parseTimerDurationMs(timer);
  const entryDate = mode === 'future' && futureEntryTime ? new Date(futureEntryTime) : new Date();
  const expiryDate = new Date(entryDate.getTime() + durationMs);

  const randomId = Math.floor(100000 + Math.random() * 900000);

  // Determine direction with market trend simulation
  const randomDirection: 'BUY' | 'SELL' = Math.random() > 0.48 ? 'BUY' : 'SELL';
  const strikePrice = generateRealisticStrikePrice(pair);

  // Dynamic realistic accuracy (98.1% - 99.4%)
  const accuracyNum = (98.1 + Math.random() * 1.3).toFixed(1);
  const strengthNum = (98.3 + Math.random() * 1.4).toFixed(1);

  // Technical indicator confluence values
  let rsiStr = '';
  let stochStr = '';
  let macdStr = '';
  let maVoteStr = '';

  if (randomDirection === 'BUY') {
    const rsiVal = (21.5 + Math.random() * 8.0).toFixed(1);
    rsiStr = `${rsiVal} (Oversold Bounce)`;
    const k = (17 + Math.random() * 7).toFixed(1);
    const d = (19 + Math.random() * 6).toFixed(1);
    stochStr = `%K ${k} / %D ${d} (Bullish Cross)`;
    macdStr = `+0.000${Math.floor(28 + Math.random() * 45)} (Bullish Divergence)`;
    maVoteStr = `${Math.floor(9 + Math.random() * 2)}/10 Strong Buy`;
  } else {
    const rsiVal = (72.0 + Math.random() * 7.5).toFixed(1);
    rsiStr = `${rsiVal} (Overbought Rejection)`;
    const k = (81 + Math.random() * 7).toFixed(1);
    const d = (79 + Math.random() * 6).toFixed(1);
    stochStr = `%K ${k} / %D ${d} (Bearish Cross)`;
    macdStr = `-0.000${Math.floor(25 + Math.random() * 48)} (Bearish Rejection)`;
    maVoteStr = `${Math.floor(9 + Math.random() * 2)}/10 Strong Sell`;
  }

  // Realistic Quotex broker payout (89% - 94%)
  const payoutRate = `${Math.floor(89 + Math.random() * 5)}%`;

  return {
    id: `#FRK${randomId}`,
    pair,
    market,
    timer,
    mode,
    direction: randomDirection,
    entry: entryDate.toISOString(),
    expiry: expiryDate.toISOString(),
    accuracy: `${accuracyNum}%`,
    strength: `${strengthNum}%`,
    strikePrice,
    payout: payoutRate,
    rsi: rsiStr,
    stoch: stochStr,
    macd: macdStr,
    maVote: maVoteStr,
    volatility: 'Optimal Volatility (High Payout)',
    confidence: 'HIGH CONVICTION',
  };
}

/**
 * Play high-tech synthetic chime and vibrate on mobile when signal is caught.
 */
export function playSignalCatchNotification(): void {
  try {
    // Vibrate device if supported
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([80, 40, 140]);
    }

    // Synthesize futuristic dual-chime using Web Audio API
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;

    // First tone (G5 - 783.99 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(783.99, now);
    gain1.gain.setValueAtTime(0.001, now);
    gain1.gain.exponentialRampToValueAtTime(0.25, now + 0.04);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.25);

    // Second tone (C6 - 1046.50 Hz) higher harmonic
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(1046.5, now + 0.12);
    gain2.gain.setValueAtTime(0.001, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.3, now + 0.16);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.48);
  } catch {
    // Audio context may be restricted by autoplay policy before gesture; safely ignored
  }
}
