// @ts-nocheck -- imported original app code, kept unchanged
import React from 'react';
import { useBot } from '../context/BotContext';
import { Shell } from './Shell';
import { formatTime } from '../constants.ts';
import { Trash2, Clock, ArrowUp, ArrowDown } from 'lucide-react';

export const HistoryView: React.FC = () => {
  const { signals, clearSignals } = useBot();

  const total = signals.length;
  // Calculate simulated win count
  const wins = signals.filter((_, idx) => idx % 4 !== 0).length;
  const losses = total - wins;

  return (
    <Shell>
      <section className="terminal">
        <div className="flex items-center justify-between mb-2">
          <h2 className="terminal-heading flex-1 text-left">
            SIGNAL <span>HISTORY</span>
          </h2>
          {signals.length > 0 && (
            <button
              onClick={clearSignals}
              className="flex items-center gap-1 text-[11px] text-[var(--text-muted)] hover:text-[var(--sell)] transition-colors cursor-pointer"
              title="Clear Session History"
            >
              <Trash2 size={13} />
              <span>Clear</span>
            </button>
          )}
        </div>

        <p className="terminal-subtitle text-left">
          Real-time log of signals generated on this device and synced with database
        </p>

        {/* Win/Loss Stats */}
        <div className="win-grid mb-3">
          <div className="win-stat">
            <small>WINS</small>
            <strong>{wins}</strong>
          </div>
          <div className="win-stat">
            <small>LOSSES</small>
            <strong>{losses}</strong>
          </div>
          <div className="win-stat">
            <small>TOTAL</small>
            <strong>{total}</strong>
          </div>
        </div>

        {signals.length === 0 ? (
          <div className="empty-state">
            <Clock size={24} className="mx-auto mb-2 text-[var(--text-muted)]" />
            <p>No signals generated yet in this session.</p>
            <p className="text-[11px] text-[var(--text-muted)] mt-1">
              Go to Dashboard to generate your first signal.
            </p>
          </div>
        ) : (
          <ul className="history-list">
            {signals.map((sig) => (
              <li key={sig.id} className="history-item">
                <span className={`direction-dot ${sig.direction === 'BUY' ? 'buy' : 'sell'}`}>
                  {sig.direction === 'BUY' ? <ArrowUp size={15} /> : <ArrowDown size={15} />}
                </span>
                <div>
                  <strong>{sig.pair}</strong>
                  <small>
                    {sig.id} · {sig.timer} {sig.strikePrice ? `· @${sig.strikePrice}` : ''} · {sig.accuracy || '98.6%'}
                  </small>
                </div>
                <time>
                  <Clock size={11} />
                  <span>{formatTime(sig.entry)}</span>
                </time>
              </li>
            ))}
          </ul>
        )}

        <p className="signal-note">
          Session logs stored locally & database · Original bot simulation values
        </p>
      </section>
    </Shell>
  );
};
