import type { IgMemoryPost } from "../creative/types.ts";
import { applyStudentRevisions, mockStudentSim } from "../ai/pack-mock.ts";
import { HOOK_BANK, VOICE } from "./identity.ts";
import type { CopyDeck, StudentSim } from "../studio/types.ts";

function firstLine(caption: string) {
  return caption.split("\n").map((line) => line.trim()).find(Boolean) ?? "";
}

function inferWhen(caption: string, when?: string) {
  if (when) return when;
  if (/明天/.test(caption)) return "明天";
  if (/下週|下周/.test(caption)) return "下週";
  const match = caption.match(/(\d{1,2})[/／月](\d{1,2})/);
  if (match) return `${match[1]}/${match[2]}`;
  return "";
}

function inferWhere(caption: string, where?: string) {
  if (where) return where;
  if (/淡水/.test(caption)) return "淡水";
  if (/宿舍/.test(caption)) return "宿舍";
  if (/淡江|校園/.test(caption)) return "淡江";
  return "";
}

export function analyzeIgMemoryPost(
  post: Pick<IgMemoryPost, "caption" | "mediaType" | "analysis"> & { when?: string; where?: string },
): NonNullable<IgMemoryPost["analysis"]> {
  const hook = firstLine(post.caption);
  const caption = post.caption;
  const sim = mockStudentSim({
    hook,
    caption,
    when: inferWhen(caption, post.when),
    where: inferWhere(caption, post.where) || "淡江",
    cta: "",
  });
  const visual = /龜/.test(caption)
    ? "龜龜或角色感，學生比較會停。"
    : /茶|杯/.test(caption)
      ? "茶會圍坐、手與杯子。"
      : /光|夜/.test(caption)
        ? "夜間光，不要寺廟金。"
        : /捷運|宿舍|課表/.test(caption)
          ? "校園生活切片。"
          : "畫面要再對：淡江學生會不會停？";
  const hasCta = /留言|連結|報名|來坐|帶一個朋友/.test(caption);
  const improve = [
    ...(sim.revisions ?? []),
    /誠摯邀請|本週活動/.test(hook) ? "第一句改生活問句，不要社團官方。" : "",
    !hasCta && !sim.knowsHowToJoin ? "告訴學生怎麼來：留言或連結。" : "",
    caption.length > 280 ? "刪掉後段金句。" : "",
  ].filter(Boolean);
  const unique = [...new Set(improve)];

  return {
    hook,
    visual,
    theme: /茶/.test(caption) ? "茶會" : /光/.test(caption) ? "夜間坐下" : post.analysis?.theme ?? "生活",
    captionLength: caption.length,
    cta: hasCta ? "有行動" : "弱",
    direction:
      post.mediaType === "carousel"
        ? "Carousel 第一頁只留生活問句，活動放後面。"
        : "延續自己的 IG DNA，不要套一般品牌模板。",
    improve: unique.length ? unique : ["Hook 可以更生活"],
    studentSim: sim,
  };
}

function needsLivingHook(hook: string, sim?: StudentSim) {
  return Boolean(sim?.tooSerious) || VOICE.forbiddenOpeners.some((opener) => hook.includes(opener));
}

function stripOfficialVoice(text: string) {
  return text
    .replace(/淡江大學禪學社誠摯邀請您?蒞臨?/g, "")
    .replace(/誠摯邀請您?/g, "")
    .replace(/敬邀蒞臨/g, "")
    .replace(/歡迎蒞臨/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** 把學生視角修改寫回即將發的 Caption，不要只停在分析卡片。 */
export function applyStudentSimToCopy(copy: CopyDeck, sim: StudentSim, when?: string, where?: string): CopyDeck {
  const caption = copy.caption.trim() || copy.body;
  const hook = needsLivingHook(copy.headline || firstLine(caption), sim)
    ? (HOOK_BANK.find((line) => line !== copy.headline) ?? HOOK_BANK[0])
    : copy.headline;
  const revised = applyStudentRevisions(
    { tone: "student", hook, body: caption, cta: copy.cta, hashtags: copy.hashtags },
    sim,
    when,
    where,
  );
  const body = stripOfficialVoice(revised.body);
  const nextCaption = [needsLivingHook(firstLine(body), sim) ? revised.hook : null, body].filter(Boolean).join("\n");
  return {
    ...copy,
    headline: revised.hook,
    caption: nextCaption.trim(),
    body: copy.body && copy.body !== copy.caption ? stripOfficialVoice(copy.body) : nextCaption.trim(),
    cta: revised.cta,
  };
}
