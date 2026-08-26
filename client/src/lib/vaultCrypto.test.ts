import { describe, expect, it } from "vitest";
import { decryptVaultPayload, encryptVaultPayload } from "./vaultCrypto";

describe("vaultCrypto", () => {
  const payload = {
    title: "Personal mail",
    website: "https://mail.example.test",
    username: "user@example.test",
    password: "private-password-value",
    note: "A private vault note",
  };

  it("round-trips an encrypted vault payload without exposing plaintext in the envelope", async () => {
    const encrypted = await encryptVaultPayload(payload, "a long local vault passphrase");
    expect(encrypted.ciphertext).not.toContain(payload.password);
    expect(encrypted.kdfVersion).toBe("PBKDF2-SHA-256/250000");
    await expect(decryptVaultPayload(encrypted, "a long local vault passphrase")).resolves.toEqual(payload);
  });

  it("fails closed when the local vault passphrase is wrong", async () => {
    const encrypted = await encryptVaultPayload(payload, "a long local vault passphrase");
    await expect(decryptVaultPayload(encrypted, "a different vault passphrase")).rejects.toBeDefined();
  });
});
