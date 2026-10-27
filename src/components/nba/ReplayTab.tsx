import { useState } from "react";
import { RefreshCw, Play, Database, Radio, CheckCircle2, Loader2, ArrowRight, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { useNba, REPLAY_EVENTS } from "@/lib/nba-store";
import type { CustomerNBA, StreamEvent } from "@/data/mockData";
import { ActionBadge, ChannelBadge, eur } from "./shared";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const STEPS = [
  "OCPI-/Webhook-Ereignis empfangen…",
  "Zulässigkeit erneut prüfen…",
  "CLV neu berechnen…",
  "Verbindliche Regeln anwenden…",
  "Entscheidung aktualisiert!",
];

function Side({ title, c, highlight }: { title: string; c: CustomerNBA; highlight?: boolean }) {
  const n = c.current_nba;
  return (
    <div className={cn("flex-1 rounded-lg border p-4", highlight ? "border-accent bg-accent/10" : "bg-secondary")}>
      <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{title}</div>
      <div className="mt-2 font-semibold">{n.product_name}</div>
      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
        <ActionBadge type={n.action_type} />
        <ChannelBadge channel={n.channel} />
        <span>· {n.tone}</span>
      </div>
      <div className="mt-2 text-xs text-muted-foreground">Abwanderungsrisiko {Math.round(c.churn_prob * 100)}% · Δ CLV +{eur(n.delta_clv_eur)}</div>
    </div>
  );
}

export function ReplayTab({ onOpenCustomer }: { onOpenCustomer: (id: string) => void }) {
  const { applyEvent, processed, resetAll, customers } = useNba();
  const [running, setRunning] = useState<string | null>(null);
  const [step, setStep] = useState(0);
  const [log, setLog] = useState<string[]>([]);

  const play = async (evt: StreamEvent) => {
    setRunning(evt.event_id);
    setLog([`[${evt.timestamp}] ${evt.event_id} → ${evt.customer_id} · ${evt.event_type}`]);
    for (let i = 0; i < STEPS.length; i++) {
      setStep(i);
      await new Promise((r) => setTimeout(r, 650));
      setLog((l) => [...l, STEPS[i] ?? ""]);
    }
    applyEvent(evt);
    setRunning(null);
    toast.success("NBA-Entscheidung aktualisiert", { description: evt.customer_id });
  };

  return (
    <div className="space-y-6">
      <div className="obsidian p-6">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-accent"><Radio className="h-4 w-4" />Deep Dive B</div>
        <h2 className="mt-2 text-2xl font-bold">Echtzeit Event-Replay</h2>
        <p className="mt-2 max-w-3xl text-sm text-navy-muted">
          MAINGAU verknüpft Databricks Structured Streaming mit Delta Live Tables für Kundensignale aus Netzbetreiber-Meldungen, OCPI-Ladevorgängen und Einwilligungsereignissen. Verbindliche Regeln und DSGVO-Einwilligungen werden vor jeder Ausspielung erneut geprüft.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
          {["Kafka / Webhooks", "Bronze (Rohdaten)", "Silver (DLT)", "Gold · Merkmalsbestand", "NBA-Bewertung"].map((s, i, a) => (
            <span key={s} className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full border border-navy-muted/30 px-3 py-1"><Database className="h-3 w-3 text-accent" />{s}</span>
              {i < a.length - 1 && <ArrowRight className="h-3 w-3 text-navy-muted" />}
            </span>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Replay-Konsole</h3>
            <Button size="sm" variant="ghost" disabled={!!running} onClick={() => { resetAll(); setLog([]); toast("Ausgangszustand wiederhergestellt"); }}>
              <RotateCcw className="h-3.5 w-3.5" /> Zurücksetzen
            </Button>
          </div>
          {REPLAY_EVENTS.map((evt, idx) => {
            const done = processed[evt.event_id];
            const isRunning = running === evt.event_id;
            const inSample = customers.some((c) => c.customer_id === evt.customer_id);
            return (
              <div key={evt.event_id} className={cn("spatial-card p-5", isRunning && "shadow-glow")}>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="max-w-xl">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="rounded bg-primary px-2 py-0.5 font-mono text-primary-foreground">Ereignis {idx + 1}</span>
                      <span className="font-mono text-muted-foreground">{evt.event_id} · {evt.timestamp}</span>
                    </div>
                    <div className="mt-2 font-semibold">
                      {({ gas_meter_deregistered: "Gaszähler abgemeldet", charge_failed_third_time: "Dritter Ladeabbruch", consent_withdrawn: "Einwilligung widerrufen", complaint_created: "Beschwerde eröffnet" })[evt.event_type]} ·{" "}
                      {inSample ? (
                        <Button variant="gold" size="sm" className="h-auto min-h-9 font-mono" onClick={() => onOpenCustomer(evt.customer_id)}>
                          {evt.customer_id}
                        </Button>
                      ) : (
                        <span className="font-mono text-chart-2">{evt.customer_id}</span>
                      )}{" "}
                      
                      {!inSample && (
                        <span className="mt-1 block text-xs font-normal text-warning-foreground">
                          Nicht in der aktuellen Stichprobe — Replay nutzt den Ausgangszustand des Testpools.
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{evt.description.replace("Kunde klickt im Newsletter-Footer auf 'Abmelden' (marketing_email -> withdrawn).", "Kunde widerruft die E-Mail-Einwilligung über den Abmeldelink im Newsletter.")}</p>
                    <p className="mt-1 text-sm font-medium">{evt.impact_description.replaceAll("Churn", "Abwanderung")}</p>
                  </div>
                  <Button
                    disabled={!!running || !!done}
                    onClick={() => play(evt)}
                    variant={done ? "secondary" : "gold"}
                  >
                    {isRunning ? <Loader2 className="h-4 w-4 animate-spin" /> : done ? <CheckCircle2 className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    {isRunning ? "Verarbeitung" : done ? "Angewendet" : "Ereignis abspielen"}
                  </Button>
                </div>
                {isRunning && (
                  <div className="mt-4 flex gap-1">
                    {STEPS.map((_, i) => (
                      <div key={i} className={cn("h-1.5 flex-1 rounded-full transition-all", i <= step ? "bg-accent" : "bg-secondary")} />
                    ))}
                  </div>
                )}
                {done && (
                  <div className="mt-4 flex flex-col items-stretch gap-3 md:flex-row md:items-center animate-in fade-in slide-in-from-bottom-2">
                    <Side title="Vorher" c={done.before} />
                    <ArrowRight className="mx-auto h-5 w-5 shrink-0 rotate-90 text-accent md:rotate-0" />
                    <Side title="Nachher" c={done.after} highlight />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="obsidian h-fit p-4 font-mono text-xs lg:sticky lg:top-24">
          <div className="mb-3 flex items-center gap-2 text-navy-muted">
            <RefreshCw className={cn("h-3.5 w-3.5", running && "animate-spin text-accent")} /> Echtzeit-Verarbeitungsprotokoll
          </div>
          <div className="min-h-64 space-y-1.5">
            {log.length === 0 && <div className="text-navy-muted">Warten auf Ereignisse…</div>}
            {log.map((l, i) => (
              <div key={i} className={cn("animate-in fade-in slide-in-from-left-1", l === "Entscheidung aktualisiert!" ? "text-success" : i === 0 ? "text-accent" : "")}>
                <span className="text-navy-muted">›</span> {l}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
