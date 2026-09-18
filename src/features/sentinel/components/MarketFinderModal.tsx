import { useMemo, useState } from "react";
import { Check, Flame, Radio, Search, Sparkles, X } from "lucide-react";
import { useCockpit } from "../state/CockpitProvider";
import { CATEGORY_LABEL } from "../services";
import { prototypeControls } from "../services";
import type { MarketCategory } from "../types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function MarketFinderModal() {
  const { markets, activeSymbol, selectMarket, finderOpen, setFinderOpen, feedStatus } =
    useCockpit();
  const [search, setSearch] = useState("");
  const [selectedCat, setSelectedCat] = useState<string>("all");

  const categories = useMemo(() => {
    const cats = new Set<string>();
    markets.forEach((m) => cats.add(m.category));
    return ["all", ...Array.from(cats)];
  }, [markets]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return markets.filter((m) => {
      const matchCat = selectedCat === "all" || m.category === selectedCat;
      const matchQuery =
        !q ||
        m.display_name.toLowerCase().includes(q) ||
        m.underlying_symbol.toLowerCase().includes(q) ||
        (CATEGORY_LABEL[m.category] ?? m.category).toLowerCase().includes(q);
      return matchCat && matchQuery;
    });
  }, [markets, search, selectedCat]);

  return (
    <Dialog open={finderOpen} onOpenChange={setFinderOpen}>
      <DialogContent className="max-w-2xl bg-surface border-border text-foreground p-0 overflow-hidden shadow-2xl">
        <DialogHeader className="p-4 border-b border-border bg-surface-2/60">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                <Search className="w-4 h-4 text-primary" />
                <span>Market Finder</span>
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Switch markets dynamically without page reload. Real Deriv catalogue discovery.
              </DialogDescription>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative mt-3">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by market name or symbol (e.g. Volatility 10, 1HZ10V, Boom)..."
              className="pl-9 h-9 text-xs bg-surface border-border focus-visible:ring-primary/40 text-foreground"
              autoFocus
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Category filter pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-2">
            {categories.map((cat) => {
              const label =
                cat === "all" ? "All Markets" : (CATEGORY_LABEL[cat as MarketCategory] ?? cat);
              const isSelected = selectedCat === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCat(cat)}
                  className={`text-[11px] font-mono px-2.5 py-1 rounded-full whitespace-nowrap transition-all border ${
                    isSelected
                      ? "bg-primary text-primary-foreground border-primary font-medium"
                      : "bg-surface border-border/80 text-muted-foreground hover:text-foreground hover:border-border"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </DialogHeader>

        {/* Market List */}
        <div className="max-h-[380px] overflow-y-auto divide-y divide-border/50 p-2">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted-foreground">
              No synthetic markets matching "{search}"
            </div>
          ) : (
            filtered.map((m) => {
              const isCurrent = m.underlying_symbol === activeSymbol;
              const peek = prototypeControls.peekQuote(m.underlying_symbol);
              const quote =
                typeof peek === "number"
                  ? peek
                  : typeof peek === "object" && peek !== null && "quote" in peek
                    ? Number((peek as { quote: number }).quote)
                    : undefined;
              const quoteStr =
                typeof quote === "number" && !isNaN(quote) ? quote.toFixed(m.pip_decimals) : "—";

              return (
                <div
                  key={m.underlying_symbol}
                  onClick={() => selectMarket(m.underlying_symbol)}
                  className={`flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-colors ${
                    isCurrent
                      ? "bg-surface-3 border border-primary/40 text-foreground"
                      : "hover:bg-surface-2 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-2 h-8 rounded-full shrink-0 ${
                        isCurrent ? "bg-primary shadow-glow-primary" : "bg-muted-foreground/30"
                      }`}
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-foreground truncate">
                          {m.display_name}
                        </span>
                        <Badge
                          variant="outline"
                          className="font-mono text-[9px] px-1 py-0 h-4 bg-surface-2 border-border/80 text-muted-foreground uppercase"
                        >
                          {m.underlying_symbol}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-mono mt-0.5">
                        <span>{CATEGORY_LABEL[m.category] ?? m.category}</span>
                        <span>•</span>
                        <span>{m.tick_interval_seconds}s tick</span>
                        <span>•</span>
                        <span className="text-emerald-400/90 flex items-center gap-1">
                          <Radio className="w-2.5 h-2.5 animate-pulse" />
                          Live Stream
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <div className="font-mono text-xs font-semibold text-foreground">
                        {quoteStr}
                      </div>
                      <div className="text-[10px] text-muted-foreground font-mono">
                        Digits, Rise/Fall
                      </div>
                    </div>

                    {isCurrent ? (
                      <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs text-muted-foreground hover:text-primary hover:bg-surface-3"
                      >
                        Select
                      </Button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="p-3 border-t border-border bg-surface-2/40 flex items-center justify-between text-[11px] text-muted-foreground font-mono">
          <span>{filtered.length} active synthetic markets discovered</span>
          <span className="text-[10px] text-primary">Instant zero-reload switch</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
