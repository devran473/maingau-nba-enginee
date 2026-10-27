import { describe, it, expect } from "vitest";
import { POOL, POOL_BY_ID } from "@/data/pitchPool";
import { applyEventToCustomer } from "@/lib/nba-store";
import { REPLAY_EVENTS } from "@/data/mockData";
import {
  explorationMetrics, decisionKey, pendingDecisions, selectionSummary, confidenceFor,
  applyPolicy,
  applyRetrain,
  BASE_MODEL,
  enforceProfiling,
  isProfilingBlocked,
  pickSample,
  profilingState,
  RETRAINED_CLV,
} from "@/lib/pitch";

const seq = (vals: number[]) => {
  let i = 0;
  return () => vals[i++ % vals.length] ?? 0.5;
};

describe("customer randomizer", () => {
  it("picks 5 distinct customers and always includes a profiling-restricted profile", () => {
    const sample = pickSample(POOL, 5, seq([0.9, 0.1, 0.7, 0.3, 0.5, 0.2, 0.8, 0.4]));
    expect(sample).toHaveLength(5);
    expect(new Set(sample.map((c) => c.customer_id)).size).toBe(5);
    expect(sample.some((c) => isProfilingBlocked(c))).toBe(true);
  });

  it("pool covers the consent edge cases and the required archetypes", () => {
    expect(POOL.some((c) => profilingState(c) === "not_given")).toBe(true);
    expect(POOL.some((c) => profilingState(c) === "withdrawn")).toBe(true);
    expect(POOL.some((c) => c.dunning_level > 0 && c.current_nba.action_type === "service")).toBe(true);
    expect(POOL.some((c) => c.current_nba.action_type === "retention")).toBe(true);
    expect(POOL.some((c) => c.name === "Tobias Rauch" && c.current_nba.product_id === "P-SL-01")).toBe(true);
    expect(POOL.some((c) => c.active_lines.includes("Autostrom") && c.current_nba.action_type === "sales")).toBe(true);
  });

  it("never shows a personalized offer for a customer without profiling consent", () => {
    for (const c of POOL.filter(isProfilingBlocked)) {
      expect(["P-STD-01", "P-NONE-00"]).toContain(c.current_nba.product_id);
      expect(c.current_nba.action_type).toBe("service");
      expect(c.current_nba.delta_clv_eur).toBe(0);
    }
  });

  it("a stream event cannot reintroduce a personalized offer for a restricted customer", () => {
    const restricted = POOL_BY_ID.get("MG-100418")!;
    const after = enforceProfiling(applyEventToCustomer(restricted, REPLAY_EVENTS.find((e) => e.event_id === "EVT-9003")!));
    expect(after.current_nba.product_id).toBe("P-STD-01");
    expect(after.current_nba.action_type).toBe("service");
  });

  it("leaves customers with profiling consent untouched", () => {
    const ok = POOL_BY_ID.get("MG-100027")!;
    expect(enforceProfiling(ok)).toBe(ok);
  });
});

describe("closed-loop re-training", () => {
  it("moves the global KPIs to the post-retrain figures", () => {
    const m = applyRetrain(BASE_MODEL);
    expect(m.clv).toBe(RETRAINED_CLV);
    expect(m.clv).toBe(162400);
    expect(m.conversion).toBe(9.2);
    expect(m.h105.confirmed).toBe(true);
    expect(m.retrained).toBe(true);
  });

  it("keeps the policy off until a marketer approves it", () => {
    const retrained = applyRetrain(BASE_MODEL);
    expect(retrained.policyApplied).toBe(false);
    expect(applyPolicy(retrained).policyApplied).toBe(true);
  });
});

describe("exploration financial anchors", () => {
  it("defaults to 148250 at ten percent", () => { expect(explorationMetrics(10).clv).toBe(148250); });
  it("costs 9150 at thirty percent and speeds learning by 35 percent", () => { expect(explorationMetrics(30)).toEqual({ clv: 139100, cost: 9150, learningGain: 35 }); });
  it("maximizes immediate profit to 151200 at five percent", () => { expect(explorationMetrics(5).clv).toBe(151200); });
  it("retains retraining gain while charging exploration cost", () => { expect(explorationMetrics(30, 162400).clv).toBe(153250); });
});
describe("realistic NLP demo scores", () => {
  for (const [name, score] of Object.entries({ "Laura Schmidt": 88, "Maximilian Weber": 91, "Sarah Lindemann": 84, "Dr. Klaus Hoffmann": 93 })) {
    it(`uses the specified score for ${name}`, () => { expect(confidenceFor(name, 100)).toBe(score); });
  }
  it("limits all pool and replay scores to 82–94", () => {
    const scores = [...POOL.map(c => c.current_nba.tone_confidence), ...REPLAY_EVENTS.map(e => {
      const customer = POOL_BY_ID.get(e.customer_id);
      if (!customer) throw new Error("Missing customer");
      return applyEventToCustomer(customer, e).current_nba.tone_confidence;
    })];
    for (const score of scores) { expect(score).toBeGreaterThanOrEqual(82); expect(score).toBeLessThanOrEqual(94); }
  });
});
describe("individual cross-channel approvals", () => {
  it("includes Elena's App Push decision", () => { expect(pendingDecisions(POOL, {}).find(c => c.name === "Elena Rostova")?.current_nba.channel).toBe("app_push"); });
  it("calculates only selected profit and distinct channels", () => {
    const selected = POOL.filter(c => ["Laura Schmidt", "Elena Rostova"].includes(c.name));
    const summary = selectionSummary(POOL, selected.map(decisionKey));
    expect(summary.count).toBe(2); expect(summary.profit).toBe(263); expect(summary.channels).toBe(2);
  });
  it("removes only individually approved or rejected actions", () => {
    const laura = POOL.find(c => c.name === "Laura Schmidt");
    const elena = POOL.find(c => c.name === "Elena Rostova");
    if (!laura || !elena) throw new Error("Missing demo profiles");
    const pending = pendingDecisions(POOL, { [decisionKey(laura)]: "approved", [decisionKey(elena)]: "rejected" });
    expect(pending.some(c => c.customer_id === laura.customer_id)).toBe(false);
    expect(pending.some(c => c.customer_id === elena.customer_id)).toBe(false);
    expect(pending.some(c => c.name === "Maximilian Weber")).toBe(true);
  });
  it("never queues a contact-fatigue no-action fallback", () => { expect(pendingDecisions(POOL, {}).some(c => c.current_nba.product_id === "P-NONE-00")).toBe(false); });
});
