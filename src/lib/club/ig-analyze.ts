import type { IgMemoryPost } from "../creative/types.ts";
import { mockStudentSim } from "../ai/pack-mock.ts";

function firstLine(caption: string) {
  return caption.split("\n").map((line) => line.trim()).find(Boolean) ?? "";
}

export function analyzeIgMemoryPost(
  post: Pick<IgMemoryPost, "caption" | "mediaType" | "analysis">,
): NonNullable<IgMemoryPost["analysis"]> {
  const hook = firstLine(post.caption);
  const caption = post.caption;
  const sim = mockStudentSim({
    hook,
    caption,
    when: "",
    where: "淡江",
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
