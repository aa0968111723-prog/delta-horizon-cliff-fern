import { Camera, ImagePlus, RefreshCw, Sparkles, Upload, Wand2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { DirectionCard } from "@/components/campaigns/campaign-detail";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import type { AssetInsight, CreativeDirection } from "@/lib/studio/types";
import { cn } from "@/lib/utils";

export type AspectId = "4:5" | "1:1" | "9:16" | "1.91:1";

export const ASPECTS: { id: AspectId; label: string; hint: string; ratio: string }[] = [
  { id: "4:5", label: "IG 4:5", hint: "貼文", ratio: "aspect-[4/5]" },
  { id: "1:1", label: "IG 1:1", hint: "Threads / 方形", ratio: "aspect-square" },
  { id: "9:16", label: "9:16", hint: "Story / Reels 封面", ratio: "aspect-[9/16]" },
  { id: "1.91:1", label: "橫圖", hint: "LINE 宣傳圖", ratio: "aspect-[1.91/1]" },
];

const TWEAKS: { id: string; label: string; add: string }[] = [
  { id: "comp", label: "換構圖", add: "different composition: low angle, subject off-center, lots of negative space at top" },
  { id: "mood", label: "換氣氛", add: "different mood: early morning light instead of night, calm and airy" },
  { id: "bg", label: "換背景", add: "different background: Tamkang University campus corridor with palace lanterns" },
  { id: "style", label: "換風格", add: "different style: soft flat illustration with grainy texture, pastel three-color glow" },
  { id: "mascot", label: "加龜龜", add: "include a small friendly cartoon turtle mascot (round, green, sleepy eyes) sitting quietly in the corner" },
];

export function VisualPanel({
  directions,
  chosenId,
  imagePrompt,
  cover,
  insight,
  busyDirections,
  busyImage,
  busyAnalyze,
  imageUnavailable,
  defaultAspect = "4:5",
  onDirections,
  onChoose,
  onPrompt,
  onGenerate,
  onPhoto,
  onExtend,
  onUseInsightForCopy,
}: {
  directions: CreativeDirection[];
  chosenId: string | null;
  imagePrompt: string;
  cover?: string;
  insight: AssetInsight | null;
  busyDirections: boolean;
  busyImage: boolean;
  busyAnalyze: boolean;
  imageUnavailable: boolean;
  defaultAspect?: AspectId;
  onDirections: () => void;
  onChoose: (d: CreativeDirection) => void;
  onPrompt: (v: string) => void;
  onGenerate: (aspect: AspectId) => void;
  onPhoto: (file: File) => void;
  onExtend: () => void;
  onUseInsightForCopy: () => void;
}) {
  const [aspect, setAspect] = useState<AspectId>(defaultAspect);
  const fileRef = useRef<HTMLInputElement>(null);
  const ratio = ASPECTS.find((a) => a.id === aspect)?.ratio ?? "aspect-[4/5]";

  useEffect(() => {
    setAspect(defaultAspect);
  }, [defaultAspect]);

  return (
    <section className="rounded-[24px] bg-surface p-4 shadow-[var(--shadow-border)] md:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-medium">{defaultAspect === "9:16" ? "Reels / Story 封面" : "主視覺"}</h2>
          <p className="text-xs text-muted">
            {defaultAspect === "9:16" ? "9:16、不要把字烤進圖裡，字幕另外疊。" : "AI 先想學生情境、淡水、夜晚、品牌色、龜龜，再給三個方向"}
          </p>
        </div>
        <Button size="sm" variant="secondary" className="rounded-full" onClick={onDirections} disabled={busyDirections}>
          {busyDirections ? <RefreshCw className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}
          {directions.length ? "換三個方向" : "AI 提三個方向"}
        </Button>
      </div>

      {directions.length ? (
        <div className="no-scrollbar -mx-4 mt-3 flex snap-x gap-3 overflow-x-auto px-4 pb-1 md:mx-0 md:grid md:grid-cols-3 md:overflow-visible md:px-0">
          {directions.map((d) => (
            <div key={d.id} className="w-[78%] shrink-0 snap-start md:w-auto">
              <DirectionCard direction={d} compact chosen={chosenId === d.id} onChoose={() => onChoose(d)} />
            </div>
          ))}
        </div>
      ) : null}

      {/* 圖片 */}
      <div className="mt-4 grid gap-4 md:grid-cols-[1fr_1.1fr]">
        <div>
          <div className={cn("relative w-full overflow-hidden rounded-2xl bg-glow-card", ratio)}>
            {cover ? <img src={cover} alt="" className="absolute inset-0 size-full object-cover" /> : null}
            {!cover ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-6 text-center text-xs text-muted">
                <ImagePlus className="size-6" />
                {imageUnavailable ? "AI 圖片生成連線後可一鍵出圖；現在先用視覺方向與 Prompt。" : "還沒有主視覺。選一個方向，或直接生成。"}
              </div>
            ) : null}
            {busyImage ? (
              <div className="absolute inset-0 flex items-center justify-center bg-surface/70 backdrop-blur-sm">
                <span className="flex items-center gap-2 text-sm">
                  <RefreshCw className="size-4 animate-spin" /> AI 正在畫…
                </span>
              </div>
            ) : null}
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {ASPECTS.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => setAspect(a.id)}
                className={cn(
                  "rounded-full px-2.5 py-1 text-xs",
                  aspect === a.id ? "bg-fg text-bg" : "bg-surface-2 text-muted",
                )}
                title={a.hint}
              >
                {a.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col">
          <label className="text-xs font-medium text-muted" htmlFor="image-prompt">
            圖片 Prompt（英文，AI 生圖用）
          </label>
          <Textarea
            id="image-prompt"
            value={imagePrompt}
            onChange={(e) => onPrompt(e.target.value)}
            rows={6}
            placeholder="A quiet evening at Tamsui riverside, two university students sitting with warm tea, soft three-color glow, no text…"
            className="mt-1 flex-1 rounded-2xl text-xs leading-relaxed"
          />
          <div className="mt-2 flex flex-wrap gap-1.5">
            {TWEAKS.map((t) => (
              <button
                key={t.id}
                type="button"
                className="rounded-full bg-surface-2 px-2.5 py-1 text-xs text-fg hover:bg-border"
                onClick={() => onPrompt(`${imagePrompt.replace(/\s*\n?(different|include a small)[^\n]*$/i, "").trim()}\n${t.add}`)}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button className="rounded-full" onClick={() => onGenerate(aspect)} disabled={busyImage || !imagePrompt.trim()}>
              <Wand2 className="size-4" />
              {cover ? "重新生成" : "生成圖片"}
            </Button>
            <Button variant="secondary" className="rounded-full" onClick={() => fileRef.current?.click()} disabled={busyAnalyze}>
              {busyAnalyze ? <RefreshCw className="size-4 animate-spin" /> : <Camera className="size-4" />}
              丟一張圖給 AI 看
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onPhoto(f);
                e.currentTarget.value = "";
              }}
            />
          </div>
        </div>
      </div>

      {insight ? (
        <div className="mt-4 rounded-2xl bg-glow-card p-4">
          <div className="flex items-start gap-3">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-surface text-accent">
              <Upload className="size-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">AI 看到的</p>
              <p className="mt-1 text-sm leading-relaxed">{insight.summary}</p>
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                {insight.palette.slice(0, 5).map((hex, i) => (
                  <span key={`${hex}-${i}`} className="size-5 rounded-full ring-2 ring-surface" style={{ backgroundColor: hex }} />
                ))}
                <span className="ml-1 text-xs text-muted">{insight.mood}</span>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                <Score label="學生感" v={insight.studentFit} />
                <Score label="品牌感" v={insight.brandFit} />
                <Score label="停留感" v={insight.stopPower} />
              </div>
              {insight.warnings.length ? <p className="mt-2 text-xs text-warn">{insight.warnings.join("；")}</p> : null}
              {insight.suggestions.length ? (
                <ul className="mt-2 space-y-1 text-xs text-muted">
                  {insight.suggestions.map((s, i) => (
                    <li key={i}>· {s}</li>
                  ))}
                </ul>
              ) : null}
              <div className="mt-3 flex flex-wrap gap-2">
                <Button size="sm" className="rounded-full" onClick={onExtend}>
                  <Sparkles className="size-3.5" /> 延續這個風格出圖
                </Button>
                <Button size="sm" variant="secondary" className="rounded-full" onClick={onUseInsightForCopy}>
                  依這張圖寫文案
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function Score({ label, v }: { label: string; v: number }) {
  return (
    <div className="rounded-xl bg-surface px-2 py-2">
      <p className="font-display text-lg tabular-nums">{Math.round(v)}</p>
      <p className="text-[11px] text-muted">{label}</p>
    </div>
  );
}
