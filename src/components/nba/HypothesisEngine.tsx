import { useState } from "react";
import { BrainCircuit, ChevronDown, FlaskConical, CheckCircle2, RefreshCw } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Slider } from "@/components/ui/slider";
import { useNba } from "@/lib/nba-store";
import { BANDIT_DEFAULT_EXPLORATION, explorationMetrics, type Hypothesis } from "@/lib/pitch";
import { cn } from "@/lib/utils";

function HypoCard({ h }: { h: Hypothesis }) {
  return (
    <div className="spatial-card p-4" aria-label={h.id}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded bg-primary px-2 py-0.5 font-mono text-xs font-semibold text-primary-foreground">{h.id}</span>
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold min-h-8",
              h.confirmed ? "border-success/40 bg-success/10 text-success" : "border-accent/50 bg-accent/15 text-warning-foreground",
            )}
          >
            {h.confirmed ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0" /> : <RefreshCw className="h-3.5 w-3.5 shrink-0" />}
            {h.status}
          </span>
        </div>
      </div>
      <p className="mt-3 text-sm font-medium leading-snug">{h.title}</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-3 text-center">
        <div className="metric-well p-4">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Stichprobe</div>
          <div className="font-display text-lg font-bold">{h.sample}</div>
          <div className="text-[11px] text-muted-foreground">Kunden</div>
        </div>
        <div className="metric-well p-4">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Mehrertrag</div>
          <div className="font-display text-lg font-bold text-success">+{h.uplift.toLocaleString("de-DE", { minimumFractionDigits: 1 })}%</div>
          <div className="text-[11px] text-muted-foreground">ggü. Kontrollgruppe</div>
        </div>
        <div className="metric-well p-4">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Signifikanz</div>
          <div className="font-display text-lg font-bold">{h.significance}%</div>
          <div className="liquid-track mt-2" role="progressbar" aria-label={`${h.id} Signifikanz`} aria-valuenow={h.significance} aria-valuemin={0} aria-valuemax={100}>
            <div className="liquid-blue h-full" style={{ width: `${h.significance}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
}

export function HypothesisEngine() {
  const { model, hypotheses, exploration, setExploration } = useNba();
  const [open, setOpen] = useState(true);
  const metrics = explorationMetrics(exploration, model.clv);
  const exploitation = 100 - exploration;

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="spatial-card">
      <CollapsibleTrigger className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left">
        <span className="flex items-center gap-2">
          <BrainCircuit className="h-4 w-4 text-accent" />
          <span className="font-semibold">KI-Hypothesen &amp; Experimentier-Engine</span>
          <span className="rounded-full border border-accent/40 bg-accent/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-warning-foreground">
            Deep Dive A
          </span>
        </span>
        <ChevronDown className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")} />
      </CollapsibleTrigger>
      <CollapsibleContent className="data-[state=closed]:animate-out data-[state=open]:animate-in fade-in-0 slide-in-from-top-1">
        <div className="space-y-4 px-5 pb-5">
          <div className="grid gap-4 lg:grid-cols-2">
            <HypoCard h={hypotheses.h104} />
            <HypoCard h={hypotheses.h105} />
          </div>

          <div className="metric-well p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <FlaskConical className="h-4 w-4 text-accent" /> Bandit-Aufteilung · ε-Greedy
              </div>
              <div className="font-mono text-xs text-muted-foreground">
                {exploitation}% Profitoptimierung / {exploration}% Exploration
              </div>
            </div>

            <div className="liquid-track mt-3 flex">
              <div className="liquid-gold h-full" style={{ width: `${exploitation}%` }} />
              <div className="liquid-blue h-full" style={{ width: `${exploration}%` }} />
            </div>
            <div className="mt-2 flex flex-wrap justify-between gap-2 text-xs">
              <span className="font-medium">
                <span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-accent align-middle" />
                {exploitation}% Profitoptimierung (beste bekannte Aktion)
              </span>
              <span className="font-medium">
                <span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-chart-2 align-middle" />
                {exploration}% Exploration (Hypothesentests / Kontrollgruppe)
              </span>
            </div>

            <div className="mt-3 rounded-md border border-accent/40 bg-accent/10 px-3 py-2 text-xs font-semibold text-warning-foreground" aria-live="polite">
              {exploration <= 5 ? "Fokus auf Maximierung des Tagesprofits | Geringe Exploration" : exploration > 10 ? `Lern-Geschwindigkeit: ${exploration >= 30 ? "Hoch" : "Erhöht"} (+${metrics.learningGain}% schnellere Signifikanz) | Explorationskosten: -€${metrics.cost.toLocaleString("de-DE")}` : "Ausgewogene Profitoptimierung und Exploration"}
            </div>
            <Slider
              value={[exploration]}
              onValueChange={([v]) => setExploration(v ?? BANDIT_DEFAULT_EXPLORATION)}
              max={50}
              step={1}
              className="mt-4"
              aria-label="Explorationsanteil"
            />
            <p className="mt-2 text-xs text-muted-foreground">
              Die Kontrollgruppe bleibt unverändert; der Mehrertrag wird gegenüber einer sauberen Vergleichsbasis gemessen.
            </p>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
