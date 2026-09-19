/**
 * LIVE DERIV WEBSOCKET TRANSPORT.
 *
 * One shared socket for the whole cockpit. Every Deriv call (active_symbols,
 * contracts_for, ticks_history, ticks, proposal, …) is multiplexed over it and
 * routed back by `req_id`. Subscriptions are re-issued automatically after a
 * reconnect so the authoritative tick stream survives network blips.
 *
 * Unauthenticated only — no tokens, no buy/sell calls from here.
 */
export type SocketStatus = "CONNECTING" | "OPEN" | "CLOSED";

export const DERIV_APP_ID =
  (import.meta.env?.["VITE_DERIV_APP_ID"] as string | undefined)?.trim() || "1089";

const ENDPOINT = `wss://ws.derivws.com/websockets/v3?app_id=${DERIV_APP_ID}&l=EN&brand=deriv`;

type AnyRec = Record<string, unknown>;

interface Pending {
  resolve: (v: AnyRec) => void;
  reject: (e: Error) => void;
}

interface Sub {
  request: AnyRec;
  onMessage: (msg: AnyRec) => void;
  onError?: (e: Error) => void;
  subscriptionId?: string;
}

class DerivSocket {
  private ws: WebSocket | null = null;
  private status: SocketStatus = "CLOSED";
  private reqId = 1;
  private queue: string[] = [];
  private pending = new Map<number, Pending>();
  private subs = new Map<number, Sub>();
  private statusListeners = new Set<(s: SocketStatus) => void>();
  private accountListeners = new Set<(acc: Record<string, unknown> | null) => void>();
  private retry = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private keepAlive: ReturnType<typeof setInterval> | null = null;
  private token: string | null = null;
  private authorizedAccount: Record<string, unknown> | null = null;
  private latencyMs = 0;

  constructor() {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("deriv_api_token");
        if (saved) this.token = saved.trim();
      } catch {
        // localStorage not available
      }
    }
  }

  getStatus() {
    return this.status;
  }

  getLatency() {
    return this.latencyMs;
  }

  getAuthorizedAccount(): Record<string, unknown> | null {
    return this.authorizedAccount;
  }

  getToken() {
    return this.token;
  }

  onStatus(fn: (s: SocketStatus) => void) {
    this.statusListeners.add(fn);
    fn(this.status);
    return () => this.statusListeners.delete(fn);
  }

  onAccount(fn: (acc: Record<string, unknown> | null) => void) {
    this.accountListeners.add(fn);
    fn(this.authorizedAccount);
    return () => this.accountListeners.delete(fn);
  }

  private setStatus(s: SocketStatus) {
    if (this.status === s) return;
    this.status = s;
    this.statusListeners.forEach((fn) => fn(s));
  }

  async setToken(token: string | null): Promise<Record<string, unknown> | null> {
    this.token = token ? token.trim() : null;
    if (typeof window !== "undefined") {
      try {
        if (this.token) localStorage.setItem("deriv_api_token", this.token);
        else localStorage.removeItem("deriv_api_token");
      } catch {
        // localStorage not available
      }
    }
    if (!this.token) {
      this.authorizedAccount = null;
      this.accountListeners.forEach((fn) => fn(null));
      return null;
    }
    return this.authorizeCurrentToken();
  }

  private async authorizeCurrentToken(): Promise<Record<string, unknown> | null> {
    if (!this.token) return null;
    try {
      const res = await this.send({ authorize: this.token });
      const auth = (res["authorize"] as Record<string, unknown>) ?? null;
      if (auth) {
        this.authorizedAccount = auth;
        this.accountListeners.forEach((fn) => fn(auth));
        return auth;
      }
    } catch (e) {
      console.warn("Deriv authorization failed:", e);
      this.authorizedAccount = null;
      this.accountListeners.forEach((fn) => fn(null));
      throw e;
    }
    return null;
  }

  private connect() {
    if (typeof window === "undefined") return;
    if (this.ws && (this.ws.readyState === 0 || this.ws.readyState === 1)) return;
    this.setStatus("CONNECTING");
    const ws = new WebSocket(ENDPOINT);
    this.ws = ws;

    ws.onopen = async () => {
      this.retry = 0;
      this.setStatus("OPEN");
      if (this.token) {
        this.authorizeCurrentToken().catch(() => {});
      }
      this.queue.forEach((m) => ws.send(m));
      this.queue = [];
      // re-issue every active subscription on a fresh socket
      this.subs.forEach((sub, id) => {
        sub.subscriptionId = undefined;
        ws.send(JSON.stringify({ ...sub.request, subscribe: 1, req_id: id }));
      });
      this.keepAlive = setInterval(() => {
        if (ws.readyState === 1) {
          const start = performance.now();
          this.send({ ping: 1 }, 5000)
            .then(() => {
              this.latencyMs = Math.round(performance.now() - start);
            })
            .catch(() => {});
        }
      }, 20_000);
    };

    ws.onmessage = (ev) => {
      let msg: AnyRec;
      try {
        msg = JSON.parse(ev.data as string) as AnyRec;
      } catch {
        return;
      }
      const reqId = msg["req_id"] as number | undefined;
      if (reqId === undefined) return;
      const error = msg["error"] as { message?: string; code?: string } | undefined;
      const sub = this.subs.get(reqId);
      if (sub) {
        if (error) {
          sub.onError?.(new Error(error.message ?? "Deriv stream error"));
          return;
        }
        const subscription = msg["subscription"] as { id?: string } | undefined;
        if (subscription?.id) sub.subscriptionId = subscription.id;
        sub.onMessage(msg);
        return;
      }
      const p = this.pending.get(reqId);
      if (!p) return;
      this.pending.delete(reqId);
      if (error) p.reject(new Error(error.message ?? "Deriv API error"));
      else p.resolve(msg);
    };

    const fail = () => {
      if (this.keepAlive) clearInterval(this.keepAlive);
      this.keepAlive = null;
      this.setStatus("CLOSED");
      this.pending.forEach((p) => p.reject(new Error("Deriv connection lost")));
      this.pending.clear();
      this.subs.forEach((s) => s.onError?.(new Error("Deriv connection lost")));
      if (this.reconnectTimer) return;
      const delay = Math.min(15_000, 700 * Math.pow(2, this.retry++));
      this.reconnectTimer = setTimeout(() => {
        this.reconnectTimer = null;
        this.connect();
      }, delay);
    };

    ws.onclose = fail;
    ws.onerror = fail;
  }

  private ensure() {
    if (!this.ws || this.ws.readyState > 1) this.connect();
  }

  private write(payload: AnyRec) {
    this.ensure();
    const text = JSON.stringify(payload);
    if (this.ws && this.ws.readyState === 1) this.ws.send(text);
    else this.queue.push(text);
  }

  /** One-shot request/response. */
  send(request: AnyRec, timeoutMs = 20_000): Promise<AnyRec> {
    const id = this.reqId++;
    return new Promise<AnyRec>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error("Deriv request timed out"));
      }, timeoutMs);
      this.pending.set(id, {
        resolve: (v) => {
          clearTimeout(timer);
          resolve(v);
        },
        reject: (e) => {
          clearTimeout(timer);
          reject(e);
        },
      });
      this.write({ ...request, req_id: id });
    });
  }

  /** Long-lived subscription; the returned function forgets it and tells Deriv. */
  subscribe(
    request: AnyRec,
    onMessage: (msg: AnyRec) => void,
    onError?: (e: Error) => void,
  ): () => void {
    const id = this.reqId++;
    this.subs.set(id, { request, onMessage, onError });
    this.write({ ...request, subscribe: 1, req_id: id });
    return () => {
      const sub = this.subs.get(id);
      this.subs.delete(id);
      if (sub?.subscriptionId) {
        this.send({ forget: sub.subscriptionId }).catch(() => {});
      }
    };
  }
}

export const derivSocket = new DerivSocket();
