import { useMemo } from "react";
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  ChevronRight,
  Flame,
  Info,
  Layers,
  Minus,
  Snowflake,
  Sparkles,
} from "lucide-react";
import { useCockpit } from "../state/CockpitProvider";
import { DIGIT_WINDOWS, type DigitStat, type DigitWindow } from "../types";
import { agoLabel, fmtPct, fmtSigned } from "../lib/util";
import { DigitInspectorModal } from "./DigitInspectorModal";

export function DigitIntelligencePanel() {
  const { snapshot, window, setWindow, selectedDigit, setSelectedDigit } = useCockpit();

  const winStats = snapshot?.windowStats[window];
  const digits: DigitStat[] = snapshot?.digitStats ?? [];

  return (
    <div className="bg-surface border border-border rounded-lg p-3 space-y-3 select-none">
      {/* Header & Window Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-sm bg-primary shadow-glow-primary" />
          <h2 className="font-semibold text-xs tracking-wider uppercase text-foreground">
            0–9 Live Digit Intelligence
          </h2>
          <span className="text-[10px] font-mono text-muted-foreground px-1.5 py-0.2 rounded bg-surface-2 border border-border">
            Authoritative Stream
          </span>
        </div>

        {/* Window Selector Tabs */}
        <div className="flex items-center gap-1 bg-surface-2 p-0.5 rounded border border-border">
          <span className="text-[10px] font-mono text-muted-foreground px-2 uppercase font-semibold">
            Window:
          </span>
          {DIGIT_WINDOWS.map((w) => (
            <button
              key={w}
              type="button"
              onClick={() => setWindow(w)}
              className={`px-2 py-0.5 text-xs font-mono font-medium rounded transition-all ${
                window === w
                  ? "bg-primary text-primary-foreground shadow-sm font-semibold"
                  : "text-muted-foreground hover:text-foreground hover:bg-surface-3"
              }`}
            >
              {w}t
            </button>
          ))}
        </div>
      </div>

      {/* Overview Analytics Strip */}
      {winStats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2 text-xs font-mono">
          {/* Even vs Odd */}
          <div className="p-2 rounded bg-surface-2/70 border border-border/80 flex flex-col justify-between">
            <div className="text-[10px] uppercase text-muted-foreground font-semibold flex items-center justify-between">
              <span>Parity Balance</span>
              <span className="text-foreground">
                {winStats.evenPct > winStats.oddPct
                  ? "Even Bias"
                  : winStats.oddPct > winStats.evenPct
                    ? "Odd Bias"
                    : "Balanced"}
              </span>
            </div>
            <div className="flex items-center justify-between mt-1 text-xs font-bold text-foreground">
              <span className="text-primary">{fmtPct(winStats.evenPct)} Even</span>
              <span className="text-muted-foreground">•</span>
              <span className="text-foreground/90">{fmtPct(winStats.oddPct)} Odd</span>
            </div>
            <div className="w-full bg-surface-3 h-1.5 rounded-full overflow-hidden flex mt-1.5">
              <div
                className="bg-primary h-full transition-all duration-300"
                style={{ width: `${winStats.evenPct * 100}%` }}
              />
              <div
                className="bg-muted-foreground/50 h-full transition-all duration-300"
                style={{ width: `${winStats.oddPct * 100}%` }}
              />
            </div>
          </div>

          {/* Hot Digits */}
          <div className="p-2 rounded bg-surface-2/70 border border-border/80 flex flex-col justify-between">
            <div className="text-[10px] uppercase text-muted-foreground font-semibold flex items-center gap-1">
              <Flame className="w-3 h-3 text-rose-400" />
              <span>Hot Digits</span>
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              {winStats.hot.length === 0 ? (
                <span className="text-muted-foreground text-[11px]">None</span>
              ) : (
                winStats.hot.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setSelectedDigit(d)}
                    className="w-5 h-5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/40 text-[11px] font-bold flex items-center justify-center hover:scale-110 transition-transform"
                  >
                    {d}
                  </button>
                ))
              )}
            </div>
            <div className="text-[9px] text-muted-foreground truncate">Frequency &gt; 12.5%</div>
          </div>

          {/* Cold Digits */}
          <div className="p-2 rounded bg-surface-2/70 border border-border/80 flex flex-col justify-between">
            <div className="text-[10px] uppercase text-muted-foreground font-semibold flex items-center gap-1">
              <Snowflake className="w-3 h-3 text-cyan-400" />
              <span>Cold Digits</span>
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              {winStats.cold.length === 0 ? (
                <span className="text-muted-foreground text-[11px]">None</span>
              ) : (
                winStats.cold.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setSelectedDigit(d)}
                    className="w-5 h-5 rounded bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 text-[11px] font-bold flex items-center justify-center hover:scale-110 transition-transform"
                  >
                    {d}
                  </button>
                ))
              )}
            </div>
            <div className="text-[9px] text-muted-foreground truncate">Frequency &lt; 7.5%</div>
          </div>

          {/* Recent & Streak */}
          <div className="p-2 rounded bg-surface-2/70 border border-border/80 flex flex-col justify-between">
            <div className="text-[10px] uppercase text-muted-foreground font-semibold">
              Last Digit & Streak
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="w-6 h-6 rounded bg-primary/20 text-primary border border-primary/40 font-bold text-sm flex items-center justify-center">
                {winStats.lastDigit !== null ? winStats.lastDigit : "--"}
              </span>
              <div className="text-[11px] leading-tight">
                <div className="font-semibold text-foreground">
                  Streak:{" "}
                  {winStats.streak ? `${winStats.streak.length}x (${winStats.streak.digit})` : "1x"}
                </div>
                <div className="text-[9px] text-muted-foreground">Recent occurrence</div>
              </div>
            </div>
            <div className="text-[9px] text-muted-foreground">Live quote spot digit</div>
          </div>

          {/* Concentration vs Dispersion */}
          <div className="p-2 rounded bg-surface-2/70 border border-border/80 flex flex-col justify-between col-span-2 sm:col-span-4 lg:col-span-2">
            <div className="text-[10px] uppercase text-muted-foreground font-semibold flex items-center justify-between">
              <span>Entropy & Distribution Profile</span>
              <span className="text-foreground font-bold">
                {winStats.concentration > 0.35 ? "Concentrated" : "Dispersed"}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-1">
              <div className="text-[11px]">
                <span className="text-muted-foreground">Concentration: </span>
                <span className="font-bold text-foreground">
                  {(winStats.concentration * 100).toFixed(1)}%
                </span>
              </div>
              <div className="text-[11px]">
                <span className="text-muted-foreground">Dispersion: </span>
                <span className="font-bold text-foreground">
                  {(winStats.dispersion * 100).toFixed(1)}%
                </span>
              </div>
            </div>
            <div className="text-[9px] text-muted-foreground truncate mt-1">
              Click any digit below to inspect historical windows and suitability
            </div>
          </div>
        </div>
      )}

      {/* The 10 Digits Grid (0–9) */}
      <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-2">
        {digits.map((d) => {
          const isSelected = selectedDigit === d.digit;
          const isHot = d.status === "HOT";
          const isCold = d.status === "COLD";
          const isRecent = d.lastSeen === 0;

          const pctVal = d.pct * 100;
          // expected is 10%
          const barHeightPct = Math.min(100, Math.max(8, (pctVal / 25) * 100));

          return (
            <div
              key={d.digit}
              onClick={() => setSelectedDigit(d.digit)}
              className={`relative p-2 rounded-lg border transition-all cursor-pointer flex flex-col justify-between select-none ${
                isSelected
                  ? "bg-surface-3 border-primary shadow-glow-primary scale-[1.02] z-10"
                  : isHot
                    ? "bg-surface-2/90 border-rose-500/30 hover:border-rose-500/60"
                    : isCold
                      ? "bg-surface-2/90 border-cyan-500/30 hover:border-cyan-500/60"
                      : "bg-surface-2/60 border-border/80 hover:bg-surface-2 hover:border-border"
              }`}
            >
              {/* Digit and Tag header */}
              <div className="flex items-start justify-between">
                <span className="font-mono font-black text-xl text-foreground leading-none">
                  {d.digit}
                </span>

                <div className="flex items-center gap-0.5">
                  {d.pressure === "up" ? (
                    <ArrowUp className="w-3 h-3 text-emerald-400" />
                  ) : d.pressure === "down" ? (
                    <ArrowDown className="w-3 h-3 text-rose-400" />
                  ) : (
                    <Minus className="w-3 h-3 text-muted-foreground" />
                  )}

                  {isHot && (
                    <span className="px-1 py-0.2 rounded bg-rose-500/20 text-rose-400 text-[9px] font-mono font-bold">
                      HOT
                    </span>
                  )}
                  {isCold && (
                    <span className="px-1 py-0.2 rounded bg-cyan-500/20 text-cyan-400 text-[9px] font-mono font-bold">
                      COLD
                    </span>
                  )}
                  {isRecent && (
                    <span className="px-1 py-0.2 rounded bg-primary/20 text-primary text-[9px] font-mono font-bold">
                      NOW
                    </span>
                  )}
                </div>
              </div>

              {/* Frequency % & Count */}
              <div className="mt-2 font-mono">
                <div className="text-sm font-bold text-foreground tracking-tight">
                  {fmtPct(d.pct)}
                </div>
                <div className="text-[10px] text-muted-foreground flex items-center justify-between">
                  <span>{d.count} hits</span>
                  <span>{agoLabel(d.lastSeen)}</span>
                </div>
              </div>

              {/* Vertical Frequency Bar with 10% benchmark */}
              <div className="mt-2 pt-1 border-t border-border/60">
                <div className="relative w-full h-8 bg-surface-3/80 rounded flex items-end p-0.5 overflow-hidden">
                  {/* 10% expected reference line (10/25 = 40% height) */}
                  <div
                    className="absolute inset-x-0 bottom-[40%] border-b border-dashed border-muted-foreground/50 z-10 pointer-events-none"
                    title="10% uniform expected baseline"
                  />

                  {/* Actual frequency bar */}
                  <div
                    className={`w-full rounded-sm transition-all duration-300 ${
                      isHot
                        ? "bg-rose-500"
                        : isCold
                          ? "bg-cyan-500"
                          : pctVal >= 10
                            ? "bg-primary"
                            : "bg-muted-foreground/60"
                    }`}
                    style={{ height: `${barHeightPct}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[9px] font-mono text-muted-foreground mt-1">
                  <span>Run: {d.run > 0 ? `${d.run}x` : "-"}</span>
                  <span className={d.momentum >= 0 ? "text-emerald-400" : "text-rose-400"}>
                    {fmtSigned(d.momentum * 100, 1)}%
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <DigitInspectorModal />
    </div>
  );
}
