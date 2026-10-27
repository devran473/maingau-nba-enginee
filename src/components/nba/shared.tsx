import { Mail, MonitorSmartphone, Phone, BellRing, Ban, ShieldAlert, ShieldCheck } from "lucide-react";
import type { CustomerNBA } from "@/data/mockData";
import { profilingState, type PoolCustomer, type ProfilingState } from "@/lib/pitch";
import { cn } from "@/lib/utils";

type Nba = CustomerNBA["current_nba"];

export const eur = (n: number) =>
  new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);

export const channelMeta: Record<Nba["channel"], { label: string; icon: typeof Mail }> = {
  email: { label: "E-Mail", icon: Mail },
  portal_popup: { label: "Portal Pop-up", icon: MonitorSmartphone },
  agent_phone: { label: "Service-Anruf", icon: Phone },
  app_push: { label: "App Push", icon: BellRing },
  none: { label: "—", icon: Ban },
};

export const actionMeta: Record<Nba["action_type"], { label: string; cls: string }> = {
  sales: { label: "Vertrieb", cls: "bg-chart-2/10 text-chart-2 border-chart-2/30" },
  upsell: { label: "Tarifaufwertung", cls: "bg-chart-2/10 text-chart-2 border-chart-2/30" },
  retention: { label: "Bindung", cls: "bg-accent/15 text-warning-foreground border-accent/40" },
  service: { label: "Nur Service", cls: "bg-destructive/10 text-destructive border-destructive/30" },
};

export function ChannelBadge({ channel, onDark }: { channel: Nba["channel"]; onDark?: boolean }) {
  const m = channelMeta[channel];
  const Icon = m.icon;
  if (channel === "none") return <span className={cn("px-3 py-1 text-xs font-medium", onDark ? "text-navy-muted" : "text-muted-foreground")}>—</span>;
  return (
    <span className={cn("inline-flex whitespace-nowrap items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium", onDark ? "glass-pill" : channel === "app_push" ? "border bg-push/10 text-push border-push/30" : "border bg-secondary")}>
      <Icon className="h-3.5 w-3.5" /> {m.label}
    </span>
  );
}

export function ActionBadge({ type }: { type: Nba["action_type"] }) {
  const m = actionMeta[type];
  return (
    <span className={cn("inline-flex whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-semibold", m.cls)}>{m.label}</span>
  );
}

export function ComplianceBadge({ blocked }: { blocked?: string | undefined }) {
  return blocked ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-destructive px-2.5 py-0.5 text-xs font-semibold text-destructive-foreground">
      <ShieldAlert className="h-3.5 w-3.5" /> Vertrieb gesperrt
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-success px-2.5 py-0.5 text-xs font-semibold text-success-foreground">
      <ShieldCheck className="h-3.5 w-3.5" /> Zulässig
    </span>
  );
}

export function churnTone(p: number) {
  if (p < 0.15) return { bar: "bg-success", text: "text-success" };
  if (p <= 0.25) return { bar: "bg-warning", text: "text-warning-foreground" };
  return { bar: "bg-destructive", text: "text-destructive" };
}

/** Strict GDPR marker: shown whenever profiling/analytics consent is missing or withdrawn. */
export function ProfilingBadge({ state, onDark }: { state: ProfilingState; onDark?: boolean | undefined }) {
  if (state === "granted") return null;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        onDark ? "border-accent/60 bg-accent/15 text-accent" : "border-warning/50 bg-warning/15 text-warning-foreground",
      )}
    >
      <ShieldAlert className="h-3.5 w-3.5" />
      {`Profiling-Einwilligung ${state === "withdrawn" ? "widerrufen" : "nicht erteilt"} (Art. 6 DSGVO)`}
    </span>
  );
}

export function CustomerProfilingBadge({ c, onDark }: { c: PoolCustomer; onDark?: boolean | undefined }) {
  const state = profilingState(c);
  if (state === "granted") return null;
  return <ProfilingBadge state={state} onDark={onDark} />;
}

export function StatusBadge({ status }: { status: string }) {
  const cls = status === "Freigegeben" ? "bg-success/15 text-success" : status.startsWith("Gesperrt") || status === "Abgelehnt" ? "bg-destructive/10 text-destructive" : "bg-accent/20 text-warning-foreground";
  return <span className={cn("inline-flex whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors duration-500", cls)}>{status}</span>;
}

export function primarySegment(c: CustomerNBA) {
  if (c.active_lines.length > 1) return "Mehrproduktkunde";
  return c.active_lines[0] ?? "—";
}
