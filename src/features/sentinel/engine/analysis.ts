/**
 * Sentinel analysis engine — builds the single AnalysisSnapshot consumed by
 * the whole cockpit. Evidence-based; never forces a candidate.
 *
 * PROTOTYPE NOTE: the statistical model here is a demonstration model
 * operating on prototype ticks. It makes no claim about live edge.
 */
import type {
  AnalysisSnapshot,
  CandidateState,
  ContractAvailability,
  ContractCandidate,
  ContractType,
  Decision,
  DigitIntel,
  DigitWindow,
  Direction,
  EvidenceRow,
  FeedStatus,
  Market,
  Regime,
  Tick,
  Verdict,
  WindowStats,
} from "../types";
import { DIGIT_WINDOWS } from "../types";
import { computeWindow, MIN_SAMPLE } from "./digitAnalysis";
import type { AnalysisService } from "../services/interfaces";

export const ANALYSIS_VERSION = "sentinel-proto-0.4";
const QUALIFY_SAMPLE = 100;
const EDGE = 0.04;

interface Rule {
  contractType: ContractType;
  barrier?: number;
  label: string;
  baseline: number;
  wins: (d: number) => boolean;
}

function digitRules(available: ContractAvailability[]): Rule[] {
  const has = (ct: ContractType) => available.some((a) => a.contractType === ct);
  const rules: Rule[] = [];
  if (has("DIGITEVEN")) rules.push({ contractType: "DIGITEVEN", label: "EVEN", baseline: 0.5, wins: (d) => d % 2 === 0 });
  if (has("DIGITODD")) rules.push({ contractType: "DIGITODD", label: "ODD", baseline: 0.5, wins: (d) => d % 2 === 1 });
  if (has("DIGITOVER"))
    for (let b = 0; b <= 8; b++)
      rules.push({ contractType: "DIGITOVER", barrier: b, label: `OVER ${b}`, baseline: (9 - b) / 10, wins: (d) => d > b });
  if (has("DIGITUNDER"))
    for (let b = 9; b >= 1; b--)
      rules.push({ contractType: "DIGITUNDER", barrier: b, label: `UNDER ${b}`, baseline: b / 10, wins: (d) => d < b });
  if (has("DIGITMATCH"))
    for (let b = 0; b <= 9; b++)
      rules.push({ contractType: "DIGITMATCH", barrier: b, label: `MATCHES ${b}`, baseline: 0.1, wins: (d) => d === b });
  if (has("DIGITDIFF"))
    for (let b = 0; b <= 9; b++)
      rules.push({ contractType: "DIGITDIFF", barrier: b, label: `DIFFERS ${b}`, baseline: 0.9, wins: (d) => d !== b });
  return rules;
}

export function payoutMultiple(ct: ContractType, barrier?: number) {
  // Prototype placeholder — NOT a Deriv price.
  const base: Record<ContractType, number> = {
    DIGITEVEN: 0.5,
    DIGITODD: 0.5,
    DIGITMATCH: 0.1,
    DIGITDIFF: 0.9,
    DIGITOVER: barrier === undefined ? 0.5 : (9 - barrier) / 10,
    DIGITUNDER: barrier === undefined ? 0.5 : barrier / 10,
    RISE: 0.5,
    FALL: 0.5,
    HIGHER: 0.5,
    LOWER: 0.5,
    ONETOUCH: 0.5,
    NOTOUCH: 0.5,
  };
  const p = Math.max(0.05, base[ct]);
  return Number((0.955 / p).toFixed(3));
}

function freq(ticks: Tick[], wins: (d: number) => boolean) {
  if (!ticks.length) return 0;
  return ticks.filter((t) => wins(t.lastDigit)).length / ticks.length;
}

function verdictFromEdge(edge: number, known = true): Verdict {
  if (!known) return "unknown";
  if (edge > EDGE) return "supportive";
  if (edge < -EDGE) return "opposing";
  return "neutral";
}

function verdictLabel(v: Verdict) {
  return v;
}

function ruleRegimeCompat(rule: Rule, regime: Regime, ws: WindowStats): Verdict {
  const ct = rule.contractType;
  if (regime === "ANOMALOUS") return "opposing";
  if (regime === "TRANSITION") return "neutral";
  if (regime === "EVEN PRESSURE") return ct === "DIGITEVEN" ? "supportive" : ct === "DIGITODD" ? "opposing" : "neutral";
  if (regime === "ODD PRESSURE") return ct === "DIGITODD" ? "supportive" : ct === "DIGITEVEN" ? "opposing" : "neutral";
  if (regime === "DIGIT CONCENTRATION") {
    if (ct === "DIGITMATCH") return ws.hot.includes(rule.barrier!) ? "supportive" : "opposing";
    if (ct === "DIGITDIFF") return ws.hot.includes(rule.barrier!) ? "opposing" : "neutral";
    return "neutral";
  }
  if (regime === "DIGIT DISPERSION") return ct === "DIGITMATCH" ? "opposing" : ct === "DIGITDIFF" ? "supportive" : "neutral";
  return "neutral";
}

function stateOf(
  ws: { s20: Verdict; s100: Verdict; s500: Verdict },
  pressure: Verdict,
  regime: Verdict,
  threat: "LOW" | "MEDIUM" | "HIGH",
  edge100: number,
  sufficient: boolean,
  feed: FeedStatus,
): { state: CandidateState; conflict: "LOW" | "MEDIUM" | "HIGH" } {
  if (!sufficient) return { state: "NO QUALIFICATION", conflict: "LOW" };
  const votes = [ws.s20, ws.s100, ws.s500, pressure, regime];
  const S = votes.filter((v) => v === "supportive").length;
  const O = votes.filter((v) => v === "opposing").length;
  const windowsS = [ws.s20, ws.s100, ws.s500].filter((v) => v === "supportive").length;
  const windowsO = [ws.s20, ws.s100, ws.s500].filter((v) => v === "opposing").length;

  let conflict: "LOW" | "MEDIUM" | "HIGH" = "LOW";
  if (windowsS && windowsO) conflict = "HIGH";
  else if (S && O) conflict = "MEDIUM";

  if (conflict === "HIGH" || (conflict === "MEDIUM" && S >= 2)) return { state: "CONFLICT", conflict };
  if (windowsS >= 2 && O === 0 && edge100 >= EDGE && threat !== "HIGH" && feed === "LIVE")
    return { state: "QUALIFIED", conflict };
  if (S >= 1 && O === 0) return { state: "WATCH", conflict };
  if (O >= 1 && S === 0) return { state: "WEAK", conflict };
  return { state: "NO QUALIFICATION", conflict };
}

const STATE_RANK: Record<CandidateState, number> = {
  QUALIFIED: 0,
  WATCH: 1,
  CONFLICT: 2,
  "NO QUALIFICATION": 3,
  WEAK: 4,
};

export function analyse(input: {
  market: Market;
  ticks: Tick[];
  feedStatus: FeedStatus;
  activeWindow: DigitWindow;
  available: ContractAvailability[];
}): AnalysisSnapshot {
  const { market, ticks, feedStatus, activeWindow, available } = input;
  const windowStats = Object.fromEntries(DIGIT_WINDOWS.map((w) => [w, computeWindow(ticks, w)])) as Record<
    DigitWindow,
    WindowStats
  >;
  const w20 = windowStats[20];
  const w100 = windowStats[100];
  const w500 = windowStats[500];
  const active = windowStats[activeWindow];
  const n = ticks.length;
  const sufficient = n >= MIN_SAMPLE;
  const qualifiable = n >= QUALIFY_SAMPLE;

  // parity
  const evenPct = active.evenPct;
  const parityDelta = evenPct - 0.5;
  const parityBias = Math.abs(parityDelta) > 0.04 ? (parityDelta > 0 ? "EVEN" : "ODD") : "NEUTRAL";

  // price pressure / momentum over the last 20 ticks
  const recent = ticks.slice(-21);
  let ups = 0;
  let downs = 0;
  for (let i = 1; i < recent.length; i++) {
    if (recent[i].quote > recent[i - 1].quote) ups++;
    else if (recent[i].quote < recent[i - 1].quote) downs++;
  }
  const pressureStrength = recent.length > 1 ? Math.abs(ups - downs) / (recent.length - 1) : 0;
  const pressureDir: Direction = pressureStrength < 0.15 ? "flat" : ups > downs ? "up" : "down";
  const momentumBp =
    recent.length > 1 ? ((recent[recent.length - 1].quote - recent[0].quote) / recent[0].quote) * 10000 : 0;

  // anomaly
  const streak = w20.streak;
  const hotShort = w20.digits.find((d) => d.pct >= 0.3 && w20.sample >= 20);
  const anomaly = {
    detected: sufficient && ((streak?.length ?? 0) >= 4 || !!hotShort),
    detail: !sufficient
      ? "Not enough ticks to test for anomalies."
      : (streak?.length ?? 0) >= 4
        ? `Digit ${streak!.digit} repeated ${streak!.length}× consecutively.`
        : hotShort
          ? `Digit ${hotShort.digit} holds ${(hotShort.pct * 100).toFixed(0)}% of the last 20 ticks.`
          : "None detected in the recent window.",
  };

  // regime
  const parityShort = w20.evenPct - 0.5;
  const parityLong = (w500.sample >= 100 ? w500 : w100).evenPct - 0.5;
  let regime: Regime = "UNKNOWN";
  if (sufficient) {
    if (anomaly.detected) regime = "ANOMALOUS";
    else if (Math.sign(parityShort) !== Math.sign(parityLong) && Math.abs(parityShort - parityLong) > 0.12)
      regime = "TRANSITION";
    else if (parityBias === "EVEN" && Math.abs(parityDelta) > 0.06) regime = "EVEN PRESSURE";
    else if (parityBias === "ODD" && Math.abs(parityDelta) > 0.06) regime = "ODD PRESSURE";
    else if (active.concentration > 0.16) regime = "DIGIT CONCENTRATION";
    else if (active.concentration < 0.05 && active.sample >= 100) regime = "DIGIT DISPERSION";
    else regime = "BALANCED";
  }

  // losing-digit threat: digits heating fast in the short window
  const threatDigits = w20.digits.filter((d) => d.momentum >= 6 && d.pct >= 0.15).map((d) => d.digit);
  const threatLevel = threatDigits.length >= 2 || (streak?.length ?? 0) >= 3 ? "HIGH" : threatDigits.length ? "MEDIUM" : "LOW";
  const threat = {
    digits: threatDigits,
    level: threatLevel as "LOW" | "MEDIUM" | "HIGH",
    detail: threatDigits.length
      ? `Digit${threatDigits.length > 1 ? "s" : ""} ${threatDigits.join(", ")} accelerating in the 20-tick window.`
      : "No digit is accelerating abnormally.",
  };

  // market quality
  let quality = 1;
  if (!sufficient) quality -= 0.6;
  else if (!qualifiable) quality -= 0.3;
  if (feedStatus !== "LIVE") quality -= 0.35;
  if (anomaly.detected) quality -= 0.15;
  if (regime === "TRANSITION") quality -= 0.1;
  quality = Math.max(0, Math.min(1, quality));
  const qualityLabel = quality >= 0.8 ? "STRUCTURED" : quality >= 0.55 ? "USABLE" : quality >= 0.3 ? "DEGRADED" : "UNRELIABLE";

  // candidates
  const rules = digitRules(available);
  const candidates: ContractCandidate[] = rules.map((rule) => {
    const f20 = freq(w20.digits.length ? ticks.slice(-20) : [], rule.wins);
    const f100 = freq(ticks.slice(-100), rule.wins);
    const f500 = freq(ticks.slice(-500), rule.wins);
    const e20 = f20 - rule.baseline;
    const e100 = f100 - rule.baseline;
    const e500 = f500 - rule.baseline;
    const s20 = verdictFromEdge(e20, n >= 20);
    const s100 = verdictFromEdge(e100, n >= 100);
    const s500 = verdictFromEdge(e500, n >= 500);
    const pressureEdge = f20 - f100;
    const pressureV = verdictFromEdge(pressureEdge, n >= 40);
    const regimeV = ruleRegimeCompat(rule, regime, active);
    const affected =
      rule.contractType === "DIGITMATCH"
        ? false
        : threat.digits.some((d) => !rule.wins(d));
    const cThreat: "LOW" | "MEDIUM" | "HIGH" = affected ? threat.level : "LOW";
    const parityV: Verdict =
      rule.contractType === "DIGITEVEN"
        ? parityBias === "EVEN"
          ? "supportive"
          : parityBias === "ODD"
            ? "opposing"
            : "neutral"
        : rule.contractType === "DIGITODD"
          ? parityBias === "ODD"
            ? "supportive"
            : parityBias === "EVEN"
              ? "opposing"
              : "neutral"
          : "neutral";
    const { state, conflict } = stateOf({ s20, s100, s500 }, pressureV, regimeV, cThreat, e100, qualifiable, feedStatus);

    const fmt = (f: number, e: number, known: boolean) =>
      known ? `${(f * 100).toFixed(1)}% vs ${(rule.baseline * 100).toFixed(0)}% base (${e >= 0 ? "+" : ""}${(e * 100).toFixed(1)})` : "insufficient sample";
    const evidence: EvidenceRow[] = [
      { label: "20-tick distribution", verdict: s20, detail: fmt(f20, e20, n >= 20) },
      { label: "100-tick distribution", verdict: s100, detail: fmt(f100, e100, n >= 100) },
      { label: "500-tick distribution", verdict: s500, detail: fmt(f500, e500, n >= 500) },
      { label: "recent pressure", verdict: pressureV, detail: n >= 40 ? `20t minus 100t: ${(pressureEdge * 100).toFixed(1)} pts` : "insufficient sample" },
      { label: "parity", verdict: parityV, detail: `${(evenPct * 100).toFixed(1)}% even in ${activeWindow}-tick window` },
      { label: "regime", verdict: regimeV, detail: regime },
      { label: "anomaly", verdict: anomaly.detected ? "opposing" : "neutral", detail: anomaly.detected ? anomaly.detail : "none detected" },
      { label: "losing-digit threat", verdict: cThreat === "HIGH" ? "opposing" : cThreat === "MEDIUM" ? "neutral" : "supportive", detail: affected ? threat.detail : "no threatened digit breaks this contract" },
      { label: "contract conflict", verdict: conflict === "HIGH" ? "opposing" : conflict === "MEDIUM" ? "neutral" : "supportive", detail: conflict.toLowerCase() },
      { label: "data quality", verdict: qualifiable && feedStatus === "LIVE" ? "supportive" : "opposing", detail: `${n} ticks · feed ${feedStatus}` },
    ];

    const lastWin = [...ticks].reverse().findIndex((t) => rule.wins(t.lastDigit));
    return {
      id: `${rule.contractType}${rule.barrier ?? ""}`,
      contractType: rule.contractType,
      barrier: rule.barrier,
      label: rule.label,
      state,
      frequency: f100 || f20,
      baseline: rule.baseline,
      edge: n >= 100 ? e100 : e20,
      pressure: pressureEdge > 0.03 ? "up" : pressureEdge < -0.03 ? "down" : "flat",
      momentum: pressureEdge * 100,
      recency: lastWin < 0 ? "—" : lastWin === 0 ? "won last tick" : `${lastWin}t since win`,
      threat: cThreat,
      regimeCompat: regimeV,
      payoutPlaceholder: payoutMultiple(rule.contractType, rule.barrier),
      conflict,
      evidence,
      summary:
        state === "QUALIFIED"
          ? "Window-consistent edge with no opposing signal."
          : state === "CONFLICT"
            ? "Analysis windows disagree — evidence is not aligned."
            : state === "WATCH"
              ? "Some support, not enough agreement to qualify."
              : state === "WEAK"
                ? "Evidence leans against this contract."
                : "No statistical case in either direction.",
    };
  });

  candidates.sort((a, b) => STATE_RANK[a.state] - STATE_RANK[b.state] || b.edge - a.edge);
  const qualified = candidates.filter((c) => c.state === "QUALIFIED");
  const qualifiedCandidate = qualified.length ? qualified[0] : null;

  // decision
  let decision: Decision;
  if (feedStatus === "STALE") decision = "FEED STALE";
  else if (feedStatus === "DEGRADED") decision = "BACKEND DEGRADED";
  else if (feedStatus === "LAGGING") decision = "ANALYSIS LAG";
  else if (feedStatus === "CONNECTING") decision = "ENGINE BUSY";
  else if (!qualifiable) decision = "INSUFFICIENT DATA";
  else if (qualifiedCandidate) decision = "QUALIFIED CONTRACT";
  else if (rules.length === 0) decision = "ANALYSIS READY";
  else decision = "NO QUALIFIED CONTRACT";

  const conflicts: string[] = [];
  const conflictCount = candidates.filter((c) => c.state === "CONFLICT").length;
  if (conflictCount) conflicts.push(`${conflictCount} contract${conflictCount > 1 ? "s" : ""} show window disagreement (short vs long history).`);
  if (regime === "TRANSITION") conflicts.push("Parity is flipping between the 20-tick and long windows — regime in transition.");
  if (parityBias !== "NEUTRAL" && regime === "DIGIT CONCENTRATION")
    conflicts.push("Parity bias and digit concentration point at different contract families.");
  if (threat.level !== "LOW") conflicts.push(threat.detail);

  const reasons: string[] = [];
  if (decision === "FEED STALE") reasons.push("No new ticks are arriving; analysis is frozen on the last known sample.");
  if (decision === "BACKEND DEGRADED") reasons.push("Feed degraded — the engine will not qualify contracts on an unreliable stream.");
  if (decision === "ANALYSIS LAG") reasons.push("Ticks are arriving late; short-window statistics may be behind the market.");
  if (decision === "INSUFFICIENT DATA") reasons.push(`${n} ticks available; ${QUALIFY_SAMPLE} required before any contract can qualify.`);
  if (decision === "QUALIFIED CONTRACT" && qualifiedCandidate)
    reasons.push(`${qualifiedCandidate.label}: ${qualifiedCandidate.evidence.filter((e) => e.verdict === "supportive").length}/${qualifiedCandidate.evidence.length} evidence rows supportive, none opposing.`);
  if (decision === "NO QUALIFIED CONTRACT")
    reasons.push(
      conflictCount
        ? "Candidates with support are contradicted by another window or signal."
        : "Distribution is close to uniform; no contract shows a persistent edge.",
    );
  if (rules.length === 0) reasons.push("This market exposes no digit contracts; Sentinel evaluates direction contracts only.");

  // digit intel
  const digitIntel: Record<number, DigitIntel> = {};
  for (let d = 0; d < 10; d++) {
    const m = candidates.find((c) => c.contractType === "DIGITMATCH" && c.barrier === d);
    const df = candidates.find((c) => c.contractType === "DIGITDIFF" && c.barrier === d);
    const s20 = w20.digits[d];
    const notes: string[] = [];
    if (s20.status === "HOT") notes.push("Hot in the current window.");
    if (s20.status === "COLD") notes.push("Cold in the current window.");
    if (threat.digits.includes(d)) notes.push("Flagged as a losing-digit threat for contracts that lose on it.");
    if (s20.run >= 2) notes.push(`Currently running ${s20.run}× in a row.`);
    if (!notes.length) notes.push("Behaving within normal bounds.");
    digitIntel[d] = {
      digit: d,
      stat20: w20.digits[d],
      stat100: w100.digits[d],
      stat500: w500.digits[d],
      threat: threat.digits.includes(d) ? threat.level : "LOW",
      regimeCompat: regime === "DIGIT CONCENTRATION" ? (active.hot.includes(d) ? "supportive" : "neutral") : regime === "ANOMALOUS" ? "opposing" : "neutral",
      matchesSuitability: m?.state ?? "NO QUALIFICATION",
      differsSuitability: df?.state ?? "NO QUALIFICATION",
      notes,
    };
  }

  const psychology = (() => {
    const long = w500.sample >= 100 ? w500 : w100;
    if (!sufficient) return { label: "UNKNOWN", detail: "Behavioural read needs at least 20 ticks." };
    if (long.concentration > 0.14) return { label: "CLUSTERING", detail: `Long window leans on digits ${long.hot.join(", ") || "—"}; structure persists beyond noise.` };
    if (Math.abs(long.evenPct - 0.5) > 0.05) return { label: long.evenPct > 0.5 ? "EVEN LOADED" : "ODD LOADED", detail: `${(long.evenPct * 100).toFixed(1)}% even across ${long.sample} ticks.` };
    if (regime === "TRANSITION") return { label: "REBALANCING", detail: "Recent ticks are unwinding the longer-window bias." };
    return { label: "MEAN-REVERTING", detail: "Long window sits near uniform; deviations have been short-lived." };
  })();

  return {
    market,
    timestamp: Date.now(),
    analysisVersion: ANALYSIS_VERSION,
    tickCount: n,
    windowStats,
    digitStats: active.digits,
    parityStats: { evenPct, oddPct: 1 - evenPct, bias: parityBias, strength: Math.abs(parityDelta) },
    pressure: {
      direction: pressureDir,
      strength: pressureStrength,
      label: pressureDir === "flat" ? "BALANCED" : pressureDir === "up" ? `UPWARD ${ups}/${ups + downs}` : `DOWNWARD ${downs}/${ups + downs}`,
    },
    momentum: {
      value: momentumBp,
      label: Math.abs(momentumBp) < 2 ? "FLAT" : momentumBp > 0 ? "POSITIVE" : "NEGATIVE",
    },
    psychology,
    regime,
    threat,
    anomaly,
    marketQuality: { score: quality, label: qualityLabel },
    contractCandidates: candidates,
    qualifiedCandidate,
    decision,
    reasons,
    conflicts,
    dataIntegrity: {
      sufficient: qualifiable,
      sample: n,
      required: QUALIFY_SAMPLE,
      detail: qualifiable ? "Sample meets qualification threshold." : sufficient ? "Enough for description, not for qualification." : "Below minimum analysis sample.",
    },
    feedStatus,
    digitIntel,
    source: "PROTOTYPE",
  };
}

export const analysisService: AnalysisService = { analyse };
export { verdictLabel };
