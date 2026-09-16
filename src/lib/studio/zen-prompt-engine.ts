export type ZenVisualDirection = {
  id: "direction-a" | "direction-b" | "direction-c";
  name: string;
  concept: string;
  colorPalette: { name: string; hex: string }[];
  composition: string;
  typography: string;
  imagePrompt: string;
  headline: string;
  subhead: string;
  atmosphere: string;
  aspectRatio: "4:5" | "1:1" | "9:16";
};

export type StudentPerspectiveAudit = {
  willStopScrolling: boolean;
  clearMessage: boolean;
  isTooReligious: boolean;
  isTooFormal: boolean;
  isTooArty: boolean;
  isTooAiFlavored: boolean;
  isTooLong: boolean;
  knowsWhatEventIs: boolean;
  knowsTimeAndPlace: boolean;
  wouldInviteFriend: boolean;
  knowsHowToSignUp: boolean;
  studentScore: number; // 0 - 100
  suggestions: string[];
};

export type MultimodalConversionResult = {
  igPost: {
    headline: string;
    caption: string;
    hashtags: string[];
    cta: string;
  };
  carousel: {
    pages: {
      page: number;
      role: "Hook 封面" | "學生情境" | "內在痛點" | "活動內容與三色光" | "報名 CTA";
      headline: string;
      body: string;
      visualTip: string;
    }[];
  };
  story: {
    cards: {
      step: number;
      title: string;
      interactiveType: "投票" | "提問箱" | "倒數計時" | "連結貼圖";
      copy: string;
      visualGuide: string;
    }[];
  };
  threads: {
    post: string;
  };
  lineMessage: {
    text: string;
  };
  reelsScript: {
    duration: "20s";
    scenes: {
      time: string;
      visual: string;
      subtitle: string;
      voiceover: string;
      audioSuggestion: string;
    }[];
  };
};

export type CreativeWaveContext = {
  topic: string;
  date?: string;
  location?: string;
  studentPain?: string;
  cta?: string;
  details?: string;
};

function topicHints(topic: string) {
  const t = topic.trim();
  const midterm = /期中|考試|報告|deadline/i.test(t);
  const commute = /通勤|克難坡|捷運|紅線/i.test(t);
  const rain = /下雨|雨季|淡水雨/i.test(t);
  const freshman = /新生|迎新|大一|交友|孤單/i.test(t);
  const tea = /茶會|浮游禪光|熱茶/i.test(t);
  return { midterm, commute, rain, freshman, tea, raw: t || "淡江迎新茶會" };
}

export function generateZenVisualDirections(topic: string, details?: string): ZenVisualDirection[] {
  const hints = topicHints(topic);
  const baseTopic = hints.raw;
  const keepClassic = hints.tea || /好好坐下來/.test(baseTopic);
  const subA = details?.trim() || (keepClassic ? "開學第三週 · 淡江活動中心 · 迎新茶會" : `${baseTopic.slice(0, 18)} · 淡江禪學社`);
  const headlineA = keepClassic
    ? "最近是不是\n很久沒有好好坐下來？"
    : hints.midterm
      ? "報告寫到一半\n要不要先深呼吸？"
      : hints.commute
        ? "爬完克難坡\n給自己一杯熱的"
        : hints.rain
          ? "淡水又下雨了\n心也跟著濕答答？"
          : "最近是不是\n很久沒有好好坐下來？";
  const headlineB = keepClassic
    ? "有時候需要的不是答案\n只是一個安靜的晚上"
    : hints.midterm
      ? "分數以外\n你還好嗎"
      : "有時候需要的不是答案\n只是一個安靜的晚上";
  const headlineC = keepClassic
    ? "大學生活很自由\n但你最近真的有快樂嗎？"
    : hints.freshman
      ? "剛到淡水\n還在找自己的角落嗎？"
      : "大學生活很自由\n但你最近真的有快樂嗎？";

  return [
    {
      id: "direction-a",
      name: "方向 A：生活感晨曦暖光（親切日常風）",
      concept: "打破宗教距離感，用淡江大學生最熟悉的『一杯溫暖熱茶＋窗邊微光』切入，像在宿舍或宮燈教室喘口氣。",
      colorPalette: [
        { name: "暖宣紙白", hex: "#F7F6F2" },
        { name: "晨曦暖光", hex: "#D97736" },
        { name: "松竹淡綠", hex: "#4A7C72" },
      ],
      composition: "畫面下半三分之一大留白放置大標題，上半部為手捧冒著熱氣陶杯特寫，背後有柔和晨曦光斑與微縮龜龜插畫。",
      typography: "思源宋體粗體大標，搭配思源黑體簡約副標，字距加寬營造呼吸空氣感。",
      imagePrompt: "A cozy aesthetic photography, hands holding a warm handcrafted ceramic tea cup with gentle steam, soft natural morning sunlight casting warm golden rays, Tamkang University campus blurred background, calm and healing mood, modern Japanese-Taiwanese zen minimalist editorial style, 35mm film photography, 8k resolution, no words, no religious symbols.",
      headline: headlineA,
      subhead: subA,
      atmosphere: "明亮、溫暖、日常生活感、像朋友在身旁陪伴",
      aspectRatio: "4:5",
    },
    {
      id: "direction-b",
      name: "方向 B：淡水夜青微光（心靈安頓風）",
      concept: "結合淡水多雨微涼的夜晚氛圍與『三色光』禪定意象，給被報告與人際壓力壓得喘不過氣的同學一個安靜避風港。",
      colorPalette: [
        { name: "淡水夜青", hex: "#1E3A4C" },
        { name: "三色淡光暈", hex: "#63B3ED" },
        { name: "靜謐深墨", hex: "#1A202C" },
      ],
      composition: "中心微光光暈擴散，微光映照在平靜水面或木質地板，右下角點綴禪學社小龜龜守護者，標題置中對齊。",
      typography: "乾淨簡練的無襯線黑體（Noto Sans TC），局部關鍵字使用暖金亮色強調。",
      imagePrompt: "A serene night scene of Tamkang, dark twilight blue evening sky with gentle rain reflections, a soft subtle glowing floating light sphere illuminating a minimal wooden desk, tranquil aesthetic, meditation peaceful atmosphere, artistic cinematic lighting, minimal 3D soft shadows, deep calming blue and warm light accents, high quality digital photography.",
      headline: headlineB,
      subhead: keepClassic ? "浮游禪光 · 探索屬於你的內在空間" : `${baseTopic.slice(0, 16)} · 給自己一個晚上`,
      atmosphere: "安靜、深邃、專注、整理情緒",
      aspectRatio: "4:5",
    },
    {
      id: "direction-c",
      name: "方向 C：年輕手繪插畫感（幽默減壓風）",
      concept: "社團吉祥物『安靜龜龜』作為主角，生動呈現克難坡爬坡喘氣、選課塞車、捷運人擠人的大學生日常，再自然導流到禪學社。",
      colorPalette: [
        { name: "草坪抹茶綠", hex: "#5B8C5A" },
        { name: "柔和米黃", hex: "#FFFDF5" },
        { name: "活力淡橘", hex: "#ED8936" },
      ],
      composition: "趣味扁平 2.5D 插畫風格，龜龜盤腿坐在課本堆與打瞌睡的日常中，自帶放鬆笑點，留白俐落。",
      typography: "微圓角的可愛手寫黑體，標題大字率高，在 IG Feed 上第一眼停留感強烈。",
      imagePrompt: "Cute whimsical minimal flat vector illustration of a calm tiny zen turtle character sitting peacefully, modern pastel campus life elements, soft mint green and beige warm palette, playful contemporary editorial illustration for university students, joyful and stress-relief vibes, clean layout, no clutter.",
      headline: headlineC,
      subhead: keepClassic ? "爬完克難坡喘口氣 · 來禪學社聊聊天" : "爬完克難坡喘口氣 · 來禪學社坐坐",
      atmosphere: "幽默、親民、校園感、可愛無壓",
      aspectRatio: "1:1",
    },
  ];
}

export function auditStudentPerspective(content: {
  headline: string;
  caption: string;
  cta: string;
  location?: string;
  time?: string;
}): StudentPerspectiveAudit {
  const text = `${content.headline} ${content.caption} ${content.cta}`;
  
  const hasReligiousTerms = /佛法|因果|輪迴|超度|業障|玄學|功德/i.test(text);
  const hasFormalTone = /誠摯邀請您|恭請蒞臨|特此舉辦|惠予支持|不勝感激/i.test(text);
  const hasAiBuzzwords = /深度的靈性之旅|綻放生命的璀璨華章|不容錯過的靈魂盛宴|讓我們攜手共進/i.test(text);
  const isTooLong = text.length > 700;
  
  const knowsTimeAndPlace = Boolean(
    /活動中心|宮燈|教室|B304|草坪|線上|週[一二三四五六日]|點|\d{1,2}:\d{2}|\d{1,2}\/\d{1,2}/.test(text)
  );
  
  const knowsHowToSignUp = Boolean(
    /連結|主頁|私訊|預約|表單|免費|報名|席位|留言/.test(content.cta) ||
    /主頁|簡介|連結|私訊/.test(content.caption)
  );

  const willStopScrolling = content.headline.length > 0 && !content.headline.startsWith("淡江大學禪學社誠摯邀請");

  const suggestions: string[] = [];
  let score = 92;

  if (hasReligiousTerms) {
    score -= 25;
    suggestions.push("⚠️ 出現較艱澀的宗教佛學名詞，建議轉譯為「專注、慢下來、整理情緒、給自己空間」。");
  }
  if (hasFormalTone) {
    score -= 15;
    suggestions.push("⚠️ 語氣略顯公文式或過度正式，建議換成學長姐在校園草坪聊天的口吻。");
  }
  if (hasAiBuzzwords) {
    score -= 15;
    suggestions.push("⚠️ 有些句子帶有 AI 罐頭金句感，建議加入淡江生活感（如克難坡、淡水夕陽、選課壓力）。");
  }
  if (!knowsTimeAndPlace) {
    score -= 10;
    suggestions.push("💡 貼文尚未明確標記時間與地點，學生看了可能不知道哪天要去哪裡。");
  }
  if (!knowsHowToSignUp) {
    score -= 10;
    suggestions.push("💡 請在文末或 CTA 清楚標示「點擊主頁連結」或「IG 私訊報名」。");
  }

  if (suggestions.length === 0) {
    suggestions.push("✅ 非常符合淡江學生生活語感！開頭 Hook 具同理心，無宗教說教感，時間地點與報名指引清楚。");
  }

  return {
    willStopScrolling,
    clearMessage: true,
    isTooReligious: hasReligiousTerms,
    isTooFormal: hasFormalTone,
    isTooArty: false,
    isTooAiFlavored: hasAiBuzzwords,
    isTooLong,
    knowsWhatEventIs: true,
    knowsTimeAndPlace,
    wouldInviteFriend: score >= 80,
    knowsHowToSignUp,
    studentScore: Math.max(20, Math.min(100, score)),
    suggestions,
  };
}

export function convertContentMultimodal(input: {
  topic: string;
  headline: string;
  caption: string;
  date?: string;
  location?: string;
}): MultimodalConversionResult {
  const topic = input.topic || "淡江禪學社活動";
  const headline = input.headline || "最近是不是連休息都覺得有罪惡感？";
  const dateStr = input.date || "09/24 (四) 18:30";
  const locStr = input.location || "淡江活動中心";

  return {
    igPost: {
      headline,
      caption: input.caption || `開學第三週，待辦事項越來越長。\n你需要的不是逼自己更努力，只是需要一個放鬆呼吸的空間。\n\n${topic}\n時間：${dateStr}\n地點：${locStr}\n\n免費報名席次，主頁連結預約中。`,
      hashtags: ["#淡江禪學社", "#淡江大學", "#淡水生活", "#心靈喘息", "#大學日常"],
      cta: "立即點主頁連結預約茶會席位",
    },
    carousel: {
      pages: [
        {
          page: 1,
          role: "Hook 封面",
          headline,
          body: "給在淡水每天趕課、爬克難坡，卻常常覺得心裡很吵的你。",
          visualTip: "深色夜青底配大標題，畫面呼吸留白 50% 以上",
        },
        {
          page: 2,
          role: "學生情境",
          headline: "連躺在床上滑手機\n都在焦慮明天？",
          body: "課表、分組報告、剛認識的朋友。明明很自由，卻比高中時更疲憊。",
          visualTip: "宿舍微光或雨天窗景插畫，引起強烈共鳴",
        },
        {
          page: 3,
          role: "內在痛點",
          headline: "有時候我們需要的\n不是更多建議，只是安靜",
          body: "禪不是高深的學問，而是給自己留一個不需要被評分的空間。",
          visualTip: "手捧熱茶照片，柔和暖光聚焦杯緣",
        },
        {
          page: 4,
          role: "活動內容與三色光",
          headline: "一杯熱茶・三色光靜心\n放鬆聊天",
          body: `不用懂任何佛學名詞，沒有說教。只要帶上你想放空的心情來坐坐。\n${dateStr} @ ${locStr}`,
          visualTip: "簡潔卡片列出時間地點與活動特色亮點",
        },
        {
          page: 5,
          role: "報名 CTA",
          headline: "免費參加\n留一個席位給自己",
          body: "歡迎一人獨處來放鬆，或找室友一起來吹晚風喝茶。\n名額有限，點擊主頁連結即可完成預約。",
          visualTip: "清晰指引主頁連結，附上活動主視覺縮圖",
        },
      ],
    },
    story: {
      cards: [
        {
          step: 1,
          title: "情緒同理問卷",
          interactiveType: "投票",
          copy: "開學第三週了，你最近有好好深呼吸過嗎？\n(A) 每天都好累  (B) 急需放空喘口氣",
          visualGuide: "淡水校園黃昏背景，文字放大置中，中央放置投票貼圖",
        },
        {
          step: 2,
          title: "茶會暖心亮點",
          interactiveType: "提問箱",
          copy: "「浮游禪光」迎新茶會來啦！\n熱茶、三色光靜心、放鬆音樂。你有想問學長姐的問題嗎？",
          visualGuide: "活動現場溫暖氛圍照片，貼提問箱",
        },
        {
          step: 3,
          title: "倒數與預約席位",
          interactiveType: "連結貼圖",
          copy: `距離 09/24 還有幾天！\n席次免費預約中，給自己留一個安定的晚上。`,
          visualGuide: "放上活動日期倒數計時元件與主頁報名連結貼圖",
        },
      ],
    },
    threads: {
      post: `${headline}\n\n以前總以為「禪」是很遠很嚴肅的東西。\n進了淡江禪學社才發現，其實只是一群人在淡水多雨的晚上，聚在一起喝杯熱茶、把腦袋裡亂七八糟的焦慮清空一下。\n\n${dateStr}在活動中心有一場免費迎新茶會，不說教，純放空，留給剛到淡水還在適應的你。\n想來的話連結放留言區。`,
    },
    lineMessage: {
      text: `【淡江禪學社活動通知】🌿\n哈囉！開學最近還好嗎？\n本週四 (${dateStr}) 我們將在 ${locStr} 舉辦「浮游禪光」迎新茶會。\n\n備有溫暖茶飲與專注靜心體驗，完全免費，歡迎帶室友或朋友一起來坐坐！\n預約席位請點表單：https://forms.gle/tamkang-zen-club`,
    },
    reelsScript: {
      duration: "20s",
      scenes: [
        {
          time: "00:00 - 00:03",
          visual: "淡江克難坡爬坡視角、淡水捷運紅線擁擠車廂快剪（節奏快、微焦躁）",
          subtitle: "最近是不是連休息，都覺得很有罪惡感？",
          voiceover: "最近是不是連休息，都覺得很有罪惡感？",
          audioSuggestion: "城市嘈雜聲逐漸過渡到空靈沉靜的風鈴或白噪音",
        },
        {
          time: "00:03 - 00:07",
          visual: "畫面突然切換成慢鏡頭：淡江宮燈教室屋簷下雨滴緩慢落下、茶水注入杯中",
          subtitle: "大學生活很忙，但你有多久沒好好呼吸了？",
          voiceover: "每天趕課、做報告，你有多久沒好好聽自己的聲音了？",
          audioSuggestion: "清脆悠揚的鋼琴單音或木吉他旋律響起",
        },
        {
          time: "00:07 - 00:13",
          visual: "同學們在草坪圍坐、手捧冒煙熱茶、臉上帶著溫暖放鬆的笑容",
          subtitle: "沒有說教、沒有玄學，只有一杯安靜的熱茶",
          voiceover: "在這裡沒有說教，只有一杯溫暖的茶，和三色光的沉靜陪伴。",
          audioSuggestion: "溫暖治癒的環境音樂繼續鋪陳",
        },
        {
          time: "00:13 - 00:17",
          visual: "淡水夜景遠眺、微光光暈緩緩擴散，特寫安靜閉目深呼吸的神情",
          subtitle: "給自己留一個不需要被評分的角落",
          voiceover: "09/24 週四晚上，浮游禪光迎新茶會。",
          audioSuggestion: "音樂達到高潮後溫柔收尾",
        },
        {
          time: "00:17 - 00:20",
          visual: "字卡出現：09/24 18:30 淡江活動中心 免費席位，指引個人主頁簡介",
          subtitle: "點主頁連結預約席位｜淡江大學禪學社",
          voiceover: "點主頁連結，預約你的安靜夜晚。",
          audioSuggestion: "餘音漸弱",
        },
      ],
    },
  };
}

export type LocalCreativeWave = {
  directions: ZenVisualDirection[];
  conversion: MultimodalConversionResult;
  audit: StudentPerspectiveAudit;
};

export function buildLocalCreativeWave(ctx: CreativeWaveContext): LocalCreativeWave {
  const topic = ctx.topic.trim() || "淡江禪學社活動";
  const details = [ctx.date, ctx.location, ctx.studentPain, ctx.cta, ctx.details].filter(Boolean).join(" · ");
  const directions = generateZenVisualDirections(topic, details || undefined);
  const selected = directions[0];
  const conversion = convertContentMultimodal({
    topic,
    headline: selected.headline,
    caption: "",
    date: ctx.date,
    location: ctx.location,
  });
  if (ctx.cta) conversion.igPost.cta = ctx.cta;
  const audit = auditStudentPerspective({
    headline: selected.headline,
    caption: conversion.igPost.caption,
    cta: conversion.igPost.cta,
    location: ctx.location,
    time: ctx.date,
  });
  return { directions, conversion, audit };
}
