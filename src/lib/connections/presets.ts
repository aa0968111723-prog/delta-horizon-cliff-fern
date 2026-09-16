export function driveSearchQuery(query: string, folderName?: string) {
  const folder = folderName?.trim();
  if (!folder || query.includes(folder)) return query.trim();
  return `${folder} ${query}`.trim();
}

export function folderSearchInput(query: string, folder?: { driveFolder?: string; driveFolderId?: string }) {
  const folderName = folder?.driveFolder?.trim() || undefined;
  const folderId = folder?.driveFolderId?.trim() || undefined;
  return {
    query,
    ...(folderName ? { folderName } : {}),
    ...(folderId ? { folderId } : {}),
  };
}

export function canvaPresetFor(kind: string) {
  if (kind === "story") return "instagramStory";
  if (kind === "reels") return "instagramReel";
  return "instagramPost";
}
