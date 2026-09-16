import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { researchInspiration } from "@/lib/ai/inspire";
import { uid } from "@/lib/studio/ids";
import { useCreative } from "@/stores/creative-store";

export function InspirePage() {
  const navigate = useNavigate();
  const inspirations = useCreative((s) => s.inspirations);
  const addInspiration = useCreative((s) => s.addInspiration);
  const [topic, setTopic] = useState("校園活動 Carousel 與晚上茶會");
  const [busy, setBusy] = useState(false);

  async function research() {
    setBusy(true);
    try {
      const result = await researchInspiration({ data: { topic } });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      for (const item of result.items) {
        addInspiration({ ...item, id: item.id || uid("insp") });
      }
      toast.success("已抽出規律，轉成禪學社自己的做法");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-6 md:px-8 md:py-10">
      <p className="text-xs tracking-[0.18em] text-muted uppercase">Inspiration</p>
      <h1 className="mt-1 font-display text-3xl md:text-4xl">看別人，做成自己的</h1>
      <p className="mt-2 text-sm text-muted">
        研究構圖、配色、Hook 形式，再轉成淡江禪學社。不會抄帳號，也不會出現 Agent 列表。
      </p>
      <Textarea
        value={topic}
        onChange={(e) => setTopic(e.target.value)}
        className="mt-6 min-h-24 rounded-2xl"
        placeholder="例如：大學生社團的晚上活動怎麼讓人停下來"
      />
      <Button className="mt-3 min-h-11 rounded-full" disabled={busy} onClick={() => void research()}>
        {busy ? "研究中…" : "抽出規律"}
      </Button>

      <ul className="mt-8 space-y-4">
        {inspirations.map((item) => (
          <li key={item.id} className="rounded-3xl bg-surface p-5 shadow-[var(--shadow-border)]">
            <p className="text-xs tracking-[0.14em] text-muted uppercase">{item.form}</p>
            <h2 className="mt-1 font-display text-2xl">{item.title}</h2>
            <p className="mt-3 text-sm">規律：{item.pattern}</p>
            <p className="mt-1 text-sm text-muted">
              構圖 {item.composition} · 配色 {item.color} · Hook {item.hookShape}
            </p>
            <p className="mt-4 font-display text-lg leading-snug">{item.clubTurn}</p>
            <Button
              className="mt-4 min-h-11 rounded-full"
              variant="secondary"
              onClick={() =>
                void navigate({
                  to: "/create",
                  search: { q: `${item.clubTurn}（${topic}）`, go: "1", mode: "idea" },
                })
              }
            >
              用這個做成禪學社內容
            </Button>
          </li>
        ))}
      </ul>
    </main>
  );
}
