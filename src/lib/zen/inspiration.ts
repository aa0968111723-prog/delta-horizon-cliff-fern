import { seasonContext, type SeasonBeat } from "./season.ts";

export type InspirationSeed = {
  id: string;
  watch: string;
  composition: string;
  palette: string;
  layout: string;
  hookShape: string;
  form: string;
  zenClub: {
    title: string;
    hook: string;
    visual: string;
    why: string;
  };
};

export const INSPIRATION_SEEDS: InspirationSeed[] = [
  {
    id: "campus-night-carousel",
    watch: "大學生社群：夜晚校園 Carousel",
    composition: "封面只有一句生活話，活動名放到第 3 頁",
    palette: "低飽和夜色 + 一點暖燈",
    layout: "上半畫面、下半短句，資訊不進封面",
    hookShape: "問句，像在講課表與疲勞",
    form: "Carousel 6 頁：Hook → 情境 → 痛點 → 內容 → CTA → 收束",
    zenClub: {
      title: "開學後的晚上",
      hook: "最近是不是連休息都覺得有罪惡感？",
      visual: "淡水校園夜色，燈很遠，人很小",
      why: "學生會停是因為被說中，不是因為海報完整。",
    },
  },
  {
    id: "reels-cover-face",
    watch: "校園 Reels Cover：側臉 + 一行字",
    composition: "臉在上 1/2，字在下，不要滿版 Logo",
    palette: "皮膚暖光對上暮藍",
    layout: "垂直 9:16，字少到可以一秒讀完",
    hookShape: "口語、不工整",
    form: "Reels Cover → 0–3 秒同句旁白",
    zenClub: {
      title: "先被看見的臉",
      hook: "大學生活很自由，但你最近真的有比較快樂嗎？",
      visual: "同學側臉、淡水風，龜龜不要搶戲",
      why: "封面不是招生海報。先讓人覺得這篇在講我。",
    },
  },
  {
    id: "poster-to-story",
    watch: "活動海報改成限動節奏",
    composition: "海報資訊拆成 4 張，一張一件事",
    palette: "沿用原海報主色，但提高留白",
    layout: "Story 安全區，底部 CTA",
    hookShape: "第一張沒有時間地點",
    form: "3–5 張 Story：感覺 → 畫面 → 內容 → 時間地點 → 找朋友",
    zenClub: {
      title: "舊海報變限動",
      hook: "有時候我們需要的不是答案，只是一個安靜的晚上。",
      visual: "沿用三色光，拿掉廟宇符號",
      why: "歷屆海報可以當 DNA，不要整張重貼到 IG。",
    },
  },
  {
    id: "tea-friends",
    watch: "社團茶會：互動照片當主視覺",
    composition: "手、杯子、沒看鏡頭的人",
    palette: "木色、茶、暖燈",
    layout: "照片滿版，字壓在最安靜的一角",
    hookShape: "邀請變得很小，生活很大",
    form: "單張 IG + Threads 短句",
    zenClub: {
      title: "茶會不是考試",
      hook: "來坐一下，不用先懂禪。",
      visual: "晚上茶會的手與燈，淡江學生",
      why: "招生感一重，IG 就會變成一直在找人。",
    },
  },
];

export function abstractInspiration(seed: InspirationSeed) {
  return {
    composition: seed.composition,
    palette: seed.palette,
    layout: seed.layout,
    hook: seed.hookShape,
    form: seed.form,
  };
}

const SEASON_BEATS: Record<
  SeasonBeat,
  { title: string; hook: string; visual: string; composition: string; palette: string; layout: string; hookShape: string; form: string }
> = {
  orientation: {
    title: "開學季的第一個晚上",
    hook: "剛到淡水的人，通常還沒找到可以坐下的地方。",
    visual: "淡水斜坡黃昏、還沒拆完的行李、遠一點的燈",
    composition: "人很小、路很長，封面只有生活句",
    palette: "暮藍加一點暖窗光",
    layout: "上半風景、下半短句，活動名不進封面",
    hookShape: "講剛到淡水，不講社團章程",
    form: "Carousel：生活 → 課表 → 找地方坐 → 茶會 → 時間地點",
  },
  settling: {
    title: "課表開始固定之後",
    hook: "最近是不是很久沒有好好坐下來？",
    visual: "校園夜色、同學側臉、茶",
    composition: "留白多、字少",
    palette: "低飽和夜色",
    layout: "一句 Hook 壓在最安靜的角落",
    hookShape: "問句，像在講疲勞而不是活動",
    form: "單張 IG + Story 三張",
  },
  midterm: {
    title: "期中前後的出口",
    hook: "最近是不是連休息都覺得有罪惡感？",
    visual: "圖書館燈、宿舍桌、短的夜",
    composition: "不要海報資訊牆",
    palette: "冷一點的墨藍，暖燈只留一點",
    layout: "極短字、大留白",
    hookShape: "先承認累，再給一個晚上",
    form: "Story 互動 + 短 Caption，不要連續招生",
  },
  "after-midterm": {
    title: "學期過半還在的人",
    hook: "有些人開始從社團消失，你還好嗎？",
    visual: "熟面孔、茶、龜龜不要搶戲",
    composition: "社員故事，不是招生海報",
    palette: "木色與苔綠",
    layout: "照片滿版，字很少",
    hookShape: "對還在的人說話",
    form: "社員故事 → 日常 → 下一次茶會",
  },
  finals: {
    title: "撐完之前",
    hook: "這個晚上不用產出任何東西。",
    visual: "短、暗、具體的一盞燈",
    composition: "一行字就能讀完",
    palette: "深墨與一點暖光",
    layout: "9:16，底部才放時間",
    hookShape: "極短，不要詩意堆疊",
    form: "Story 或 Reels Cover，15 秒內講完",
  },
  break: {
    title: "人離開淡水之後",
    hook: "你已經不在淡水了，可是晚上還是會想起那盞燈。",
    visual: "河岸回顧、舊照片、預告",
    composition: "回顧大於招生",
    palette: "褪色的暖色",
    layout: "舊照片 + 一句話",
    hookShape: "想念，不是招新",
    form: "回顧 Carousel → 下學期預告",
  },
  summer: {
    title: "暑假還在的人",
    hook: "淡水變空的時候，其實也還可以坐一下。",
    visual: "河風、空一點的校園",
    composition: "生活感，不要空教室海報",
    palette: "午後熱、晚上涼",
    layout: "風景大、字小",
    hookShape: "給還在淡水的人",
    form: "生活單張 + 預告下學期",
  },
};

export function seasonInspiration(now = new Date()): InspirationSeed {
  const season = seasonContext(now);
  const beat = SEASON_BEATS[season.beat];
  return {
    id: `season-${season.beat}`,
    watch: `${season.label} · 淡江學生現在`,
    composition: beat.composition,
    palette: beat.palette,
    layout: beat.layout,
    hookShape: beat.hookShape,
    form: beat.form,
    zenClub: {
      title: beat.title,
      hook: beat.hook,
      visual: `${season.weather} ${beat.visual}`,
      why: `${season.studentNow} ${season.contentHint}`,
    },
  };
}

export function inspirationFeed(now = new Date()): InspirationSeed[] {
  const live = seasonInspiration(now);
  return [live, ...INSPIRATION_SEEDS];
}

export function withResearch(feed: InspirationSeed[], researched: InspirationSeed[]) {
  const seen = new Set(feed.map((seed) => seed.id));
  return [...researched.filter((seed) => !seen.has(seed.id)), ...feed];
}

type ResearchRow = {
  title: string;
  hook: string;
  visual: string;
  composition: string;
  palette: string;
  layout: string;
  hookShape: string;
  form: string;
};

const RESEARCH: Record<SeasonBeat, ResearchRow[]> = {
  orientation: [
    {
      title: "宿舍燈還亮著",
      hook: "有人晚上其實只是還沒找到可以去的地方。",
      visual: "宿舍走廊暖燈、行李、沒看鏡頭的人",
      composition: "人在畫面邊角，路比較長",
      palette: "暖窗光對上走廊暗",
      layout: "封面只有生活句，社團名放到後面",
      hookShape: "講還沒有地方，不講招新",
      form: "單張 IG：生活句 → 內文才出現茶會",
    },
    {
      title: "淡水站走出來",
      hook: "捷運門打開的時候，風比你想的大。",
      visual: "淡水捷運出口、斜坡、黃昏",
      composition: "風景大、人小",
      palette: "河風藍、一點暖黃",
      layout: "上半風景下半短句",
      hookShape: "用抵達淡水當入口",
      form: "Carousel：抵達 → 不熟 → 可以坐的晚上 → 時間地點",
    },
    {
      title: "還沒有人一起吃飯",
      hook: "大學很自由，可是晚餐要找誰？",
      visual: "校園黃昏、空一點的座位",
      composition: "留白，不要迎新海報牆",
      palette: "暮色、淺沙",
      layout: "一句問句壓在安靜的角落",
      hookShape: "人際，不是禪學名詞",
      form: "Story 三張：問句 → 不用先懂 → 找一個朋友",
    },
  ],
  settling: [
    {
      title: "課表空一格",
      hook: "週三晚上那一格，你通常拿去滑手機。",
      visual: "課表截圖感不要有，改成夜色座位",
      composition: "生活物件靠近，活動資訊遠離",
      palette: "苔綠、暖燈",
      layout: "字少到可以一秒讀完",
      hookShape: "講空檔，再講可以坐",
      form: "IG 單張 + Threads 短句",
    },
    {
      title: "各自的小圈",
      hook: "大家好像都有自己的人了。",
      visual: "兩三個人側坐，不要團體大合照",
      composition: "側臉、手、杯子",
      palette: "木色、茶",
      layout: "照片滿版，字在最安靜一角",
      hookShape: "承認孤單，不要勵志",
      form: "社員故事單張，不要招生 CTA 太大",
    },
    {
      title: "淡水開始變涼",
      hook: "風變涼的那幾天，其實很適合什麼都不做。",
      visual: "河岸夜色、遠燈",
      composition: "大留白、燈在遠處",
      palette: "暮藍、一點暖光",
      layout: "Hook 很大，活動名很小",
      hookShape: "天氣當入口",
      form: "Carousel 封面是天氣，不是海報",
    },
  ],
  midterm: [
    {
      title: "座位像被訂走",
      hook: "圖書館沒位的時候，你還能去哪裡發呆？",
      visual: "桌燈、筆記合上、不是教室空拍",
      composition: "近景物件，不要校園宣傳圖",
      palette: "冷墨藍、一點暖燈",
      layout: "極短字",
      hookShape: "先講累，再給晚上",
      form: "Story：累 → 不用產出 → 時間",
    },
    {
      title: "休息像偷來的",
      hook: "最近是不是連休息都要找理由？",
      visual: "短的夜、一盞燈",
      composition: "一行字就能讀完",
      palette: "深、暖、少色",
      layout: "9:16 安全區",
      hookShape: "罪惡感，不要說教",
      form: "Reels Cover 0–3 秒同一句",
    },
    {
      title: "群組一直跳",
      hook: "報告群組沒停過的那週，晚上其實可以關掉。",
      visual: "手機螢幕不要截圖，改成收起來的螢幕光",
      composition: "生活感，不要資訊牆",
      palette: "暗、螢幕微光",
      layout: "字少、對比柔",
      hookShape: "具體的煩，不是抽象壓力",
      form: "限動投票：今晚想坐一下 / 想先睡覺",
    },
  ],
  "after-midterm": [
    {
      title: "有人開始消失",
      hook: "學期過半，有些人就比較少出現了。",
      visual: "熟面孔、茶、不要大合照",
      composition: "近、暖、人少",
      palette: "木色、苔綠",
      layout: "照片滿版",
      hookShape: "對還在的人說話",
      form: "社員故事 → 日常",
    },
    {
      title: "還在的晚上",
      hook: "沒有消失的人，其實也需要被看到。",
      visual: "側坐、燈、龜龜不要搶戲",
      composition: "人為主，品牌很小",
      palette: "暖光",
      layout: "一句話就好",
      hookShape: "陪伴，不是招新",
      form: "單張 IG，CTA 放很小",
    },
    {
      title: "下次還可以來",
      hook: "你缺席過也沒關係，位子還在。",
      visual: "空一點的座位、茶",
      composition: "留白當邀請",
      palette: "沙色、暖",
      layout: "下半才放時間",
      hookShape: "允許缺席",
      form: "Carousel：還在 → 缺席也可以 → 下次時間",
    },
  ],
  finals: [
    {
      title: "撐完之前",
      hook: "這個晚上不用產出任何東西。",
      visual: "一盞燈、短夜",
      composition: "一行字",
      palette: "深墨、一點暖",
      layout: "9:16，底部才放時間",
      hookShape: "極短",
      form: "Story 或 Reels Cover",
    },
    {
      title: "交出去以後",
      hook: "報告交出去的那天晚上，其實可以什麼都不做。",
      visual: "合上的筆電、窗外",
      composition: "近景、安靜",
      palette: "冷一點",
      layout: "字極少",
      hookShape: "具體的交完",
      form: "單張生活向，不要考試文案腔",
    },
    {
      title: "短的出口",
      hook: "只要一個晚上就好，不是要你突然變自律。",
      visual: "坐著的人、燈",
      composition: "人小燈遠",
      palette: "夜藍",
      layout: "封面無資訊",
      hookShape: "降低門檻",
      form: "限動三張",
    },
  ],
  break: [
    {
      title: "人離開淡水",
      hook: "你已經不在淡水了，可是晚上還是會想起那盞燈。",
      visual: "河岸舊照片、褪色暖色",
      composition: "回顧大於招生",
      palette: "褪色暖",
      layout: "舊照片 + 一句話",
      hookShape: "想念",
      form: "回顧 Carousel",
    },
    {
      title: "假期的位子",
      hook: "放假以後，還有人會把晚上空下來嗎？",
      visual: "空一點的淡水",
      composition: "風景、少人",
      palette: "午後",
      layout: "字小",
      hookShape: "問還在的人",
      form: "生活單張",
    },
    {
      title: "下學期預告",
      hook: "下學期回來的第一個晚上，還可以坐一下。",
      visual: "舊現場光、不要課程表",
      composition: "預告但不要招生牆",
      palette: "暖、沙",
      layout: "時間放最後一頁",
      hookShape: "回來，不是招新",
      form: "Carousel 回顧 → 預告",
    },
  ],
  summer: [
    {
      title: "淡水變空",
      hook: "淡水變空的時候，其實也還可以坐一下。",
      visual: "河風、空校園",
      composition: "生活感",
      palette: "午後熱、晚上涼",
      layout: "風景大、字小",
      hookShape: "給還在淡水的人",
      form: "生活單張 + 預告",
    },
    {
      title: "暑假晚上",
      hook: "暑假的晚上比較長，可是也不一定比較安。",
      visual: "長黃昏、河",
      composition: "橫向留白",
      palette: "橘轉藍",
      layout: "一句話",
      hookShape: "長夜，不是營隊廣告",
      form: "Reels Cover",
    },
    {
      title: "還在的少數",
      hook: "沒回家的人，其實更需要一個可以出現的地方。",
      visual: "小桌、茶、少人",
      composition: "近、暖",
      palette: "木、暖燈",
      layout: "照片滿版",
      hookShape: "少數人，不是熱閙",
      form: "社員故事",
    },
  ],
};

export function campusResearch(now = new Date()): InspirationSeed[] {
  const season = seasonContext(now);
  return RESEARCH[season.beat].map((row, index) => ({
    id: `research-${season.beat}-${index + 1}`,
    watch: `大學生社群研究 · ${season.label}`,
    composition: row.composition,
    palette: row.palette,
    layout: row.layout,
    hookShape: row.hookShape,
    form: row.form,
    zenClub: {
      title: row.title,
      hook: row.hook,
      visual: `${season.weather}。${row.visual}`,
      why: `不要抄別人帳號。只把構圖、配色、Hook 形狀轉成淡江禪學社。${season.contentHint}`,
    },
  }));
}

export function parseResearchSeeds(raw: unknown, beat: SeasonBeat, now = new Date()): InspirationSeed[] {
  const season = seasonContext(now);
  const rows = Array.isArray(raw) ? raw : raw && typeof raw === "object" && "items" in raw ? (raw as { items: unknown }).items : [];
  if (!Array.isArray(rows) || rows.length === 0) return campusResearch(now);
  return rows.slice(0, 3).map((item, index) => {
    const row = item && typeof item === "object" ? (item as Record<string, unknown>) : {};
    const text = (key: string, fallback: string) => {
      const value = row[key];
      return typeof value === "string" && value.trim() ? value.trim().slice(0, 180) : fallback;
    };
    const local = campusResearch(now)[index];
    const hook = text("hook", local?.zenClub.hook ?? "最近是不是很久沒有好好坐下來？");
    return {
      id: `research-live-${beat}-${index + 1}`,
      watch: `大學生社群研究 · ${season.label}`,
      composition: text("composition", local?.composition ?? "留白、字少"),
      palette: text("palette", local?.palette ?? "暮藍、暖光"),
      layout: text("layout", local?.layout ?? "封面只有一句"),
      hookShape: text("hookShape", local?.hookShape ?? "問句"),
      form: text("form", local?.form ?? "Carousel"),
      zenClub: {
        title: text("title", local?.zenClub.title ?? "這一季"),
        hook: hook.includes("誠摯邀請") ? local?.zenClub.hook ?? "最近是不是很久沒有好好坐下來？" : hook,
        visual: text("visual", local?.zenClub.visual ?? "淡水夜色"),
        why: text("why", local?.zenClub.why ?? "不要抄，轉成自己的。"),
      },
    };
  });
}

export function kindFromInspiration(seed: InspirationSeed) {
  const blob = `${seed.form} ${seed.zenClub.title} ${seed.watch}`;
  if (/Reels/i.test(blob)) return "reels";
  if (/Story|限動/.test(blob)) return "story";
  if (/Carousel/i.test(blob)) return "carousel";
  return "emotion";
}

export function inspirationCreateNotes(seed: InspirationSeed) {
  const abs = abstractInspiration(seed);
  return [
    `研究抽象（不要抄別人作品）：構圖 ${abs.composition}；配色 ${abs.palette}；排版 ${abs.layout}；Hook 形狀 ${abs.hook}；形式 ${abs.form}`,
    `轉成淡江禪學社：${seed.zenClub.visual}`,
    seed.zenClub.why,
  ].join("\n");
}
