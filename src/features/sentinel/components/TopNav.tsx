import { useState } from "react";
import {
  Activity,
  ChevronDown,
  Plus,
  Shield,
  SlidersHorizontal,
  Wallet,
  Wifi,
  WifiOff,
  X,
} from "lucide-react";
import { useCockpit } from "../state/CockpitProvider";
import { DEMO_SCENARIOS, type DemoScenario, type FeedStatus } from "../types";
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
  LIVE: { label: "FEED LIVE", dot: "bg-emerald-400 animate-pulse", text: "text-emerald-400" },
  CONNECTING: { label: "CONNECTING", dot: "bg-amber-400 animate-pulse", text: "text-amber-400" },
  LAGGING: { label: "FEED LAGGING", dot: "bg-amber-400", text: "text-amber-400" },
  STALE: { label: "FEED STALE", dot: "bg-rose-500", text: "text-rose-400" },
  DEGRADED: { label: "DEGRADED", dot: "bg-rose-500", text: "text-rose-400" },
};

export function TopNav() {
  const {
    markets,
    market,
    tabs,
    activeSymbol,
    selectMarket,
    closeTab,
    scenario,
    setScenario,
    feedStatus,
    account,
    setFinderOpen,
    setTradeSheetOpen,
  } = useCockpit();

  const activeScenario = DEMO_SCENARIOS.find((s) => s.id === scenario) ?? DEMO_SCENARIOS[0];
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
              <span className="text-[10px] px-1 py-0.2 rounded bg-primary/20 text-primary font-mono font-medium">
                DTRADER
              </span>
            </div>
            <div className="text-[9px] text-muted-foreground tracking-wider uppercase font-mono">
              Market Cockpit
            </div>
          </div>
        </div>

        {/* Tab strip */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-1">
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
            <span className="hidden md:inline text-[11px]">Add Market</span>
          </Button>
        </div>
      </div>

      {/* Right Tools & Status */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Scenario Switcher (Prototype Demo Scenarios) */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-2.5 text-xs bg-surface-2 border-border/80 text-foreground hover:border-primary/40 font-mono flex items-center gap-1.5"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-primary" />
              <span className="hidden lg:inline">{activeScenario.label}</span>
              <span className="lg:hidden">State {activeScenario.id}</span>
              <ChevronDown className="w-3 h-3 text-muted-foreground opacity-70" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-72 bg-surface border-border text-foreground"
          >
            <DropdownMenuLabel className="text-[10px] uppercase font-mono tracking-wider text-muted-foreground">
              Demo Simulation States
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-border" />
            {DEMO_SCENARIOS.map((sc) => (
              <DropdownMenuItem
                key={sc.id}
                onClick={() => setScenario(sc.id)}
                className={`flex flex-col items-start gap-0.5 cursor-pointer py-2 ${
                  sc.id === scenario ? "bg-surface-3 text-primary" : "hover:bg-surface-2"
                }`}
              >
                <div className="font-semibold text-xs flex items-center gap-1.5">
                  <span className="font-mono text-primary">[{sc.id}]</span>
                  <span>{sc.label}</span>
                </div>
                <div className="text-[11px] text-muted-foreground leading-tight">{sc.detail}</div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Feed Status */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded bg-surface-2 border border-border text-xs font-mono">
          <span className={`w-2 h-2 rounded-full ${feed.dot}`} />
          <span className={`text-[10px] font-semibold tracking-wider ${feed.text}`}>
            {feed.label}
          </span>
        </div>

        {/* Account Info */}
        <div className="flex items-center gap-2 pl-2 border-l border-border/80">
          <div className="text-right hidden sm:block">
            <div className="text-[10px] font-mono text-muted-foreground uppercase flex items-center justify-end gap-1">
              <span>{account?.loginid ?? "VRTC991024"}</span>
              <span className="px-1 py-0.2 rounded bg-amber-500/10 text-amber-400 text-[9px] border border-amber-500/20">
                PROTOTYPE
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
          <div className="w-8 h-8 rounded-full bg-surface-3 border border-border flex items-center justify-center text-muted-foreground">
            <Wallet className="w-4 h-4" />
          </div>
        </div>

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
