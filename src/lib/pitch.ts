import type { CustomerNBA } from "@/data/mockData";

export type ProfilingState = "granted" | "not_given" | "withdrawn";

/** A customer as held by the demo store: the mockData shape plus explicit GDPR profiling state. */
export interface PoolCustomer extends CustomerNBA {
  /** Explicit profiling/analytics state; falls back to consents.profiling when absent. */
  profiling_analytics?: ProfilingState;
  /** Which non-personalized fallback the compliance guard applies when profiling is missing. */
  fallback_kind?: "notice" | "no_action";
  /** Workflow status, derived by normalizeCustomer. */
  status?: CustomerStatus;
  /** Display label for the salutation, derived by normalizeCustomer. */
  tone_label?: string;
}

export type CustomerStatus = "Freigabe erforderlich" | "Freigegeben" | "Gesperrt (Kontaktschutz)" | "Gesperrt (Kein Profiling)";
export const TONE_FALLBACK_LABEL = "Sie (Standard-Fallback · kein NLP-Profiling)";

/**
 * Single source of truth that makes contradictory customer states impossible:
 * no profiling → Sie fallback, no NLP score, ΔCLV 0; no action → no channel; blocked → never queued.
 */
export function normalizeCustomer(c: PoolCustomer): PoolCustomer {
  const n = c.current_nba;
  const blocked = isProfilingBlocked(c);
  const noAction = n.product_id === "P-NONE-00";
  const status: CustomerStatus = noAction ? "Gesperrt (Kontaktschutz)" : blocked ? "Gesperrt (Kein Profiling)" : c.status ?? "Freigabe erforderlich";
  const tone = blocked ? "Sie" : n.tone;
  const tone_label = blocked ? TONE_FALLBACK_LABEL : `${n.tone} (${n.tone_confidence}% NLP-Konfidenz)`;
  const channel = noAction ? "none" : n.channel;
  const delta = blocked ? 0 : n.delta_clv_eur;
  if (c.status === status && c.tone_label === tone_label && n.tone === tone && n.channel === channel && n.delta_clv_eur === delta) return c;
  return { ...c, status, tone_label, current_nba: { ...n, tone, channel, delta_clv_eur: delta } };
}

/** Effective status including human decisions taken in this session. */
export function effectiveStatus(c: PoolCustomer, resolved: Record<string, DecisionStatus>): string {
  const d = resolved[decisionKey(c)];
  if (d === "approved") return "Freigegeben";
  if (d === "rejected") return "Abgelehnt";
  return normalizeCustomer(c).status ?? "Freigabe erforderlich";
}

export const PROFILING_FALLBACK_REASON =
  "Personalisierung wegen fehlender Profiling-Einwilligung gesperrt. Nicht personalisierte Alternative angewendet.";

export function profilingState(c: PoolCustomer): ProfilingState {
  if (c.profiling_analytics) return c.profiling_analytics;
  return c.consents.profiling ? "granted" : "withdrawn";
}

export function isProfilingBlocked(c: PoolCustomer) {
  return profilingState(c) !== "granted";
}

const FALLBACKS: Record<NonNullable<PoolCustomer["fallback_kind"]>, CustomerNBA["current_nba"]> = {
  notice: {
    product_id: "P-STD-01",
    product_name: "Nicht personalisierter Service-/Tarifhinweis",
    action_type: "service",
    channel: "portal_popup",
    tone: "Sie",
    tone_confidence: 88,
    delta_clv_eur: 0,
    reason: PROFILING_FALLBACK_REASON,
    blocked_by_hard_rule: "Profiling-Einwilligung fehlt (Art. 6 DSGVO) — personalisierte Angebote gesperrt",
  },
  no_action: {
    product_id: "P-NONE-00",
    product_name: "Keine Aktion (Kontaktschutz aktiv)",
    action_type: "service",
    channel: "portal_popup",
    tone: "Sie",
    tone_confidence: 88,
    delta_clv_eur: 0,
    reason: `${PROFILING_FALLBACK_REASON} Kontaktschutz (max. 1 Kontakt / 30 Tage) sperrt ausgehende Werbung.`,
    blocked_by_hard_rule: "Profiling-Einwilligung fehlt (Art. 6 DSGVO) — keine Kontaktaufnahme zulässig",
  },
};

/** Compliance guard: no personalized/behavioral offer may survive for a customer without profiling consent. */
export function enforceProfiling(c: PoolCustomer): PoolCustomer {
  const score = confidenceFor(c.name, c.current_nba.tone_confidence);
  const reason = c.current_nba.reason.replaceAll("Churn-Prävention", "Abwanderungsprävention").replaceAll("Retention", "Kundenbindung").replaceAll("Churn", "Abwanderung").replaceAll("Cross-Sell", "Zusatzangebot").replaceAll("E-Mail-Consent", "E-Mail-Einwilligung");
  const blocked = c.current_nba.blocked_by_hard_rule?.replaceAll("Sales geblockt", "Vertrieb gesperrt").replaceAll("Dunning Level", "Mahnstufe");
  if (score !== c.current_nba.tone_confidence || reason !== c.current_nba.reason || blocked !== c.current_nba.blocked_by_hard_rule) c = { ...c, current_nba: { ...c.current_nba, tone_confidence: score, reason, ...(blocked ? { blocked_by_hard_rule: blocked } : {}) } };
  if (!isProfilingBlocked(c)) return normalizeCustomer(c);
  const base = FALLBACKS[c.fallback_kind ?? "notice"];
  return normalizeCustomer({
    ...c,
    current_nba: {
      ...base,
      channel: c.consents.portal_app ? "portal_popup" : "email",
      tone: "Sie",
      tone_confidence: c.current_nba.tone_confidence,
    },
  });
}

/* ---------------------------------- hypotheses --------------------------------- */

export interface Hypothesis {
  id: string;
  title: string;
  sample: number;
  uplift: number;
  significance: number;
  status: string;
  confirmed: boolean;
}

export const HYPO_H104: Hypothesis = {
  id: "H-104",
  title:
    "E-Auto-Fahrer mit >3 öffentlichen Ladungen/Monat wechseln bei Du-Ansprache per In-App-Pop-up mit +22% höherer Wahrscheinlichkeit zu StromAktiv.",
  sample: 120,
  uplift: 18.4,
  significance: 96,
  status: "Bestätigt & integriert",
  confirmed: true,
};

export const HYPO_H105: Hypothesis = {
  id: "H-105",
  title:
    "Prosumer mit Einspeisezähler entscheiden sich schneller für das HEMS Starter-Set, wenn sie einen jährlichen SaaS-Rabatt statt eines Hardware-Rabatts erhalten.",
  sample: 45,
  uplift: 6.2,
  significance: 78,
  status: "Laufend (Explorationsphase)",
  confirmed: false,
};

/** Live demo estimates; retraining state remains separate from exploration projections. */
export function explorationHypotheses(explorationPct: number) {
  const h104Significance = Math.min(99, Math.round(78 + explorationPct * 0.7));
  const h105Significance = Math.min(98, Math.round(64 + explorationPct * 1.1));
  return {
    h104: {
      ...HYPO_H104,
      sample: Math.round(55 + explorationPct * 2.5),
      uplift: Number((14.2 + explorationPct * 0.16).toFixed(1)),
      significance: h104Significance,
      confirmed: h104Significance >= 90,
      status: h104Significance >= 90 ? "Bestätigt & integriert" : "In Erprobung (Signifikanz zu niedrig)",
    },
    h105: {
      ...HYPO_H105,
      sample: Math.round(30 + explorationPct * 2.5),
      uplift: Number((5.1 + explorationPct * 0.13).toFixed(1)),
      significance: h105Significance,
      confirmed: h105Significance >= 90,
      status: h105Significance >= 90 ? "Validiert" : "In Erprobung (Exploration läuft)",
    },
  };
}

/* --------------------------------- model state --------------------------------- */

export interface ModelState {
  clv: number;
  conversion: number;
  retrained: boolean;
  policyApplied: boolean;
  h105: Hypothesis;
}

export const BASE_MODEL: ModelState = {
  clv: 148250,
  conversion: 6.4,
  retrained: false,
  policyApplied: false,
  h105: HYPO_H105,
};

export const RETRAINED_CLV = 162400;
export const CONVERSION_GAIN_PP = 2.8;
export const BANDIT_DEFAULT_EXPLORATION = 10;

export const RETRAIN_STEPS = [
  "Konvertierungsereignisse sammeln…",
  "Mehrertrag gegenüber Kontrollgruppe prüfen…",
  "Annahmewahrscheinlichkeit im CLV-Modell neu berechnen…",
  "Entscheidungsregeln neu trainieren…",
];

export function applyRetrain(m: ModelState): ModelState {
  return {
    ...m,
    clv: RETRAINED_CLV,
    conversion: Math.round((m.conversion + CONVERSION_GAIN_PP) * 10) / 10,
    retrained: true,
    h105: { ...m.h105, sample: m.h105.sample + 50, uplift: 8.4, significance: 93, status: "Validiert", confirmed: true },
  };
}

export function applyPolicy(m: ModelState): ModelState {
  return { ...m, policyApplied: true };
}

/* ------------------------------- random sampling ------------------------------- */

export function shuffle<T>(arr: readonly T[], rng: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = a[i];
    const other = a[j];
    if (tmp === undefined || other === undefined) continue;
    a[i] = other;
    a[j] = tmp;
  }
  return a;
}

/**
 * Picks `size` distinct customers. At least one customer without profiling consent is
 * always included so the compliance fallback is demonstrable in every sample.
 */
export function pickSample(pool: readonly PoolCustomer[], size = 5, rng: () => number = Math.random): PoolCustomer[] {
  const norm = pool.map(normalizeCustomer);
  const restricted = norm.filter(isProfilingBlocked);
  const profitablePending = norm.filter((c) => c.status === "Freigabe erforderlich" && c.current_nba.delta_clv_eur > 0);
  const approved = norm.filter((c) => c.status === "Freigegeben");
  const out: PoolCustomer[] = [];
  const push = (c: PoolCustomer | undefined) => {
    if (c && out.length < size && !out.includes(c)) out.push(c);
  };
  push(shuffle(restricted, rng)[0]);
  for (const c of shuffle(profitablePending, rng).slice(0, 2)) push(c);
  push(shuffle(approved, rng)[0]);
  for (const c of shuffle(norm, rng)) push(c);
  return shuffle(out, rng);
}

/** Prototype anchors; retain the retraining gain while applying exploration cost. */
export function explorationMetrics(exploration: number, baseline = BASE_MODEL.clv) {
  const share = Math.max(0, Math.min(50, exploration));
  const adjustment = share <= 10 ? (10 - share) * 590 : -(share - 10) * 457.5;
  return { clv: Math.round(baseline + adjustment), cost: Math.round(-adjustment), learningGain: Math.round(Math.max(0, share - 10) * 1.75) };
}

export function confidenceFor(name: string, score: number) {
  const scores: Record<string, number> = { "Laura Schmidt": 88, "Maximilian Weber": 91, "Sarah Lindemann": 84, "Dr. Klaus Hoffmann": 93 };
  return scores[name] ?? Math.max(82, Math.min(94, Number.isFinite(score) ? Math.round(score) : 88));
}

export type DecisionStatus = "approved" | "rejected";
export function decisionKey(c: PoolCustomer) {
  const n = c.current_nba;
  return [c.customer_id, n.product_id, n.channel, n.delta_clv_eur, n.reason].join("|");
}
export function pendingDecisions(customers: PoolCustomer[], resolved: Record<string, DecisionStatus>) {
  return customers.map(enforceProfiling).filter(c => c.status === "Freigabe erforderlich" && !resolved[decisionKey(c)]);
}
export function selectionSummary(customers: PoolCustomer[], keys: string[]) {
  const selected = customers.filter(c => keys.includes(decisionKey(c)));
  return { selected, count: selected.length, profit: selected.reduce((sum, c) => sum + c.current_nba.delta_clv_eur, 0), channels: new Set(selected.map(c => c.current_nba.channel)).size };
}
