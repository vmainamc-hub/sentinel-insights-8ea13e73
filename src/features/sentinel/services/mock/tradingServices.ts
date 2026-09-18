/**
 * PROTOTYPE DATA — mock contract / proposal / trade / open-contract / account services.
 *
 * NOTHING here touches a real account. `buy()` creates a clearly-labelled
 * prototype contract that settles against the prototype tick stream so the
 * post-trade UI can be exercised. The live phase swaps these for Deriv
 * `proposal`, `buy`, `proposal_open_contract`, `sell`, `portfolio`, `balance`.
 */
import type {
  Account,
  ContractAvailability,
  ContractConfig,
  Market,
  OpenContract,
  Proposal,
  Tick,
  TradeRecord,
} from "../../types";
import type {
  AccountService,
  ContractService,
  OpenContractService,
  ProposalService,
  TradeService,
  Unsubscribe,
} from "../interfaces";
import { payoutMultiple } from "../../engine/analysis";
import { MOCK_MARKETS, mockContractsFor } from "./catalogue";

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const mockContractService: ContractService = {
  async getAvailableContracts(symbol) {
    const m = MOCK_MARKETS.find((x) => x.underlying_symbol === symbol);
    return m ? mockContractsFor(m) : [];
  },
};

export function contractLabel(
  contractTypeOrConfig: ContractType | Pick<ContractConfig, "contractType" | "barrier">,
  barrierArg?: number,
): string {
  let contractType: ContractType;
  let barrier: number | undefined;

  if (typeof contractTypeOrConfig === "object" && contractTypeOrConfig !== null) {
    contractType = contractTypeOrConfig.contractType;
    barrier = contractTypeOrConfig.barrier;
  } else {
    contractType = contractTypeOrConfig;
    barrier = barrierArg;
  }

  const names: Record<string, string> = {
    DIGITEVEN: "EVEN",
    DIGITODD: "ODD",
    DIGITMATCH: "MATCHES",
    DIGITDIFF: "DIFFERS",
    DIGITOVER: "OVER",
    DIGITUNDER: "UNDER",
    RISE: "RISE",
    FALL: "FALL",
    HIGHER: "HIGHER",
    LOWER: "LOWER",
    ONETOUCH: "TOUCH",
    NOTOUCH: "NO TOUCH",
  };
  const base = names[contractType] ?? contractType ?? "CONTRACT";
  if (["DIGITMATCH", "DIGITDIFF", "DIGITOVER", "DIGITUNDER"].includes(contractType)) {
    return `${base} ${barrier ?? "?"}`;
  }
  if (["HIGHER", "LOWER", "ONETOUCH", "NOTOUCH"].includes(contractType)) {
    return `${base} ${barrier !== undefined ? (barrier >= 0 ? "+" : "") + barrier : ""}`.trim();
  }
  return base;
}

let proposalSeq = 0;
export const mockProposalService: ProposalService = {
  async getProposal(symbol, config, spot) {
    await wait(220);
    const available: ContractAvailability[] =
      await mockContractService.getAvailableContracts(symbol);
    const def = available.find((a) => a.contractType === config.contractType);
    const id = `proto-prop-${++proposalSeq}`;
    if (!def)
      return {
        id,
        status: "UNAVAILABLE",
        source: "PROTOTYPE",
        config,
        askPrice: 0,
        payout: 0,
        potentialProfit: 0,
        spot,
        message: "Contract not offered on this market.",
        createdAt: Date.now(),
      };
    if (
      def.barrier === "digit" &&
      (config.barrier === undefined || config.barrier < 0 || config.barrier > 9)
    )
      return {
        id,
        status: "ERROR",
        source: "PROTOTYPE",
        config,
        askPrice: 0,
        payout: 0,
        potentialProfit: 0,
        spot,
        message: "Select a digit.",
        createdAt: Date.now(),
      };
    if (config.contractType === "DIGITOVER" && config.barrier === 9)
      return {
        id,
        status: "UNAVAILABLE",
        source: "PROTOTYPE",
        config,
        askPrice: 0,
        payout: 0,
        potentialProfit: 0,
        spot,
        message: "Over 9 cannot win.",
        createdAt: Date.now(),
      };
    if (config.contractType === "DIGITUNDER" && config.barrier === 0)
      return {
        id,
        status: "UNAVAILABLE",
        source: "PROTOTYPE",
        config,
        askPrice: 0,
        payout: 0,
        potentialProfit: 0,
        spot,
        message: "Under 0 cannot win.",
        createdAt: Date.now(),
      };
    if (!(config.stake > 0))
      return {
        id,
        status: "ERROR",
        source: "PROTOTYPE",
        config,
        askPrice: 0,
        payout: 0,
        potentialProfit: 0,
        spot,
        message: "Stake must be positive.",
        createdAt: Date.now(),
      };
    const mult = payoutMultiple(config.contractType, config.barrier);
    const payout = Number((config.stake * mult).toFixed(2));
    return {
      id,
      status: "READY",
      source: "PROTOTYPE",
      config,
      askPrice: config.stake,
      payout,
      potentialProfit: Number((payout - config.stake).toFixed(2)),
      spot,
      createdAt: Date.now(),
    };
  },
};

// ─── Open contracts + trades (single in-memory store) ───────────────────────

type Listener = (c: OpenContract[]) => void;

class MockPortfolio implements TradeService, OpenContractService {
  private open: OpenContract[] = [];
  private history: TradeRecord[] = seedHistory();
  private listeners = new Set<Listener>();
  private seq = 1000;
  private configs = new Map<string, ContractConfig>();
  private touched = new Map<string, boolean>();

  private emit() {
    const snapshot = [...this.open];
    this.listeners.forEach((l) => l(snapshot));
  }

  async buy(symbol: string, proposal: Proposal, market: Market): Promise<OpenContract> {
    await wait(300);
    if (proposal.status !== "READY") throw new Error("Proposal is not ready.");
    const cfg = proposal.config;
    const ticks =
      cfg.durationUnit === "t"
        ? cfg.duration
        : Math.max(5, Math.round(cfg.duration / market.tick_interval_seconds));
    const id = `PROTO-${++this.seq}`;
    const oc: OpenContract = {
      contractId: id,
      underlying_symbol: symbol,
      marketName: market.display_name,
      contractType: cfg.contractType,
      barrier: cfg.barrier,
      label: contractLabel(cfg),
      entrySpot: proposal.spot,
      currentSpot: proposal.spot,
      buyPrice: proposal.askPrice,
      currentValue: proposal.askPrice,
      profit: 0,
      status: "OPEN",
      ticksTotal: ticks,
      ticksElapsed: 0,
      purchaseTime: Date.now(),
      expiryTime: Date.now() + ticks * market.tick_interval_seconds * 1000,
      isSellable:
        cfg.contractType === "RISE" ||
        cfg.contractType === "FALL" ||
        cfg.contractType === "HIGHER" ||
        cfg.contractType === "LOWER",
      source: "PROTOTYPE",
    };
    this.configs.set(id, cfg);
    this.open.unshift(oc);
    this.emit();
    return oc;
  }

  async sell(contractId: string): Promise<TradeRecord> {
    await wait(200);
    const oc = this.open.find((c) => c.contractId === contractId);
    if (!oc) throw new Error("Contract not open.");
    return this.close(oc, "SOLD", oc.currentValue);
  }

  private close(oc: OpenContract, status: TradeRecord["status"], value: number) {
    this.open = this.open.filter((c) => c.contractId !== oc.contractId);
    const profit = Number((value - oc.buyPrice).toFixed(2));
    const rec: TradeRecord = {
      id: oc.contractId,
      time: Date.now(),
      underlying_symbol: oc.underlying_symbol,
      marketName: oc.marketName,
      label: oc.label,
      contractType: oc.contractType,
      entrySpot: oc.entrySpot,
      exitSpot: oc.currentSpot,
      stake: oc.buyPrice,
      profit,
      durationLabel: `${oc.ticksElapsed}/${oc.ticksTotal}t`,
      status,
      source: "PROTOTYPE",
    };
    this.history.unshift(rec);
    this.emit();
    return rec;
  }

  /** Fed by the ONE authoritative stream — no separate subscription per contract. */
  onTick(tick: Tick, market: Market) {
    let changed = false;
    for (const oc of [...this.open]) {
      if (oc.underlying_symbol !== tick.underlying_symbol) continue;
      changed = true;
      oc.ticksElapsed += 1;
      oc.currentSpot = tick.quote;
      const cfg = this.configs.get(oc.contractId)!;
      const payout = Number(
        (oc.buyPrice * payoutMultiple(cfg.contractType, cfg.barrier)).toFixed(2),
      );
      const barrierPrice =
        oc.entrySpot + (cfg.barrier ?? 0) * Math.pow(10, -market.pip_decimals) * 10;
      if (cfg.contractType === "ONETOUCH" || cfg.contractType === "NOTOUCH") {
        const hit = cfg.barrier! >= 0 ? tick.quote >= barrierPrice : tick.quote <= barrierPrice;
        if (hit) this.touched.set(oc.contractId, true);
      }
      const winning = (() => {
        const d = tick.lastDigit;
        const b = cfg.barrier ?? 0;
        switch (cfg.contractType) {
          case "DIGITEVEN":
            return d % 2 === 0;
          case "DIGITODD":
            return d % 2 === 1;
          case "DIGITMATCH":
            return d === b;
          case "DIGITDIFF":
            return d !== b;
          case "DIGITOVER":
            return d > b;
          case "DIGITUNDER":
            return d < b;
          case "RISE":
            return tick.quote > oc.entrySpot;
          case "FALL":
            return tick.quote < oc.entrySpot;
          case "HIGHER":
            return tick.quote > barrierPrice;
          case "LOWER":
            return tick.quote < barrierPrice;
          case "ONETOUCH":
            return !!this.touched.get(oc.contractId);
          case "NOTOUCH":
            return !this.touched.get(oc.contractId);
        }
      })();
      // indicative mark-to-market for the prototype
      const progress = oc.ticksElapsed / oc.ticksTotal;
      oc.currentValue = Number(
        (oc.isSellable
          ? oc.buyPrice * (winning ? 1 + progress * 0.6 : 1 - progress * 0.7)
          : winning
            ? payout * (0.4 + 0.6 * progress)
            : oc.buyPrice * (1 - progress)
        ).toFixed(2),
      );
      oc.profit = Number((oc.currentValue - oc.buyPrice).toFixed(2));
      if (cfg.contractType === "ONETOUCH" && winning) {
        this.close(oc, "WON", payout);
        continue;
      }
      if (oc.ticksElapsed >= oc.ticksTotal) {
        this.close(oc, winning ? "WON" : "LOST", winning ? payout : 0);
      }
    }
    if (changed) this.emit();
  }

  subscribeOpenContracts(onUpdate: Listener): Unsubscribe {
    this.listeners.add(onUpdate);
    onUpdate([...this.open]);
    return () => this.listeners.delete(onUpdate);
  }

  async getHistory() {
    return [...this.history];
  }
}

function seedHistory(): TradeRecord[] {
  const now = Date.now();
  const rows: [
    number,
    string,
    string,
    string,
    number,
    number,
    number,
    number,
    TradeRecord["status"],
  ][] = [
    [4, "1HZ10V", "Volatility 10 (1s) Index", "UNDER 3", 9016.44, 9016.52, 10, 9.51, "WON"],
    [11, "R_25", "Volatility 25 Index", "DIFFERS 7", 2583.204, 2583.191, 25, 1.35, "WON"],
    [19, "R_10", "Volatility 10 Index", "EVEN", 6312.417, 6312.4, 10, -10, "LOST"],
    [27, "JD25", "Jump 25 Index", "RISE", 2098.06, 2098.31, 15, 6.2, "SOLD"],
    [41, "1HZ100V", "Volatility 100 (1s) Index", "OVER 2", 780.16, 780.21, 20, 6.94, "WON"],
    [58, "R_75", "Volatility 75 Index", "MATCHES 5", 91644.1123, 91644.0011, 5, -5, "LOST"],
    [73, "1HZ50V", "Volatility 50 (1s) Index", "ODD", 341.85, 341.89, 10, -10, "LOST"],
    [95, "R_100", "Volatility 100 Index", "UNDER 6", 1438.12, 1438.44, 30, 17.92, "WON"],
  ];
  return rows.map(([min, sym, name, label, entry, exit, stake, profit, status], i) => ({
    id: `PROTO-H${i}`,
    time: now - min * 60_000,
    underlying_symbol: sym,
    marketName: name,
    label,
    contractType: label.startsWith("UNDER")
      ? "DIGITUNDER"
      : label.startsWith("OVER")
        ? "DIGITOVER"
        : label.startsWith("DIFFERS")
          ? "DIGITDIFF"
          : label.startsWith("MATCHES")
            ? "DIGITMATCH"
            : label === "EVEN"
              ? "DIGITEVEN"
              : label === "ODD"
                ? "DIGITODD"
                : "RISE",
    entrySpot: entry,
    exitSpot: exit,
    stake,
    profit,
    durationLabel: status === "SOLD" ? "3/5t" : "5/5t",
    status,
    source: "PROTOTYPE",
  }));
}

export const mockPortfolio = new MockPortfolio();

export const mockAccountService: AccountService = {
  async getAccount(): Promise<Account> {
    return {
      loginid: "NOT CONNECTED",
      currency: "USD",
      balance: null,
      kind: "PROTOTYPE",
      label: "Prototype · no account linked",
    };
  },
};
