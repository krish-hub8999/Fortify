import { describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const mocks = vi.hoisted(() => ({
  getSecurityPreference: vi.fn(),
  saveSecurityPreference: vi.fn(),
  listSecurityReportExports: vi.fn(),
  createSecurityReportExport: vi.fn(),
  storagePut: vi.fn(),
}));

vi.mock("./db", () => ({
  getSecurityPreference: mocks.getSecurityPreference,
  saveSecurityPreference: mocks.saveSecurityPreference,
  listSecurityReportExports: mocks.listSecurityReportExports,
  createSecurityReportExport: mocks.createSecurityReportExport,
}));

vi.mock("./storage", () => ({ storagePut: mocks.storagePut }));

import { appRouter } from "./routers";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createContext(user: AuthenticatedUser | null): TrpcContext {
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

const user: AuthenticatedUser = {
  id: 41,
  openId: "safe-report-user",
  name: "Safe Report User",
  email: "safe@example.com",
  loginMethod: "manus",
  role: "user",
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignedIn: new Date(),
};

describe("security data routes", () => {
  it("denies private persistence procedures without an authenticated user", async () => {
    const caller = appRouter.createCaller(createContext(null));

    await expect(caller.securityData.preference()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(caller.securityData.listReports()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("saves a selected model only for the authenticated user", async () => {
    mocks.saveSecurityPreference.mockResolvedValue({ userId: user.id, attackerModel: "offline-slow" });
    const caller = appRouter.createCaller(createContext(user));

    const result = await caller.securityData.savePreference("offline-slow");

    expect(mocks.saveSecurityPreference).toHaveBeenCalledWith(user.id, "offline-slow");
    expect(result).toEqual({ userId: user.id, attackerModel: "offline-slow" });
  });

  it("stores only a sanitized export and records its managed-storage metadata", async () => {
    mocks.storagePut.mockResolvedValue({
      key: "password-strength-reports/41/assessment.json",
      url: "/manus-storage/password-strength-reports/41/assessment.json",
    });
    mocks.createSecurityReportExport.mockResolvedValue({ id: 7, userId: user.id, strength: "Strong" });
    const caller = appRouter.createCaller(createContext(user));

    const result = await caller.securityData.exportSanitizedReport({
      attackerModel: "offline-fast",
      strength: "Strong",
      score: 3,
      entropyBits: 62,
    });

    expect(mocks.storagePut).toHaveBeenCalledWith(
      expect.stringContaining(`password-strength-reports/${user.id}/`),
      expect.not.stringContaining("password123"),
      "application/json",
    );
    const storedJson = mocks.storagePut.mock.calls[0]?.[1] as string;
    expect(storedJson).toContain('"strength": "Strong"');
    expect(storedJson).not.toContain('"password"');
    expect(mocks.createSecurityReportExport).toHaveBeenCalledWith(expect.objectContaining({
      userId: user.id,
      fileKey: "password-strength-reports/41/assessment.json",
      strength: "Strong",
      entropyBits: 62,
    }));
    expect(result).toEqual({ id: 7, userId: user.id, strength: "Strong" });
  });
});
