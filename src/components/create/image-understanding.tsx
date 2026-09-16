import { AlertTriangle, CheckCircle2, Eye, Loader2, PenLine, Repeat2, Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ImageRevisionBar } from "@/components/create/image-revision";
import { Button } from "@/components/ui/button";
import { analyzeImage, type ImageAnalysis } from "@/lib/ai/image-ai";
import { formatBrandMemory } from "@/lib/studio/brand";
import { assetPreviewFitClass } from "@/lib/studio/assets";
import type { ContentKind } from "@/lib/studio/types";
import { useAssetUrls } from "@/hooks/use-asset-urls";
import { useIgDnaText, useIgInsightsText } from "@/hooks/use-ig-dna";
import { cn } from "@/lib/utils";
import { useStudio } from "@/stores/studio-store";

const MAKE_KINDS: { id: ContentKind; label: string }[] = [
  { id: "story", label: "做成限動" },
  { id: "carousel", label: "做成輪播" },
  { id: "reels", label: "做成 Reels 封面" },
];

function stripAssets<T extends { id: string }>(assets: T[], initialId?: string, limit = 12): T[] {
  const head = assets.slice(0, limit);
  if (!initialId) return head;
  if (head.some((item) => item.id === initialId)) return head;
  const extra = assets.find((item) => item.id === initialId);
  return extra ? [extra, ...head.slice(0, limit - 1)] : head;
}

export type ImageMakePayload = {
  kind: ContentKind;
  caption: string;
  stylePrompt: string;
  preview: string;
  assetId: string | null;
  summary: string;
};

/**
 * 圖片理解：丟一張照片、歷屆海報、IG 截圖或 Canva 匯出圖進來。
 * AI 讀畫面內容、色彩、構圖、品牌感，並判斷是不是太宗教／太老氣／太像 AI。
 */
export function ImageUnderstanding({
  audienceIds,
  initialAssetId,
  onUseCaption,
  onUseStylePrompt,
  onMakeKind,
  onGenerateCopy,
}: {
  audienceIds: string[];
  initialAssetId?: string;
  onUseCaption?: (caption: string) => void;
  onUseStylePrompt?: (prompt: string) => void;
  onMakeKind?: (payload: ImageMakePayload) => void | Promise<void>;
  onGenerateCopy?: (payload: {
    preview: string;
    summary: string;
    caption: string;
    assetId: string | null;
  }) => void | Promise<void>;
}) {
  const assets = useStudio((s) => s.assets);
  const brand = useStudio((s) => s.brands[0]);
  const igDnaText = useIgDnaText();
  const insightsText = useIgInsightsText();
  const updateAsset = useStudio((s) => s.updateAsset);
  const urls = useAssetUrls(assets.map((a) => a.id));
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [pickedAssetId, setPickedAssetId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [making, setMaking] = useState<ContentKind | null>(null);
  const [analysis, setAnalysis] = useState<ImageAnalysis | null>(null);
  const primed = useRef(false);

  useEffect(() => {
    if (primed.current || !initialAssetId) return;
    if (!urls[initialAssetId]) return;
    primed.current = true;
    void pickAsset(initialAssetId);
  }, [initialAssetId, urls]);

  async function pickFile(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      setPreview(String(reader.result));
      setPickedAssetId(null);
      setAnalysis(null);
    };
    reader.readAsDataURL(file);
  }

  async function pickAsset(assetId: string) {
    const url = urls[assetId];
    if (!url) return;
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const reader = new FileReader();
      reader.onload = () => {
        setPreview(String(reader.result));
        setPickedAssetId(assetId);
        setAnalysis(null);
      };
      reader.readAsDataURL(blob);
    } catch {
      toast.error("讀不到這張素材。");
    }
  }

  async function run() {
    if (!preview) {
      toast.error("先選一張圖片。");
      return;
    }
    setBusy(true);
    try {
      const res = await analyzeImage({
        data: {
          imageUrl: preview,
          audienceIds,
          brandMemoryText: brand ? formatBrandMemory(brand.memory) : undefined,
          igDnaText: igDnaText || undefined,
          insightsText: insightsText || undefined,
        },
      });
      if (!res.ok) {
        toast.warning(res.error);
        return;
      }
      setAnalysis(res.analysis);
      if (pickedAssetId) {
        updateAsset(pickedAssetId, {
          insight: {
            summary: res.analysis.summary,
            stylePrompt: res.analysis.stylePrompt,
            captionIdea: res.analysis.captionIdea,
            tooReligious: res.analysis.tooReligious,
            tooAi: res.analysis.tooAi,
            fitsTku: res.analysis.fitsTku,
            nextSteps: res.analysis.nextSteps,
            analyzedAt: Date.now(),
          },
        });
      }
    } catch {
      toast.error("分析圖片時出錯了，再試一次。");
    } finally {
      setBusy(false);
    }
  }

  async function make(kind: ContentKind) {
    if (!preview || !onMakeKind) return;
    setMaking(kind);
    try {
      await onMakeKind({
        kind,
        caption: analysis?.captionIdea ?? "",
        stylePrompt: analysis?.stylePrompt ?? "",
        preview,
        assetId: pickedAssetId,
        summary: analysis?.summary ?? "",
      });
    } finally {
      setMaking(null);
    }
  }

  return (
    <section className="rounded-2xl bg-surface p-4 shadow-[var(--shadow-border)]">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-medium">圖片理解</p>
          <p className="text-xs text-muted">照片、歷屆海報、IG 截圖、Canva 設計都可以。</p>
        </div>
        <div className="flex gap-2">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void pickFile(file);
              e.target.value = "";
            }}
          />
          <Button size="sm" variant="secondary" onClick={() => fileRef.current?.click()}>
            <Upload className="size-4" />
            上傳圖片
          </Button>
          <Button size="sm" onClick={run} disabled={busy || !preview}>
            {busy ? <Loader2 className="size-4 animate-spin" /> : <Eye className="size-4" />}
            AI 分析
          </Button>
        </div>
      </header>

      {assets.length ? (
        <div className="mt-3">
          <p className="text-xs text-muted">或從素材庫挑一張</p>
          <ul className="-mx-1 mt-2 flex gap-2 overflow-x-auto px-1 pb-1">
            {stripAssets(assets, initialAssetId).map((asset) => (
              <li key={asset.id}>
                <button
                  type="button"
                  onClick={() => void pickAsset(asset.id)}
                  className={cn(
                    "size-16 overflow-hidden rounded-xl bg-surface-2 shadow-[var(--shadow-border)]",
                    pickedAssetId === asset.id && "ring-2 ring-ring",
                  )}
                  aria-label={`分析 ${asset.name}`}
                >
                  {urls[asset.id] ? (
                    <img
                      src={urls[asset.id]}
                      alt={asset.name}
                      className={cn("size-full", assetPreviewFitClass(asset, urls[asset.id]))}
                    />
                  ) : null}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {preview ? (
        <div className="mt-4 grid gap-4 md:grid-cols-[minmax(0,14rem)_1fr]">
          <img src={preview} alt="待分析的圖片" className="w-full rounded-xl bg-surface-2 object-cover" />
          {analysis ? (
            <div className="min-w-0 space-y-3">
              <p className="text-sm font-medium">{analysis.summary}</p>

              <div className="flex flex-wrap gap-1.5">
                <Verdict ok={!analysis.tooReligious} label={analysis.tooReligious ? "偏宗教" : "不會太宗教"} />
                <Verdict ok={!analysis.tooOld} label={analysis.tooOld ? "偏老氣" : "不會太老氣"} />
                <Verdict ok={!analysis.tooAi} label={analysis.tooAi ? "有 AI 感" : "沒有 AI 感"} />
                <Verdict ok={analysis.fitsTku} label={analysis.fitsTku ? "適合淡江學生" : "不太像淡江學生的畫面"} />
              </div>

              <dl className="grid gap-1.5 text-xs sm:grid-cols-2">
                <Field label="畫面" value={analysis.content} />
                <Field label="人物" value={analysis.people} />
                <Field label="色彩" value={analysis.color} />
                <Field label="光線" value={analysis.light} />
                <Field label="構圖" value={analysis.composition} />
                <Field label="文字比例" value={analysis.textRatio} />
                <Field label="視覺層級" value={analysis.hierarchy} />
                <Field label="品牌感" value={analysis.brandFit} />
                <Field label="學生感" value={analysis.studentFit} />
                <Field label="停留感" value={analysis.stopPower} />
              </dl>

              {analysis.nextSteps.length ? (
                <div>
                  <p className="text-xs text-muted">可以直接做的下一步</p>
                  <ul className="mt-1 space-y-1 text-xs text-muted">
                    {analysis.nextSteps.map((step) => (
                      <li key={step}>· {step}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <div className="flex flex-wrap gap-2">
                {analysis.captionIdea && onUseCaption ? (
                  <Button size="sm" variant="secondary" onClick={() => onUseCaption(analysis.captionIdea)}>
                    用這句寫文案
                  </Button>
                ) : null}
                {analysis.stylePrompt && onUseStylePrompt ? (
                  <Button size="sm" variant="secondary" onClick={() => onUseStylePrompt(analysis.stylePrompt)}>
                    延續這個風格
                  </Button>
                ) : null}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted">選好圖就可以直接做成限動、輪播或 Reels 封面。想知道適不適合淡江學生，再按「AI 分析」。</p>
          )}
        </div>
      ) : null}

      {preview && (onMakeKind || onGenerateCopy) ? (
        <div className="mt-4 space-y-4">
          <div>
            <p className="text-xs text-muted">用這張圖直接開始</p>
            <div className="mt-1.5 flex flex-wrap gap-2">
              {onGenerateCopy ? (
                <Button
                  size="sm"
                  aria-label="用這張寫文案"
                  disabled={making !== null}
                  onClick={() =>
                    void onGenerateCopy({
                      preview,
                      summary: analysis?.summary ?? "",
                      caption: analysis?.captionIdea ?? "",
                      assetId: pickedAssetId,
                    })
                  }
                >
                  <PenLine className="size-4" />
                  用這張寫文案
                </Button>
              ) : null}
              {onMakeKind
                ? MAKE_KINDS.map((item) => (
                    <Button
                      key={item.id}
                      size="sm"
                      aria-label={item.label}
                      disabled={making !== null}
                      onClick={() => void make(item.id)}
                    >
                      {making === item.id ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Repeat2 className="size-4" />
                      )}
                      {item.label}
                    </Button>
                  ))
                : null}
            </div>
          </div>
          <ImageRevisionBar
            imageUrl={preview}
            sourceLabel={assets.find((item) => item.id === pickedAssetId)?.name ?? "圖片理解"}
            onSaved={(meta, dataUrl) => {
              setPreview(dataUrl);
              setPickedAssetId(meta.id);
              setAnalysis(null);
            }}
          />
        </div>
      ) : null}
    </section>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div className="min-w-0">
      <dt className="text-subtle">{label}</dt>
      <dd className="text-muted">{value}</dd>
    </div>
  );
}

function Verdict({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      className={cn(
        "flex items-center gap-1 rounded-full px-2.5 py-1 text-xs",
        ok
          ? "bg-[color-mix(in_oklab,var(--color-success)_14%,transparent)] text-[var(--color-success)]"
          : "bg-[color-mix(in_oklab,var(--color-warn)_16%,transparent)] text-[var(--color-warn)]",
      )}
    >
      {ok ? <CheckCircle2 className="size-3" /> : <AlertTriangle className="size-3" />}
      {label}
    </span>
  );
}
