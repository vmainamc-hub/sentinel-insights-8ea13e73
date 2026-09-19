/**
 * LIVE DERIV PRICING — `proposal` (unauthenticated, read-only).
 *
 * Real Deriv ask price / payout for the configured contract. No account is
 * attached and nothing here can buy: execution stays prototype-only.
 */
import type { Proposal } from "../../types";
import type { ProposalService } from "../interfaces";
import { derivContractService } from "./contractService";
import { derivSocket } from "./socket";

let seq = 0;

const BARRIER_DIGIT = ["DIGITMATCH", "DIGITDIFF", "DIGITOVER", "DIGITUNDER"];

export const derivProposalService: ProposalService = {
  async getProposal(symbol, config, spot) {
    const id = `deriv-prop-${++seq}`;
    const base = {
      id,
      source: "DERIV" as const,
      config,
      askPrice: 0,
      payout: 0,
      potentialProfit: 0,
      spot,
      createdAt: Date.now(),
    };

    const available = await derivContractService.getAvailableContracts(symbol).catch(() => []);
    const def = available.find((a) => a.contractType === config.contractType);
    if (!def)
      return { ...base, status: "UNAVAILABLE", message: "Contract not offered on this market." };
    if (
      def.barrier === "digit" &&
      (config.barrier === undefined || config.barrier < 0 || config.barrier > 9)
    )
      return { ...base, status: "ERROR", message: "Select a digit." };
    if (!(config.stake > 0)) return { ...base, status: "ERROR", message: "Stake must be positive." };

    const payload: Record<string, unknown> = {
      proposal: 1,
      amount: config.stake,
      basis: "stake",
      contract_type: def.derivContractType,
      currency: config.currency || "USD",
      duration: config.duration,
      duration_unit: config.durationUnit,
      symbol,
    };
    if (BARRIER_DIGIT.includes(config.contractType)) payload["barrier"] = String(config.barrier);
    else if (def.barrier === "price" && config.barrier !== undefined)
      payload["barrier"] = `${config.barrier >= 0 ? "+" : ""}${config.barrier}`;

    try {
      const res = await derivSocket.send(payload);
      const p = res["proposal"] as
        | { ask_price?: number; payout?: number; spot?: number; display_value?: string }
        | undefined;
      const askPrice = Number(p?.ask_price ?? 0);
      const payout = Number(p?.payout ?? 0);
      if (!payout) return { ...base, status: "UNAVAILABLE", message: "Deriv returned no price." };
      return {
        ...base,
        status: "READY",
        askPrice: Number(askPrice.toFixed(2)),
        payout: Number(payout.toFixed(2)),
        potentialProfit: Number((payout - askPrice).toFixed(2)),
        spot: Number(p?.spot ?? spot),
      } satisfies Proposal;
    } catch (e) {
      const message = (e as Error).message || "Deriv pricing unavailable.";
      return {
        ...base,
        status: /not (offered|available)|invalid|barrier|duration/i.test(message)
          ? "UNAVAILABLE"
          : "ERROR",
        message,
      };
    }
  },
};
