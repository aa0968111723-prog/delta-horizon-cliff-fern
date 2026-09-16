import type { IgMemoryPost, LastLearn } from "../creative/types.ts";

export type ClubInsights = {
  hookLesson: string;
  visualLesson: string;
  eventCopyLesson: string;
  carouselLesson: string;
  storyLesson: string;
  mixLesson: string;
  winningHooks: string[];
  winningVisuals: string[];
  avgCaption: number;
  answers: string[];
};

function engagement(post: Pick<IgMemoryPost, "saves" | "comments" | "reach" | "likes" | "shares">) {
  return (post.saves ?? 0) * 4 + (post.comments ?? 0) * 2 + (post.likes ?? 0) * 0.2 + (post.shares ?? 0) * 3 + (post.reach ?? 0) / 80;
}

function firstLine(caption: string) {
  return caption.split("\n").map((line) => line.trim()).find(Boolean) ?? "";
}

function isEventAd(caption: string) {
  return /報名|招生|誠摯|本週活動|敬邀/.test(caption);
}

function isLife(caption: string) {
  return /坐|休息|課表|宿舍|捷運|淡水|累|朋友|龜/.test(caption);
}

export function clubInsightsFromPosts(
  posts: Array<Pick<IgMemoryPost, "caption" | "saves" | "comments" | "reach" | "likes" | "shares" | "mediaType" | "analysis">>,
): ClubInsights {
  const ranked = [...posts].sort((a, b) => engagement(b) - engagement(a));
  const top = ranked.slice(0, 3);
  const winningHooks = top.map((post) => post.analysis?.hook || firstLine(post.caption)).filter(Boolean);
  const winningVisuals = top.map((post) => post.analysis?.visual).filter((value): value is string => Boolean(value));
  const lengths = ranked.map((post) => post.caption.length).filter((n) => n > 0);
  const avgCaption = lengths.length ? Math.round(lengths.reduce((a, b) => a + b, 0) / lengths.length) : 80;

  const questionWins = top.some((post) => /[？?]/.test(firstLine(post.caption)));
  const invitationLoses = ranked.slice(-2).some((post) => /誠摯邀請|本週活動/.test(post.caption));
  const hookLesson = questionWins
    ? "問句和生活判斷句比較會被收藏；社團介紹開頭比較弱。"
    : invitationLoses
      ? "官方邀請句表現差，第一句要先講淡江學生正在過的生活。"
      : "高收藏的第一句都在講生活，不是活動名稱。";

  const visualLesson = winningVisuals[0]
    ? `學生比較停的畫面：${winningVisuals.slice(0, 2).join("、")}。寺廟金、僧袍、滿版標語比較容易划走。`
    : "茶會圍坐、龜龜、河岸光比寺廟海報更容易停。";

  const eventTop = top.find((post) => isEventAd(post.caption));
  const eventCopyLesson = eventTop
    ? "活動文也可以有效，但要先生活再出現時間地點。"
    : "純招生文目前沒有進高收藏。活動資訊放後面，Hook 先對到課表、宿舍或期末。";

  const carousel = ranked.find((post) => post.mediaType === "carousel");
  const carouselLesson = carousel?.analysis?.direction
    ? `Carousel：${carousel.analysis.direction}`
    : "Carousel 第一頁只留生活問句，第三頁才出現活動，最後一頁才 CTA。";

  const storyLesson = ranked.some((post) => (post.comments ?? 0) > 20)
    ? "短句＋角色或提問，留言會比較多；長說明不適合限動。"
    : "Story 用 3–5 張短句，一張一個訊息，最後才放時間地點。";

  const ads = ranked.filter((post) => isEventAd(post.caption)).length;
  const life = ranked.filter((post) => isLife(post.caption) && !isEventAd(post.caption)).length;
  const mixLesson =
    ads > life
      ? "最近活動廣告偏多。下一波穿插生活、互動、知識，避免 IG 看起來一直在招生。"
      : "生活與陪伴文撐住停留。活動週可以插主視覺，但不要連發三則報名。";

  const answers = [
    `哪種 Hook 比較有效？${hookLesson}`,
    `哪種圖片學生比較停留？${visualLesson}`,
    `哪種活動文案比較有效？${eventCopyLesson}`,
    `Carousel 哪種結構比較好？${carouselLesson}`,
    `Story 哪種互動比較多？${storyLesson}`,
  ];

  return {
    hookLesson,
    visualLesson,
    eventCopyLesson,
    carouselLesson,
    storyLesson,
    mixLesson,
    winningHooks,
    winningVisuals,
    avgCaption,
    answers,
  };
}

export function insightsPromptBlock(insights: ClubInsights) {
  return `自己 IG 成效學習（用來改善下一次，不是報表）：
${insights.answers.join("\n")}
節奏：${insights.mixLesson}
高收藏 Hook：${insights.winningHooks.join(" ／ ") || "生活問句"}
平均 Caption 約 ${insights.avgCaption} 字。
不要用抽象客群稱呼。`;
}

export function lastLearnFromPosts(
  posts: Parameters<typeof clubInsightsFromPosts>[0],
  publishedHook: string,
  at: number,
): LastLearn {
  const insights = clubInsightsFromPosts(posts);
  const hook = publishedHook.split("\n").map((line) => line.trim()).find(Boolean) ?? insights.winningHooks[0] ?? "";
  return {
    at,
    hook,
    mixLesson: insights.mixLesson,
    hookLesson: insights.hookLesson,
    visualLesson: insights.visualLesson,
  };
}

export function lastLearnPromptBlock(
  learn: Pick<LastLearn, "hook" | "hookLesson" | "mixLesson" | "visualLesson"> | null,
) {
  if (!learn?.hook) return "";
  const visual = learn.visualLesson ? ` ${learn.visualLesson}` : "";
  return `上次發布第一句是「${learn.hook}」。下一篇換生活切入，不要重複同一句。${learn.hookLesson} ${learn.mixLesson}${visual}`;
}

export function nextCreateFromLearn(
  learn: Pick<LastLearn, "hook" | "hookLesson" | "mixLesson" | "visualLesson">,
) {
  const hook = learn.hook.replace(/\s+/g, " ").slice(0, 48);
  const visual = learn.visualLesson ? ` ${learn.visualLesson}` : "";
  return `下一篇不要重複「${hook}」。${learn.hookLesson} ${learn.mixLesson}${visual} 幫我寫一篇新的 IG。`.slice(0, 360);
}
