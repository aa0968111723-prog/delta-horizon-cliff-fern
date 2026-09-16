import type { VisionAnalysis } from "./image-studio.ts";

function utf8FromBase64(imageBase64: string) {
  try {
    return Buffer.from(imageBase64, "base64").toString("utf8").slice(0, 24_000);
  } catch {
    return "";
  }
}

function count(text: string, re: RegExp) {
  return (text.match(re) ?? []).length;
}

/** Inspect the still itself — Drive 現場照片 must not be labelled 太 AI. */
export function mockVisionFromLook(input: {
  imageBase64?: string;
  mime?: string;
  sourceNote?: string;
}): VisionAnalysis {
  const mime = input.mime ?? "";
  const note = input.sourceNote ?? "";
  const text = input.imageBase64 ? utf8FromBase64(input.imageBase64) : "";
  const svg = mime.includes("svg") || text.includes("<svg");
  const circles = count(text, /<circle/g);
  const tallRects = count(text, /height="[3-9]\d{2}"/g);
  const water = /#3D5A73|#2F6F6A/.test(text);
  const paper = /#EEF2EC|#F4F1EA/.test(text);
  const nestedPhoto = /data-source-photo/.test(text);
  const temple = /temple|incense|monk|木魚|寺廟|香爐/.test(`${text} ${note}`);
  const fromDrive = /Google Drive|drive|現場|茶會|淡水|校園/i.test(note);
  const fromCanva = /Canva/i.test(note);
  const fromIg = /Instagram/i.test(note);
  const documentary = nestedPhoto || fromDrive || (svg && water && tallRects >= 2);
  const orbPoster = circles >= 3 && tallRects < 2 && !nestedPhoto && !fromDrive;

  if (documentary) {
    return {
      content: note
        ? `畫面是現場／校園空氣（${note}），不是禪風海報。延續空氣，不要複製舊作品。`
        : "畫面是現場或校園空氣，不是禪風海報。",
      people: "有同學、座位或建築剪影，臉不必清楚。",
      colors: paper || water ? "霧園紙、靜水、一點暖光。" : "核對霧園／靜水／琥珀。",
      lighting: "淡水晚上、窗光或河岸濕度。",
      composition: "下三分之一放問句，上方給空氣。",
      textRatio: "照片本身字很少。",
      hierarchy: "先畫面再文字。",
      brandFeel: "龜龜與三色光可當安靜記號，不要宗教符號。",
      studentFeel: "像淡江學生會停下來，不像社團公告。",
      dwell: "現場空氣比資訊海報更容易停。",
      tooReligious: temple,
      tooOld: false,
      tooAi: false,
      fitsTamkang: true,
      suggestions: ["延續這個風格", "保留內容重新設計", "做成限動", "做成 Carousel", "做成 Reels Cover", "生成相似視覺"],
    };
  }

  if (orbPoster) {
    return {
      content: note
        ? `三色光與留白偏海報（${note}），可再往現場空氣靠。`
        : "三色光與留白偏海報，可再往現場空氣靠。",
      people: "人物不明顯，可留一個空位。",
      colors: "核對霧園／靜水／琥珀。",
      lighting: "光點偏光滑，少一點濕度。",
      composition: "下三分之一放問句。",
      textRatio: "下緣可放一句人話。",
      hierarchy: "問句先，時間地點後。",
      brandFeel: "龜龜與三色光可當安靜記號，不要宗教符號。",
      studentFeel: "光點好看，但淡江學生可能覺得太像海報。",
      dwell: "現場空氣比資訊海報更容易停。",
      tooReligious: temple,
      tooOld: false,
      tooAi: true,
      fitsTamkang: !temple,
      suggestions: ["延續這個風格", "做成限動", "做成 Carousel 封面", "往現場照片靠"],
    };
  }

  if (fromCanva) {
    return {
      content: `跟 Canva「${note}」抽層級與留白，不要整張沿用。`,
      people: "人物不是重點，層級先清楚。",
      colors: "跟歷屆抽霧園／靜水／琥珀。",
      lighting: "不要另起一套打光。",
      composition: "封面不要活動全名牆。",
      textRatio: "字少、層級清楚。",
      hierarchy: "標題 → 一句人話 → CTA。",
      brandFeel: "延續品牌 DNA，不要複製舊海報。",
      studentFeel: "要讓淡江學生停滑，不要像公告。",
      dwell: "留白與問句比較容易停。",
      tooReligious: temple,
      tooOld: false,
      tooAi: false,
      fitsTamkang: true,
      suggestions: ["延續這個品牌 DNA，做新的活動", "做成限動", "做成 Carousel"],
    };
  }

  if (fromIg) {
    return {
      content: `學自己 IG 的停留感（${note}）。Hook 與畫面一起看，不要只抄 Caption。`,
      people: "人物當空氣。",
      colors: "跟自己的配色走。",
      lighting: "夜晚與光點。",
      composition: "問句在下三分之一。",
      textRatio: "Caption 不要當海報牆。",
      hierarchy: "先讓學生覺得被看見。",
      brandFeel: "學自己的 IG，不要套一般品牌模板。",
      studentFeel: "問句比社團全名更容易停。",
      dwell: "生活問句開頭比較容易被存。",
      tooReligious: temple,
      tooOld: false,
      tooAi: false,
      fitsTamkang: true,
      suggestions: ["用這個 Hook 再寫一篇", "做成限動", "做成 Carousel"],
    };
  }

  return {
    content: "畫面偏抽象或海報感，需對照是否太宗教。",
    people: "人物不明顯，可留一個空位。",
    colors: "核對霧園／靜水／琥珀。",
    lighting: "光線層級待看。",
    composition: "下三分之一放問句。",
    textRatio: "文字與圖像比例待調。",
    hierarchy: "問句先，時間地點後。",
    brandFeel: "待對品牌記憶。",
    studentFeel: "是否像淡江學生會停？",
    dwell: "問句與光點較容易停留。",
    tooReligious: temple,
    tooOld: false,
    tooAi: false,
    fitsTamkang: !temple,
    suggestions: ["延續這個風格", "做成限動", "做成 Carousel 封面"],
  };
}
