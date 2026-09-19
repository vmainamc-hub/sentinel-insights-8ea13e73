/**
 * Cockpit state — ONE authoritative market stream feeding every widget.
 *
 * The provider owns: market catalogue, open tabs, the active tick history,
 * feed status, contract availability, the AnalysisSnapshot, the current
 * contract configuration, proposal, open contracts, history and account.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import type {
  Account,
  AnalysisSnapshot,
  ContractAvailability,
  ContractCandidate,
  ContractConfig,
  ContractType,
  DemoScenario,
  DigitWindow,
  FeedStatus,
  Market,
  OpenContract,
  Proposal,
  Tick,
  TradeRecord,
} from "../types";
import { services, prototypeControls, derivSocket } from "../services";

const DEFAULT_SYMBOL = "1HZ10V";
const DEFAULT_TABS = [
  "1HZ10V",
  "1HZ25V",
  "1HZ50V",
  "1HZ100V",
  "R_10",
  "R_25",
  "R_50",
  "R_100",
  "BOOM500",
];

interface CockpitState {
  markets: Market[];
  market: Market | null;
  tabs: string[];
  activeSymbol: string;
  selectMarket: (symbol: string) => void;
  openTab: (symbol: string) => void;
  closeTab: (symbol: string) => void;
  scenario: DemoScenario;
  setScenario: (s: DemoScenario) => void;

  ticks: Tick[];
  lastTick: Tick | null;
  feedStatus: FeedStatus;
  available: ContractAvailability[];
  snapshot: AnalysisSnapshot | null;
  window: DigitWindow;
  setWindow: (w: DigitWindow) => void;

  selectedDigit: number | null;
  setSelectedDigit: (d: number | null) => void;

  config: ContractConfig;
  updateConfig: (patch: Partial<ContractConfig>) => void;
  selectContractType: (ct: ContractType) => void;
  applyCandidate: (c: Pick<ContractCandidate, "contractType" | "barrier">) => void;

  proposal: Proposal | null;
  proposalLoading: boolean;
  buy: () => Promise<void>;
  buying: boolean;

  openContracts: OpenContract[];
  history: TradeRecord[];
  sell: (id: string) => Promise<void>;
  account: Account | null;

  finderOpen: boolean;
  setFinderOpen: (o: boolean) => void;
  tradeSheetOpen: boolean;
  setTradeSheetOpen: (o: boolean) => void;

  viewMode: "unified" | "dtrader" | "digits";
  setViewMode: (m: "unified" | "dtrader" | "digits") => void;
  authModalOpen: boolean;
  setAuthModalOpen: (o: boolean) => void;
  apiToken: string | null;
  setApiToken: (token: string | null) => Promise<void>;
  latency: number;
}

const Ctx = createContext<CockpitState | null>(null);

export function useCockpit() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useCockpit outside CockpitProvider");
  return v;
}

const defaultConfig: ContractConfig = {
  contractType: "DIGITUNDER",
  barrier: 3,
  duration: 5,
  durationUnit: "t",
  stake: 10,
  currency: "USD",
};

export function CockpitProvider({ children }: { children: ReactNode }) {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [tabs, setTabs] = useState<string[]>(DEFAULT_TABS);
  const [activeSymbol, setActiveSymbol] = useState(DEFAULT_SYMBOL);
  const [scenario, setScenarioState] = useState<DemoScenario>("A");
  const [ticks, setTicks] = useState<Tick[]>([]);
  const [feedStatus, setFeedStatus] = useState<FeedStatus>("CONNECTING");
  const [available, setAvailable] = useState<ContractAvailability[]>([]);
  const [window, setWindow] = useState<DigitWindow>(100);
  const [selectedDigit, setSelectedDigit] = useState<number | null>(null);
  const [config, setConfig] = useState<ContractConfig>(defaultConfig);
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [proposalLoading, setProposalLoading] = useState(false);
  const [buying, setBuying] = useState(false);
  const [openContracts, setOpenContracts] = useState<OpenContract[]>([]);
  const [history, setHistory] = useState<TradeRecord[]>([]);
  const [account, setAccount] = useState<Account | null>(null);
  const [finderOpen, setFinderOpen] = useState(false);
  const [tradeSheetOpen, setTradeSheetOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"unified" | "dtrader" | "digits">("unified");
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [apiToken, setApiTokenState] = useState<string | null>(() => derivSocket.getToken());
  const [latency, setLatency] = useState(0);
  const marketRef = useRef<Market | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setLatency(derivSocket.getLatency());
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  const setApiToken = async (token: string | null) => {
    setApiTokenState(token);
    try {
      await derivSocket.setToken(token);
      const acc = await services.account.getAccount();
      setAccount(acc);
    } catch (e) {
      console.error("Token auth error:", e);
      throw e;
    }
  };

  const market = useMemo(
    () => markets.find((m) => m.underlying_symbol === activeSymbol) ?? null,
    [markets, activeSymbol],
  );
  marketRef.current = market;

  // catalogue + account + history
  useEffect(() => {
    services.marketData.listMarkets().then(setMarkets);
    services.account.getAccount().then(setAccount);
    services.openContracts.getHistory().then(setHistory);
    return services.openContracts.subscribeOpenContracts((c) => {
      setOpenContracts(c);
      services.openContracts.getHistory().then(setHistory);
    });
  }, []);

  // ONE stream for the active market: history + subscription
  useEffect(() => {
    let cancelled = false;
    setTicks([]);
    setFeedStatus("CONNECTING");
    services.contracts
      .getAvailableContracts(activeSymbol)
      .then((a) => !cancelled && setAvailable(a));
    services.marketData.getTicksHistory(activeSymbol, 1000).then((h) => !cancelled && setTicks(h));
    const unsub = services.marketData.subscribeTicks(
      activeSymbol,
      (tick) => {
        if (cancelled) return;
        setTicks((prev) => {
          const next = prev.length >= 1200 ? prev.slice(-1000) : prev.slice();
          next.push(tick);
          return next;
        });
        if (marketRef.current) prototypeControls.portfolioOnTick(tick, marketRef.current);
      },
      (s) => !cancelled && setFeedStatus(s),
    );
    return () => {
      cancelled = true;
      unsub();
    };
  }, [activeSymbol, scenario]);

  // keep the contract type valid for the market
  useEffect(() => {
    if (!available.length) return;
    if (!available.some((a) => a.contractType === config.contractType)) {
      const first = available[0];
      setConfig((c) => ({
        ...c,
        contractType: first.contractType,
        barrier: first.barrier === "digit" ? 5 : first.barrier === "price" ? 1 : undefined,
        durationUnit: first.durations[0].unit,
        duration: first.durations[0].unit === "t" ? 5 : first.durations[0].min,
      }));
    }
  }, [available, config.contractType]);

  const lastTick = ticks.length ? ticks[ticks.length - 1] : null;

  const snapshot = useMemo<AnalysisSnapshot | null>(() => {
    if (!market) return null;
    return services.analysis.analyse({
      market,
      ticks,
      feedStatus,
      activeWindow: window,
      available,
      scenario,
    });
  }, [market, ticks, feedStatus, window, available, scenario]);

  // proposal follows config + market (not every tick)
  const spotRef = useRef(0);
  spotRef.current = lastTick?.quote ?? 0;
  useEffect(() => {
    let cancelled = false;
    setProposalLoading(true);
    const t = setTimeout(() => {
      services.proposals.getProposal(activeSymbol, config, spotRef.current).then((p) => {
        if (cancelled) return;
        setProposal(p);
        setProposalLoading(false);
      });
    }, 150);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [activeSymbol, config, feedStatus]);

  const selectMarket = useCallback((symbol: string) => {
    setActiveSymbol(symbol);
    setTabs((t) => (t.includes(symbol) ? t : [...t, symbol]));
    setSelectedDigit(null);
    setFinderOpen(false);
  }, []);
  const openTab = selectMarket;
  const closeTab = useCallback(
    (symbol: string) => {
      setTabs((t) => {
        const next = t.filter((s) => s !== symbol);
        if (symbol === activeSymbol && next.length)
          setActiveSymbol(next[Math.max(0, t.indexOf(symbol) - 1)]);
        return next.length ? next : t;
      });
    },
    [activeSymbol],
  );

  const setScenario = useCallback((s: DemoScenario) => {
    prototypeControls.setScenario(s);
    setScenarioState(s);
  }, []);

  const updateConfig = useCallback(
    (patch: Partial<ContractConfig>) => setConfig((c) => ({ ...c, ...patch })),
    [],
  );

  const selectContractType = useCallback(
    (ct: ContractType) => {
      const def = available.find((a) => a.contractType === ct);
      setConfig((c) => {
        const sameKind =
          def?.barrier ===
          (available.find((a) => a.contractType === c.contractType)?.barrier ?? "none");
        const barrier =
          def?.barrier === "digit"
            ? sameKind && c.barrier !== undefined
              ? c.barrier
              : 5
            : def?.barrier === "price"
              ? sameKind && c.barrier !== undefined
                ? c.barrier
                : 1
              : undefined;
        const unit = def?.durations.some((d) => d.unit === c.durationUnit)
          ? c.durationUnit
          : (def?.durations[0].unit ?? "t");
        return {
          ...c,
          contractType: ct,
          barrier,
          durationUnit: unit,
          duration:
            unit === c.durationUnit
              ? c.duration
              : unit === "t"
                ? 5
                : (def?.durations.find((d) => d.unit === unit)?.min ?? 1),
        };
      });
    },
    [available],
  );

  const applyCandidate = useCallback(
    (cand: Pick<ContractCandidate, "contractType" | "barrier">) => {
      setConfig((c) => ({
        ...c,
        contractType: cand.contractType,
        barrier: cand.barrier,
        durationUnit: "t",
        duration: c.durationUnit === "t" ? c.duration : 5,
      }));
    },
    [],
  );

  const buy = useCallback(async () => {
    if (!proposal || proposal.status !== "READY" || !market) return;
    setBuying(true);
    try {
      const oc = await services.trades.buy(activeSymbol, proposal, market);
      toast("Contract Opened", {
        description: `${oc.label} on ${market.display_name} · ${oc.ticksTotal} ticks · Settling against live Deriv feed.`,
      });
      setTradeSheetOpen(false);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBuying(false);
    }
  }, [proposal, market, activeSymbol]);

  const sell = useCallback(async (id: string) => {
    try {
      const rec = await services.trades.sell(id);
      toast("Contract Closed", {
        description: `${rec.label} settled at ${rec.profit >= 0 ? "+" : ""}${rec.profit.toFixed(2)} USD (${rec.status}).`,
      });
    } catch (e) {
      toast.error((e as Error).message);
    }
  }, []);

  const value: CockpitState = {
    markets,
    market,
    tabs,
    activeSymbol,
    selectMarket,
    openTab,
    closeTab,
    scenario,
    setScenario,
    ticks,
    lastTick,
    feedStatus,
    available,
    snapshot,
    window,
    setWindow,
    selectedDigit,
    setSelectedDigit,
    config,
    updateConfig,
    selectContractType,
    applyCandidate,
    proposal,
    proposalLoading,
    buy,
    buying,
    openContracts,
    history,
    sell,
    account,
    finderOpen,
    setFinderOpen,
    tradeSheetOpen,
    setTradeSheetOpen,
    viewMode,
    setViewMode,
    authModalOpen,
    setAuthModalOpen,
    apiToken,
    setApiToken,
    latency,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
