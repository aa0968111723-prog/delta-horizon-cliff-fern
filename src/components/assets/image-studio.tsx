import { ImagePlus, Sparkles, WandSparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { generateCreativeImage, getMultimodalStatus } from "@/lib/ai/multimodal";
import { describeImageAdapter, type ImageAiStatus } from "@/lib/ai/image-status";
import { campaignImageIdea } from "@/lib/creative/brief-from-campaign";
import { buildCreativeMemoryContext, memoryInjectionHints } from "@/lib/creative/memory";
import { hashtagsFromInstagramMemory } from "@/lib/connections/instagram-normalize";
import { CreationLoop } from "@/components/shared/creation-loop";
import { useCreative } from "@/stores/creative-store";
import { base64ImageToBlob, prepareImageForAi } from "@/lib/studio/ai-image-client";
import { getAssetStorage } from "@/lib/studio/asset-storage";
import { uid } from "@/lib/studio/ids";
import type { AssetMeta } from "@/lib/studio/types";
import { cn } from "@/lib/utils";
import { useConnectionStore } from "@/stores/connection-store";
import { useStudio } from "@/stores/studio-store";
import { useUi } from "@/stores/ui-store";

const FORMATS = [
  { id: "4:5", label: "IG 貼文 4:5" },
  { id: "1:1", label: "IG 方形 1:1" },
  { id: "9:16", label: "Story／Reels 9:16" },
] as const;

const DIRECTIONS = [
  {
    id: "campus",
    label: "A｜淡江生活紀實",
    detail: "下課、通勤或夜晚校園的真實片段，自然光與朋友感，像學生真的會收藏的照片。",
  },
  {
    id: "light",
    label: "B｜三色光留白",
    detail: "湖綠、珊瑚與柔金形成有空氣感的光影構圖，保留大標題安全區，不落入宗教符號。",
  },
  {
    id: "tamsui",
    label: "C｜淡水慢一點",
    detail: "風、坡道、雨後或黃昏的淡水感，把禪轉成一個人也能喘口氣的日常畫面。",
  },
] as const;

export function ImageStudio() {
  const addAsset = useStudio((state) => state.addAsset);
  const brand = useStudio((state) => state.brands[0]);
  const assets = useStudio((state) => state.assets);
  const campaigns = useCreative((state) => state.campaigns);
  const activeCampaignId = useCreative((state) => state.activeCampaignId);
  const styleReferences = useConnectionStore((state) => state.styleReferences);
  const instagramHashtags = hashtagsFromInstagramMemory(useConnectionStore((state) => state.instagramItems));
  const stylePrompt = useUi((state) => state.stylePrompt);
  const setStylePrompt = useUi((state) => state.setStylePrompt);
  const [idea, setIdea] = useState("下週晚上的茶會，讓剛開學很忙的淡江學生下課後喘口氣");
  const [ideaTouched, setIdeaTouched] = useState(false);
  const [directionId, setDirectionId] = useState<(typeof DIRECTIONS)[number]["id"]>("campus");
  const [aspectRatio, setAspectRatio] = useState<(typeof FORMATS)[number]["id"]>("4:5");
  const [available, setAvailable] = useState<ImageAiStatus | null>(null);
  const [busy, setBusy] = useState(false);

  const direction = useMemo(
    () => DIRECTIONS.find((item) => item.id === directionId) ?? DIRECTIONS[0],
    [directionId],
  );

  useEffect(() => {
    if (!stylePrompt) return;
    setIdea(`${stylePrompt.title}。風格參考：${stylePrompt.provider}／${stylePrompt.collection}。${stylePrompt.notes}`);
    setIdeaTouched(true);
    document.getElementById("image-studio")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [stylePrompt]);

  useEffect(() => {
    if (ideaTouched || stylePrompt) return;
    const campaign = campaigns.find((item) => item.id === activeCampaignId) ?? campaigns[0];
    if (campaign) setIdea(campaignImageIdea(campaign));
  }, [activeCampaignId, campaigns, ideaTouched, stylePrompt]);

  useEffect(() => {
    let alive = true;
    getMultimodalStatus()
      .then((result) => {
        if (alive) setAvailable(result);
      })
      .catch(() => {
        if (alive) setAvailable(describeImageAdapter(false));
      });
    return () => {
      alive = false;
    };
  }, []);

  async function generate() {
    if (idea.trim().length < 3) {
      toast.error("先寫下活動或想傳達的感覺");
      return;
    }
    if (available && !available.available) {
      toast.error(available.generateBlockedMessage);
      return;
    }
    setBusy(true);
    try {
      const result = await generateCreativeImage({
        data: {
          idea: stylePrompt ? `${idea}\n參考來源：${stylePrompt.provider}／${stylePrompt.collection}` : idea,
          direction: direction.detail,
          aspectRatio,
          brandMemory: brand
            ? buildCreativeMemoryContext({
                brand,
                assets,
                campaigns,
                styleReferences,
                instagramHashtags,
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
      const id = uid("asset_ai");
      await getAssetStorage().put(id, prepared.blob);
      const meta: AssetMeta = {
        id,
        name: `${idea.trim().slice(0, 24)}｜${direction.label.slice(2)}`,
        kind: "image",
        category: "background",
        mime: prepared.mime,
        width: prepared.width,
        height: prepared.height,
        tags: ["AI 生成", "淡江禪學社", direction.label.slice(2), aspectRatio],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        source: "generated",
        licenseNotes: "由 xAI Grok Imagine 依本次創作需求生成；發布前仍需人工檢查人物、文字安全區與品牌適切性。",
        licenseOwner: brand?.name ?? "淡江大學禪學社",
        favorite: false,
        lastUsedAt: null,
        useCount: 0,
        generationPrompt: result.prompt,
        provenance: {
          provider: "generated",
          label: "xAI 生成／Grok Imagine",
          collection: direction.label,
          importedAt: Date.now(),
        },
      };
      addAsset(meta);
      toast.success("主視覺已加入 Creative Library");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "圖片生成失敗");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
    <section id="image-studio" className="mt-6 overflow-hidden rounded-3xl bg-accent text-accent-fg shadow-[var(--shadow-artboard)]">
      <div className="grid lg:grid-cols-[1fr_1.15fr]">
        <div className="p-5 md:p-7">
          <Badge className="bg-accent-fg/10 text-accent-fg">
            <Sparkles className="size-3.5" />
            AI Image Studio
          </Badge>
          <h2 className="mt-4 text-2xl font-semibold tracking-tight">先想情境，再生成畫面</h2>
          <p className="mt-2 max-w-md text-sm leading-6 text-accent-fg/70">
            不是只寫「禪風海報」。先選淡江學生會有感的視覺角度，再生成一張可放進 Studio 的主視覺。
            {brand
              ? ` 本次會帶入：${memoryInjectionHints({ brand, assets, campaigns, styleReferences, instagramHashtags }).join("、") || "Brand Memory 預設校園情境"}。`
              : ""}
          </p>
          {stylePrompt ? (
            <div className="mt-4 rounded-2xl bg-accent-fg/10 px-4 py-3">
              <p className="text-xs text-accent-fg/70">風格參考</p>
              <p className="mt-1 text-sm">{stylePrompt.provider}／{stylePrompt.collection}</p>
              <button type="button" className="mt-2 text-xs underline" onClick={() => setStylePrompt(null)}>清除參考</button>
            </div>
          ) : null}
          <div className="mt-5">
            <label htmlFor="image-idea" className="text-xs font-medium text-accent-fg/70">活動或想法</label>
            <Textarea
              id="image-idea"
              value={idea}
              onChange={(event) => {
                setIdeaTouched(true);
                setIdea(event.target.value);
              }}
              className="mt-2 min-h-28 border-accent-fg/15 bg-accent-fg/10 text-accent-fg placeholder:text-accent-fg/40"
              placeholder="例如：期中前的夜間茶會，讓通勤與住宿生都想找朋友一起來"
            />
          </div>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row">
            <Select value={aspectRatio} onValueChange={(value) => setAspectRatio(value as typeof aspectRatio)}>
              <SelectTrigger className="border-accent-fg/15 bg-accent-fg/10 text-accent-fg sm:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FORMATS.map((format) => <SelectItem key={format.id} value={format.id}>{format.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button
              className="min-h-11 flex-1 bg-accent-fg text-accent hover:bg-accent-fg/90"
              disabled={busy || available === null}
              onClick={() => void generate()}
            >
              <WandSparkles className="size-4" />
              {busy ? "正在生成一張…" : !available?.available ? "確認圖片服務" : "生成並加入素材庫"}
            </Button>
          </div>
          {available && !available.available ? (
            <p className="mt-3 rounded-xl bg-accent-fg/10 px-3 py-3 text-xs leading-5 text-accent-fg/80" role="status">
              {available.detail}
            </p>
          ) : null}
        </div>

        <div className="bg-surface p-4 text-fg md:p-6">
          <p className="mb-3 text-xs font-medium text-muted">選一個視覺方向</p>
          <div className="space-y-2">
            {DIRECTIONS.map((item) => (
              <button
                key={item.id}
                type="button"
                aria-pressed={directionId === item.id}
                onClick={() => setDirectionId(item.id)}
                className={cn(
                  "w-full rounded-2xl p-4 text-left transition-colors",
                  directionId === item.id ? "bg-surface-2 shadow-[var(--shadow-border-hover)]" : "hover:bg-bg",
                )}
              >
                <span className="flex items-center gap-2 text-sm font-medium">
                  <ImagePlus className="size-4 text-accent" />
                  {item.label}
                </span>
                <span className="mt-1.5 block text-xs leading-5 text-muted">{item.detail}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
    <div className="mt-4">
      <CreationLoop current="image" />
    </div>
    </>
  );
}
