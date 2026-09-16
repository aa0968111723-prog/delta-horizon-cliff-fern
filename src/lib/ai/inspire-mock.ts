import type { Inspiration } from "../creative/types.ts";

export function mockInspirationResearch(topic: string): Inspiration[] {
  const tea = /茶/.test(topic);
  const recruit = /招生/.test(topic);
  const night = /夜|光|晚上/.test(topic);
  return [
    {
      id: `insp_${Date.now()}_carousel`,
      title: "校園 Carousel 停留結構",
      pattern: "第一頁只留一句生活判斷，不露社團名",
      composition: "上半滿版生活畫面，下半大字、少於兩行",
      color: "低飽和＋一點夜間暖光",
      hookShape: "問句或「你最近…」判斷句",
      form: "5–6 頁；第三頁才出現活動",
      clubTurn: tea
        ? "用淡江宿舍泡麵味或課表當第一句，茶會放到第三頁。不要開頭寫禪學社簡介。"
        : "用捷運、課表、期末當第一句。活動名稱放在學生已經停下來之後。",
    },
    {
      id: `insp_${Date.now()}_cover`,
      title: "Reels 封面少字",
      pattern: "封面 ≤ 8 字，0–3 秒對到生活",
      composition: "光或人物在中上，字靠下安全區",
      color: night ? "深底三色光，不要寺廟金" : "霧亞麻底，一點水綠",
      hookShape: "口語短句，不加破折號",
      form: "20 秒內：生活 → 坐下 → 時間地點",
      clubTurn: recruit
        ? "封面寫「想交朋友但不想熱場」，不要寫招生活動全名。"
        : "封面寫「很久沒坐好」，不要寫活動全名和 Logo。",
    },
    {
      id: `insp_${Date.now()}_poster`,
      title: "活動海報的學生感",
      pattern: "先證明就在學校，再放時間地點",
      composition: "真實場域或圍坐當主體，字級大、留白夠",
      color: "品牌三色光當點綴，不是滿版漸層",
      hookShape: "一句人話，不要對聯",
      form: "IG 4:5 主視覺；Story 再切時間／地點／CTA",
      clubTurn: "用圖書館前、河岸、茶杯證明這是淡江晚上，而不是宗教場。龜龜當配角。",
    },
  ];
}
