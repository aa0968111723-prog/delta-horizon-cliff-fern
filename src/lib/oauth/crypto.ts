/** AES-GCM helpers for OAuth cookies. Never log plaintext tokens. */

export async function keyFromSecret(secret: string): Promise<Uint8Array> {
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(secret));
  return new Uint8Array(hash);
}

export async function encryptJson(payload: unknown, secret: string): Promise<string> {
  const { CompactEncrypt } = await import("jose");
  const key = await keyFromSecret(secret);
  const encoded = new TextEncoder().encode(JSON.stringify(payload));
  return new CompactEncrypt(encoded).setProtectedHeader({ alg: "dir", enc: "A256GCM" }).encrypt(key);
}

export async function decryptJson<T>(token: string, secret: string): Promise<T | null> {
  try {
    const { compactDecrypt } = await import("jose");
    const key = await keyFromSecret(secret);
    const { plaintext } = await compactDecrypt(token, key);
    return JSON.parse(new TextDecoder().decode(plaintext)) as T;
  } catch {
    return null;
  }
}

export function randomUrlToken(bytes = 32) {
  const buf = crypto.getRandomValues(new Uint8Array(bytes));
  return btoa(String.fromCharCode(...buf)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

export async function pkceChallenge(verifier: string) {
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  return btoa(String.fromCharCode(...new Uint8Array(hash)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}
