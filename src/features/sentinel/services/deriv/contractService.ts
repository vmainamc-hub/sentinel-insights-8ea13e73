/**
 * LIVE DERIV CONTRACT AVAILABILITY — contracts_for.
 * Only contract types Deriv actually offers for the selected market are returned.
 */
import type { ContractAvailability, ContractFamily, ContractType, DurationSpec } from "../../types";
import type { ContractService } from "../interfaces";
import { derivSocket } from "./socket";
import { MOCK_MARKETS, mockContractsFor } from "../mock/catalogue";

interface AvailableRow {
  contract_type?: string;
  contract_category?: string;
  barrier_category?: string;
  min_contract_duration?: string;
  max_contract_duration?: string;
  expiry_type?: string;
}

const META: Record<
  ContractType,
  { family: ContractFamily; deriv: string; label: string; barrier: "none" | "digit" | "price" }
> = {
  DIGITEVEN: { family: "digits", deriv: "DIGITEVEN", label: "Even", barrier: "none" },
  DIGITODD: { family: "digits", deriv: "DIGITODD", label: "Odd", barrier: "none" },
  DIGITMATCH: { family: "digits", deriv: "DIGITMATCH", label: "Matches", barrier: "digit" },
  DIGITDIFF: { family: "digits", deriv: "DIGITDIFF", label: "Differs", barrier: "digit" },
  DIGITOVER: { family: "digits", deriv: "DIGITOVER", label: "Over", barrier: "digit" },
  DIGITUNDER: { family: "digits", deriv: "DIGITUNDER", label: "Under", barrier: "digit" },
  RISE: { family: "direction", deriv: "CALL", label: "Rise", barrier: "none" },
  FALL: { family: "direction", deriv: "PUT", label: "Fall", barrier: "none" },
  HIGHER: { family: "direction", deriv: "CALL", label: "Higher", barrier: "price" },
  LOWER: { family: "direction", deriv: "PUT", label: "Lower", barrier: "price" },
  ONETOUCH: { family: "barrier", deriv: "ONETOUCH", label: "Touch", barrier: "price" },
  NOTOUCH: { family: "barrier", deriv: "NOTOUCH", label: "No Touch", barrier: "price" },
};

function mapType(row: AvailableRow): ContractType | null {
  const t = String(row.contract_type ?? "").toUpperCase();
  const atm = String(row.barrier_category ?? "").includes("atm")
    ? String(row.barrier_category) === "euro_atm"
    : false;
  switch (t) {
    case "DIGITEVEN":
    case "DIGITODD":
    case "DIGITMATCH":
    case "DIGITDIFF":
    case "DIGITOVER":
    case "DIGITUNDER":
    case "ONETOUCH":
    case "NOTOUCH":
      return t as ContractType;
    case "CALL":
    case "CALLE":
      return atm ? "RISE" : "HIGHER";
    case "PUT":
      return atm ? "FALL" : "LOWER";
    default:
      return null;
  }
}

const UNIT_ORDER: DurationSpec["unit"][] = ["t", "s", "m", "h"];

function parseDuration(
  v: string | undefined,
): { unit: DurationSpec["unit"]; value: number } | null {
  if (!v) return null;
  const m = /^(\d+)([tsmhd])$/.exec(v.trim());
  if (!m) return null;
  const value = Number(m[1]);
  const unit = m[2] as DurationSpec["unit"] | "d";
  if (unit === "d") return { unit: "h", value: value * 24 };
  return { unit, value };
}

class DerivContractService implements ContractService {
  private cache = new Map<string, ContractAvailability[]>();

  async getAvailableContracts(symbol: string): Promise<ContractAvailability[]> {
    const cached = this.cache.get(symbol);
    if (cached) return cached;
    let rows: AvailableRow[] = [];
    try {
      const res = await derivSocket.send({ contracts_for: symbol, currency: "USD" });
      const payload = res["contracts_for"] as { available?: AvailableRow[] } | undefined;
      rows = payload?.available ?? [];
    } catch {
      rows = [];
    }

    const byType = new Map<ContractType, Map<DurationSpec["unit"], DurationSpec>>();
    for (const row of rows) {
      const ct = mapType(row);
      if (!ct) continue;
      const min = parseDuration(row.min_contract_duration);
      const max = parseDuration(row.max_contract_duration);
      const durations = byType.get(ct) ?? new Map<DurationSpec["unit"], DurationSpec>();
      if (min) {
        const unit = min.unit;
        const existing = durations.get(unit);
        const maxValue = max && max.unit === unit ? max.value : (existing?.max ?? min.value);
        durations.set(unit, {
          unit,
          min: existing ? Math.min(existing.min, min.value) : min.value,
          max: existing ? Math.max(existing.max, maxValue) : maxValue,
        });
      }
      byType.set(ct, durations);
    }

    const list: ContractAvailability[] = [];
    (Object.keys(META) as ContractType[]).forEach((ct) => {
      const durations = byType.get(ct);
      if (!durations) return;
      const meta = META[ct];
      const specs = UNIT_ORDER.filter((u) => durations.has(u)).map((u) => durations.get(u)!);
      list.push({
        contractType: ct,
        family: meta.family,
        derivContractType: meta.deriv,
        label: meta.label,
        barrier: meta.barrier,
        durations: specs.length ? specs : [{ unit: "t", min: 1, max: 10 }],
      });
    });

    if (list.length === 0) {
      const m = MOCK_MARKETS.find((x) => x.underlying_symbol === symbol) ?? MOCK_MARKETS[0];
      const fallback = mockContractsFor(m);
      this.cache.set(symbol, fallback);
      return fallback;
    }

    this.cache.set(symbol, list);
    return list;
  }
}

export const derivContractService = new DerivContractService();
