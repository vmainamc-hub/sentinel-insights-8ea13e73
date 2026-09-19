import { useState } from "react";
import { TopNav } from "./TopNav";
import { MarketFinderModal } from "./MarketFinderModal";
import { MarketChart } from "./MarketChart";
import { DigitIntelligencePanel } from "./DigitIntelligencePanel";
import { MarketDossier } from "./MarketDossier";
import { TradeDeck } from "./TradeDeck";
import { BottomWorkspace } from "./BottomWorkspace";
import { DTraderView } from "./DTraderView";
import { AccountAuthModal } from "./AccountAuthModal";
import { useCockpit } from "../state/CockpitProvider";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Toaster } from "sonner";

export function Cockpit() {
  const { tradeSheetOpen, setTradeSheetOpen, viewMode } = useCockpit();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      {/* Top Navigation Bar */}
      <TopNav />

      {/* Main Cockpit Body */}
      <main className="flex-1 p-2 sm:p-3 max-w-[1720px] w-full mx-auto">
        {viewMode === "dtrader" ? (
          <DTraderView />
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-2.5 sm:gap-3">
            {/* Left / Center Work Area (12 cols on mobile/tablet, 8 or 9 cols on wide desktop) */}
            <div className="xl:col-span-8 2xl:col-span-9 flex flex-col gap-2.5 sm:gap-3 min-w-0">
              {/* Live Chart */}
              <div className="h-[280px] sm:h-[340px] shrink-0">
                <MarketChart />
              </div>

              {/* Sentinel Market Intelligence Dossier */}
              <MarketDossier />

              {/* 0–9 Live Digit Intelligence Panel (Permanent Flagship Component) */}
              <DigitIntelligencePanel />

              {/* Bottom Workspace: Contract Lab / Open Contracts / History */}
              <BottomWorkspace />
            </div>

            {/* Right Sidebar: Adaptive Contract & Trade Deck (Desktop) */}
            <div className="hidden xl:block xl:col-span-4 2xl:col-span-3 min-w-0">
              <div className="sticky top-16">
                <TradeDeck />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Mobile Trade Deck Sheet */}
      <Sheet open={tradeSheetOpen} onOpenChange={setTradeSheetOpen}>
        <SheetContent
          side="bottom"
          className="h-[85vh] p-0 bg-surface border-border overflow-hidden"
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Adaptive Trade Deck</SheetTitle>
          </SheetHeader>
          <div className="h-full overflow-y-auto p-3">
            <TradeDeck />
          </div>
        </SheetContent>
      </Sheet>

      {/* Global Market Finder Modal */}
      <MarketFinderModal />

      {/* Deriv Account Authentication Modal */}
      <AccountAuthModal />

      {/* Sonner Toast Container */}
      <Toaster theme="dark" position="bottom-right" richColors />
    </div>
  );
}
