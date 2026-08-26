import express from "express";
import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  authenticateRequest: vi.fn(),
  getSecurityPreference: vi.fn(),
  saveSecurityPreference: vi.fn(),
  listSecurityReportExports: vi.fn(),
  createSecurityReportExport: vi.fn(),
  storagePut: vi.fn(),
}));

vi.mock("./_core/sdk", () => ({ sdk: { authenticateRequest: mocks.authenticateRequest } }));
vi.mock("./db", () => ({
  getSecurityPreference: mocks.getSecurityPreference,
  saveSecurityPreference: mocks.saveSecurityPreference,
  listSecurityReportExports: mocks.listSecurityReportExports,
  createSecurityReportExport: mocks.createSecurityReportExport,
}));
vi.mock("./storage", () => ({ storagePut: mocks.storagePut }));

import { registerExtensionBridge } from "./extensionBridge";

const user = { id: 77, name: "Extension Test User" };

async function withBridgeServer(run: (baseUrl: string) => Promise<void>) {
  const app = express();
  app.use(express.json());
  registerExtensionBridge(app);
  const server = await new Promise<ReturnType<typeof app.listen>>((resolve) => {
    const instance = app.listen(0, () => resolve(instance));
  });
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Test server address unavailable");
  try {
    await run(`http://127.0.0.1:${address.port}`);
  } finally {
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
}

afterEach(() => vi.clearAllMocks());

describe("extension bridge routes", () => {
  it("saves a preference for an authenticated extension user and returns Chrome-extension CORS headers", async () => {
    mocks.authenticateRequest.mockResolvedValue(user);
    mocks.saveSecurityPreference.mockResolvedValue({ userId: user.id, attackerModel: "offline-slow" });

    await withBridgeServer(async (baseUrl) => {
      const response = await fetch(`${baseUrl}/api/extension/preference`, {
        method: "POST",
        headers: { Origin: "chrome-extension://testingid", "Content-Type": "application/json" },
        body: JSON.stringify({ attackerModel: "offline-slow" }),
      });

      expect(response.status).toBe(200);
      expect(response.headers.get("access-control-allow-origin")).toBe("chrome-extension://testingid");
      expect(await response.json()).toEqual({ userId: user.id, attackerModel: "offline-slow" });
      expect(mocks.saveSecurityPreference).toHaveBeenCalledWith(user.id, "offline-slow");
    });
  });

  it("stores and lists a sanitized report without receiving password content", async () => {
    mocks.authenticateRequest.mockResolvedValue(user);
    mocks.storagePut.mockResolvedValue({ key: "reports/77/export.json", url: "/manus-storage/reports/77/export.json" });
    mocks.createSecurityReportExport.mockResolvedValue({ id: 4, userId: user.id, fileUrl: "/manus-storage/reports/77/export.json" });
    mocks.listSecurityReportExports.mockResolvedValue([{ id: 4, userId: user.id, fileUrl: "/manus-storage/reports/77/export.json" }]);

    await withBridgeServer(async (baseUrl) => {
      const createResponse = await fetch(`${baseUrl}/api/extension/reports`, {
        method: "POST",
        headers: { Origin: "chrome-extension://testingid", "Content-Type": "application/json" },
        body: JSON.stringify({ attackerModel: "offline-fast", strength: "Strong", score: 3, entropyBits: 62 }),
      });

      expect(createResponse.status).toBe(200);
      expect(mocks.storagePut).toHaveBeenCalledWith(
        expect.stringContaining(`password-strength-reports/${user.id}/`),
        expect.not.stringContaining("must-not-persist"),
        "application/json",
      );
      const storedJson = mocks.storagePut.mock.calls[0]?.[1] as string;
      expect(storedJson).toContain('"strength": "Strong"');
      expect(storedJson).not.toContain("must-not-persist");

      const listResponse = await fetch(`${baseUrl}/api/extension/reports`, {
        headers: { Origin: "chrome-extension://testingid" },
      });
      expect(listResponse.status).toBe(200);
      expect(await listResponse.json()).toEqual([{ id: 4, userId: user.id, fileUrl: "/manus-storage/reports/77/export.json" }]);
    });
  });
});
