/**
 * SENTINEL DTRADER — shared domain model.
 *
 * Everything in the UI consumes these types. The mock services in
 * ./services/mock implement them today; the live Deriv services will
 * implement the same interfaces later (see ./services/interfaces.ts).
 *
 * Naming follows the *current* Deriv API model (underlying_symbol, etc.).
 */

// ─── Markets ────────────────────────────────────────────────────────────────

export type MarketCategory =
  | "volatility"
  | "volatility_1s"
  | "crash_boom"
  | "jump"
  | "step"
  | "range_break"
  | "other_synthetic"
  | "other";

/** Shape aligned with an `active_symbols` row (subset). */
export interface Market {
  underlying_symbol: string;
  display_name: string;
  market: string;
  market_display_name: string;
  submarket: string;
  submarket_display_name: string;
  category: MarketCategory;
  /** Number of decimals in the quote. Last digit = last decimal. */
  pip_decimals: number;
  exchange_is_open: boolean;
  /** Approx. seconds between ticks (1 for 1s indices, 2 for standard). */
  tick_interval_seconds: number;
}

export interface Tick {
  underlying_symbol: string;
  epoch: number; // ms
  quote: number;
  lastDigit: number;
}

export type FeedStatus = "LIVE" | "STALE" | "LAGGING" | "DEGRADED" | "CONNECTING";

// ─── Contracts ──────────────────────────────────────────────────────────────

export type ContractFamily = "digits" | "direction" | "barrier";

export type ContractType =
  | "DIGITEVEN"
  | "DIGITODD"
  | "DIGITMATCH"
  | "DIGITDIFF"
  | "DIGITOVER"
  | "DIGITUNDER"
  | "RISE"
  | "FALL"
  | "HIGHER"
  | "LOWER"
  | "ONETOUCH"
  | "NOTOUCH";

export type BarrierKind = "none" | "digit" | "price";

export interface DurationSpec {
  unit: "t" | "s" | "m" | "h";
  min: number;
  max: number;
}

/** Derived from a `contracts_for` response for one underlying_symbol. */
export interface ContractAvailability {
  contractType: ContractType;
  family: ContractFamily;
  /** Deriv wire contract_type (CALL/PUT/DIGITOVER/…); kept for the live layer. */
  derivContractType: string;
  label: string;
  barrier: BarrierKind;
  durations: DurationSpec[];
}

export interface ContractConfig {
  contractType: ContractType;
  /** Digit (0–9) for MATCH/DIFF/OVER/UNDER, price offset for HIGHER/LOWER/TOUCH. */
  barrier?: number;
  duration: number;
  durationUnit: DurationSpec["unit"];
  stake: number;
  currency: string;
}

// ─── Proposals / trades ─────────────────────────────────────────────────────

export type ProposalStatus = "IDLE" | "PRICING" | "READY" | "UNAVAILABLE" | "ERROR";

export interface Proposal {
  id: string;
  status: ProposalStatus;
  source: "PROTOTYPE" | "DERIV";
  config: ContractConfig;
  askPrice: number;
  payout: number;
  potentialProfit: number;
  spot: number;
  message?: string;
  createdAt: number;
}

export type ContractStatus = "OPEN" | "WON" | "LOST" | "SOLD";

export interface OpenContract {
  contractId: string;
  underlying_symbol: string;
  marketName: string;
  contractType: ContractType;
  barrier?: number;
  label: string;
  entrySpot: number;
  currentSpot: number;
  buyPrice: number;
  currentValue: number;
  profit: number;
  status: ContractStatus;
  ticksTotal: number;
  ticksElapsed: number;
  purchaseTime: number;
  expiryTime: number;
  isSellable: boolean;
  source: "PROTOTYPE" | "DERIV";
}

export interface TradeRecord {
  id: string;
  time: number;
  underlying_symbol: string;
  marketName: string;
  label: string;
  contractType: ContractType;
  entrySpot: number;
  exitSpot: number;
  stake: number;
  profit: number;
  durationLabel: string;
  status: Exclude<ContractStatus, "OPEN">;
  source: "PROTOTYPE" | "DERIV";
}

export interface Account {
  loginid: string;
  currency: string;
  balance: number | null;
  kind: "PROTOTYPE" | "DEMO" | "REAL";
  label: string;
}

// ─── Digit analytics ────────────────────────────────────────────────────────

export type DigitWindow = 20 | 50 | 100 | 120 | 500 | 1000;
export const DIGIT_WINDOWS: DigitWindow[] = [20, 50, 100, 120, 500, 1000];

export type Direction = "up" | "down" | "flat";
export type DigitStatus = "HOT" | "COLD" | "NEUTRAL" | "RECENT";

export interface DigitStat {
  digit: number;
  count: number;
  pct: number;
  /** pct change vs the previous equal-length window */
  trend: Direction;
  lastSeen: number; // ticks ago, -1 if never
  run: number; // current consecutive run (only >0 for the latest digit)
  pressure: Direction; // short vs long window
  momentum: number; // signed, short-window pct minus long-window pct
  status: DigitStatus;
  /** tick offsets (ago) of the most recent appearances */
  recent: number[];
}

export interface WindowStats {
  window: DigitWindow;
  sample: number; // actual ticks available (≤ window)
  digits: DigitStat[];
  evenPct: number;
  oddPct: number;
  hot: number[];
  cold: number[];
  lastDigit: number | null;
  streak: { digit: number; length: number } | null;
  /** 0..1: how far from a uniform distribution */
  concentration: number;
  /** 0..1: inverse of concentration */
  dispersion: number;
  sufficient: boolean;
}

// ─── Sentinel analysis ──────────────────────────────────────────────────────

export type Regime =
  | "BALANCED"
  | "EVEN PRESSURE"
  | "ODD PRESSURE"
  | "DIGIT CONCENTRATION"
  | "DIGIT DISPERSION"
  | "TRANSITION"
  | "ANOMALOUS"
  | "UNKNOWN";

export type CandidateState = "QUALIFIED" | "WATCH" | "CONFLICT" | "WEAK" | "NO QUALIFICATION";

export type Decision =
  | "ANALYSIS READY"
  | "QUALIFIED CONTRACT"
  | "NO QUALIFIED CONTRACT"
  | "ANALYSIS LAG"
  | "FEED STALE"
  | "ENGINE BUSY"
  | "BACKEND DEGRADED"
  | "INSUFFICIENT DATA";

export type Verdict = "supportive" | "neutral" | "opposing" | "unknown";

export interface EvidenceRow {
  label: string;
  verdict: Verdict;
  detail: string;
}

export interface ContractCandidate {
  id: string;
  contractType: ContractType;
  barrier?: number;
  label: string;
  state: CandidateState;
  /** observed win-condition frequency in the primary window (0..1) */
  frequency: number;
  /** theoretical baseline probability (0..1) */
  baseline: number;
  edge: number; // frequency - baseline, primary window
  pressure: Direction;
  momentum: number;
  recency: string;
  threat: "LOW" | "MEDIUM" | "HIGH";
  regimeCompat: Verdict;
  payoutPlaceholder: number; // multiple of stake, prototype
  conflict: "LOW" | "MEDIUM" | "HIGH";
  evidence: EvidenceRow[];
  summary: string;
}

export interface DigitIntel {
  digit: number;
  stat20: DigitStat;
  stat100: DigitStat;
  stat500: DigitStat;
  threat: "LOW" | "MEDIUM" | "HIGH";
  regimeCompat: Verdict;
  matchesSuitability: CandidateState;
  differsSuitability: CandidateState;
  notes: string[];
}

export interface AnalysisSnapshot {
  market: Market;
  timestamp: number;
  analysisVersion: string;
  tickCount: number;
  windowStats: Record<DigitWindow, WindowStats>;
  digitStats: DigitStat[]; // active window
  parityStats: { evenPct: number; oddPct: number; bias: "EVEN" | "ODD" | "NEUTRAL"; strength: number };
  pressure: { direction: Direction; strength: number; label: string };
  momentum: { value: number; label: string };
  psychology: { label: string; detail: string };
  regime: Regime;
  threat: { digits: number[]; level: "LOW" | "MEDIUM" | "HIGH"; detail: string };
  anomaly: { detected: boolean; detail: string };
  marketQuality: { score: number; label: string };
  contractCandidates: ContractCandidate[];
  qualifiedCandidate: ContractCandidate | null;
  decision: Decision;
  reasons: string[];
  conflicts: string[];
  dataIntegrity: { sufficient: boolean; sample: number; required: number; detail: string };
  feedStatus: FeedStatus;
  digitIntel: Record<number, DigitIntel>;
  /** pure prototype disclosure */
  source: "PROTOTYPE" | "DERIV";
}

// ─── Demo scenarios (prototype only) ────────────────────────────────────────

export type DemoScenario = "A" | "B" | "C" | "D" | "E";

export const DEMO_SCENARIOS: { id: DemoScenario; label: string; detail: string }[] = [
  { id: "A", label: "State A · Qualified", detail: "Strong, window-consistent evidence yields a qualified contract." },
  { id: "B", label: "State B · Conflict", detail: "Short and long windows disagree; conflicts are exposed." },
  { id: "C", label: "State C · Insufficient", detail: "Too few ticks to analyse; engine refuses to qualify." },
  { id: "D", label: "State D · Feed stale", detail: "Stream stops; Sentinel flags a stale feed." },
  { id: "E", label: "State E · No qualification", detail: "Balanced market; nothing qualifies." },
];
