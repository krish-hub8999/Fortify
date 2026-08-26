import { describe, expect, it } from "vitest";
import { sanitizedReportInputSchema } from "./passwordReports";

describe("extension bridge input boundary", () => {
  it("accepts only the aggregate fields a sanitized extension export needs", () => {
    const valid = sanitizedReportInputSchema.safeParse({
      attackerModel: "offline-fast",
      strength: "Strong",
      score: 3,
      entropyBits: 62,
    });
    expect(valid.success).toBe(true);
  });

  it("rejects payloads that include raw password fields", () => {
    const invalid = sanitizedReportInputSchema.safeParse({
      attackerModel: "offline-fast",
      strength: "Strong",
      score: 3,
      entropyBits: 62,
      password: "must-not-persist",
    });
    expect(invalid.success).toBe(false);
  });
});
