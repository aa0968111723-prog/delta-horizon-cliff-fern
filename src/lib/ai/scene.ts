import { formatById } from "@/lib/studio/formats";
import { pagesOf } from "@/lib/studio/layers";
import type { AssetMeta, BrandKit, Project } from "@/lib/studio/types";

export type SceneLayer = {
  id: string;
  name: string;
  type: string;
  role?: string;
  x: number;
  y: number;
  w: number;
  h: number;
  text?: string;
  fontSize?: number;
  color?: string;
  fill?: string;
  align?: string;
  assetId?: string;
  locked: boolean;
  hidden: boolean;
};

export type EditorScene = {
  projectId: string;
  projectName: string;
  formatId: string;
  formatName: string;
  width: number;
  height: number;
  slideIndex: number;
  slideCount: number;
  templateId: string;
  selectedId: string | null;
  copy: {
    eyebrow: string;
    headline: string;
    subhead: string;
    body: string;
    cta: string;
    handle: string;
  };
  brief: {
    eventName: string;
    schedule: string;
    location: string;
    audience: string;
    style: string;
  };
  brand: {
    name: string;
    handle: string;
    website: string;
    voice: string;
    colors: { hex: string; role: string; label: string }[];
    forbiddenWords: string[];
    ctas: string[];
  };
  layers: SceneLayer[];
  assets: { id: string; name: string; category: string; kind: string }[];
};

export function buildScene(input: {
  project: Project;
  brand: BrandKit;
  assets: AssetMeta[];
  selectedId: string | null;
}): EditorScene {
  const format = formatById(input.project.activeFormatId);
  const pages = pagesOf(input.project);
  const board = pages[input.project.slideIndex ?? 0];
  const layers: SceneLayer[] = (board?.layers ?? []).slice(0, 36).map((layer) => ({
    id: layer.id,
    name: layer.name,
    type: layer.type,
    role: layer.type === "text" ? layer.role : undefined,
    x: Math.round(layer.x),
    y: Math.round(layer.y),
    w: Math.round(layer.w),
    h: Math.round(layer.h),
    text: layer.type === "text" ? layer.text.slice(0, 80) : undefined,
    fontSize: layer.type === "text" ? layer.fontSize : undefined,
    color: layer.type === "text" ? layer.color : undefined,
    fill: layer.type === "shape" ? layer.fill : undefined,
    align: layer.type === "text" ? layer.align : undefined,
    assetId: layer.type === "image" || layer.type === "logo" ? layer.assetId : undefined,
    locked: layer.locked,
    hidden: layer.hidden,
  }));
  return {
    projectId: input.project.id,
    projectName: input.project.name,
    formatId: input.project.activeFormatId,
    formatName: format.name,
    width: format.width,
    height: format.height,
    slideIndex: input.project.slideIndex ?? 0,
    slideCount: pages.length,
    templateId: input.project.templateId,
    selectedId: input.selectedId,
    copy: {
      eyebrow: input.project.copy.eyebrow,
      headline: input.project.copy.headline,
      subhead: input.project.copy.subhead,
      body: input.project.copy.body,
      cta: input.project.copy.cta,
      handle: input.project.copy.handle,
    },
    brief: {
      eventName: input.project.brief.eventName || input.project.brief.product,
      schedule: input.project.brief.schedule,
      location: input.project.brief.location,
      audience: input.project.brief.audience,
      style: input.project.brief.style,
    },
    brand: {
      name: input.brand.name,
      handle: input.brand.handle,
      website: input.brand.website,
      voice: input.brand.voice,
      colors: input.brand.colors.map((c) => ({ hex: c.hex, role: c.role, label: c.label })),
      forbiddenWords: input.brand.forbiddenWords,
      ctas: input.brand.ctas,
    },
    layers,
    assets: input.assets.slice(0, 24).map((a) => ({
      id: a.id,
      name: a.name,
      category: a.category,
      kind: a.kind,
    })),
  };
}
