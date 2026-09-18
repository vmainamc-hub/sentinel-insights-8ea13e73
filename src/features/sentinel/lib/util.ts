/** Deterministic PRNG (mulberry32) so prototype data is reproducible. */
export function createRng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashString(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function lastDigitOf(quote: number, decimals: number) {
  return Number(quote.toFixed(decimals).slice(-1));
}

export function fmtQuote(q: number, decimals: number) {
  return q.toFixed(decimals);
}

export function fmtPct(v: number, digits = 1) {
  return `${(v * 100).toFixed(digits)}%`;
}

export function fmtSigned(v: number, digits = 1) {
  return `${v > 0 ? "+" : ""}${v.toFixed(digits)}`;
}

export function fmtMoney(v: number, currency = "USD") {
  return `${v < 0 ? "-" : ""}${Math.abs(v).toFixed(2)} ${currency}`;
}

export function fmtTime(ms: number) {
  const d = new Date(ms);
  return d.toISOString().slice(11, 19);
}

export function clamp(v: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, v));
}

export function agoLabel(ticks: number) {
  if (ticks < 0) return "never";
  if (ticks === 0) return "now";
  return `${ticks} tick${ticks === 1 ? "" : "s"} ago`;
}
