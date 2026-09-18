import { ArrowRight, Check, Flame, ShieldAlert, Sparkles, X } from "lucide-react";
import { useCockpit } from "../state/CockpitProvider";
import { agoLabel, fmtPct, fmtSigned } from "../lib/util";
import type { CandidateState } from "../types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const stateBadge: Record<CandidateState, { bg: string; text: string }> = {
  QUALIFIED: { bg: "bg-emerald-500/20 border-emerald-500/40 text-emerald-400", text: "QUALIFIED" },
  WATCH: { bg: "bg-amber-500/20 border-amber-500/40 text-amber-400", text: "WATCH" },
  CONFLICT: {
    bg: "bg-orange-500/20 border-orange-500/40 text-orange-400",
    text: "SIGNAL CONFLICT",
  },
  WEAK: { bg: "bg-surface-3 border-border text-muted-foreground", text: "WEAK" },
  "NO QUALIFICATION": {
    bg: "bg-surface-3 border-border text-muted-foreground",
    text: "NO QUALIFICATION",
  },
};

export function DigitInspectorModal() {
  const { selectedDigit, setSelectedDigit, snapshot, updateConfig, selectContractType } =
    useCockpit();

  if (selectedDigit === null || !snapshot) return null;

  const intel = snapshot.digitIntel[selectedDigit];
  const stat = snapshot.digitStats.find((d) => d.digit === selectedDigit);

  if (!intel || !stat) return null;

  const handleSelectMatches = () => {
    selectContractType("DIGITMATCH");
    updateConfig({ contractType: "DIGITMATCH", barrier: selectedDigit });
    setSelectedDigit(null);
  };

  const handleSelectDiffers = () => {
    selectContractType("DIGITDIFF");
    updateConfig({ contractType: "DIGITDIFF", barrier: selectedDigit });
    setSelectedDigit(null);
  };

  const handleSelectOver = () => {
    selectContractType("DIGITOVER");
    updateConfig({ contractType: "DIGITOVER", barrier: selectedDigit });
    setSelectedDigit(null);
  };

  const handleSelectUnder = () => {
    selectContractType("DIGITUNDER");
    updateConfig({ contractType: "DIGITUNDER", barrier: selectedDigit });
    setSelectedDigit(null);
  };

  const matchBadge = stateBadge[intel.matchesSuitability];
  const diffBadge = stateBadge[intel.differsSuitability];

  return (
    <Dialog open={selectedDigit !== null} onOpenChange={(o) => !o && setSelectedDigit(null)}>
      <DialogContent className="max-w-lg bg-surface border-border text-foreground p-0 overflow-hidden shadow-2xl">
        <DialogHeader className="p-4 border-b border-border bg-surface-2/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/20 border border-primary/40 flex items-center justify-center font-mono font-black text-xl text-primary shadow-glow-primary">
                {selectedDigit}
              </div>
              <div>
                <DialogTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                  <span>Digit {selectedDigit} Intelligence</span>
                  <Badge variant="outline" className="text-[10px] font-mono uppercase">
                    {stat.status}
                  </Badge>
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5 font-mono">
                  Active window frequency: {fmtPct(stat.pct)} ({stat.count} hits) •{" "}
                  {agoLabel(stat.lastSeen)}
                </DialogDescription>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="p-4 space-y-4 text-xs font-mono">
          {/* Multi-Window Comparison Grid */}
          <div className="space-y-1.5">
            <div className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">
              Multi-Window Frequency Distribution
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="p-2.5 rounded bg-surface-2 border border-border">
                <div className="text-[10px] text-muted-foreground">Window 20t</div>
                <div className="text-sm font-bold text-foreground mt-0.5">
                  {fmtPct(intel.stat20.pct)}
                </div>
                <div className="text-[10px] text-muted-foreground">
                  {intel.stat20.count} hits • {(intel.stat20.trend || "").toUpperCase()}
                </div>
              </div>

              <div className="p-2.5 rounded bg-surface-2 border border-border">
                <div className="text-[10px] text-muted-foreground">Window 100t</div>
                <div className="text-sm font-bold text-foreground mt-0.5">
                  {fmtPct(intel.stat100.pct)}
                </div>
                <div className="text-[10px] text-muted-foreground">
                  {intel.stat100.count} hits • {(intel.stat100.trend || "").toUpperCase()}
                </div>
              </div>

              <div className="p-2.5 rounded bg-surface-2 border border-border">
                <div className="text-[10px] text-muted-foreground">Window 500t</div>
                <div className="text-sm font-bold text-foreground mt-0.5">
                  {fmtPct(intel.stat500.pct)}
                </div>
                <div className="text-[10px] text-muted-foreground">
                  {intel.stat500.count} hits • {(intel.stat500.trend || "").toUpperCase()}
                </div>
              </div>
            </div>
          </div>

          {/* Analytical Diagnostics */}
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2.5 rounded bg-surface-2 border border-border space-y-1">
              <div className="text-[10px] text-muted-foreground uppercase">Pressure / Momentum</div>
              <div className="font-semibold text-foreground flex items-center gap-1.5">
                <span>
                  {stat.pressure === "up"
                    ? "↑ Bullish"
                    : stat.pressure === "down"
                      ? "↓ Bearish"
                      : "→ Neutral"}
                </span>
                <span className="text-muted-foreground font-normal text-[11px]">
                  ({fmtSigned(stat.momentum * 100, 1)}% diff)
                </span>
              </div>
            </div>

            <div className="p-2.5 rounded bg-surface-2 border border-border space-y-1">
              <div className="text-[10px] text-muted-foreground uppercase">Losing-Digit Threat</div>
              <div className="font-semibold text-foreground flex items-center gap-1.5">
                <span
                  className={
                    intel.threat === "HIGH"
                      ? "text-rose-400"
                      : intel.threat === "MEDIUM"
                        ? "text-amber-400"
                        : "text-emerald-400"
                  }
                >
                  {intel.threat} THREAT
                </span>
                <span className="text-muted-foreground font-normal text-[11px]">
                  ({intel.regimeCompat})
                </span>
              </div>
            </div>
          </div>

          {/* Sentinel Suitability Evaluation */}
          <div className="space-y-2 border-t border-border pt-3">
            <div className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">
              Sentinel Contract Suitability
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 rounded bg-surface-2 border border-border">
                <div>
                  <div className="font-semibold text-foreground text-xs">
                    Matches {selectedDigit}
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    Win if last digit equals {selectedDigit}
                  </div>
                </div>
                <Badge variant="outline" className={`text-[10px] ${matchBadge.bg}`}>
                  {matchBadge.text}
                </Badge>
              </div>

              <div className="flex items-center justify-between p-2 rounded bg-surface-2 border border-border">
                <div>
                  <div className="font-semibold text-foreground text-xs">
                    Differs {selectedDigit}
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    Win if last digit is NOT {selectedDigit}
                  </div>
                </div>
                <Badge variant="outline" className={`text-[10px] ${diffBadge.bg}`}>
                  {diffBadge.text}
                </Badge>
              </div>
            </div>
          </div>

          {/* Transfer Actions */}
          <div className="space-y-1.5 border-t border-border pt-3">
            <div className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">
              Apply Digit to Contract Deck
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectMatches}
                className="h-8 text-xs bg-surface-2 border-border hover:bg-surface-3 hover:border-primary/40 font-mono"
              >
                Trade Matches {selectedDigit}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectDiffers}
                className="h-8 text-xs bg-surface-2 border-border hover:bg-surface-3 hover:border-primary/40 font-mono"
              >
                Trade Differs {selectedDigit}
              </Button>
              {selectedDigit < 9 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectOver}
                  className="h-8 text-xs bg-surface-2 border-border hover:bg-surface-3 hover:border-primary/40 font-mono"
                >
                  Trade Over {selectedDigit}
                </Button>
              )}
              {selectedDigit > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectUnder}
                  className="h-8 text-xs bg-surface-2 border-border hover:bg-surface-3 hover:border-primary/40 font-mono"
                >
                  Trade Under {selectedDigit}
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
