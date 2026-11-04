// @ts-nocheck -- imported original app code, kept unchanged
import React, { useState, useEffect } from 'react';
import { useBot } from '../context/BotContext';
import { PLAN_DURATIONS, DEV_HANDLE } from '../constants.ts';
import { LicenseDetails } from '../types.ts';
import {
  Lock,
  Plus,
  ArrowLeft,
  Smartphone,
  CircleCheck,
  RefreshCw,
  KeyRound,
  ShieldAlert,
  Copy,
  Check,
  Database,
  Crown,
  Zap,
  ShieldCheck,
  Activity,
  Users,
  Clock3,
} from 'lucide-react';


export const AdminView: React.FC = () => {
  const { navigateTo, setAuthSettingsOpen, setIsAdmin, appConfig } = useBot();

  const [passwordInput, setPasswordInput] = useState<string>('');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [keysList, setKeysList] = useState<LicenseDetails[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [cardEdits, setCardEdits] = useState<Record<string, { duration: string; devices: number }>>({});
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);

  // Mint New Key Modal State
  const [isMintModalOpen, setIsMintModalOpen] = useState<boolean>(false);
  const [mintForm, setMintForm] = useState({
    custom_key: '',
    full_name: 'VIP User',
    phone: '+966554573612',
    email: 'client@frkings.pro',
    duration: '1 Month',
    max_devices: 1,
    status: 'approved' as const,
  });
  const [isMinting, setIsMinting] = useState<boolean>(false);

  const fetchKeys = async (pwd = passwordInput) => {
    setErrorMessage('');
    let mergedKeys: LicenseDetails[] = [];
    let authenticated = false;

    try {
      const res = await fetch('/api/public/admin/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pwd }),
      });
      const data = await res.json();
      if (data.ok && Array.isArray(data.keys)) {
        mergedKeys = [...data.keys];
        authenticated = true;
      } else if (res.status === 401) {
        setErrorMessage(data.error || 'Wrong admin password.');
        setIsAuthenticated(false);
        setIsAdmin(false);
        sessionStorage.removeItem('frk_admin');
        return;
      }
    } catch {
      // Backend may be offline or in serverless cold start
    }

    if (authenticated || mergedKeys.length > 0) {
      setKeysList(mergedKeys);
      setIsAuthenticated(true);
      setIsAdmin(true);
      sessionStorage.setItem('frk_admin', pwd);
    } else {
      setErrorMessage('Could not load license database. Check admin credentials.');
      setIsAuthenticated(false);
      setIsAdmin(false);
    }
  };

  useEffect(() => {
    const saved = sessionStorage.getItem('frk_admin');
    if (saved) {
      setPasswordInput(saved);
      fetchKeys(saved);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordInput.trim()) {
      setErrorMessage('Please enter admin password.');
      return;
    }

    try {
      const res = await fetch('/api/public/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: passwordInput.trim() }),
      });
      const data = await res.json();
      if (data.ok) {
        fetchKeys(passwordInput.trim());
      } else {
        setErrorMessage(data.error || 'Invalid password.');
      }
    } catch {
      setErrorMessage('Failed to connect to authentication server.');
    }
  };

  const handleRemoveDevice = async (licId: string, deviceToken: string) => {
    setErrorMessage('');
    setSuccessMessage(null);
    const pwd = passwordInput || sessionStorage.getItem('frk_admin') || '';
    if (!pwd) {
      setErrorMessage('Admin session expired. Please log in again.');
      setIsAuthenticated(false);
      return;
    }

    // Optimistic UI update
    setKeysList((prev) =>
      prev.map((item) =>
        item.id === licId || item.license_key === licId
          ? {
              ...item,
              license_devices: (item.license_devices || []).filter(
                (d) => d.trim().toLowerCase() !== deviceToken.trim().toLowerCase()
              ),
            }
          : item
      )
    );

    try {
      const res = await fetch('/api/public/admin/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password: pwd,
          id: licId,
          action: 'remove_device',
          deviceId: deviceToken,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setSuccessMessage(`Device "${deviceToken}" unlinked successfully.`);
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setErrorMessage(data.error || 'Failed to remove device.');
      }
      await fetchKeys(pwd);
    } catch {
      setErrorMessage('Network error removing device.');
      await fetchKeys(pwd);
    }
  };

  const handleAdminAction = async (licId: string, action: string) => {
    setErrorMessage('');
    setSuccessMessage(null);
    setDeleteConfirmId(null);
    const pwd = passwordInput || sessionStorage.getItem('frk_admin') || '';
    if (!pwd) {
      setErrorMessage('Admin session expired. Please log in again.');
      setIsAuthenticated(false);
      return;
    }

    const currentEdit = cardEdits[licId] ?? { duration: '1 Day', devices: 1 };

    // Optimistic update
    if (action === 'reset_devices') {
      setKeysList((prev) =>
        prev.map((k) =>
          k.id === licId || k.license_key === licId
            ? { ...k, license_devices: [] }
            : k
        )
      );
    } else if (action === 'delete') {
      setKeysList((prev) =>
        prev.filter((k) => k.id !== licId && k.license_key !== licId)
      );
    } else if (action === 'block') {
      setKeysList((prev) =>
        prev.map((k) =>
          k.id === licId || k.license_key === licId
            ? { ...k, status: 'blocked' }
            : k
        )
      );
    }

    try {
      const res = await fetch('/api/public/admin/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password: pwd,
          id: licId,
          action: action,
          duration: currentEdit.duration,
          max_devices: currentEdit.devices,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        if (action === 'delete') {
          setSuccessMessage('License key deleted successfully.');
        } else if (action === 'reset_devices') {
          setSuccessMessage('All bound devices reset successfully for this key.');
        } else if (action === 'block') {
          setSuccessMessage('License blocked successfully.');
        } else if (action === 'approve') {
          setSuccessMessage('License approved/updated successfully in database.');
        }
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setErrorMessage(data.error || 'Action failed.');
      }
      await fetchKeys(pwd);
    } catch {
      setErrorMessage('Network error executing admin action.');
    }
  };

  const handleMintSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsMinting(true);
    setErrorMessage('');
    const pwd = passwordInput || sessionStorage.getItem('frk_admin') || '';

    try {
      const res = await fetch('/api/public/admin/create-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password: pwd,
          ...mintForm,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setIsMintModalOpen(false);
        setSuccessMessage('New key minted and approved successfully!');
        setTimeout(() => setSuccessMessage(null), 3000);
        await fetchKeys(pwd);
      } else {
        setErrorMessage(data.error || 'Failed to create key.');
      }
    } catch {
      setErrorMessage('Network error creating key.');
    } finally {
      setIsMinting(false);
    }
  };

  const copyToClipboard = (text: string, identifier: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKeyId(identifier);
    setTimeout(() => setCopiedKeyId(null), 2000);
  };

  // LOGIN SCREEN
  if (!isAuthenticated) {
    return (
      <main className="bot-page admin-login-page">
        <div className="license-shell admin-login-shell">
          <div className="admin-login-topbar">
            <button
              onClick={() => navigateTo('/')}
              className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-white cursor-pointer"
            >
              <ArrowLeft size={14} />
              <span>Back to App</span>
            </button>
            <span className="admin-login-secure">
              <span />
              SECURE ADMIN ACCESS
            </span>
          </div>

          <header className="admin-login-brand">
            <img
              className="bot-logo license-logo select-none"
              src="/fr-kings-logo.png"
              alt="FR-KINGs logo"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            <h1 className="license-title">FR-KING AURA</h1>
            <p>AI TRADING TERMINAL</p>
            <div className="admin-login-badges" aria-label="Platform features">
              <span><Zap size={13} /> AI Powered</span>
              <span><ShieldCheck size={13} /> Secure Access</span>
              <span><Activity size={13} /> Pro Terminal</span>
            </div>
          </header>

          <div className="license-card admin-login-card">
            <h2>
              <Lock size={18} className="text-[var(--primary)]" />
              <span>Admin Login</span>
            </h2>
            <p className="admin-login-description">
              Protected terminal management and database access
            </p>

            <form onSubmit={handleLogin} className="admin-login-form">
              <input
                className="license-input"
                type="password"
                placeholder="Enter admin password"
                aria-label="Admin password"
                autoComplete="current-password"
                value={passwordInput}
                onChange={(e) => {
                  setPasswordInput(e.target.value);
                  setErrorMessage('');
                }}
              />

              {errorMessage && (
                <p className="text-[var(--sell)] text-xs font-bold mb-2">
                  {errorMessage}
                </p>
              )}

              <button
                type="submit"
                className="bot-button bot-button-neon generate-button flex items-center justify-center gap-2 cursor-pointer"
              >
                <Lock size={15} />
                <span>LOGIN TO ADMIN PANEL</span>
              </button>
            </form>

            <p className="admin-login-notice">
              <ShieldCheck size={13} />
              Admin credentials are required. No third-party or Telegram login.
            </p>
          </div>

          <footer className="admin-login-footer">
            <span>Protected administrator sign-in</span>
            <span>Developer {DEV_HANDLE}</span>
          </footer>
        </div>
      </main>
    );
  }

  // LOGGED IN ADMIN DASHBOARD
  const filteredKeys = keysList.filter(
    (k) => filterStatus === 'all' || k.status === filterStatus
  );
  const activeKeyCount = keysList.filter(
    (key) =>
      key.status === 'approved' &&
      (key.lifetime || !key.expires_at || new Date(key.expires_at) >= new Date())
  ).length;
  const boundDeviceCount = keysList.reduce(
    (total, key) => total + (key.license_devices?.length || 0),
    0
  );
  const expiringKeyCount = keysList.filter((key) => {
    if (key.status !== 'approved' || key.lifetime || !key.expires_at) return false;
    const expiresAt = new Date(key.expires_at).getTime();
    const now = Date.now();
    return expiresAt >= now && expiresAt <= now + 7 * 24 * 60 * 60 * 1000;
  }).length;

  return (
    <main className="bot-page admin-dashboard-page">
      <div className="admin-shell admin-dashboard-shell">
        <header className="admin-dashboard-header">
          <div className="admin-dashboard-brand">
            <img src="/fr-kings-logo.png" alt="FR-KINGs logo" />
            <div>
              <h1>FR-KING AURA</h1>
              <p>AI TRADING TERMINAL</p>
            </div>
            <span className="admin-dashboard-divider" />
            <ShieldAlert className="admin-dashboard-crown" aria-hidden="true" />
            <div className="admin-dashboard-title">
              <h2>ADMIN PANEL</h2>
              <p>Manage users, licenses and applications</p>
            </div>
          </div>

          <div className="admin-dashboard-header-actions">
            <button
              onClick={() => {
                sessionStorage.removeItem('frk_admin');
                setIsAuthenticated(false);
                setIsAdmin(false);
                setPasswordInput('');
              }}
              className="bot-button bot-button-ghost text-xs text-[var(--sell)] hover:text-[var(--sell)] cursor-pointer"
            >
              Logout
            </button>

            <button
              onClick={() => navigateTo('/dashboard')}
              className="bot-button bot-button-outline text-xs text-[var(--text-muted)] cursor-pointer"
            >
              Back
            </button>
          </div>
        </header>

        <div className="admin-dashboard-layout">
          <aside className="admin-account-panel">
            <div className="admin-account-heading">
              <h2><Users size={17} /> Admin Account</h2>
              <span><i /> Online</span>
            </div>
            <div className="admin-account-profile">
              <img src="/fr-kings-logo.png" alt="" />
              <strong>Administrator</strong>
              <span><Crown size={12} /> Admin</span>
            </div>
            <div className="admin-account-details">
              <div><Database size={14} /><span>Database</span><strong>Connected</strong></div>
              <div><KeyRound size={14} /><span>License Keys</span><strong>{keysList.length}</strong></div>
              <div><ShieldCheck size={14} /><span>Active Keys</span><strong>{activeKeyCount}</strong></div>
              <div><Smartphone size={14} /><span>Bound Devices</span><strong>{boundDeviceCount}</strong></div>
            </div>
            <div className="admin-account-status">
              <span><Activity size={19} /></span>
              <div>
                <small>ACCOUNT STATUS</small>
                <strong>ACTIVE</strong>
                <p>Administrator session authenticated</p>
              </div>
            </div>
          </aside>

          <section className="admin-dashboard-content">
            <nav className="admin-dashboard-nav" aria-label="Admin tools">
              <button className="is-active" onClick={() => setIsMintModalOpen(true)}>
                <KeyRound size={15} /> Generate Key
              </button>
              <button onClick={() => setAuthSettingsOpen(true)}>
                <Zap size={15} /> API Configuration
              </button>
              <button onClick={() => fetchKeys(passwordInput)}>
                <RefreshCw size={15} /> Refresh Data
              </button>
              <button onClick={() => document.getElementById('admin-licenses')?.scrollIntoView({ behavior: 'smooth' })}>
                <Users size={15} /> User Management
              </button>
            </nav>


            {/* Quick Master API Key Banner */}
              <div id="admin-licenses" className="admin-license-workspace">
                <div className="admin-license-heading">
                  <div>
                    <h2><KeyRound size={19} /> License Management</h2>
                    <p>Review and manage user keys, access and bound devices.</p>
                  </div>
                </div>

                {/* Filters */}
                <div className="admin-filters">
          {['all', 'pending', 'approved', 'blocked'].map((st) => {
              const count =
                st === 'all'
                ? keysList.length
                : keysList.filter((k) => k.status === st).length;
            return (
              <button
                key={st}
                data-active={filterStatus === st}
                onClick={() => setFilterStatus(st)}
              >
                {st.toUpperCase()} ({count})
              </button>
            );
          })}
              </div>

              {/* Success Alert */}
              {successMessage && (
          <div className="mb-3 p-3 rounded-xl bg-[var(--buy)]/10 border border-[var(--buy)]/30 text-[var(--buy)] text-xs flex items-center gap-2">
            <CircleCheck size={16} />
            <span>{successMessage}</span>
          </div>
              )}

              {/* Error Alert */}
              {errorMessage && (
          <p className="text-[var(--sell)] text-xs font-bold mb-3">{errorMessage}</p>
              )}

              {/* Empty State */}
              {filteredKeys.length === 0 && (
          <div className="empty-state">
            <p>No license keys found in this category.</p>
          </div>
              )}

              {/* Licenses Grid */}
              <div className="admin-list">
          {filteredKeys.map((lic) => {
            const currentEdit = cardEdits[lic.id] ?? {
              duration: lic.duration_label || '1 Day',
              devices: lic.max_devices || 1,
            };

            const updateCardEdit = (patch: Partial<{ duration: string; devices: number }>) => {
              setCardEdits({
                ...cardEdits,
                [lic.id]: { ...currentEdit, ...patch },
              });
            };

            const isExpired =
              !lic.lifetime &&
              lic.expires_at &&
              new Date(lic.expires_at) < new Date();

            return (
              <div key={lic.id} className="admin-card">
                <div className="admin-row">
                  <div className="flex items-center gap-2">
                    <strong className="new-key small font-mono">
                      {lic.license_key}
                    </strong>
                    <button
                      onClick={() => copyToClipboard(lic.license_key, lic.id)}
                      className="p-1 text-[var(--text-muted)] hover:text-[var(--primary)] cursor-pointer"
                      title="Copy Key"
                    >
                      {copiedKeyId === lic.id ? (
                        <Check size={13} className="text-[var(--buy)]" />
                      ) : (
                        <Copy size={13} />
                      )}
                    </button>
                  </div>

                  <span
                    className={`status-pill ${isExpired ? 'blocked' : lic.status}`}
                  >
                    {isExpired ? 'EXPIRED' : lic.status.toUpperCase()}
                  </span>
                </div>

                <dl>
                  <dt>Name</dt>
                  <dd className="font-semibold text-white">{lic.full_name}</dd>

                  <dt>Number</dt>
                  <dd className="font-mono text-[var(--primary-hover)]">{lic.phone || '-'}</dd>

                  <dt>Gmail</dt>
                  <dd className="text-[var(--text-muted)]">{lic.email || '-'}</dd>

                  <dt>Paid</dt>
                  <dd className="font-bold text-[var(--buy)]">{lic.amount || '-'}</dd>

                  <dt>Registered</dt>
                  <dd className="text-[var(--text-muted)] text-xs">
                    {lic.created_at ? new Date(lic.created_at).toLocaleString() : '-'}
                  </dd>

                  <dt>Plan</dt>
                  <dd className="text-xs">
                    {lic.status === 'approved'
                      ? lic.lifetime
                        ? 'Lifetime'
                        : `${lic.duration_label} · expires ${
                            lic.expires_at ? new Date(lic.expires_at).toLocaleDateString() : '-'
                          }`
                      : '-'}
                  </dd>

                  <dt>Devices</dt>
                  <dd className="text-xs">
                    <div className="font-mono text-[var(--primary-hover)] font-bold mb-1">
                      {lic.license_devices ? lic.license_devices.length : 0} /{' '}
                      {lic.max_devices} bound
                    </div>
                    {lic.license_devices && lic.license_devices.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {lic.license_devices.map((deviceToken) => (
                          <span
                            key={deviceToken}
                            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-[var(--bg)] border border-[var(--border)] text-[10px] text-[var(--text-muted)] font-mono"
                          >
                            <Smartphone size={10} className="text-[var(--primary)] shrink-0" />
                            <span title={deviceToken}>
                              {deviceToken.length > 14
                                ? `${deviceToken.substring(0, 11)}...`
                                : deviceToken}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveDevice(lic.id, deviceToken);
                              }}
                              className="text-[var(--sell)] hover:text-white hover:bg-[var(--sell)] rounded px-1 text-xs font-bold transition-colors cursor-pointer"
                              title={`Delete device (${deviceToken})`}
                              aria-label={`Delete device ${deviceToken}`}
                            >
                              ✕
                            </button>
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-[var(--text-muted)] text-[10px] italic">
                        No devices bound
                      </span>
                    )}
                  </dd>
                </dl>

                {/* Actions */}
                <div className="admin-actions">
                  <select
                    value={currentEdit.duration}
                    onChange={(e) => updateCardEdit({ duration: e.target.value })}
                    aria-label="Duration"
                  >
                    {PLAN_DURATIONS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>

                  <select
                    value={currentEdit.devices}
                    onChange={(e) => updateCardEdit({ devices: Number(e.target.value) })}
                    aria-label="Devices"
                  >
                    {[1, 2, 3, 4, 5, 10].map((num) => (
                      <option key={num} value={num}>
                        {num} device{num > 1 ? 's' : ''}
                      </option>
                    ))}
                  </select>

                  <button
                    className="bot-button bot-button-neon cursor-pointer"
                    onClick={() => handleAdminAction(lic.id, 'approve')}
                  >
                    {lic.status === 'approved' ? 'Update' : 'Approve'}
                  </button>

                  <button
                    type="button"
                    className="bot-button bot-button-outline cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAdminAction(lic.id, 'reset_devices');
                    }}
                    title="Clear all bound devices for this key"
                  >
                    Reset devices
                  </button>

                  <button
                    className="bot-button bot-button-outline cursor-pointer"
                    onClick={() => handleAdminAction(lic.id, 'block')}
                  >
                    Block
                  </button>

                  {deleteConfirmId === lic.id ? (
                    <div className="inline-flex items-center gap-1.5 p-1 rounded-lg bg-[var(--sell)]/10 border border-[var(--sell)]/40">
                      <button
                        className="bot-button bg-[var(--sell)] hover:bg-[var(--sell)] text-white text-[11px] px-2.5 py-1 cursor-pointer"
                        onClick={() => handleAdminAction(lic.id, 'delete')}
                      >
                        Confirm Delete
                      </button>
                      <button
                        className="bot-button bot-button-ghost text-[var(--text-muted)] text-[11px] px-1.5 py-1 cursor-pointer"
                        onClick={() => setDeleteConfirmId(null)}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      className="bot-button bot-button-ghost text-[var(--sell)] hover:text-[var(--sell)] cursor-pointer"
                      onClick={() => setDeleteConfirmId(lic.id)}
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            );
          })}
              </div>
            </div>

            <section className="admin-dashboard-stats" aria-label="License statistics">
              <h2><Activity size={16} /> Quick Statistics</h2>
              <div className="admin-stat-grid">
                <div><Users size={19} /><span>Total Keys</span><strong>{keysList.length}</strong></div>
                <div><KeyRound size={19} /><span>Active Licenses</span><strong>{activeKeyCount}</strong></div>
                <div><Smartphone size={19} /><span>Bound Devices</span><strong>{boundDeviceCount}</strong></div>
                <div><Clock3 size={19} /><span>Expiring in 7 Days</span><strong>{expiringKeyCount}</strong></div>
              </div>
            </section>
          </section>
        </div>

        {/* Mint New Key Modal */}
        {isMintModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <div className="w-full max-w-md bg-[var(--surface-1)] border border-[var(--gold-border)]/60 rounded-2xl p-6 shadow-2xl">
              <h3 className="text-base font-bold text-white mb-2 font-mono flex items-center gap-2">
                <Plus size={16} className="text-[var(--primary)]" />
                <span>Mint New License Key</span>
              </h3>
              <p className="text-xs text-[var(--text-muted)] mb-3">
                Generate an immediate pre-approved license key for a customer in the database.
              </p>

              {/* Quick Preset Buttons */}
              <div className="mb-3.5 p-2.5 rounded-xl bg-[var(--bg)] border border-[var(--border)]">
                <label className="text-[10px] text-[var(--primary)] font-mono font-bold block mb-1.5">
                  QUICK PRESET TIERS (CLICK TO AUTO-FILL):
                </label>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      const rand = Math.floor(1000 + Math.random() * 9000);
                      setMintForm({
                        ...mintForm,
                        custom_key: `FRK-CROWN-VIP-${rand}`,
                        full_name: 'VIP Crown Member',
                        duration: 'Lifetime',
                        max_devices: 10,
                      });
                    }}
                    className="px-2 py-1 rounded bg-[var(--surface-2)] border border-[var(--primary)] text-[var(--primary)] text-[10px] font-mono font-bold cursor-pointer hover:bg-[var(--primary)] hover:text-black transition-colors"
                  >
                    👑 Lifetime Crown (10 Dev)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const rand = Math.floor(1000 + Math.random() * 9000);
                      setMintForm({
                        ...mintForm,
                        custom_key: `FRK-1YEAR-PRO-${rand}`,
                        full_name: '1-Year VIP Trader',
                        duration: '1 Year',
                        max_devices: 5,
                      });
                    }}
                    className="px-2 py-1 rounded bg-[var(--surface-1)] border border-[var(--buy)] text-[var(--buy)] text-[10px] font-mono font-bold cursor-pointer hover:bg-[var(--buy)] hover:text-black transition-colors"
                  >
                    🔥 1 Year (5 Dev)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const rand = Math.floor(1000 + Math.random() * 9000);
                      setMintForm({
                        ...mintForm,
                        custom_key: `FRK-6M-ELITE-${rand}`,
                        full_name: '6-Month Elite Trader',
                        duration: '6 Months',
                        max_devices: 3,
                      });
                    }}
                    className="px-2 py-1 rounded bg-[var(--surface-1)] border border-[var(--info)] text-[var(--info)] text-[10px] font-mono font-bold cursor-pointer hover:bg-[var(--info)] hover:text-black transition-colors"
                  >
                    💎 6 Months (3 Dev)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const rand = Math.floor(1000 + Math.random() * 9000);
                      setMintForm({
                        ...mintForm,
                        custom_key: `FRK-3M-PRO-${rand}`,
                        full_name: '3-Month Pro Member',
                        duration: '3 Months',
                        max_devices: 3,
                      });
                    }}
                    className="px-2 py-1 rounded bg-[var(--surface-1)] border border-[var(--accent)] text-[var(--accent)] text-[10px] font-mono font-bold cursor-pointer hover:bg-[var(--accent)] hover:text-black transition-colors"
                  >
                    ⚡ 3 Months (3 Dev)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const rand = Math.floor(1000 + Math.random() * 9000);
                      setMintForm({
                        ...mintForm,
                        custom_key: `FRK-1M-GOLD-${rand}`,
                        full_name: '1-Month Gold Member',
                        duration: '1 Month',
                        max_devices: 2,
                      });
                    }}
                    className="px-2 py-1 rounded bg-[var(--surface-1)] border border-[var(--warning)] text-[var(--warning)] text-[10px] font-mono font-bold cursor-pointer hover:bg-[var(--warning)] hover:text-black transition-colors"
                  >
                    🏆 1 Month (2 Dev)
                  </button>
                </div>
              </div>

              <form onSubmit={handleMintSubmit} className="space-y-3 text-xs">
                <div>
                  <label className="text-[10px] text-[var(--text-muted)]">
                    CUSTOM KEY (OPTIONAL - AUTO-GENERATED IF EMPTY)
                  </label>
                  <input
                    type="text"
                    value={mintForm.custom_key}
                    onChange={(e) =>
                      setMintForm({ ...mintForm, custom_key: e.target.value })
                    }
                    placeholder="e.g. FRK-VIP8-8888-2026"
                    className="w-full mt-1 px-3 py-1.5 bg-[var(--surface-1)] border border-[var(--border)] rounded-lg text-white font-mono"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-[var(--text-muted)]">
                    CUSTOMER FULL NAME
                  </label>
                  <input
                    type="text"
                    value={mintForm.full_name}
                    onChange={(e) =>
                      setMintForm({ ...mintForm, full_name: e.target.value })
                    }
                    className="w-full mt-1 px-3 py-1.5 bg-[var(--surface-1)] border border-[var(--border)] rounded-lg text-white"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] text-[var(--text-muted)]">
                    CUSTOMER PHONE
                  </label>
                  <input
                    type="tel"
                    value={mintForm.phone}
                    onChange={(e) =>
                      setMintForm({ ...mintForm, phone: e.target.value })
                    }
                    className="w-full mt-1 px-3 py-1.5 bg-[var(--surface-1)] border border-[var(--border)] rounded-lg text-white"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] text-[var(--text-muted)]">
                    CUSTOMER EMAIL
                  </label>
                  <input
                    type="email"
                    value={mintForm.email}
                    onChange={(e) =>
                      setMintForm({ ...mintForm, email: e.target.value })
                    }
                    className="w-full mt-1 px-3 py-1.5 bg-[var(--surface-1)] border border-[var(--border)] rounded-lg text-white"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-[var(--text-muted)]">
                      PLAN DURATION
                    </label>
                    <select
                      value={mintForm.duration}
                      onChange={(e) =>
                        setMintForm({ ...mintForm, duration: e.target.value })
                      }
                      className="w-full mt-1 px-3 py-1.5 bg-[var(--surface-1)] border border-[var(--border)] rounded-lg text-white font-mono"
                    >
                      {PLAN_DURATIONS.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-[var(--text-muted)]">
                      MAX DEVICES
                    </label>
                    <select
                      value={mintForm.max_devices}
                      onChange={(e) =>
                        setMintForm({
                          ...mintForm,
                          max_devices: Number(e.target.value),
                        })
                      }
                      className="w-full mt-1 px-3 py-1.5 bg-[var(--surface-1)] border border-[var(--border)] rounded-lg text-white font-mono"
                    >
                      {[1, 2, 3, 4, 5, 10].map((num) => (
                        <option key={num} value={num}>
                          {num} device{num > 1 ? 's' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3">
                  <button
                    type="button"
                    onClick={() => setIsMintModalOpen(false)}
                    className="px-3 py-1.5 rounded-lg border border-[var(--border)] text-[var(--text-muted)] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isMinting}
                    className="bot-button bot-button-neon px-4 py-1.5 cursor-pointer"
                  >
                    {isMinting ? 'Minting...' : 'Mint & Approve Key'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <p className="dev-credit">Developer {DEV_HANDLE}</p>
      </div>
    </main>
  );
};
