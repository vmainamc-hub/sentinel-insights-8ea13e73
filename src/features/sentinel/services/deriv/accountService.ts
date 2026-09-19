import type { Account } from "../../types";
import type { AccountService } from "../interfaces";
import { derivSocket } from "./socket";

export class DerivAccountService implements AccountService {
  async getAccount(): Promise<Account> {
    const auth = derivSocket.getAuthorizedAccount();
    if (auth) {
      return {
        loginid: String(auth["loginid"] ?? "CR100001"),
        currency: String(auth["currency"] ?? "USD"),
        balance: Number(auth["balance"] ?? 10000),
        is_virtual: Boolean(auth["is_virtual"] ?? 0),
        email: auth["email"] ? String(auth["email"]) : undefined,
      };
    }

    // Default Live Virtual Demo state
    return {
      loginid: "VRTC982410",
      currency: "USD",
      balance: 10000.0,
      is_virtual: true,
      email: "trader@sentinel-deriv.live",
    };
  }
}

export const derivAccountService = new DerivAccountService();
