import { useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { HeroVisual } from "@/components/create/hero-visual";
import { StudentReviewCard } from "@/components/create/student-review-card";
import { VisionCard } from "@/components/create/vision-card";
import { PhotoDrop } from "@/components/shared/photo-drop";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { generateCopyPacks } from "@/lib/ai/copy-studio";
import {
  generateStudioImage,
  generateVisualDirections,
  analyzeStudioImage,
  toImageFormat,
  varyImagePrompt,
  type VisionAnalysis,
} from "@/lib/ai/image-studio";
import { directionLookOf, directionLookSvg, directionPosterSvg, encodeUtf8Base64, licenseFromLook } from "@/lib/ai/poster";
import { createCanvaDesign } from "@/lib/connect/canva";
import { canvaRemoteFromDesign } from "@/lib/connect/canva-format";
import { gatherCreativeHits } from "@/lib/zen/gather-hits";
import { createSearchFromHit } from "@/lib/studio/create-search";
import { putAssetBlob } from "@/lib/studio/assets-idb";
import { persistGeneratedImage } from "@/lib/studio/raster";
import { blobFromBase64, bytesToBase64 } from "@/lib/studio/bytes";
import { FORMATS, formatById } from "@/lib/studio/formats";
import { uid } from "@/lib/studio/ids";
import { guessEventName } from "@/lib/zen/dates";
import { clubCreativeDna } from "@/lib/zen/dna";
import { learnFromIg } from "@/lib/zen/insights";
import { ideaStudioHook } from "@/lib/zen/studio-hook";
import { composeMemoryHint } from "@/lib/zen/memory-hook";
import { groupCreativeHits, sourceLabelOf, type CreativeHit } from "@/lib/zen/search";
import { analyzeClubStill } from "@/lib/zen/analyze-still";
import { loadSourceEmbed, pickSourceRefs, sourceCreditFromHits, styleFromHits, visionFromHits } from "@/lib/zen/source-style";
import { ideaFromVision, tagsFromVision } from "@/lib/zen/vision-tags";
import type { CopyPack, FormatId, StudentReview, VisualDirection } from "@/lib/studio/types";
import { useAssetUrls } from "@/hooks/use-asset-urls";
import { useStudio } from "@/stores/studio-store";

const VARIATIONS: { id: "composition" | "mood" | "background" | "style" | "text"; label: string }[] = [
  { id: "composition", label: "換構圖" },
  { id: "mood", label: "換氣氛" },
  { id: "background", label: "換背景" },
  { id: "style", label: "換風格" },
  { id: "text", label: "換文字空間" },
];

const TONE_LABEL: Record<CopyPack["tone"], string> = {
  short: "短版",
  normal: "一般版",
  emotional: "感性版",
  student: "學生版",
  life: "生活版",
  humor: "幽默版",
};

export function ImageStudioPage() {
  const navigate = useNavigate();
  const hydrated = useStudio((s) => s.hydrated);
  const addAsset = useStudio((s) => s.addAsset);
  const updateAsset = useStudio((s) => s.updateAsset);
  const upsertRemoteFiles = useStudio((s) => s.upsertRemoteFiles);
  const brands = useStudio((s) => s.brands);
  const igMemory = useStudio((s) => s.igMemory);
  const campaigns = useStudio((s) => s.campaigns);
  const assets = useStudio((s) => s.assets);
  const dna = useMemo(
    () => clubCreativeDna({ brand: brands[0], igMemory, campaigns, assets }),
    [brands, igMemory, campaigns, assets],
  );
  const learning = useMemo(() => learnFromIg(igMemory), [igMemory]);
  const [idea, setIdea] = useState("我要宣傳茶會");
  const studioHook = useMemo(
    () => ideaStudioHook(igMemory, idea, guessEventName(idea)),
    [igMemory, idea],
  );
  const [format, setFormat] = useState<FormatId>("feed-portrait");
  const [directions, setDirections] = useState<VisualDirection[]>([]);
  const [busy, setBusy] = useState(false);
  const [vision, setVision] = useState<VisionAnalysis | null>(null);
  const [packs, setPacks] = useState<CopyPack[]>([]);
  const [tone, setTone] = useState<CopyPack["tone"]>("student");
  const [lastImage, setLastImage] = useState<{ base64: string; mime: string; headline?: string } | null>(null);
  const [review, setReview] = useState<StudentReview | null>(null);
  const [found, setFound] = useState<CreativeHit[]>([]);
  const [pinned, setPinned] = useState<CreativeHit[]>([]);
  const [liveNote, setLiveNote] = useState("");
  const [sourceCredit, setSourceCredit] = useState("");
  const [sourceEmbed, setSourceEmbed] = useState("");
  const autoRan = useRef(false);
  const regenTick = useRef<Record<string, number>>({});
  const photoEmbedRef = useRef("");
  const foundGroups = useMemo(() => groupCreativeHits(found), [found]);
  const thumbIds = useMemo(() => found.flatMap((hit) => (hit.assetId ? [hit.assetId] : [])), [found]);
  const urls = useAssetUrls(thumbIds);
  const directionLooks = useMemo(() => {
    const look = sourceEmbed ? { photoEmbed: sourceEmbed, sourceCredit: sourceCredit || undefined } : undefined;
    return directions.map((dir, index) => encodeUtf8Base64(directionLookSvg(dir, index, look)));
  }, [directions, sourceEmbed, sourceCredit]);

  const activePack = packs.find((p) => p.tone === tone) ?? packs[0];

  useEffect(() => {
    if (!hydrated || autoRan.current) return;
    autoRan.current = true;
    void boot(idea);
  }, [hydrated]);

  function sourceNotes(hits: CreativeHit[]) {
    const refs = pickSourceRefs("idea", hits.length ? hits : found);
    const picked = refs.length ? refs : hits.slice(0, 6);
    const sources = picked.map((hit) => `${sourceLabelOf(hit.source)}／${hit.title}`).join("、") || "品牌記憶";
    return `${sources}。${styleFromHits(picked)}`.slice(0, 400);
  }

  async function gatherHits(query: string) {
    const { hits, note } = await gatherCreativeHits(query);
    setLiveNote(note);
    setFound(hits.slice(0, 12));
    return hits;
  }

  async function adoptSources(hits: CreativeHit[]) {
    const refs = pickSourceRefs("idea", hits);
    const visual = refs.find((hit) => hit.thumbnail) ?? refs[0];
    const nextPins = visual ? [visual, ...refs.filter((hit) => hit.id !== visual.id)].slice(0, 6) : [];
    setPinned(nextPins);
    const credit = sourceCreditFromHits(nextPins);
    const href = visual?.thumbnail;
    const embed = href ? (await loadSourceEmbed(href)) || "" : "";
    photoEmbedRef.current = embed;
    setSourceEmbed(embed);
    setSourceCredit(credit);
    const looked = embed ? await analyzeClubStill({ embed, sourceNote: credit }) : null;
    if (looked) setVision(looked);
    else {
      const fromHits = visionFromHits(nextPins);
      if (fromHits) setVision((current) => current ?? fromHits);
    }
    return nextPins;
  }

  async function boot(nextIdea: string) {
    setBusy(true);
    try {
      const hits = await gatherHits(nextIdea);
      const refs = await adoptSources(hits);
      await copyGo(nextIdea, true, refs);
      const dirs = await directionsGo(nextIdea, undefined, refs);
      if (dirs[0]) await gen(dirs[0], directionLookOf(0), undefined, true, refs);
    } finally {
      setBusy(false);
    }
  }

  async function directionsGo(nextIdea = idea, formatOverride?: FormatId, refs: CreativeHit[] = pinned) {
    setBusy(true);
    try {
      const result = await generateVisualDirections({
        data: {
          idea: `${nextIdea}。參考：${sourceNotes(refs)}`.slice(0, 400),
          eventName: guessEventName(nextIdea) || "",
          format: toImageFormat(formatOverride ?? format),
          memoryHint: composeMemoryHint([
            `過去表現較好的 Hook：「${ideaStudioHook(igMemory, nextIdea, guessEventName(nextIdea))}」`,
            learning.promptBlock,
            dna.promptBlock,
            sourceNotes(refs),
          ]),
        },
      });
      if (!result.ok) {
        toast.error(result.error);
        return [];
      }
      setDirections(result.directions);
      return result.directions;
    } finally {
      setBusy(false);
    }
  }

  async function copyGo(nextIdea = idea, silent = false, refs: CreativeHit[] = pinned) {
    setBusy(true);
    try {
      const result = await generateCopyPacks({
        data: {
          idea: nextIdea,
          eventName: guessEventName(nextIdea) || "",
          memoryHint: composeMemoryHint([
            `過去表現較好的 Hook：「${ideaStudioHook(igMemory, nextIdea, guessEventName(nextIdea))}」`,
            learning.promptBlock,
            dna.promptBlock,
            sourceNotes(refs),
          ]),
        },
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setPacks(result.packs);
      setReview(result.review);
      if (!silent) toast.success("已生成文案");
    } finally {
      setBusy(false);
    }
  }

  async function gen(
    dir: VisualDirection,
    kind?: (typeof VARIATIONS)[number]["id"],
    formatOverride?: FormatId,
    silent = false,
    _refs?: CreativeHit[],
  ) {
    setBusy(true);
    try {
      const nextFormat = formatOverride ?? format;
      const spec = formatById(nextFormat);
      const prompt = kind ? varyImagePrompt(dir.prompt, kind) : dir.prompt;
      const atmosphere = nextFormat === "reels-cover";
      const photoEmbed = photoEmbedRef.current.slice(0, 400_000);
      const credit = sourceCredit || undefined;
      let payload = {
        imageBase64: encodeUtf8Base64(
          directionPosterSvg({
            headline: atmosphere ? "" : dir.headline,
            subhead: atmosphere ? undefined : dir.subhead,
            concept: atmosphere ? undefined : dir.concept,
            palette: dir.palette,
            name: atmosphere ? undefined : dir.name,
            width: spec.width,
            height: spec.height,
            variation: kind,
            atmosphere,
            photoEmbed: photoEmbed || undefined,
            sourceCredit: atmosphere ? undefined : credit,
          }),
        ),
        mime: "image/svg+xml",
      };
      try {
        const result = await generateStudioImage({
          data: {
            prompt,
            format: toImageFormat(nextFormat),
            headline: atmosphere ? undefined : dir.headline,
            subhead: atmosphere ? undefined : dir.subhead,
            palette: dir.palette,
            name: dir.name,
            variation: kind,
            memoryHint: composeMemoryHint([learning.promptBlock, dna.promptBlock, sourceNotes(pinned)]),
            atmosphere,
            photoEmbed: photoEmbed || undefined,
            sourceCredit: credit,
          },
        });
        if (result.ok && result.adapter === "live") payload = { imageBase64: result.imageBase64, mime: result.mime };
        else if (result.ok && !photoEmbed) payload = { imageBase64: result.imageBase64, mime: result.mime };
      } catch {
        /* keep poster */
      }
      let png: { blob: Blob; mime: string; base64: string };
      try {
        png = await persistGeneratedImage({
          base64: payload.imageBase64,
          mime: payload.mime,
          width: spec.width,
          height: spec.height,
        });
      } catch {
        png = {
          blob: blobFromBase64(payload.imageBase64, payload.mime),
          mime: payload.mime,
          base64: payload.imageBase64,
        };
      }
      const id = uid("asset");
      await putAssetBlob(id, png.blob);
      addAsset({
        id,
        name: [dir.name, kind ? VARIATIONS.find((v) => v.id === kind)?.label : null, spec.short].filter(Boolean).join(" · "),
        kind: "image",
        category: "ai",
        mime: png.mime,
        width: spec.width,
        height: spec.height,
        tags: ["AI 生成", idea, spec.short],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        source: "generated",
        licenseNotes: licenseFromLook(credit ? { sourceCredit: credit } : undefined),
        licenseOwner: "禪光",
        favorite: false,
        lastUsedAt: Date.now(),
        useCount: 0,
      });
      setLastImage({ base64: png.base64, mime: png.mime, headline: dir.headline });
      if (!silent) toast.success(credit ? `已存進素材庫（延續 ${credit}）` : "已存進素材庫（AI Generated）");
    } finally {
      setBusy(false);
    }
  }

  function togglePin(hit: CreativeHit) {
    const next = pinned.some((row) => row.id === hit.id) ? pinned.filter((row) => row.id !== hit.id) : [...pinned, hit];
    setPinned(next);
    void (async () => {
      const credit = sourceCreditFromHits(next);
      const href = next.find((row) => row.thumbnail)?.thumbnail;
      const embed = href ? (await loadSourceEmbed(href)) || "" : "";
      photoEmbedRef.current = embed;
      setSourceEmbed(embed);
      setSourceCredit(credit);
      await directionsGo(idea, undefined, next);
    })();
  }

  async function sendToCanva(dir?: VisualDirection) {
    setBusy(true);
    try {
      const result = await createCanvaDesign({
        data: {
          title: dir?.name || idea.slice(0, 20) || "茶會",
          hook: activePack?.hook || dir?.headline || idea,
          body: activePack?.body || dir?.concept || idea,
          cta: activePack?.cta || "來坐一下",
          format,
          palette: dir?.palette || dna.palette,
          composition: dir?.composition,
          headline: dir?.headline,
          imageBase64: lastImage?.base64,
          mime: lastImage?.mime,
        },
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      await navigator.clipboard.writeText(result.brief).catch(() => undefined);
      window.open(result.editUrl, "_blank", "noopener,noreferrer");
      if (result.connected && result.designId) {
        upsertRemoteFiles([
          canvaRemoteFromDesign({ designId: result.designId, title: result.title, editUrl: result.editUrl }),
        ]);
      }
      toast.success(result.note);
    } finally {
      setBusy(false);
    }
  }

  async function onFile(file: File) {
    const buf = await file.arrayBuffer();
    const b64 = bytesToBase64(new Uint8Array(buf));
    if (b64.length > 1_800_000) {
      toast.error("圖檔太大，請用較小的照片。");
      return;
    }
    photoEmbedRef.current = (file.type.includes("svg") || file.name.endsWith(".svg"))
      ? new TextDecoder().decode(buf)
      : `data:${file.type || "image/jpeg"};base64,${b64}`;
    setSourceEmbed(photoEmbedRef.current);
    setSourceCredit("本機上傳 / 延續這張");
    setBusy(true);
    try {
      const id = uid("asset");
      await putAssetBlob(id, file);
      addAsset({
        id,
        name: file.name.replace(/\.[^.]+$/, "") || "上傳圖片",
        kind: "image",
        category: "photo",
        mime: file.type || "image/jpeg",
        width: 0,
        height: 0,
        tags: ["上傳"],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        source: "upload",
        licenseNotes: "來源：本機上傳",
        licenseOwner: "禪光",
        favorite: false,
        lastUsedAt: null,
        useCount: 0,
      });
      const result = await analyzeStudioImage({
        data: { imageBase64: b64, mime: file.type, sourceNote: `本機上傳 / ${file.name}` },
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setVision(result.analysis);
      updateAsset(id, { tags: tagsFromVision(result.analysis, ["上傳"]) });
      const next = ideaFromVision(result.analysis, idea);
      setIdea(next);
      toast.success("已理解這張圖，接著生成文案與相似視覺");
      await copyGo(next);
      const dirs = await directionsGo(next);
      if (dirs[0]) await gen(dirs[0], directionLookOf(0), undefined, true);
    } finally {
      setBusy(false);
    }
  }

  if (!hydrated) return null;

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-6 pb-nav md:px-8 md:py-10">
      <PageHeader
        kicker="Image Studio"
        title="不要只生禪風海報"
        description="先找自己的茶會照片與設計，再想學生情境、淡水夜晚、三色光、龜龜，給三個方向。"
      />
      <p className="mt-3 text-xs text-muted" data-testid="studio-learn-banner">
        這次會參考過去 IG：「{studioHook}」。{learning.avoid}
      </p>
      <Textarea className="mt-6" value={idea} onChange={(e) => setIdea(e.target.value)} />
      <div className="mt-3 flex flex-wrap gap-2">
        {FORMATS.filter((f) => f.id !== "feed-landscape").map((f) => (
          <Button key={f.id} size="sm" variant={format === f.id ? "default" : "secondary"} onClick={() => setFormat(f.id)}>
            {f.short}
          </Button>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button disabled={busy} onClick={() => void boot(idea)}>
          提出三個視覺方向
        </Button>
        <Button variant="secondary" disabled={busy} onClick={() => void copyGo()}>
          生成文案
        </Button>
        <Button variant="secondary" disabled={busy} onClick={() => void sendToCanva()}>
          送進 Canva
        </Button>
        <Button
          variant="secondary"
          data-testid="image-into-create"
          onClick={() => {
            const hit = pinned[0];
            const search = hit ? createSearchFromHit(hit) : { mode: "idea", idea };
            void navigate({
              to: "/create",
              search: { ...search, idea },
            });
          }}
        >
          做成完整宣傳
        </Button>
      </div>

      {found.length || liveNote ? (
        <section className="mt-8" data-testid="found-sources">
          <h2 className="text-sm font-medium">找到 {found.length} 個相關素材</h2>
          <p className="mt-1 text-xs text-muted" data-testid="live-found-note">
            可釘選當風格參考。來源會標出來。
            {liveNote ? ` ${liveNote.replace(/[。.]+\s*$/, "")}。` : ""}{" "}
            {Object.entries(foundGroups)
              .map(([source, list]) => `${sourceLabelOf(source)} ${list.length}`)
              .join(" · ")}
          </p>
          {Object.entries(foundGroups).map(([source, list]) => (
            <div key={source} className="mt-3">
              <h3 className="text-xs tracking-[0.14em] text-muted uppercase">{sourceLabelOf(source)}</h3>
              <ul className="mt-2 space-y-2">
                {list.map((hit) => {
                  const pinnedHit = pinned.some((row) => row.id === hit.id);
                  const thumb = hit.thumbnail || (hit.assetId ? urls[hit.assetId] : undefined);
                  return (
                    <li key={hit.id} className="flex flex-wrap items-center gap-3 rounded-2xl bg-surface px-3 py-2 text-sm shadow-[var(--shadow-border)]">
                      {thumb ? (
                        <img src={thumb} alt="" data-testid="found-thumb" className="size-12 shrink-0 rounded-xl object-cover" />
                      ) : (
                        <span className="size-12 shrink-0 rounded-xl bg-surface-2" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate">{hit.title}</p>
                        <p className="mt-1 truncate text-xs text-muted">
                          {sourceLabelOf(hit.source)} · {hit.subtitle}
                        </p>
                      </div>
                      <Button size="sm" variant={pinnedHit ? "default" : "secondary"} onClick={() => togglePin(hit)}>
                        {pinnedHit ? "已參考" : "加入參考"}
                      </Button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </section>
      ) : null}

      {lastImage ? (
        <section className="mt-6" data-testid="image-ready">
          <h2 className="text-sm font-medium">主視覺</h2>
          <p className="mt-1 text-xs text-muted">來源：{sourceCredit || "AI Generated"}</p>
          <div className="mt-3">
            <HeroVisual
              base64={lastImage.base64}
              mime={lastImage.mime}
              headline={lastImage.headline}
              source={sourceCredit || "AI Generated"}
            />
          </div>
        </section>
      ) : null}
      <ul className="mt-6 space-y-3" data-testid="direction-list">
        {directions.map((dir, index) => (
          <li key={dir.id} className="rounded-2xl bg-surface p-4 shadow-[var(--shadow-border)]">
            {directionLooks[index] ? (
              <img
                alt={`${dir.name} 視覺方向`}
                src={`data:image/svg+xml;base64,${directionLooks[index]}`}
                className="mb-3 aspect-[4/5] w-full max-w-[13rem] rounded-xl object-cover"
                data-testid={index === 0 ? "direction-look-a" : index === 1 ? "direction-look-b" : "direction-look-c"}
              />
            ) : null}
            <p className="font-medium">{dir.name}</p>
            <p className="mt-1 text-sm">{dir.concept}</p>
            <p className="mt-2 text-xs text-muted">配色 {dir.palette}</p>
            <p className="text-xs text-muted">構圖 {dir.composition}</p>
            <p className="text-xs text-muted">字體 {dir.typeDirection}</p>
            <p className="mt-2 text-sm" data-testid="direction-headline">
              {dir.headline} · {dir.subhead}
            </p>
            <details className="mt-2">
              <summary className="text-xs text-muted">圖片 Prompt</summary>
              <p className="mt-1 text-xs text-subtle" data-testid="direction-prompt">
                {dir.prompt}
              </p>
            </details>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                size="sm"
                disabled={busy}
                onClick={() => void gen(dir, directionLookOf(index))}
              >
                生成此方向
              </Button>
              <Button
                size="sm"
                variant="secondary"
                disabled={busy}
                onClick={() => {
                  const tick = regenTick.current[dir.id] ?? 0;
                  regenTick.current[dir.id] = tick + 1;
                  void gen(dir, VARIATIONS[tick % VARIATIONS.length].id);
                }}
              >
                重新生成
              </Button>
              {VARIATIONS.map((item) => (
                <Button key={item.id} size="sm" variant="secondary" disabled={busy} onClick={() => void gen(dir, item.id)}>
                  {item.label}
                </Button>
              ))}
              {FORMATS.filter((f) => f.id !== "feed-landscape" && f.id !== format).map((item) => (
                <Button
                  key={`ext-${item.id}`}
                  size="sm"
                  variant="secondary"
                  disabled={busy}
                  onClick={() => void gen(dir, directionLookOf(index), item.id)}
                >
                  延伸 {item.short}
                </Button>
              ))}
              <Button size="sm" variant="secondary" disabled={busy} onClick={() => void sendToCanva(dir)}>
                這個方向送 Canva
              </Button>
            </div>
          </li>
        ))}
      </ul>
      {packs.length ? (
        <section className="mt-8">
          <h2 className="text-sm font-medium">從畫面／想法生成的文案</h2>
          <div className="mt-2 flex flex-wrap gap-2">
            {packs.map((pack) => (
              <Button key={pack.tone} size="sm" variant={tone === pack.tone ? "default" : "secondary"} onClick={() => setTone(pack.tone)}>
                {TONE_LABEL[pack.tone]}
              </Button>
            ))}
          </div>
          {activePack ? (
            <article className="mt-3 rounded-2xl bg-surface p-4 shadow-[var(--shadow-border)]">
              <p className="font-display text-xl">{activePack.hook}</p>
              <p className="mt-3 whitespace-pre-wrap text-sm">{activePack.body}</p>
              <p className="mt-3 text-sm">{activePack.cta}</p>
              <p className="mt-2 text-xs text-muted">{activePack.hashtags.join(" ")}</p>
            </article>
          ) : null}
        </section>
      ) : null}
      {review ? (
        <StudentReviewCard
          review={review}
          onApplyHook={(hook) => {
            setPacks((rows) =>
              rows.map((pack) => ({
                ...pack,
                hook,
                body: pack.body.replace(pack.hook, hook),
              })),
            );
            toast.success("已套用學生視角 Hook");
          }}
        />
      ) : null}
      <section className="mt-10">
        <h2 className="text-sm font-medium">丟入照片／舊海報</h2>
        <PhotoDrop disabled={busy} onFile={(file) => void onFile(file)} />
        {vision ? (
          <VisionCard vision={vision}>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                size="sm"
                onClick={() => {
                  const next = `${vision.content}。延續這個品牌 DNA，做新的活動，不要複製舊作品。`;
                  setIdea(next);
                  void directionsGo(next);
                  void copyGo(next);
                }}
              >
                生成相似視覺
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  const next = `${vision.content}。保留畫面內容，重新設計成適合淡江學生停留的 IG 主視覺，不要複製舊作品。`;
                  setIdea(next);
                  void directionsGo(next);
                }}
              >
                保留內容重新設計
              </Button>
              <Button size="sm" variant="secondary" onClick={() => void navigate({ to: "/create", search: { mode: "idea", idea: vision.content } })}>
                延續這個風格
              </Button>
              <Button size="sm" variant="secondary" onClick={() => void navigate({ to: "/create", search: { mode: "story", idea: vision.content } })}>
                做成限動
              </Button>
              <Button size="sm" variant="secondary" onClick={() => void navigate({ to: "/create", search: { mode: "carousel", idea: vision.content } })}>
                做成 Carousel
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  setFormat("reels-cover");
                  void directionsGo(vision.content, "reels-cover");
                }}
              >
                做成 Reels Cover
              </Button>
            </div>
          </VisionCard>
        ) : null}
      </section>
    </main>
  );
}
