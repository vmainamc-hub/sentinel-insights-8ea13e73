import { useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
  Clock,
  ExternalLink,
  Flame,
  Layers,
  Percent,
  Search,
  Shield,
  SlidersHorizontal,
  TrendingDown,
  TrendingUp,
  Wallet,
  Wifi,
  Zap,
} from "lucide-react";
import { useCockpit } from "../state/CockpitProvider";
import { fmtMoney, fmtQuote } from "../lib/util";
import type { ContractType, DigitWindow } from "../types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const CONTRACT_TYPES: {
  id: ContractType;
  label: string;
  family: "digits" | "direction" | "barrier";
}[] = [
  { id: "CALL", label: "Rise", family: "direction" },
  { id: "PUT", label: "Fall", family: "direction" },
  { id: "DIGITEVEN", label: "Even", family: "digits" },
  { id: "DIGITODD", label: "Odd", family: "digits" },
  { id: "DIGITOVER", label: "Over", family: "digits" },
  { id: "DIGITUNDER", label: "Under", family: "digits" },
  { id: "DIGITMATCH", label: "Matches", family: "digits" },
  { id: "DIGITDIFF", label: "Differs", family: "digits" },
  { id: "HIGHER", label: "Higher", family: "direction" },
  { id: "LOWER", label: "Lower", family: "direction" },
  { id: "ONETOUCH", label: "Touch", family: "barrier" },
  { id: "NOTOUCH", label: "No Touch", family: "barrier" },
];

const WINDOW_SIZES: DigitWindow[] = [20, 50, 100, 120, 500, 1000];
const DURATIONS = [1, 2, 3, 5, 10];

export function DTraderView() {
  const {
    markets,
    market,
    activeSymbol,
    selectMarket,
    ticks,
    lastTick,
    feedStatus,
    window,
    setWindow,
    config,
    updateConfig,
    selectContractType,
    proposal,
    proposalLoading,
    buy,
    buying,
    openContracts,
    history,
    sell,
    account,
    setAuthModalOpen,
    setFinderOpen,
    latency,
  } = useCockpit();

  const [marketSearch, setMarketSearch] = useState("");
  const [marketMenuOpen, setMarketMenuOpen] = useState(false);
  const [marketCatTab, setMarketCatTab] = useState<string>("all");
  const [pulseDigit, setPulseDigit] = useState<number | null>(null);
  const [chartSpan, setChartSpan] = useState<20 | 50 | 100 | 250>(50);

  // Pulse latest digit on tick
  useEffect(() => {
    if (lastTick) {
      setPulseDigit(lastTick.lastDigit);
      const t = setTimeout(() => setPulseDigit(null), 380);
      return () => clearTimeout(t);
    }
  }, [lastTick]);

  // Digits statistics over active window with color-coded classification
  const activeTicks = useMemo(() => {
    return ticks.slice(-window);
  }, [ticks, window]);

  const digitStats = useMemo(() => {
    const counts = Array(10).fill(0);
    for (const t of activeTicks) {
      if (t.lastDigit >= 0 && t.lastDigit <= 9) counts[t.lastDigit]++;
    }
    const total = activeTicks.length || 1;
    const pcts = counts.map((c) => (c / total) * 100);

    // Calculate momentum/increase: compare recent slice vs overall window
    const recentN = Math.min(20, Math.max(6, Math.floor(activeTicks.length / 4)));
    const recentSlice = activeTicks.slice(-recentN);
    const recentCounts = Array(10).fill(0);
    for (const t of recentSlice) {
      if (t.lastDigit >= 0 && t.lastDigit <= 9) recentCounts[t.lastDigit]++;
    }
    const recentLen = recentSlice.length || 1;
    const deltas = counts.map((_, d) => {
      const recentRate = (recentCounts[d] / recentLen) * 100;
      return recentRate - pcts[d];
    });

    // Rank digits by frequency descending (0 to 9)
    const sortedByFreq = [...Array(10).keys()].sort((a, b) => {
      if (pcts[b] !== pcts[a]) return pcts[b] - pcts[a];
      return counts[b] - counts[a];
    });

    const mostAppearing = sortedByFreq[0];
    const secondMostAppearing = sortedByFreq[1];
    const leastAppearing = sortedByFreq[9];
    const secondLeastAppearing = sortedByFreq[8];

    // Find the digit increasing the most (highest positive delta)
    const sortedByDelta = [...Array(10).keys()].sort((a, b) => deltas[b] - deltas[a]);
    // Choose most increasing digit, picking distinct from rank 1 & 2 if possible so all 5 colors display
    let mostIncreasing = sortedByDelta[0];
    if (mostIncreasing === mostAppearing || mostIncreasing === secondMostAppearing) {
      const altInc = sortedByDelta.find(
        (d) => d !== mostAppearing && d !== secondMostAppearing && d !== leastAppearing,
      );
      if (altInc !== undefined && deltas[altInc] > 0) {
        mostIncreasing = altInc;
      }
    }

    return pcts.map((pct, digit) => {
      let role: "most" | "second_most" | "most_increasing" | "second_least" | "least" | "neutral" =
        "neutral";
      let color: string | null = null;
      let label = "";
      let badgeBg = "";

      if (digit === mostAppearing) {
        role = "most";
        color = "#22c55e"; // Green
        label = "1st Most";
        badgeBg = "bg-emerald-500/20 text-emerald-400 border-emerald-500/40";
      } else if (digit === secondMostAppearing) {
        role = "second_most";
        color = "#84cc16"; // Almost green (Lime)
        label = "2nd Most";
        badgeBg = "bg-lime-500/20 text-lime-400 border-lime-500/40";
      } else if (digit === mostIncreasing) {
        role = "most_increasing";
        color = "#a855f7"; // Purple
        label = "Most Inc";
        badgeBg = "bg-purple-500/20 text-purple-400 border-purple-500/40";
      } else if (digit === secondLeastAppearing) {
        role = "second_least";
        color = "#f97316"; // Orange
        label = "2nd Least";
        badgeBg = "bg-orange-500/20 text-orange-400 border-orange-500/40";
      } else if (digit === leastAppearing) {
        role = "least";
        color = "#ef4444"; // Red
        label = "Least";
        badgeBg = "bg-rose-500/20 text-rose-400 border-rose-500/40";
      }

      return {
        digit,
        count: counts[digit],
        pct,
        delta: deltas[digit],
        role,
        color,
        label,
        badgeBg,
        isMax: digit === mostAppearing,
        isMin: digit === leastAppearing,
      };
    });
  }, [activeTicks]);

  // Parity & Psychological / DigitPulse metrics
  const { evenPct, oddPct, under7Pct, over2Pct, dangerIndex } = useMemo(() => {
    if (!activeTicks.length) {
      return { evenPct: 50, oddPct: 50, under7Pct: 70, over2Pct: 70, dangerIndex: 25 };
    }
    let evens = 0;
    let u7 = 0;
    let o2 = 0;
    for (const t of activeTicks) {
      const d = t.lastDigit;
      if (d % 2 === 0) evens++;
      if (d <= 6) u7++;
      if (d >= 3) o2++;
    }
    const tot = activeTicks.length;
    const ep = (evens / tot) * 100;
    const op = 100 - ep;
    const u7p = (u7 / tot) * 100;
    const o2p = (o2 / tot) * 100;

    // Danger Index based on parity imbalance & distribution skew
    const paritySkew = Math.abs(ep - 50);
    const danger = Math.min(100, Math.round(paritySkew * 2.8 + 15));

    return {
      evenPct: ep,
      oddPct: op,
      under7Pct: u7p,
      over2Pct: o2p,
      dangerIndex: danger,
    };
  }, [activeTicks]);

  const lastDigit = lastTick?.lastDigit ?? 0;

  // Chart coordinate calculation for fallback SVG
  const visibleTicks = useMemo(() => ticks.slice(-chartSpan), [ticks, chartSpan]);
  const chartBounds = useMemo(() => {
    if (!visibleTicks.length) return { min: 0, max: 1, delta: 0, isRise: true };
    let min = Infinity;
    let max = -Infinity;
    for (const t of visibleTicks) {
      if (t.quote < min) min = t.quote;
      if (t.quote > max) max = t.quote;
    }
    const first = visibleTicks[0].quote;
    const last = visibleTicks[visibleTicks.length - 1].quote;
    return {
      min,
      max: max === min ? max + 0.01 : max,
      delta: last - first,
      isRise: last >= first,
    };
  }, [visibleTicks]);

  const QUICK_VOLS = [
    { s: "1HZ10V", l: "10 (1s)" },
    { s: "1HZ25V", l: "25 (1s)" },
    { s: "1HZ50V", l: "50 (1s)" },
    { s: "1HZ75V", l: "75 (1s)" },
    { s: "1HZ100V", l: "100 (1s)" },
    { s: "1HZ150V", l: "150 (1s)" },
    { s: "1HZ250V", l: "250 (1s)" },
    { s: "R_10", l: "V10" },
    { s: "R_25", l: "V25" },
    { s: "R_50", l: "V50" },
    { s: "R_75", l: "V75" },
    { s: "R_100", l: "V100" },
    { s: "BOOM500", l: "B500" },
    { s: "CRASH500", l: "C500" },
  ];

  const filteredMarkets = useMemo(() => {
    const q = marketSearch.trim().toLowerCase();
    return markets.filter((m) => {
      const matchCat =
        marketCatTab === "all" ||
        (marketCatTab === "vol_1s" && m.category === "volatility_1s") ||
        (marketCatTab === "vol" && m.category === "volatility") ||
        (marketCatTab === "crash_boom" && m.category === "crash_boom") ||
        (marketCatTab === "jump" && m.category === "jump") ||
        (marketCatTab === "other" &&
          !["volatility", "volatility_1s", "crash_boom", "jump"].includes(m.category));
      const matchQuery =
        !q ||
        m.display_name.toLowerCase().includes(q) ||
        m.underlying_symbol.toLowerCase().includes(q) ||
        m.market_display_name.toLowerCase().includes(q);
      return matchCat && matchQuery;
    });
  }, [markets, marketSearch, marketCatTab]);

  const isDigitContract = ["DIGITMATCH", "DIGITDIFF", "DIGITOVER", "DIGITUNDER"].includes(
    config.contractType,
  );
  const isPriceContract = ["HIGHER", "LOWER", "ONETOUCH", "NOTOUCH"].includes(config.contractType);

  return (
    <div className="dtrader-view w-full space-y-3 pb-8 text-foreground animate-in fade-in duration-200">
      {/* Top Header Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 p-3 rounded-xl border border-border bg-surface/95 backdrop-blur-md shadow-sm">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Market Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setMarketMenuOpen(!marketMenuOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border hover:border-primary/50 bg-surface-2 text-xs font-mono font-medium transition-all"
            >
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="font-semibold text-foreground">
                {market ? market.display_name : activeSymbol}
              </span>
              <span className="text-[10px] text-muted-foreground uppercase">({activeSymbol})</span>
              <SlidersHorizontal className="w-3.5 h-3.5 text-muted-foreground ml-1" />
            </button>

            {marketMenuOpen && (
              <div className="absolute left-0 top-full mt-1.5 w-80 sm:w-96 rounded-lg border border-border bg-surface shadow-2xl z-50 p-2.5 space-y-2 animate-in fade-in zoom-in-95">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
                  <Input
                    value={marketSearch}
                    onChange={(e) => setMarketSearch(e.target.value)}
                    placeholder="Search volatilities, boom, jump..."
                    className="h-8 pl-8 text-xs bg-surface-2 border-border font-mono"
                    autoFocus
                  />
                </div>

                {/* Category tabs inside dropdown */}
                <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-1 text-[10px] font-mono">
                  {[
                    { id: "all", label: "All" },
                    { id: "vol_1s", label: "1s Vols" },
                    { id: "vol", label: "Volatilities" },
                    { id: "crash_boom", label: "Crash/Boom" },
                    { id: "jump", label: "Jump" },
                    { id: "other", label: "Other" },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setMarketCatTab(tab.id)}
                      className={`px-2 py-0.5 rounded whitespace-nowrap transition-colors ${
                        marketCatTab === tab.id
                          ? "bg-primary text-primary-foreground font-semibold"
                          : "bg-surface-2 hover:bg-surface-3 text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="max-h-64 overflow-y-auto space-y-0.5 pr-1 divide-y divide-border/20">
                  {filteredMarkets.length === 0 ? (
                    <div className="p-3 text-center text-xs text-muted-foreground">
                      No matching indices found.
                    </div>
                  ) : (
                    filteredMarkets.map((m) => (
                      <button
                        key={m.underlying_symbol}
                        type="button"
                        onClick={() => {
                          selectMarket(m.underlying_symbol);
                          setMarketMenuOpen(false);
                        }}
                        className={`w-full text-left px-2.5 py-1.5 rounded text-xs font-mono flex items-center justify-between transition-colors ${
                          m.underlying_symbol === activeSymbol
                            ? "bg-primary/20 text-primary font-semibold"
                            : "hover:bg-surface-2 text-foreground"
                        }`}
                      >
                        <span className="truncate">{m.display_name}</span>
                        <span className="text-[10px] text-muted-foreground ml-2">
                          {m.underlying_symbol}
                        </span>
                      </button>
                    ))
                  )}
                </div>

                <div className="pt-1.5 border-t border-border flex justify-between items-center text-[10px] font-mono text-muted-foreground">
                  <span>{filteredMarkets.length} Deriv indices</span>
                  <button
                    type="button"
                    onClick={() => {
                      setMarketMenuOpen(false);
                      setFinderOpen(true);
                    }}
                    className="text-primary hover:underline font-semibold"
                  >
                    Open Market Finder →
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Quick Volatilities horizontal pill selector */}
          <div className="hidden sm:flex items-center gap-1 overflow-x-auto max-w-[340px] xl:max-w-[460px] no-scrollbar py-0.5">
            {QUICK_VOLS.map((qv) => {
              const active = qv.s === activeSymbol;
              return (
                <button
                  key={qv.s}
                  type="button"
                  onClick={() => selectMarket(qv.s)}
                  className={`px-2 py-1 rounded text-[10px] font-mono font-medium whitespace-nowrap transition-colors border ${
                    active
                      ? "bg-primary/20 border-primary text-primary font-bold shadow-xs"
                      : "bg-surface-2 border-border/80 text-muted-foreground hover:text-foreground hover:border-border"
                  }`}
                >
                  {qv.l}
                </button>
              );
            })}
          </div>

          {/* Real-time Quote */}
          {lastTick && (
            <div className="flex items-center gap-2 font-mono">
              <span className="text-base font-bold text-foreground">
                {fmtQuote(lastTick.quote, market?.pip_decimals ?? 2)}
              </span>
              <span className="text-xs px-1.5 py-0.5 rounded bg-primary/20 text-primary font-bold">
                L: {lastTick.lastDigit}
              </span>
            </div>
          )}
        </div>

        {/* Live Status & Deriv Account */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-surface-2 border border-border text-[11px] font-mono">
            <span
              className={`w-2 h-2 rounded-full ${
                feedStatus === "LIVE" ? "bg-emerald-400 animate-pulse" : "bg-amber-400"
              }`}
            />
            <span className="font-semibold text-emerald-400">DERIV WS LIVE</span>
            {latency > 0 && (
              <span className="text-muted-foreground text-[10px]">({latency}ms)</span>
            )}
          </div>

          <button
            type="button"
            onClick={() => setAuthModalOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-surface-2 hover:bg-surface-3 border border-border text-[11px] font-mono transition-all text-foreground"
          >
            <Wallet className="w-3.5 h-3.5 text-primary" />
            <span className="font-semibold">
              $
              {account?.balance !== undefined
                ? account.balance.toLocaleString("en-US", { minimumFractionDigits: 2 })
                : "10,000.00"}
            </span>
            <span className="text-[9px] px-1 py-0.2 rounded bg-surface-3 text-muted-foreground uppercase border border-border">
              {account?.is_virtual ? "DEMO" : "LIVE"}
            </span>
          </button>
        </div>
      </div>

      {/* Main Grid: Visuals on Left, Trade Deck on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        {/* Left Column (Chart, 0-9 Circular Digit Rings, Psychology Matrix) */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-3">
          {/* Live SVG Tick Chart */}
          <div className="p-3.5 rounded-xl border border-border bg-surface/90 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary" />
                <span className="text-xs font-mono font-semibold uppercase text-foreground">
                  Real-time Tick Stream
                </span>
                <span className="text-[10px] text-muted-foreground font-mono">
                  {visibleTicks.length} ticks
                </span>
              </div>

              {/* Span Selector */}
              <div className="flex items-center gap-1 bg-surface-2 p-0.5 rounded border border-border">
                {([20, 50, 100, 250] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setChartSpan(s)}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors ${
                      chartSpan === s
                        ? "bg-primary text-primary-foreground font-semibold"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {s}t
                  </button>
                ))}
              </div>
            </div>

            {/* SVG Chart Polyline */}
            <div className="relative h-44 w-full bg-surface-2/60 rounded-lg border border-border/70 overflow-hidden flex items-center justify-center">
              {visibleTicks.length > 1 ? (
                <svg className="w-full h-full p-2 overflow-visible">
                  <defs>
                    <linearGradient id="dt-line-grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#00a79e" stopOpacity="0.35" />
                      <stop offset="100%" stopColor="#00a79e" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  {/* Grid Lines */}
                  <line x1="0" y1="25%" x2="100%" y2="25%" stroke="#333" strokeDasharray="3 3" />
                  <line x1="0" y1="50%" x2="100%" y2="50%" stroke="#333" strokeDasharray="3 3" />
                  <line x1="0" y1="75%" x2="100%" y2="75%" stroke="#333" strokeDasharray="3 3" />

                  {/* Polyline Path */}
                  {(() => {
                    const range = chartBounds.max - chartBounds.min || 0.001;
                    const pts = visibleTicks.map((t, idx) => {
                      const x = (idx / (visibleTicks.length - 1)) * 100;
                      const y = 90 - ((t.quote - chartBounds.min) / range) * 80;
                      return `${x}%,${y}%`;
                    });
                    const ptsStr = pts.join(" ");
                    return (
                      <>
                        <polygon points={`0%,100% ${ptsStr} 100%,100%`} fill="url(#dt-line-grad)" />
                        <polyline
                          points={ptsStr}
                          fill="none"
                          stroke={chartBounds.isRise ? "#00c853" : "#ff4b55"}
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </>
                    );
                  })()}
                </svg>
              ) : (
                <div className="text-xs font-mono text-muted-foreground flex items-center gap-2">
                  <Activity className="w-4 h-4 text-primary animate-pulse" />
                  Streaming live Deriv ticks...
                </div>
              )}

              {/* Price Delta Badge */}
              <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-surface/80 border border-border/80 text-[10px] font-mono flex items-center gap-1">
                {chartBounds.isRise ? (
                  <ArrowUpRight className="w-3 h-3 text-emerald-400" />
                ) : (
                  <ArrowDownRight className="w-3 h-3 text-rose-400" />
                )}
                <span
                  className={
                    chartBounds.isRise
                      ? "text-emerald-400 font-semibold"
                      : "text-rose-400 font-semibold"
                  }
                >
                  {chartBounds.delta >= 0 ? "+" : ""}
                  {chartBounds.delta.toFixed(market?.pip_decimals ?? 2)}
                </span>
              </div>
            </div>
          </div>

          {/* 0–9 LIVE DIGIT INTELLIGENCE · DERIV 1000 TICKS */}
          <div className="p-3.5 rounded-xl border border-border bg-surface/90 shadow-sm space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-2.5">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-primary" />
                <span className="text-xs font-mono font-semibold uppercase text-foreground">
                  0–9 Live Digit Intelligence
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-2 border border-border text-muted-foreground font-mono">
                  Deriv {ticks.length} Ticks
                </span>
              </div>

              {/* Window Selector */}
              <div className="flex items-center gap-1 bg-surface-2 p-0.5 rounded border border-border">
                {WINDOW_SIZES.map((w) => (
                  <button
                    key={w}
                    type="button"
                    onClick={() => setWindow(w)}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors ${
                      window === w
                        ? "bg-primary text-primary-foreground font-semibold"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {w}
                  </button>
                ))}
              </div>
            </div>

            {/* Color Classification Legend */}
            <div className="flex flex-wrap items-center justify-between gap-1.5 px-2.5 py-1.5 rounded-lg bg-surface-2/70 border border-border text-[10px] font-mono">
              <div className="flex items-center gap-1 text-muted-foreground font-semibold uppercase text-[9px]">
                <span>Color Key:</span>
              </div>
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="flex items-center gap-1 text-emerald-400 font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-xs" />
                  Most Appearing (Green)
                </span>
                <span className="flex items-center gap-1 text-lime-400 font-medium">
                  <span className="w-2 h-2 rounded-full bg-lime-500 shadow-xs" />
                  2nd Most (Almost Green)
                </span>
                <span className="flex items-center gap-1 text-purple-400 font-medium">
                  <span className="w-2 h-2 rounded-full bg-purple-500 shadow-xs" />
                  Most Increasing (Purple)
                </span>
                <span className="flex items-center gap-1 text-orange-400 font-medium">
                  <span className="w-2 h-2 rounded-full bg-orange-500 shadow-xs" />
                  2nd Least (Orange)
                </span>
                <span className="flex items-center gap-1 text-rose-400 font-medium">
                  <span className="w-2 h-2 rounded-full bg-rose-500 shadow-xs" />
                  Least (Red)
                </span>
              </div>
            </div>

            {/* 0–9 Circular Digit Rings with Dynamic Marker Arrow & Pulse */}
            <div className="relative pt-1 pb-4">
              <div className="grid grid-cols-10 gap-1 sm:gap-1.5">
                {digitStats.map((st) => {
                  const isLast = st.digit === lastDigit;
                  const isPulsing = pulseDigit === st.digit;

                  return (
                    <div
                      key={st.digit}
                      className={`flex flex-col items-center gap-1 cursor-pointer transition-transform ${
                        isPulsing ? "scale-110" : ""
                      }`}
                      onClick={() => {
                        if (isDigitContract) updateConfig({ barrier: st.digit });
                      }}
                      title={`Digit ${st.digit}: ${st.count} hits (${st.pct.toFixed(1)}%)${
                        st.delta !== 0
                          ? ` • Delta: ${st.delta > 0 ? "+" : ""}${st.delta.toFixed(1)}%`
                          : ""
                      }${st.label ? ` • ${st.label}` : ""}`}
                    >
                      {/* Fully circled with respective colour for labeled digits; totally plain for the rest */}
                      <div
                        className={`relative w-8 h-8 sm:w-11 sm:h-11 rounded-full flex items-center justify-center font-mono font-bold text-xs sm:text-sm transition-all shadow-sm ${
                          st.role !== "neutral" && st.color
                            ? "border-2 sm:border-[2.5px]"
                            : "border border-border/80 bg-surface-2 text-muted-foreground"
                        } ${
                          isLast
                            ? "ring-2 ring-primary ring-offset-1 ring-offset-surface scale-105"
                            : ""
                        }`}
                        style={
                          st.role !== "neutral" && st.color
                            ? {
                                borderColor: st.color,
                                backgroundColor: `${st.color}15`,
                                color: st.color,
                                boxShadow: `0 0 10px ${st.color}35`,
                              }
                            : undefined
                        }
                      >
                        {st.digit}
                      </div>

                      {/* Percentage Label in Role Color or Plain Muted */}
                      {st.role !== "neutral" && st.color ? (
                        <span
                          className="text-[10px] font-mono font-bold truncate leading-tight"
                          style={{ color: st.color }}
                        >
                          {st.pct.toFixed(0)}%
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono font-medium text-muted-foreground/70 truncate leading-tight">
                          {st.pct.toFixed(0)}%
                        </span>
                      )}

                      {/* Classification Badge Pill or Plain Count */}
                      {st.label ? (
                        <span
                          className={`px-1 py-0.2 rounded text-[7px] sm:text-[8px] font-mono font-bold uppercase border leading-tight whitespace-nowrap ${st.badgeBg}`}
                        >
                          {st.label}
                        </span>
                      ) : (
                        <span className="text-[8px] sm:text-[9px] font-mono text-muted-foreground/50 leading-tight">
                          {st.count}x
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Dynamic Sliding Marker Arrow pointing to last digit */}
              <div
                className="absolute bottom-0 h-0 w-0 border-x-4 border-x-transparent border-b-[6px] border-b-primary transition-all duration-200 ease-out"
                style={{
                  left: `calc((${lastDigit} * 10%) + 5%)`,
                  transform: "translateX(-50%)",
                }}
              />
            </div>

            {/* Parity & Psychological DigitPulse Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2 border-t border-border/60 font-mono text-xs">
              <div className="p-2 rounded bg-surface-2 border border-border/70">
                <div className="text-[10px] text-muted-foreground uppercase">Even %</div>
                <div className="text-sm font-bold text-emerald-400">{evenPct.toFixed(1)}%</div>
              </div>
              <div className="p-2 rounded bg-surface-2 border border-border/70">
                <div className="text-[10px] text-muted-foreground uppercase">Odd %</div>
                <div className="text-sm font-bold text-sky-400">{oddPct.toFixed(1)}%</div>
              </div>
              <div className="p-2 rounded bg-surface-2 border border-border/70">
                <div className="text-[10px] text-muted-foreground uppercase">Under 7 (0-6)</div>
                <div className="text-sm font-bold text-primary">{under7Pct.toFixed(1)}%</div>
              </div>
              <div className="p-2 rounded bg-surface-2 border border-border/70">
                <div className="text-[10px] text-muted-foreground uppercase">Over 2 (3-9)</div>
                <div className="text-sm font-bold text-amber-400">{over2Pct.toFixed(1)}%</div>
              </div>
              <div className="p-2 rounded bg-surface-2 border border-border/70">
                <div className="text-[10px] text-muted-foreground uppercase">Danger Index</div>
                <div
                  className={`text-sm font-bold ${
                    dangerIndex > 60
                      ? "text-rose-400"
                      : dangerIndex > 35
                        ? "text-amber-400"
                        : "text-emerald-400"
                  }`}
                >
                  {dangerIndex}/100
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Adaptive Trade Deck & Open Contract */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-3">
          {/* Active Open Contract Card (if trading) */}
          {openContracts.length > 0 && (
            <div className="p-3.5 rounded-xl border border-primary/40 bg-surface-2 shadow-glow-primary space-y-2.5 animate-in slide-in-from-top-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
                  <span className="text-xs font-mono font-bold text-foreground">
                    ACTIVE CONTRACT: {openContracts[0].label}
                  </span>
                </div>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-primary/20 text-primary font-semibold">
                  {openContracts[0].ticksElapsed}/{openContracts[0].ticksTotal}t
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 font-mono text-xs">
                <div>
                  <div className="text-[10px] text-muted-foreground">Entry Spot</div>
                  <div className="font-semibold">
                    {openContracts[0].entrySpot.toFixed(market?.pip_decimals ?? 2)}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-muted-foreground">Current Spot</div>
                  <div className="font-semibold text-primary">
                    {openContracts[0].currentSpot.toFixed(market?.pip_decimals ?? 2)}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-muted-foreground">Live P/L</div>
                  <div
                    className={`font-bold ${
                      openContracts[0].profit >= 0 ? "text-emerald-400" : "text-rose-400"
                    }`}
                  >
                    {openContracts[0].profit >= 0 ? "+" : ""}${openContracts[0].profit.toFixed(2)}
                  </div>
                </div>
              </div>

              {openContracts[0].isSellable && (
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => sell(openContracts[0].contractId)}
                  className="w-full h-7 text-xs font-mono font-semibold"
                >
                  Sell Contract Now
                </Button>
              )}
            </div>
          )}

          {/* Adaptive Trade Deck */}
          <div className="p-4 rounded-xl border border-border bg-surface/95 shadow-sm space-y-3.5">
            <div className="flex items-center justify-between border-b border-border/60 pb-2">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-primary" />
                <span className="text-xs font-mono font-semibold uppercase text-foreground">
                  Adaptive Trade Deck
                </span>
              </div>
              <span className="text-[10px] font-mono text-muted-foreground uppercase">
                {market ? market.underlying_symbol : ""}
              </span>
            </div>

            {/* Contract Type Selection */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono text-muted-foreground uppercase">
                Contract Type
              </label>
              <div className="grid grid-cols-4 gap-1">
                {CONTRACT_TYPES.map((ct) => {
                  const isSelected = config.contractType === ct.id;
                  return (
                    <button
                      key={ct.id}
                      type="button"
                      onClick={() => selectContractType(ct.id)}
                      className={`h-8 rounded text-[11px] font-mono font-semibold transition-all ${
                        isSelected
                          ? "bg-primary text-primary-foreground shadow-sm scale-[1.02]"
                          : "bg-surface-2 hover:bg-surface-3 text-muted-foreground hover:text-foreground border border-border/70"
                      }`}
                    >
                      {ct.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Barrier Selector (for Digits or Price Contracts) */}
            {isDigitContract && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-mono text-muted-foreground uppercase">
                    Prediction Barrier Digit
                  </label>
                  <span className="text-xs font-mono font-bold text-primary">
                    Digit {config.barrier ?? 5}
                  </span>
                </div>
                <div className="grid grid-cols-10 gap-1">
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => updateConfig({ barrier: d })}
                      className={`h-7 rounded text-xs font-mono font-bold transition-all ${
                        config.barrier === d
                          ? "bg-primary text-primary-foreground shadow-glow-primary"
                          : "bg-surface-2 hover:bg-surface-3 text-muted-foreground border border-border/60"
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {isPriceContract && (
              <div className="space-y-1.5">
                <label className="text-[11px] font-mono text-muted-foreground uppercase">
                  Price Offset Barrier
                </label>
                <Input
                  type="number"
                  step="0.1"
                  value={config.barrier ?? 1}
                  onChange={(e) => updateConfig({ barrier: Number(e.target.value) })}
                  className="h-8 font-mono text-xs bg-surface-2 border-border"
                />
              </div>
            )}

            {/* Duration Selector */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono text-muted-foreground uppercase">
                Duration (Ticks)
              </label>
              <div className="grid grid-cols-5 gap-1.5">
                {DURATIONS.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => updateConfig({ duration: d, durationUnit: "t" })}
                    className={`h-8 rounded text-xs font-mono font-semibold transition-all ${
                      config.duration === d && config.durationUnit === "t"
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "bg-surface-2 hover:bg-surface-3 text-muted-foreground border border-border/60"
                    }`}
                  >
                    {d}t
                  </button>
                ))}
              </div>
            </div>

            {/* Stake Input with Quick Presets */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-mono text-muted-foreground uppercase">
                  Stake Amount ($)
                </label>
                <div className="flex items-center gap-1">
                  {[5, 10, 25, 50, 100].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => updateConfig({ stake: amt })}
                      className="px-1.5 py-0.5 text-[10px] font-mono bg-surface-2 hover:bg-surface-3 rounded border border-border/70 text-muted-foreground"
                    >
                      +{amt}
                    </button>
                  ))}
                </div>
              </div>
              <Input
                type="number"
                min="0.35"
                step="1"
                value={config.stake}
                onChange={(e) => updateConfig({ stake: Math.max(0.35, Number(e.target.value)) })}
                className="h-9 font-mono text-sm font-semibold bg-surface-2 border-border"
              />
            </div>

            {/* Live Deriv Proposal Pricing Card */}
            <div className="p-3 rounded-lg border border-border/80 bg-surface-2 space-y-1.5 font-mono text-xs">
              <div className="flex items-center justify-between text-muted-foreground text-[11px]">
                <span>Contract / Barrier:</span>
                <span className="text-foreground font-semibold">
                  {config.contractType} {config.barrier !== undefined ? `[${config.barrier}]` : ""}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-[11px]">Ask Price (Stake):</span>
                <span className="font-semibold text-foreground">
                  ${proposal ? proposal.askPrice.toFixed(2) : config.stake.toFixed(2)} USD
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-[11px]">Expected Payout:</span>
                <span className="font-bold text-emerald-400">
                  ${proposal ? proposal.payout.toFixed(2) : "0.00"} USD
                </span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-border/50">
                <span className="text-muted-foreground text-[11px]">Potential Net Profit:</span>
                <span className="font-bold text-primary">
                  +${proposal ? proposal.potentialProfit.toFixed(2) : "0.00"} (
                  {proposal && proposal.askPrice > 0
                    ? ((proposal.potentialProfit / proposal.askPrice) * 100).toFixed(1)
                    : "0"}
                  %)
                </span>
              </div>
            </div>

            {/* Execute Buy Button */}
            <Button
              onClick={buy}
              disabled={buying || proposalLoading || !proposal || proposal.status !== "READY"}
              className="w-full h-11 text-sm font-bold tracking-wide uppercase bg-primary hover:bg-primary/90 text-primary-foreground shadow-glow-primary transition-all active:scale-[0.98]"
            >
              {buying
                ? "Executing Trade..."
                : proposalLoading
                  ? "Pricing Proposal..."
                  : `Buy ${config.contractType} · $${config.stake.toFixed(2)}`}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
