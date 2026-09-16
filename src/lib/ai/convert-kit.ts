import { mockReels, mockStoryFrames } from "./pack-mock.ts";
import type { ReelsBeat, StoryFrame } from "../studio/types.ts";

export type ConvertSlide = { role: "hook" | "scene" | "pain" | "detail" | "cta"; title: string; body: string };

export type ConvertKit = {
  carousel: ConvertSlide[];
  story: StoryFrame[];
  threads: string;
  line: string;
  reels: ReelsBeat[];
};

export type ConvertInputLite = {
  title: string;
  hook?: string;
  body?: string;
  when?: string;
  where?: string;
  cta?: string;
};

function firstSentence(text: string) {
  return text.split(/[。\n]/).map((line) => line.trim()).find(Boolean) ?? text.trim();
}

/** 一篇內容轉成各平台骨架；時間地點放最後一頁／最後幾秒。 */
export function buildConvertKit(input: ConvertInputLite): ConvertKit {
  const title = input.title.trim() || "淡江禪學社";
  const hook = (input.hook ?? "").trim() || "最近是不是很久沒有好好坐下來？";
  const body = (input.body ?? "").trim() || "燈光、熱茶、坐著就好。不用先懂禪。";
  const when = (input.when ?? "").trim();
  const where = (input.where ?? "").trim() || "淡江校園";
  const cta = (input.cta ?? "").trim() || "晚上來坐一下";
  const loc = [when, where].filter(Boolean).join(" · ");
  const scene = firstSentence(body);

  const story = mockStoryFrames(title, when, where).map((frame, index) => {
    if (index === 0) return { ...frame, headline: hook, body: scene };
    if (index === 1) return { ...frame, headline: title, body };
    return frame;
  });

  const reels = mockReels(title, loc || title).map((beat, index) => {
    if (index === 0) return { ...beat, caption: hook };
    if (index === 1) return { ...beat, caption: title };
    if (index === 3) return { ...beat, caption: loc || beat.caption };
    if (index === 4) return { ...beat, caption: cta };
    return beat;
  });

  return {
    carousel: [
      { role: "hook", title: hook, body: title },
      { role: "scene", title: "課表有了，人還在趕路", body: scene },
      { role: "pain", title: "想交朋友，但不想硬熱場", body: "來坐著就好。不用先懂禪。" },
      { role: "detail", title: title, body },
      { role: "cta", title: cta, body: loc },
    ],
    story,
    threads: `${hook}\n${title}\n${loc}\n${cta}`,
    line: `【${title}】${loc}\n${hook}\n${cta}`,
    reels,
  };
}
