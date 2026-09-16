import { VISUAL_ANCHORS } from "../zen/club.ts";

export type LocalVisionInput = {
  name?: string;
  category?: string;
  tags?: string[];
  licenseNotes?: string;
  question?: string;
  source?: string;
};

export type LocalImageAnalysis = {
  summary: string;
  content: string;
  people: string;
  color: string;
  light: string;
  composition: string;
  textRatio: string;
  hierarchy: string;
  brandFit: string;
  studentFit: string;
  stopPower: string;
  tooReligious: boolean;
  tooOld: boolean;
  tooAi: boolean;
  fitsTku: boolean;
  nextSteps: string[];
  stylePrompt: string;
  captionIdea: string;
};

type Scene =
  | "dusk"
  | "window"
  | "night"
  | "logo"
  | "mascot"
  | "photo"
  | "people"
  | "poster"
  | "background"
  | "generic";

const RELIGIOUS = ["蓮花", "佛像", "金身", "燒香", "寺廟", "法會", "菩薩", "如來", "木魚", "袈裟", "雲霧仙氣"];
const OLD = ["書法", "篆刻", "水墨", "對聯", "古風", "楷書"];
const AI_TELLS = ["對稱光暈", "超寫實人像", "AI生成", "AI 生成", "金光大光暈"];

const ANCHOR = `${VISUAL_ANCHORS.mood} no text, no religious symbols`;

function blobOf(input: LocalVisionInput): string {
  return [input.name, input.category, input.source, input.licenseNotes, input.question, ...(input.tags ?? [])]
    .filter(Boolean)
    .join(" ");
}

function detectScene(input: LocalVisionInput): Scene {
  const blob = blobOf(input);
  if (input.category === "logo" || /三色光|標誌/.test(blob)) return "logo";
  if (input.category === "mascot" || blob.includes("龜龜")) return "mascot";
  if (/傍晚|夕陽|淡水河/.test(blob)) return "dusk";
  if (/窗邊|坐墊/.test(blob)) return "window";
  if (/夜燈|宿舍/.test(blob) || (input.category === "campus" && /夜/.test(blob))) return "night";
  if (input.category === "people") return "people";
  if (input.category === "poster") return "poster";
  if (input.category === "background") return "background";
  if (input.category === "photo") return "photo";
  if (input.category === "campus") return "dusk";
  return "generic";
}

function readFlags(input: LocalVisionInput, scene: Scene) {
  const blob = blobOf(input);
  const tooReligious = RELIGIOUS.some((word) => blob.includes(word));
  const tooOld = OLD.some((word) => blob.includes(word));
  const tooAi = input.source === "generated" || AI_TELLS.some((word) => blob.includes(word));
  const namedFit = /淡江|淡水|克難坡|宿舍|校園|社課|窗邊|坐墊|龜龜|三色光/.test(blob);
  const categoryFit = ["campus", "photo", "people", "mascot", "logo", "background"].includes(input.category ?? "");
  const fitsTku = !tooReligious && !tooOld && (namedFit || categoryFit || scene !== "generic");
  return { tooReligious, tooOld, tooAi, fitsTku };
}

const MAKE_NEXT = ["做成貼文", "做成 1:1", "做成限動", "做成輪播", "做成 Reels 封面", "用這張寫文案"];

function sceneDraft(
  scene: Scene,
  input: LocalVisionInput,
  verdict: ReturnType<typeof readFlags>,
): LocalImageAnalysis {
  const title = input.name?.trim() || "這張圖";

  if (scene === "dusk") {
    return {
      summary: `「${title}」是淡水地方感底圖。本機規則依名稱與分類判斷，沒有真的看像素。`,
      content: "河邊黃昏、暖色天空，沒有人物。適合當主視覺或壓字底。",
      people: "沒有",
      color: "曦光與夜光漸層，紙白可壓字",
      light: "傍晚自然光，暖而不金",
      composition: "滿版風景，下三分之一留給標題",
      textRatio: "目前是底圖，還沒壓字",
      hierarchy: "風景當主體，文字另外疊在下方",
      brandFit: "符合三色光的暖夜感，不像宗教場所。",
      studentFit: "像放學走去捷運站時會看到的淡水，適合淡江學生。",
      stopPower: "地方感強，學生會停一下。",
      ...verdict,
      nextSteps: ["當成主視覺", ...MAKE_NEXT],
      stylePrompt: `Tamsui riverside at dusk seen from a campus slope, warm amber sky fading into blue, distant ferry lights, quiet and wide, cinematic photo, ${ANCHOR}`,
      captionIdea: "走上坡的時候，你通常在想什麼？",
    };
  }

  if (scene === "window") {
    return {
      summary: `「${title}」是社課現場感的白天底圖。本機規則依名稱與分類判斷，沒有真的看像素。`,
      content: "窗邊光、坐墊、木頭地板，看起來像教室一角而不是道場。",
      people: "沒有露臉，頂多是坐下來的暗示",
      color: "紙白、澄光、木頭與米色",
      light: "白天窗邊柔光",
      composition: "主體偏一側，留白給標題與流程",
      textRatio: "目前是底圖，還沒壓字",
      hierarchy: "現場物件在前，文字要另外疊",
      brandFit: "像社團現場，不像宗教場所。",
      studentFit: "第一次來的人看了會覺得「原來是這樣的教室」。",
      stopPower: "現場感清楚，適合體驗與社課宣傳。",
      ...verdict,
      nextSteps: ["當成社課主視覺", ...MAKE_NEXT],
      stylePrompt: `sunlit corner of a university classroom, meditation cushions on wooden floor, soft daylight through window blinds, warm neutral palette, documentary photo, ${ANCHOR}`,
      captionIdea: "坐下來，然後什麼都不用做。",
    };
  }

  if (scene === "night") {
    return {
      summary: `「${title}」是宿舍夜晚的情緒底圖。本機規則依名稱與分類判斷，沒有真的看像素。`,
      content: "書桌、暖燈、夜色，像一個人還沒睡的房間。",
      people: "沒有",
      color: "夜光為主、曦光作點光",
      light: "單盞暖燈，不打硬光",
      composition: "上半留給夜色，下方可放一句話",
      textRatio: "目前是底圖，還沒壓字",
      hierarchy: "燈光是視線焦點",
      brandFit: "夜晚情緒，不是金光或仙氣。",
      studentFit: "期末或睡不著的晚上，淡江學生很容易對上。",
      stopPower: "情緒鉤強，適合晚上發。",
      ...verdict,
      nextSteps: ["當成情緒主視覺", ...MAKE_NEXT],
      stylePrompt: `dim dorm desk at night lit by a single warm lamp, notebook and a mug, deep indigo shadows, soft glow, muted film photo, ${ANCHOR}`,
      captionIdea: "有時候需要的，只是一個安靜的晚上。",
    };
  }

  if (scene === "logo") {
    return {
      summary: `「${title}」是品牌標誌。本機規則把它當蓋章，不適合成滿版主視覺。`,
      content: "三色光標誌或變體，適合角落與片尾。",
      people: "沒有",
      color: "曦光、澄光、夜光",
      light: "標誌本身就是光",
      composition: "置中或角落小標，不要拉滿版",
      textRatio: "標誌不是內文",
      hierarchy: "當署名，不要當風景",
      brandFit: "這就是社團識別。",
      studentFit: "認識的人看得到是禪學社；第一次來的人需要配一張現場照片。",
      stopPower: "單獨發標誌，學生通常會滑過去。",
      ...verdict,
      nextSteps: ["放到畫面當標誌，不要當主視覺", "配一張淡水或窗邊照片當底", "用在限動貼紙或倒數"],
      stylePrompt: `simple three-light emblem on warm paper, amber teal indigo glow, generous negative space, ${ANCHOR}`,
      captionIdea: "坐下來，就是開始。",
    };
  }

  if (scene === "mascot") {
    return {
      summary: `「${title}」是龜龜。本機規則把它當輕鬆內容的角色，不當嚴肅主視覺。`,
      content: "圓潤小烏龜，殼上有柔光，表情放鬆。",
      people: "沒有，是吉祥物",
      color: "綠殼配三色光",
      light: "柔、不催促",
      composition: "角色置中或偏下，留白給一句幹話",
      textRatio: "角色旁邊可以放很短的一句",
      hierarchy: "龜龜是主角，標誌當署名",
      brandFit: "輕鬆、慢、不說教。",
      studentFit: "適合限動、倒數、Q&A；正式海報只留殼上的光就好。",
      stopPower: "可愛會停，但不要拿來當講座主視覺。",
      ...verdict,
      nextSteps: ["放到限動或倒數", "配一句龜龜也不想動", "正式主視覺改用淡水或窗邊照片"],
      stylePrompt: `round green turtle mascot with three soft lights on its shell, relaxed expression, warm paper background, ${ANCHOR}`,
      captionIdea: "龜龜今天也不想動，但牠說這叫坐一下。",
    };
  }

  if (scene === "people") {
    return {
      summary: `「${title}」是社員現場。本機規則依分類判斷，沒有真的看像素。`,
      content: "人、手、或坐下來的側影，避免擺拍笑臉。",
      people: "有人，優先側臉或手，不要正對鏡頭",
      color: "現場自然色，紙白可壓字",
      light: "現場光，不要補閃光",
      composition: "人在一側，留白給標題",
      textRatio: "照片為主，字少",
      hierarchy: "人的狀態先被看見，活動資訊其次",
      brandFit: "真人現場比海報更像這個社團。",
      studentFit: "同儕畫面最容易讓人覺得「我也可以去」。",
      stopPower: "有人的狀態通常比風景更能停。",
      ...verdict,
      nextSteps: ["做成限動", "做成輪播第二頁", "用這張寫文案"],
      stylePrompt: `candid side profile of a university student sitting on a cushion, soft window light, no posed smile, documentary photo, ${ANCHOR}`,
      captionIdea: "第一次來的時候也覺得很尬，坐十分鐘就好了。",
    };
  }

  if (scene === "poster") {
    return {
      summary: `「${title}」是海報／文宣。本機規則依分類與標籤判斷，沒有真的看像素。`,
      content: "歷屆主視覺或印刷品，可能已有標題與時間地點。",
      people: "依原海報，本機看不到",
      color: "沿用原海報，注意是不是太金、太墨",
      light: "依原海報",
      composition: "已有層級；若字太多，重做時要留白",
      textRatio: "海報通常字偏多，IG 上要再收",
      hierarchy: "先看第一句能不能讓學生停下來",
      brandFit: verdict.tooReligious ? "宗教符號偏多，不建議直接當今年主視覺。" : "可當品牌記憶，新內容不要原封不動重發。",
      studentFit: verdict.tooOld ? "偏老氣，淡江學生可能覺得這不是給他們的。" : "可延續風格，但文案要換成現在的學生語氣。",
      stopPower: "舊海報直接重發，停留感通常不好。",
      ...verdict,
      nextSteps: ["延續這個風格重做", "只留畫面、文案重寫", "做成輪播把字拆開"],
      stylePrompt: `quiet university poster layout on warm paper, generous negative space, serif headline, documentary campus photo, ${ANCHOR}`,
      captionIdea: "不用準備好才能來。",
    };
  }

  if (scene === "background") {
    return {
      summary: `「${title}」是可壓字的場景底。本機規則依分類判斷，沒有真的看像素。`,
      content: "材質、留白、光影，本身不是訊息。",
      people: "沒有",
      color: "紙白或低飽和，方便壓字",
      light: "柔、平均",
      composition: "大面留白給標題",
      textRatio: "底圖應接近無字",
      hierarchy: "文字才是主層級",
      brandFit: "適合當畫布底，不要單獨發。",
      studentFit: "配上一句學生會停下來的話才有用。",
      stopPower: "沒有字的底圖，IG 上幾乎不會停。",
      ...verdict,
      nextSteps: ["放到畫布當底", "壓一句 hook 再發", "做成限動封面"],
      stylePrompt: `airy textured paper background, soft window light, warm neutral, lots of negative space for type, ${ANCHOR}`,
      captionIdea: "先坐一下再說。",
    };
  }

  if (scene === "photo") {
    return {
      summary: `「${title}」是活動照片。本機規則依分類與標籤判斷，沒有真的看像素。`,
      content: "社課、茶會或現場紀實，優先真實、不要擺拍。",
      people: "可能有人，避免正對鏡頭的宣傳照",
      color: "現場色，不要高飽和濾鏡",
      light: "現場光",
      composition: "主體清楚，四周留一點空氣",
      textRatio: "照片為主",
      hierarchy: "現場先被看見",
      brandFit: "紀實比海報更接近社團實際樣子。",
      studentFit: "看起來像同學的活動，不是外面的禪修中心。",
      stopPower: "真實現場通常比模板海報更能停。",
      ...verdict,
      nextSteps: MAKE_NEXT,
      stylePrompt: `candid documentary photo of a quiet student club gathering, cushions and warm daylight, unposed, ${ANCHOR}`,
      captionIdea: "不用盤腿，不用信什麼，來就好。",
    };
  }

  return {
    summary: input.name
      ? `「${title}」還沒對上熟悉的場景。本機規則依名稱與分類判斷，沒有真的看像素。`
      : "這張圖還沒有素材名稱或分類。本機規則看的是標籤，沒有真的看像素。",
    content: "還沒標畫面內容。標成淡水／校園或活動照片之後會準很多。",
    people: "本機看不到",
    color: "未知",
    light: "未知",
    composition: "未知",
    textRatio: "未知",
    hierarchy: "未知",
    brandFit: "沒有標籤時，不敢說跟品牌近不近。",
    studentFit: "沒有名稱與分類時，本機規則無法確認這像淡江學生的生活。",
    stopPower: "還不知道。有線上模型時會真的看圖。",
    ...verdict,
    nextSteps: ["先在素材庫標分類", "做成限動試試", "有線上模型時再按 AI 分析"],
    stylePrompt: `quiet Tamkang campus corner, warm paper light, airy negative space, documentary photo, ${ANCHOR}`,
    captionIdea: "最近是不是連休息都覺得有罪惡感？",
  };
}

/**
 * 沒有圖片理解服務時的本機規則。
 * 依名稱、分類、標籤、權利說明判斷，不假裝看過像素，也不生假圖。
 */
export function localImageAnalysis(input: LocalVisionInput): LocalImageAnalysis {
  const scene = detectScene(input);
  const verdict = readFlags(input, scene);
  const draft = sceneDraft(scene, input, verdict);
  if (input.question?.trim()) {
    draft.summary = `${draft.summary} 你想知道：${input.question.trim()}`;
  }
  return draft;
}
