export type IgLessonPost = {
  mediaType: string;
  caption: string;
  metrics?: { reach?: number; likes?: number; comments?: number; saves?: number };
  analysis?: string;
};

export type IgLessons = {
  hook: string;
  visual: string;
  activity: string;
  carousel: string;
  story: string;
};

function score(post: { metrics?: IgLessonPost["metrics"] }) {
  const m = post.metrics;
  if (!m) return 0;
  return (m.saves ?? 0) * 3 + (m.comments ?? 0) * 2 + (m.likes ?? 0) + Math.round((m.reach ?? 0) / 40);
}

function firstLine(caption: string) {
  return caption.split("\n")[0]?.trim() || caption.slice(0, 24);
}

function bestHookLine(posts: IgLessonPost[]) {
  const published = posts.find((post) => (post.analysis || "").includes("剛發布"));
  if (published) {
    const line = firstLine(published.caption).replace(/[「」]/g, "").trim();
    if (line) return line;
  }
  const scored = posts.filter((post) => post.metrics).sort((a, b) => score(b) - score(a));
  return firstLine(scored[0]?.caption ?? "").replace(/[「」]/g, "").trim();
}

export function formatLessons(lessons: IgLessons) {
  return [
    `Hook：${lessons.hook}`,
    `圖片：${lessons.visual}`,
    `活動文案：${lessons.activity}`,
    `Carousel：${lessons.carousel}`,
    `Story：${lessons.story}`,
  ].join("\n");
}

export function lessonPrompt(posts: IgLessonPost[]) {
  return formatLessons(lessonsFromIg(posts)).slice(0, 800);
}

export function preferPublishedAnalysis(prev?: string, next?: string) {
  if ((prev || "").includes("剛發布") && !(next || "").includes("剛發布")) return prev;
  return next ?? prev;
}

export function analysisFromLive(post: {
  caption?: string;
  mediaType?: string;
  metrics?: { reach?: number; likes?: number; comments?: number; saves?: number };
}) {
  const hook = firstLine(post.caption || "") || "沒有第一句";
  const kind = post.mediaType === "carousel" ? "Carousel" : post.mediaType === "reels" ? "Reels" : "單張";
  const m = post.metrics;
  if (!m || score(post) === 0) {
    return `官方 IG · ${kind}。還沒有足夠成效數字。Hook：「${hook}」。`;
  }
  const saves = m.saves ?? 0;
  const likes = m.likes ?? 0;
  const comments = m.comments ?? 0;
  if (saves >= 20 || saves * 3 > likes) {
    return `官方成效 · ${kind}。收藏高。Hook「${hook}」讓人停下來。下次延續問句，不要改回社團全名。`;
  }
  if (/龜龜/.test(hook) && comments < 8) {
    return `官方成效 · ${kind}。互動少。只露角色、沒有生活句。Hook：「${hook}」。`;
  }
  return `官方成效 · ${kind}。Hook「${hook}」。讚 ${likes}、收藏 ${saves}。時間地點要再早兩行。`;
}

function isRecapHook(hook: string) {
  return /^(來的人|回顧)/.test(hook) || hook.includes("有人問");
}

function questionInside(hook: string) {
  return hook.match(/([^。「」\n]{6,36}？)/)?.[1]?.trim() ?? "";
}

export function quotedHookFromLessons(text: string) {
  const quotes = [...text.matchAll(/「([^」]{6,48})」/g)].map((match) => match[1].trim()).filter(Boolean);
  if (/延續這個/.test(text) && quotes[0]) return quotes[0];
  const questions = quotes.filter((hook) => hook.includes("？") && !isRecapHook(hook));
  const student = questions.find((hook) => /最近|剛到|有時候|大學生活|休息|坐下來|快樂/.test(hook));
  if (student) return student;
  if (questions[0]) return questions[0];
  for (const hook of quotes) {
    if (!isRecapHook(hook)) continue;
    const inner = questionInside(hook);
    if (inner && !isRecapHook(inner)) return inner;
  }
  return quotes.find((hook) => hook.length >= 8 && !isRecapHook(hook)) ?? "";
}

/** Home / IG Center: turn performance advice into the next create prompt. */
export function nextCreateIdeaFromLessons(posts: IgLessonPost[], eventName?: string) {
  const lessons = lessonsFromIg(posts);
  const hook = bestHookLine(posts) || quotedHookFromLessons(formatLessons(lessons));
  const event = eventName?.trim() || "下一場活動";
  if (hook) {
    return `延續這個比較讓人停下來的第一句：「${hook}」。幫${event}做新的 IG。`;
  }
  return `根據過去 IG 表現來寫。${lessons.hook} 活動是${event}。`;
}

/** Calendar / 排程「AI 延伸」：帶上剛學會的 Hook，不要只丟波次標題。 */
export function extendScheduleIdea(
  title: string,
  pack?: { hook?: string; eventName?: string } | null,
  kindLabel?: string,
) {
  const event = pack?.eventName?.trim() || "";
  const hook = (pack?.hook || "").replace(/^[「"]+|[」"]+$/g, "").trim();
  const format = kindLabel?.trim() ? ` ${kindLabel.trim()}` : " IG";
  if (hook && event) {
    return `延續這個比較讓人停下來的第一句：「${hook}」。${title}。幫${event}做新的${format}。`;
  }
  if (hook) return `延續這個比較讓人停下來的第一句：「${hook}」。${title}`;
  return title;
}

export type RhythmMemory = {
  learnedHook: string;
  preferCarousel: boolean;
  recapOutperforms: boolean;
  turtleUnderperforms: boolean;
  recentAdHeavy: boolean;
  note: string;
};

export function emptyRhythmMemory(): RhythmMemory {
  return {
    learnedHook: "",
    preferCarousel: false,
    recapOutperforms: false,
    turtleUnderperforms: false,
    recentAdHeavy: false,
    note: "還沒有足夠成效，先用活動類型排節奏。",
  };
}

export function rhythmMemoryFromLessonText(text = ""): RhythmMemory {
  const learnedHook = quotedHookFromLessons(text);
  const preferCarousel = /Carousel/.test(text) && /有效|結構|對話/.test(text);
  const recapOutperforms = /回顧比預告|來了以後/.test(text);
  const turtleUnderperforms = /龜龜/.test(text) && /互動少|沒有生活/.test(text);
  const recentAdHeavy = /一直在招生|連續.*廣告|發太多活動/.test(text);
  return withRhythmNote({
    learnedHook,
    preferCarousel,
    recapOutperforms,
    turtleUnderperforms,
    recentAdHeavy,
    note: "",
  });
}

/** Translate IG memory into schedule choices: hook, format, density of ads. */
export function rhythmMemoryFromIg(posts: IgLessonPost[]): RhythmMemory {
  if (!posts.length) return emptyRhythmMemory();
  const base = rhythmMemoryFromLessonText(formatLessons(lessonsFromIg(posts)));
  const scored = posts.filter((post) => post.metrics).sort((a, b) => score(b) - score(a));
  const best = scored[0];
  const weakest = scored[scored.length - 1];
  const preferCarousel = best?.mediaType === "carousel" || base.preferCarousel;
  const turtleUnderperforms =
    Boolean(weakest && best && /龜龜/.test(weakest.caption) && score(weakest) < score(best) / 2) ||
    base.turtleUnderperforms;
  const recapOutperforms =
    Boolean(best && (/來的人|回顧/.test(best.caption) || best.mediaType === "carousel")) || base.recapOutperforms;
  const recent = posts.slice(-3);
  const adLike = (caption: string) => /誠摯邀請|報名連結|活動時間|歡迎參加/.test(caption);
  const recentAdHeavy = (recent.length >= 3 && recent.every((post) => adLike(post.caption))) || base.recentAdHeavy;
  return withRhythmNote({
    learnedHook: base.learnedHook,
    preferCarousel,
    recapOutperforms,
    turtleUnderperforms,
    recentAdHeavy,
    note: "",
  });
}

function withRhythmNote(memory: RhythmMemory): RhythmMemory {
  const bits = [
    memory.learnedHook ? `延續有效 Hook「${memory.learnedHook}」` : "",
    memory.preferCarousel ? "活動介紹用 Carousel" : "",
    memory.turtleUnderperforms ? "龜龜不放第一句" : "",
    memory.recapOutperforms ? "回顧比預告有停留，倒數後仍要留回顧" : "",
    memory.recentAdHeavy ? "穿插生活，不要連續招生" : "",
  ].filter(Boolean);
  return {
    ...memory,
    note: bits.length ? `根據過去 IG：${bits.join("，")}。` : emptyRhythmMemory().note,
  };
}

/** Turn IG metrics into next-generation advice, not a dashboard. */
export function lessonsFromIg(posts: IgLessonPost[]): IgLessons {
  const published = posts.find((post) => (post.analysis || "").includes("剛發布"));
  const scored = posts.filter((post) => post.metrics).sort((a, b) => score(b) - score(a));
  if (!scored.length && !published) {
    return {
      hook: "還沒有足夠的 IG 成效。先發，再讓 AI 記住哪種第一句會讓人停下來。",
      visual: "目前沒有圖片停留資料。夜間暖光與學生側影通常比廟宇海報更能停。",
      activity: "活動文案還缺回饋。先把時間地點講清楚，再看哪場有人真的來。",
      carousel: "Carousel 還沒有結構資料。先試 Hook → 情境 → 痛點 → 內容 → CTA。",
      story: "Story 還沒有互動資料。問一句真話，比連續三張活動海報有效。",
    };
  }
  const best = scored[0];
  const weakest = scored[scored.length - 1];
  const carousel = scored.find((post) => post.mediaType === "carousel") ?? (published?.mediaType === "carousel" ? published : undefined);
  const reels = scored.find((post) => post.mediaType === "reels");
  const recap = scored.find((post) => /來的人|回顧|可以。/.test(post.caption));
  const publishedHook = published ? firstLine(published.caption) : "";

  return {
    hook: publishedHook
      ? `剛發布的第一句是「${publishedHook}」。下次延續這種會讓人停下來的問法，不要改回「淡江大學禪學社誠摯邀請」。`
      : `比較有效的 Hook 像是「${firstLine(best.caption)}」。少用社團全名當第一句。`,
    visual: reels
      ? `夜間光與現場感比較有停留（Reels「${firstLine(reels.caption)}」）。龜龜可以入鏡，但要配一句學生生活。`
      : `收藏較高的畫面偏生活，而不是正式海報。`,
    activity: recap
      ? `活動文案裡，「來了以後發生什麼」比預告更有停留。預告要把時間地點講早一點。`
      : `活動資訊出現太晚的貼文，停留會掉。Hook 之後兩行內要有時間地點。`,
    carousel: carousel
      ? `Carousel 結構比較有效時，中段會變成對話而不是簡章。可延續「${firstLine(carousel.caption)}」這種口吻。`
      : `Carousel 還可以試：第一頁問句、第三頁互動、最後一頁報名。`,
    story: weakest && best && score(weakest) < score(best) / 2
      ? `互動比較少的是「${firstLine(weakest.caption)}」這類只露角色、沒有生活句的內容。Story 改問學生此刻卡在哪。`
      : `Story 適合問一句真話，或倒數，而不是再貼一次主視覺。`,
  };
}
