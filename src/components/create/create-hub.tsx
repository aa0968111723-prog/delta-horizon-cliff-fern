import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AssistantForm } from "@/components/assistant/assistant-form";
import { IdeaFlow } from "@/components/create/idea-flow";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { CONVERT_TARGETS, convertPlan } from "@/lib/convert/pack";
import { COPY_INTENTS, COPY_TONES, generateCopyPack, type CopyPack } from "@/lib/copy/generate";
import { generateImageDirections, generateStudioImage, IMAGE_ASPECTS } from "@/lib/image/studio";
import { analyzeImage, type VisionReport } from "@/lib/vision/analyze";
import { getAssetStorage } from "@/lib/studio/asset-storage";
import { createGeneratedAsset } from "@/lib/studio/assets";
import { formatById } from "@/lib/studio/formats";
import { uid } from "@/lib/studio/ids";
import { useStudio } from "@/stores/studio-store";
import { useCreative } from "@/stores/creative-store";
import { lessonPrompt } from "@/lib/club/insights";
import type { ContentKind, CreativeDirection } from "@/lib/studio/types";
import { cn } from "@/lib/utils";

export type CreateTab = "campaign" | "copy" | "image" | "vision" | "convert";

export function CreateHub({ initialTab = "campaign" }: { initialTab?: CreateTab }) {
  const lastProjectId = useStudio((s) => s.lastProjectId);
  const [tab, setTab] = useState<CreateTab>(initialTab);

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-6 md:px-8 md:py-10">
      <PageHeader
        kicker="AI 創作"
        title="多模態工作台"
        description="從一句話開始：找素材、給三個方向、再產出 IG 文案與多模態內容。前台不顯示 Agent。"
      />
      <div className="mt-6 flex flex-wrap gap-2">
        {(
          [
            ["campaign", "活動宣傳"],
            ["copy", "IG 文案"],
            ["image", "圖片 Studio"],
            ["vision", "圖片理解"],
            ["convert", "一鍵轉換"],
          ] as const
        ).map(([id, label]) => (
          <Button key={id} size="sm" variant={tab === id ? "default" : "secondary"} onClick={() => setTab(id)}>
            {label}
          </Button>
        ))}
      </div>
      <div className="mt-6 rounded-3xl bg-surface p-4 shadow-[var(--shadow-border)] sm:p-6">
        {tab === "campaign" ? (
          <div className="space-y-8">
            <IdeaFlow />
            <details className="rounded-2xl bg-bg px-4 py-3">
              <summary className="cursor-pointer text-sm text-muted">需要填完整活動欄位再生成</summary>
              <div className="mt-4">
                <AssistantForm variant="page" projectId={lastProjectId} />
              </div>
            </details>
          </div>
        ) : null}
        {tab === "copy" ? <CopyStudio /> : null}
        {tab === "image" ? <ImageStudio /> : null}
        {tab === "vision" ? <VisionStudio onAction={(id) => {
          if (id === "similar" || id === "continue" || id === "redesign") setTab("image");
          if (id === "carousel" || id === "story" || id === "reels") setTab("convert");
        }} /> : null}
        {tab === "convert" ? <ConvertStudio /> : null}
      </div>
    </main>
  );
}

function CopyStudio() {
  const projects = useStudio((s) => s.projects);
  const setCopy = useStudio((s) => s.setCopy);
  const lastProjectId = useStudio((s) => s.lastProjectId);
  const igPosts = useCreative((s) => s.igPosts);
  const [idea, setIdea] = useState("最近是不是很久沒有好好坐下來？");
  const [intent, setIntent] = useState("情緒共鳴");
  const [tone, setTone] = useState("學生版");
  const [pack, setPack] = useState<CopyPack | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const stored = window.sessionStorage.getItem("zen-idea");
    if (stored) {
      setIdea(stored.split("\n")[0] || stored);
      window.sessionStorage.removeItem("zen-idea");
    }
  }, []);

  async function run() {
    setBusy(true);
    try {
      const result = await generateCopyPack({ data: { idea, intent, tone, igLessons: lessonPrompt(igPosts) } });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setPack(result.pack);
    } finally {
      setBusy(false);
    }
  }

  const project = projects.find((p) => p.id === lastProjectId);

  return (
    <div className="space-y-4">
      <label className="block text-sm">
        意圖
        <select className="mt-1 h-11 w-full rounded-md border border-border bg-surface px-3" value={intent} onChange={(e) => setIntent(e.target.value)}>
          {COPY_INTENTS.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
      </label>
      <label className="block text-sm">
        想法
        <Textarea value={idea} onChange={(e) => setIdea(e.target.value)} />
      </label>
      <div className="flex flex-wrap gap-2">
        {COPY_TONES.map((item) => (
          <Button key={item} size="sm" variant={tone === item ? "default" : "secondary"} onClick={() => setTone(item)}>
            {item}
          </Button>
        ))}
      </div>
      <Button disabled={busy} onClick={() => void run()}>
        {busy ? "寫作中…" : "生成文案"}
      </Button>
      {pack ? (
        <div className="space-y-3 rounded-2xl bg-bg p-4">
          <p className="font-display text-xl">{pack.hook}</p>
          <p className="whitespace-pre-wrap text-sm">{pack.body}</p>
          <p className="text-sm">{pack.cta}</p>
          <p className="text-xs text-muted">{pack.hashtags.join(" ")}</p>
          <p className="text-xs text-muted">學生視角：{pack.studentReview.wouldStop} {pack.studentReview.revisions.join("、")}</p>
          {project ? (
            <Button
              variant="secondary"
              onClick={() =>
                setCopy(project.id, {
                  headline: pack.hook,
                  body: pack.body,
                  cta: pack.cta,
                  caption: `${pack.hook}\n\n${pack.body}`,
                  hashtags: pack.hashtags,
                })
              }
            >
              套進目前作品
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function ImageStudio() {
  const addAsset = useStudio((s) => s.addAsset);
  const [idea, setIdea] = useState("我要宣傳茶會");
  const [formatId, setFormatId] = useState<(typeof IMAGE_ASPECTS)[number]["id"]>("feed-portrait");
  const [dirs, setDirs] = useState<CreativeDirection[]>([]);
  const [picked, setPicked] = useState<CreativeDirection | null>(null);
  const [urls, setUrls] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const stored = window.sessionStorage.getItem("zen-idea");
    if (stored) {
      setIdea(stored.split("\n")[0] || stored);
      window.sessionStorage.removeItem("zen-idea");
    }
  }, []);

  async function directions() {
    setBusy(true);
    try {
      const result = await generateImageDirections({ data: { idea, formatId } });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setDirs(result.directions);
    } finally {
      setBusy(false);
    }
  }

  async function render(direction: CreativeDirection, variation?: "regen" | "compose" | "mood" | "background" | "style" | "text") {
    setBusy(true);
    setPicked(direction);
    try {
      const result = await generateStudioImage({ data: { prompt: direction.imagePrompt, variation } });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setUrls(result.urls);
      const url = result.urls[0];
      if (!url) return;
      const res = await fetch(url);
      const blob = await res.blob();
      const id = uid("asset");
      await getAssetStorage().put(id, blob);
      const format = formatById(formatId);
      addAsset(
        createGeneratedAsset({
          id,
          name: `${direction.name} · ${idea}`,
          mime: blob.type || "image/png",
          width: format.width,
          height: format.height,
          category: "poster",
          tags: ["AI生成", direction.name, idea],
        }),
      );
      toast.success("已存進素材庫 · 來源：AI Generated");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <label className="block text-sm">
        我想做
        <Input value={idea} onChange={(e) => setIdea(e.target.value)} />
      </label>
      <div className="flex flex-wrap gap-2">
        {IMAGE_ASPECTS.map((item) => (
          <Button key={item.id} size="sm" variant={formatId === item.id ? "default" : "secondary"} onClick={() => setFormatId(item.id)}>
            {item.label}
          </Button>
        ))}
      </div>
      <Button disabled={busy} onClick={() => void directions()}>
        {busy ? "思考中…" : "提出三個視覺方向"}
      </Button>
      <ul className="space-y-3">
        {dirs.map((dir) => (
          <li key={dir.id} className={cn("rounded-2xl bg-bg p-4", picked?.id === dir.id && "ring-2 ring-ring/30")}>
            <p className="font-display text-lg">{dir.name}</p>
            <p className="mt-1 text-sm">{dir.concept}</p>
            <p className="mt-1 text-xs text-muted">{dir.palette} · {dir.composition} · {dir.typeDirection}</p>
            <p className="mt-2 text-sm">{dir.headline}</p>
            <p className="mt-1 text-xs text-muted">{dir.subhead}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button size="sm" disabled={busy} onClick={() => void render(dir)}>生成圖片</Button>
              <Button size="sm" variant="secondary" disabled={busy} onClick={() => void render(dir, "compose")}>換構圖</Button>
              <Button size="sm" variant="secondary" disabled={busy} onClick={() => void render(dir, "mood")}>換氣氛</Button>
              <Button size="sm" variant="secondary" disabled={busy} onClick={() => void render(dir, "background")}>換背景</Button>
              <Button size="sm" variant="secondary" disabled={busy} onClick={() => void render(dir, "style")}>換風格</Button>
              <Button size="sm" variant="secondary" disabled={busy} onClick={() => void render(dir, "text")}>換文字</Button>
              <Button size="sm" variant="secondary" disabled={busy} onClick={() => void render(dir, "regen")}>重新生成</Button>
            </div>
          </li>
        ))}
      </ul>
      {urls[0] ? <img src={urls[0]} alt="生成結果" className="w-full rounded-2xl" /> : null}
    </div>
  );
}

function VisionStudio({ onAction }: { onAction: (id: string) => void }) {
  const [note, setNote] = useState("");
  const [report, setReport] = useState<VisionReport | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onFile(file: File) {
    const dataUrl = await fileToDataUrl(file);
    setPreview(dataUrl);
    setBusy(true);
    try {
      const result = await analyzeImage({ data: { imageDataUrl: dataUrl, note } });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setReport(result.report);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">可丟入照片、歷屆海報、IG 截圖、Canva、活動照或淡水校園照。</p>
      <Input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && void onFile(e.target.files[0])} />
      <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="這是去年茶會海報…" />
      {preview ? <img src={preview} alt="上傳預覽" className="max-h-64 rounded-2xl object-contain" /> : null}
      {busy ? <p className="text-sm">分析中…</p> : null}
      {report ? (
        <div className="space-y-2 text-sm">
          <p>{report.content}</p>
          <p>人物：{report.people}</p>
          <p>品牌感：{report.brandFeel}</p>
          <p>學生感：{report.studentFeel}</p>
          <p>停留感：{report.stayFeel}</p>
          <p>是否太宗教：{report.tooReligious}</p>
          <p>是否太老氣：{report.tooOld}</p>
          <p>是否太像 AI：{report.tooAi}</p>
          <p>是否符合淡江學生：{report.fitsTamkang}</p>
          <ul className="flex flex-wrap gap-2 pt-2">
            {report.actions.map((action) => (
              <li key={action.id}>
                <Button size="sm" variant="secondary" onClick={() => onAction(action.id)}>
                  {action.label}
                </Button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function ConvertStudio() {
  const projects = useStudio((s) => s.projects);
  const lastProjectId = useStudio((s) => s.lastProjectId);
  const project = projects.find((p) => p.id === lastProjectId);
  const [kind, setKind] = useState<ContentKind>("carousel");

  if (!project?.plan) {
    return <p className="text-sm text-muted">先在「活動宣傳」生成一篇，就可以一鍵轉成 Carousel、Story、Threads、LINE、Reels。</p>;
  }

  const converted = convertPlan(project.plan, kind);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {CONVERT_TARGETS.map((item) => (
          <Button key={item.id} size="sm" variant={kind === item.id ? "default" : "secondary"} onClick={() => setKind(item.id)}>
            {item.label}
          </Button>
        ))}
      </div>
      <div className="rounded-2xl bg-bg p-4">
        <p className="font-display text-xl">{converted.title}</p>
        <ul className="mt-3 space-y-3">
          {converted.items.map((item, index) => (
            <li key={`${item.heading}-${index}`} className="rounded-xl bg-surface px-3 py-2">
              <p className="text-xs text-muted">{item.heading}</p>
              <p className="mt-1 whitespace-pre-wrap text-sm">{item.body}</p>
              <p className="mt-1 text-xs text-muted">畫面：{item.visual}</p>
            </li>
          ))}
        </ul>
      </div>
      <Button
        variant="secondary"
        onClick={async () => {
          await navigator.clipboard.writeText(converted.items.map((item) => `${item.heading}\n${item.body}`).join("\n\n"));
          window.open("https://www.canva.com", "_blank", "noopener,noreferrer");
          toast.success("文案已複製，可在 Canva 繼續編");
        }}
      >
        送進 Canva 微調
      </Button>
    </div>
  );
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
