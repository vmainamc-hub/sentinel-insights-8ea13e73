import { useMemo } from "react";
import {
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  Check,
  CheckCircle2,
  Clock,
  DollarSign,
  Info,
  Loader2,
  Sliders,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Zap,
} from "lucide-react";
import { useCockpit } from "../state/CockpitProvider";
import { contractLabel } from "../services";
import { fmtMoney, fmtPct, fmtQuote } from "../lib/util";
import type { ContractFamily, ContractType } from "../types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export function TradeDeck() {
  const {
    market,
    available,
    config,
    updateConfig,
    selectContractType,
    proposal,
    proposalLoading,
    buy,
    buying,
  } = useCockpit();

  // Group available contracts by family
  const families = useMemo(() => {
    const fams = new Map<ContractFamily, ContractType[]>();
    for (const a of available) {
      const list = fams.get(a.family) ?? [];
      list.push(a.contractType);
      fams.set(a.family, list);
    }
    return fams;
  }, [available]);

  const activeDef = available.find((a) => a.contractType === config.contractType);

  const isDigits = activeDef?.family === "digits";
  const isMatchesDiffers =
    config.contractType === "DIGITMATCH" || config.contractType === "DIGITDIFF";
  const isOverUnder = config.contractType === "DIGITOVER" || config.contractType === "DIGITUNDER";
  const isEvenOdd = config.contractType === "DIGITEVEN" || config.contractType === "DIGITODD";
  const isRiseFall = config.contractType === "RISE" || config.contractType === "FALL";

  const stakePresets = [5, 10, 25, 50, 100];
  const buyBtnLabel = (
    contractLabel(config.contractType, config.barrier) ||
    config.contractType ||
    "CONTRACT"
  ).toUpperCase();

  return (
    <div className="flex flex-col h-full bg-surface rounded-lg border border-border overflow-hidden select-none">
      {/* Header */}
      <div className="px-3 py-2.5 border-b border-border bg-surface-2/60 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-xs tracking-wider uppercase text-foreground">
            Contract & Execution Deck
          </h3>
        </div>
        <Badge variant="outline" className="text-[9px] font-mono uppercase bg-surface-3">
          Adaptive Deck
        </Badge>
      </div>

      <div className="flex-1 p-3 space-y-3.5 overflow-y-auto font-mono text-xs">
        {/* Contract Type Selection Tabs */}
        <div className="space-y-1.5">
          <div className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider flex items-center justify-between">
            <span>Contract Type</span>
            <span className="text-foreground">
              {contractLabel(config.contractType, config.barrier)}
            </span>
          </div>

          {/* Quick family groups */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
            {available.map((item) => {
              const isCurrent = item.contractType === config.contractType;
              return (
                <button
                  key={item.contractType}
                  type="button"
                  onClick={() => selectContractType(item.contractType)}
                  className={`p-2 rounded border text-left transition-all ${
                    isCurrent
                      ? "bg-primary text-primary-foreground border-primary font-bold shadow-sm"
                      : "bg-surface-2/80 border-border/80 text-muted-foreground hover:text-foreground hover:bg-surface-3"
                  }`}
                >
                  <div className="text-[11px] truncate">{item.label}</div>
                  <div className="text-[9px] opacity-80 uppercase mt-0.5">{item.family}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Dynamic Controls based on contract */}
        {/* Even / Odd toggle */}
        {isEvenOdd && (
          <div className="p-2.5 rounded-lg bg-surface-2/70 border border-border space-y-2">
            <div className="text-[10px] uppercase font-semibold text-muted-foreground">
              Parity Selection
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={config.contractType === "DIGITEVEN" ? "default" : "outline"}
                onClick={() => selectContractType("DIGITEVEN")}
                className="h-9 text-xs font-bold font-mono"
              >
                EVEN (0, 2, 4, 6, 8)
              </Button>
              <Button
                type="button"
                variant={config.contractType === "DIGITODD" ? "default" : "outline"}
                onClick={() => selectContractType("DIGITODD")}
                className="h-9 text-xs font-bold font-mono"
              >
                ODD (1, 3, 5, 7, 9)
              </Button>
            </div>
          </div>
        )}

        {/* Matches / Differs digit selection (0–9) */}
        {isMatchesDiffers && (
          <div className="p-2.5 rounded-lg bg-surface-2/70 border border-border space-y-2">
            <div className="text-[10px] uppercase font-semibold text-muted-foreground flex items-center justify-between">
              <span>Target Prediction Digit (0–9)</span>
              <span className="text-primary font-bold">Selected: {config.barrier ?? 0}</span>
            </div>
            <div className="grid grid-cols-5 sm:grid-cols-10 gap-1">
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => updateConfig({ barrier: d })}
                  className={`h-8 rounded font-mono font-bold text-sm transition-all ${
                    config.barrier === d
                      ? "bg-primary text-primary-foreground shadow-glow-primary scale-105"
                      : "bg-surface border border-border text-foreground hover:bg-surface-3"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Over / Under barrier selection */}
        {isOverUnder && (
          <div className="p-2.5 rounded-lg bg-surface-2/70 border border-border space-y-2">
            <div className="text-[10px] uppercase font-semibold text-muted-foreground flex items-center justify-between">
              <span>Barrier Threshold Digit</span>
              <span className="text-primary font-bold">Barrier: {config.barrier ?? 5}</span>
            </div>
            <div className="grid grid-cols-5 sm:grid-cols-10 gap-1">
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => updateConfig({ barrier: d })}
                  className={`h-8 rounded font-mono font-bold text-sm transition-all ${
                    config.barrier === d
                      ? "bg-primary text-primary-foreground shadow-glow-primary scale-105"
                      : "bg-surface border border-border text-foreground hover:bg-surface-3"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Rise / Fall Direction buttons */}
        {isRiseFall && (
          <div className="p-2.5 rounded-lg bg-surface-2/70 border border-border space-y-2">
            <div className="text-[10px] uppercase font-semibold text-muted-foreground">
              Market Direction
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={config.contractType === "RISE" ? "default" : "outline"}
                onClick={() => selectContractType("RISE")}
                className="h-10 text-xs font-bold font-mono gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white"
              >
                <TrendingUp className="w-4 h-4" />
                <span>RISE (Higher)</span>
              </Button>
              <Button
                type="button"
                variant={config.contractType === "FALL" ? "default" : "outline"}
                onClick={() => selectContractType("FALL")}
                className="h-10 text-xs font-bold font-mono gap-1.5 bg-rose-600 hover:bg-rose-500 text-white"
              >
                <TrendingDown className="w-4 h-4" />
                <span>FALL (Lower)</span>
              </Button>
            </div>
          </div>
        )}

        {/* Duration Controls */}
        <div className="p-2.5 rounded-lg bg-surface-2/70 border border-border space-y-2">
          <div className="text-[10px] uppercase font-semibold text-muted-foreground flex items-center justify-between">
            <span>Duration</span>
            <span className="text-foreground">
              {config.duration}{" "}
              {config.durationUnit === "t"
                ? "Ticks"
                : config.durationUnit === "s"
                  ? "Seconds"
                  : "Minutes"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min={1}
              max={100}
              value={config.duration}
              onChange={(e) => updateConfig({ duration: Math.max(1, Number(e.target.value)) })}
              className="h-8 text-xs font-mono bg-surface border-border text-foreground w-24"
            />
            {/* Duration presets */}
            <div className="flex items-center gap-1">
              {[1, 5, 10].map((ticks) => (
                <Button
                  key={ticks}
                  type="button"
                  variant={config.duration === ticks ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => updateConfig({ duration: ticks, durationUnit: "t" })}
                  className="h-8 px-2.5 text-xs font-mono"
                >
                  {ticks}t
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Stake Controls */}
        <div className="p-2.5 rounded-lg bg-surface-2/70 border border-border space-y-2">
          <div className="text-[10px] uppercase font-semibold text-muted-foreground flex items-center justify-between">
            <span>Stake</span>
            <span className="text-foreground font-bold">
              {fmtMoney(config.stake, config.currency)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <DollarSign className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="number"
                min={1}
                step={1}
                value={config.stake}
                onChange={(e) => updateConfig({ stake: Math.max(1, Number(e.target.value)) })}
                className="pl-7 h-8 text-xs font-mono bg-surface border-border text-foreground"
              />
            </div>
            <div className="flex items-center gap-1">
              {stakePresets.map((amt) => (
                <Button
                  key={amt}
                  type="button"
                  variant={config.stake === amt ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => updateConfig({ stake: amt })}
                  className="h-8 px-2 text-xs font-mono"
                >
                  ${amt}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Proposal Summary Card */}
        <div className="p-3 rounded-lg bg-surface-2 border border-border space-y-2.5">
          <div className="flex items-center justify-between border-b border-border/70 pb-1.5">
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-1">
              <Zap className="w-3 h-3 text-primary" />
              <span>Deriv Wire Proposal</span>
            </span>
            <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono">
              PROTOTYPE PROPOSAL
            </span>
          </div>

          {proposalLoading ? (
            <div className="py-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
              <span>Pricing proposal...</span>
            </div>
          ) : proposal ? (
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Spot Quote</span>
                <span className="text-foreground font-semibold">
                  {market ? fmtQuote(proposal.spot, market.pip_decimals) : proposal.spot}
                </span>
              </div>
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Stake / Ask Price</span>
                <span className="text-foreground font-semibold">
                  {fmtMoney(proposal.askPrice, config.currency)}
                </span>
              </div>
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Expected Payout</span>
                <span className="text-emerald-400 font-bold">
                  {fmtMoney(proposal.payout, config.currency)}
                </span>
              </div>
              <div className="flex items-center justify-between text-muted-foreground pt-1 border-t border-border/60">
                <span>Potential Profit</span>
                <div className="text-right">
                  <span className="text-emerald-400 font-bold">
                    +{fmtMoney(proposal.potentialProfit, config.currency)}
                  </span>
                  <span className="text-[10px] text-muted-foreground ml-1">
                    (+{((proposal.potentialProfit / proposal.askPrice) * 100).toFixed(1)}%)
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-xs text-muted-foreground py-2 text-center">
              Proposal unavailable for active configuration
            </div>
          )}
        </div>

        {/* Prototype Buy Button */}
        <Button
          type="button"
          onClick={buy}
          disabled={buying || proposalLoading || !proposal || proposal.status !== "READY"}
          className="w-full h-11 text-sm font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-glow-primary transition-all gap-2"
        >
          {buying ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Executing Prototype Contract...</span>
            </>
          ) : (
            <>
              <Zap className="w-4 h-4 fill-current" />
              <span>BUY {buyBtnLabel}</span>
            </>
          )}
        </Button>

        <div className="text-[10px] text-center text-muted-foreground leading-tight">
          Prototype Mode: Places in-memory test contracts into Open Contracts. No real funds or
          Deriv trades are dispatched.
        </div>
      </div>
    </div>
  );
}
