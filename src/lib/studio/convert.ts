import { formatForKind } from "./content";
import { uid } from "./ids";
import { applyCopyToArtboard, buildLayout, extractImageAssetId } from "./layout";
import { pagesOf } from "./layers";
import type { BrandKit, ContentKind, FormatId, Project } from "./types";

function formatFor(kind: ContentKind): FormatId {
  return formatForKind(kind);
}

function templateFor(kind: ContentKind, fallback: Project["templateId"]): Project["templateId"] {
  if (kind === "carousel") return fallback || "product";
  if (kind === "story" || kind === "countdown") return "quote";
  if (kind === "reels") return "product";
  if (kind === "line" || kind === "poster") return "offer";
  return fallback || "editorial";
}

export function applyKindLayout(project: Project, brand: BrandKit, kind: ContentKind): Project {
  const formatId = formatFor(kind);
  const templateId = templateFor(kind, project.templateId);
  const imageAssetId = extractImageAssetId(pagesOf(project)[0]) ?? brand.logoAssetId;
  const page = buildLayout(formatId, project.copy, brand, templateId, { imageAssetId });
  const pages = kind === "carousel" ? pagesOf(project).map((item) => applyCopyToArtboard({ ...item, formatId }, project.copy)) : [page];
  const nextPages = pages.length ? pages : [page];
  return {
    ...project,
    contentKind: kind,
    templateId,
    activeFormatId: formatId,
    artboards: { ...project.artboards, [formatId]: nextPages[0]! },
    slides: { ...project.slides, [formatId]: nextPages },
    slideIndex: 0,
    updatedAt: Date.now(),
  };
}

export function convertContent(source: Project, brand: BrandKit, kind: ContentKind): Project {
  const converted = applyKindLayout(source, brand, kind);
  return {
    ...converted,
    id: uid("proj"),
    name: `${source.name} · ${kind}`,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    status: "creating",
    convertedFromId: source.convertedFromId ?? source.id,
    scheduledAt: null,
    publishedAt: null,
    snapshots: [],
    exports: [],
  };
}
