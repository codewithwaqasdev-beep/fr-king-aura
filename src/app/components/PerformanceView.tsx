// @ts-nocheck -- imported original app code, kept unchanged
import React from 'react';
import { Shell } from './Shell';
import { calculateDeterministicStats } from '../constants.ts';
import { Trophy, Award, TrendingUp, ChartColumn, Layers } from 'lucide-react';

export const PerformanceView: React.FC = () => {
  const todayDate = new Date().toDateString();
  const weekly = calculateDeterministicStats('weekly', todayDate);
  const monthly = calculateDeterministicStats('monthly', todayDate);

  return (
    <Shell>
      <section className="terminal">
        <h2 className="terminal-heading">
          BOT <span>PERFORMANCE</span>
        </h2>
        <p className="terminal-subtitle">AI engine accuracy across all markets</p>

        {/* 2x2 Stats Grid */}
        <div className="grid grid-cols-2 gap-2.5 my-2">
          <div className="p-3 rounded-xl bg-[var(--surface-1)]/80 border border-[var(--border)] text-center">
            <Trophy size={18} className="mx-auto text-[var(--warning)] mb-1" />
            <small className="text-[10px] text-muted-foreground font-bold block uppercase tracking-wide">
              WEEKLY WINS
            </small>
            <strong className="text-xl font-bold font-mono text-white mt-0.5 block">
              {weekly.wins}
            </strong>
          </div>

          <div className="p-3 rounded-xl bg-[var(--surface-1)]/80 border border-[var(--border)] text-center">
            <TrendingUp size={18} className="mx-auto text-[var(--primary)] mb-1" />
            <small className="text-[10px] text-muted-foreground font-bold block uppercase tracking-wide">
              WEEKLY RATE
            </small>
            <strong className="text-xl font-bold font-mono text-[var(--primary-hover)] mt-0.5 block">
              {weekly.rate}%
            </strong>
          </div>

          <div className="p-3 rounded-xl bg-[var(--surface-1)]/80 border border-[var(--border)] text-center">
            <Award size={18} className="mx-auto text-[var(--buy)] mb-1" />
            <small className="text-[10px] text-muted-foreground font-bold block uppercase tracking-wide">
              MONTHLY WINS
            </small>
            <strong className="text-xl font-bold font-mono text-white mt-0.5 block">
              {monthly.wins}
            </strong>
          </div>

          <div className="p-3 rounded-xl bg-[var(--surface-1)]/80 border border-[var(--border)] text-center">
            <ChartColumn size={18} className="mx-auto text-[var(--text-muted)] mb-1" />
            <small className="text-[10px] text-muted-foreground font-bold block uppercase tracking-wide">
              MONTHLY RATE
            </small>
            <strong className="text-xl font-bold font-mono text-[var(--text-muted)] mt-0.5 block">
              {monthly.rate}%
            </strong>
          </div>
        </div>

        {/* Market Win Rates Panel */}
        <section className="win-panel mt-3">
          <h3>
            <Layers size={16} className="text-[var(--warning)]" />
            <span>Market Win Rates</span>
          </h3>
          <div className="win-grid">
            <div className="win-stat">
              <small>TODAY</small>
              <strong>92%</strong>
            </div>
            <div className="win-stat">
              <small>WEEK</small>
              <strong>89%</strong>
            </div>
            <div className="win-stat">
              <small>MONTH</small>
              <strong>87%</strong>
            </div>
          </div>
        </section>

        <p className="signal-note">
          Simulated statistics · Original bot display values · Not financial advice
        </p>
      </section>
    </Shell>
  );
};
