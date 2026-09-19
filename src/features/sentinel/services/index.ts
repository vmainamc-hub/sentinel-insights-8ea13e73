/**
 * Service registry — connected to authoritative Deriv WebSocket live streams.
 *
 * Real Deriv Market Data (active_symbols, 1000 ticks history, live tick stream),
 * real Deriv contracts, proposals, and account authorization.
 */
import type { SentinelServices } from "./interfaces";
import { derivMarketDataService } from "./deriv/marketDataService";
import { derivContractService } from "./deriv/contractService";
import { derivProposalService } from "./deriv/proposalService";
import { derivAccountService } from "./deriv/accountService";
import { mockPortfolio } from "./mock/tradingServices";
import { digitAnalysisService } from "../engine/digitAnalysis";
import { analysisService } from "../engine/analysis";

export const services: SentinelServices = {
  marketData: derivMarketDataService,
  contracts: derivContractService,
  proposals: derivProposalService,
  trades: mockPortfolio,
  openContracts: mockPortfolio,
  account: derivAccountService,
  digitAnalysis: digitAnalysisService,
  analysis: analysisService,
};

/** Live controls & handles */
export const prototypeControls = {
  peekQuote: (symbol: string) => derivMarketDataService.peekQuote(symbol),
  portfolioOnTick: mockPortfolio.onTick.bind(mockPortfolio),
};

export { contractLabel } from "./mock/tradingServices";
export { CATEGORY_LABEL } from "./mock/catalogue";
export { derivSocket } from "./deriv/socket";
