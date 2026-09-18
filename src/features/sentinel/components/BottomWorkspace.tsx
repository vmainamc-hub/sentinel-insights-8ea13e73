import { useState } from "react";
import {
  AlertCircle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  ExternalLink,
  FlaskConical,
  History,
  Layers,
  ShieldAlert,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  XCircle,
  Zap,
} from "lucide-react";
import { useCockpit } from "../state/CockpitProvider";
import { fmtMoney, fmtPct, fmtQuote, fmtSigned, fmtTime } from "../lib/util";
import type { CandidateState, OpenContract, TradeRecord } from "../types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const stateBadge: Record<CandidateState, { bg: string; text: string }> = {
  QUALIFIED: { bg: "bg-emerald-500/20 border-emerald-500/40 text-emerald-400", text: "QUALIFIED" },
  WATCH: { bg: "bg-amber-500/20 border-amber-500/40 text-amber-400", text: "WATCH" },
  CONFLICT: { bg: "bg-orange-500/20 border-orange-500/40 text-orange-400", text: "CONFLICT" },
  WEAK: { bg: "bg-surface-3 border-border text-muted-foreground", text: "WEAK" },
  "NO QUALIFICATION": {
    bg: "bg-surface-3 border-border text-muted-foreground",
    text: "NO QUALIFICATION",
  },
};

export function BottomWorkspace() {
  const { snapshot, market, applyCandidate, openContracts, history, sell } = useCockpit();
  const [tab, setTab] = useState<"lab" | "open" | "history">("lab");

  const candidates = snapshot?.contractCandidates ?? [];

  return (
    <div className="bg-surface border border-border rounded-lg overflow-hidden flex flex-col select-none">
      {/* Tab bar */}
      <div className="px-3 py-2 border-b border-border bg-surface-2/60 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setTab("lab")}
            className={`px-3 py-1 rounded text-xs font-mono font-medium flex items-center gap-1.5 transition-colors ${
              tab === "lab"
                ? "bg-surface-3 text-primary border border-primary/30 shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-surface-2"
            }`}
          >
            <FlaskConical className="w-3.5 h-3.5" />
            <span>Contract Lab</span>
            <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 bg-surface">
              {candidates.length}
            </Badge>
          </button>

          <button
            type="button"
            onClick={() => setTab("open")}
            className={`px-3 py-1 rounded text-xs font-mono font-medium flex items-center gap-1.5 transition-colors ${
              tab === "open"
                ? "bg-surface-3 text-primary border border-primary/30 shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-surface-2"
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Open Contracts</span>
            {openContracts.length > 0 && (
              <Badge
                variant="default"
                className="text-[9px] px-1 py-0 h-4 bg-primary text-primary-foreground font-bold"
              >
                {openContracts.length}
              </Badge>
            )}
          </button>

          <button
            type="button"
            onClick={() => setTab("history")}
            className={`px-3 py-1 rounded text-xs font-mono font-medium flex items-center gap-1.5 transition-colors ${
              tab === "history"
                ? "bg-surface-3 text-primary border border-primary/30 shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-surface-2"
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Trade History</span>
            <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 bg-surface">
              {history.length}
            </Badge>
          </button>
        </div>

        <div className="text-[10px] font-mono text-muted-foreground hidden sm:block">
          {tab === "lab"
            ? "Sentinel Empirical Evaluation Engine"
            : tab === "open"
              ? "In-Memory Prototype Portfolio Stream"
              : "Closed Prototype Contracts"}
        </div>
      </div>

      {/* Tab Contents */}
      <div className="p-3 min-h-[200px] overflow-x-auto font-mono text-xs">
        {/* CONTRACT LAB */}
        {tab === "lab" && (
          <div className="space-y-2">
            <div className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider flex items-center justify-between pb-1 border-b border-border/50">
              <span>Candidate Contract Evaluation Matrix ({market?.display_name})</span>
              <span>Showing Top Candidates</span>
            </div>

            {candidates.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                No contract candidates generated for current market sample
              </div>
            ) : (
              <div className="divide-y divide-border/60">
                {candidates.map((c) => {
                  const b = stateBadge[c.state];
                  return (
                    <div
                      key={c.id}
                      className="py-2.5 px-2 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 hover:bg-surface-2/60 rounded-md transition-colors"
                    >
                      {/* Left: Contract info */}
                      <div className="flex items-center gap-3 min-w-0">
                        <Badge
                          variant="outline"
                          className={`text-[10px] uppercase font-bold shrink-0 ${b.bg}`}
                        >
                          {b.text}
                        </Badge>

                        <div>
                          <div className="font-bold text-foreground text-xs flex items-center gap-2">
                            <span>{c.label}</span>
                            <span className="text-muted-foreground text-[11px] font-normal">
                              ({c.recency})
                            </span>
                          </div>
                          <div className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">
                            {c.summary}
                          </div>
                        </div>
                      </div>

                      {/* Right: Metrics & Action */}
                      <div className="flex items-center justify-between md:justify-end w-full md:w-auto gap-4 shrink-0 text-xs">
                        <div className="text-left md:text-right">
                          <div className="font-bold text-foreground">
                            {fmtPct(c.frequency)}
                            <span className="text-[10px] text-muted-foreground font-normal ml-1">
                              ({fmtSigned(c.edge * 100, 1)}% edge)
                            </span>
                          </div>
                          <div className="text-[10px] text-muted-foreground">
                            Pressure: {(c.pressure || "").toUpperCase()} • Threat: {c.threat}
                          </div>
                        </div>

                        <div className="text-left md:text-right">
                          <div className="font-semibold text-emerald-400">
                            ~{c.payoutPlaceholder.toFixed(2)}x payout
                          </div>
                          <div className="text-[10px] text-muted-foreground">
                            Regime: {c.regimeCompat}
                          </div>
                        </div>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => applyCandidate(c)}
                          className="h-7 px-2.5 text-xs bg-surface-2 border-border text-foreground hover:bg-surface-3 hover:border-primary/40 gap-1 shrink-0"
                        >
                          <span>Trade</span>
                          <ArrowRight className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* OPEN CONTRACTS */}
        {tab === "open" && (
          <div className="space-y-2">
            {openContracts.length === 0 ? (
              <div className="py-10 text-center text-muted-foreground space-y-1">
                <div className="font-semibold text-foreground text-xs">
                  No Active Prototype Contracts
                </div>
                <div className="text-[11px]">
                  Select a contract in the Trade Deck and click Buy to simulate execution.
                </div>
              </div>
            ) : (
              <div className="divide-y divide-border/60">
                {openContracts.map((oc) => {
                  const isProfit = oc.profit >= 0;
                  return (
                    <div
                      key={oc.contractId}
                      className="py-2.5 px-2 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 hover:bg-surface-2/60 rounded-md"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-2 h-10 rounded-full ${
                            isProfit ? "bg-emerald-400" : "bg-rose-500"
                          }`}
                        />
                        <div>
                          <div className="font-bold text-foreground text-xs flex items-center gap-2">
                            <span>{oc.label}</span>
                            <span className="text-muted-foreground text-[11px]">
                              on {oc.marketName}
                            </span>
                            <Badge variant="outline" className="text-[9px] bg-surface">
                              {oc.ticksElapsed}/{oc.ticksTotal} Ticks
                            </Badge>
                          </div>
                          <div className="text-[10px] text-muted-foreground mt-0.5">
                            Entry: {oc.entrySpot.toFixed(3)} • Current: {oc.currentSpot.toFixed(3)}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between md:justify-end w-full md:w-auto gap-4">
                        <div className="text-left md:text-right">
                          <div
                            className={`font-bold text-sm ${
                              isProfit ? "text-emerald-400" : "text-rose-400"
                            }`}
                          >
                            {isProfit ? "+" : ""}
                            {fmtMoney(oc.profit)}
                          </div>
                          <div className="text-[10px] text-muted-foreground">
                            Stake: {fmtMoney(oc.buyPrice)}
                          </div>
                        </div>

                        {oc.isSellable && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => sell(oc.contractId)}
                            className="h-7 text-xs bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500/20"
                          >
                            Close Early
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TRADE HISTORY */}
        {tab === "history" && (
          <div className="space-y-2">
            {history.length === 0 ? (
              <div className="py-10 text-center text-muted-foreground text-xs">
                No past prototype trades recorded in current session
              </div>
            ) : (
              <div className="divide-y divide-border/60">
                {history.map((rec) => {
                  const isWon = rec.status === "WON";
                  return (
                    <div
                      key={rec.id}
                      className="py-2.5 px-2 flex items-center justify-between hover:bg-surface-2/60 rounded-md text-xs"
                    >
                      <div className="flex items-center gap-3">
                        {isWon ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        ) : (
                          <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                        )}
                        <div>
                          <div className="font-bold text-foreground text-xs flex items-center gap-2">
                            <span>{rec.label}</span>
                            <Badge
                              variant="outline"
                              className={`text-[9px] ${
                                isWon
                                  ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                                  : "bg-rose-500/20 text-rose-400 border-rose-500/40"
                              }`}
                            >
                              {rec.status}
                            </Badge>
                          </div>
                          <div className="text-[10px] text-muted-foreground mt-0.5">
                            {rec.marketName} • {fmtTime(rec.time)} • Duration: {rec.durationLabel}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div
                          className={`font-bold text-sm ${
                            rec.profit >= 0 ? "text-emerald-400" : "text-rose-400"
                          }`}
                        >
                          {rec.profit >= 0 ? "+" : ""}
                          {fmtMoney(rec.profit)}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          Stake: {fmtMoney(rec.stake)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
