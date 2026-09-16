export type IgPostHistoryItem = {
  id: string;
  shortcode: string;
  mediaType: "IMAGE" | "CAROUSEL_ALBUM" | "VIDEO";
  mediaUrl: string;
  caption: string;
  postedAt: string;
  likeCount: number;
  commentCount: number;
  saveCount: number;
  shareCount: number;
  reach: number;
  topFeedback: string;
  aiDiagnosis: {
    hookStrength: "高" | "中" | "優";
    hookAnalysis: string;
    visualStyle: string;
    captionPacing: string;
    studentFeedback: string;
    nextImprovement: string;
  };
};

export const IG_HISTORY_SEED: IgPostHistoryItem[] = [
  {
    id: "ig_hist_001",
    shortcode: "C9m2XkP",
    mediaType: "CAROUSEL_ALBUM",
    mediaUrl: "/seed/beans.jpg",
    caption: `「有時候我們需要的不是答案，只是一個安靜的晚上。」\n\n走在淡江克難坡上，風很大，心很急。\n每天都在跟時間賽跑，深怕少修一門課、少參加一個局，就落後了誰。\n\n其實，你已經做得夠好了。\n\n今晚給自己 10 分鐘，放下手機，閉上眼睛深呼吸三次。\n感受心慢慢靜下來的感覺。\n\n淡江禪學社 伴你在淡水的生活裡，找到安定的自己。`,
    postedAt: "2025-11-12",
    likeCount: 342,
    commentCount: 28,
    saveCount: 389,
    shareCount: 142,
    reach: 4890,
    topFeedback: "收藏數破紀錄！淡江大二、大三學生對學業與未來迷惘的共鳴極高，轉發到限動率大幅提升。",
    aiDiagnosis: {
      hookStrength: "優",
      hookAnalysis: "第一句金句直擊大學生內在焦慮，無任何社團招生推銷感，讓人停留在 Feed 閱讀。",
      visualStyle: "深色夜景調色加上大面積留白，文字清晰好讀，符合無印簡約沉靜感。",
      captionPacing: "段落短、分行乾淨，每段只有 1-2 句話，在手機螢幕上極具呼吸感。",
      studentFeedback: "「真的被講中了，剛下課看到這篇差點在公車上哭出來。」",
      nextImprovement: "下一次可在最後一頁順暢加入茶會或日常社課的時間指引，轉化報名率更佳。",
    },
  },
  {
    id: "ig_hist_002",
    shortcode: "C8xY1aQ",
    mediaType: "IMAGE",
    mediaUrl: "/seed/cup.jpg",
    caption: `【淡水多雨生存指南】一杯熱茶的靜心時間 🍵\n\n外面下著綿綿細雨，衣服曬不乾、心情也濕答答嗎？\n在宿舍泡一杯熱茶，雙手感受陶杯的溫度。\n\n專注在熱氣升起的那一刻，讓腦袋裡的紛亂思緒隨茶香慢慢散開。\n\n今日社課：雨天專注力與深層呼吸引導。\n晚上 19:00 B304 見！`,
    postedAt: "2025-10-24",
    likeCount: 218,
    commentCount: 15,
    saveCount: 146,
    shareCount: 45,
    reach: 2950,
    topFeedback: "抓準淡水氣候特色，切中外地住宿生與雨天憂鬱情緒，當晚到課率提升 40%。",
    aiDiagnosis: {
      hookStrength: "高",
      hookAnalysis: "結合淡水雨季生活痛點，親切具象，容易引發淡江同學互相標記。",
      visualStyle: "暖色調茶杯微距攝影，與窗外陰冷形成溫暖反差對比。",
      captionPacing: "生活對話 → 帶入靜心步驟 → 自然帶出今晚社課時間地點。",
      studentFeedback: "「超愛這種溫暖的語氣，完全沒有宗教嚴肅感！」",
      nextImprovement: "可製作成 Story 投票（今天淡水下雨你都幹嘛），互動率會再翻倍。",
    },
  },
  {
    id: "ig_hist_003",
    shortcode: "C7zA8vL",
    mediaType: "VIDEO",
    mediaUrl: "/seed/cup.jpg",
    caption: `爬完克難坡 132 階，心跳很快怎麼辦？\n3 步快速降心率呼吸法：\n1. 站穩腳步，雙肩下沉放鬆\n2. 用鼻子深吸氣 4 秒\n3. 嘟起嘴巴緩慢吐氣 6 秒\n\n重複三次，整個人就穩下來了。\n收藏起來，明天爬坡試試看！`,
    postedAt: "2025-09-19",
    likeCount: 512,
    commentCount: 42,
    saveCount: 620,
    shareCount: 280,
    reach: 8400,
    topFeedback: "Reels 短影音自然觸及爆發，克難坡梗直擊所有淡江師生笑點與痛點，收藏率超高。",
    aiDiagnosis: {
      hookStrength: "優",
      hookAnalysis: "直接點名淡江代表性地標『克難坡 132 階』，前 2 秒立即抓住目光。",
      visualStyle: "第一人稱視角錄製爬坡與校園景色，真實有人味，避免了 AI 生成的塑料感。",
      captionPacing: "精簡俐落的 1-2-3 步驟，完全是實用工具卡片的節奏。",
      studentFeedback: "「太實用了吧！大一每天爬到快往生，這招真的有用！」",
      nextImprovement: "可延伸為社團系列影音專欄：『淡江校園生活減壓指南』。",
    },
  },
];

export const ZEN_CLUB_IG_DNA = {
  account: "@tku_zenclub",
  followers: 1860,
  averageReach: 4200,
  engagementRate: "8.4%",
  coreColors: ["#1E3A4C (淡水夜青)", "#F7F6F2 (暖宣紙白)", "#D97736 (晨曦暖光)", "#4A7C72 (松竹綠)"],
  voiceStyle: "溫暖像朋友、慢下腳步、有校園生活感、注重情緒喘息、絕不說教推銷",
  topHooks: [
    "「最近是不是連休息都覺得有罪惡感？」",
    "「有時候我們需要的不是答案，只是一個安靜的晚上。」",
    "「大學生活很自由，但你最近真的有比較快樂嗎？」",
    "「淡水又下雨了，給心靈留一個放晴的角落。」",
  ],
  effectiveFormats: [
    "4:5 Carousel（情緒共鳴 + 減壓步驟，收藏率最高）",
    "9:16 Reels（克難坡、淡水捷運通勤日常生活技巧，觸及率最高）",
    "9:16 Story 互動投票（雨天心情、開學壓力問卷，回覆率最高）",
  ],
  audienceInsights: {
    primaryCampuses: ["淡江大學淡水校區（宮燈、活動中心、商管大樓、克難坡）"],
    studentCategories: ["開學大一新生（需要歸屬感）", "大二至大四（課業報告、人際困擾、未來迷惘）", "通勤族（紅線捷運長途疲累）"],
    bestPostingTime: "平日晚間 20:00 - 22:00（下課回到宿舍放鬆時間）",
  },
};
