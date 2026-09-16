import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import {
  generateStudioImage,
  generateVisualDirections,
  analyzeStudioImage,
  toImageFormat,
  varyImagePrompt,
  type VisionAnalysis,
} from "@/lib/ai/image-studio";
import { putAssetBlob } from "@/lib/studio/assets-idb";
import { blobFromBase64, bytesToBase64 } from "@/lib/studio/bytes";
import { formatById } from "@/lib/studio/formats";
import { uid } from "@/lib/studio/ids";
import { tagsFromVision } from "@/lib/zen/vision-tags";
import type { FormatId, VisualDirection } from "@/lib/studio/types";
import { useStudio } from "@/stores/studio-store";
import { FORMATS } from "@/lib/studio/formats";

const VARIATIONS: { id: "composition" | "mood" | "background" | "style" | "text"; label: string }[] = [
  { id: "composition", label: "換構圖" },
  { id: "mood", label: "換氣氛" },
  { id: "background", label: "換背景" },
  { id: "style", label: "換風格" },
  { id: "text", label: "換文字空間" },
];

export function ImageStudioPage() {
  const navigate = useNavigate();
  const addAsset = useStudio((s) => s.addAsset);
  const updateAsset = useStudio((s) => s.updateAsset);
  const [idea, setIdea] = useState("我要宣傳茶會");
  const [format, setFormat] = useState<FormatId>("feed-portrait");
  const [directions, setDirections] = useState<VisualDirection[]>([]);
  const [busy, setBusy] = useState(false);
  const [vision, setVision] = useState<VisionAnalysis | null>(null);

  async function directionsGo(nextIdea = idea, formatOverride?: FormatId) {
    setBusy(true);
    try {
      const result = await generateVisualDirections({
        data: { idea: nextIdea, format: toImageFormat(formatOverride ?? format) },
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setDirections(result.directions);
    } finally {
      setBusy(false);
    }
  }

  async function gen(dir: VisualDirection, kind?: (typeof VARIATIONS)[number]["id"], formatOverride?: FormatId) {
    setBusy(true);
    try {
      const nextFormat = formatOverride ?? format;
      const prompt = kind ? varyImagePrompt(dir.prompt, kind) : dir.prompt;
      const result = await generateStudioImage({ data: { prompt, format: toImageFormat(nextFormat) } });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      const spec = formatById(nextFormat);
      const blob = blobFromBase64(result.imageBase64, result.mime);
      const id = uid("asset");
      await putAssetBlob(id, blob);
      addAsset({
        id,
        name: [dir.name, kind ? VARIATIONS.find((v) => v.id === kind)?.label : null, spec.short].filter(Boolean).join(" · "),
        kind: "image",
        category: "ai",
        mime: result.mime,
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
      toast.success("已存進素材庫（AI Generated）");
    } finally {
      setBusy(false);
    }
  }

  async function onFile(file: File) {
    const buf = await file.arrayBuffer();
    const b64 = bytesToBase64(new Uint8Array(buf));
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
      toast.success("已進素材庫，並完成圖片理解");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-6 md:px-8 md:py-10">
      <PageHeader
        kicker="Image Studio"
        title="不要只生禪風海報"
        description="先想學生情境、淡水夜晚、三色光、龜龜，再給三個方向。"
      />
      <Textarea className="mt-6" value={idea} onChange={(e) => setIdea(e.target.value)} />
      <div className="mt-3 flex flex-wrap gap-2">
        {FORMATS.filter((f) => f.id !== "feed-landscape").map((f) => (
          <Button key={f.id} size="sm" variant={format === f.id ? "default" : "secondary"} onClick={() => setFormat(f.id)}>
            {f.short}
          </Button>
        ))}
      </div>
      <Button className="mt-4" disabled={busy} onClick={() => void directionsGo()}>
        提出三個視覺方向
      </Button>
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
            </div>
          </li>
        ))}
      </ul>
      <section className="mt-10">
        <h2 className="text-sm font-medium">丟入照片／舊海報</h2>
        <Input className="mt-2" type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && void onFile(e.target.files[0])} />
        {vision ? (
          <div className="mt-3 rounded-2xl bg-surface p-4 text-sm shadow-[var(--shadow-border)]">
            <p>{vision.content}</p>
            <p className="mt-2 text-muted">學生感：{vision.studentFeel}</p>
            <p className="text-muted">
              太宗教？{vision.tooReligious ? "是" : "否"} · 太老氣？{vision.tooOld ? "是" : "否"} · 太 AI？{vision.tooAi ? "可能" : "還好"}
            </p>
            <p className="text-muted">符合淡江學生？{vision.fitsTamkang ? "接近" : "還要再生活一點"}</p>
            <ul className="mt-2 list-disc pl-4">
              {vision.suggestions.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                size="sm"
                onClick={() => {
                  const next = `${vision.content}。延續這個品牌 DNA，做新的活動，不要複製舊作品。`;
                  setIdea(next);
                  void directionsGo(next);
                }}
              >
                生成相似視覺
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
          </div>
        ) : null}
      </section>
    </main>
  );
}
