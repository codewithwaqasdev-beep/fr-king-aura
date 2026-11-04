// @ts-nocheck -- imported original app code, kept unchanged
import React, { useState, useEffect } from 'react';
import { useBot } from '../context/BotContext';
import { Shell } from './Shell';
import { PairChart } from './PairChart';
import {
  CURRENCY_PAIRS,
  OTC_PAIRS,
  LIVE_TIMERS,
  FUTURE_TIMERS,
  formatTime,
} from '../constants.ts';
import { SignalItem } from '../types.ts';
import {
  generateOptimizedSignal,
  playSignalCatchNotification,
} from '../utils/marketSimulator.ts';
import {
  Zap,
  Clock,
  Globe,
  ChevronDown,
  Brain,
  TrendingUp,
  Activity,
  Layers,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  Copy,
  Check,
  List,
  Search,
  BarChart3,
  Share2,
  Percent,
  Target,
  ShieldCheck,
  DollarSign,
  Gauge,
  Sparkles,
} from 'lucide-react';

interface ScanStepItem {
  title: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

const SCAN_STEPS: ScanStepItem[] = [
  { title: 'Scanning Market Data', icon: Search },
  { title: 'Analyzing Price Action', icon: BarChart3 },
  { title: 'Checking Market Trends', icon: TrendingUp },
  { title: 'Detecting Patterns', icon: Share2 },
  { title: 'Calculating Accuracy', icon: Percent },
  { title: 'Finalizing Signal', icon: Target },
];

export const DashboardView: React.FC = () => {
  const { addSignal, navigateTo, signals } = useBot();

  const [marketType, setMarketType] = useState<'OTC Markets' | 'Live Markets'>('OTC Markets');
  const [selectedPair, setSelectedPair] = useState<string>(OTC_PAIRS[0]);
  const [timer, setTimer] = useState<string>(LIVE_TIMERS[0]);
  const [mode, setMode] = useState<'live' | 'future'>('live');
  const [futureEntryTime, setFutureEntryTime] = useState<string>('');

  const [stage, setStage] = useState<'idle' | 'loading' | 'result'>('idle');
  const [activeSignal, setActiveSignal] = useState<SignalItem | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [scanStepIndex, setScanStepIndex] = useState<number>(0);
  const [countdown, setCountdown] = useState<number>(6);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isPriceCopied, setIsPriceCopied] = useState<boolean>(false);

  // Live trade expiry countdown
  const [tradeSecondsLeft, setTradeSecondsLeft] = useState<number>(0);
  const [tradeTotalSeconds, setTradeTotalSeconds] = useState<number>(60);
  const [isTradeExpired, setIsTradeExpired] = useState<boolean>(false);

  const availablePairs = marketType === 'Live Markets' ? CURRENCY_PAIRS : OTC_PAIRS;
  const availableTimers = mode === 'live' ? LIVE_TIMERS : FUTURE_TIMERS;

  const handleModeChange = (newMode: 'live' | 'future') => {
    setMode(newMode);
    const timers = newMode === 'live' ? LIVE_TIMERS : FUTURE_TIMERS;
    setTimer(timers[0]);
    if (newMode === 'future' && !futureEntryTime) {
      // Default to 5 minutes in future
      const future = new Date(Date.now() + 5 * 60 * 1000);
      setFutureEntryTime(future.toISOString().slice(0, 16));
    }
  };

  // Signal generation sequence
  useEffect(() => {
    if (stage !== 'loading') return;

    setScanStepIndex(0);
    setCountdown(6);

    const timerInterval = window.setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    const stepInterval = window.setInterval(() => {
      setScanStepIndex((prev) => (prev < SCAN_STEPS.length - 1 ? prev + 1 : prev));
    }, 1000);

    const finishTimeout = window.setTimeout(() => {
      const newSig = generateOptimizedSignal({
        pair: selectedPair,
        market: marketType,
        timer,
        mode,
        futureEntryTime,
      });
      setActiveSignal(newSig);
      addSignal(newSig);
      playSignalCatchNotification();
      setStage('result');
    }, 6000);

    return () => {
      window.clearInterval(timerInterval);
      window.clearInterval(stepInterval);
      window.clearTimeout(finishTimeout);
    };
  }, [stage, selectedPair, marketType, timer, mode, futureEntryTime, addSignal]);

  // Live active trade expiry countdown effect
  useEffect(() => {
    if (stage !== 'result' || !activeSignal) return;

    const expiryTime = new Date(activeSignal.expiry).getTime();
    const entryTime = new Date(activeSignal.entry).getTime();
    const total = Math.max(1, Math.round((expiryTime - entryTime) / 1000));
    setTradeTotalSeconds(total);

    const checkTimer = () => {
      const now = Date.now();
      const diff = Math.round((expiryTime - now) / 1000);
      if (diff <= 0) {
        setTradeSecondsLeft(0);
        setIsTradeExpired(true);
      } else {
        setTradeSecondsLeft(diff);
        setIsTradeExpired(false);
      }
    };

    checkTimer();
    const interval = window.setInterval(checkTimer, 1000);
    return () => window.clearInterval(interval);
  }, [stage, activeSignal]);

  const handleStartGenerate = () => {
    if (mode === 'future') {
      if (!futureEntryTime || new Date(futureEntryTime).getTime() <= Date.now()) {
        setErrorMsg('Select a valid future entry time.');
        return;
      }
    }
    setErrorMsg('');
    setIsCopied(false);
    setIsPriceCopied(false);
    setScanStepIndex(0);
    setCountdown(6);
    setStage('loading');
  };

  const handleCopySignal = async () => {
    if (!activeSignal) return;
    const isUp = activeSignal.direction === 'BUY';
    const text = [
      `👑 FR-KING VIP SIGNAL 👑`,
      `━━━━━━━━━━━━━━━━━━`,
      `📊 Pair: ${activeSignal.pair}`,
      `⚡ Direction: ${isUp ? 'CALL / UP 🔼' : 'PUT / DOWN 🔽'}`,
      `🎯 Strike: ${activeSignal.strikePrice || 'Market Order'}`,
      `⏱ Duration: ${activeSignal.timer}`,
      `⏰ Entry: ${formatTime(activeSignal.entry)}`,
      `⌛ Expiry: ${formatTime(activeSignal.expiry)}`,
      `🔥 Accuracy: ${activeSignal.accuracy || '98.6%'}`,
      `💰 Est. Payout: ${activeSignal.payout || '92%'}`,
      `🏛 Broker: Quotex`,
      `━━━━━━━━━━━━━━━━━━`,
      `⚡ FR-KING AURA AI BOT PRO`,
    ].join('\n');

    try {
      await navigator.clipboard.writeText(text);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    } catch {
      setErrorMsg('Could not copy signal to clipboard.');
    }
  };

  const handleCopyStrikePrice = async (price: string) => {
    try {
      await navigator.clipboard.writeText(price);
      setIsPriceCopied(true);
      setTimeout(() => setIsPriceCopied(false), 1500);
    } catch {}
  };

  const todayCount = signals.filter((s) => {
    const d = new Date(s.entry);
    const today = new Date();
    return d.toDateString() === today.toDateString();
  }).length;

  return (
    <Shell showDashboardHeader={true}>
      <section className='genrate_signal_section'>
         <PairChart pair={selectedPair} market={marketType} />
      <section className="terminal" id="signal-generator">
        {/* IDLE VIEW */}
        {stage === 'idle' && (
          <>
            <h2 className="terminal-heading">
              GENERATE <span>SIGNALS</span>
            </h2>
            <p className="terminal-subtitle">
              AI Analyzed High Accuracy Trading Signals
            </p>

            {/* Signal Modes: Live vs Future */}
            <div className="signal-modes">
              <button
                className="bot-button bot-button-outline cursor-pointer"
                data-active={mode === 'live'}
                onClick={() => handleModeChange('live')}
              >
                <Zap size={14} />
                <span>LIVE SIGNAL</span>
              </button>

              <button
                className="bot-button bot-button-outline cursor-pointer"
                data-active={mode === 'future'}
                onClick={() => handleModeChange('future')}
              >
                <Clock size={14} />
                <span>FUTURE SIGNAL</span>
              </button>
            </div>

            {/* Broker Selector */}
            <div className="selector-row">
              <span className="selector-icon">
                <img
                  src="/quotex-logo.png"
                  alt="Quotex"
                  className="w-5 h-5 object-contain"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              </span>
              <div className="selector-main">
                <label>BROKER</label>
                <select value="Quotex" disabled className="cursor-default">
                  <option value="Quotex">Quotex</option>
                </select>
              </div>
              <ChevronDown size={16} className="selector-chevron" />
            </div>

            {/* Market Selector */}
            <div className="selector-row">
              <span className="selector-icon">
                <Globe size={22} />
              </span>
              <div className="selector-main">
                <label>MARKET</label>
                <select
                  value={marketType}
                  onChange={(e) => {
                    const newType = e.target.value as 'OTC Markets' | 'Live Markets';
                    setMarketType(newType);
                    setSelectedPair(newType === 'Live Markets' ? CURRENCY_PAIRS[0] : OTC_PAIRS[0]);
                  }}
                >
                  <option value="OTC Markets">OTC Markets</option>
                  <option value="Live Markets">Live Markets</option>
                </select>
              </div>
              <ChevronDown size={16} className="selector-chevron" />
            </div>

            {/* Pair Selector */}
            <div className="selector-row">
              <span className="selector-icon text-lg">💱</span>
              <div className="selector-main">
                <label>PAIR</label>
                <select
                  value={selectedPair}
                  aria-label="Currency pair"
                  onChange={(e) => setSelectedPair(e.target.value)}
                >
                  {availablePairs.map((pair) => (
                    <option key={pair} value={pair}>
                      {pair}
                    </option>
                  ))}
                </select>
              </div>
              <ChevronDown size={16} className="selector-chevron" />
            </div>

           

            {/* Timer Selector */}
            <div className="selector-row">
              <span className="selector-icon">
                <Clock size={20} />
              </span>
              <div className="selector-main">
                <label>TIMER</label>
                <select
                  value={timer}
                  onChange={(e) => setTimer(e.target.value)}
                >
                  {availableTimers.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <ChevronDown size={16} className="selector-chevron" />
            </div>

            {/* Future Entry Time Picker if in future mode */}
            {mode === 'future' && (
              <div className="selector-row">
                <span className="selector-icon">
                  <Clock size={20} />
                </span>
                <div className="selector-main">
                  <label htmlFor="future-entry">ENTRY TIME</label>
                  <input
                    id="future-entry"
                    type="datetime-local"
                    value={futureEntryTime}
                    onChange={(e) => setFutureEntryTime(e.target.value)}
                    className="text-sm font-mono text-[var(--primary-hover)]"
                  />
                </div>
              </div>
            )}

            {errorMsg && (
              <p role="alert" className="text-[var(--sell)] text-xs font-bold my-2 text-center">
                {errorMsg}
              </p>
            )}

            {/* Generate Action Button */}
            <button
              className="bot-button bot-button-neon generate-button flex items-center justify-center gap-2 cursor-pointer"
              onClick={handleStartGenerate}
            >
              <Zap size={17} />
              <span>GENERATE {mode === 'future' ? 'FUTURE ' : ''}SIGNAL</span>
            </button>

            {/* Metrics */}
            <div className="metrics">
              <div className="metric">
                <Brain />
                <small>AI ACCURACY</small>
                <strong>98.6%</strong>
              </div>
              <div className="metric">
                <TrendingUp />
                <small>SIGNAL STR.</small>
                <strong>98.7%</strong>
              </div>
              <div className="metric">
                <Clock />
                <small>AVG TIME</small>
                <strong>00:45</strong>
              </div>
              <div className="metric">
                <Activity />
                <small>TODAY</small>
                <strong>{Math.max(32, todayCount)}</strong>
              </div>
            </div>
          </>
        )}

        {/* LOADING STAGE */}
        {stage === 'loading' && (
          <div className="loading-stage" role="status">
            <h2 className="terminal-heading">
              GENERATING <span>SIGNALS</span>
            </h2>
            <p className="terminal-subtitle">
              Please wait while our AI analyzes the market and finds the best opportunity...
            </p>

            {/* Authentic Radar Scanner SVG */}
            <svg
              viewBox="0 0 300 230"
              width="320"
              height="246"
              xmlns="http://www.w3.org/2000/svg"
              className="select-none"
            >
              <defs>
                <radialGradient id="glow">
                  <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
                </radialGradient>
                <linearGradient id="sweep" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="var(--primary)" stopOpacity="0" />
                  <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.35" />
                </linearGradient>
                <clipPath id="core">
                  <circle cx="150" cy="104" r="29" />
                </clipPath>
              </defs>

              <circle cx="150" cy="104" r="100" fill="url(#glow)">
                <animate attributeName="r" values="92;104;92" dur="4s" repeatCount="indefinite" />
              </circle>
              <circle cx="150" cy="104" r="45" fill="none" stroke="var(--primary)" strokeOpacity="0.3" strokeDasharray="3 5" />
              <circle cx="150" cy="104" r="68" fill="none" stroke="var(--primary)" strokeOpacity="0.2" />
              <circle cx="150" cy="104" r="88" fill="none" stroke="var(--primary)" strokeOpacity="0.14" />
              <line x1="150" y1="14" x2="150" y2="194" stroke="var(--primary)" strokeOpacity="0.1" />
              <line x1="60" y1="104" x2="240" y2="104" stroke="var(--primary)" strokeOpacity="0.1" />

              {/* Pulsing rings */}
              <circle cx="150" cy="104" r="30" fill="none" stroke="var(--primary)" strokeWidth="1.6">
                <animate attributeName="r" values="30;90" dur="3.6s" repeatCount="indefinite" />
                <animate attributeName="stroke-opacity" values="0.7;0" dur="3.6s" repeatCount="indefinite" />
              </circle>
              <circle cx="150" cy="104" r="30" fill="none" stroke="var(--primary)" strokeWidth="1.6">
                <animate attributeName="r" values="30;90" dur="3.6s" begin="1.2s" repeatCount="indefinite" />
                <animate attributeName="stroke-opacity" values="0.7;0" dur="3.6s" begin="1.2s" repeatCount="indefinite" />
              </circle>
              <circle cx="150" cy="104" r="30" fill="none" stroke="var(--primary)" strokeWidth="1.6">
                <animate attributeName="r" values="30;90" dur="3.6s" begin="2.4s" repeatCount="indefinite" />
                <animate attributeName="stroke-opacity" values="0.7;0" dur="3.6s" begin="2.4s" repeatCount="indefinite" />
              </circle>

              {/* Rotating Sweep */}
              <g>
                <path d="M150 104 L150 16 A88 88 0 0 1 212 42 Z" fill="url(#sweep)" transform="rotate(-30 150 104)" />
                <line x1="150" y1="104" x2="150" y2="16" stroke="var(--primary)" strokeWidth="1.6" strokeLinecap="round" transform="rotate(30 150 104)" />
                <animateTransform attributeName="transform" type="rotate" from="0 150 104" to="360 150 104" dur="5s" repeatCount="indefinite" />
              </g>

              <circle cx="150" cy="104" r="68" fill="none" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="80 347">
                <animateTransform attributeName="transform" type="rotate" from="360 150 104" to="0 150 104" dur="9s" repeatCount="indefinite" />
              </circle>
              <circle cx="150" cy="104" r="88" fill="none" stroke="var(--primary)" strokeOpacity="0.7" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="30 523">
                <animateTransform attributeName="transform" type="rotate" from="0 150 104" to="360 150 104" dur="6s" repeatCount="indefinite" />
              </circle>

              {/* Core and Candlesticks */}
              <circle cx="150" cy="104" r="29" fill="var(--surface-1)" stroke="var(--primary)" strokeOpacity="0.85" />
              <circle cx="150" cy="104" r="35" fill="none" stroke="var(--primary)" strokeOpacity="0.25">
                <animate attributeName="stroke-opacity" values="0.15;0.5;0.15" dur="2s" repeatCount="indefinite" />
              </circle>

              {/* Candlestick bars in core */}
              <g clipPath="url(#core)">
                <g stroke="var(--primary)" strokeOpacity="0.35" strokeWidth="1">
                  <line x1="132" y1="108" x2="132" y2="124" />
                  <line x1="141" y1="102" x2="141" y2="118" />
                  <line x1="150" y1="96" x2="150" y2="114" />
                  <line x1="159" y1="90" x2="159" y2="108" />
                  <line x1="168" y1="82" x2="168" y2="102" />
                </g>
                <polyline
                  points="124,122 134,114 141,119 150,104 158,108 168,90 176,84"
                  fill="none"
                  stroke="var(--primary)"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray="90"
                  strokeDashoffset="90"
                >
                  <animate attributeName="stroke-dashoffset" values="90;0;0;90" keyTimes="0;0.45;0.85;1" dur="3.6s" repeatCount="indefinite" />
                </polyline>
              </g>

              {/* Floating BUY / SELL Signal blips */}
              <g>
                <rect x="30" y="38" width="40" height="18" rx="9" fill="var(--primary)" />
                <text x="50" y="50.5" fontSize="9.5" fontWeight="700" textAnchor="middle" fill="var(--surface-1)">
                  BUY ▲
                </text>
                <circle cx="50" cy="47" r="14" fill="none" stroke="var(--primary)">
                  <animate attributeName="r" values="18;30" dur="3s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.6;0" dur="3s" repeatCount="indefinite" />
                </circle>
                <animate attributeName="opacity" values="0;1;1;0;0" keyTimes="0;0.1;0.4;0.5;1" dur="6s" repeatCount="indefinite" />
              </g>

              <g>
                <rect x="230" y="46" width="44" height="18" rx="9" fill="var(--surface-1)" stroke="var(--primary)" />
                <text x="252" y="58.5" fontSize="9.5" fontWeight="700" textAnchor="middle" fill="var(--primary)">
                  SELL ▼
                </text>
                <animate attributeName="opacity" values="0;0;1;1;0;0" keyTimes="0;0.2;0.3;0.6;0.7;1" dur="6s" repeatCount="indefinite" />
              </g>

              {/* Live fluctuating histogram bars at bottom */}
              <g fill="var(--primary)">
                <rect x="96" y="204" width="6" height="14" rx="1">
                  <animate attributeName="height" values="14;22;10;14" dur="2.4s" repeatCount="indefinite" />
                  <animate attributeName="y" values="204;198;208;204" dur="2.4s" repeatCount="indefinite" />
                </rect>
                <rect x="109" y="202" width="6" height="16" rx="1" fillOpacity="0.5">
                  <animate attributeName="height" values="16;8;20;16" dur="2.8s" repeatCount="indefinite" />
                  <animate attributeName="y" values="202;210;198;202" dur="2.8s" repeatCount="indefinite" />
                </rect>
                <rect x="122" y="200" width="6" height="18" rx="1">
                  <animate attributeName="height" values="18;24;12;18" dur="2.2s" repeatCount="indefinite" />
                  <animate attributeName="y" values="200;194;206;200" dur="2.2s" repeatCount="indefinite" />
                </rect>
                <rect x="135" y="206" width="6" height="12" rx="1" fillOpacity="0.5">
                  <animate attributeName="height" values="12;20;8;12" dur="3s" repeatCount="indefinite" />
                  <animate attributeName="y" values="206;198;210;206" dur="3s" repeatCount="indefinite" />
                </rect>
                <rect x="148" y="198" width="6" height="20" rx="1">
                  <animate attributeName="height" values="20;12;24;20" dur="2.6s" repeatCount="indefinite" />
                  <animate attributeName="y" values="198;206;194;198" dur="2.6s" repeatCount="indefinite" />
                </rect>
                <rect x="161" y="203" width="6" height="15" rx="1" fillOpacity="0.5">
                  <animate attributeName="height" values="15;22;9;15" dur="2.3s" repeatCount="indefinite" />
                  <animate attributeName="y" values="203;196;209;203" dur="2.3s" repeatCount="indefinite" />
                </rect>
                <rect x="174" y="200" width="6" height="18" rx="1">
                  <animate attributeName="height" values="18;10;22;18" dur="2.9s" repeatCount="indefinite" />
                  <animate attributeName="y" values="200;208;196;200" dur="2.9s" repeatCount="indefinite" />
                </rect>
                <rect x="187" y="205" width="6" height="13" rx="1" fillOpacity="0.5">
                  <animate attributeName="height" values="13;20;8;13" dur="2.5s" repeatCount="indefinite" />
                  <animate attributeName="y" values="205;198;210;205" dur="2.5s" repeatCount="indefinite" />
                </rect>
              </g>
              <line x1="90" y1="218" x2="210" y2="218" stroke="var(--primary)" strokeOpacity="0.3" />
            </svg>

            {/* Header: ANALYZING MARKET, Please wait, Countdown Timer */}
            <div className="text-center my-3 w-full">
              <div className="font-['Oxanium'] font-extrabold text-sm md:text-base tracking-[0.22em] text-[var(--primary)] uppercase drop-shadow-[0_0_12px_rgba(45,212,191,0.5)]">
                ANALYZING MARKET
              </div>
              <p className="text-[var(--text-muted)] text-xs font-mono mt-0.5">
                Please wait...
              </p>
              <div className="text-4xl md:text-5xl font-black font-['Oxanium'] tracking-wider text-white drop-shadow-[0_0_20px_rgba(45,212,191,0.45)] my-2 font-mono select-none">
                00:{String(countdown).padStart(2, '0')}
              </div>
            </div>

            {/* Checklist Container Card matching blue section layout with brand colors */}
            <div className="w-full bg-[var(--bg)]/90 border border-[var(--primary)]/25 rounded-2xl p-3.5 shadow-[0_0_25px_rgba(0,0,0,0.8),inset_0_0_15px_rgba(45,212,191,0.04)] mt-1 mb-2">
              <div className="flex flex-col gap-2">
                {SCAN_STEPS.map((step, idx) => {
                  const isCompleted = idx < scanStepIndex;
                  const isCurrent = idx === scanStepIndex;
                  const isPending = idx > scanStepIndex;
                  const StepIcon = step.icon;

                  return (
                    <div
                      key={step.title}
                      className={`flex items-center justify-between py-2 px-3 rounded-xl transition-all duration-300 ${
                        isCurrent
                          ? 'bg-[var(--primary)]/10 border border-[var(--primary)]/30 shadow-[0_0_15px_rgba(45,212,191,0.15)]'
                          : isCompleted
                          ? 'bg-transparent text-white'
                          : 'bg-transparent text-[var(--text-faint)] opacity-45'
                      }`}
                    >
                      {/* Left icon and label */}
                      <div className="flex items-center gap-3 min-w-0">
                        <StepIcon
                          size={18}
                          className={`shrink-0 transition-colors ${
                            isCompleted
                              ? 'text-[var(--primary)]'
                              : isCurrent
                              ? 'text-[var(--primary)] animate-pulse drop-shadow-[0_0_8px_rgba(45,212,191,0.6)]'
                              : 'text-[var(--text-faint)]'
                          }`}
                        />
                        <span
                          className={`text-xs md:text-sm tracking-wide truncate ${
                            isCompleted
                              ? 'font-medium text-white'
                              : isCurrent
                              ? 'font-bold text-[var(--primary)]'
                              : 'font-normal text-[var(--text-faint)]'
                          }`}
                        >
                          {step.title}
                        </span>
                      </div>

                      {/* Right status icon */}
                      <div className="shrink-0 ml-3">
                        {isCompleted && (
                          <div className="w-5 h-5 rounded-full bg-[var(--primary)] text-black flex items-center justify-center shadow-[0_0_10px_rgba(45,212,191,0.6)]">
                            <Check size={12} strokeWidth={3.5} />
                          </div>
                        )}
                        {isCurrent && (
                          <div className="w-5 h-5 rounded-full border-2 border-[var(--primary)]/30 border-t-[var(--primary)] animate-spin shadow-[0_0_10px_rgba(45,212,191,0.4)]" />
                        )}
                        {isPending && (
                          <div className="w-5 h-5 rounded-full border-2 border-[var(--border)]" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* RESULT STAGE */}
        {stage === 'result' && activeSignal && (
          <div className="flex flex-col gap-3 animate-in fade-in zoom-in-95 duration-300">
            {/* Top Bar: Verification, Signal ID & Broker */}
            <div className="flex items-center justify-between bg-[var(--bg)]/90 border border-[var(--border)] rounded-xl px-3 py-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--buy)] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[var(--buy)]"></span>
                </span>
                <span className="font-['Oxanium'] font-bold text-white tracking-wider text-[11px] uppercase">
                  {activeSignal.mode === 'future' ? 'FUTURE ORDER LOCKED' : 'LIVE SIGNAL CAUGHT'}
                </span>
              </div>
              <div className="flex items-center gap-1.5 font-mono text-[11px] text-[var(--text-muted)]">
                <span className="bg-[var(--surface-1)] px-1.5 py-0.5 rounded border border-[var(--border)]">Quotex OTC</span>
                <span className="text-[var(--primary)] font-bold">{activeSignal.id}</span>
              </div>
            </div>

            {/* Main Hero Direction Card */}
            <div
              className={`relative overflow-hidden rounded-2xl border p-4 transition-all ${
                activeSignal.direction === 'BUY'
                  ? 'bg-gradient-to-b from-[var(--buy)]/15 via-[var(--surface-2)]/90 to-[var(--surface-2)] border-[var(--buy)]/40 shadow-[0_0_30px_rgba(34,197,94,0.18)]'
                  : 'bg-gradient-to-b from-[var(--sell)]/15 via-[var(--surface-2)]/90 to-[var(--surface-2)] border-[var(--sell)]/40 shadow-[0_0_30px_rgba(244,63,94,0.18)]'
              }`}
            >
              {/* Subtle background glow circle */}
              <div
                className={`absolute -top-12 -right-12 w-40 h-40 rounded-full blur-3xl opacity-20 pointer-events-none ${
                  activeSignal.direction === 'BUY' ? 'bg-[var(--buy)]' : 'bg-[var(--sell)]'
                }`}
              />

              <div className="flex items-center justify-between gap-3 relative z-10">
                {/* Left Side: Pair & Action Command */}
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] font-mono uppercase tracking-wider text-[var(--text-muted)]">
                    {activeSignal.market}
                  </div>
                  <h3 className="text-xl md:text-2xl font-black font-['Oxanium'] text-white truncate drop-shadow-sm tracking-wide">
                    {activeSignal.pair}
                  </h3>
                  <div className="mt-1 flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        activeSignal.direction === 'BUY'
                          ? 'bg-[var(--buy)]/20 text-[var(--buy)] border border-[var(--buy)]/40'
                          : 'bg-[var(--sell)]/20 text-[var(--sell)] border border-[var(--sell)]/40'
                      }`}
                    >
                      {activeSignal.direction === 'BUY' ? '▲ CALL / HIGHER' : '▼ PUT / LOWER'}
                    </span>
                    <span className="text-[10px] text-[var(--text-muted)] font-mono">
                      {activeSignal.timer}
                    </span>
                  </div>
                </div>

                {/* Right Side: Direction Icon Ring */}
                <div
                  className={`w-20 h-20 md:w-24 md:h-24 rounded-full flex flex-col items-center justify-center shrink-0 border-2 transition-transform duration-300 relative ${
                    activeSignal.direction === 'BUY'
                      ? 'border-[var(--buy)] bg-[var(--buy)]/10 text-[var(--buy)] shadow-[0_0_20px_rgba(34,197,94,0.35)]'
                      : 'border-[var(--sell)] bg-[var(--sell)]/10 text-[var(--sell)] shadow-[0_0_20px_rgba(244,63,94,0.35)]'
                  }`}
                >
                  {activeSignal.direction === 'BUY' ? (
                    <ArrowUp strokeWidth={3.5} size={32} className="animate-bounce" />
                  ) : (
                    <ArrowDown strokeWidth={3.5} size={32} className="animate-bounce" />
                  )}
                  <span className="font-['Oxanium'] font-black text-sm md:text-base leading-none">
                    {activeSignal.direction === 'BUY' ? 'UP' : 'DOWN'}
                  </span>
                  <span className="text-[8px] font-bold tracking-widest uppercase opacity-85 mt-0.5">
                    {activeSignal.direction}
                  </span>
                </div>
              </div>

              {/* Price Entry & Payout Banner */}
              <div className="mt-3.5 pt-3 border-t border-white/10 grid grid-cols-2 gap-2 relative z-10">
                <button
                  type="button"
                  onClick={() => activeSignal.strikePrice && handleCopyStrikePrice(activeSignal.strikePrice)}
                  className="bg-black/40 hover:bg-black/60 border border-white/10 rounded-xl p-2.5 text-left transition-colors cursor-pointer group"
                  title="Click to copy strike price"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-mono text-[var(--text-muted)] uppercase tracking-wider">
                      Strike / Entry Price
                    </span>
                    {isPriceCopied ? (
                      <Check size={11} className="text-[var(--buy)]" />
                    ) : (
                      <Copy size={11} className="text-[var(--text-muted)] group-hover:text-white transition-colors" />
                    )}
                  </div>
                  <div className="text-base font-black font-mono text-white tracking-wide mt-0.5 group-hover:text-[var(--primary)] transition-colors">
                    {activeSignal.strikePrice || 'Market Rate'}
                  </div>
                </button>

                <div className="bg-black/40 border border-white/10 rounded-xl p-2.5 text-left">
                  <div className="text-[9px] font-mono text-[var(--text-muted)] uppercase tracking-wider">
                    Quotex Est. Payout
                  </div>
                  <div className="text-base font-black font-mono text-[var(--primary)] tracking-wide mt-0.5 flex items-center gap-1">
                    <span>{activeSignal.payout || '92%'}</span>
                    <span className="text-[10px] text-[var(--buy)] font-bold">(+1.92x)</span>
                  </div>
                </div>
              </div>

              {/* Live Trade Expiry Countdown Bar */}
              <div className="mt-3 bg-black/50 border border-white/10 rounded-xl p-2.5 relative z-10">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-[var(--text-muted)] text-[10px] font-mono flex items-center gap-1.5">
                    <Clock size={12} className={isTradeExpired ? 'text-[var(--buy)]' : 'text-[var(--primary)] animate-spin'} />
                    {isTradeExpired ? (
                      <span className="text-[var(--buy)] font-bold">SIGNAL TIME COMPLETED</span>
                    ) : (
                      <span>TRADE EXPIRY COUNTDOWN</span>
                    )}
                  </span>
                  <span className="font-mono font-bold text-white text-xs">
                    {isTradeExpired ? (
                      <span className="text-[var(--buy)]">TARGET REACHED ✓</span>
                    ) : (
                      `${Math.floor(tradeSecondsLeft / 60)
                        .toString()
                        .padStart(2, '0')}:${(tradeSecondsLeft % 60).toString().padStart(2, '0')} LEFT`
                    )}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-[var(--surface-1)] h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-1000 ${
                      isTradeExpired ? 'bg-[var(--buy)] w-full' : 'bg-gradient-to-r from-[var(--primary)] to-[var(--buy)]'
                    }`}
                    style={{
                      width: isTradeExpired
                        ? '100%'
                        : `${Math.max(0, Math.min(100, ((tradeTotalSeconds - tradeSecondsLeft) / tradeTotalSeconds) * 100))}%`,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Timing & Accuracy Parameters Grid */}
            <div className="grid grid-cols-4 gap-2 bg-[var(--bg)]/90 border border-[var(--border)] rounded-2xl p-2.5 text-center">
              <div className="p-1">
                <span className="text-[8px] font-mono text-[var(--text-muted)] uppercase block">ENTRY</span>
                <strong className="text-xs font-mono font-bold text-white block mt-0.5">
                  {formatTime(activeSignal.entry)}
                </strong>
              </div>
              <div className="p-1 border-l border-[var(--surface-2)]">
                <span className="text-[8px] font-mono text-[var(--text-muted)] uppercase block">EXPIRY</span>
                <strong className="text-xs font-mono font-bold text-[var(--primary)] block mt-0.5">
                  {formatTime(activeSignal.expiry)}
                </strong>
              </div>
              <div className="p-1 border-l border-[var(--surface-2)]">
                <span className="text-[8px] font-mono text-[var(--text-muted)] uppercase block">ACCURACY</span>
                <strong className="text-xs font-mono font-bold text-[var(--buy)] block mt-0.5">
                  {activeSignal.accuracy || '98.6%'}
                </strong>
              </div>
              <div className="p-1 border-l border-[var(--surface-2)]">
                <span className="text-[8px] font-mono text-[var(--text-muted)] uppercase block">STRENGTH</span>
                <strong className="text-xs font-mono font-bold text-[var(--warning)] block mt-0.5">
                  {activeSignal.strength || '98.8%'}
                </strong>
              </div>
            </div>

            {/* Technical Confluences & Confirmation Indicators Card */}
            <div className="bg-[var(--bg)] border border-[var(--primary)]/20 rounded-2xl p-3 shadow-inner">
              <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-[var(--surface-2)]">
                <div className="flex items-center gap-1.5">
                  <Brain size={14} className="text-[var(--primary)]" />
                  <span className="font-['Oxanium'] font-bold text-[11px] text-white tracking-wide uppercase">
                    AI CONFLUENCE MATRIX
                  </span>
                </div>
                <span className="inline-flex items-center gap-1 text-[9px] font-mono text-[var(--buy)] bg-[var(--buy)]/10 px-2 py-0.5 rounded-full border border-[var(--buy)]/30">
                  <ShieldCheck size={10} /> 6/6 Confirmed
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <div className="bg-[var(--surface-1)] border border-[var(--surface-2)] rounded-xl p-2">
                  <div className="flex items-center justify-between text-[var(--text-muted)] font-mono text-[9px]">
                    <span>RSI (14)</span>
                    <span className="text-white font-bold">{activeSignal.direction === 'BUY' ? 'OVERSOLD' : 'OVERBOUGHT'}</span>
                  </div>
                  <div className="font-bold text-white text-[11px] mt-0.5">
                    {activeSignal.rsi || '24.5 (Pivot Point)'}
                  </div>
                </div>

                <div className="bg-[var(--surface-1)] border border-[var(--surface-2)] rounded-xl p-2">
                  <div className="flex items-center justify-between text-[var(--text-muted)] font-mono text-[9px]">
                    <span>MACD HISTOGRAM</span>
                    <span className="text-[var(--buy)] font-bold">CROSSOVER</span>
                  </div>
                  <div className="font-bold text-white text-[11px] mt-0.5">
                    {activeSignal.macd || '+0.00035 (Strong)'}
                  </div>
                </div>

                <div className="bg-[var(--surface-1)] border border-[var(--surface-2)] rounded-xl p-2">
                  <div className="flex items-center justify-between text-[var(--text-muted)] font-mono text-[9px]">
                    <span>STOCHASTIC</span>
                    <span className="text-[var(--primary)] font-bold">MOMENTUM</span>
                  </div>
                  <div className="font-bold text-white text-[11px] mt-0.5">
                    {activeSignal.stoch || '%K 18.2 / %D 20.4'}
                  </div>
                </div>

                <div className="bg-[var(--surface-1)] border border-[var(--surface-2)] rounded-xl p-2">
                  <div className="flex items-center justify-between text-[var(--text-muted)] font-mono text-[9px]">
                    <span>MA CONSENSUS</span>
                    <span className="text-[var(--buy)] font-bold">ALIGNED</span>
                  </div>
                  <div className="font-bold text-white text-[11px] mt-0.5">
                    {activeSignal.maVote || '10/10 Strong Signal'}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons: New Signal & Copy */}
            <div className="flex items-center gap-2 mt-1">
              <button
                type="button"
                onClick={() => setStage('idle')}
                className="flex-1 bg-gradient-to-r from-[var(--primary)] to-[var(--primary-pressed)] hover:brightness-110 text-black font-['Oxanium'] font-black text-xs md:text-sm py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(45,212,191,0.3)] transition-all cursor-pointer active:scale-[0.98]"
              >
                <RefreshCw size={15} />
                <span>CATCH NEXT SIGNAL</span>
              </button>

              <button
                type="button"
                onClick={handleCopySignal}
                className="bg-[var(--surface-1)] hover:bg-[var(--surface-2)] border border-[var(--primary)]/40 text-[var(--primary)] hover:text-white font-['Oxanium'] font-bold text-xs py-3 px-4 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer shrink-0"
                title="Copy VIP Signal"
              >
                {isCopied ? (
                  <>
                    <Check size={15} className="text-[var(--buy)]" />
                    <span className="text-[var(--buy)]">COPIED</span>
                  </>
                ) : (
                  <>
                    <Copy size={15} />
                    <span>COPY</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Win Rate Panel (shown when idle) */}
        {stage === 'idle' && (
          <>
            <section className="win-panel">
              <h3>
                <Layers size={16} className="text-[var(--warning)]" />
                <span>Win Rate</span>
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

            <button
              onClick={() => navigateTo('/future-signals')}
              className="link-row mt-3 w-full rounded-2xl bg-[var(--surface-1)]/60 border border-[var(--border)] p-3.5 flex items-center justify-between text-left cursor-pointer hover:border-[var(--primary)]/40 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <List size={18} className="text-[var(--primary)]" />
                <span className="font-bold text-xs uppercase tracking-wide">
                  FUTURE SIGNAL LIST
                </span>
              </div>
              <ChevronDown size={16} className="text-[var(--text-muted)] -rotate-90" />
            </button>
          </>
        )}

        <p className="signal-note">
          Simulated signals · Original bot display values · Not financial advice
        </p>
      </section>
      </section>
    </Shell>
  );
};
