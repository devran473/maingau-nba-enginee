import { Fragment, useMemo, useState, useEffect } from "react";
import { toast } from "sonner";
import { Euro, Users, PieChart, ShieldCheck, ShieldAlert, Send, Layers, ExternalLink, TrendingUp, X } from "lucide-react";
import { useNba } from "@/lib/nba-store";
import { decisionKey, effectiveStatus, explorationMetrics, pendingDecisions, selectionSummary } from "@/lib/pitch";
import { ActionBadge, ChannelBadge, ComplianceBadge, CustomerProfilingBadge, StatusBadge, eur, primarySegment, channelMeta } from "./shared";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { HypothesisEngine } from "./HypothesisEngine";
import { RetrainSimulator } from "./RetrainSimulator";
import { cn } from "@/lib/utils";

function Seg({ value, options, onChange, label }: { value: string; options: string[]; onChange: (v: string) => void; label: string }) {
  return <div className="flex flex-col gap-1.5"><span className="micro-label">{label}</span><div className="segmented">{options.map(o => <Button key={o} variant={value === o ? "segmentActive" : "segment"} onClick={() => onChange(o)} aria-pressed={value === o}>{o}</Button>)}</div></div>;
}

function AnimatedProfit({ value }: { value: number }) {
  const [display, setDisplay] = useState(value);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setDisplay(value); return; }
    const from = display;
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => { const progress = Math.min(1, (now - start) / 250); setDisplay(Math.round(from + (value - from) * progress)); if (progress < 1) frame = requestAnimationFrame(tick); };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);
  return <span>{eur(display)}</span>;
}

export function MarketingTab({ onOpenCustomer }: { onOpenCustomer: (id: string) => void }) {
  const { customers, recentlyUpdated, model, exploration, decisions, resolveDecisions } = useNba();
  const [line, setLine] = useState("Alle");
  const [action, setAction] = useState("Alle");
  const [risk, setRisk] = useState("Alle");
  const [channel, setChannel] = useState("Alle");
  const [fatigue, setFatigue] = useState(true);
  const [selected, setSelected] = useState<string[]>([]);
  const financial = explorationMetrics(exploration, model.clv);
  const rows = useMemo(() => customers.filter(c => {
    if (line !== "Alle" && !c.active_lines.includes(line)) return false;
    const t = c.current_nba.action_type;
    if (action === "Vertrieb" && t !== "sales" && t !== "upsell") return false;
    if (action === "Bindung" && t !== "retention") return false;
    if (action === "Nur Service" && t !== "service") return false;
    const risky = c.dunning_level > 0 || c.has_open_complaint;
    if (risk === "Ohne Risiko" && risky) return false;
    if (risk === "Mahnung / Beschwerde" && !risky) return false;
    return channel === "Alle" || channelMeta[c.current_nba.channel].label === channel;
  }), [customers, line, action, risk, channel]);
  const pending = pendingDecisions(customers, decisions);
  const summary = selectionSummary(pending, selected);
  const allChecked = pending.length > 0 && summary.count === pending.length;
  const resolve = (status: "approved" | "rejected") => {
    if (!summary.count) return;
    resolveDecisions(summary.selected.map(decisionKey), status);
    setSelected([]);
    if (status === "rejected") { toast("Ausgewählte Aktionen abgelehnt", { description: `${summary.count} Entscheidungen verworfen.` }); return; }
    toast.success("Ausgewählte Aktionen freigegeben", { description: `Demo-Übergabe: ${summary.count} Aktionen über ${summary.channels} Kanäle · ${fatigue ? "Kontaktschutz 1/30 Tage aktiviert" : "Kontaktschutz deaktiviert"}. Kein echter Versand.` });
    if (summary.selected.some(c => c.current_nba.channel === "app_push")) toast.success("Erfolgreich an das MAINGAU App-Push-Gateway übermittelt", { description: "Simulierte Übergabe im Prototyp — kein echter Versand." });
  };
  const kpis = [
    { label: "Gesamter erwarteter CLV-Zuwachs (ΔCLV)", value: <AnimatedProfit value={financial.clv} />, icon: Euro, hint: model.retrained ? "Nach Neutraining · explorationsbereinigt" : "Explorationsbereinigter Testpool" },
    { label: "Konvertierungsrate (Kontrollgruppen-bereinigt)", value: `${model.conversion.toLocaleString("de-DE", { minimumFractionDigits: 1 })}%`, icon: TrendingUp, hint: model.retrained ? "+2,8 Prozentpunkte gegenüber Kontrollgruppe" : "Kontrollgruppen-bereinigte Basis" },
    { label: "Aktive Testkunden", value: "750", icon: Users, hint: "Synthetischer Testpool" },
    { label: "Aktions-Aufteilung (Vertrieb / Bindung / Service)", value: "42 / 35 / 23", icon: PieChart, hint: "Vertrieb · Bindung · Service %" },
    { label: "DSGVO-Compliance", value: "100%", icon: ShieldCheck, hint: "Konsequente Einwilligungsprüfung" },
  ];
  return <div className="space-y-6">
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">{kpis.map(k => <div key={k.label} className="bento"><div className="flex items-start justify-between gap-2"><span className="micro-label min-h-12">{k.label}</span><k.icon className="h-4 w-4 shrink-0 text-accent" /></div><div className="mt-2 kpi-value tabular-nums">{k.value}</div><div className="mt-2 text-xs text-muted-foreground">{k.hint}</div></div>)}</div>
    <HypothesisEngine /><RetrainSimulator />
    <div className="bento flex flex-wrap gap-5">
      <Seg label="Geschäftsbereich" value={line} options={["Alle", "Strom", "Gas", "Mobilfunk", "Internet", "Autostrom"]} onChange={setLine} />
      <Seg label="Aktionstyp" value={action} options={["Alle", "Vertrieb", "Bindung", "Nur Service"]} onChange={setAction} />
      <Seg label="Mahnung / Risiko" value={risk} options={["Alle", "Ohne Risiko", "Mahnung / Beschwerde"]} onChange={setRisk} />
      <Seg label="Kanal" value={channel} options={["Alle", ...Object.values(channelMeta).map(c => c.label).filter(l => l !== "—")]} onChange={setChannel} />
    </div>
    <section className="min-w-0">
      <div className="mb-4 flex items-center justify-between"><h3 className="text-lg font-semibold">Kampagnenmatrix</h3><span className="text-xs text-muted-foreground">{rows.length} von {customers.length} Kunden</span></div>
      <div className="bento overflow-x-auto p-0"><table className="w-full text-sm"><thead className="bg-secondary text-left text-[11px] uppercase text-muted-foreground"><tr>{["Kunde", "Wohnort", "Segment", "Empfohlene Aktion", "Kanal", "Tonalität", "ΔCLV", "Status"].map(h => <th key={h} className="whitespace-nowrap px-4 py-4 font-semibold">{h}</th>)}</tr></thead><tbody>
        {rows.map((c, i) => { const flagged = !!c.current_nba.blocked_by_hard_rule; return <Fragment key={c.customer_id}><tr className={cn("border-t align-top", i % 2 === 1 && "bg-secondary/30", flagged && "border-l-4 border-l-warning bg-warning/10", recentlyUpdated === c.customer_id && "flash-update")}>
          <td className="px-4 py-4"><Button variant="link" size="sm" className="h-auto justify-start rounded-md bg-chart-2/10 px-2 py-1 font-mono text-xs text-chart-2" onClick={() => onOpenCustomer(c.customer_id)} aria-label={`${c.customer_id} in Kunden 360° öffnen`}>{c.customer_id}<ExternalLink className="h-3.5 w-3.5" /></Button><div className="mt-2 whitespace-nowrap text-base font-semibold">{c.name}</div></td>
          <td className="px-4 py-4">{c.city}</td><td className="px-4 py-4 text-muted-foreground">{primarySegment(c)}</td>
          <td className="min-w-56 px-4 py-4"><div className="text-base font-semibold">{c.current_nba.product_name}</div><div className="mt-2"><ActionBadge type={c.current_nba.action_type} /></div></td>
          <td className="px-4 py-4"><ChannelBadge channel={c.current_nba.channel} /></td><td className="px-4 py-4"><span className="inline-flex rounded-md bg-secondary px-3 py-1 font-semibold">{c.current_nba.tone}</span></td><td className="whitespace-nowrap px-4 py-4 font-display font-bold text-success">+{eur(c.current_nba.delta_clv_eur)}</td>
          <td className="min-w-44 px-4 py-4"><div className="flex flex-col items-start gap-2"><ComplianceBadge blocked={c.current_nba.blocked_by_hard_rule} /><CustomerProfilingBadge c={c} /><StatusBadge status={effectiveStatus(c, decisions)} /></div></td>
        </tr>{flagged && <tr className="border-l-4 border-l-warning bg-warning/10"><td colSpan={8} className="px-4 pb-4 text-xs font-medium text-warning-foreground"><ShieldAlert className="mr-1 inline h-3.5 w-3.5" />{c.current_nba.blocked_by_hard_rule} · Sichere Alternative erzwungen</td></tr>}</Fragment>; })}
        {!rows.length && <tr><td colSpan={8} className="py-10 text-center text-muted-foreground">Keine Kunden entsprechen diesen Filtern.</td></tr>}
      </tbody></table></div>
    </section>
    <section className="bento">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-4"><div><div className="flex items-center gap-2 text-xs font-semibold uppercase text-muted-foreground"><Layers className="h-4 w-4" />Kampagnensteuerung</div><h3 className="mt-1 text-lg font-semibold">Menschliche Freigabe</h3></div><label className="flex items-center gap-3 text-sm"><span>Kontaktschutz · max. 1 Kontakt / 30 Tage</span><Switch checked={fatigue} onCheckedChange={setFatigue} aria-label="Kontaktschutz" /></label></div>
      <div className="mb-4 border-l-4 border-success bg-success/10 px-4 py-4 text-sm font-semibold" aria-live="polite">Ausgewählte Aktionen: {summary.count} | Erwarteter Gesamtgewinn (ΔCLV): <span className="text-success">+{eur(summary.profit)}</span> | Freigabe-Bereit: {summary.channels} Kanäle</div>
      <label className="mb-3 flex w-fit cursor-pointer items-center gap-3 text-sm font-semibold"><Checkbox checked={allChecked ? true : summary.count ? "indeterminate" : false} disabled={!pending.length} onCheckedChange={checked => setSelected(checked ? pending.map(decisionKey) : [])} />Alle auswählen</label>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{pending.map(c => { const key = decisionKey(c); return <label key={key} className="flex cursor-pointer items-start gap-3 rounded-2xl bg-secondary/60 p-4 ring-1 ring-border transition hover:ring-accent/50"><Checkbox className="mt-1" aria-label={`${c.name} auswählen`} checked={selected.includes(key)} onCheckedChange={checked => setSelected(prev => checked ? [...prev, key] : prev.filter(k => k !== key))} /><div className="min-w-0 flex-1"><div className="font-semibold">{c.name}</div><div className="text-xs text-muted-foreground">{c.customer_id}</div><div className="my-2 text-sm">{c.current_nba.product_name}</div><div className="flex flex-wrap items-center gap-2"><ChannelBadge channel={c.current_nba.channel} /><span className="whitespace-nowrap rounded-md bg-success/10 px-2 py-1 text-xs font-bold text-success">+{eur(c.current_nba.delta_clv_eur)} ΔCLV</span></div><CustomerProfilingBadge c={c} /></div></label>; })}</div>
      {!pending.length && <p className="py-6 text-muted-foreground">Keine ausstehenden Entscheidungen – freigegebene und gesperrte Kunden benötigen keine Freigabe.</p>}
      <div className="mt-5 flex flex-wrap gap-3"><Button disabled={!summary.count} variant="gold" className="h-auto min-h-9 whitespace-normal py-2" onClick={() => resolve("approved")}><Send className="h-4 w-4" />Ausgewählte freigeben & pushen</Button><Button variant="outline" disabled={!summary.count} className="h-auto min-h-9 whitespace-normal py-2" onClick={() => resolve("rejected")}><X className="h-4 w-4" />Ausgewählte ablehnen</Button></div>
    </section>
  </div>;
}
