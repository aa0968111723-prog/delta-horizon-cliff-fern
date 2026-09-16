import { getSql } from "@/lib/db";
import { randomUrlToken } from "@/lib/oauth/crypto";
import {
  IG_MEDIA_TTL_MS,
  isIgMediaId,
  looksLikePublishImage,
  mimeForPublishImage,
} from "@/lib/zen/ig-media";

type Stored = { mime: string; bytes: Uint8Array; expiresAt: number };

const g = globalThis as typeof globalThis & {
  __tkuzcIgMedia__?: Map<string, Stored>;
};

function mem() {
  g.__tkuzcIgMedia__ ??= new Map();
  return g.__tkuzcIgMedia__;
}

function tmpPath(id: string) {
  return `/tmp/tkuzc-ig-media/${id}`;
}

function pruneMem(now = Date.now()) {
  const store = mem();
  for (const [id, row] of store) {
    if (row.expiresAt <= now) store.delete(id);
  }
}

function asBytes(value: unknown): Uint8Array | null {
  if (!value) return null;
  if (value instanceof Uint8Array) return value;
  if (typeof Buffer !== "undefined" && Buffer.isBuffer(value)) return new Uint8Array(value);
  if (value instanceof ArrayBuffer) return new Uint8Array(value);
  return null;
}

async function writeTmp(id: string, row: Stored) {
  try {
    const fs = await import("node:fs/promises");
    await fs.mkdir("/tmp/tkuzc-ig-media", { recursive: true });
    await fs.writeFile(tmpPath(id), Buffer.from(row.bytes));
    await fs.writeFile(`${tmpPath(id)}.meta`, JSON.stringify({ mime: row.mime, expiresAt: row.expiresAt }));
  } catch {
    /* /tmp is optional */
  }
}

async function readTmp(id: string): Promise<Stored | null> {
  try {
    const fs = await import("node:fs/promises");
    const metaRaw = await fs.readFile(`${tmpPath(id)}.meta`, "utf8");
    const meta = JSON.parse(metaRaw) as { mime?: string; expiresAt?: number };
    if (!meta.expiresAt || meta.expiresAt <= Date.now()) return null;
    const buf = await fs.readFile(tmpPath(id));
    const bytes = new Uint8Array(buf);
    if (!looksLikePublishImage(bytes)) return null;
    return { mime: meta.mime || mimeForPublishImage(bytes) || "image/jpeg", bytes, expiresAt: meta.expiresAt };
  } catch {
    return null;
  }
}

async function writeSql(id: string, row: Stored) {
  try {
    const sql = await getSql();
    await sql.query("delete from ig_publish_media where expires_at < now()");
    await sql.query(
      "insert into ig_publish_media (id, mime, bytes, expires_at) values ($1, $2, $3, $4) on conflict (id) do update set mime = excluded.mime, bytes = excluded.bytes, expires_at = excluded.expires_at",
      [id, row.mime, Buffer.from(row.bytes), new Date(row.expiresAt).toISOString()],
    );
  } catch {
    /* preview / deploy without table still serves from memory */
  }
}

async function readSql(id: string): Promise<Stored | null> {
  try {
    const sql = await getSql();
    const rows = await sql.query<{ mime: string; bytes: unknown; expires_at: string }>(
      "select mime, bytes, expires_at::text as expires_at from ig_publish_media where id = $1 and expires_at > now() limit 1",
      [id],
    );
    const row = rows[0];
    if (!row) return null;
    const bytes = asBytes(row.bytes);
    if (!bytes || !looksLikePublishImage(bytes)) return null;
    const expiresAt = Date.parse(row.expires_at);
    return {
      mime: row.mime || mimeForPublishImage(bytes) || "image/jpeg",
      bytes,
      expiresAt: Number.isFinite(expiresAt) ? expiresAt : Date.now() + IG_MEDIA_TTL_MS,
    };
  } catch {
    return null;
  }
}

export async function putIgPublishMedia(input: { mime: string; bytes: Uint8Array }): Promise<string | null> {
  if (!looksLikePublishImage(input.bytes)) return null;
  pruneMem();
  const id = randomUrlToken(16);
  const row: Stored = {
    mime: mimeForPublishImage(input.bytes) || input.mime,
    bytes: input.bytes,
    expiresAt: Date.now() + IG_MEDIA_TTL_MS,
  };
  mem().set(id, row);
  await Promise.all([writeTmp(id, row), writeSql(id, row)]);
  return id;
}

export async function getIgPublishMedia(id: string): Promise<Stored | null> {
  if (!isIgMediaId(id)) return null;
  pruneMem();
  const live = mem().get(id);
  if (live && live.expiresAt > Date.now()) return live;
  const tmp = await readTmp(id);
  if (tmp) {
    mem().set(id, tmp);
    return tmp;
  }
  const sql = await readSql(id);
  if (sql) {
    mem().set(id, sql);
    void writeTmp(id, sql);
  }
  return sql;
}
