import { describe, expect, it } from "vitest";
import { analyzePassword, createStrongPassword } from "./passwordAnalysis";

describe("password analysis strength score", () => {
  it("returns a transparent bounded local score for a predictable sample", () => {
    const assessment = analyzePassword("password123");

    expect(assessment).not.toBeNull();
    expect(assessment?.strength).toBe("Very weak");
    expect(assessment?.strengthScore).toBeGreaterThanOrEqual(0);
    expect(assessment?.strengthScore).toBeLessThanOrEqual(100);
    expect(assessment?.entropyBits).toBeLessThan(20);
  });

  it("scores an independently varied long value as stronger than a predictable sample", () => {
    const predictable = analyzePassword("password123");
    const varied = analyzePassword("aB9!cD2#eF3$gH4%jK5&");

    expect(varied?.strengthScore).toBeGreaterThan(predictable?.strengthScore ?? 0);
    expect(varied?.strength).toBe("Excellent");
  });
});

describe("local strong alternatives", () => {
  it("creates a 22-character mixed-class value without external input", () => {
    const value = createStrongPassword();

    expect(value).toHaveLength(22);
    expect(value).toMatch(/[a-z]/);
    expect(value).toMatch(/[A-Z]/);
    expect(value).toMatch(/\d/);
    expect(value).toMatch(/[^A-Za-z0-9]/);
  });
});
