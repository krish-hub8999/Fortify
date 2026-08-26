/**
 * Field Manual persistence policy: reports contain only user-selected model
 * metadata and aggregate strength metrics. Raw passwords never cross this boundary.
 */
import { z } from "zod";

export const attackerModelSchema = z.enum([
  "online-protected",
  "offline-slow",
  "offline-fast",
]);

export const sanitizedReportInputSchema = z.object({
  attackerModel: attackerModelSchema,
  strength: z.enum(["Very weak", "Weak", "Fair", "Strong", "Excellent"]),
  score: z.number().int().min(0).max(4),
  entropyBits: z.number().int().min(1).max(120),
}).strict();

export type SanitizedReportInput = z.infer<typeof sanitizedReportInputSchema>;

const modelLabels: Record<SanitizedReportInput["attackerModel"], string> = {
  "online-protected": "Online, rate-limited service model",
  "offline-slow": "Offline, deliberately slow password-hash model",
  "offline-fast": "Offline, fast password-hash model",
};

export function buildSanitizedReport(input: SanitizedReportInput, generatedAt = new Date()) {
  return JSON.stringify(
    {
      reportType: "Fortify Field Notes sanitized assessment export",
      generatedAt: generatedAt.toISOString(),
      persistenceNotice: "This export intentionally excludes the entered password, password fragments, and pattern details.",
      attackerModel: {
        id: input.attackerModel,
        label: modelLabels[input.attackerModel],
      },
      assessment: {
        strength: input.strength,
        score: input.score,
        adjustedEntropyBits: input.entropyBits,
      },
    },
    null,
    2,
  );
}
