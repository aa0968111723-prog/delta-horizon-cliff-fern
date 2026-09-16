import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { getCookie, setCookie } from "@tanstack/react-start/server";
import type { ProviderId } from "./providers";

/**
 * 第三方 token 的伺服器端保管處。
 *
 * - 只在伺服器端讀寫（檔名有 `.server` 後綴，不會被打包進瀏覽器）。
 * - 內容用 AES-256-GCM 加密後放進 httpOnly cookie，前端 JS 讀不到，也不進 localStorage。
 * - 存 refresh token，所以可以換新的 access token；中斷就是把 cookie 清掉。
 *
 * 這裡刻意不用資料庫：這個產品只有一個使用者，而 cookie 讓 token 不需要落地存放。
 */

export type ConnectionSession = {
  provider: ProviderId;
  accessToken: string;
  refreshToken: string | null;
  /** access token 到期時間（毫秒） */
  expiresAt: number | null;
  accountLabel: string | null;
  lastSyncedAt: number | null;
};

const COOKIE_PREFIX = "zen_conn_";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 90;

function cookieName(provider: ProviderId) {
  return `${COOKIE_PREFIX}${provider}`;
}

/**
 * 加密金鑰來自平台注入的祕密。沒有專用金鑰時退回其他伺服器端祕密，
 * 都沒有的話就不寫入——寧可不能連接，也不要把 token 明文放在 cookie 裡。
 */
function encryptionKey(): Buffer | null {
  const secret =
    process.env.CONNECTION_ENCRYPTION_KEY ??
    process.env.BETTER_AUTH_SECRET ??
    process.env.AUTH_SECRET ??
    null;
  if (!secret) return null;
  return createHash("sha256").update(secret).digest();
}

function encrypt(payload: string): string | null {
  const key = encryptionKey();
  if (!key) return null;
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(payload, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv.toString("base64url"), tag.toString("base64url"), encrypted.toString("base64url")].join(".");
}

function decrypt(raw: string): string | null {
  const key = encryptionKey();
  if (!key) return null;
  const [ivPart, tagPart, dataPart] = raw.split(".");
  if (!ivPart || !tagPart || !dataPart) return null;
  try {
    const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(ivPart, "base64url"));
    decipher.setAuthTag(Buffer.from(tagPart, "base64url"));
    return Buffer.concat([
      decipher.update(Buffer.from(dataPart, "base64url")),
      decipher.final(),
    ]).toString("utf8");
  } catch {
    return null;
  }
}

export function canStoreTokens(): boolean {
  return encryptionKey() !== null;
}

export function readConnection(provider: ProviderId): ConnectionSession | null {
  let raw: string | undefined;
  try {
    raw = getCookie(cookieName(provider));
  } catch {
    return null;
  }
  if (!raw) return null;
  const json = decrypt(raw);
  if (!json) return null;
  try {
    const parsed = JSON.parse(json) as ConnectionSession;
    return parsed.provider === provider ? parsed : null;
  } catch {
    return null;
  }
}

export function writeConnection(session: ConnectionSession): boolean {
  const payload = encrypt(JSON.stringify(session));
  if (!payload) return false;
  try {
    setCookie(cookieName(session.provider), payload, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: MAX_AGE_SECONDS,
    });
    return true;
  } catch {
    return false;
  }
}

export function clearConnection(provider: ProviderId): void {
  try {
    setCookie(cookieName(provider), "", {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
  } catch {
    // 沒有請求上下文時無需處理。
  }
}
