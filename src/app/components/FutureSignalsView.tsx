// @ts-nocheck -- imported original app code, kept unchanged
import React from 'react';
import { Shell } from './Shell';
import { useBot } from '../context/BotContext';
import { formatTime } from '../constants.ts';
import { List, Zap, ArrowUp, ArrowDown, Clock } from 'lucide-react';

export const FutureSignalsView: React.FC = () => {
  const { signals, navigateTo } = useBot();

  const futureSignals = signals.filter((s) => s.mode === 'future');

  return (
    <Shell>
      <section className="terminal">
        <h2 className="terminal-heading">
          FUTURE SIGNAL <span>LIST</span>
        </h2>
        <p className="terminal-subtitle">
          All your scheduled future signals in one place
        </p>

        {futureSignals.length === 0 ? (
          <div className="empty-state">
            <List size={28} className="mx-auto mb-2 text-[var(--text-muted)]" />
            <p className="text-muted-foreground text-xs">
              No future signals yet. Generate one from the dashboard.
            </p>
            <button
              onClick={() => navigateTo('/dashboard')}
              className="bot-button bot-button-neon flex items-center justify-center gap-2 mt-4 mx-auto cursor-pointer"
            >
              <Zap size={15} />
              <span>Generate Future Signal</span>
            </button>
          </div>
        ) : (
          <ul className="history-list">
            {futureSignals.map((sig) => (
              <li key={sig.id} className="history-item">
                <span className={`direction-dot ${sig.direction === 'BUY' ? 'buy' : 'sell'}`}>
                  {sig.direction === 'BUY' ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                </span>
                <div>
                  <strong>{sig.pair}</strong>
                  <small>
                    {sig.id} · {sig.timer} {sig.strikePrice ? `· @${sig.strikePrice}` : ''}
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
      </section>
    </Shell>
  );
};
