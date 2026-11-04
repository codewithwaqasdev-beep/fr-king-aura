// @ts-nocheck -- imported original app code, kept unchanged
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BotProvider, useBot } from './context/BotContext';
import { ActivationView } from './components/ActivationView';
import { DashboardView } from './components/DashboardView';
import { HistoryView } from './components/HistoryView';
import { PerformanceView } from './components/PerformanceView';
import { SupportView } from './components/SupportView';
import { MoreView } from './components/MoreView';
import { FutureSignalsView } from './components/FutureSignalsView';
import { AdminView } from './components/AdminView';
import { AuthSettingsModal } from './components/AuthSettingsModal';
import { ErrorBoundary } from './components/ErrorBoundary';
import { RefreshCw } from 'lucide-react';

const AppContent: React.FC = () => {
  const { currentRoute, activeLicense, isVerifying } = useBot();

  // If user navigated directly to admin panel
  if (currentRoute === '/admin') {
    return (
      <>
        <AdminView />
        <AuthSettingsModal />
      </>
    );
  }

  // Initial verification state
  if (isVerifying) {
    return (
      <main className="bot-page flex items-center justify-center p-6">
        <div className="text-center">
          <img
            src="/fr-kings-logo.png"
            alt="FR-KINGs"
            className="w-16 h-16 rounded-2xl mx-auto mb-4 object-contain shadow-[0_0_24px_rgba(45,212,191,0.3)] animate-pulse"
          />
          <RefreshCw className="animate-spin text-[var(--primary)] mx-auto mb-3" size={24} />
          <p className="font-mono text-xs tracking-wider text-[var(--text-muted)]">
            VERIFYING LICENSE & DATABASE...
          </p>
        </div>
      </main>
    );
  }

  // If not activated, show Activation / Registration view
  if (!activeLicense) {
    return (
      <>
        <ActivationView />
        <AuthSettingsModal />
      </>
    );
  }

  // Main Authenticated Terminal Views
  const renderView = () => {
    switch (currentRoute) {
      case '/history':
        return <HistoryView />;
      case '/performance':
        return <PerformanceView />;
      case '/support':
        return <SupportView />;
      case '/more':
        return <MoreView />;
      case '/future-signals':
        return <FutureSignalsView />;
      case '/dashboard':
      case '/':
      default:
        return <DashboardView />;
    }
  };

  return (
    <>
      {renderView()}
      <AuthSettingsModal />
    </>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <BotProvider>
        <AppContent />
      </BotProvider>
    </ErrorBoundary>
  );
}
