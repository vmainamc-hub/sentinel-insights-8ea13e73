import { useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Brain,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Gauge,
  HelpCircle,
  Radio,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import { useCockpit } from "../state/CockpitProvider";
import { fmtPct, fmtSigned } from "../lib/util";
import type { CandidateState, Decision, Verdict } from "../types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const verdictIcon: Record<Verdict, { color: string; label: string }> = {
  supportive: { color: "text-emerald-400", label: "SUPPORTIVE" },
  neutral: { color: "text-muted-foreground", label: "NEUTRAL" },
  opposing: { color: "text-rose-400", label: "OPPOSING" },
  unknown: { color: "text-amber-400", label: "UNKNOWN" },
};

const decisionStyle: Record<Decision, { bg: string; border: string; text: string; label: string }> =
  {
    "QUALIFIED CONTRACT": {
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/40",
      text: "text-emerald-400",
      label: "QUALIFIED CONTRACT IDENTIFIED",
    },
    "NO QUALIFIED CONTRACT": {
      bg: "bg-surface-2",
      border: "border-border",
      text: "text-muted-foreground",
      label: "NO QUALIFIED CONTRACT",
    },
    "ANALYSIS READY": {
      bg: "bg-primary/10",
      border: "border-primary/40",
      text: "text-primary",
      label: "ANALYSIS READY",
    },
    "INSUFFICIENT DATA": {
      bg: "bg-amber-500/10",
      border: "border-amber-500/40",
      text: "text-amber-400",
      label: "INSUFFICIENT TICK DATA",
    },
    "FEED STALE": {
      bg: "bg-rose-500/10",
      border: "border-rose-500/40",
      text: "text-rose-400",
      label: "FEED STALE — ANALYSIS SUSPENDED",
    },
    "ANALYSIS LAG": {
      bg: "bg-amber-500/10",
      border: "border-amber-500/40",
      text: "text-amber-400",
      label: "ANALYSIS LAGGING",
    },
    "ENGINE BUSY": {
      bg: "bg-surface-3",
      border: "border-border",
      text: "text-muted-foreground",
      label: "ENGINE BUSY",
    },
    "BACKEND DEGRADED": {
      bg: "bg-rose-500/10",
      border: "border-rose-500/40",
      text: "text-rose-400",
      label: "DEGRADED TELEMETRY",
    },
  };

export function MarketDossier() {
  const { market, snapshot, applyCandidate } = useCockpit();
  const [dossierExpanded, setDossierExpanded] = useState(false);

  if (!snapshot || !market) {
    return (
      <div className="bg-surface border border-border rounded-lg p-4 text-xs font-mono text-muted-foreground flex items-center justify-center">
        Assembling Sentinel Market Intelligence Dossier...
      </div>
    );
  }

  const decStyle = decisionStyle[snapshot.decision] ?? decisionStyle["ANALYSIS READY"];
  const candidate = snapshot.qualifiedCandidate;

  return (
    <div className="bg-surface border border-border rounded-lg p-3.5 space-y-3 select-none">
      {/* Primary Sentinel Contract Analysis Banner */}
      <div
        className={`p-3 rounded-lg border ${decStyle.bg} ${decStyle.border} flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3`}
      >
        <div className="flex items-start gap-3 min-w-0">
          <div className="p-2 rounded bg-surface border border-border shrink-0 text-primary">
            {candidate ? (
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            ) : snapshot.decision === "INSUFFICIENT DATA" || snapshot.decision === "FEED STALE" ? (
              <AlertTriangle className="w-5 h-5 text-amber-400" />
            ) : (
              <Shield className="w-5 h-5 text-muted-foreground" />
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span
                className={`text-xs font-mono font-bold uppercase tracking-wider ${decStyle.text}`}
              >
                {decStyle.label}
              </span>
              <Badge variant="outline" className="text-[10px] font-mono uppercase bg-surface">
                {snapshot.regime} REGIME
              </Badge>
            </div>

            {candidate ? (
              <div className="mt-1">
                <div className="text-base font-bold text-foreground flex items-center gap-2">
                  <span>Candidate:</span>
                  <span className="text-primary underline decoration-primary/40 font-mono">
                    {candidate.label}
                  </span>
                  <span className="text-xs text-muted-foreground font-mono font-normal">
                    (Win Frequency: {fmtPct(candidate.frequency)} • Edge:{" "}
                    {fmtSigned(candidate.edge * 100, 1)}%)
                  </span>
                </div>
                <div className="text-[11px] text-muted-foreground font-mono mt-0.5">
                  {candidate.summary}
                </div>
              </div>
            ) : (
              <div className="mt-1 text-xs text-muted-foreground font-mono">
                {snapshot.reasons.length > 0
                  ? snapshot.reasons[0]
                  : "Evidence is balanced or insufficient across active evaluation windows. No trade recommendation is forced."}
              </div>
            )}
          </div>
        </div>

        {candidate && (
          <Button
            size="sm"
            onClick={() => applyCandidate(candidate)}
            className="h-8 px-3 text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 font-mono shrink-0 gap-1.5"
          >
            <span>Apply to Deck</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        )}
      </div>

      {/* Intelligence Dossier KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-xs font-mono">
        {/* Market & Feed Quality */}
        <div className="p-2.5 rounded bg-surface-2/60 border border-border">
          <div className="text-[10px] uppercase font-semibold text-muted-foreground">
            Market Quality
          </div>
          <div className="font-bold text-foreground text-sm mt-0.5 flex items-center gap-1.5">
            <span>{snapshot.marketQuality.score}%</span>
            <span className="text-[10px] text-primary font-normal">
              ({snapshot.marketQuality.label})
            </span>
          </div>
          <div className="text-[10px] text-muted-foreground mt-0.5">
            Sample: {snapshot.tickCount} ticks
          </div>
        </div>

        {/* Directional Pressure */}
        <div className="p-2.5 rounded bg-surface-2/60 border border-border">
          <div className="text-[10px] uppercase font-semibold text-muted-foreground">
            Pressure Index
          </div>
          <div className="font-bold text-foreground text-sm mt-0.5">{snapshot.pressure.label}</div>
          <div className="text-[10px] text-muted-foreground mt-0.5">
            Direction: {(snapshot.pressure.direction || "").toUpperCase()}
          </div>
        </div>

        {/* Momentum */}
        <div className="p-2.5 rounded bg-surface-2/60 border border-border">
          <div className="text-[10px] uppercase font-semibold text-muted-foreground">
            Short-Window Momentum
          </div>
          <div className="font-bold text-foreground text-sm mt-0.5">
            {fmtSigned(snapshot.momentum.value, 2)}
          </div>
          <div className="text-[10px] text-muted-foreground mt-0.5">{snapshot.momentum.label}</div>
        </div>

        {/* Parity Bias */}
        <div className="p-2.5 rounded bg-surface-2/60 border border-border">
          <div className="text-[10px] uppercase font-semibold text-muted-foreground">
            Parity Vector
          </div>
          <div className="font-bold text-foreground text-sm mt-0.5">
            {snapshot.parityStats.bias} BIAS
          </div>
          <div className="text-[10px] text-muted-foreground mt-0.5">
            {fmtPct(snapshot.parityStats.evenPct)} E / {fmtPct(snapshot.parityStats.oddPct)} O
          </div>
        </div>

        {/* Behavioral Psychology */}
        <div className="p-2.5 rounded bg-surface-2/60 border border-border">
          <div className="text-[10px] uppercase font-semibold text-muted-foreground">
            Behavioral State
          </div>
          <div
            className="font-bold text-foreground text-sm mt-0.5 truncate"
            title={snapshot.psychology.label}
          >
            {snapshot.psychology.label}
          </div>
          <div className="text-[10px] text-muted-foreground mt-0.5 truncate">
            {snapshot.psychology.detail}
          </div>
        </div>

        {/* Losing Digit Threat */}
        <div className="p-2.5 rounded bg-surface-2/60 border border-border">
          <div className="text-[10px] uppercase font-semibold text-muted-foreground">
            Threat Digits
          </div>
          <div className="font-bold text-sm mt-0.5 flex items-center gap-1">
            <span
              className={
                snapshot.threat.level === "HIGH"
                  ? "text-rose-400"
                  : snapshot.threat.level === "MEDIUM"
                    ? "text-amber-400"
                    : "text-emerald-400"
              }
            >
              {snapshot.threat.level}
            </span>
            {snapshot.threat.digits.length > 0 && (
              <span className="text-[10px] font-mono text-muted-foreground">
                [{snapshot.threat.digits.join(", ")}]
              </span>
            )}
          </div>
          <div
            className="text-[10px] text-muted-foreground mt-0.5 truncate"
            title={snapshot.threat.detail}
          >
            {snapshot.threat.detail}
          </div>
        </div>
      </div>

      {/* Expandable Deep Dossier Inspection */}
      <div>
        <button
          type="button"
          onClick={() => setDossierExpanded(!dossierExpanded)}
          className="w-full py-1.5 px-2.5 rounded bg-surface-2/40 hover:bg-surface-2 border border-border flex items-center justify-between text-xs font-mono text-muted-foreground hover:text-foreground transition-colors"
        >
          <span className="flex items-center gap-2">
            <Brain className="w-3.5 h-3.5 text-primary" />
            <span className="font-semibold uppercase tracking-wider text-[11px]">
              {dossierExpanded
                ? "Hide Evidence Dossier & Conflict Matrix"
                : "View Evidence Dossier & Conflict Matrix"}
            </span>
          </span>
          {dossierExpanded ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </button>

        {dossierExpanded && (
          <div className="mt-2 p-3 rounded-lg bg-surface-2/30 border border-border space-y-3 font-mono text-xs">
            {/* Candidate Evidence Checklist if available */}
            {candidate && candidate.evidence.length > 0 && (
              <div>
                <div className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider mb-2">
                  Empirical Evidence Checklist for {candidate.label}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {candidate.evidence.map((ev, i) => {
                    const info = verdictIcon[ev.verdict] ?? verdictIcon.unknown;
                    return (
                      <div
                        key={i}
                        className="flex items-start justify-between p-2 rounded bg-surface border border-border/80"
                      >
                        <div>
                          <div className="font-semibold text-foreground text-[11px]">
                            {ev.label}
                          </div>
                          <div className="text-[10px] text-muted-foreground">{ev.detail}</div>
                        </div>
                        <span className={`text-[10px] font-bold ${info.color} shrink-0 ml-2`}>
                          {info.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Signal Conflicts Breakdown */}
            <div>
              <div className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider mb-1">
                Conflict & Anomaly Surveillance
              </div>
              <div className="p-2.5 rounded bg-surface border border-border/80 text-[11px] space-y-1">
                <div className="flex items-center gap-2 text-foreground font-semibold">
                  <AlertTriangle
                    className={`w-3.5 h-3.5 ${
                      snapshot.anomaly.detected ? "text-amber-400" : "text-emerald-400"
                    }`}
                  />
                  <span>
                    {snapshot.anomaly.detected
                      ? "Anomaly Flagged: " + snapshot.anomaly.detail
                      : "No statistical anomalies detected in current sample"}
                  </span>
                </div>
                {snapshot.conflicts.length > 0 ? (
                  <ul className="list-disc list-inside text-amber-400/90 pl-1 space-y-0.5 text-[10px]">
                    {snapshot.conflicts.map((c, i) => (
                      <li key={i}>{c}</li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-[10px] text-muted-foreground">
                    All indicator windows (20, 100, 500) exhibit baseline signal agreement.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
