import { Lightbulb } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { abstractInspiration, INSPIRATION_SEEDS } from "@/lib/zen/inspiration";
import { useCreative } from "@/stores/creative-store";

export function InspirePage() {
  const navigate = useNavigate();
  const setCreateIntent = useCreative((s) => s.setCreateIntent);

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-6 md:px-8 md:py-10">
      <PageHeader
        kicker="Inspiration"
        title="看別人，做成自己的"
        description="研究大學生社群、校園活動、Carousel 與 Reels Cover。不抄作品，只抽象構圖、配色、排版、Hook，再轉成淡江禪學社。"
      />
      <ul className="mt-6 space-y-4">
        {INSPIRATION_SEEDS.map((seed) => {
          const abs = abstractInspiration(seed);
          return (
            <li key={seed.id} className="rounded-[1.5rem] bg-surface p-5 shadow-[var(--shadow-border)]">
              <p className="text-xs text-muted">{seed.watch}</p>
              <h2 className="mt-2 font-display text-2xl">{seed.zenClub.title}</h2>
              <p className="mt-2 text-lg">{seed.zenClub.hook}</p>
              <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-xs text-muted">抽象構圖</dt>
                  <dd>{abs.composition}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted">配色</dt>
                  <dd>{abs.palette}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted">形式</dt>
                  <dd>{abs.form}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted">變成我們</dt>
                  <dd>{seed.zenClub.visual}</dd>
                </div>
              </dl>
              <p className="mt-3 text-sm text-muted">{seed.zenClub.why}</p>
              <Button
                className="mt-4"
                size="sm"
                onClick={() => {
                  setCreateIntent({
                    idea: seed.zenClub.hook,
                    kind: "emotion",
                    autoGenerate: true,
                  });
                  void navigate({ to: "/create" });
                }}
              >
                <Lightbulb className="size-4" />
                用這個 Hook 創作
              </Button>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
