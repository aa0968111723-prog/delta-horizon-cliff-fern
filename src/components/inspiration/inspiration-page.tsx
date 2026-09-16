import { useNavigate } from "@tanstack/react-router";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { inspirationQuery, studioInspiration } from "@/lib/club/inspiration";
import { writeHandoff } from "@/lib/create/handoff";
import { useCreative } from "@/stores/creative-store";
import { useUi } from "@/stores/ui-store";

export function InspirationPage() {
  const navigate = useNavigate();
  const setCreateOpen = useUi((s) => s.setCreateOpen);
  const igPosts = useCreative((s) => s.igPosts);
  const cards = studioInspiration(igPosts);

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-6 md:px-8 md:py-10">
      <PageHeader
        kicker="Inspiration"
        title="研究趨勢，再變成自己的"
        description="看大學生社群、校園活動、Carousel 與海報的結構，不抄別人的作品。先從自己的 IG 抽象，再轉成淡江禪學社。"
      />
      <ul className="mt-8 space-y-4">
        {cards.map((card) => (
          <li
            key={card.id}
            className="rounded-3xl bg-surface p-5 shadow-[var(--shadow-border)]"
            data-testid={card.id.startsWith("from-ig") ? "inspiration-from-ig" : "inspiration-pattern"}
          >
            <p className="text-xs text-muted">{card.abstractedFrom}</p>
            <h2 className="mt-2 font-display text-2xl">{card.pattern}</h2>
            <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
              <div>構圖：{card.composition}</div>
              <div>配色：{card.palette}</div>
              <div>排版：{card.layout}</div>
              <div>形式：{card.form}</div>
            </dl>
            <p className="mt-3 rounded-2xl bg-bg px-3 py-2 text-sm">禪學社可以這樣用：{card.clubUse}</p>
            <Button
              className="mt-4"
              data-testid="inspiration-to-campaign"
              onClick={() => {
                setCreateOpen(false);
                writeHandoff({
                  idea: inspirationQuery(card),
                  tab: "campaign",
                  autoRun: true,
                  sourceLabel: `靈感 / ${card.pattern}`,
                });
                void navigate({ to: "/create", search: { tab: "campaign" } });
              }}
            >
              轉成我們的內容
            </Button>
          </li>
        ))}
      </ul>
    </main>
  );
}
