import { useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { PageHeader } from "@/components/shared/page-header";
import { academicBeat, academicBeatLabel } from "@/lib/zen/context";
import { guessEventName } from "@/lib/zen/dates";
import { gatherCreativeHits } from "@/lib/zen/gather-hits";
import { learnFromIg } from "@/lib/zen/insights";
import {
  directionsFromResearch,
  ideaFromInspiration,
  researchInspiration,
  type InspirationCard,
} from "@/lib/zen/inspiration";
import { ideaStudioHook } from "@/lib/zen/studio-hook";
import { groupCreativeHits, sourceLabelOf, type CreativeHit } from "@/lib/zen/search";
import { loadSourceEmbed, sourceCreditFromHits } from "@/lib/zen/source-style";
import { directionLookSvg, encodeUtf8Base64 } from "@/lib/ai/poster";
import { createSearchFromHit } from "@/lib/studio/create-search";
import { useAssetUrls } from "@/hooks/use-asset-urls";
import { useStudio } from "@/stores/studio-store";

export function InspirationPage() {
  const navigate = useNavigate();
  const hydrated = useStudio((s) => s.hydrated);
  const igMemory = useStudio((s) => s.igMemory);
  const learning = useMemo(() => learnFromIg(igMemory), [igMemory]);
  const beat = academicBeat();
  const [idea, setIdea] = useState("下週有一場茶會");
  const [found, setFound] = useState<CreativeHit[]>([]);
  const [liveNote, setLiveNote] = useState("");
  const [sourceEmbed, setSourceEmbed] = useState("");
  const [sourceCredit, setSourceCredit] = useState("");
  const [busy, setBusy] = useState(false);
  const autoRan = useRef(false);
  const foundGroups = useMemo(() => groupCreativeHits(found), [found]);
  const thumbIds = useMemo(() => found.flatMap((hit) => (hit.assetId ? [hit.assetId] : [])), [found]);
  const urls = useAssetUrls(thumbIds);
  const eventName = guessEventName(idea) || "茶會";
  const studioHook = useMemo(() => ideaStudioHook(igMemory, idea, eventName), [igMemory, idea, eventName]);
  const research = useMemo(
    () =>
      researchInspiration({
        idea,
        eventName,
        beat,
        learning,
        sources: found.map((hit) => ({ source: hit.source, title: hit.title })),
      }),
    [idea, eventName, beat, learning, found],
  );
  const directions = useMemo(
    () => directionsFromResearch(research, { eventName, hook: studioHook }),
    [research, eventName, studioHook],
  );
  const directionLooks = useMemo(() => {
    const nextLook = sourceEmbed ? { photoEmbed: sourceEmbed, sourceCredit: sourceCredit || undefined } : undefined;
    return directions.map((dir, index) => encodeUtf8Base64(directionLookSvg(dir, index, nextLook)));
  }, [directions, sourceEmbed, sourceCredit]);

  useEffect(() => {
    if (!hydrated || autoRan.current) return;
    autoRan.current = true;
    void researchNow(idea);
  }, [hydrated]);

  async function researchNow(nextIdea = idea) {
    setBusy(true);
    try {
      const { hits, note } = await gatherCreativeHits(nextIdea);
      setFound(hits);
      setLiveNote(note);
      const visual = hits.find((hit) => hit.thumbnail) ?? hits[0];
      const credit = sourceCreditFromHits(visual ? [visual] : []);
      const embed = visual?.thumbnail ? (await loadSourceEmbed(visual.thumbnail)) || "" : "";
      setSourceEmbed(embed);
      setSourceCredit(credit);
    } finally {
      setBusy(false);
    }
  }

  function intoCreate(card: InspirationCard) {
    const hit = found.find((row) => row.thumbnail) ?? found[0];
    const search = hit ? createSearchFromHit(hit) : { mode: "idea" };
    void navigate({
      to: "/create",
      search: {
        ...search,
        idea: `${idea}\n${ideaFromInspiration(card)}`,
      },
    });
  }

  if (!hydrated) return null;

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-6 pb-nav md:px-8 md:py-10">
      <PageHeader
        kicker="靈感研究"
        title="先抽象，再變成我們的"
        description="先找自己的 Drive、Canva、IG，抽出構圖與 Hook，再轉成淡江禪學社。不要抄別人。"
      />

      <Textarea className="mt-6" rows={2} value={idea} onChange={(e) => setIdea(e.target.value)} />
      <div className="mt-3 flex flex-wrap gap-2">
        <Button disabled={busy} onClick={() => void researchNow()}>
          研究這次
        </Button>
      </div>

      {found.length || liveNote ? (
        <section className="mt-8" data-testid="found-sources">
          <h2 className="text-sm font-medium">找到 {found.length} 個相關素材</h2>
          <p className="mt-1 text-xs text-muted">
            研究後只抽構圖、配色、Hook，不複製舊作品。
            {liveNote ? ` ${liveNote.replace(/[。.]+\s*$/, "")}。` : ""}{" "}
            {Object.entries(foundGroups)
              .map(([source, list]) => `${sourceLabelOf(source)} ${list.length}`)
              .join(" · ")}
          </p>
          {Object.entries(foundGroups).map(([source, list]) => (
            <div key={source} className="mt-3">
              <h3 className="text-xs tracking-[0.14em] text-muted uppercase">{sourceLabelOf(source)}</h3>
              <ul className="mt-2 space-y-2">
                {list.slice(0, 3).map((hit) => {
                  const thumb = hit.thumbnail || (hit.assetId ? urls[hit.assetId] : undefined);
                  return (
                    <li key={hit.id} className="flex items-center gap-3 rounded-2xl bg-surface px-3 py-2 text-sm shadow-[var(--shadow-border)]">
                      {thumb ? (
                        <img src={thumb} alt="" className="size-12 shrink-0 rounded-xl object-cover" />
                      ) : (
                        <span className="size-12 shrink-0 rounded-xl bg-surface-2" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate">{hit.title}</p>
                        <p className="mt-1 truncate text-xs text-muted">
                          {sourceLabelOf(hit.source)} · {hit.subtitle}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </section>
      ) : null}

      <section className="mt-6 rounded-2xl bg-surface p-4 shadow-[var(--shadow-border)]" data-testid="inspiration-research">
        <p className="text-xs text-muted">{academicBeatLabel(beat)} · 這次抽象自「{research.cards[0]?.title}」</p>
        {sourceCredit ? (
          <p className="mt-2 text-xs text-muted" data-testid="inspire-visual-source">
            參考 {sourceCredit}，沒有整張複製。
          </p>
        ) : null}
        <p className="mt-3 text-sm">構圖 {research.composition}</p>
        <p className="mt-1 text-sm">配色 {research.palette}</p>
        <p className="mt-1 text-sm">排版 {research.layout}</p>
        <p className="mt-1 text-sm">Hook {research.hookShape}</p>
        <p className="mt-1 text-sm">形式 {research.form}</p>
        <p className="mt-3 text-sm text-muted">{research.zenUse}</p>
        <p className="mt-3 text-xs text-subtle">{research.fromOwnIg}</p>
      </section>

      <section className="mt-8" data-testid="inspire-ready">
        <h2 className="text-sm font-medium">轉成淡江禪學社</h2>
        <ul className="mt-3 grid gap-3">
          {research.cards.slice(0, 3).map((card, index) => (
            <li key={card.id} className="rounded-2xl bg-surface p-4 shadow-[var(--shadow-border)]">
              {directionLooks[index] ? (
                <img
                  alt={`${card.title} 視覺方向`}
                  src={`data:image/svg+xml;base64,${directionLooks[index]}`}
                  className="mb-3 aspect-[4/5] w-full max-w-[13rem] rounded-xl object-cover"
                  data-testid={index === 0 ? "direction-look-a" : index === 1 ? "direction-look-b" : "direction-look-c"}
                />
              ) : null}
              <p className="text-sm font-medium">{card.title}</p>
              <p className="mt-2 text-sm" data-testid="direction-headline">
                {directions[index]?.headline || card.headlineHint}
              </p>
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
                data-testid={index === 0 ? "inspire-into-create" : undefined}
                onClick={() => intoCreate(card)}
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
