import { IG_DNA, SEED_IG_POSTS } from "./memory.ts";
import type { IgMemoryPost } from "./types.ts";

export function scorePost(post: IgMemoryPost) {
  return post.saves * 3 + post.comments * 2 + post.likes + Math.round(post.reach / 40);
}

export function learnFromPosts(posts: IgMemoryPost[] = SEED_IG_POSTS) {
  const ranked = [...posts].sort((a, b) => scorePost(b) - scorePost(a));
  const winning = ranked.slice(0, 3);
  const losing = [...ranked].reverse().slice(0, 2);
  const winningHooks = winning.map((p) => p.hook || p.caption.split("\n")[0] || "").filter(Boolean);
  const losingHooks = losing.map((p) => p.hook || p.caption.split("\n")[0] || "").filter(Boolean);
  const saveRate =
    ranked.reduce((sum, p) => sum + (p.reach ? p.saves / p.reach : 0), 0) / Math.max(ranked.length, 1);
  return {
    ranked,
    winning,
    losing,
    winningHooks,
    losingHooks,
    saveRate,
    whatWorks:
      "生活 Hook 先出現、封面是句子不是海報、Reels 前 3 秒不要社徽、龜龜加學生口吻會讓人想帶朋友。",
    whatFails: "「本週社課／誠摯邀請」公告腔、太正式、沒有學生生活、活動海報當第一句。",
  };
}

export function igDnaBlock(posts: IgMemoryPost[] = SEED_IG_POSTS) {
  const learned = learnFromPosts(posts);
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
避開這些開場：${learned.losingHooks.join("／")}`;
}

export function dnaPromptIdea(posts: IgMemoryPost[] = SEED_IG_POSTS) {
  const learned = learnFromPosts(posts);
  const hook = learned.winningHooks[0] || "最近是不是很久沒有好好坐下來？";
  return `延續我們 IG 裡有效的語氣，寫一篇新內容。不要複製舊文。參考 Hook：「${hook}」。先讓淡江學生覺得在講他，再帶活動。`;
}
