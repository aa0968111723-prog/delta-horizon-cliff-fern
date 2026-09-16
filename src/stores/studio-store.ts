import { create } from "zustand";
import { persist } from "zustand/middleware";
import { buildCampaignBoards, copyForCarouselPage } from "@/lib/ai/apply";
import { adaptArtboard, adaptPages, copyFromArtboard } from "@/lib/studio/adapt";
import { migrateAsset, fitPlacedAsset } from "@/lib/studio/assets";
import { createEmptyBrand, migrateBrand } from "@/lib/studio/brand";
import { MAX_PLAN_VERSIONS, migrateBrief, migratePlan, migratePlanVersions } from "@/lib/studio/brief";
import {
  CAROUSEL_SEQUENCE,
  completeCarouselPages,
  pagePlanFromArtboard,
  roleTemplate,
  stampSlideMeta,
} from "@/lib/studio/carousel";
import { emptyCopy, withBoilerplate } from "@/lib/studio/copy";
import { formatById } from "@/lib/studio/formats";
import { alignBox } from "@/lib/studio/geometry";
import { uid } from "@/lib/studio/ids";
import { applyCopyToArtboard, buildLayout, extractImageAssetId } from "@/lib/studio/layout";
import { inspectProject } from "@/lib/studio/quality";
import { applyQaFixToPages } from "@/lib/studio/quality-fix";
import {
  cloneArtboard,
  createImageLayer,
  createLogoLayer,
  duplicateLayer as cloneLayer,
  emptyArtboard,
  MAX_SLIDES,
  MAX_SNAPSHOTS,
  normalizeArtboard,
  pagesOf,
} from "@/lib/studio/layers";
import {
  SEED_ASSETS,
  SEED_BRAND,
  SEED_BRAND_ID,
  SEED_DRAFT_ID,
  SEED_PROJECT_ID,
  createSeedDraft,
  createSeedProject,
} from "@/lib/studio/seed-zen";
import { templateById } from "@/lib/studio/templates";
import type {
  AlignMode,
  Artboard,
  AssetMeta,
  BrandKit,
  Brief,
  CampaignPlan,
  CopyDeck,
  EditorTool,
  ExportVersion,
  FormatId,
  Layer,
  Project,
  ProjectStatus,
  QaIssue,
  Snapshot,
  TemplateId,
} from "@/lib/studio/types";

const STORAGE_KEY = "kouzhen-studio-v1";
const AUTO_SNAP_MS = 20000;

type EditorState = {
  selectedId: string | null;
  zoom: number;
  showGrid: boolean;
  showSafe: boolean;
  showBounds: boolean;
  tool: EditorTool;
};

type HistoryEntry = {
  pages: Artboard[];
  slideIndex: number;
};

type StudioState = {
  hydrated: boolean;
  brands: BrandKit[];
  assets: AssetMeta[];
  projects: Project[];
  lastProjectId: string | null;
  editor: EditorState;
  history: Record<string, HistoryEntry[]>;
  historyIndex: Record<string, number>;
  historyPaused: boolean;
  setHydrated: (v: boolean) => void;
  setLastProjectId: (id: string | null) => void;
  createBrand: (name: string) => BrandKit;
  updateBrand: (id: string, patch: Partial<BrandKit>) => void;
  deleteBrand: (id: string) => void;
  addAsset: (meta: AssetMeta) => void;
  updateAsset: (id: string, patch: Partial<AssetMeta>) => void;
  toggleFavorite: (id: string) => void;
  markAssetUsed: (id: string) => void;
  removeAsset: (id: string) => void;
  placeAsset: (projectId: string, assetId: string, at?: { x: number; y: number }) => boolean;
  createProject: (input: {
    name: string;
    brandId: string;
    formatId: FormatId;
    brief: Brief;
    templateId?: TemplateId;
  }) => Project;
  createFromTemplate: (input: { templateId: TemplateId; brandId: string }) => Project;
  applyCampaignPlan: (projectId: string, plan: CampaignPlan, brief: Brief) => void;
  restorePlanVersion: (projectId: string, versionId: string) => void;
  patchPlan: (projectId: string, patch: Partial<CampaignPlan> | ((plan: CampaignPlan) => CampaignPlan)) => void;
  applyAiEdit: (projectId: string, label: string, mutate: () => void | Promise<void>) => Promise<void>;
  updateProject: (id: string, patch: Partial<Project> | ((p: Project) => Project)) => void;
  setProjectStatus: (id: string, status: ProjectStatus) => void;
  deleteProject: (id: string) => void;
  duplicateProject: (id: string) => Project | null;
  recordExport: (id: string, version: ExportVersion) => void;
  ensureArtboard: (projectId: string, formatId: FormatId) => void;
  setActiveFormat: (projectId: string, formatId: FormatId) => void;
  reflow: (projectId: string, templateId?: TemplateId) => void;
  setCopy: (projectId: string, patch: Partial<CopyDeck>) => void;
  patchArtboard: (projectId: string, fn: (a: Artboard) => Artboard, recordHistory?: boolean) => void;
  updateLayer: (projectId: string, layerId: string, patch: Partial<Layer>) => void;
  addLayer: (projectId: string, layer: Layer) => void;
  removeLayer: (projectId: string, layerId: string) => void;
  duplicateLayer: (projectId: string, layerId: string) => void;
  reorderLayer: (projectId: string, layerId: string, dir: "up" | "down" | "front" | "back") => void;
  alignLayer: (projectId: string, layerId: string, mode: AlignMode) => void;
  nudgeLayer: (projectId: string, layerId: string, dx: number, dy: number) => void;
  addSlide: (projectId: string, mode?: "duplicate" | "blank") => void;
  removeSlide: (projectId: string, index?: number) => void;
  setSlide: (projectId: string, index: number) => void;
  duplicateSlide: (projectId: string) => void;
  reorderSlide: (projectId: string, from: number, to: number) => void;
  regenerateSlide: (projectId: string, index?: number) => void;
  expandCarousel: (projectId: string) => void;
  adaptToFormat: (projectId: string, formatId: FormatId) => void;
  applyQaFix: (projectId: string, issue: QaIssue) => boolean;
  applyQaFixes: (projectId: string, issues?: QaIssue[]) => number;
  captureSnapshot: (projectId: string, name?: string, kind?: Snapshot["kind"]) => string | null;
  restoreSnapshot: (projectId: string, snapshotId: string) => void;
  deleteSnapshot: (projectId: string, snapshotId: string) => void;
  select: (id: string | null) => void;
  setEditor: (patch: Partial<EditorState>) => void;
  undo: (projectId: string) => void;
  redo: (projectId: string) => void;
};

function brandById(brands: BrandKit[], id: string): BrandKit {
  return brands.find((b) => b.id === id) ?? brands[0] ?? SEED_BRAND;
}

function clone<T>(v: T): T {
  return structuredClone(v);
}

function historyKey(projectId: string, formatId: FormatId) {
  return `${projectId}:${formatId}`;
}

function migrateBrandRecord(raw: BrandKit): BrandKit {
  if (raw.id === SEED_BRAND_ID && raw.name === "日食咖啡") return clone(SEED_BRAND);
  const next = migrateBrand(raw);
  if (next.id !== SEED_BRAND_ID) return next;
  return {
    ...next,
    slogans: next.slogans.length ? next.slogans : SEED_BRAND.slogans,
    ctas: next.ctas.length ? next.ctas : SEED_BRAND.ctas,
    logos: next.logos.length ? next.logos : SEED_BRAND.logos,
    imageStyle: next.imageStyle.mood ? next.imageStyle : SEED_BRAND.imageStyle,
    rules: next.rules.notes ? next.rules : { ...SEED_BRAND.rules, ...next.rules },
  };
}

function migrateAssetRecord(raw: AssetMeta): AssetMeta {
  const next = migrateAsset(raw);
  const seed = SEED_ASSETS.find((item) => item.id === next.id);
  if (!seed) return next;
  return {
    ...next,
    category: raw.category ?? seed.category,
    tags: next.tags.length ? next.tags : seed.tags,
    licenseNotes: next.licenseNotes || seed.licenseNotes,
    licenseOwner: next.licenseOwner || seed.licenseOwner,
    source: next.source || seed.source,
    favorite: raw.favorite ?? seed.favorite,
  };
}

function migrateProject(raw: Project): Project {
  if (raw.id === SEED_PROJECT_ID && raw.name.includes("耶加雪菲")) return createSeedProject();
  if (raw.id === SEED_DRAFT_ID && raw.name.includes("手沖")) return createSeedDraft();
  const artboards: Partial<Record<FormatId, Artboard>> = {};
  for (const [key, value] of Object.entries(raw.artboards ?? {})) {
    if (value) artboards[key as FormatId] = normalizeArtboard(value);
  }
  const slides: Partial<Record<FormatId, Artboard[]>> = {};
  const rawSlides = raw.slides ?? {};
  for (const key of new Set([...Object.keys(artboards), ...Object.keys(rawSlides)])) {
    const id = key as FormatId;
    const list = rawSlides[id];
    if (list?.length) slides[id] = stampSlideMeta(list.map((page) => normalizeArtboard(page)));
    else if (artboards[id]) slides[id] = stampSlideMeta([artboards[id]!]);
  }
  const formatId = raw.activeFormatId ?? "feed-portrait";
  const pages = slides[formatId] ?? [];
  const slideIndex = Math.min(Math.max(0, raw.slideIndex ?? 0), Math.max(0, pages.length - 1));
  if (pages[slideIndex]) artboards[formatId] = pages[slideIndex];
  const plan = migratePlan(raw.plan);
  return {
    ...raw,
    status: raw.status ?? (plan ? "ready" : "draft"),
    exports: raw.exports ?? [],
    artboards,
    slides,
    slideIndex,
    brief: migrateBrief(raw.brief),
    plan,
    planVersions: migratePlanVersions(raw.planVersions, plan),
    snapshots: (raw.snapshots ?? []).map((snap) => ({
      ...snap,
      artboard: normalizeArtboard(snap.artboard),
      pages: snap.pages?.map((page) => normalizeArtboard(page)),
    })),
  };
}

function withPages(project: Project, formatId: FormatId, pages: Artboard[], slideIndex: number): Project {
  const stamped = stampSlideMeta(pages);
  const idx = Math.min(Math.max(0, slideIndex), Math.max(0, stamped.length - 1));
  const current = stamped[idx];
  return {
    ...project,
    artboards: current ? { ...project.artboards, [formatId]: current } : project.artboards,
    slides: { ...project.slides, [formatId]: stamped },
    slideIndex: idx,
    updatedAt: Date.now(),
  };
}

function maybeAutoSnapshot(project: Project, formatId: FormatId, artboard: Artboard, slideIndex: number): Snapshot[] {
  const snaps = project.snapshots ?? [];
  const last = snaps[0];
  const now = Date.now();
  if (last && now - last.createdAt < AUTO_SNAP_MS) return snaps;
  const pages = pagesOf(project, formatId);
  const snap: Snapshot = {
    id: uid("snap"),
    name: "自動儲存",
    createdAt: now,
    kind: "auto",
    formatId,
    slideIndex,
    artboard: clone(artboard),
    pages: clone(pages),
  };
  return [snap, ...snaps].slice(0, MAX_SNAPSHOTS);
}

function makeFormatSnapshot(project: Project, formatId: FormatId, name: string, kind: Snapshot["kind"]): Snapshot | null {
  const pages = pagesOf(project, formatId);
  if (!pages.length) return null;
  const idx = formatId === project.activeFormatId ? project.slideIndex ?? 0 : 0;
  return {
    id: uid("snap"),
    name,
    createdAt: Date.now(),
    kind,
    formatId,
    slideIndex: Math.min(idx, pages.length - 1),
    artboard: clone(pages[Math.min(idx, pages.length - 1)]),
    pages: clone(pages),
  };
}

export const useStudio = create<StudioState>()(
  persist(
    (set, get) => ({
      hydrated: false,
      brands: [SEED_BRAND],
      assets: SEED_ASSETS,
      projects: [createSeedProject(), createSeedDraft()],
      lastProjectId: SEED_PROJECT_ID,
      editor: {
        selectedId: null,
        zoom: 0,
        showGrid: false,
        showSafe: true,
        showBounds: true,
        tool: "select",
      },
      history: {},
      historyIndex: {},
      historyPaused: false,
      setHydrated: (v) => set({ hydrated: v }),
      setLastProjectId: (id) => set({ lastProjectId: id }),
      createBrand: (name) => {
        const brand = createEmptyBrand(name);
        set((s) => ({ brands: [...s.brands, brand] }));
        return brand;
      },
      updateBrand: (id, patch) =>
        set((s) => ({
          brands: s.brands.map((b) =>
            b.id === id ? { ...b, ...patch, updatedAt: Date.now() } : b,
          ),
        })),
      deleteBrand: (id) =>
        set((s) => {
          if (s.brands.length <= 1) return s;
          const brands = s.brands.filter((b) => b.id !== id);
          const fallback = brands[0].id;
          return {
            brands,
            projects: s.projects.map((p) =>
              p.brandId === id ? { ...p, brandId: fallback } : p,
            ),
          };
        }),
      addAsset: (meta) => set((s) => ({ assets: [migrateAsset(meta), ...s.assets] })),
      updateAsset: (id, patch) =>
        set((s) => ({
          assets: s.assets.map((a) =>
            a.id === id ? { ...a, ...patch, updatedAt: Date.now() } : a,
          ),
        })),
      toggleFavorite: (id) =>
        set((s) => ({
          assets: s.assets.map((a) =>
            a.id === id ? { ...a, favorite: !a.favorite, updatedAt: Date.now() } : a,
          ),
        })),
      markAssetUsed: (id) =>
        set((s) => ({
          assets: s.assets.map((a) =>
            a.id === id
              ? { ...a, useCount: a.useCount + 1, lastUsedAt: Date.now(), updatedAt: Date.now() }
              : a,
          ),
        })),
      removeAsset: (id) =>
        set((s) => ({
          assets: s.assets.filter((a) => a.id !== id),
          brands: s.brands.map((b) => {
            const logos = (b.logos ?? []).filter((logo) => logo.assetId !== id);
            const logoAssetId =
              b.logoAssetId === id ? (logos[0]?.assetId ?? null) : b.logoAssetId;
            return { ...b, logos, logoAssetId };
          }),
        })),
      placeAsset: (projectId, assetId, at) => {
        const s = get();
        const project = s.projects.find((p) => p.id === projectId);
        const asset = s.assets.find((a) => a.id === assetId);
        if (!project || !asset) return false;
        const brand = brandById(s.brands, project.brandId);
        const format = formatById(project.activeFormatId);
        const size = fitPlacedAsset(asset, format.width * 0.72, format.height * 0.55);
        const isLogo = asset.kind === "logo" || asset.category === "logo";
        if (isLogo) {
          const side = Math.min(180, Math.max(72, Math.round(Math.min(size.w, size.h))));
          const layer = createLogoLayer(brand, {
            assetId: asset.id,
            size: side,
            x: at ? Math.round(at.x - side / 2) : format.width - side - format.safe.right,
            y: at ? Math.round(at.y - side / 2) : format.safe.top,
          });
          if (!layer) return false;
          get().addLayer(projectId, layer);
        } else {
          const w = size.w;
          const h = size.h;
          const x = at ? Math.round(at.x - w / 2) : Math.round((format.width - w) / 2);
          const y = at ? Math.round(at.y - h / 2) : Math.round((format.height - h) / 3);
          get().addLayer(projectId, createImageLayer(asset.id, asset.name, { x, y, w, h }));
        }
        get().markAssetUsed(asset.id);
        return true;
      },
      createProject: ({ name, brandId, formatId, brief, templateId }) => {
        const brand = brandById(get().brands, brandId);
        const tpl = templateId ?? "editorial";
        const copy = withBoilerplate(emptyCopy(brand.handle, brand.boilerplate), brand.boilerplate);
        copy.headline = name;
        const artboard = buildLayout(formatId, copy, brand, tpl);
        const project: Project = {
          id: uid("proj"),
          name: name.trim() || "未命名專案",
          createdAt: Date.now(),
          updatedAt: Date.now(),
          brandId,
          templateId: tpl,
          activeFormatId: formatId,
          status: "draft",
          brief: migrateBrief(brief),
          copy,
          plan: null,
          artboards: { [formatId]: artboard },
          slides: { [formatId]: [artboard] },
          slideIndex: 0,
          snapshots: [],
          planVersions: [],
          exports: [],
        };
        set((s) => ({ projects: [project, ...s.projects], lastProjectId: project.id }));
        return project;
      },
      createFromTemplate: ({ templateId, brandId }) => {
        const brand = brandById(get().brands, brandId);
        const starter = templateById(templateId);
        const copy = withBoilerplate(
          { ...starter.copy, handle: brand.handle, headline: starter.copy.headline },
          brand.boilerplate,
        );
        const artboard = buildLayout(starter.formatId, copy, brand, templateId);
        const project: Project = {
          id: uid("proj"),
          name: starter.name,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          brandId,
          templateId,
          activeFormatId: starter.formatId,
          status: "draft",
          brief: migrateBrief(starter.brief),
          copy,
          plan: null,
          artboards: { [starter.formatId]: artboard },
          slides: { [starter.formatId]: [artboard] },
          slideIndex: 0,
          snapshots: [],
          planVersions: [],
          exports: [],
        };
        set((s) => ({ projects: [project, ...s.projects], lastProjectId: project.id }));
        return project;
      },
      applyCampaignPlan: (projectId, plan, brief) => {
        const s = get();
        const project = s.projects.find((p) => p.id === projectId);
        if (!project) return;
        const brand = brandById(s.brands, project.brandId);
        const nextBrief = migrateBrief(brief);
        const nextPlan = migratePlan(plan) ?? plan;
        const boards = buildCampaignBoards({
          project,
          brand,
          plan: nextPlan,
          brief: nextBrief,
        });
        const version = {
          id: uid("plan"),
          createdAt: Date.now(),
          source: nextPlan.source,
          name: `${nextPlan.source === "mock" ? "本機草案" : "AI 企劃"} · ${nextPlan.campaignName || "未命名"}`,
          plan: clone(nextPlan),
        };
        get().updateProject(projectId, (p) => ({
          ...p,
          brief: nextBrief,
          plan: nextPlan,
          copy: boards.copy,
          templateId: nextPlan.templateId,
          slides: boards.slides,
          artboards: boards.artboards,
          activeFormatId: boards.activeFormatId,
          slideIndex: 0,
          status: "ready" as const,
          planVersions: [version, ...(p.planVersions ?? [])].slice(0, MAX_PLAN_VERSIONS),
        }));
        get().captureSnapshot(projectId, nextPlan.source === "mock" ? "本機草案" : "AI 企劃", "manual");
        get().select(null);
      },
      restorePlanVersion: (projectId, versionId) => {
        const project = get().projects.find((p) => p.id === projectId);
        if (!project) return;
        const version = (project.planVersions ?? []).find((v) => v.id === versionId);
        if (!version) return;
        const brand = brandById(get().brands, project.brandId);
        const plan = migratePlan(version.plan) ?? version.plan;
        const brief = migrateBrief(project.brief);
        const boards = buildCampaignBoards({ project, brand, plan, brief });
        get().updateProject(projectId, (p) => ({
          ...p,
          plan,
          copy: boards.copy,
          templateId: plan.templateId,
          slides: boards.slides,
          artboards: boards.artboards,
          activeFormatId: boards.activeFormatId,
          slideIndex: 0,
          status: "ready" as const,
          planVersions: [version, p.planVersions.filter((v) => v.id !== versionId)].flat().slice(0, MAX_PLAN_VERSIONS),
        }));
        get().captureSnapshot(projectId, `還原 ${version.name}`, "manual");
        get().select(null);
      },
      patchPlan: (projectId, patch) => {
        get().updateProject(projectId, (p) => {
          if (!p.plan) return p;
          const next = typeof patch === "function" ? patch(p.plan) : { ...p.plan, ...patch };
          return { ...p, plan: next };
        });
      },
      applyAiEdit: async (projectId, _label, mutate) => {
        const project = get().projects.find((p) => p.id === projectId);
        if (!project) return;
        const formatId = project.activeFormatId;
        const beforePages = clone(pagesOf(project, formatId));
        const beforeIdx = project.slideIndex ?? 0;
        set({ historyPaused: true });
        try {
          await mutate();
        } finally {
          set({ historyPaused: false });
        }
        const after = get().projects.find((p) => p.id === projectId);
        if (!after) return;
        const afterFormat = after.activeFormatId;
        const afterPages = clone(pagesOf(after, afterFormat));
        const afterIdx = after.slideIndex ?? 0;
        if (afterFormat !== formatId) return;
        const key = historyKey(projectId, formatId);
        const s = get();
        const stack = (s.history[key] ?? [{ pages: beforePages, slideIndex: beforeIdx }]).slice(
          0,
          (s.historyIndex[key] ?? 0) + 1,
        );
        if (!s.history[key]) stack[0] = { pages: beforePages, slideIndex: beforeIdx };
        stack.push({ pages: afterPages, slideIndex: afterIdx });
        const trimmed = stack.slice(-40);
        set({
          history: { ...s.history, [key]: trimmed },
          historyIndex: { ...s.historyIndex, [key]: trimmed.length - 1 },
        });
      },
      updateProject: (id, patch) =>
        set((s) => ({
          projects: s.projects.map((p) => {
            if (p.id !== id) return p;
            const next = typeof patch === "function" ? patch(p) : { ...p, ...patch };
            return { ...next, updatedAt: Date.now() };
          }),
        })),
      setProjectStatus: (id, status) => get().updateProject(id, { status }),
      deleteProject: (id) =>
        set((s) => {
          const projects = s.projects.filter((p) => p.id !== id);
          return {
            projects,
            lastProjectId: s.lastProjectId === id ? (projects[0]?.id ?? null) : s.lastProjectId,
          };
        }),
      duplicateProject: (id) => {
        const src = get().projects.find((p) => p.id === id);
        if (!src) return null;
        const copy: Project = {
          ...clone(src),
          id: uid("proj"),
          name: `${src.name} 副本`,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          status: "draft",
          exports: [],
        };
        set((s) => ({ projects: [copy, ...s.projects], lastProjectId: copy.id }));
        return copy;
      },
      recordExport: (id, version) =>
        get().updateProject(id, (p) => ({
          ...p,
          status: "exported",
          exports: [version, ...p.exports].slice(0, 20),
        })),
      ensureArtboard: (projectId, formatId) => {
        const s = get();
        const project = s.projects.find((p) => p.id === projectId);
        if (!project) return;
        if (pagesOf(project, formatId).length) return;
        const brand = brandById(s.brands, project.brandId);
        const sourceFormat = project.activeFormatId;
        const sourcePages = pagesOf(project, sourceFormat);
        if (sourcePages.length && sourceFormat !== formatId) {
          const snap = makeFormatSnapshot(project, sourceFormat, `轉換前 · ${formatById(sourceFormat).short}`, "format");
          const adapted = adaptPages(sourcePages, formatId, brand, project.templateId);
          get().updateProject(projectId, (p) => {
            const next = withPages(p, formatId, adapted, 0);
            return snap ? { ...next, snapshots: [snap, ...(p.snapshots ?? [])].slice(0, MAX_SNAPSHOTS) } : next;
          });
          return;
        }
        const imageAssetId = extractImageAssetId(
          project.artboards[project.activeFormatId] ?? pagesOf(project)[0],
        );
        const artboard = buildLayout(
          formatId,
          project.copy,
          brand,
          project.templateId,
          { imageAssetId },
        );
        artboard.role = "cover";
        artboard.templateId = project.templateId;
        get().updateProject(projectId, (p) => withPages(p, formatId, [artboard], 0));
      },
      setActiveFormat: (projectId, formatId) => {
        get().ensureArtboard(projectId, formatId);
        get().updateProject(projectId, { activeFormatId: formatId, slideIndex: 0 });
        set((s) => ({ editor: { ...s.editor, selectedId: null } }));
      },
      reflow: (projectId, templateId) => {
        const s = get();
        const project = s.projects.find((p) => p.id === projectId);
        if (!project) return;
        const brand = brandById(s.brands, project.brandId);
        const nextTemplate = templateId ?? project.templateId;
        const current = pagesOf(project)[project.slideIndex ?? 0];
        if (!current) return;
        const copy = copyFromArtboard(current, project.copy);
        const artboard = adaptArtboard(current, project.activeFormatId, brand, {
          templateId: nextTemplate,
          copy,
        });
        get().patchArtboard(projectId, () => artboard);
        get().updateProject(projectId, { templateId: nextTemplate });
        get().select(null);
      },
      setCopy: (projectId, patch) => {
        get().updateProject(projectId, (p) => {
          const copy = { ...p.copy, ...patch };
          const formatId = p.activeFormatId;
          const pages = pagesOf(p, formatId);
          const idx = p.slideIndex ?? 0;
          const current = pages[idx];
          if (!current) return { ...p, copy };
          const nextPages = pages.map((page, i) => (i === idx ? applyCopyToArtboard(page, copy) : page));
          const planPages = p.plan?.carouselPages;
          const plan =
            p.plan && planPages?.[idx]
              ? {
                  ...p.plan,
                  carouselPages: planPages.map((page, i) =>
                    i === idx
                      ? {
                          ...page,
                          headline: copy.headline,
                          subhead: copy.subhead,
                          body: copy.body,
                          cta: copy.cta,
                        }
                      : page,
                  ),
                }
              : p.plan;
          return { ...withPages({ ...p, copy, plan }, formatId, nextPages, idx), copy, plan };
        });
      },
      patchArtboard: (projectId, fn, recordHistory = true) => {
        const s = get();
        const project = s.projects.find((p) => p.id === projectId);
        if (!project) return;
        const formatId = project.activeFormatId;
        const pages = pagesOf(project, formatId);
        const idx = Math.min(project.slideIndex ?? 0, Math.max(0, pages.length - 1));
        const current = pages[idx];
        if (!current) return;
        const next = fn(current);
        const nextPages = pages.map((page, i) => (i === idx ? next : page));
        if (recordHistory && !get().historyPaused) {
          const key = historyKey(projectId, formatId);
          const stack = (s.history[key] ?? [{ pages: clone(pages), slideIndex: idx }]).slice(
            0,
            (s.historyIndex[key] ?? 0) + 1,
          );
          stack.push({ pages: clone(nextPages), slideIndex: idx });
          const trimmed = stack.slice(-40);
          set({
            history: { ...s.history, [key]: trimmed },
            historyIndex: { ...s.historyIndex, [key]: trimmed.length - 1 },
          });
        }
        get().updateProject(projectId, (p) => {
          const updated = withPages(p, formatId, nextPages, idx);
          return {
            ...updated,
            snapshots: maybeAutoSnapshot(updated, formatId, next, idx),
          };
        });
      },
      updateLayer: (projectId, layerId, patch) => {
        get().patchArtboard(projectId, (a) => ({
          ...a,
          layers: a.layers.map((l) =>
            l.id === layerId ? ({ ...l, ...patch } as Layer) : l,
          ),
        }));
      },
      addLayer: (projectId, layer) => {
        get().patchArtboard(projectId, (a) => ({
          ...a,
          layers: [...a.layers, layer],
        }));
        get().select(layer.id);
        get().setEditor({ tool: "select" });
      },
      removeLayer: (projectId, layerId) => {
        get().patchArtboard(projectId, (a) => ({
          ...a,
          layers: a.layers.filter((l) => l.id !== layerId),
        }));
        const sel = get().editor.selectedId;
        if (sel === layerId) get().select(null);
      },
      duplicateLayer: (projectId, layerId) => {
        const project = get().projects.find((p) => p.id === projectId);
        if (!project) return;
        const current = pagesOf(project)[project.slideIndex ?? 0];
        const layer = current?.layers.find((l) => l.id === layerId);
        if (!layer) return;
        const copy = cloneLayer(layer);
        get().addLayer(projectId, copy);
      },
      reorderLayer: (projectId, layerId, dir) => {
        get().patchArtboard(projectId, (a) => {
          const layers = [...a.layers];
          const i = layers.findIndex((l) => l.id === layerId);
          if (i < 0) return a;
          const [item] = layers.splice(i, 1);
          if (dir === "front") layers.push(item);
          else if (dir === "back") layers.unshift(item);
          else if (dir === "up") layers.splice(Math.min(layers.length, i + 1), 0, item);
          else layers.splice(Math.max(0, i - 1), 0, item);
          return { ...a, layers };
        });
      },
      alignLayer: (projectId, layerId, mode) => {
        const project = get().projects.find((p) => p.id === projectId);
        if (!project) return;
        const current = pagesOf(project)[project.slideIndex ?? 0];
        const layer = current?.layers.find((l) => l.id === layerId);
        if (!layer || layer.locked) return;
        const patch = alignBox(layer, formatById(project.activeFormatId), mode);
        get().updateLayer(projectId, layerId, patch);
      },
      nudgeLayer: (projectId, layerId, dx, dy) => {
        const project = get().projects.find((p) => p.id === projectId);
        if (!project) return;
        const current = pagesOf(project)[project.slideIndex ?? 0];
        const layer = current?.layers.find((l) => l.id === layerId);
        if (!layer || layer.locked) return;
        get().updateLayer(projectId, layerId, { x: layer.x + dx, y: layer.y + dy });
      },
      addSlide: (projectId, mode = "duplicate") => {
        const s = get();
        const project = s.projects.find((p) => p.id === projectId);
        if (!project) return;
        const formatId = project.activeFormatId;
        const pages = pagesOf(project, formatId);
        if (pages.length >= MAX_SLIDES) return;
        const brand = brandById(s.brands, project.brandId);
        const source = pages[project.slideIndex ?? 0];
        const nextRole = CAROUSEL_SEQUENCE.find((item) => !pages.some((page) => page.role === item.role))?.role;
        const nextPage =
          mode === "blank" || !source
            ? emptyArtboard(formatId, brand.colors.find((c) => c.role === "background")?.hex ?? "#F4E6D4")
            : cloneArtboard(source);
        if (mode === "blank") {
          nextPage.role = nextRole;
          nextPage.templateId = roleTemplate(nextRole, project.templateId);
        }
        const nextPages = [...pages, nextPage];
        const nextIndex = nextPages.length - 1;
        const key = historyKey(projectId, formatId);
        const stack = (s.history[key] ?? [{ pages: clone(pages), slideIndex: project.slideIndex ?? 0 }]).slice(
          0,
          (s.historyIndex[key] ?? 0) + 1,
        );
        stack.push({ pages: clone(nextPages), slideIndex: nextIndex });
        set({
          history: { ...s.history, [key]: stack.slice(-40) },
          historyIndex: { ...s.historyIndex, [key]: stack.slice(-40).length - 1 },
          editor: { ...s.editor, selectedId: null },
        });
        get().updateProject(projectId, (p) => withPages(p, formatId, nextPages, nextIndex));
      },
      removeSlide: (projectId, index) => {
        const s = get();
        const project = s.projects.find((p) => p.id === projectId);
        if (!project) return;
        const formatId = project.activeFormatId;
        const pages = pagesOf(project, formatId);
        if (pages.length <= 1) return;
        const target = index ?? project.slideIndex ?? 0;
        const nextPages = pages.filter((_, i) => i !== target);
        const nextIndex = Math.min(target, nextPages.length - 1);
        const key = historyKey(projectId, formatId);
        const stack = (s.history[key] ?? [{ pages: clone(pages), slideIndex: project.slideIndex ?? 0 }]).slice(
          0,
          (s.historyIndex[key] ?? 0) + 1,
        );
        stack.push({ pages: clone(nextPages), slideIndex: nextIndex });
        set({
          history: { ...s.history, [key]: stack.slice(-40) },
          historyIndex: { ...s.historyIndex, [key]: stack.slice(-40).length - 1 },
          editor: { ...s.editor, selectedId: null },
        });
        get().updateProject(projectId, (p) => withPages(p, formatId, nextPages, nextIndex));
      },
      setSlide: (projectId, index) => {
        const project = get().projects.find((p) => p.id === projectId);
        if (!project) return;
        const pages = pagesOf(project);
        if (!pages[index]) return;
        get().updateProject(projectId, (p) => withPages(p, p.activeFormatId, pagesOf(p), index));
        get().select(null);
      },
      duplicateSlide: (projectId) => get().addSlide(projectId, "duplicate"),
      reorderSlide: (projectId, from, to) => {
        const s = get();
        const project = s.projects.find((p) => p.id === projectId);
        if (!project) return;
        const formatId = project.activeFormatId;
        const pages = [...pagesOf(project, formatId)];
        if (from === to || !pages[from] || to < 0 || to >= pages.length) return;
        const [moved] = pages.splice(from, 1);
        pages.splice(to, 0, moved);
        const key = historyKey(projectId, formatId);
        const stack = (s.history[key] ?? [{ pages: clone(pagesOf(project, formatId)), slideIndex: project.slideIndex ?? 0 }]).slice(
          0,
          (s.historyIndex[key] ?? 0) + 1,
        );
        stack.push({ pages: clone(pages), slideIndex: to });
        set({
          history: { ...s.history, [key]: stack.slice(-40) },
          historyIndex: { ...s.historyIndex, [key]: stack.slice(-40).length - 1 },
          editor: { ...s.editor, selectedId: null },
        });
        get().updateProject(projectId, (p) => {
          const next = withPages(p, formatId, pages, to);
          if (!p.plan || p.plan.carouselPages.length !== pages.length) return next;
          const planPages = [...p.plan.carouselPages];
          const [planMoved] = planPages.splice(from, 1);
          planPages.splice(to, 0, planMoved);
          return { ...next, plan: { ...p.plan, carouselPages: planPages } };
        });
      },
      regenerateSlide: (projectId, index) => {
        const s = get();
        const project = s.projects.find((p) => p.id === projectId);
        if (!project) return;
        const brand = brandById(s.brands, project.brandId);
        const pages = pagesOf(project);
        const idx = index ?? project.slideIndex ?? 0;
        const current = pages[idx];
        if (!current) return;
        const planPage = project.plan?.carouselPages[idx];
        const copy = planPage
          ? copyForCarouselPage(copyFromArtboard(current, project.copy), planPage, project.plan ?? undefined)
          : copyFromArtboard(current, project.copy);
        const templateId = planPage?.templateId ?? current.templateId ?? roleTemplate(current.role, project.templateId);
        const next = adaptArtboard(current, project.activeFormatId, brand, { templateId, copy });
        if (planPage) next.role = planPage.role;
        get().patchArtboard(projectId, () => next);
        get().select(null);
      },
      expandCarousel: (projectId) => {
        const s = get();
        const project = s.projects.find((p) => p.id === projectId);
        if (!project) return;
        const brand = brandById(s.brands, project.brandId);
        const formatId = project.activeFormatId;
        const existing = pagesOf(project, formatId);
        const snap = makeFormatSnapshot(project, formatId, "展開輪播前", "format");
        const fromPlan = project.plan?.carouselPages ?? existing.map((page, i) => pagePlanFromArtboard(page, i));
        const pages = completeCarouselPages(fromPlan, {
          headline: project.copy.headline,
          subhead: project.copy.subhead,
          body: project.copy.body,
          cta: project.copy.cta,
          hook: project.plan?.hook,
          insight: project.plan?.insight,
          templateId: project.templateId,
        }).slice(0, MAX_SLIDES);
        const imageAssetId = extractImageAssetId(existing[0]);
        const boards = stampSlideMeta(
          pages.map((page, i) => {
            const source = existing[i] ?? existing[0];
            const board = buildLayout(
              formatId,
              copyForCarouselPage(project.copy, page, project.plan ?? undefined),
              brand,
              page.templateId,
              { imageAssetId: extractImageAssetId(source) ?? imageAssetId },
            );
            board.role = page.role;
            board.templateId = page.templateId;
            return board;
          }),
        );
        get().updateProject(projectId, (p) => {
          const next = withPages(p, formatId, boards, 0);
          const plan = p.plan ? { ...p.plan, carouselPages: pages } : p.plan;
          return {
            ...next,
            plan,
            brief: { ...p.brief, deliverables: { ...p.brief.deliverables, carousel: true } },
            snapshots: snap ? [snap, ...(p.snapshots ?? [])].slice(0, MAX_SNAPSHOTS) : p.snapshots,
          };
        });
        get().select(null);
      },
      adaptToFormat: (projectId, formatId) => {
        const s = get();
        const project = s.projects.find((p) => p.id === projectId);
        if (!project) return;
        const brand = brandById(s.brands, project.brandId);
        const sourceFormat = project.activeFormatId;
        const sourcePages = pagesOf(project, sourceFormat);
        if (!sourcePages.length) return;
        const sourceSnap = makeFormatSnapshot(
          project,
          sourceFormat,
          `轉換前 · ${formatById(sourceFormat).short}`,
          "format",
        );
        const targetSnap =
          formatId !== sourceFormat && pagesOf(project, formatId).length
            ? makeFormatSnapshot(project, formatId, `覆蓋前 · ${formatById(formatId).short}`, "format")
            : null;
        const adapted = adaptPages(sourcePages, formatId, brand, project.templateId);
        const extras = [sourceSnap, targetSnap].filter(Boolean) as Snapshot[];
        get().updateProject(projectId, (p) => {
          const next = withPages({ ...p, activeFormatId: formatId }, formatId, adapted, Math.min(p.slideIndex ?? 0, adapted.length - 1));
          return {
            ...next,
            activeFormatId: formatId,
            snapshots: extras.length ? [...extras, ...(p.snapshots ?? [])].slice(0, MAX_SNAPSHOTS) : p.snapshots,
          };
        });
        set((state) => ({ editor: { ...state.editor, selectedId: null } }));
      },
      applyQaFix: (projectId, issue) => {
        if (!issue.fix) return false;
        const s = get();
        const project = s.projects.find((p) => p.id === projectId);
        if (!project) return false;
        const brand = brandById(s.brands, project.brandId);
        const formatId = project.activeFormatId;
        const pages = pagesOf(project, formatId);
        get().captureSnapshot(projectId, "修正前 · 品質檢查", "manual");
        const nextPages = applyQaFixToPages(pages, issue.fix, brand);
        const key = historyKey(projectId, formatId);
        const stack = (s.history[key] ?? [{ pages: clone(pages), slideIndex: project.slideIndex ?? 0 }]).slice(
          0,
          (s.historyIndex[key] ?? 0) + 1,
        );
        const nextIndex = Math.min(issue.pageIndex ?? project.slideIndex ?? 0, Math.max(0, nextPages.length - 1));
        stack.push({ pages: clone(nextPages), slideIndex: nextIndex });
        set({
          history: { ...get().history, [key]: stack.slice(-40) },
          historyIndex: { ...get().historyIndex, [key]: stack.slice(-40).length - 1 },
        });
        get().updateProject(projectId, (p) => withPages(p, formatId, nextPages, nextIndex));
        if (issue.layerId) get().select(issue.layerId);
        return true;
      },
      applyQaFixes: (projectId, issues) => {
        const s = get();
        const project = s.projects.find((p) => p.id === projectId);
        if (!project) return 0;
        const brand = brandById(s.brands, project.brandId);
        const formatId = project.activeFormatId;
        const pages = pagesOf(project, formatId);
        const list = (issues ?? inspectProject(pages, brand, project.copy).issues).filter((item) => item.fix);
        if (!list.length) return 0;
        get().captureSnapshot(projectId, "修正前 · 品質檢查", "manual");
        let nextPages = pages;
        for (const issue of list) {
          if (issue.fix) nextPages = applyQaFixToPages(nextPages, issue.fix, brand);
        }
        const key = historyKey(projectId, formatId);
        const stack = (s.history[key] ?? [{ pages: clone(pages), slideIndex: project.slideIndex ?? 0 }]).slice(
          0,
          (s.historyIndex[key] ?? 0) + 1,
        );
        stack.push({ pages: clone(nextPages), slideIndex: project.slideIndex ?? 0 });
        set({
          history: { ...get().history, [key]: stack.slice(-40) },
          historyIndex: { ...get().historyIndex, [key]: stack.slice(-40).length - 1 },
        });
        get().updateProject(projectId, (p) => withPages(p, formatId, nextPages, p.slideIndex ?? 0));
        get().select(null);
        return list.length;
      },
      captureSnapshot: (projectId, name, kind = "manual") => {
        const project = get().projects.find((p) => p.id === projectId);
        if (!project) return null;
        const snap = makeFormatSnapshot(
          project,
          project.activeFormatId,
          name?.trim() || (kind === "auto" ? "自動儲存" : kind === "format" ? "尺寸版本" : "手動版本"),
          kind,
        );
        if (!snap) return null;
        get().updateProject(projectId, (p) => ({
          ...p,
          snapshots: [snap, ...(p.snapshots ?? [])].slice(0, MAX_SNAPSHOTS),
        }));
        return snap.id;
      },
      restoreSnapshot: (projectId, snapshotId) => {
        const project = get().projects.find((p) => p.id === projectId);
        if (!project) return;
        const snap = (project.snapshots ?? []).find((item) => item.id === snapshotId);
        if (!snap) return;
        if (snap.pages?.length) {
          get().updateProject(projectId, (p) => ({
            ...withPages(p, snap.formatId, clone(snap.pages ?? []), snap.slideIndex),
            activeFormatId: snap.formatId,
          }));
          get().select(null);
          return;
        }
        get().ensureArtboard(projectId, snap.formatId);
        get().updateProject(projectId, { activeFormatId: snap.formatId, slideIndex: snap.slideIndex });
        get().patchArtboard(projectId, () => clone(snap.artboard));
        get().select(null);
      },
      deleteSnapshot: (projectId, snapshotId) => {
        get().updateProject(projectId, (p) => ({
          ...p,
          snapshots: (p.snapshots ?? []).filter((s) => s.id !== snapshotId),
        }));
      },
      select: (id) => set((s) => ({ editor: { ...s.editor, selectedId: id } })),
      setEditor: (patch) => set((s) => ({ editor: { ...s.editor, ...patch } })),
      undo: (projectId) => {
        const s = get();
        const project = s.projects.find((p) => p.id === projectId);
        if (!project) return;
        const key = historyKey(projectId, project.activeFormatId);
        const stack = s.history[key];
        const idx = s.historyIndex[key] ?? -1;
        if (!stack || idx <= 0) return;
        const nextIdx = idx - 1;
        const entry = stack[nextIdx];
        set({ historyIndex: { ...s.historyIndex, [key]: nextIdx } });
        get().updateProject(projectId, (p) =>
          withPages(p, p.activeFormatId, clone(entry.pages), entry.slideIndex),
        );
        get().select(null);
      },
      redo: (projectId) => {
        const s = get();
        const project = s.projects.find((p) => p.id === projectId);
        if (!project) return;
        const key = historyKey(projectId, project.activeFormatId);
        const stack = s.history[key];
        const idx = s.historyIndex[key] ?? -1;
        if (!stack || idx >= stack.length - 1) return;
        const nextIdx = idx + 1;
        const entry = stack[nextIdx];
        set({ historyIndex: { ...s.historyIndex, [key]: nextIdx } });
        get().updateProject(projectId, (p) =>
          withPages(p, p.activeFormatId, clone(entry.pages), entry.slideIndex),
        );
        get().select(null);
      },
    }),
    {
      name: STORAGE_KEY,
      skipHydration: true,
      version: 7,
      partialize: (s) => ({
        brands: s.brands,
        assets: s.assets,
        projects: s.projects,
        lastProjectId: s.lastProjectId,
      }),
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<{
          brands: BrandKit[];
          assets: AssetMeta[];
          projects: Project[];
          lastProjectId: string | null;
        }>;
        const legacySeed = p.brands?.some(
          (brand) => brand.id === SEED_BRAND_ID && brand.name === "日食咖啡",
        ) ?? false;
        const brands = (p.brands ?? current.brands).map(migrateBrandRecord);
        const assets = (p.assets ?? current.assets)
          .filter((asset) => !legacySeed || !["asset_cup", "asset_beans", "asset_nisshoku_logo"].includes(asset.id))
          .map(migrateAssetRecord);
        if (legacySeed && !assets.some((asset) => asset.id === SEED_ASSETS[0]?.id)) {
          assets.unshift(...SEED_ASSETS);
        }
        const projects = (p.projects ?? current.projects).map(migrateProject);
        return {
          ...current,
          ...p,
          brands,
          assets,
          projects,
          lastProjectId: p.lastProjectId ?? projects[0]?.id ?? current.lastProjectId,
        };
      },
      migrate: (persisted) => {
        const state = persisted as {
          brands?: BrandKit[];
          assets?: AssetMeta[];
          projects?: Project[];
          lastProjectId?: string | null;
        };
        const legacySeed = state.brands?.some(
          (brand) => brand.id === SEED_BRAND_ID && brand.name === "日食咖啡",
        ) ?? false;
        const brands = (state.brands ?? []).map(migrateBrandRecord);
        const assets = (state.assets ?? [])
          .filter((asset) => !legacySeed || !["asset_cup", "asset_beans", "asset_nisshoku_logo"].includes(asset.id))
          .map(migrateAssetRecord);
        if (legacySeed && !assets.some((asset) => asset.id === SEED_ASSETS[0]?.id)) {
          assets.unshift(...SEED_ASSETS);
        }
        const projects = (state.projects ?? []).map(migrateProject);
        return {
          brands,
          assets,
          projects,
          lastProjectId: state.lastProjectId ?? projects[0]?.id ?? null,
        };
      },
    },
  ),
);

export function getProject(id: string): Project | undefined {
  return useStudio.getState().projects.find((p) => p.id === id);
}

export function getBrand(id: string): BrandKit | undefined {
  return useStudio.getState().brands.find((b) => b.id === id);
}

export function activeArtboard(project: Project): Artboard | undefined {
  const pages = pagesOf(project);
  if (!pages.length) return undefined;
  const idx = Math.min(project.slideIndex ?? 0, pages.length - 1);
  return pages[idx];
}

export function resolveProjectId(preferred?: string | null): string | null {
  const { projects, lastProjectId } = useStudio.getState();
  if (preferred && projects.some((p) => p.id === preferred)) return preferred;
  if (lastProjectId && projects.some((p) => p.id === lastProjectId)) return lastProjectId;
  return projects[0]?.id ?? null;
}
