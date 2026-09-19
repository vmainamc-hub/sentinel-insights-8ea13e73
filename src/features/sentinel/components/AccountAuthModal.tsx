import { useState } from "react";
import { CheckCircle2, KeyRound, Lock, LogOut, Shield, Wifi, X } from "lucide-react";
import { useCockpit } from "../state/CockpitProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export function AccountAuthModal() {
  const { authModalOpen, setAuthModalOpen, account, apiToken, setApiToken } = useCockpit();
  const [tokenInput, setTokenInput] = useState(apiToken ?? "");
  const [loading, setLoading] = useState(false);

  if (!authModalOpen) return null;

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenInput.trim()) {
      toast.error("Please enter a valid Deriv API Token");
      return;
    }
    setLoading(true);
    try {
      await setApiToken(tokenInput.trim());
      toast.success("Connected to Deriv Account!", {
        description: "Authenticated over secure Deriv WebSocket.",
      });
      setAuthModalOpen(false);
    } catch (err) {
      toast.error("Failed to authenticate token", {
        description: (err as Error).message || "Please verify your API token on deriv.com.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    await setApiToken(null);
    setTokenInput("");
    toast("Switched to Live Virtual Demo Account");
  };

  return (
    <div
      id="account-auth-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
      onClick={() => setAuthModalOpen(false)}
    >
      <div
        className="w-full max-w-md bg-surface border border-border rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-surface-2/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center text-primary">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground font-mono uppercase tracking-wider">
                Deriv Account Setup
              </h2>
              <p className="text-xs text-muted-foreground">Live WebSocket API Authentication</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setAuthModalOpen(false)}
            className="text-muted-foreground hover:text-foreground rounded p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Current Status Card */}
          <div className="p-3 rounded-lg border border-border/70 bg-surface-2 flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="text-[11px] font-mono text-muted-foreground uppercase flex items-center gap-1.5">
                <Wifi className="w-3 h-3 text-emerald-400 animate-pulse" />
                <span>Current Account</span>
              </div>
              <div className="text-xs font-mono font-semibold text-foreground">
                {account?.loginid ?? "VRTC982410"}
                <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-surface-3 border border-border text-muted-foreground font-normal">
                  {account?.is_virtual ? "DEMO / VIRTUAL" : "REAL LIVE"}
                </span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] font-mono text-muted-foreground uppercase">Balance</div>
              <div className="text-sm font-mono font-bold text-primary">
                $
                {account?.balance?.toLocaleString("en-US", { minimumFractionDigits: 2 }) ??
                  "10,000.00"}{" "}
                <span className="text-[10px] font-normal text-muted-foreground">USD</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleConnect} className="space-y-3.5">
            <div className="space-y-1.5">
              <label
                htmlFor="deriv-token"
                className="text-xs font-mono font-medium text-foreground flex items-center justify-between"
              >
                <span>Deriv API Token</span>
                <a
                  href="https://app.deriv.com/account/api-token"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-primary hover:underline"
                >
                  Generate Token ↗
                </a>
              </label>
              <div className="relative">
                <Input
                  id="deriv-token"
                  type="password"
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  placeholder="Paste your Deriv API token here..."
                  className="h-9 font-mono text-xs bg-surface-3 border-border pr-9 focus-visible:ring-primary"
                />
                <Lock className="w-3.5 h-3.5 absolute right-3 top-2.5 text-muted-foreground pointer-events-none" />
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Tokens are stored locally in your browser and used directly with{" "}
                <span className="font-mono text-foreground">wss://ws.derivws.com</span>. Requires
                'Read' and 'Trade' scopes.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <Button
                type="submit"
                disabled={loading}
                className="flex-1 h-9 bg-primary text-primary-foreground font-semibold text-xs hover:bg-primary/90"
              >
                {loading ? "Authenticating..." : apiToken ? "Update Token" : "Connect Deriv Token"}
              </Button>

              {apiToken && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleDisconnect}
                  className="h-9 px-3 text-xs border-rose-500/30 text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/50"
                  title="Disconnect and use Virtual Demo account"
                >
                  <LogOut className="w-3.5 h-3.5 mr-1.5" />
                  Disconnect
                </Button>
              )}
            </div>
          </form>

          <div className="p-3 rounded-lg border border-primary/20 bg-primary/5 flex items-start gap-2 text-xs text-muted-foreground">
            <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <div className="text-[11px] leading-snug">
              <strong className="text-foreground">Zero-setup Demo Mode:</strong> If you don't enter
              a token, the cockpit automatically streams 100% real live market ticks from Deriv and
              executes trades in live simulated demo mode with instant settlement.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
