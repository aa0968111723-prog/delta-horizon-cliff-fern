/** Pure Drive helpers so IG can host a PNG without putting tokens in the client. */

export const DRIVE_SCOPES =
  "https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/drive.file";

export const DRIVE_PUBLISH_FOLDER = "禪光發布";

export function drivePublicImageUrl(fileId: string) {
  return `https://lh3.googleusercontent.com/d/${encodeURIComponent(fileId)}=w1080`;
}

export function driveAnyoneReader() {
  return { role: "reader" as const, type: "anyone" as const };
}

export function driveFileMetadata(name: string, parentId?: string) {
  return {
    name: name.slice(0, 80) || "禪光主視覺",
    mimeType: "image/png",
    ...(parentId ? { parents: [parentId] } : {}),
  };
}

export function driveFolderQuery(name: string) {
  const safe = name.replaceAll("'", "\\'");
  return `name = '${safe}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
}

export function driveMultipartBody(
  meta: object,
  bytes: Uint8Array,
  mime: string,
  boundary: string,
): { body: Uint8Array; contentType: string } {
  const encoder = new TextEncoder();
  const head = encoder.encode(
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(meta)}\r\n--${boundary}\r\nContent-Type: ${mime}\r\n\r\n`,
  );
  const tail = encoder.encode(`\r\n--${boundary}--`);
  const body = new Uint8Array(head.length + bytes.length + tail.length);
  body.set(head, 0);
  body.set(bytes, head.length);
  body.set(tail, head.length + bytes.length);
  return { body, contentType: `multipart/related; boundary=${boundary}` };
}

function parseFileId(json: unknown): string | null {
  const id = (json as { id?: string }).id;
  return id || null;
}

async function ensurePublishFolder(token: string): Promise<string | undefined> {
  const q = encodeURIComponent(driveFolderQuery(DRIVE_PUBLISH_FOLDER));
  const listed = await fetch(
    `https://www.googleapis.com/drive/v3/files?pageSize=1&fields=files(id,name)&q=${q}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (listed.ok) {
    const json = (await listed.json()) as { files?: { id?: string }[] };
    if (json.files?.[0]?.id) return json.files[0].id;
  }
  const created = await fetch("https://www.googleapis.com/drive/v3/files", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: DRIVE_PUBLISH_FOLDER,
      mimeType: "application/vnd.google-apps.folder",
    }),
  });
  if (!created.ok) return undefined;
  return parseFileId(await created.json()) ?? undefined;
}

export async function hostImageOnDrive(opts: {
  token: string;
  bytes: Uint8Array;
  name: string;
}): Promise<string | null> {
  const folderId = await ensurePublishFolder(opts.token).catch(() => undefined);
  const boundary = `zen_${crypto.randomUUID().replaceAll("-", "")}`;
  const { body, contentType } = driveMultipartBody(
    driveFileMetadata(opts.name, folderId),
    opts.bytes,
    "image/png",
    boundary,
  );
  const uploaded = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${opts.token}`,
      "Content-Type": contentType,
    },
    body: Buffer.from(body),
  });
  if (!uploaded.ok) return null;
  const fileId = parseFileId(await uploaded.json());
  if (!fileId) return null;
  await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/permissions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${opts.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(driveAnyoneReader()),
  }).catch(() => undefined);
  return drivePublicImageUrl(fileId);
}
