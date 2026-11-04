// @ts-nocheck -- imported original app code, kept unchanged
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { LicenseDetails, SignalItem, AppConfig } from '../types.ts';

const BUILT_IN_KEYS_SYNC: LicenseDetails[] = [
  {
    id: 'lic_king_crown_001',
    license_key: 'FRK-VIP-LIFETIME-KING',
    full_name: 'Waqas King (VIP Master)',
    phone: '+966554573612',
    email: 'codewithwaqas.dev@gmail.com',
    amount: 'VIP Crown Sponsor',
    status: 'approved',
    duration_label: 'Lifetime',
    expires_at: null,
    lifetime: true,
    max_devices: 10,
    license_devices: [],
  },
];

interface BotContextType {
  currentRoute: string;
  navigateTo: (route: string) => void;
  activeLicense: string | null;
  licenseDetails: LicenseDetails | null;
  deviceId: string;
  signals: SignalItem[];
  addSignal: (signal: SignalItem) => void;
  clearSignals: () => void;
  activateKey: (key: string, details?: LicenseDetails) => void;
  deactivateKey: () => void;
  appConfig: AppConfig | null;
  refreshConfig: () => Promise<void>;
  isAuthSettingsOpen: boolean;
  setAuthSettingsOpen: (open: boolean) => void;
  isVerifying: boolean;
  isAdmin: boolean;
  setIsAdmin: (admin: boolean) => void;
}

const BotContext = createContext<BotContextType | null>(null);

export const BotProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentRoute, setCurrentRoute] = useState<string>('/');
  const [isAdmin, setIsAdmin] = useState<boolean>(() => !!sessionStorage.getItem('frk_admin'));
  const [activeLicense, setActiveLicense] = useState<string | null>(
    () => localStorage.getItem('frk_license')
  );
  const [licenseDetails, setLicenseDetails] = useState<LicenseDetails | null>(null);
  const [isVerifying, setIsVerifying] = useState<boolean>(
    () => !!localStorage.getItem('frk_license')
  );

  const [deviceId] = useState<string>(() => {
    let saved = localStorage.getItem('frk_device');
    if (!saved) {
      if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        saved = crypto.randomUUID();
      } else {
        saved = 'dev-' + Math.random().toString(36).substring(2, 12);
      }
      localStorage.setItem('frk_device', saved);
    }
    return saved;
  });

  const [signals, setSignals] = useState<SignalItem[]>(() => {
    try {
      const stored = localStorage.getItem('frk_signals');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [appConfig, setAppConfig] = useState<AppConfig | null>(null);
  const [isAuthSettingsOpen, setAuthSettingsOpen] = useState<boolean>(false);

  const refreshConfig = async () => {
    try {
      const res = await fetch('/api/public/config');
      if (res.ok) {
        const data = await res.json();
        setAppConfig(data);
      }
    } catch (err) {
      console.error('Failed to fetch config:', err);
    }
  };

  useEffect(() => {
    refreshConfig();

    // Fetch persisted signals from server
    fetch('/api/public/signals')
      .then((res) => res.json())
      .then((data) => {
        if (data.ok && Array.isArray(data.signals) && data.signals.length > 0) {
          setSignals((prev) => {
            const existingIds = new Set(prev.map((s) => s.id));
            const newOnes = data.signals.filter((s: SignalItem) => !existingIds.has(s.id));
            const combined = [...prev, ...newOnes].slice(0, 50);
            localStorage.setItem('frk_signals', JSON.stringify(combined));
            return combined;
          });
        }
      })
      .catch(() => {});
  }, []);

  // Check active license on startup with watchdog safety timer
  useEffect(() => {
    const savedKey = localStorage.getItem('frk_license');
    if (!savedKey) {
      setIsVerifying(false);
      return;
    }

    setIsVerifying(true);
    let resolved = false;

    // Failsafe watchdog timer (max 2.5s) to guarantee UI never gets stuck
    const watchdogTimer = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        console.warn('License verification timed out, continuing to terminal/activation.');
        setIsVerifying(false);
      }
    }, 2500);

    fetch('/api/public/verify-key', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: savedKey, device: deviceId }),
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (resolved) return;
        resolved = true;
        clearTimeout(watchdogTimer);

        if (data.ok && data.license) {
          setActiveLicense(savedKey);
          setLicenseDetails(data.license);
          if (currentRoute === '/') {
            navigateTo('/dashboard');
          }
        } else {
          console.warn('License verification failed:', data.error);
          localStorage.removeItem('frk_license');
          setActiveLicense(null);
          setLicenseDetails(null);
          if (currentRoute !== '/' && currentRoute !== '/admin') {
            navigateTo('/');
          }
        }
      })
      .catch(() => {
        if (resolved) return;
        resolved = true;
        clearTimeout(watchdogTimer);

        const matched = BUILT_IN_KEYS_SYNC.find(
          (b) => b.license_key.toUpperCase() === savedKey.toUpperCase()
        );
        if (matched) {
          setActiveLicense(savedKey);
          setLicenseDetails(matched);
        } else {
          setActiveLicense(savedKey);
        }
      })
      .finally(() => {
        clearTimeout(watchdogTimer);
        setIsVerifying(false);
      });

    return () => {
      clearTimeout(watchdogTimer);
    };
  }, [deviceId]);

  const navigateTo = (route: string) => {
    queueMicrotask(() => {
      setCurrentRoute(route);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  };

  const addSignal = (sig: SignalItem) => {
    setSignals((prev) => {
      const updated = [sig, ...prev].slice(0, 50);
      try {
        localStorage.setItem('frk_signals', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    // Also persist to server database
    fetch('/api/public/signals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ signal: sig }),
    }).catch(() => {});
  };

  const clearSignals = () => {
    setSignals([]);
    try {
      localStorage.removeItem('frk_signals');
    } catch {}
  };

  const activateKey = (key: string, details?: LicenseDetails) => {
    const clean = key.trim().toUpperCase();
    localStorage.setItem('frk_license', clean);
    setActiveLicense(clean);
    if (details) setLicenseDetails(details);
    navigateTo('/dashboard');
  };

  const deactivateKey = () => {
    localStorage.removeItem('frk_license');
    setActiveLicense(null);
    setLicenseDetails(null);
    navigateTo('/');
  };

  return (
    <BotContext.Provider
      value={{
        currentRoute,
        navigateTo,
        activeLicense,
        licenseDetails,
        deviceId,
        signals,
        addSignal,
        clearSignals,
        activateKey,
        deactivateKey,
        appConfig,
        refreshConfig,
        isAuthSettingsOpen,
        setAuthSettingsOpen,
        isVerifying,
        isAdmin,
        setIsAdmin,
      }}
    >
      {children}
    </BotContext.Provider>
  );
};

export function useBot() {
  const ctx = useContext(BotContext);
  if (!ctx) throw new Error('useBot must be used within a BotProvider');
  return ctx;
}
