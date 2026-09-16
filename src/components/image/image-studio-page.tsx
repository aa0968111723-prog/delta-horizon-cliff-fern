import { useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { HeroVisual } from "@/components/create/hero-visual";
import { StudentReviewCard } from "@/components/create/student-review-card";
import { VisionCard } from "@/components/create/vision-card";
import { PhotoDrop } from "@/components/shared/photo-drop";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { generateCopyPacks } from "@/lib/ai/copy-studio";
import {
  generateStudioImage,
  generateVisualDirections,
  analyzeStudioImage,
  toImageFormat,
  varyImagePrompt,
  type VisionAnalysis,
} from "@/lib/ai/image-studio";
import { directionPosterSvg, encodeUtf8Base64 } from "@/lib/ai/poster";
import { createCanvaDesign } from "@/lib/connect/canva";
import { putAssetBlob } from "@/lib/studio/assets-idb";
import { persistGeneratedImage } from "@/lib/studio/raster";
import { blobFromBase64, bytesToBase64 } from "@/lib/studio/bytes";
import { FORMATS, formatById } from "@/lib/studio/formats";
import { uid } from "@/lib/studio/ids";
import { guessEventName } from "@/lib/zen/dates";
import { clubCreativeDna } from "@/lib/zen/dna";
import { learnFromIg } from "@/lib/zen/insights";
import { ideaFromVision, tagsFromVision } from "@/lib/zen/vision-tags";
import type { CopyPack, FormatId, StudentReview, VisualDirection } from "@/lib/studio/types";
import { useStudio } from "@/stores/studio-store";

const VARIATIONS: { id: "composition" | "mood" | "background" | "style" | "text"; label: string }[] = [
  { id: "composition", label: "換構圖" },
  { id: "mood", label: "換氣氛" },
  { id: "background", label: "換背景" },
  { id: "style", label: "換風格" },
  { id: "text", label: "換文字空間" },
];

const TONE_LABEL: Record<CopyPack["tone"], string> = {
  short: "短版",
  normal: "一般版",
  emotional: "感性版",
  student: "學生版",
  life: "生活版",
  humor: "幽默版",
};

export function ImageStudioPage() {
  const navigate = useNavigate();
  const addAsset = useStudio((s) => s.addAsset);
  const updateAsset = useStudio((s) => s.updateAsset);
  const brands = useStudio((s) => s.brands);
  const igMemory = useStudio((s) => s.igMemory);
  const campaigns = useStudio((s) => s.campaigns);
  const assets = useStudio((s) => s.assets);
  const dna = useMemo(
    () => clubCreativeDna({ brand: brands[0], igMemory, campaigns, assets }),
    [brands, igMemory, campaigns, assets],
  );
  const learning = useMemo(() => learnFromIg(igMemory), [igMemory]);
  const [idea, setIdea] = useState("我要宣傳茶會");
  const [format, setFormat] = useState<FormatId>("feed-portrait");
  const [directions, setDirections] = useState<VisualDirection[]>([]);
  const [busy, setBusy] = useState(false);
  const [vision, setVision] = useState<VisionAnalysis | null>(null);
  const [packs, setPacks] = useState<CopyPack[]>([]);
  const [tone, setTone] = useState<CopyPack["tone"]>("student");
  const [lastImage, setLastImage] = useState<{ base64: string; mime: string; headline?: string } | null>(null);
  const [review, setReview] = useState<StudentReview | null>(null);
  const autoRan = useRef(false);

  const activePack = packs.find((p) => p.tone === tone) ?? packs[0];

  useEffect(() => {
    if (autoRan.current) return;
    autoRan.current = true;
    void (async () => {
      await copyGo(idea, true);
      const dirs = await directionsGo();
      if (dirs[0]) await gen(dirs[0], undefined, undefined, true);
    })();
  }, []);

  async function directionsGo(nextIdea = idea, formatOverride?: FormatId) {
    setBusy(true);
    try {
      const result = await generateVisualDirections({
        data: {
          idea: nextIdea,
          format: toImageFormat(formatOverride ?? format),
          memoryHint: dna.promptBlock,
        },
      });
      if (!result.ok) {
        toast.error(result.error);
        return [];
      }
      setDirections(result.directions);
      return result.directions;
    } finally {
      setBusy(false);
    }
  }

  async function copyGo(nextIdea = idea, silent = false) {
    setBusy(true);
    try {
      const result = await generateCopyPacks({
        data: {
          idea: nextIdea,
          eventName: guessEventName(nextIdea) || "",
          memoryHint: `${dna.promptBlock}\n${learning.promptBlock}`.slice(0, 800),
        },
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setPacks(result.packs);
      setReview(result.review);
      if (!silent) toast.success("已生成文案");
    } finally {
      setBusy(false);
    }
  }

  async function gen(dir: VisualDirection, kind?: (typeof VARIATIONS)[number]["id"], formatOverride?: FormatId, silent = false) {
    setBusy(true);
    try {
      const nextFormat = formatOverride ?? format;
      const spec = formatById(nextFormat);
      const prompt = kind ? varyImagePrompt(dir.prompt, kind) : dir.prompt;
      let payload = {
        imageBase64: encodeUtf8Base64(
          directionPosterSvg({
            headline: dir.headline,
            subhead: dir.subhead,
            concept: dir.concept,
            palette: dir.palette,
            name: dir.name,
            width: spec.width,
            height: spec.height,
            variation: kind,
          }),
        ),
        mime: "image/svg+xml",
      };
      try {
        const result = await generateStudioImage({
          data: {
            prompt,
            format: toImageFormat(nextFormat),
            headline: dir.headline,
            subhead: dir.subhead,
            palette: dir.palette,
            name: dir.name,
            variation: kind,
          },
        });
        if (result.ok) payload = { imageBase64: result.imageBase64, mime: result.mime };
      } catch {
        /* keep poster */
      }
      let png: { blob: Blob; mime: string; base64: string };
      try {
        png = await persistGeneratedImage({
          base64: payload.imageBase64,
          mime: payload.mime,
          width: spec.width,
          height: spec.height,
        });
      } catch {
        png = {
          blob: blobFromBase64(payload.imageBase64, payload.mime),
          mime: payload.mime,
          base64: payload.imageBase64,
        };
      }
      const id = uid("asset");
      await putAssetBlob(id, png.blob);
      addAsset({
        id,
        name: [dir.name, kind ? VARIATIONS.find((v) => v.id === kind)?.label : null, spec.short].filter(Boolean).join(" · "),
        kind: "image",
        category: "ai",
        mime: png.mime,
        width: spec.width,
        height: spec.height,
        tags: ["AI 生成", idea, spec.short],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        source: "generated",
        licenseNotes: "來源：AI Generated",
        licenseOwner: "禪光",
        favorite: false,
        lastUsedAt: Date.now(),
        useCount: 0,
      });
      setLastImage({ base64: png.base64, mime: png.mime, headline: dir.headline });
      if (!silent) toast.success("已存進素材庫（AI Generated）");
    } finally {
      setBusy(false);
    }
  }

  async function sendToCanva(dir?: VisualDirection) {
    setBusy(true);
    try {
      const result = await createCanvaDesign({
        data: {
          title: dir?.name || idea.slice(0, 20) || "茶會",
          hook: activePack?.hook || dir?.headline || idea,
          body: activePack?.body || dir?.concept || idea,
          cta: activePack?.cta || "來坐一下",
          format,
          palette: dir?.palette || dna.palette,
          composition: dir?.composition,
          headline: dir?.headline,
          imageBase64: lastImage?.base64,
          mime: lastImage?.mime,
        },
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      await navigator.clipboard.writeText(result.brief).catch(() => undefined);
      window.open(result.editUrl, "_blank", "noopener,noreferrer");
      toast.success(result.note);
    } finally {
      setBusy(false);
    }
  }

  async function onFile(file: File) {
    const buf = await file.arrayBuffer();
    const b64 = bytesToBase64(new Uint8Array(buf));
    if (b64.length > 1_800_000) {
      toast.error("圖檔太大，請用較小的照片。");
      return;
    }
    setBusy(true);
    try {
      const id = uid("asset");
      await putAssetBlob(id, file);
      addAsset({
        id,
        name: file.name.replace(/\.[^.]+$/, "") || "上傳圖片",
        kind: "image",
        category: "photo",
        mime: file.type || "image/jpeg",
        width: 0,
        height: 0,
        tags: ["上傳"],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        source: "upload",
        licenseNotes: "來源：本機上傳",
        licenseOwner: "禪光",
        favorite: false,
        lastUsedAt: null,
        useCount: 0,
      });
      const result = await analyzeStudioImage({ data: { imageBase64: b64, mime: file.type } });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setVision(result.analysis);
      updateAsset(id, { tags: tagsFromVision(result.analysis, ["上傳"]) });
      const next = ideaFromVision(result.analysis, idea);
      setIdea(next);
      toast.success("已理解這張圖，接著生成文案與相似視覺");
      await copyGo(next);
      const dirs = await directionsGo(next);
      if (dirs[0]) await gen(dirs[0], undefined, undefined, true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-6 pb-36 md:px-8 md:py-10 lg:pb-10">
      <PageHeader
        kicker="Image Studio"
        title="不要只生禪風海報"
        description="先想學生情境、淡水夜晚、三色光、龜龜，再給三個方向。"
      />
      <p className="mt-3 text-xs text-muted">
        這次會參考過去 IG：「{learning.bestHookShape}」。{learning.avoid}
      </p>
      <Textarea className="mt-6" value={idea} onChange={(e) => setIdea(e.target.value)} />
      <div className="mt-3 flex flex-wrap gap-2">
        {FORMATS.filter((f) => f.id !== "feed-landscape").map((f) => (
          <Button key={f.id} size="sm" variant={format === f.id ? "default" : "secondary"} onClick={() => setFormat(f.id)}>
            {f.short}
          </Button>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button disabled={busy} onClick={() => void directionsGo()}>
          提出三個視覺方向
        </Button>
        <Button variant="secondary" disabled={busy} onClick={() => void copyGo()}>
          生成文案
        </Button>
        <Button variant="secondary" disabled={busy} onClick={() => void sendToCanva()}>
          送進 Canva
        </Button>
      </div>
      {lastImage ? (
        <section className="mt-6">
          <h2 className="text-sm font-medium">主視覺</h2>
          <div className="mt-3">
            <HeroVisual base64={lastImage.base64} mime={lastImage.mime} headline={lastImage.headline} />
          </div>
        </section>
      ) : null}
      <ul className="mt-6 space-y-3">
        {directions.map((dir) => (
          <li key={dir.id} className="rounded-2xl bg-surface p-4 shadow-[var(--shadow-border)]">
            <p className="font-medium">{dir.name}</p>
            <p className="mt-1 text-sm">{dir.concept}</p>
            <p className="mt-2 text-xs text-muted">配色 {dir.palette}</p>
            <p className="text-xs text-muted">構圖 {dir.composition}</p>
            <p className="text-xs text-muted">字體 {dir.typeDirection}</p>
            <p className="mt-2 text-sm">
              {dir.headline} · {dir.subhead}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button size="sm" disabled={busy} onClick={() => void gen(dir)}>
                生成此方向
              </Button>
              <Button size="sm" variant="secondary" disabled={busy} onClick={() => void gen(dir)}>
                重新生成
              </Button>
              {VARIATIONS.map((item) => (
                <Button key={item.id} size="sm" variant="secondary" disabled={busy} onClick={() => void gen(dir, item.id)}>
                  {item.label}
                </Button>
              ))}
              {FORMATS.filter((f) => f.id !== "feed-landscape" && f.id !== format).map((item) => (
                <Button
                  key={`ext-${item.id}`}
                  size="sm"
                  variant="secondary"
                  disabled={busy}
                  onClick={() => void gen(dir, undefined, item.id)}
                >
                  延伸 {item.short}
                </Button>
              ))}
              <Button size="sm" variant="secondary" disabled={busy} onClick={() => void sendToCanva(dir)}>
                這個方向送 Canva
              </Button>
            </div>
          </li>
        ))}
      </ul>
      {packs.length ? (
        <section className="mt-8">
          <h2 className="text-sm font-medium">從畫面／想法生成的文案</h2>
          <div className="mt-2 flex flex-wrap gap-2">
            {packs.map((pack) => (
              <Button key={pack.tone} size="sm" variant={tone === pack.tone ? "default" : "secondary"} onClick={() => setTone(pack.tone)}>
                {TONE_LABEL[pack.tone]}
              </Button>
            ))}
          </div>
          {activePack ? (
            <article className="mt-3 rounded-2xl bg-surface p-4 shadow-[var(--shadow-border)]">
              <p className="font-display text-xl">{activePack.hook}</p>
              <p className="mt-3 whitespace-pre-wrap text-sm">{activePack.body}</p>
              <p className="mt-3 text-sm">{activePack.cta}</p>
              <p className="mt-2 text-xs text-muted">{activePack.hashtags.join(" ")}</p>
            </article>
          ) : null}
        </section>
      ) : null}
      {review ? (
        <StudentReviewCard
          review={review}
          onApplyHook={(hook) => {
            setPacks((rows) =>
              rows.map((pack) => ({
                ...pack,
                hook,
                body: pack.body.replace(pack.hook, hook),
              })),
            );
            toast.success("已套用學生視角 Hook");
          }}
        />
      ) : null}
      <section className="mt-10">
        <h2 className="text-sm font-medium">丟入照片／舊海報</h2>
        <PhotoDrop disabled={busy} onFile={(file) => void onFile(file)} />
        {vision ? (
          <VisionCard vision={vision}>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                size="sm"
                onClick={() => {
                  const next = `${vision.content}。延續這個品牌 DNA，做新的活動，不要複製舊作品。`;
                  setIdea(next);
                  void directionsGo(next);
                  void copyGo(next);
                }}
              >
                生成相似視覺
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  const next = `${vision.content}。保留畫面內容，重新設計成適合淡江學生停留的 IG 主視覺，不要複製舊作品。`;
                  setIdea(next);
                  void directionsGo(next);
                }}
              >
                保留內容重新設計
              </Button>
              <Button size="sm" variant="secondary" onClick={() => void navigate({ to: "/create", search: { mode: "idea", idea: vision.content } })}>
                延續這個風格
              </Button>
              <Button size="sm" variant="secondary" onClick={() => void navigate({ to: "/create", search: { mode: "story", idea: vision.content } })}>
                做成限動
              </Button>
              <Button size="sm" variant="secondary" onClick={() => void navigate({ to: "/create", search: { mode: "carousel", idea: vision.content } })}>
                做成 Carousel
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  setFormat("reels-cover");
                  void directionsGo(vision.content, "reels-cover");
                }}
              >
                做成 Reels Cover
              </Button>
            </div>
          </VisionCard>
        ) : null}
      </section>
    </main>
  );
}
