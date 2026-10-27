import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { LayoutDashboard, UserRound, RefreshCw, Dices, type LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { NbaProvider, useNba } from "@/lib/nba-store";
import { MarketingTab } from "@/components/nba/MarketingTab";
import { CustomerTab } from "@/components/nba/CustomerTab";
import { ReplayTab } from "@/components/nba/ReplayTab";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MAINGAU NBA Engine · Prototyp für nächste beste Aktionen" },
      { name: "description", content: "MAINGAU Energie: Marketing-Orchestrierung, Kunden 360°, Agenten-Assist und Echtzeit Event-Replay mit konsequenter Einwilligungsprüfung." },
      { property: "og:title", content: "MAINGAU NBA Engine" },
      { property: "og:description", content: "NBA-Entscheidungen in Echtzeit: Angebot, Kanal und Tonalität mit konsequenter Einwilligungsprüfung." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

type Tab = "marketing" | "customer" | "replay";
const TABS: { id: Tab; label: string; icon: LucideIcon }[] = [
  { id: "marketing", label: "Marketing-Orchestrierung", icon: LayoutDashboard },
  { id: "customer", label: "Kunden 360° / Agenten-Assist", icon: UserRound },
  { id: "replay", label: "Echtzeit Event-Replay (Deep Dive B)", icon: RefreshCw },
];

function Shell() {
  const [tab, setTab] = useState<Tab>("marketing");
  const { setSelectedId, processed, sampleRandom } = useNba();
  const open = (id: string) => { setSelectedId(id); setTab("customer"); };
  const sample = () => {
    const next = sampleRandom();
    toast.success("5 zufällige Kunden ausgewählt", { description: next.map((c) => c.customer_id).join(" · ") });
  };

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 bg-gradient-navy text-navy-foreground shadow-card">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-6 gap-y-3 px-6 py-4">
          <div className="leading-tight">
            <div className="font-display text-lg font-bold tracking-tight text-navy-foreground">
              MAINGAU <span className="text-accent">NBA Engine</span>
            </div>
            <div className="mt-1 text-xs text-navy-muted">Strom · Gas · Mobilfunk · Internet · Autostrom · Smart Living</div>
          </div>
          <div className="flex items-center gap-4">
            <Button size="sm" onClick={sample} className="bg-gradient-amber font-semibold text-accent-foreground hover:opacity-90">
              <Dices className="h-4 w-4" /> 5 zufällige Kunden auswählen
            </Button>
            <span className="flex items-center gap-2 text-xs text-navy-muted">
              <span className="h-2 w-2 animate-pulse rounded-full bg-success" /> Ereignisstrom aktiv · {Object.keys(processed).length} Ereignisse angewendet
            </span>
          </div>
        </div>
        <nav className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-6">
          {TABS.map((t) => (
            <Button variant="ghost"
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "h-auto rounded-none flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition hover:bg-navy-foreground/5",
                tab === t.id ? "border-accent text-navy-foreground" : "border-transparent text-navy-muted hover:text-navy-foreground",
              )}
            >
              <t.icon className="h-4 w-4" /> {t.label}
            </Button>
          ))}
        </nav>
      </header>
      <main key={tab} className="mx-auto max-w-7xl px-6 py-8 animate-in fade-in slide-in-from-bottom-1 duration-300">
        {tab === "marketing" && <MarketingTab onOpenCustomer={open} />}
        {tab === "customer" && <CustomerTab />}
        {tab === "replay" && <ReplayTab onOpenCustomer={open} />}
      </main>
    </div>
  );
}

function Index() {
  return (
    <NbaProvider>
      <Shell />
      <Toaster richColors position="top-right" />
    </NbaProvider>
  );
}
