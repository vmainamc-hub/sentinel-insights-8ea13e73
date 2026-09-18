/**
 * Service registry — the single swap point for the live integration.
 *
 * Phase 2: replace the mock members with Deriv-backed implementations and
 * nothing in the UI layer needs to change.
 */
import type { SentinelServices } from "./interfaces";
import { mockMarketDataService } from "./mock/marketDataService";
import {
  mockAccountService,
  mockContractService,
  mockPortfolio,
  mockProposalService,
} from "./mock/tradingServices";
import { digitAnalysisService } from "../engine/digitAnalysis";
import { analysisService } from "../engine/analysis";

export const services: SentinelServices = {
  marketData: mockMarketDataService,
  contracts: mockContractService,
  proposals: mockProposalService,
  trades: mockPortfolio,
  openContracts: mockPortfolio,
  account: mockAccountService,
  digitAnalysis: digitAnalysisService,
  analysis: analysisService,
};

/** Prototype-only handles (demo scenario switching, stream fan-out). */
export const prototypeControls = {
  setScenario: (s: Parameters<typeof mockMarketDataService.setScenario>[0]) =>
    mockMarketDataService.setScenario(s),
  peekQuote: (symbol: string) => mockMarketDataService.peekQuote(symbol),
  portfolioOnTick: mockPortfolio.onTick.bind(mockPortfolio),
};

export { contractLabel } from "./mock/tradingServices";
export { CATEGORY_LABEL } from "./mock/catalogue";
