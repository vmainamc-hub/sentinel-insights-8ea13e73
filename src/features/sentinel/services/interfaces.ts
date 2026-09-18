/**
 * Service boundaries for SENTINEL DTRADER.
 *
 * The prototype ships mock implementations (./mock). The live phase replaces
 * them with Deriv-backed implementations that talk to:
 *   active_symbols, contracts_for, ticks, ticks_history, proposal, buy,
 *   proposal_open_contract, sell, portfolio, balance/authorize.
 *
 * ONE AUTHORITATIVE MARKET STREAM: only MarketDataService opens a tick
 * subscription. Every widget (chart, digits, Sentinel, Contract Lab, proposal)
 * derives from the tick history it publishes — never from its own socket.
 */
import type {
  Account,
  AnalysisSnapshot,
  ContractAvailability,
  ContractConfig,
  DemoScenario,
  DigitWindow,
  FeedStatus,
  Market,
  OpenContract,
  Proposal,
  Tick,
  TradeRecord,
  WindowStats,
} from "../types";

export type Unsubscribe = () => void;

export interface MarketDataService {
  /** active_symbols */
  listMarkets(): Promise<Market[]>;
  /** ticks_history (count based) */
  getTicksHistory(underlying_symbol: string, count: number): Promise<Tick[]>;
  /** ticks (subscribe). Exactly one subscription per active market. */
  subscribeTicks(
    underlying_symbol: string,
    onTick: (tick: Tick) => void,
    onStatus: (status: FeedStatus) => void,
  ): Unsubscribe;
}

export interface ContractService {
  /** contracts_for */
  getAvailableContracts(underlying_symbol: string): Promise<ContractAvailability[]>;
}

export interface ProposalService {
  /** proposal — returns a priced (or unavailable) proposal for the config. */
  getProposal(underlying_symbol: string, config: ContractConfig, spot: number): Promise<Proposal>;
}

export interface TradeService {
  /** buy — authenticated in the live phase. Prototype never places trades. */
  buy(underlying_symbol: string, proposal: Proposal, market: Market): Promise<OpenContract>;
  /** sell */
  sell(contractId: string): Promise<TradeRecord>;
}

export interface OpenContractService {
  /** portfolio + proposal_open_contract */
  subscribeOpenContracts(onUpdate: (contracts: OpenContract[]) => void): Unsubscribe;
  getHistory(): Promise<TradeRecord[]>;
}

export interface AccountService {
  /** authorize + balance */
  getAccount(): Promise<Account>;
}

export interface DigitAnalysisService {
  computeWindow(ticks: Tick[], window: DigitWindow): WindowStats;
}

export interface AnalysisService {
  /** Builds the single AnalysisSnapshot the UI consumes. */
  analyse(input: {
    market: Market;
    ticks: Tick[];
    feedStatus: FeedStatus;
    activeWindow: DigitWindow;
    available: ContractAvailability[];
    /** prototype-only hint; the live engine ignores it */
    scenario?: DemoScenario;
  }): AnalysisSnapshot;
}

export interface SentinelServices {
  marketData: MarketDataService;
  contracts: ContractService;
  proposals: ProposalService;
  trades: TradeService;
  openContracts: OpenContractService;
  account: AccountService;
  digitAnalysis: DigitAnalysisService;
  analysis: AnalysisService;
}
