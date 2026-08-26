import { describe, expect, it } from "vitest";
import { encryptedVaultEntrySchema } from "./vault";

const opaqueEntry = {
  ciphertext: "Q2lwaGVydGV4dFBheWxvYWQxMjM0NTY=",
  iv: "MDEyMzQ1Njc4OWFiYw==",
  salt: "c2FsdC1ieXRlcy0xMjM0NTY=",
  kdfVersion: "PBKDF2-SHA-256/250000",
};

describe("encrypted vault contract", () => {
  it("accepts only a bounded opaque ciphertext envelope", () => {
    expect(encryptedVaultEntrySchema.safeParse(opaqueEntry).success).toBe(true);
  });

  it("rejects a plaintext password or any other unexpected field", () => {
    const result = encryptedVaultEntrySchema.safeParse({ ...opaqueEntry, password: "not-permitted" });
    expect(result.success).toBe(false);
  });

  it("rejects unknown encryption versions", () => {
    const result = encryptedVaultEntrySchema.safeParse({ ...opaqueEntry, kdfVersion: "plaintext-v1" });
    expect(result.success).toBe(false);
  });
});
