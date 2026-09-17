import type { ContentKind, Project } from "./types";

export function kindHasDownloadablePages(kind: ContentKind | undefined): boolean {
  return kind !== "threads";
}

export function convertPackOf(projects: Project[], sourceId: string): Project[] {
  const source = projects.find((item) => item.id === sourceId);
  const pack = projects.filter(
    (item) =>
      item.id === sourceId ||
      item.convertedFromId === sourceId ||
      item.convertedFromId === source?.convertedFromId,
  );
  return pack.length ? pack : source ? [source] : [];
}
