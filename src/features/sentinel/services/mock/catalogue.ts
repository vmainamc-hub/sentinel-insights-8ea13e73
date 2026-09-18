/**
 * PROTOTYPE DATA — mock `active_symbols` and `contracts_for` catalogue.
 * The live layer discovers markets dynamically; nothing here is final.
 */
import type { ContractAvailability, ContractType, Market, MarketCategory } from "../../types";

interface Row {
  s: string;
  n: string;
  cat: MarketCategory;
  sub: string;
  dec: number;
  base: number;
  vol: number; // per-tick relative volatility
  iv?: number; // tick interval seconds
  open?: boolean;
}

const rows: Row[] = [
  { s: "R_10", n: "Volatility 10 Index", cat: "volatility", sub: "Continuous Indices", dec: 3, base: 6312.417, vol: 0.00012 },
  { s: "R_25", n: "Volatility 25 Index", cat: "volatility", sub: "Continuous Indices", dec: 3, base: 2583.204, vol: 0.0003 },
  { s: "R_50", n: "Volatility 50 Index", cat: "volatility", sub: "Continuous Indices", dec: 4, base: 198.6412, vol: 0.0006 },
  { s: "R_75", n: "Volatility 75 Index", cat: "volatility", sub: "Continuous Indices", dec: 4, base: 91644.1123, vol: 0.0009 },
  { s: "R_100", n: "Volatility 100 Index", cat: "volatility", sub: "Continuous Indices", dec: 2, base: 1438.12, vol: 0.0012 },
  { s: "1HZ10V", n: "Volatility 10 (1s) Index", cat: "volatility_1s", sub: "Continuous Indices", dec: 2, base: 9016.44, vol: 0.00012, iv: 1 },
  { s: "1HZ25V", n: "Volatility 25 (1s) Index", cat: "volatility_1s", sub: "Continuous Indices", dec: 2, base: 668207.31, vol: 0.0003, iv: 1 },
  { s: "1HZ50V", n: "Volatility 50 (1s) Index", cat: "volatility_1s", sub: "Continuous Indices", dec: 2, base: 341.85, vol: 0.0006, iv: 1 },
  { s: "1HZ75V", n: "Volatility 75 (1s) Index", cat: "volatility_1s", sub: "Continuous Indices", dec: 2, base: 5742.9, vol: 0.0009, iv: 1 },
  { s: "1HZ100V", n: "Volatility 100 (1s) Index", cat: "volatility_1s", sub: "Continuous Indices", dec: 2, base: 780.16, vol: 0.0012, iv: 1 },
  { s: "BOOM500", n: "Boom 500 Index", cat: "crash_boom", sub: "Crash/Boom Indices", dec: 4, base: 7129.3312, vol: 0.00008, iv: 1 },
  { s: "BOOM1000", n: "Boom 1000 Index", cat: "crash_boom", sub: "Crash/Boom Indices", dec: 4, base: 15220.1187, vol: 0.00006, iv: 1 },
  { s: "CRASH500", n: "Crash 500 Index", cat: "crash_boom", sub: "Crash/Boom Indices", dec: 4, base: 5104.9021, vol: 0.00008, iv: 1 },
  { s: "CRASH1000", n: "Crash 1000 Index", cat: "crash_boom", sub: "Crash/Boom Indices", dec: 4, base: 9871.7754, vol: 0.00006, iv: 1 },
  { s: "JD10", n: "Jump 10 Index", cat: "jump", sub: "Jump Indices", dec: 2, base: 1219.44, vol: 0.0003, iv: 1 },
  { s: "JD25", n: "Jump 25 Index", cat: "jump", sub: "Jump Indices", dec: 2, base: 2098.06, vol: 0.0006, iv: 1 },
  { s: "JD50", n: "Jump 50 Index", cat: "jump", sub: "Jump Indices", dec: 2, base: 3551.7, vol: 0.001, iv: 1 },
  { s: "stpRNG", n: "Step Index", cat: "step", sub: "Step Indices", dec: 1, base: 8814.3, vol: 0.00002 },
  { s: "RB100", n: "Range Break 100 Index", cat: "range_break", sub: "Range Break Indices", dec: 3, base: 1101.219, vol: 0.0002 },
  { s: "RB200", n: "Range Break 200 Index", cat: "range_break", sub: "Range Break Indices", dec: 3, base: 1003.907, vol: 0.0002 },
  { s: "frxEURUSD", n: "EUR/USD", cat: "other", sub: "Major Pairs", dec: 5, base: 1.08412, vol: 0.00003, open: true },
  { s: "frxXAUUSD", n: "Gold/USD", cat: "other", sub: "Metals", dec: 2, base: 2361.44, vol: 0.00006, open: false },
];

const marketMeta: Record<MarketCategory, { market: string; marketName: string }> = {
  volatility: { market: "synthetic_index", marketName: "Derived" },
  volatility_1s: { market: "synthetic_index", marketName: "Derived" },
  crash_boom: { market: "synthetic_index", marketName: "Derived" },
  jump: { market: "synthetic_index", marketName: "Derived" },
  step: { market: "synthetic_index", marketName: "Derived" },
  range_break: { market: "synthetic_index", marketName: "Derived" },
  other_synthetic: { market: "synthetic_index", marketName: "Derived" },
  other: { market: "forex", marketName: "Forex" },
};

export const CATEGORY_LABEL: Record<MarketCategory, string> = {
  volatility: "Volatility",
  volatility_1s: "Volatility 1s",
  crash_boom: "Crash/Boom",
  jump: "Jump",
  step: "Step",
  range_break: "Range Break",
  other_synthetic: "Other Derived",
  other: "Other markets",
};

export const MOCK_MARKETS: Market[] = rows.map((r) => ({
  underlying_symbol: r.s,
  display_name: r.n,
  market: marketMeta[r.cat].market,
  market_display_name: marketMeta[r.cat].marketName,
  submarket: r.sub.toLowerCase().replace(/\W+/g, "_"),
  submarket_display_name: r.sub,
  category: r.cat,
  pip_decimals: r.dec,
  exchange_is_open: r.open ?? true,
  tick_interval_seconds: r.iv ?? 2,
}));

export const MOCK_PRICE_MODEL: Record<string, { base: number; vol: number }> = Object.fromEntries(
  rows.map((r) => [r.s, { base: r.base, vol: r.vol }]),
);

// ─── contracts_for (mock) ───────────────────────────────────────────────────

const TICKS: ContractAvailability["durations"] = [{ unit: "t", min: 1, max: 10 }];
const TIME: ContractAvailability["durations"] = [
  { unit: "t", min: 1, max: 10 },
  { unit: "s", min: 15, max: 3600 },
  { unit: "m", min: 1, max: 1440 },
];

const DEF: Record<ContractType, Omit<ContractAvailability, "durations">> = {
  DIGITEVEN: { contractType: "DIGITEVEN", family: "digits", derivContractType: "DIGITEVEN", label: "Even", barrier: "none" },
  DIGITODD: { contractType: "DIGITODD", family: "digits", derivContractType: "DIGITODD", label: "Odd", barrier: "none" },
  DIGITMATCH: { contractType: "DIGITMATCH", family: "digits", derivContractType: "DIGITMATCH", label: "Matches", barrier: "digit" },
  DIGITDIFF: { contractType: "DIGITDIFF", family: "digits", derivContractType: "DIGITDIFF", label: "Differs", barrier: "digit" },
  DIGITOVER: { contractType: "DIGITOVER", family: "digits", derivContractType: "DIGITOVER", label: "Over", barrier: "digit" },
  DIGITUNDER: { contractType: "DIGITUNDER", family: "digits", derivContractType: "DIGITUNDER", label: "Under", barrier: "digit" },
  RISE: { contractType: "RISE", family: "direction", derivContractType: "CALL", label: "Rise", barrier: "none" },
  FALL: { contractType: "FALL", family: "direction", derivContractType: "PUT", label: "Fall", barrier: "none" },
  HIGHER: { contractType: "HIGHER", family: "direction", derivContractType: "CALL", label: "Higher", barrier: "price" },
  LOWER: { contractType: "LOWER", family: "direction", derivContractType: "PUT", label: "Lower", barrier: "price" },
  ONETOUCH: { contractType: "ONETOUCH", family: "barrier", derivContractType: "ONETOUCH", label: "Touch", barrier: "price" },
  NOTOUCH: { contractType: "NOTOUCH", family: "barrier", derivContractType: "NOTOUCH", label: "No Touch", barrier: "price" },
};

const DIGITS: ContractType[] = ["DIGITEVEN", "DIGITODD", "DIGITMATCH", "DIGITDIFF", "DIGITOVER", "DIGITUNDER"];
const RISE_FALL: ContractType[] = ["RISE", "FALL"];
const HIGH_LOW: ContractType[] = ["HIGHER", "LOWER"];
const TOUCH: ContractType[] = ["ONETOUCH", "NOTOUCH"];

const AVAILABILITY: Record<MarketCategory, ContractType[]> = {
  volatility: [...DIGITS, ...RISE_FALL, ...HIGH_LOW, ...TOUCH],
  volatility_1s: [...DIGITS, ...RISE_FALL, ...HIGH_LOW, ...TOUCH],
  jump: [...DIGITS, ...RISE_FALL, ...HIGH_LOW, ...TOUCH],
  crash_boom: [...RISE_FALL],
  step: [...RISE_FALL, ...HIGH_LOW, ...TOUCH],
  range_break: [...RISE_FALL, ...HIGH_LOW],
  other_synthetic: [...DIGITS, ...RISE_FALL],
  other: [...RISE_FALL, ...HIGH_LOW, ...TOUCH],
};

export function mockContractsFor(market: Market): ContractAvailability[] {
  return AVAILABILITY[market.category].map((ct) => ({
    ...DEF[ct],
    durations: DEF[ct].family === "digits" ? TICKS : TIME,
  }));
}

export const CONTRACT_LABEL = (ct: ContractType) => DEF[ct].label;
