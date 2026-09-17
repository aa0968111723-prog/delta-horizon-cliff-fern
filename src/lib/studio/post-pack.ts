export function igPostText(copy: { caption?: string; hashtags?: string[] }) {
  return [copy.caption, (copy.hashtags ?? []).join(" ")].filter(Boolean).join("\n\n");
}

export function threadsPostText(copy: { caption?: string }) {
  return copy.caption ?? "";
}

export function packStats(_copy?: unknown) {
  return { chars: 0, hashtags: 0 };
}

export function packLimit(_kind?: unknown) {
  return 2200;
}
