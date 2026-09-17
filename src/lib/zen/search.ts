type RemoteLike = {
  name?: string;
  label?: string;
  title?: string;
  provider?: string;
};

export function remoteMatchesQuery(file: RemoteLike, q: string) {
  const needle = q.trim().toLowerCase();
  if (!needle) return true;
  const hay = `${file.name ?? ""} ${file.label ?? ""} ${file.title ?? ""}`.toLowerCase();
  return hay.includes(needle);
}

export function hitFromRemote(file: unknown) {
  return file as Record<string, unknown>;
}
