import { IG_DNA, SEED_IG_POSTS } from "./memory.ts";
import type { IgMemoryPost } from "./types.ts";

export function scorePost(post: IgMemoryPost) {
  return post.saves * 3 + post.comments * 2 + post.likes + Math.round(post.reach / 40);
}

export function hookKind(text: string): "announce" | "question" | "life" {
  if (/誠摯|本週社課|歡迎參加|招生成員|敬邀/.test(text)) return "announce";
  if (/[？?]|是不是|有沒有|嗎/.test(text)) return "question";
  return "life";
}

function meanSaveRate(list: IgMemoryPost[]) {
  if (!list.length) return 0;
  return list.reduce((sum, post) => sum + (post.reach ? post.saves / post.reach : 0), 0) / list.length;
}

export function learnFromPosts(posts: IgMemoryPost[] = SEED_IG_POSTS) {
  const ranked = [...posts].sort((a, b) => scorePost(b) - scorePost(a));
  const winning = ranked.slice(0, 3);
  const losing = [...ranked].reverse().slice(0, 2);
  const winningHooks = winning.map((p) => p.hook || p.caption.split("\n")[0] || "").filter(Boolean);
  const losingHooks = losing.map((p) => p.hook || p.caption.split("\n")[0] || "").filter(Boolean);
  const saveRate =
    ranked.reduce((sum, p) => sum + (p.reach ? p.saves / p.reach : 0), 0) / Math.max(ranked.length, 1);
  const questions = posts.filter((p) => hookKind(`${p.hook}\n${p.caption}`) === "question");
  const announces = posts.filter((p) => hookKind(`${p.hook}\n${p.caption}`) === "announce");
  const reels = posts.filter((p) => p.mediaType === "reels");
  const images = posts.filter((p) => p.mediaType === "image");
  const carousels = posts.filter((p) => p.mediaType === "carousel");
  const questionSaveRate = meanSaveRate(questions);
  const announceSaveRate = meanSaveRate(announces);
  const reelsSaveRate = meanSaveRate(reels);
  const imageSaveRate = meanSaveRate(images);
  const carouselSaveRate = meanSaveRate(carousels);
  const works: string[] = [];
  if (questions.length && announces.length && questionSaveRate > announceSaveRate) {
    works.push("問句 Hook 的收藏率比公告腔高。");
  }
  if (reels.length && reelsSaveRate >= imageSaveRate) {
    works.push("Reels 前 3 秒生活畫面，比單張海報更能停。");
  }
  if (carousels.length && carouselSaveRate >= imageSaveRate) {
    works.push("Carousel 封面是句子不是海報時，結構比較有效。");
  }
  works.push("生活 Hook 先出現、龜龜加學生口吻會讓人想帶朋友。");
  const fails: string[] = [];
  if (announces.length) fails.push("「本週社課／誠摯邀請」公告腔、太正式、沒有學生生活。");
  fails.push("活動海報當第一句、Grid 上一直招生。");
  return {
    ranked,
    winning,
    losing,
    winningHooks,
    losingHooks,
    saveRate,
    questionSaveRate,
    announceSaveRate,
    reelsSaveRate,
    carouselSaveRate,
    imageSaveRate,
    whatWorks: works.join(""),
    whatFails: fails.join(""),
  };
}

const AD_KINDS = new Set(["carousel", "knowledge", "countdown", "recap", "poster"]);

export function isCampaignAdPost(post: IgMemoryPost) {
  if (post.contentKind && AD_KINDS.has(post.contentKind)) return true;
  if (post.mediaType === "carousel") return true;
  return /招生|本週社課|誠摯|活動名|預告 ·|主視覺/.test(`${post.hook ?? ""}\n${post.caption}`);
}

export function recentPostedNotes(posts: IgMemoryPost[], now = Date.now()) {
  const ranked = [...posts].sort((a, b) => b.postedAt - a.postedAt).slice(0, 6);
  if (!ranked.length) return "最近還沒發新內容。";
  const line = `最近發過：${ranked.map((post) => `${post.hook || post.caption.split("\n")[0]}（${post.mediaType}）`).join("／")}`;
  const fresh = ranked.filter((post) => now - post.postedAt < 21 * 86_400_000);
  const look = fresh.length ? fresh : ranked.slice(0, 3);
  const promos = look.filter(isCampaignAdPost);
  const latestStudio = ranked.find((post) => post.id.startsWith("ig_studio_"));
  if (latestStudio && now - latestStudio.postedAt < 21 * 86_400_000) {
    if (isCampaignAdPost(latestStudio)) {
      return `${line}。剛發過活動向，下一則改生活或互動。`;
    }
    return `${line}。剛發過生活向，下一則可以接活動內容或倒數。`;
  }
  if ((fresh.length >= 2 && promos.length >= 2) || (fresh.length === 0 && promos.length >= 2)) {
    return `${line}。已經連續活動向，下一則改生活或互動。`;
  }
  return line;
}

export function whyPostWorked(post: IgMemoryPost) {
  const kind = hookKind(`${post.hook}\n${post.caption}`);
  const bits: string[] = [];
  if (kind === "question") bits.push("問句 Hook");
  else if (kind === "life") bits.push("生活語氣");
  else bits.push("公告腔，下次改問句");
  if (post.mediaType === "carousel") bits.push("Carousel 封面是句子");
  if (post.mediaType === "reels") bits.push("Reels 前 3 秒");
  if (post.saves >= 80) bits.push("收藏高");
  return bits.join(" · ");
}

export function analysisFromInsights(post: {
  likes: number;
  comments: number;
  saves: number;
  reach: number;
  hook?: string;
  caption: string;
  mediaType: IgMemoryPost["mediaType"];
}) {
  const why = whyPostWorked({
    id: "insight",
    mediaType: post.mediaType,
    caption: post.caption,
    postedAt: 0,
    assetId: "",
    likes: post.likes,
    comments: post.comments,
    saves: post.saves,
    reach: post.reach,
    hook: post.hook,
  });
  if (post.reach <= 0 && post.saves <= 0) {
    return `官方貼文已同步，Insights 還沒有觸及或收藏。${why}`;
  }
  return `官方 Insights：觸及 ${post.reach}、收藏 ${post.saves}、讚 ${post.likes}、留言 ${post.comments}。${why}`;
}

export function nextCreateHint(posts: IgMemoryPost[] = SEED_IG_POSTS, now = Date.now()) {
  const learned = learnFromPosts(posts);
  const recent = recentPostedNotes(posts, now);
  const stacked = /連續活動向|剛發過活動向/.test(recent);
  let form = "問句 Hook 的生活向內容";
  if (stacked) form = "生活或互動，不要再發活動海報";
  else if (recent.includes("剛發過生活向")) form = "活動內容或倒數，把時間地點講清楚";
  else if (learned.carouselSaveRate > 0 && learned.carouselSaveRate >= learned.imageSaveRate) {
    form = "Carousel，封面是句子不是海報";
  } else if (learned.reelsSaveRate > 0 && learned.reelsSaveRate >= learned.imageSaveRate) {
    form = "Reels，前 3 秒生活畫面";
  }
  const prefix = (() => {
    const latest = [...posts]
      .filter((post) => post.id.startsWith("ig_studio_"))
      .sort((a, b) => b.postedAt - a.postedAt)[0];
    if (!latest || now - latest.postedAt >= 21 * 86_400_000) return "";
    const hook = (latest.hook || latest.caption.split("\n")[0] || "").replace(/[。．.!?！？]+$/u, "");
    return hook ? `剛發過「${hook}」。` : "";
  })();
  return {
    form,
    line: `${prefix}做一篇${form}。先讓學生覺得「這好像在講我」，再進活動。`,
    why: learned.whatWorks,
    avoid: learned.whatFails,
    rates: `問句收藏率 ${(learned.questionSaveRate * 100).toFixed(1)}% · 公告 ${(learned.announceSaveRate * 100).toFixed(1)}% · Carousel ${(learned.carouselSaveRate * 100).toFixed(1)}% · Reels ${(learned.reelsSaveRate * 100).toFixed(1)}%`,
  };
}

export function igDnaBlock(posts: IgMemoryPost[] = SEED_IG_POSTS) {
  const learned = learnFromPosts(posts);
  const next = nextCreateHint(posts);
  return `Zen Club IG DNA（優先參考自己的 IG，不要套一般品牌模板）：
帳號：${IG_DNA.handle}
語氣：${IG_DNA.voice}
Caption：${IG_DNA.captionLength}
視覺：${IG_DNA.visual}
配色：${IG_DNA.colors.join("、")}
常見活動：${IG_DNA.events.join("、")}
CTA：${IG_DNA.cta.join("／")}
Hashtag：${IG_DNA.hashtags.join(" ")}
學生偏好：${IG_DNA.studentPref}
收藏較高的 Hook：${learned.winningHooks.join("／")}
較有效：${learned.whatWorks}
較無效：${learned.whatFails}
避開這些開場：${learned.losingHooks.join("／")}
${recentPostedNotes(posts)}
下一則建議：${next.line}`;
}

export function dnaPromptIdea(posts: IgMemoryPost[] = SEED_IG_POSTS) {
  const learned = learnFromPosts(posts);
  const hook = learned.winningHooks[0] || "最近是不是很久沒有好好坐下來？";
  return `延續我們 IG 裡有效的語氣，寫一篇新內容。不要複製舊文。參考 Hook：「${hook}」。${recentPostedNotes(posts)} 先讓淡江學生覺得在講他，再帶活動。`;
}
