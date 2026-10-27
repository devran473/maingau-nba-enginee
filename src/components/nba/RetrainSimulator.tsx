import { useState } from "react";
import { toast } from "sonner";
import { RotateCcw, PlayCircle, CheckCircle2, Loader2, ShieldCheck, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useNba } from "@/lib/nba-store";
import { CONVERSION_GAIN_PP, RETRAIN_STEPS, RETRAINED_CLV } from "@/lib/pitch";
import { eur } from "./shared";
import { cn } from "@/lib/utils";

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function RetrainSimulator() {
  const { model, hypotheses, retrain, approvePolicy } = useNba();
  const [running, setRunning] = useState(false);
  const [step, setStep] = useState(-1);

  const run = async () => {
    if (running || model.retrained) return;
    setRunning(true);
    for (let i = 0; i < RETRAIN_STEPS.length; i++) {
      setStep(i);
      await wait(750);
    }
    retrain();
    setRunning(false);
    setStep(-1);
    toast.success("Modell mit 50 Rückmeldungen neu trainiert", {
      description: "Mehrertrag gegenüber Kontrollgruppe bestätigt — Marketingfreigabe ausstehend.",
    });
  };

  const approve = () => {
    approvePolicy();
    toast.success("Konform mit Folie 12: Modell neu trainiert, Regeln durch Marketing freigegeben.");
  };

  return (
    <div className="spatial-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-accent">Geschlossener Lernkreislauf</div>
          <h3 className="font-semibold">Entscheidungs- &amp; Neutraining-Simulator</h3>
        </div>
        {model.retrained ? (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-success/40 bg-success/10 px-3 py-1 text-xs font-semibold text-success">
            <CheckCircle2 className="h-3.5 w-3.5" /> Modell neu trainiert
          </span>
        ) : (
          <Button
            onClick={run}
            disabled={running}
            variant="gold" className="h-auto min-h-9 whitespace-normal py-2"
          >
            {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlayCircle className="h-4 w-4" />}
            {running ? "Simulation läuft…" : "50 Kundenrückmeldungen simulieren"}
          </Button>
        )}
      </div>

      <div className="space-y-4 p-5">
        {running && (
          <div className="rounded-lg border border-accent/40 bg-accent/5 p-4 animate-in fade-in slide-in-from-bottom-1">
            <Progress value={((step + 1) / RETRAIN_STEPS.length) * 100} className="h-1.5 bg-secondary" />
            <ul className="mt-3 space-y-1.5 font-mono text-xs">
              {RETRAIN_STEPS.map((s, i) => (
                <li
                  key={s}
                  className={cn(
                    "flex items-center gap-2 transition-colors",
                    i < step ? "text-success" : i === step ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {i < step ? (
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                  ) : i === step ? (
                    <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-accent" />
                  ) : (
                    <span className="h-3.5 w-3.5 shrink-0 rounded-full border border-border" />
                  )}
                  {s}
                </li>
              ))}
            </ul>
          </div>
        )}

        {!model.retrained && !running && (
          <p className="text-sm text-muted-foreground">
            Simulierte Konvertierungen werden mit der Kontrollgruppe verglichen. Das CLV-Modell berechnet Annahmewahrscheinlichkeiten und Entscheidungsregeln neu. Neue Regeln benötigen eine Marketingfreigabe.
          </p>
        )}

        {model.retrained && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="metric-well p-3">
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Gesamter ΔCLV</div>
                <div className="font-display text-xl font-bold text-success">
                  {eur(model.clv)}
                </div>
                <div className="text-[11px] text-muted-foreground">von {eur(148250)} · +{eur(RETRAINED_CLV - 148250)}</div>
              </div>
              <div className="metric-well p-3">
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Konvertierungsrate</div>
                <div className="font-display text-xl font-bold text-success">{model.conversion.toLocaleString("de-DE", { minimumFractionDigits: 1 })}%</div>
                <div className="text-[11px] text-muted-foreground">+{CONVERSION_GAIN_PP.toLocaleString("de-DE", { minimumFractionDigits: 1 })} pp ggü. Kontrollgruppe</div>
              </div>
              <div className="metric-well p-3">
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Hypothese H-105</div>
                <div className="font-display text-xl font-bold">{hypotheses.h105.status}</div>
                <div className="text-[11px] text-muted-foreground">
                  {hypotheses.h105.sample} Kunden · {hypotheses.h105.significance}% Signifikanz
                </div>
              </div>
            </div>

            {model.policyApplied ? (
              <div className="flex items-start gap-2 rounded-lg border border-success/40 bg-success/10 px-4 py-3 text-sm font-medium text-success">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
                Neue Modellregeln freigegeben und für die nächste Versandgruppe vorgemerkt.
              </div>
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-warning/50 bg-warning/10 px-4 py-3">
                <div className="flex items-start gap-2 text-sm">
                  <TrendingUp className="mt-0.5 h-4 w-4 shrink-0 text-warning-foreground" />
                  <span className="font-medium text-warning-foreground">
                    Menschliche Freigabe: Neu trainierte Regeln werden erst nach Marketingfreigabe aktiv.
                  </span>
                </div>
                <Button onClick={approve} variant="gold" className="h-auto min-h-9 whitespace-normal py-2">
                  <ShieldCheck className="h-4 w-4" /> Marketingfreigabe: Neue Regeln für nächsten Versand anwenden
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
