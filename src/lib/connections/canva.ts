import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { buildCanvaPasteBrief } from "./canva-brief.ts";
import { unwrapServerInput } from "./json.ts";
import type { ConnectorResult, ExternalMemoryItem, OfficialProviderStatus } from "./types.ts";
import { genericError, unavailableError } from "./safe-result.ts";

const SearchSchema = z.object({
  query: z.string().trim().max(200).optional(),
  collection: z.string().trim().max(80).optional(),
});

const BriefSchema = z.object({
  campaignName: z.string().trim().min(1).max(160),
  hook: z.string().max(240).optional(),
  concept: z.string().max(500).optional(),
  schedule: z.string().max(120).optional(),
  location: z.string().max(120).optional(),
  cta: z.string().max(80).optional(),
  visualDirection: z.string().max(400).optional(),
  collection: z.string().max(80).optional(),
});

export const getCanvaStatus = createServerFn({ method: "POST" }).handler(async (): Promise<OfficialProviderStatus> => {
  const { currentCanvaStatus } = await import("./canva-oauth.server.ts");
  return currentCanvaStatus();
});

export const startCanvaConnect = createServerFn({ method: "POST" }).handler(async (): Promise<ConnectorResult<{ url: string }>> => {
  const { currentCanvaStatus, listCanvaViaMcp, startCanvaOAuthUrl } = await import("./canva-oauth.server.ts");
  const status = await currentCanvaStatus();
  if (!status.available) {
    return unavailableError("Canva 尚未在此環境提供", "沒有 MCP catalog，也沒有平台注入的 Canva OAuth client。這裡不接受貼 Token。");
  }
  if (status.mode === "mcp") {
    const probe = await listCanvaViaMcp();
    if (!probe.ok && probe.loginRequired && probe.loginUrl) {
      return { ok: true, data: { url: probe.loginUrl } };
    }
    if (!probe.ok) return probe;
    return genericError("Canva MCP 已可用，請直接同步");
  }
  return startCanvaOAuthUrl();
});

export const listCanvaDesigns = createServerFn({ method: "POST" })
  .validator((input: unknown) => SearchSchema.parse(unwrapServerInput(input) ?? {}))
  .handler(async ({ data }): Promise<ConnectorResult<ExternalMemoryItem[]>> => {
    try {
      const { listCanvaDesignRecords } = await import("./canva-oauth.server.ts");
      const result = await listCanvaDesignRecords(data.query);
      if (!result.ok) return result;
      const collection = data.collection?.trim();
      return {
        ok: true,
        data: collection
          ? result.data.filter((item) => item.collection === collection || item.title.includes(collection))
          : result.data,
      };
    } catch (error) {
      return genericError(error instanceof Error ? error.message : "Canva 暫時無法使用");
    }
  });

export const searchCanvaDesigns = createServerFn({ method: "POST" })
  .validator((input: unknown) => SearchSchema.parse(unwrapServerInput(input) ?? {}))
  .handler(async ({ data }): Promise<ConnectorResult<ExternalMemoryItem[]>> => {
    if (!data.query?.trim()) return genericError("請先輸入要找的設計");
    try {
      const { listCanvaDesignRecords } = await import("./canva-oauth.server.ts");
      return listCanvaDesignRecords(data.query.trim());
    } catch (error) {
      return genericError(error instanceof Error ? error.message : "Canva 搜尋失敗");
    }
  });

export const disconnectCanva = createServerFn({ method: "POST" }).handler(async (): Promise<ConnectorResult<{ cleared: true }>> => {
  const { revokeCanvaSession } = await import("./canva-oauth.server.ts");
  await revokeCanvaSession();
  return { ok: true, data: { cleared: true } };
});

export const copyCanvaBrief = createServerFn({ method: "POST" })
  .validator((input: unknown) => BriefSchema.parse(unwrapServerInput(input)))
  .handler(async ({ data }) => ({
    ok: true as const,
    text: buildCanvaPasteBrief(data),
    autofill: false as const,
    note: "Design Autofill 需要 Canva Enterprise，目前未開通。請把 brief 貼進 Canva 手動套用。",
  }));

const StyleSchema = z.object({
  designId: z.string().trim().min(1).max(80),
});

export const analyzeCanvaStyle = createServerFn({ method: "POST" })
  .validator((input: unknown) => StyleSchema.parse(unwrapServerInput(input)))
  .handler(async ({ data }): Promise<ConnectorResult<{
    snippet: string;
    title: string;
    collection: string;
    source: "vision" | "metadata";
    analysis: import("./types.ts").CanvaStyleAnalysis;
  }>> => {
    try {
      const { listCanvaDesignRecords, readCanvaDesignThumbnail } = await import("./canva-oauth.server.ts");
      const { styleAnalysisFromCanvaMetadata, styleSnippetFromAnalysis } = await import("./canva-style.ts");
      const listed = await listCanvaDesignRecords();
      const item = listed.ok ? listed.data.find((row) => row.id === data.designId) : undefined;
      const metadata = styleAnalysisFromCanvaMetadata({
        title: item?.title || data.designId,
        collection: item?.collection,
        snippet: item?.snippet,
      });
      const thumb = await readCanvaDesignThumbnail(data.designId);
      if (thumb.ok) {
        const { runVisionAnalysis } = await import("@/lib/ai/multimodal");
        const vision = await runVisionAnalysis(thumb.data.dataUrl);
        if (vision.ok) {
          const analysis = {
            summary: vision.analysis.summary,
            colors: vision.analysis.colors,
            composition: vision.analysis.composition,
            studentFit: vision.analysis.studentFit,
            recommendations: vision.analysis.recommendations,
            suggestedTags: vision.analysis.suggestedTags,
          };
          return {
            ok: true,
            data: {
              snippet: styleSnippetFromAnalysis(thumb.data.collection, analysis),
              title: thumb.data.title,
              collection: thumb.data.collection,
              source: "vision",
              analysis,
            },
          };
        }
      } else if (!item && !listed.ok) {
        return thumb;
      }
      return {
        ok: true,
        data: {
          snippet: styleSnippetFromAnalysis(item?.collection || metadata.suggestedTags[0] || "Canva 設計", metadata),
          title: item?.title || data.designId,
          collection: item?.collection || metadata.suggestedTags[0] || "Canva 設計",
          source: "metadata",
          analysis: metadata,
        },
      };
    } catch (error) {
      return genericError(error instanceof Error ? error.message : "風格分析失敗");
    }
  });
