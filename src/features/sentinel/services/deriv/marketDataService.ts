/**
 * LIVE DERIV MARKET DATA — active_symbols / ticks_history / ticks.
 *
 * This is the ONE authoritative market stream. Nothing else in the app opens a
 * tick subscription; every widget derives from the history published here.
 */
import type { FeedStatus, Market, MarketCategory, Tick } from "../../types";
import type { MarketDataService, Unsubscribe } from "../interfaces";
import { derivSocket } from "./socket";

const HISTORY_DEPTH = 1000;

function decimalsFromPip(pip: unknown): number {
  const p = Number(pip);
  if (!Number.isFinite(p) || p <= 0) return 2;
  return Math.max(0, Math.round(-Math.log10(p)));
}

function categorise(symbol: string, submarket: string, market: string): MarketCategory {
  if (/^1HZ\d+V$/.test(symbol)) return "volatility_1s";
  if (/^R_\d+$/.test(symbol)) return "volatility";
  if (/^(BOOM|CRASH)/i.test(symbol) || submarket.includes("crash")) return "crash_boom";
  if (/^JD/i.test(symbol) || submarket.includes("jump")) return "jump";
  if (/step/i.test(symbol) || submarket.includes("step")) return "step";
  if (/^RB/i.test(symbol) || submarket.includes("range")) return "range_break";
  if (market === "synthetic_index") return "other_synthetic";
  return "other";
}

function intervalFor(symbol: string, category: MarketCategory): number {
  if (category === "volatility_1s") return 1;
  if (/^(BOOM|CRASH|JD)/i.test(symbol)) return 1;
  return 2;
}

export function lastDigitFromQuote(quote: number, decimals: number): number {
  const fixed = Math.abs(quote).toFixed(Math.max(0, decimals));
  const ch = fixed.charAt(fixed.length - 1);
  const d = Number(ch);
  return Number.isFinite(d) ? d : 0;
}

interface ActiveSymbolRow {
  symbol?: string;
  underlying_symbol?: string;
  display_name?: string;
  market?: string;
  market_display_name?: string;
  submarket?: string;
  submarket_display_name?: string;
  pip?: number;
  pip_size?: number;
  exchange_is_open?: number | boolean;
}

class DerivMarketDataService implements MarketDataService {
  private markets: Market[] = [];
  private marketsPromise: Promise<Market[]> | null = null;
  private lastQuote = new Map<string, number>();

  private market(symbol: string): Market | undefined {
    return this.markets.find((m) => m.underlying_symbol === symbol);
  }

  async listMarkets(): Promise<Market[]> {
    if (this.markets.length) return this.markets;
    if (!this.marketsPromise) {
      this.marketsPromise = derivSocket
        .send({ active_symbols: "brief", product_type: "basic" })
        .then((res) => {
          const rows = (res["active_symbols"] as ActiveSymbolRow[] | undefined) ?? [];
          const markets = rows
            .map((r) => {
              const symbol = String(r.underlying_symbol ?? r.symbol ?? "");
              const submarket = String(r.submarket ?? "");
              const market = String(r.market ?? "");
              const category = categorise(symbol, submarket.toLowerCase(), market);
              return {
                underlying_symbol: symbol,
                display_name: String(r.display_name ?? symbol),
                market,
                market_display_name: String(r.market_display_name ?? market),
                submarket,
                submarket_display_name: String(r.submarket_display_name ?? submarket),
                category,
                pip_decimals: decimalsFromPip(r.pip ?? r.pip_size),
                exchange_is_open: Boolean(Number(r.exchange_is_open ?? 1)),
                tick_interval_seconds: intervalFor(symbol, category),
              } satisfies Market;
            })
            .filter((m) => m.underlying_symbol);
          this.markets = markets;
          return markets;
        })
        .catch((e) => {
          this.marketsPromise = null;
          throw e;
        });
    }
    return this.marketsPromise;
  }

  async getTicksHistory(symbol: string, count: number): Promise<Tick[]> {
    await this.listMarkets();
    const decimals = this.market(symbol)?.pip_decimals ?? 2;
    const res = await derivSocket.send({
      ticks_history: symbol,
      adjust_start_time: 1,
      count: Math.min(HISTORY_DEPTH, Math.max(1, count)),
      end: "latest",
      style: "ticks",
    });
    const history = res["history"] as { prices?: number[]; times?: number[] } | undefined;
    const prices = history?.prices ?? [];
    const times = history?.times ?? [];
    const ticks = prices.map((p, i) => {
      const quote = Number(p);
      return {
        underlying_symbol: symbol,
        epoch: Number(times[i] ?? 0) * 1000,
        quote,
        lastDigit: lastDigitFromQuote(quote, decimals),
      } satisfies Tick;
    });
    if (ticks.length) this.lastQuote.set(symbol, ticks[ticks.length - 1].quote);
    return ticks;
  }

  subscribeTicks(
    symbol: string,
    onTick: (t: Tick) => void,
    onStatus: (s: FeedStatus) => void,
  ): Unsubscribe {
    onStatus("CONNECTING");
    let closed = false;
    let lastAt = 0;
    const interval = (this.market(symbol)?.tick_interval_seconds ?? 2) * 1000;

    const unsubSocket = derivSocket.onStatus((s) => {
      if (closed) return;
      if (s === "CLOSED") onStatus("DEGRADED");
      else if (s === "CONNECTING" && !lastAt) onStatus("CONNECTING");
    });

    const unsub = derivSocket.subscribe(
      { ticks: symbol },
      (msg) => {
        if (closed) return;
        const t = msg["tick"] as { quote?: number; epoch?: number; pip_size?: number } | undefined;
        const quote = Number(t?.quote);
        if (!Number.isFinite(quote)) return;
        const decimals =
          t?.pip_size !== undefined
            ? Number(t.pip_size)
            : (this.market(symbol)?.pip_decimals ?? 2);
        lastAt = Date.now();
        this.lastQuote.set(symbol, quote);
        onStatus("LIVE");
        onTick({
          underlying_symbol: symbol,
          epoch: Number(t?.epoch ?? Date.now() / 1000) * 1000,
          quote,
          lastDigit: lastDigitFromQuote(quote, decimals),
        });
      },
      () => {
        if (!closed) onStatus("DEGRADED");
      },
    );

    // watchdog: quiet feed → LAGGING, long silence → STALE
    const watchdog = setInterval(() => {
      if (closed || !lastAt) return;
      const quiet = Date.now() - lastAt;
      if (quiet > interval * 8) onStatus("STALE");
      else if (quiet > interval * 3) onStatus("LAGGING");
    }, 1000);

    return () => {
      closed = true;
      clearInterval(watchdog);
      unsubSocket();
      unsub();
    };
  }

  /** Last seen quote for background market tabs — opens no extra subscription. */
  peekQuote(symbol: string): number | undefined {
    return this.lastQuote.get(symbol);
  }
}

export const derivMarketDataService = new DerivMarketDataService();
