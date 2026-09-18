/**
 * PROTOTYPE DATA — deterministic mock market data service.
 *
 * Replaces later with a Deriv WebSocket implementation of
 * MarketDataService (active_symbols / ticks_history / ticks).
 *
 * The demo scenario only shapes the generated last-digit distribution and
 * feed behaviour so the UI can be exercised in every state.
 */
import type { DemoScenario, FeedStatus, Market, Tick } from "../../types";
import type { MarketDataService, Unsubscribe } from "../interfaces";
import { createRng, hashString } from "../../lib/util";
import { MOCK_MARKETS, MOCK_PRICE_MODEL } from "./catalogue";

const HISTORY_DEPTH = 1000;

type Weights = number[]; // 10 weights

function uniform(): Weights {
  return Array(10).fill(1);
}

/** Scenario A picks a per-symbol "story" so different markets qualify different contracts. */
function scenarioAWeights(symbol: string): Weights {
  const v = hashString(symbol) % 4;
  const w = uniform();
  if (v === 0) [0, 1, 2].forEach((d) => (w[d] = 1.75)); // UNDER 3
  if (v === 1) [7, 8, 9].forEach((d) => (w[d] = 1.75)); // OVER 6
  if (v === 2) [0, 2, 4, 6, 8].forEach((d) => (w[d] = 1.45)); // EVEN
  if (v === 3) {
    const cold = (hashString(symbol + "c") % 10) as number;
    w[cold] = 0.25; // DIFFERS cold
  }
  return w;
}

function weightsFor(scenario: DemoScenario, symbol: string, indexFromEnd: number): Weights {
  const w = uniform();
  switch (scenario) {
    case "A":
      return scenarioAWeights(symbol);
    case "B": {
      // long history loaded odd, most recent 80 ticks flip to even
      const even = [0, 2, 4, 6, 8];
      const odd = [1, 3, 5, 7, 9];
      if (indexFromEnd < 80) even.forEach((d) => (w[d] = 1.6));
      else odd.forEach((d) => (w[d] = 1.45));
      return w;
    }
    case "D":
    case "E":
    case "C":
    default: {
      // gentle per-symbol colour so markets are not identical
      const hot = hashString(symbol + "h") % 10;
      w[hot] = 1.12;
      return w;
    }
  }
}

function sampleDigit(rng: () => number, w: Weights) {
  const total = w.reduce((a, b) => a + b, 0);
  let r = rng() * total;
  for (let d = 0; d < 10; d++) {
    r -= w[d];
    if (r <= 0) return d;
  }
  return 9;
}

function withLastDigit(quote: number, decimals: number, digit: number) {
  const unit = Math.pow(10, -decimals);
  const scaled = Math.round(quote / unit);
  const current = ((scaled % 10) + 10) % 10;
  return (scaled - current + digit) * unit;
}

interface Stream {
  market: Market;
  rng: () => number;
  last: number;
  ticks: Tick[];
}

class MockMarketDataService implements MarketDataService {
  private scenario: DemoScenario = "A";
  private streams = new Map<string, Stream>();
  private listeners = new Map<string, Set<(t: Tick) => void>>();
  private timers = new Map<string, ReturnType<typeof setInterval>>();

  /** Prototype control — not part of the live interface. */
  setScenario(s: DemoScenario) {
    if (s === this.scenario) return;
    this.scenario = s;
    this.streams.clear();
  }
  getScenario() {
    return this.scenario;
  }

  private stream(symbol: string): Stream {
    const key = `${symbol}:${this.scenario}`;
    let s = this.streams.get(key);
    if (s) return s;
    const market = MOCK_MARKETS.find((m) => m.underlying_symbol === symbol)!;
    const model = MOCK_PRICE_MODEL[symbol];
    const rng = createRng(hashString(key));
    const depth = this.scenario === "C" ? 14 : HISTORY_DEPTH;
    const now = Date.now();
    const ticks: Tick[] = [];
    let price = model.base;
    for (let i = 0; i < depth; i++) {
      const fromEnd = depth - 1 - i;
      price = this.step(price, model.vol, rng, market);
      const digit = sampleDigit(rng, weightsFor(this.scenario, symbol, fromEnd));
      price = withLastDigit(price, market.pip_decimals, digit);
      ticks.push({
        underlying_symbol: symbol,
        epoch: now - fromEnd * market.tick_interval_seconds * 1000,
        quote: Number(price.toFixed(market.pip_decimals)),
        lastDigit: digit,
      });
    }
    s = { market, rng, last: price, ticks };
    this.streams.set(key, s);
    return s;
  }

  private step(price: number, vol: number, rng: () => number, market: Market) {
    const gauss = (rng() + rng() + rng() + rng() - 2) * 1.2;
    let next = price * (1 + gauss * vol);
    if (market.category === "crash_boom") {
      const boom = market.underlying_symbol.startsWith("BOOM");
      const drift = boom ? -0.35 : 0.35;
      next = price * (1 + (gauss * 0.3 + drift) * vol);
      const spikeP = market.underlying_symbol.endsWith("500") ? 1 / 500 : 1 / 1000;
      if (rng() < spikeP * 6) next = price * (1 + (boom ? 1 : -1) * vol * 60);
    }
    if (market.category === "jump" && rng() < 0.02) next = price * (1 + gauss * vol * 6);
    if (market.category === "step") next = price + (rng() < 0.5 ? -0.1 : 0.1);
    return next;
  }

  private nextTick(s: Stream): Tick {
    const { market } = s;
    let price = this.step(s.last, MOCK_PRICE_MODEL[market.underlying_symbol].vol, s.rng, market);
    const digit = sampleDigit(s.rng, weightsFor(this.scenario, market.underlying_symbol, 0));
    price = withLastDigit(price, market.pip_decimals, digit);
    s.last = price;
    const tick: Tick = {
      underlying_symbol: market.underlying_symbol,
      epoch: Date.now(),
      quote: Number(price.toFixed(market.pip_decimals)),
      lastDigit: digit,
    };
    s.ticks.push(tick);
    if (s.ticks.length > HISTORY_DEPTH + 200) s.ticks.splice(0, s.ticks.length - HISTORY_DEPTH);
    return tick;
  }

  async listMarkets(): Promise<Market[]> {
    return MOCK_MARKETS;
  }

  async getTicksHistory(symbol: string, count: number): Promise<Tick[]> {
    const s = this.stream(symbol);
    return s.ticks.slice(-count);
  }

  subscribeTicks(symbol: string, onTick: (t: Tick) => void, onStatus: (s: FeedStatus) => void): Unsubscribe {
    const s = this.stream(symbol);
    const scenario = this.scenario;
    onStatus("CONNECTING");
    let emitted = 0;
    const set = this.listeners.get(symbol) ?? new Set();
    set.add(onTick);
    this.listeners.set(symbol, set);

    const start = setTimeout(() => onStatus(scenario === "D" ? "LAGGING" : "LIVE"), 350);
    const interval = setInterval(() => {
      if (scenario === "D" && emitted >= 3) {
        onStatus("STALE");
        return;
      }
      if (scenario === "C" && emitted >= 4) {
        onStatus("DEGRADED");
        return;
      }
      emitted++;
      const tick = this.nextTick(s);
      set.forEach((fn) => fn(tick));
    }, s.market.tick_interval_seconds * 1000);
    this.timers.set(symbol, interval);

    return () => {
      clearTimeout(start);
      clearInterval(interval);
      set.delete(onTick);
    };
  }

  /** Last quote for background tabs (no extra subscription is opened). */
  peekQuote(symbol: string) {
    const s = this.stream(symbol);
    return s.ticks[s.ticks.length - 1];
  }
}

export const mockMarketDataService = new MockMarketDataService();
