import { useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  BarChart2,
  Clock,
  Maximize2,
  Minimize2,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useCockpit } from "../state/CockpitProvider";
import { fmtMoney, fmtQuote } from "../lib/util";
import { Button } from "@/components/ui/button";

type ChartSpan = 20 | 50 | 100 | 250;
type ChartStyle = "area" | "line" | "stepped";

export function MarketChart() {
  const { market, ticks, lastTick, feedStatus } = useCockpit();
  const [span, setSpan] = useState<ChartSpan>(50);
  const [chartStyle, setChartStyle] = useState<ChartStyle>("area");
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState<{ width: number; height: number }>({ width: 600, height: 260 });

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          setDims({ width, height });
        }
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const visibleTicks = useMemo(() => {
    return ticks.slice(-span);
  }, [ticks, span]);

  const { minPrice, maxPrice, priceRange, isRising, priceDelta, deltaPct } = useMemo(() => {
    if (!visibleTicks.length) {
      return {
        minPrice: 0,
        maxPrice: 1,
        priceRange: 1,
        isRising: true,
        priceDelta: 0,
        deltaPct: 0,
      };
    }
    let min = Infinity;
    let max = -Infinity;
    for (const t of visibleTicks) {
      if (t.quote < min) min = t.quote;
      if (t.quote > max) max = t.quote;
    }
    const range = max - min || 0.001;
    const first = visibleTicks[0].quote;
    const last = visibleTicks[visibleTicks.length - 1].quote;
    const delta = last - first;
    const pct = first > 0 ? (delta / first) * 100 : 0;
    return {
      minPrice: min,
      maxPrice: max,
      priceRange: range,
      isRising: delta >= 0,
      priceDelta: delta,
      deltaPct: pct,
    };
  }, [visibleTicks]);

  // Compute SVG coordinates
  const padding = { top: 20, right: 65, bottom: 26, left: 16 };
  const plotWidth = Math.max(10, dims.width - padding.left - padding.right);
  const plotHeight = Math.max(10, dims.height - padding.top - padding.bottom);

  const points = useMemo(() => {
    if (!visibleTicks.length) return [];
    return visibleTicks.map((t, i) => {
      const x = padding.left + (i / Math.max(1, visibleTicks.length - 1)) * plotWidth;
      const y = padding.top + plotHeight - ((t.quote - minPrice) / priceRange) * plotHeight;
      return { x, y, tick: t };
    });
  }, [visibleTicks, minPrice, priceRange, plotWidth, plotHeight, padding.left, padding.top]);

  const pathD = useMemo(() => {
    if (points.length === 0) return "";
    if (chartStyle === "stepped") {
      let d = `M ${points[0].x} ${points[0].y}`;
      for (let i = 1; i < points.length; i++) {
        d += ` H ${points[i].x} V ${points[i].y}`;
      }
      return d;
    }
    return points.reduce(
      (acc, p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`),
      "",
    );
  }, [points, chartStyle]);

  const areaD = useMemo(() => {
    if (points.length === 0) return "";
    const bottomY = padding.top + plotHeight;
    return `${pathD} L ${points[points.length - 1].x} ${bottomY} L ${points[0].x} ${bottomY} Z`;
  }, [pathD, points, padding.top, plotHeight]);

  const activeTick = hoveredIdx !== null && points[hoveredIdx] ? points[hoveredIdx].tick : lastTick;
  const quoteStr = activeTick && market ? fmtQuote(activeTick.quote, market.pip_decimals) : "--";
  const lastDigit = activeTick ? activeTick.lastDigit : null;

  return (
    <div className="flex flex-col h-full bg-surface rounded-lg border border-border overflow-hidden select-none">
      {/* Chart Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 border-b border-border bg-surface-2/40">
        <div className="flex items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-xs text-foreground tracking-wide">
                {market ? market.display_name : "Market"}
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface-3 text-muted-foreground border border-border">
                {market ? market.underlying_symbol : "--"}
              </span>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground mt-0.5">
              <span>{market ? `${market.tick_interval_seconds}s Tick Stream` : ""}</span>
              <span>•</span>
              <span className="text-foreground/90 font-medium">
                Sample: {visibleTicks.length} ticks
              </span>
            </div>
          </div>

          {/* Current Live Price readout */}
          <div className="flex items-baseline gap-2 pl-3 border-l border-border/70">
            <div className="font-mono text-base sm:text-lg font-bold text-foreground tracking-tight flex items-baseline">
              <span>{quoteStr.slice(0, -1)}</span>
              <span className="text-primary font-black underline decoration-primary/40 underline-offset-2">
                {lastDigit !== null ? lastDigit : quoteStr.slice(-1)}
              </span>
            </div>
            <div
              className={`flex items-center text-[11px] font-mono font-medium ${
                isRising ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              {isRising ? (
                <ArrowUpRight className="w-3.5 h-3.5" />
              ) : (
                <ArrowDownRight className="w-3.5 h-3.5" />
              )}
              <span>
                {priceDelta >= 0 ? "+" : ""}
                {market ? priceDelta.toFixed(market.pip_decimals) : priceDelta.toFixed(2)} (
                {deltaPct >= 0 ? "+" : ""}
                {deltaPct.toFixed(2)}%)
              </span>
            </div>
          </div>
        </div>

        {/* Controls: Span & Style */}
        <div className="flex items-center gap-1.5">
          {/* Span toggles */}
          <div className="flex items-center bg-surface-3 rounded p-0.5 border border-border">
            {([20, 50, 100, 250] as ChartSpan[]).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSpan(s)}
                className={`px-2 py-0.5 text-[10px] font-mono rounded font-medium transition-colors ${
                  span === s
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {s}t
              </button>
            ))}
          </div>

          {/* Style toggles */}
          <div className="flex items-center bg-surface-3 rounded p-0.5 border border-border">
            {(["area", "line", "stepped"] as ChartStyle[]).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setChartStyle(st)}
                className={`px-1.5 py-0.5 text-[10px] uppercase font-mono rounded font-medium transition-colors ${
                  chartStyle === st
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* SVG Canvas Area */}
      <div
        ref={containerRef}
        className="relative flex-1 min-h-[190px] w-full bg-background/50 grid-bg overflow-hidden cursor-crosshair"
        onMouseLeave={() => setHoveredIdx(null)}
        onMouseMove={(e) => {
          if (!containerRef.current || points.length === 0) return;
          const rect = containerRef.current.getBoundingClientRect();
          const mouseX = e.clientX - rect.left;
          let closestDist = Infinity;
          let closestIdx = 0;
          points.forEach((p, idx) => {
            const dist = Math.abs(p.x - mouseX);
            if (dist < closestDist) {
              closestDist = dist;
              closestIdx = idx;
            }
          });
          setHoveredIdx(closestIdx);
        }}
      >
        <svg
          width={dims.width}
          height={dims.height}
          className="absolute inset-0 pointer-events-none"
        >
          <defs>
            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.28" />
              <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="chartStroke" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.75" />
              <stop offset="100%" stopColor="var(--primary)" stopOpacity="1" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line
            x1={padding.left}
            y1={padding.top}
            x2={dims.width - padding.right}
            y2={padding.top}
            stroke="var(--border)"
            strokeDasharray="3 3"
            strokeOpacity="0.4"
          />
          <line
            x1={padding.left}
            y1={padding.top + plotHeight / 2}
            x2={dims.width - padding.right}
            y2={padding.top + plotHeight / 2}
            stroke="var(--border)"
            strokeDasharray="3 3"
            strokeOpacity="0.4"
          />
          <line
            x1={padding.left}
            y1={padding.top + plotHeight}
            x2={dims.width - padding.right}
            y2={padding.top + plotHeight}
            stroke="var(--border)"
            strokeDasharray="3 3"
            strokeOpacity="0.4"
          />

          {/* Price Labels on Right Axis */}
          <text
            x={dims.width - padding.right + 6}
            y={padding.top + 4}
            fill="var(--muted-foreground)"
            fontSize="9"
            fontFamily="var(--font-mono)"
          >
            {market ? fmtQuote(maxPrice, market.pip_decimals) : maxPrice.toFixed(2)}
          </text>
          <text
            x={dims.width - padding.right + 6}
            y={padding.top + plotHeight / 2 + 3}
            fill="var(--muted-foreground)"
            fontSize="9"
            fontFamily="var(--font-mono)"
          >
            {market
              ? fmtQuote((maxPrice + minPrice) / 2, market.pip_decimals)
              : ((maxPrice + minPrice) / 2).toFixed(2)}
          </text>
          <text
            x={dims.width - padding.right + 6}
            y={padding.top + plotHeight + 3}
            fill="var(--muted-foreground)"
            fontSize="9"
            fontFamily="var(--font-mono)"
          >
            {market ? fmtQuote(minPrice, market.pip_decimals) : minPrice.toFixed(2)}
          </text>

          {/* Area fill */}
          {chartStyle === "area" && areaD && <path d={areaD} fill="url(#chartGradient)" />}

          {/* Line stroke */}
          {pathD && (
            <path
              d={pathD}
              fill="none"
              stroke="url(#chartStroke)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Individual Tick points */}
          {points.map((p, i) => {
            const isLatest = i === points.length - 1;
            const isHovered = i === hoveredIdx;
            if (!isLatest && !isHovered && points.length > 60 && i % 2 !== 0) return null;

            return (
              <circle
                key={p.tick.epoch + "-" + i}
                cx={p.x}
                cy={p.y}
                r={isLatest ? 4.5 : isHovered ? 4 : 2}
                className={
                  isLatest
                    ? "fill-primary stroke-background stroke-2 animate-pulse"
                    : isHovered
                      ? "fill-foreground stroke-primary stroke-2"
                      : "fill-primary/70"
                }
              />
            );
          })}

          {/* Crosshair on Hover */}
          {hoveredIdx !== null && points[hoveredIdx] && (
            <g>
              <line
                x1={points[hoveredIdx].x}
                y1={padding.top}
                x2={points[hoveredIdx].x}
                y2={padding.top + plotHeight}
                stroke="var(--primary)"
                strokeDasharray="2 2"
                strokeWidth="1"
              />
              <line
                x1={padding.left}
                y1={points[hoveredIdx].y}
                x2={dims.width - padding.right}
                y2={points[hoveredIdx].y}
                stroke="var(--primary)"
                strokeDasharray="2 2"
                strokeWidth="1"
              />
              {/* Floating spot tag */}
              <rect
                x={dims.width - padding.right + 2}
                y={points[hoveredIdx].y - 8}
                width={56}
                height={16}
                rx={2}
                fill="var(--primary)"
              />
              <text
                x={dims.width - padding.right + 6}
                y={points[hoveredIdx].y + 3}
                fill="var(--primary-foreground)"
                fontSize="9"
                fontWeight="bold"
                fontFamily="var(--font-mono)"
              >
                {market
                  ? fmtQuote(points[hoveredIdx].tick.quote, market.pip_decimals)
                  : points[hoveredIdx].tick.quote.toFixed(2)}
              </text>
            </g>
          )}
        </svg>

        {/* Floating Tick Digit Tag */}
        {activeTick && (
          <div className="absolute left-3 bottom-2 flex items-center gap-2 bg-surface/90 border border-border px-2 py-1 rounded text-[10px] font-mono text-muted-foreground backdrop-blur-sm shadow-sm pointer-events-none">
            <span>Tick Digit:</span>
            <span className="font-bold text-xs text-primary px-1.5 py-0.2 rounded bg-primary/20">
              {activeTick.lastDigit}
            </span>
            <span>
              Spot: {market ? fmtQuote(activeTick.quote, market.pip_decimals) : activeTick.quote}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
