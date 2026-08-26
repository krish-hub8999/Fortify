/**
 * Chrome-extension bridge: accepts only aggregate assessment data; raw passwords
 * and browser-page content are neither accepted nor persisted by these routes.
 */
import type { Express, Request, Response } from "express";
import {
  createSecurityReportExport,
  getSecurityPreference,
  listSecurityReportExports,
  saveSecurityPreference,
} from "./db";
import { attackerModelSchema, buildSanitizedReport, sanitizedReportInputSchema } from "./passwordReports";
import { sdk } from "./_core/sdk";
import { storagePut } from "./storage";

function allowExtensionCors(req: Request, res: Response) {
  const origin = req.headers.origin;
  if (!origin || !origin.startsWith("chrome-extension://")) return false;

  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Vary", "Origin");
  return true;
}

async function authenticatedUser(req: Request, res: Response) {
  try {
    const user = await sdk.authenticateRequest(req);
    if (user) return user;
  } catch {
    // Return the same generic result for absent and invalid sessions.
  }
  res.status(401).json({ error: "sign_in_required" });
  return null;
}

export function registerExtensionBridge(app: Express) {
  app.use("/api/extension", (req, res, next) => {
    allowExtensionCors(req, res);
    if (req.method === "OPTIONS") {
      res.status(204).end();
      return;
    }
    next();
  });

  app.get("/api/extension/status", async (req, res) => {
    const user = await authenticatedUser(req, res);
    if (!user) return;
    res.json({ authenticated: true, userName: user.name ?? null });
  });

  app.get("/api/extension/preference", async (req, res) => {
    const user = await authenticatedUser(req, res);
    if (!user) return;
    const preference = await getSecurityPreference(user.id);
    res.json(preference ?? { attackerModel: "offline-fast" });
  });

  app.post("/api/extension/preference", async (req, res) => {
    const user = await authenticatedUser(req, res);
    if (!user) return;
    const parsed = attackerModelSchema.safeParse(req.body?.attackerModel);
    if (!parsed.success) {
      res.status(400).json({ error: "invalid_attacker_model" });
      return;
    }
    const preference = await saveSecurityPreference(user.id, parsed.data);
    res.json(preference);
  });

  app.get("/api/extension/reports", async (req, res) => {
    const user = await authenticatedUser(req, res);
    if (!user) return;
    res.json(await listSecurityReportExports(user.id));
  });

  app.post("/api/extension/reports", async (req, res) => {
    const user = await authenticatedUser(req, res);
    if (!user) return;
    const parsed = sanitizedReportInputSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "invalid_sanitized_report" });
      return;
    }

    const timestamp = new Date();
    const fileName = `fortify-extension-assessment-${timestamp.toISOString().replace(/[:.]/g, "-")}.json`;
    const stored = await storagePut(
      `password-strength-reports/${user.id}/${fileName}`,
      buildSanitizedReport(parsed.data, timestamp),
      "application/json",
    );
    const report = await createSecurityReportExport({
      userId: user.id,
      fileKey: stored.key,
      fileUrl: stored.url,
      fileName,
      contentType: "application/json",
      attackerModel: parsed.data.attackerModel,
      strength: parsed.data.strength,
      score: parsed.data.score,
      entropyBits: parsed.data.entropyBits,
    });
    res.json(report);
  });
}
