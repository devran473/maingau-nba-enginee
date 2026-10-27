import { useState } from "react";
import { toast } from "sonner";
import { MapPin, CalendarDays, Users, UserCheck, Info, ShieldAlert, Sparkles, Check, X, ThumbsUp, Zap, Smartphone, Flame, Car, MessageSquareQuote, Dices } from "lucide-react";
import { useNba } from "@/lib/nba-store";
import { ActionBadge, ChannelBadge, churnTone, CustomerProfilingBadge, eur } from "./shared";
import { profilingState } from "@/lib/pitch";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const lineIcon: Record<string, typeof Zap> = { Strom: Zap, Gas: Flame, Mobilfunk: Smartphone, Autostrom: Car };
const contractName: Record<string, string> = { Strom: "StromKomfort", Gas: "GasKomfort", Mobilfunk: "Mobil S", Autostrom: "Autostrom Flex" };

export function CustomerTab() {
  const { customers, selectedId, setSelectedId, logFeedback, feedback, recentlyUpdated, sampleRandom, sampleIds } = useNba();
  const [dismissing, setDismissing] = useState(false);
  const [reason, setReason] = useState("");
  const c = customers.find((x) => x.customer_id === selectedId) ?? customers[0];
  if (!c) return <p>Keine Kunden verfügbar.</p>;
  const nba = c.current_nba;
  const tone = churnTone(c.churn_prob);

  const household = (c.birth_year % 4) + 1;
  const serviceCost = c.has_open_complaint ? 184 : c.churn_drivers.some((d) => d.includes("Lad")) ? 96 : 32;

  const profiling = profilingState(c);
  const consents = [
    { k: "E-Mail-Marketing", ok: c.consents.marketing_email, v: c.consents.marketing_email ? "Erteilt" : "Widerrufen" },
    { k: "Portal-Personalisierung", ok: c.consents.portal_app, v: c.consents.portal_app ? "Erteilt" : "Widerrufen" },
    { k: "Profiling / Analysen", ok: profiling === "granted", v: profiling === "granted" ? "Erteilt" : profiling === "withdrawn" ? "Widerrufen" : "Nicht erteilt" },
    { k: "Telefonkontakt", ok: c.consents.phone, v: c.consents.phone ? "Erteilt" : "Widerrufen" },
  ];

  const act = (action: string, note?: string) => {
    logFeedback({ customer_id: c.customer_id, action, note });
    toast.success(`${action} protokolliert`, { description: `${c.customer_id} · ${nba.product_name}` });
  };

  const sample = () => {
    const next = sampleRandom();
    toast.success("5 zufällige Kunden ausgewählt", { description: next.map((x) => x.customer_id).join(" · ") });
  };

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-medium text-muted-foreground">Kunde</span>
          <Select value={c.customer_id} onValueChange={setSelectedId}>
            <SelectTrigger className="w-full bg-card sm:w-80"><SelectValue /></SelectTrigger>
            <SelectContent>
              {customers.map((x) => (
                <SelectItem key={x.customer_id} value={x.customer_id}>
                  {x.customer_id} · {x.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" variant="secondary" onClick={sample}>
            <Dices className="h-4 w-4" /> 5 zufällige Kunden auswählen
          </Button>
          {sampleIds && (
            <span className="text-xs text-muted-foreground">Zufallsstichprobe aktiv · {sampleIds.length} Profile</span>
          )}
        </div>

        <div className={cn("rounded-xl border bg-card p-6 shadow-card", recentlyUpdated === c.customer_id && "flash-update")}>
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div>
              <div className="font-mono text-xs text-muted-foreground">{c.customer_id}</div>
              <h2 className="mt-1 text-2xl font-bold">{c.name}</h2>
              <div className="mt-2 flex flex-wrap gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{c.city}</span>
                <span className="flex items-center gap-1"><CalendarDays className="h-4 w-4" />Kunde seit {new Date(c.customer_since).toLocaleDateString("de-DE")}</span>
                <span className="flex items-center gap-1"><Users className="h-4 w-4" />{household} Pers. Haushalt</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {c.active_lines.map((l) => {
                  const I = lineIcon[l] ?? Zap;
                  return (
                    <span key={l} className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
                      <I className="h-3.5 w-3.5 text-accent" />{contractName[l] ?? l}
                    </span>
                  );
                })}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">CLV</div>
                <div className="font-display text-2xl font-bold">{eur(c.clv_eur)}</div>
              </div>
              <div className="w-36">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Abwanderungsrisiko</div>
                <div className={cn("font-display text-2xl font-bold", tone.text)}>{Math.round(c.churn_prob * 100)}%</div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-secondary">
                  <div className={cn("h-full transition-all duration-700", tone.bar)} style={{ width: `${Math.min(100, c.churn_prob * 200)}%` }} />
                </div>
              </div>
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Servicekosten 12 Monate</div>
                <div className="font-display text-2xl font-bold">{eur(serviceCost)}</div>
              </div>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            {c.churn_drivers.map((d) => (
              <span key={d} className="rounded-md bg-secondary px-2 py-1 text-muted-foreground">{d}</span>
            ))}
            {c.dunning_level > 0 && <span className="rounded-md bg-destructive/10 px-2 py-1 font-semibold text-destructive">Mahnstufe {c.dunning_level}</span>}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
          <div className="rounded-xl border bg-card p-5 shadow-card">
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-2 font-semibold"><UserCheck className="h-4 w-4 text-accent" />Einwilligungen & Steuerung</h3>
              <Tooltip>
                <TooltipTrigger><Info className="h-4 w-4 text-muted-foreground" /></TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  Rechtsgrundlage: Art. 6 Abs. 1 lit. a DSGVO (Einwilligung) und §7 UWG (keine unerwünschte Werbung). Widerrufe gelten sofort.
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="mt-4 space-y-2">
              {consents.map((x) => (
                <div key={x.k} className="flex items-center justify-between rounded-lg bg-secondary px-3 py-2 text-sm">
                  <span>{x.k}</span>
                  <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-semibold", x.ok ? "bg-success text-success-foreground" : "bg-destructive text-destructive-foreground")}>
                    {x.v}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-6">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Rückmeldungsprotokoll</div>
              <div className="mt-2 max-h-40 space-y-1 overflow-y-auto text-xs">
                {feedback.filter((f) => f.customer_id === c.customer_id).map((f, i) => (
                  <div key={i} className="rounded bg-secondary px-2 py-1"><span className="font-mono text-muted-foreground">{f.at}</span> · {f.action}{f.note ? ` — ${f.note}` : ""}</div>
                ))}
                {!feedback.some((f) => f.customer_id === c.customer_id) && <div className="text-muted-foreground">Noch keine Rückmeldung vorhanden.</div>}
              </div>
            </div>
          </div>

          <div className={cn("relative overflow-hidden rounded-xl bg-gradient-navy p-6 text-navy-foreground shadow-glow", recentlyUpdated === c.customer_id && "flash-update")}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-accent">
                <Sparkles className="h-4 w-4" /> Nächste beste Aktion
              </div>
              <CustomerProfilingBadge c={c} onDark />
            </div>
            <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
              <div>
                <div className="font-mono text-xs text-navy-muted">{nba.product_id}</div>
                <h3 className="text-2xl font-bold">{nba.product_name}</h3>
                <div className="mt-2"><ActionBadge type={nba.action_type} /></div>
              </div>
              <div className="text-right">
                <div className="text-[11px] uppercase tracking-wider text-navy-muted">Erwarteter ΔCLV</div>
                <div className="font-display text-4xl font-bold text-accent">+{eur(nba.delta_clv_eur)}</div>
              </div>
            </div>
            <div className="mt-5 inline-flex flex-wrap items-center gap-2 rounded-full border border-navy-muted/30 px-4 py-1.5 text-sm">
              Kanal: <ChannelBadge channel={nba.channel} />
              <span className="text-navy-muted">|</span> Tonalität: <b>{nba.tone}</b>
              <span className="text-navy-muted">({nba.tone_confidence}% NLP-Konfidenz)</span>
            </div>
            <p className="mt-2 flex items-center gap-1.5 text-xs text-navy-muted"><Info className="h-3.5 w-3.5 shrink-0" />Ermittelt via Text-Mining aus Ticket-Historie &amp; Kundenanrufen</p>
            {nba.blocked_by_hard_rule && (
              <div className="mt-4 flex items-start gap-2 rounded-lg bg-destructive/20 px-3 py-2 text-sm">
                <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" /> {nba.blocked_by_hard_rule}
              </div>
            )}
            <div className="mt-4 rounded-lg border-l-4 border-accent bg-navy-foreground/5 p-4">
              <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-navy-muted"><MessageSquareQuote className="h-3.5 w-3.5" />Begründung</div>
              <p className="mt-1 text-base font-semibold leading-snug">{nba.reason}</p>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <Button className="bg-gradient-amber font-semibold text-accent-foreground hover:opacity-90" onClick={() => act("Annehmen & anbieten")}>
                <Check className="h-4 w-4" /> Annehmen & anbieten
              </Button>
              <Button variant="secondary" onClick={() => setDismissing((v) => !v)}>
                <X className="h-4 w-4" /> Ablehnen (mit Begründung)
              </Button>
              <Button variant="outline" className="border-success bg-transparent text-success-foreground hover:bg-success" onClick={() => act("Kunde hat angenommen")}>
                <ThumbsUp className="h-4 w-4" /> Kunde hat angenommen
              </Button>
            </div>
            {dismissing && (
              <div className="mt-3 space-y-2">
                <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Warum wird die Empfehlung verworfen?" className="bg-card text-card-foreground" />
                <Button size="sm" variant="secondary" disabled={!reason.trim()} onClick={() => { act("Abgelehnt", reason.trim()); setReason(""); setDismissing(false); }}>
                  Ablehnung protokollieren
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
