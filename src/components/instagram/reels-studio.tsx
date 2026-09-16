import { Link } from "@tanstack/react-router";
import { Copy, Film, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { generateCreativeImage, getMultimodalStatus } from "@/lib/ai/multimodal";
import { describeImageAdapter, type ImageAiStatus } from "@/lib/ai/image-status";
import { ImageServiceNotice } from "@/components/shared/image-service-notice";
import { hashtagsFromInstagramMemory } from "@/lib/connections/instagram-normalize";
import { buildCreativeMemoryContext } from "@/lib/creative/memory";
import { useCreative } from "@/stores/creative-store";
import { base64ImageToBlob, prepareImageForAi } from "@/lib/studio/ai-image-client";
import { getAssetStorage } from "@/lib/studio/asset-storage";
import { uid } from "@/lib/studio/ids";
import type { AssetMeta, ReelsBeat } from "@/lib/studio/types";
import { useConnectionStore } from "@/stores/connection-store";
import { useStudio } from "@/stores/studio-store";
import { useUi } from "@/stores/ui-store";

export function ReelsStudio({ projectId }: { projectId?: string }) {
  const project = useStudio((state) => state.projects.find((item) => item.id === projectId) ?? state.projects[0]);
  const brand = useStudio((state) => state.brands.find((item) => item.id === project?.brandId) ?? state.brands[0]);
  const addAsset = useStudio((state) => state.addAsset);
  const assets = useStudio((state) => state.assets);
  const campaigns = useCreative((state) => state.campaigns);
  const setActiveFormat = useStudio((state) => state.setActiveFormat);
  const patchArtboard = useStudio((state) => state.patchArtboard);
  const setStylePrompt = useUi((state) => state.setStylePrompt);
  const beats = project?.plan?.copyPack?.reelsScript ?? [];
  const [busy, setBusy] = useState(false);
  const [available, setAvailable] = useState<ImageAiStatus | null>(null);

  useEffect(() => {
    void getMultimodalStatus()
      .then((result) => setAvailable(result))
      .catch(() => setAvailable(describeImageAdapter(false)));
  }, []);

  async function generateCover() {
    if (!project) return;
    if (available && !available.available) {
      toast.error(available.generateBlockedMessage);
      return;
    }
    setBusy(true);
    try {
      const idea = `${project.name} 的 Reels 封面，夜晚校園、三色光、大標題安全區`;
      const result = await generateCreativeImage({
        data: {
          idea,
          direction: project.plan?.visualDirection || "淡江學生生活感，不要宗教符號",
          aspectRatio: "9:16",
          brandMemory: brand
            ? buildCreativeMemoryContext({
                brand,
                assets,
                campaigns,
                styleReferences: useConnectionStore.getState().styleReferences,
                instagramHashtags: hashtagsFromInstagramMemory(useConnectionStore.getState().instagramItems),
              })
            : undefined,
        },
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      const raw = await base64ImageToBlob(result.image.base64, result.image.mime);
      const prepared = await prepareImageForAi(raw);
      const id = uid("asset_reels");
      await getAssetStorage().put(id, prepared.blob);
      const meta: AssetMeta = {
        id,
        name: `${project.name}｜Reels 封面`,
        kind: "image",
        category: "background",
        mime: prepared.mime,
        width: prepared.width,
        height: prepared.height,
        tags: ["Reels", "AI 生成", "封面"],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        source: "generated",
        licenseNotes: "由 xAI 依 Reels 封面需求生成，發布前需人工檢查。",
        licenseOwner: brand?.name ?? "淡江大學禪學社",
        favorite: false,
        lastUsedAt: null,
        useCount: 0,
        generationPrompt: result.prompt,
        provenance: {
          provider: "generated",
          label: "AI Generated／Reels Cover",
          collection: "Reels",
          importedAt: Date.now(),
        },
      };
      addAsset(meta);
      if (project) {
        setActiveFormat(project.id, "reels-cover");
        patchArtboard(project.id, (artboard) => ({
          ...artboard,
          background: { ...artboard.background, type: "image", assetId: id },
        }));
      }
      toast.success("Reels 封面已加入素材庫，並放到 Studio 的 Reels 封面");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "封面生成失敗");
    } finally {
      setBusy(false);
    }
  }

  if (!project) {
    return <p className="rounded-2xl bg-surface p-8 text-center text-sm text-muted">先完成一則創作，才會有 Reels 腳本。</p>;
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-display text-xl">Reels 腳本</h2>
            <Badge variant={beats.length ? "success" : "default"}>{beats.length ? "有腳本" : "尚未生成"}</Badge>
          </div>
          <p className="mt-1 text-sm leading-6 text-muted">
            用 Copy Studio 的 reelsScript，配 9:16 封面。不會假裝能直接上傳 Instagram，也不會顯示假觀看次數。
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => void generateCover()} disabled={busy}>
            <Sparkles className="size-4" />
            {busy ? "生成中…" : available && !available.available ? "確認圖片服務" : "生成封面"}
          </Button>
          <Button
            variant="secondary"
            onClick={async () => {
              if (!beats.length) return;
              await navigator.clipboard.writeText(formatScript(beats));
              toast.success("已複製 Reels 腳本");
            }}
            disabled={!beats.length}
          >
            <Copy className="size-4" />
            複製腳本
          </Button>
        </div>
      </div>

      {available && !available.available ? (
        <ImageServiceNotice status={available} />
      ) : null}

      {beats.length ? (
        <ol className="space-y-2">
          {beats.map((beat, index) => (
            <li key={`${beat.timing}-${index}`} className="rounded-2xl bg-surface p-4 shadow-[var(--shadow-border)]">
              <div className="flex items-center gap-2 text-xs text-accent">
                <Film className="size-4" />
                {beat.timing}
              </div>
              <p className="mt-2 font-medium">{beat.subtitle}</p>
              <p className="mt-1 text-sm leading-6 text-muted">畫面：{beat.visual}</p>
              <p className="text-sm leading-6 text-muted">旁白：{beat.voiceover}</p>
              <p className="text-xs text-subtle">轉場 {beat.transition}｜素材 {beat.assetSuggestion}</p>
              <Button
                size="sm"
                variant="ghost"
                className="mt-2"
                onClick={() => setStylePrompt({
                  title: beat.subtitle,
                  collection: "Reels",
                  notes: `${beat.visual}；${beat.assetSuggestion}`,
                  provider: "Reels",
                })}
              >
                當成封面參考
              </Button>
            </li>
          ))}
        </ol>
      ) : (
        <div className="rounded-2xl bg-bg px-4 py-10 text-center">
          <p className="text-sm text-muted">
            到 Studio 的 Copy Studio 生成 Copy Pack 後，這裡會出現五段 Reels 腳本。不會假裝能直接上傳 Instagram。
          </p>
          <Button asChild variant="secondary" className="mt-4 min-h-11">
            <Link to="/assistant">去生成文案</Link>
          </Button>
        </div>
      )}
    </section>
  );
}

function formatScript(beats: ReelsBeat[]) {
  return beats.map((item) => `${item.timing}\n畫面：${item.visual}\n字幕：${item.subtitle}\n旁白：${item.voiceover}\n轉場：${item.transition}\n素材：${item.assetSuggestion}`).join("\n\n");
}
