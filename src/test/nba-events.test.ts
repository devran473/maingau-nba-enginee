import { describe, it, expect } from "vitest";
import { applyEventToCustomer } from "@/lib/nba-store";
import { INITIAL_CUSTOMERS, REPLAY_EVENTS } from "@/data/mockData";

const get = (id: string) => INITIAL_CUSTOMERS.find((c) => c.customer_id === id)!;
const evt = (id: string) => REPLAY_EVENTS.find((e) => e.event_id === id)!;

describe("event replay", () => {
  it("consent withdrawal switches email to portal pop-up", () => {
    const after = applyEventToCustomer(get("MG-100027"), evt("EVT-9003"));
    expect(after.consents.marketing_email).toBe(false);
    expect(after.current_nba.channel).toBe("portal_popup");
  });
  it("3rd failed charge overrides sales with service P-SV-01", () => {
    const after = applyEventToCustomer(get("MG-100142"), evt("EVT-9002"));
    expect(after.current_nba.action_type).toBe("service");
    expect(after.current_nba.product_id).toBe("P-SV-01");
  });
  it("gas deregistration triggers heat pump tariff P-EN-03 and drops Gas", () => {
    const after = applyEventToCustomer(get("MG-100086"), evt("EVT-9001"));
    expect(after.current_nba.product_id).toBe("P-EN-03");
    expect(after.active_lines).not.toContain("Gas");
  });
});
