import { Link, useNavigate } from "@tanstack/react-router";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { academicBeat, academicBeatLabel } from "@/lib/zen/context";
import { learnFromIg } from "@/lib/zen/insights";
import { ideaFromInspiration, researchInspiration } from "@/lib/zen/inspiration";
import { useStudio } from "@/stores/studio-store";

export function InspirationPage() {
  const navigate = useNavigate();
  const igMemory = useStudio((s) => s.igMemory);
  const learning = useMemo(() => learnFromIg(igMemory), [igMemory]);
  const beat = academicBeat();
  const research = useMemo(
    () => researchInspiration({ idea: "下週有一場茶會", eventName: "茶會", beat, learning }),
    [beat, learning],
  );

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-6 pb-28 md:px-8 md:py-10 lg:pb-10">
      <PageHeader
        kicker="靈感研究"
        title="先抽象，再變成我們的"
        description="看大學生社群、校園活動、Carousel 與 Reels 的形狀，轉成淡江禪學社。不要抄別人的貼文。"
        actions={
          <Button size="sm" variant="secondary" asChild>
            <Link to="/create" search={{ mode: "idea", idea: "下週有一場茶會" }}>
              用茶會走一遍
            </Link>
          </Button>
        }
      />

      <section className="mt-6 rounded-2xl bg-surface p-4 shadow-[var(--shadow-border)]" data-testid="inspiration-research">
        <p className="text-xs text-muted">{academicBeatLabel(beat)} · 這次抽象自「{research.cards[0]?.title}」</p>
        <p className="mt-3 text-sm">構圖 {research.composition}</p>
        <p className="mt-1 text-sm">配色 {research.palette}</p>
        <p className="mt-1 text-sm">排版 {research.layout}</p>
        <p className="mt-1 text-sm">Hook {research.hookShape}</p>
        <p className="mt-1 text-sm">形式 {research.form}</p>
        <p className="mt-3 text-sm text-muted">{research.zenUse}</p>
        <p className="mt-3 text-xs text-subtle">{research.fromOwnIg}</p>
      </section>

      <section className="mt-8">
        <h2 className="text-sm font-medium">轉成淡江禪學社</h2>
        <ul className="mt-3 grid gap-3">
          {research.cards.map((card) => (
            <li key={card.id} className="rounded-2xl bg-surface p-4 shadow-[var(--shadow-border)]">
              <p className="text-sm font-medium">{card.title}</p>
              <p className="mt-2 text-xs text-muted">{card.lens}</p>
              <p className="mt-2 text-xs text-muted">構圖 {card.composition}</p>
              <p className="mt-1 text-xs text-muted">配色 {card.palette}</p>
              <p className="mt-1 text-xs text-muted">排版 {card.layout}</p>
              <p className="mt-1 text-xs text-muted">Hook {card.hookShape}</p>
              <p className="mt-1 text-xs text-muted">形式 {card.form}</p>
              <p className="mt-2 text-xs text-subtle">{card.zenUse}</p>
              <Button
                className="mt-3 min-h-11"
                size="sm"
                variant="secondary"
                onClick={() => void navigate({ to: "/create", search: { mode: "idea", idea: ideaFromInspiration(card) } })}
              >
                轉成這次內容
              </Button>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
