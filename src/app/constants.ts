// @ts-nocheck -- imported original app code, kept unchanged
export const WHATSAPP_URL = 'https://chat.whatsapp.com/G1yKmNVIntiLx7c9KX5zEu';
export const TELEGRAM_URL = 'https://t.me/frking00';
export const PHONE_NUMBER = '+966554573612';
export const DEV_HANDLE = '@codetrader';

export const CURRENCY_PAIRS = [
  'EUR/USD', 'GBP/USD', 'USD/JPY', 'AUD/USD', 'USD/CAD', 'NZD/USD', 'USD/CHF',
  'EUR/GBP', 'EUR/JPY', 'GBP/JPY', 'AUD/JPY', 'AUD/CAD', 'AUD/CHF', 'AUD/NZD',
  'CAD/JPY', 'CHF/JPY', 'EUR/AUD', 'EUR/CAD', 'EUR/CHF', 'EUR/NZD', 'GBP/AUD',
  'GBP/CAD', 'GBP/CHF', 'GBP/NZD', 'NZD/CAD', 'NZD/CHF', 'NZD/JPY', 'USD/SGD',
  'USD/MXN', 'USD/ZAR', 'USD/TRY', 'USD/BRL'
];

export const OTC_PAIRS = CURRENCY_PAIRS.map((p) => `${p} (OTC)`);

export const LIVE_TIMERS = [
  '5 Seconds', '10 Seconds', '15 Seconds', '30 Seconds', '45 Seconds', '1 Minute'
];

export const FUTURE_TIMERS = [
  '1 Minute', '2 Minutes', '3 Minutes', '5 Minutes', '10 Minutes', '15 Minutes', '30 Minutes'
];

export const PLAN_DURATIONS = [
  '1 Day', '2 Days', '3 Days', '5 Days', '1 Week', '15 Days',
  '1 Month', '3 Months', '6 Months', '1 Year', 'Lifetime'
];

export const FAQ_ITEMS = [
  {
    q: 'What is FR-KING AI Bot Pro?',
    a: 'FR-KING AI Bot Pro is an AI-powered signal terminal for Quotex OTC and live markets, providing high-accuracy BUY/SELL signals with live and future modes.',
  },
  {
    q: 'How do I activate my license?',
    a: 'Tap Register, fill your real name, number with country code, Gmail and paid amount to get your key. After admin approves your payment, enter the key in Active Key to log in.',
  },
  {
    q: 'What is the difference between LIVE and FUTURE signals?',
    a: 'LIVE signals are for immediate execution. FUTURE signals let you pick an upcoming entry time so you can prepare your trade in advance.',
  },
  {
    q: 'Which broker is supported?',
    a: 'The bot is optimized for Quotex, covering both OTC and live market pairs.',
  },
  {
    q: 'Are the signals guaranteed?',
    a: 'No signal is guaranteed. Signals are AI-generated simulations for reference only — always trade responsibly.',
  },
];

export function formatTime(isoString: string): string {
  try {
    return new Date(isoString).toLocaleTimeString('en-GB', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return isoString;
  }
}

export function calculateDeterministicStats(period: 'today' | 'weekly' | 'monthly', seedDate = new Date().toDateString()) {
  const configs = {
    today: [80, 92, 40, 90],
    weekly: [82, 94, 260, 520],
    monthly: [84, 96, 1100, 2400],
  };

  const [minRate, maxRate, minTotal, maxTotal] = configs[period];
  let hash = 0;
  for (const char of seedDate + period) {
    hash = (31 * hash + char.charCodeAt(0)) >>> 0;
  }

  const random = (min: number, max: number) => {
    hash = (1664525 * hash + 1013904223) >>> 0;
    return min + (hash / 0xffffffff) * (max - min);
  };

  const total = Math.round(random(minTotal, maxTotal));
  const rate = Math.round(random(minRate, maxRate) * 10) / 10;
  const wins = Math.round((rate / 100) * total);
  const losses = total - wins;

  return { total, rate, wins, losses };
}
