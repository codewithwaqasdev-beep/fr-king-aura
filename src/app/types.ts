// @ts-nocheck -- imported original app code, kept unchanged
export interface LicenseDetails {
  id: string;
  license_key: string;
  full_name: string;
  phone?: string;
  email?: string;
  amount?: string;
  status: 'pending' | 'approved' | 'blocked';
  duration_label: string;
  expires_at?: string | null;
  lifetime?: boolean;
  max_devices: number;
  license_devices?: string[];
  created_at?: string;
}

export interface SignalItem {
  id: string;
  pair: string;
  market: string;
  timer: string;
  mode: 'live' | 'future';
  direction: 'BUY' | 'SELL';
  entry: string;
  expiry: string;
  accuracy?: string;
  strength?: string;
  strikePrice?: string;
  payout?: string;
  rsi?: string;
  macd?: string;
  stoch?: string;
  maVote?: string;
  volatility?: string;
  confidence?: string;
}

export interface AppConfig {
  apiKey: string;
  recoveryEmail: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
  authMode: 'local' | 'api_key_only' | 'supabase_sync';
  allowMasterApiKeyBypass: boolean;
  whatsappUrl?: string;
  telegramUrl?: string;
  phone?: string;
  developer?: string;
}

export interface WinRateData {
  total: number;
  rate: number;
  wins: number;
  losses: number;
}
