import { describe, expect, it } from "vitest";
import { buildSanitizedReport, sanitizedReportInputSchema } from "./passwordReports";

describe("sanitized report exports", () => {
  it("accepts only aggregate assessment fields", () => {
    const parsed = sanitizedReportInputSchema.parse({
      attackerModel: "offline-fast",
      strength: "Strong",
      score: 3,
      entropyBits: 62,
    });

    expect(parsed).toEqual({
      attackerModel: "offline-fast",
      strength: "Strong",
      score: 3,
      entropyBits: 62,
    });
  });

  it("creates a report that does not include a password field", () => {
    const report = JSON.parse(buildSanitizedReport({
      attackerModel: "online-protected",
      strength: "Fair",
      score: 2,
      entropyBits: 41,
    }, new Date("2026-08-26T00:00:00.000Z")));

    expect(report.assessment).toEqual({ strength: "Fair", score: 2, adjustedEntropyBits: 41 });
    expect(JSON.stringify(report).toLowerCase()).not.toContain("password\"");
    expect(report.persistenceNotice).toContain("excludes the entered password");
  });
});
