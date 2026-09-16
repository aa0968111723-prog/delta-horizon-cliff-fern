import assert from "node:assert/strict";
import test from "node:test";
import { shouldPublishCarousel } from "./instagram-graph.ts";
import { carouselPosterInputs, pickCarouselPages } from "./publish-slides.ts";

test("carouselPosterInputs uses each page headline, not campaign-wave dumps", () => {
  const inputs = carouselPosterInputs(
    [
      { headline: "最近是不是很久沒坐好？", subhead: "Hook", body: "", visualNote: "封面" },
      { headline: "課表排滿", subhead: "情境", body: "淡水晚上", visualNote: "河岸" },
      { headline: "來坐一下", subhead: "CTA", body: "週三 19:00", visualNote: "時間" },
    ],
    { title: "茶會", name: "浮游禪光" },
  );
  assert.equal(inputs.length, 3);
  assert.equal(inputs[0]?.headline, "最近是不是很久沒坐好？");
  assert.equal(inputs[1]?.subhead, "情境");
  assert.equal(inputs[2]?.height, 1350);
  assert.notEqual(inputs[0]?.headline, "茶會");
  assert.equal(shouldPublishCarousel("carousel", inputs.length), true);
  assert.equal(shouldPublishCarousel("carousel", 1), false);
  assert.equal(shouldPublishCarousel("story", 6), false);
});

test("pickCarouselPages prefers the kit project, then campaignId", () => {
  const projects = [
    {
      id: "p1",
      campaignId: "c1",
      plan: {
        carouselPages: [
          { role: "cover" as const, headline: "A", subhead: "", body: "", cta: "", visualNote: "", templateId: "quote" as const },
          { role: "cta" as const, headline: "B", subhead: "", body: "", cta: "", visualNote: "", templateId: "quote" as const },
        ],
      },
    },
  ];
  assert.equal(pickCarouselPages(projects, { projectId: "p1", campaignId: "c1" }).length, 2);
  assert.equal(pickCarouselPages(projects, { projectId: null, campaignId: "c1" }).map((page) => page.headline).join(), "A,B");
  assert.equal(pickCarouselPages(projects, { projectId: null, campaignId: "missing" }).length, 0);
});
