import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { NbaProvider } from "@/lib/nba-store";
import { POOL } from "@/data/pitchPool";
import { MarketingTab } from "@/components/nba/MarketingTab";
import { CustomerTab } from "@/components/nba/CustomerTab";
import { ReplayTab } from "@/components/nba/ReplayTab";

describe("ID-only customer disclosure", () => {
  it("never discloses personal customer names across the three views", () => {
    const views = [<MarketingTab onOpenCustomer={() => {}} />, <CustomerTab />, <ReplayTab onOpenCustomer={() => {}} />];
    for (const view of views) {
      const output = renderToStaticMarkup(<NbaProvider>{view}</NbaProvider>);
      expect(output).toMatch(/MG-100\d{3}/);
      for (const customer of POOL) expect(output).not.toContain(customer.name);
    }
  });
});