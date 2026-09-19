import { useState } from "react";
import {
  Activity,
  ChevronDown,
  KeyRound,
  LayoutGrid,
  Plus,
  Radio,
  Shield,
  SlidersHorizontal,
  Terminal,
  Wallet,
  Wifi,
  WifiOff,
  X,
} from "lucide-react";
import { useCockpit } from "../state/CockpitProvider";
import type { FeedStatus } from "../types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

const feedBadgeStyle: Record<FeedStatus, { label: string; dot: string; text: string }> = {
  LIVE: { label: "DERIV LIVE", dot: "bg-emerald-400 animate-pulse", text: "text-emerald-400" },
  CONNECTING: { label: "CONNECTING", dot: "bg-amber-400 animate-pulse", text: "text-amber-400" },
  LAGGING: { label: "FEED LAGGING", dot: "bg-amber-400", text: "text-amber-400" },
  STALE: { label: "FEED STALE", dot: "bg-rose-500", text: "text-rose-400" },
  DEGRADED: { label: "DEGRADED", dot: "bg-rose-500", text: "text-rose-400" },
};

export function TopNav() {
  const {
    markets,
    tabs,
    activeSymbol,
    selectMarket,
    closeTab,
    feedStatus,
    account,
    setFinderOpen,
    setTradeSheetOpen,
    viewMode,
    setViewMode,
    setAuthModalOpen,
    latency,
  } = useCockpit();

  const feed = feedBadgeStyle[feedStatus];

  return (
    <header className="h-14 border-b border-border bg-surface/95 backdrop-blur-md px-3 sm:px-4 flex items-center justify-between gap-2 select-none shrink-0 z-30">
      {/* Brand & Market Tabs */}
      <div className="flex items-center gap-3 min-w-0 overflow-hidden">
        {/* Brand */}
        <div className="flex items-center gap-2 pr-2 border-r border-border/80 shrink-0">
          <div className="w-8 h-8 rounded bg-primary/10 border border-primary/30 flex items-center justify-center text-primary shadow-glow-primary">
            <Shield className="w-4 h-4" />
          </div>
          <div className="hidden sm:block leading-tight">
            <div className="font-semibold tracking-wider text-xs uppercase text-foreground flex items-center gap-1.5">
              <span>Sentinel</span>
              <span className="text-[10px] px-1 py-0.2 rounded bg-primary/20 text-primary font-mono font-bold">
                DTRADER
              </span>
            </div>
            <div className="text-[9px] text-muted-foreground tracking-wider uppercase font-mono">
              Live Deriv WS Cockpit
            </div>
          </div>
        </div>

        {/* View Mode Toggle (Unified Cockpit vs DTrader Terminal) */}
        <div className="flex items-center gap-1 bg-surface-2 p-0.5 rounded-lg border border-border shrink-0">
          <button
            type="button"
            onClick={() => setViewMode("unified")}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-medium transition-all ${
              viewMode === "unified"
                ? "bg-primary text-primary-foreground shadow-sm font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Unified Cockpit</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode("dtrader")}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-medium transition-all ${
              viewMode === "dtrader"
                ? "bg-primary text-primary-foreground shadow-sm font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span className="hidden md:inline">DTrader Terminal</span>
          </button>
        </div>

        {/* Tab strip */}
        <div className="hidden lg:flex items-center gap-1 overflow-x-auto no-scrollbar py-1">
          {tabs.map((sym) => {
            const m = markets.find((item) => item.underlying_symbol === sym);
            const isActive = sym === activeSymbol;
            return (
              <div
                key={sym}
                onClick={() => selectMarket(sym)}
                className={`group flex items-center gap-1.5 px-2.5 py-1 rounded text-xs cursor-pointer border transition-all shrink-0 ${
                  isActive
                    ? "bg-surface-3 border-primary/40 text-foreground font-medium shadow-sm"
                    : "bg-surface/60 border-transparent text-muted-foreground hover:bg-surface-2 hover:text-foreground"
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isActive ? "bg-primary shadow-glow-primary" : "bg-muted-foreground/40"
                  }`}
                />
                <span className="font-mono text-[11px] truncate max-w-[110px] sm:max-w-[140px]">
                  {m ? m.display_name : sym}
                </span>
                {tabs.length > 1 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      closeTab(sym);
                    }}
                    className="opacity-0 group-hover:opacity-100 hover:text-rose-400 rounded p-0.5 ml-0.5 transition-opacity"
                    title="Close tab"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            );
          })}

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setFinderOpen(true)}
            className="h-7 px-2 text-xs text-muted-foreground hover:text-primary hover:bg-surface-2 shrink-0 gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden xl:inline text-[11px]">Add Market</span>
          </Button>
        </div>
      </div>

      {/* Right Tools & Status */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Feed Status with Deriv Latency */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-surface-2 border border-border text-xs font-mono">
          <span className={`w-2 h-2 rounded-full ${feed.dot}`} />
          <span className={`text-[10px] font-semibold tracking-wider ${feed.text}`}>
            {feed.label}
          </span>
          {latency > 0 && <span className="text-muted-foreground text-[10px]">({latency}ms)</span>}
        </div>

        {/* Account Info with Click to Connect */}
        <button
          type="button"
          onClick={() => setAuthModalOpen(true)}
          className="flex items-center gap-2 pl-2 border-l border-border/80 hover:opacity-90 transition-opacity text-left cursor-pointer"
          title="Click to configure Deriv API Token or switch account"
        >
          <div className="text-right hidden sm:block">
            <div className="text-[10px] font-mono text-muted-foreground uppercase flex items-center justify-end gap-1">
              <span>{account?.loginid ?? "VRTC982410"}</span>
              <span
                className={`px-1 py-0.2 rounded text-[9px] border ${
                  account?.is_virtual
                    ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                    : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                }`}
              >
                {account?.is_virtual ? "DEMO" : "LIVE"}
              </span>
            </div>
            <div className="text-xs font-mono font-semibold text-foreground">
              $
              {account?.balance !== null && account?.balance !== undefined
                ? account.balance.toLocaleString("en-US", { minimumFractionDigits: 2 })
                : "10,000.00"}{" "}
              <span className="text-muted-foreground font-normal text-[10px]">USD</span>
            </div>
          </div>
          <div className="w-8 h-8 rounded-full bg-surface-3 border border-border flex items-center justify-center text-primary shadow-sm hover:border-primary/50 transition-colors">
            <KeyRound className="w-3.5 h-3.5" />
          </div>
        </button>

        {/* Mobile Trade Drawer Trigger */}
        <Button
          variant="default"
          size="sm"
          onClick={() => setTradeSheetOpen(true)}
          className="xl:hidden h-8 px-3 text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90"
        >
          Trade
        </Button>
      </div>
    </header>
  );
}
