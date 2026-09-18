/**
 * 0–9 digit engine. Pure functions over the authoritative tick history.
 * Prototype and live share this code — only the ticks change.
 */
import type { DigitStat, DigitWindow, Direction, Tick, WindowStats } from "../types";
import type { DigitAnalysisService } from "../services/interfaces";

export const MIN_SAMPLE = 20;

function counts(ticks: Tick[]) {
  const c = Array(10).fill(0) as number[];
  for (const t of ticks) c[t.lastDigit]++;
  return c;
}

function dir(delta: number, threshold: number): Direction {
  if (delta > threshold) return "up";
  if (delta < -threshold) return "down";
  return "flat";
}

export function computeWindow(all: Tick[], window: DigitWindow): WindowStats {
  const sample = all.slice(-window);
  const n = sample.length;
  const prev = all.slice(-(window * 2), -window);
  const shortN = Math.min(20, n);
  const short = sample.slice(-shortN);

  const c = counts(sample);
  const cPrev = counts(prev);
  const cShort = counts(short);

  const last = sample.length ? sample[sample.length - 1].lastDigit : null;
  let streakLen = 0;
  if (last !== null) {
    for (let i = sample.length - 1; i >= 0 && sample[i].lastDigit === last; i--) streakLen++;
  }

  const digits: DigitStat[] = [];
  for (let d = 0; d < 10; d++) {
    const pct = n ? c[d] / n : 0;
    const pctPrev = prev.length ? cPrev[d] / prev.length : pct;
    const pctShort = shortN ? cShort[d] / shortN : pct;
    let lastSeen = -1;
    const recent: number[] = [];
    for (let i = sample.length - 1; i >= 0 && recent.length < 8; i--) {
      if (sample[i].lastDigit === d) {
        const ago = sample.length - 1 - i;
        if (lastSeen < 0) lastSeen = ago;
        recent.push(ago);
      }
    }
    digits.push({
      digit: d,
      count: c[d],
      pct,
      trend: dir(pct - pctPrev, 0.015),
      lastSeen,
      run: last === d ? streakLen : 0,
      pressure: dir(pctShort - pct, 0.025),
      momentum: (pctShort - pct) * 100,
      status: "NEUTRAL",
      recent,
    });
  }

  const sorted = [...digits].sort((a, b) => b.pct - a.pct);
  const hot = sorted
    .filter((d) => d.pct >= 0.115)
    .slice(0, 2)
    .map((d) => d.digit);
  const cold = [...sorted]
    .reverse()
    .filter((d) => d.pct <= 0.085)
    .slice(0, 2)
    .map((d) => d.digit);
  for (const d of digits) {
    if (hot.includes(d.digit)) d.status = "HOT";
    else if (cold.includes(d.digit)) d.status = "COLD";
    else if (d.lastSeen >= 0 && d.lastSeen <= 1) d.status = "RECENT";
  }

  const even = n ? sample.filter((t) => t.lastDigit % 2 === 0).length / n : 0;
  const deviation = digits.reduce((a, d) => a + Math.abs(d.pct - 0.1), 0);
  const concentration = Math.min(1, deviation / 1.8);

  return {
    window,
    sample: n,
    digits,
    evenPct: even,
    oddPct: n ? 1 - even : 0,
    hot,
    cold,
    lastDigit: last,
    streak: last === null ? null : { digit: last, length: streakLen },
    concentration,
    dispersion: 1 - concentration,
    sufficient: n >= MIN_SAMPLE,
  };
}

export const digitAnalysisService: DigitAnalysisService = { computeWindow };
