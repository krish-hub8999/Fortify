/** Browser-only vault encryption. The passphrase and derived AES key never leave memory. */
const encoder = new TextEncoder();
const decoder = new TextDecoder();
const ITERATIONS = 250_000;

export type VaultPayload = {
  title: string;
  website: string;
  username: string;
  password: string;
  note: string;
};

export type EncryptedVaultPayload = {
  ciphertext: string;
  iv: string;
  salt: string;
  kdfVersion: "PBKDF2-SHA-256/250000";
};

const toBase64 = (bytes: Uint8Array) => btoa(Array.from(bytes, (byte) => String.fromCharCode(byte)).join(""));
const fromBase64 = (value: string) => Uint8Array.from(atob(value), (character) => character.charCodeAt(0));
const toArrayBuffer = (bytes: Uint8Array): ArrayBuffer => {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return copy.buffer;
};

async function deriveKey(passphrase: string, salt: Uint8Array) {
  const source = await crypto.subtle.importKey("raw", toArrayBuffer(encoder.encode(passphrase)), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: toArrayBuffer(salt), iterations: ITERATIONS, hash: "SHA-256" },
    source,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

export async function encryptVaultPayload(payload: VaultPayload, passphrase: string): Promise<EncryptedVaultPayload> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(passphrase, salt);
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv: toArrayBuffer(iv) }, key, toArrayBuffer(encoder.encode(JSON.stringify(payload))));
  return { ciphertext: toBase64(new Uint8Array(ciphertext)), iv: toBase64(iv), salt: toBase64(salt), kdfVersion: "PBKDF2-SHA-256/250000" };
}

export async function decryptVaultPayload(payload: EncryptedVaultPayload, passphrase: string): Promise<VaultPayload> {
  if (payload.kdfVersion !== "PBKDF2-SHA-256/250000") throw new Error("Unsupported vault encryption version");
  const iv = fromBase64(payload.iv);
  const salt = fromBase64(payload.salt);
  const key = await deriveKey(passphrase, salt);
  const plaintext = await crypto.subtle.decrypt({ name: "AES-GCM", iv: toArrayBuffer(iv) }, key, toArrayBuffer(fromBase64(payload.ciphertext)));
  const parsed = JSON.parse(decoder.decode(plaintext)) as VaultPayload;
  if (![parsed.title, parsed.website, parsed.username, parsed.password, parsed.note].every((value) => typeof value === "string")) {
    throw new Error("Invalid encrypted vault entry");
  }
  return parsed;
}
