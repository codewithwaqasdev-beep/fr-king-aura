// @ts-nocheck -- imported original app code, kept unchanged
import React, { useEffect, useState } from 'react';
import { useBot } from '../context/BotContext';
import {
  CircleAlert,
  CircleCheck,
  ExternalLink,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  Save,
  X,
} from 'lucide-react';

export const AuthSettingsModal: React.FC = () => {
  const {
    isAuthSettingsOpen,
    setAuthSettingsOpen,
    appConfig,
    refreshConfig,
    activateKey,
  } = useBot();

  const [apiKey, setApiKey] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [authAdminPassword, setAuthAdminPassword] = useState('');
  const [authMode, setAuthMode] = useState<'local' | 'api_key_only'>('local');
  const [allowBypass, setAllowBypass] = useState(true);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [alert, setAlert] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!appConfig) return;

    setApiKey(appConfig.apiKey || '');
    setAuthMode(appConfig.authMode === 'api_key_only' ? 'api_key_only' : 'local');
    setAllowBypass(appConfig.allowMasterApiKeyBypass ?? true);

    const savedAdmin = sessionStorage.getItem('frk_admin');
    setAuthAdminPassword(savedAdmin || '');
  }, [appConfig, isAuthSettingsOpen]);

  if (!isAuthSettingsOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authAdminPassword.trim()) {
      setAlert({
        type: 'error',
        text: 'Enter your Admin Password to authorize configuration changes.',
      });
      return;
    }

    setIsSaving(true);
    setAlert(null);

    try {
      const res = await fetch('/api/public/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password: authAdminPassword.trim(),
          apiKey: apiKey.trim(),
          adminPassword: newAdminPassword.trim() || undefined,
          authMode,
          allowMasterApiKeyBypass: allowBypass,
        }),
      });

      const data = await res.json();
      if (data.ok) {
        setAlert({
          type: 'success',
          text: 'API key and authentication settings updated successfully!',
        });
        if (newAdminPassword.trim()) {
          sessionStorage.setItem('frk_admin', newAdminPassword.trim());
          setAuthAdminPassword(newAdminPassword.trim());
          setNewAdminPassword('');
        }
        await refreshConfig();
      } else {
        setAlert({
          type: 'error',
          text: data.error || 'Failed to update settings. Check admin password.',
        });
      }
    } catch {
      setAlert({
        type: 'error',
        text: 'Network error updating configuration.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="auth-settings-overlay">
      <div className="auth-settings-dialog" role="dialog" aria-modal="true" aria-labelledby="auth-settings-title">
        <header className="auth-settings-header">
          <div className="auth-settings-title">
            <div className="auth-settings-icon">
              <KeyRound size={23} />
            </div>
            <div>
              <h2 id="auth-settings-title">API Key &amp; Auth Configuration</h2>
              <p>Customize API keys and authentication logic</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setAuthSettingsOpen(false)}
            className="auth-settings-close"
            aria-label="Close settings"
          >
            <X size={23} />
          </button>
        </header>

        {alert && (
          <div className={`auth-settings-alert ${alert.type === 'success' ? 'is-success' : 'is-error'}`}>
            {alert.type === 'success' ? <CircleCheck size={16} /> : <CircleAlert size={16} />}
            <span>{alert.text}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="auth-settings-form">
          <section className="auth-settings-section">
            <div className="auth-settings-section-header">
              <h3><KeyRound size={16} /> MASTER API KEY</h3>
              <button
                type="button"
                onClick={() => {
                  if (!apiKey.trim()) return;
                  activateKey(apiKey.trim(), {
                    id: 'master_key',
                    license_key: apiKey.trim(),
                    full_name: 'Master VIP Admin',
                    duration_label: 'Master API Key',
                    lifetime: true,
                    status: 'approved',
                    max_devices: 999,
                  });
                  setAuthSettingsOpen(false);
                }}
                className="auth-settings-active-license"
              >
                <ExternalLink size={15} />
                Use as Active License
              </button>
            </div>
            <p className="auth-settings-description">
              Any user entering this API key on the activation page receives instant unlocked access.
            </p>
            <input
              className="auth-settings-input"
              type="text"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="e.g. FRK-PRO-MASTER-KEY-2026"
              aria-label="Master API key"
            />
            <label className="auth-settings-checkbox">
              <input
                type="checkbox"
                checked={allowBypass}
                onChange={(e) => setAllowBypass(e.target.checked)}
              />
              <span>Allow master API key bypass</span>
            </label>
          </section>

          <section className="auth-settings-section auth-settings-admin">
            <h3><Lock size={16} /> ADMIN AUTHORIZATION</h3>
            <p className="auth-settings-description">
              Enter current password to authorize changes, and optionally specify a new password.
            </p>
            <div className="auth-password-grid">
              <div>
                <label htmlFor="current-admin-password">CURRENT ADMIN PASSWORD *</label>
                <div className="auth-password-field">
                  <input
                    id="current-admin-password"
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={authAdminPassword}
                    onChange={(e) => setAuthAdminPassword(e.target.value)}
                    placeholder="Required"
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    aria-label={showCurrentPassword ? 'Hide current password' : 'Show current password'}
                  >
                    {showCurrentPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>
              <div>
                <label htmlFor="new-admin-password">NEW ADMIN PASSWORD (OPTIONAL)</label>
                <div className="auth-password-field">
                  <input
                    id="new-admin-password"
                    type={showNewPassword ? 'text' : 'password'}
                    value={newAdminPassword}
                    onChange={(e) => setNewAdminPassword(e.target.value)}
                    placeholder="Leave blank to keep current"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    aria-label={showNewPassword ? 'Hide new password' : 'Show new password'}
                  >
                    {showNewPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>
            </div>
          </section>

          <div className="auth-settings-actions">
            <button
              type="button"
              onClick={() => setAuthSettingsOpen(false)}
              className="auth-settings-cancel"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="bot-button bot-button-neon auth-settings-submit"
            >
              <Save size={16} />
              <span>{isSaving ? 'Saving...' : 'Save & Apply Settings'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
