// @ts-nocheck -- imported original app code, kept unchanged
import React, { ReactNode, useRef } from 'react';
import { useBot } from '../context/BotContext';
import { DEV_HANDLE, TELEGRAM_URL } from '../constants.ts';
import {
  House,
  Zap,
  History,
  ChartNoAxesColumn,
  Headphones,
  Ellipsis,
  ShieldCheck,
  Brain,
  Users,
  Crown,
  KeyRound,
  ShieldAlert,
  Send,
  LogOut,
  Bell,
  TrendingUp,
} from 'lucide-react';

interface ShellProps {
  children: ReactNode;
  showDashboardHeader?: boolean;
}

export const Shell: React.FC<ShellProps> = ({ children, showDashboardHeader = false }) => {
  const {
    currentRoute,
    navigateTo,
    setAuthSettingsOpen,
    activeLicense,
    licenseDetails,
    signals,
    deactivateKey,
    isAdmin,
    appConfig,
  } = useBot();
  const logoClicksRef = useRef<number>(0);
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const displayName = licenseDetails?.full_name?.split(/\s+/)[0] || 'Trader';
  const telegramUrl = appConfig?.telegramUrl || TELEGRAM_URL;

  const handleTerminalClick = () => {
    logoClicksRef.current += 1;
    if (clickTimeoutRef.current) clearTimeout(clickTimeoutRef.current);
    clickTimeoutRef.current = setTimeout(() => {
      logoClicksRef.current = 0;
    }, 2500);

    if (logoClicksRef.current >= 5) {
      logoClicksRef.current = 0;
      navigateTo('/admin');
    }
  };

  const navItems = [
    { route: '/dashboard', label: 'Dashboard', icon: House },
    { route: '/history', label: 'Signal Activity', icon: Bell },
    { route: '/performance', label: 'Performance', icon: ChartNoAxesColumn },
    { route: '/support', label: 'Support', icon: Headphones },
    { route: '/more', label: 'Settings & More', icon: Ellipsis },
  ];

  const goToDashboardTarget = (id: string) => {
    navigateTo('/dashboard');
    window.setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }, 100);
  };

  const handleLogout = () => {
    if (window.confirm('Deactivate this license on this device and return to activation?')) {
      deactivateKey();
    }
  };

  const todayCount = signals.filter((signal) =>
    new Date(signal.entry).toDateString() === new Date().toDateString()
  ).length;

  return (
    <main className={`bot-page ${activeLicense ? 'bot-page-active' : ''}`}>
      {activeLicense && (
        <aside className="app-sidebar">
          <button
            type="button"
            className="sidebar-brand"
            onClick={() => navigateTo('/dashboard')}
            aria-label="Go to dashboard"
          >
            <img src="/fr-kings-logo.png" alt="" />
            <span>
              <strong>FR-KING AURA</strong>
              <small>AI TRADING TERMINAL</small>
            </span>
          </button>

          <div className="sidebar-profile">
            <span className="sidebar-avatar">{displayName.slice(0, 1).toUpperCase()}</span>
            <span className="sidebar-profile-copy">
              <strong>{displayName}</strong>
              <small><i /> PRO MEMBER</small>
            </span>
            <Crown size={15} className="sidebar-crown" />
          </div>

          <nav className="sidebar-nav" aria-label="Main navigation">
            <span className="sidebar-section-label">WORKSPACE</span>
            <button
              type="button"
              data-active={currentRoute === '/dashboard'}
              onClick={() => navigateTo('/dashboard')}
            >
              <House size={18} /><span>Dashboard</span>
            </button>
            <button type="button" onClick={() => goToDashboardTarget('signal-generator')}>
              <Zap size={18} /><span>AI Signals</span>
            </button>
            <button
              type="button"
              data-active={currentRoute === '/history'}
              onClick={() => navigateTo('/history')}
            >
              <History size={18} /><span>Notifications & History</span>
              {signals.length > 0 && <small className="sidebar-count">{signals.length}</small>}
            </button>
            <button type="button" onClick={() => goToDashboardTarget('market-chart')}>
              <Brain size={18} /><span>AI Analysis</span>
            </button>
            <button
              type="button"
              data-active={currentRoute === '/performance'}
              onClick={() => navigateTo('/performance')}
            >
              <TrendingUp size={18} /><span>Performance</span>
            </button>

            <span className="sidebar-section-label sidebar-section-spaced">ACCOUNT</span>
            <a href={telegramUrl} target="_blank" rel="noreferrer">
              <Send size={18} /><span>Telegram</span>
            </a>
            <button
              type="button"
              data-active={currentRoute === '/more'}
              onClick={() => navigateTo('/more')}
            >
              <Ellipsis size={18} /><span>Settings & More</span>
            </button>
            <button
              type="button"
              data-active={currentRoute === '/support'}
              onClick={() => navigateTo('/support')}
            >
              <Headphones size={18} /><span>Support</span>
            </button>
            <button type="button" className="sidebar-logout" onClick={handleLogout}>
              <LogOut size={18} /><span>Logout</span>
            </button>
          </nav>

          <div className="sidebar-license">
            <ShieldCheck size={16} />
            <span><strong>LICENSE ACTIVE</strong><small>Protected device session</small></span>
            <i />
          </div>
        </aside>
      )}

      <div className={`bot-workspace ${activeLicense ? 'has-sidebar' : ''}`}>
      <div className="bot-shell">
        {/* Top utility row */}
        <div className="bot-utility-bar flex items-center justify-between mb-3 px-1 text-xs">
          <div
            onClick={handleTerminalClick}
            className="flex items-center gap-1.5 text-[var(--text-muted)] font-mono text-[11px] select-none cursor-pointer hover:text-white transition-colors"
            title="FR-KING Terminal (Click 5 times for Admin)"
          >
            <span className="w-2 h-2 rounded-full bg-[var(--buy)] animate-pulse" />
            <span>FR-KING TERMINAL</span>
          </div>

          {activeLicense && (
            <div className="bot-welcome">
              <span>Welcome back, <strong>{displayName}</strong> 👋</span>
              <small>Trade smarter. Grow bigger.</small>
            </div>
          )}

          <div className="flex items-center gap-2">
            {isAdmin && (
              <button
                onClick={() => setAuthSettingsOpen(true)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--surface-2)] border border-[var(--gold-border)]/50 text-[var(--primary)] hover:bg-[var(--surface-2)] transition-colors text-[11px] font-semibold cursor-pointer"
                title="Change API Key & Auth Logic"
              >
                <KeyRound size={12} />
                <span>API Key & Auth</span>
              </button>
            )}

            <button
              onClick={() => navigateTo('/admin')}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[var(--surface-2)]/80 border border-[var(--border)] text-[var(--text-muted)] hover:text-white hover:bg-[var(--surface-2)]/60 transition-colors text-[11px] cursor-pointer"
              title="Admin Panel"
            >
              <ShieldAlert size={12} />
              <span>Admin</span>
            </button>
          </div>
        </div>

        {/* Dashboard Header */}
        {showDashboardHeader && (
          <>
            <header className="bot-header">
              <img
                className="bot-logo cursor-pointer select-none"
                src="/fr-kings-logo.png"
                alt="FR-KINGs logo"
                onClick={handleTerminalClick}
                title="FR-KINGs AI Bot Pro"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <div>
                <h1>FR-KING AURA</h1>
                <div className="brand-subtitle">
                  AI BOT{' '}
                  <span className="tier-badge">
                    <Crown size={11} /> PRO MAX
                  </span>{' '}
                  NEW VERSION <span className="tier-badge">2.1</span>
                </div>
              </div>
            </header>

            {/* Status strip */}
            <div className="status-strip">
              <div className="status-item">
                <div className="status-icon">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <small>LICENSE STATUS</small>
                  <strong className="online">ACTIVE</strong>
                </div>
              </div>

              <div className="status-item">
                <div className="status-icon">
                  <Brain size={20} />
                </div>
                <div>
                  <small>SIGNAL ENGINE</small>
                  <strong className="online">READY</strong>
                </div>
              </div>

              <div className="status-item">
                <div className="status-icon">
                  <Users size={20} />
                </div>
                <div>
                  <small>SIGNALS TODAY</small>
                  <strong>{todayCount}</strong>
                </div>
              </div>
            </div>

            {/* Unlocked banner */}
            <div className="unlocked">
              <Crown size={17} />
              <span>PRO MAX UNLOCKED ✅</span>
            </div>
          </>
        )}

        {/* Main Content View */}
        {children}

        {/* Developer Credit */}
        <p className="dev-credit">Developer {DEV_HANDLE}</p>
      </div>
      </div>

      {/* Floating Bottom Navigation */}
      {activeLicense && (
        <nav className="bottom-nav" aria-label="Main navigation">
          {navItems.map(({ route, label, icon: Icon }) => {
            const isActive = currentRoute === route;
            return (
              <button
                key={route}
                onClick={() => navigateTo(route)}
                data-active={isActive}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon size={20} />
                <span>{label}</span>
              </button>
            );
          })}
        </nav>
      )}
    </main>
  );
};
