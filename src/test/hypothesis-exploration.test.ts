import { describe, expect, it } from "vitest";
import { explorationHypotheses } from "@/lib/pitch";

describe("live bandit hypothesis metrics", () => {
  it("H-104 sample follows round(55 + exploration * 2.5)", () => {
    expect([5, 10, 50].map(p => explorationHypotheses(p).h104.sample)).toEqual([68, 80, 180]);
  });
  it("H-104 uplift follows 14.2 + exploration * 0.16 to one decimal", () => {
    expect([5, 10, 50].map(p => explorationHypotheses(p).h104.uplift)).toEqual([15, 15.8, 22.2]);
  });
  it("H-104 significance follows its formula and caps at 99", () => {
    expect([5, 10, 50].map(p => explorationHypotheses(p).h104.significance)).toEqual([82, 85, 99]);
  });
  it("H-104 is confirmed at 90 percent, not below", () => {
    expect(explorationHypotheses(16).h104).toMatchObject({ significance: 89, confirmed: false, status: "In Erprobung (Signifikanz zu niedrig)" });
    expect(explorationHypotheses(17).h104).toMatchObject({ significance: 90, confirmed: true, status: "Bestätigt & integriert" });
  });
  it("H-105 sample follows round(30 + exploration * 2.5)", () => {
    expect([5, 10, 50].map(p => explorationHypotheses(p).h105.sample)).toEqual([43, 55, 155]);
  });
  it("H-105 uplift follows 5.1 + exploration * 0.13 to one decimal", () => {
    expect([5, 10, 50].map(p => explorationHypotheses(p).h105.uplift)).toEqual([5.8, 6.4, 11.6]);
  });
  it("H-105 significance follows its formula and caps at 98", () => {
    expect([5, 10, 50].map(p => explorationHypotheses(p).h105.significance)).toEqual([70, 75, 98]);
  });
  it("H-105 is validated at 90 percent, not below", () => {
    expect(explorationHypotheses(23).h105).toMatchObject({ significance: 89, confirmed: false, status: "In Erprobung (Exploration läuft)" });
    expect(explorationHypotheses(24).h105).toMatchObject({ significance: 90, confirmed: true, status: "Validiert" });
  });
});