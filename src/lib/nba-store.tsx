import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { REPLAY_EVENTS, type StreamEvent } from "@/data/mockData";
import { DEFAULT_CUSTOMERS, POOL, POOL_BY_ID } from "@/data/pitchPool";
import {
  BANDIT_DEFAULT_EXPLORATION,
  type DecisionStatus,
  applyPolicy,
  applyRetrain,
  BASE_MODEL,
  enforceProfiling,
  pickSample,
  type ModelState,
  type PoolCustomer,
} from "@/lib/pitch";

export type Feedback = { customer_id: string; action: string; at: string; note?: string | undefined };

interface Store {
  customers: PoolCustomer[];
  processed: Record<string, { before: PoolCustomer; after: PoolCustomer }>;
  feedback: Feedback[];
  recentlyUpdated: string | null;
  selectedId: string;
  setSelectedId: (id: string) => void;
  applyEvent: (evt: StreamEvent) => void;
  resetAll: () => void;
  logFeedback: (f: Omit<Feedback, "at">) => void;
  sampleRandom: () => PoolCustomer[];
  sampleIds: string[] | null;
  exploration: number;
  setExploration: (value: number) => void;
  decisions: Record<string, DecisionStatus>;
  resolveDecisions: (keys: string[], status: DecisionStatus) => void;
  model: ModelState;
  retrain: () => void;
  approvePolicy: () => void;
}

const Ctx = createContext<Store | null>(null);

/** Pure state transition: applies a stream event to a customer. */
export function applyEventToCustomer(c: PoolCustomer, evt: StreamEvent): PoolCustomer {
  const next: PoolCustomer = {
    ...c,
    churn_prob: evt.churn_after_event,
    current_nba: { ...evt.nba_after_event },
    consents: { ...c.consents },
    active_lines: [...c.active_lines],
    churn_drivers: [...c.churn_drivers.filter((d) => !d.startsWith("Keine"))],
  };
  if (evt.event_type === "consent_withdrawn") {
    next.consents.marketing_email = false;
    next.churn_drivers.push("E-Mail-Opt-out");
  }
  if (evt.event_type === "gas_meter_deregistered") {
    next.active_lines = next.active_lines.filter((l) => l !== "Gas");
    next.churn_drivers.push("Gaszähler stillgelegt");
  }
  if (evt.event_type === "charge_failed_third_time") {
    next.churn_drivers = ["3 fehlgeschlagene Ladungen (14 Tage)"];
  }
  if (evt.event_type === "complaint_created") next.has_open_complaint = true;
  return enforceProfiling(next);
}

export function NbaProvider({ children }: { children: ReactNode }) {
  const [customers, setCustomers] = useState<PoolCustomer[]>(DEFAULT_CUSTOMERS);
  const [processed, setProcessed] = useState<Store["processed"]>({});
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [recentlyUpdated, setRecentlyUpdated] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState(DEFAULT_CUSTOMERS[0]?.customer_id ?? "");
  const [exploration, setExploration] = useState(BANDIT_DEFAULT_EXPLORATION);
  const [decisions, setDecisions] = useState<Record<string, DecisionStatus>>({});
  const resolveDecisions = (keys: string[], status: DecisionStatus) => setDecisions(prev => ({ ...prev, ...Object.fromEntries(keys.map(key => [key, status])) }));
  const [model, setModel] = useState<ModelState>(BASE_MODEL);
  const [sampleIds, setSampleIds] = useState<string[] | null>(null);

  const applyEvent = useCallback((evt: StreamEvent) => {
    setCustomers((prev) => {
      // Falls back to the pool baseline when the customer is not in the current random sample.
      const before = prev.find((c) => c.customer_id === evt.customer_id) ?? POOL_BY_ID.get(evt.customer_id);
      if (!before) return prev;
      const after = enforceProfiling(applyEventToCustomer(before, evt));
      setProcessed((p) => ({ ...p, [evt.event_id]: { before, after } }));
      if (!prev.some((c) => c.customer_id === evt.customer_id)) return prev;
      return prev.map((c) => (c.customer_id === evt.customer_id ? after : c));
    });
    setRecentlyUpdated(evt.customer_id);
    setTimeout(() => setRecentlyUpdated(null), 2500);
  }, []);

  const resetAll = useCallback(() => {
    setCustomers(DEFAULT_CUSTOMERS);
    setProcessed({});
    setDecisions({});
    setSampleIds(null);
    setSelectedId(DEFAULT_CUSTOMERS[0]?.customer_id ?? "");
  }, []);

  const sampleRandom = useCallback(() => {
    const next = pickSample(POOL, 5);
    setCustomers(next);
    setSampleIds(next.map((c) => c.customer_id));
    setSelectedId(next[0]?.customer_id ?? "");
    return next;
  }, []);

  const logFeedback = useCallback((f: Omit<Feedback, "at">) => {
    setFeedback((prev) => [{ ...f, at: new Date().toLocaleTimeString("de-DE") }, ...prev]);
  }, []);

  const retrain = useCallback(() => setModel((m) => (m.retrained ? m : applyRetrain(m))), []);
  const approvePolicy = useCallback(() => setModel(applyPolicy), []);

  return (
    <Ctx.Provider
      value={{
        customers,
        processed,
        feedback,
        recentlyUpdated,
        selectedId,
        setSelectedId,
        applyEvent,
        resetAll,
        logFeedback,
        sampleRandom,
        sampleIds,
        exploration, setExploration, decisions, resolveDecisions,
        model,
        retrain,
        approvePolicy,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useNba() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useNba must be used inside NbaProvider");
  return v;
}

export { REPLAY_EVENTS };
