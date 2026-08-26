import { z } from "zod";

const base64 = z.string().regex(/^[A-Za-z0-9+/]+={0,2}$/).max(48_000);

export const encryptedVaultEntrySchema = z.object({
  ciphertext: base64.min(24),
  iv: base64.min(16).max(64),
  salt: base64.min(16).max(128),
  kdfVersion: z.literal("PBKDF2-SHA-256/250000"),
}).strict();

export const vaultEntryIdSchema = z.object({ id: z.number().int().positive() }).strict();
