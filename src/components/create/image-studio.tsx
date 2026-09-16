import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { analyzeStudioImage, generateStudioImage } from "@/lib/ai/image";
import { getAssetStorage } from "@/lib/studio/asset-storage";
import { uid } from "@/lib/studio/ids";
import { useStudio } from "@/stores/studio-store";

const ASPECTS = [
  { id: "4:5" as const, label: "IG 4:5" },
  { id: "1:1" as const, label: "IG 1:1 / Threads / LINE" },
  { id: "9:16" as const, label: "Story / Reels" },
];

export function ImageStudio() {
  const addAsset = useStudio((s) => s.addAsset);
  const [prompt, setPrompt] = useState("我要宣傳茶會");
  const [aspect, setAspect] = useState<"4:5" | "1:1" | "9:16">("4:5");
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<string | null>(null);

  async function generate() {
    setBusy(true);
    setAnalysis(null);
    try {
      const result = await generateStudioImage({
        data: {
          prompt: `Tamkang Zen Club student social post: ${prompt}. Tamsui night, friends, tea, three colored lights, turtle mascot optional, airy, not religious poster.`,
          aspect,
        },
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      const url = `data:${result.mime};base64,${result.b64}`;
      setPreview(url);
      const res = await fetch(url);
      const blob = await res.blob();
      const id = uid("asset");
      await getAssetStorage().put(id, blob);
      addAsset({
        id,
        name: prompt.slice(0, 24) || "AI 圖像",
        kind: "image",
        category: "generated",
        mime: result.mime,
        width: aspect === "9:16" ? 1080 : 1080,
        height: aspect === "9:16" ? 1920 : aspect === "4:5" ? 1350 : 1080,
        tags: ["AI 生成", prompt],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        source: "generated",
        licenseNotes: "AI 生成，可再進畫布或 Canva。",
        licenseOwner: "禪光",
        favorite: false,
        lastUsedAt: Date.now(),
        useCount: 1,
      });
      toast.success("已存進素材庫");
    } finally {
      setBusy(false);
    }
  }

  async function onFile(file: File) {
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = String(reader.result ?? "");
      setPreview(dataUrl);
      const result = await analyzeStudioImage({
        data: { imageDataUrl: dataUrl, question: "這張適不適合淡江學生 IG？" },
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setAnalysis(
        [
          result.analysis.content,
          `宗教感：${result.analysis.tooReligious}`,
          `學生感：${result.analysis.student}`,
          `下一步：${(result.analysis.next ?? []).join("、")}`,
        ].join("\n"),
      );
    };
    reader.readAsDataURL(file);
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-6 md:px-8 md:py-10">
      <PageHeader
        kicker="Image Studio"
        title="先想學生，再生成圖"
        description="輸入「我要宣傳茶會」時，不會只吐禪風海報。會帶入淡水夜晚、朋友感、三色光與品牌色。"
      />
      <div className="mt-6 space-y-3 rounded-[1.5rem] bg-surface p-4 shadow-[var(--shadow-border)] md:p-6">
        <Textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} />
        <div className="flex flex-wrap gap-2">
          {ASPECTS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setAspect(item.id)}
              className={`rounded-full px-3 py-2 text-xs ${aspect === item.id ? "bg-accent text-accent-fg" : "bg-bg"}`}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button disabled={busy} onClick={() => void generate()}>
            {busy ? "生成中…" : "生成圖片"}
          </Button>
          <label className="inline-flex h-11 items-center rounded-md bg-surface px-4 text-sm shadow-[var(--shadow-border)]">
            丟入照片／舊海報
            <Input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && void onFile(e.target.files[0])} />
          </label>
        </div>
      </div>
      {preview ? (
        <img src={preview} alt="生成預覽" className="mt-6 w-full rounded-[1.5rem] shadow-[var(--shadow-artboard)]" />
      ) : null}
      {analysis ? (
        <pre className="mt-4 whitespace-pre-wrap rounded-2xl bg-surface p-4 text-sm leading-relaxed shadow-[var(--shadow-border)]">
          {analysis}
        </pre>
      ) : null}
    </main>
  );
}
