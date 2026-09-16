import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { mockReels, mockStoryFrames } from "./pack-mock";
import { parseFnInput } from "./parse";

const ConvertInput = z.object({
  title: z.string().min(1).max(120),
  hook: z.string().max(160).optional(),
  body: z.string().max(800).optional(),
  when: z.string().max(80).optional(),
  where: z.string().max(80).optional(),
  cta: z.string().max(40).optional(),
});

export const convertContent = createServerFn({ method: "POST" })
  .validator((input: unknown) => parseFnInput(ConvertInput, input))
  .handler(async ({ data }) => {
    const hook = data.hook || "最近是不是很久沒有好好坐下來？";
    const when = data.when || "";
    const where = data.where || "淡江校園";
    return {
      ok: true as const,
      carousel: [
        { role: "cover", title: hook, body: data.title },
        { role: "scene", title: "課表有了，人還在趕路", body: data.body || "不是你不夠努力。" },
        { role: "pain", title: "想交朋友，但不想硬熱場", body: "來坐著就好。" },
        { role: "detail", title: data.title, body: data.body || "燈光、熱茶。" },
        { role: "cta", title: data.cta || "晚上來坐一下", body: `${when} ${where}`.trim() },
      ],
      story: mockStoryFrames(data.title, when, where),
      threads: `${hook}\n${data.title}\n${when} ${where}\n${data.cta || "帶一個朋友來就好。"}`,
      line: `【${data.title}】${when} ${where}\n${hook}`,
      reels: mockReels(data.title, when || data.title),
    };
  });
