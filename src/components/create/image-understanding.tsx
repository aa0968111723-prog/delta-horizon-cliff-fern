import { AlertTriangle, CheckCircle2, Eye, Loader2, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { analyzeImage, type ImageAnalysis } from "@/lib/ai/image-ai";
import { useAssetUrls } from "@/hooks/use-asset-urls";
import { cn } from "@/lib/utils";
import { useStudio } from "@/stores/studio-store";

/**
 * 圖片理解：丟一張照片、歷屆海報、IG 截圖或 Canva 匯出圖進來。
 * AI 讀畫面內容、色彩、構圖、品牌感，並判斷是不是太宗教／太老氣／太像 AI。
 */
export function ImageUnderstanding({
  audienceIds,
  onUseCaption,
  onUseStylePrompt,
}: {
  audienceIds: string[];
  onUseCaption?: (caption: string) => void;
  onUseStylePrompt?: (prompt: string) => void;
}) {
  const assets = useStudio((s) => s.assets);
  const urls = useAssetUrls(assets.map((a) => a.id));
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [analysis, setAnalysis] = useState<ImageAnalysis | null>(null);

  async function pickFile(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result);
      setPreview(dataUrl);
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
      const res = await analyzeImage({ data: { imageUrl: preview, audienceIds } });
      if (!res.ok) {
        toast.warning(res.error);
        return;
      }
      setAnalysis(res.analysis);
    } catch {
      toast.error("分析圖片時出錯了，再試一次。");
    } finally {
      setBusy(false);
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
            {assets.slice(0, 12).map((asset) => (
              <li key={asset.id}>
                <button
                  type="button"
                  onClick={() => void pickAsset(asset.id)}
                  className="size-16 overflow-hidden rounded-xl bg-surface-2 shadow-[var(--shadow-border)]"
                  aria-label={`分析 ${asset.name}`}
                >
                  {urls[asset.id] ? (
                    <img src={urls[asset.id]} alt={asset.name} className="size-full object-cover" />
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
            <p className="text-sm text-muted">按「AI 分析」讀這張圖：畫面、色彩、構圖、品牌感，還有它適不適合淡江學生。</p>
          )}
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
