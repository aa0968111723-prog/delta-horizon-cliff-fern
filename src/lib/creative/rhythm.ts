import { addDays, differenceInCalendarDays, formatISO, parseISO, setHours } from "date-fns";
import type { Campaign, ContentItem, ContentType } from "./types";

type RhythmBeat = {
  daysBefore: number;
  title: string;
  angle: string;
  type: ContentType;
};

const LONG_RHYTHM: RhythmBeat[] = [
  { daysBefore: 14, title: "先留一個晚上", angle: "預告活動，但先不塞滿資訊", type: "Story" },
  { daysBefore: 10, title: "最近連休息都在趕嗎？", angle: "從淡江學生最近的壓力與生活切入", type: "IG Post" },
  { daysBefore: 7, title: "活動主視覺", angle: "Hook、活動名、日期與地點一眼看懂", type: "Carousel" },
  { daysBefore: 4, title: "為什麼值得來", angle: "說清楚能得到的陪伴、空間與朋友感", type: "Threads" },
  { daysBefore: 2, title: "你最近是哪一種狀態？", angle: "用投票讓學生先參與，不只看廣告", type: "互動投票" },
  { daysBefore: 1, title: "明晚見", angle: "一句倒數，加上時間、地點與報名方式", type: "倒數" },
  { daysBefore: 0, title: "今天，一起坐坐", angle: "當日提醒與交通／集合資訊", type: "Story" },
  { daysBefore: -1, title: "昨晚留下來的光", angle: "用活動照片與真實感受完成回顧", type: "活動回顧" },
];

const SHORT_RHYTHM: RhythmBeat[] = [
  { daysBefore: 5, title: "最近是不是很久沒有好好坐下來？", angle: "情緒共鳴與活動預告", type: "IG Post" },
  { daysBefore: 3, title: "活動主視覺", angle: "活動內容、時間、地點與參加理由", type: "Carousel" },
  { daysBefore: 1, title: "明晚見", angle: "倒數與報名方式", type: "倒數" },
  { daysBefore: 0, title: "今天，一起坐坐", angle: "當日提醒與集合資訊", type: "Story" },
  { daysBefore: -1, title: "昨晚留下來的光", angle: "活動照片、社員聲音與回顧", type: "活動回顧" },
];

function atPublishHour(date: Date) {
  return setHours(date, 19);
}

export function buildCampaignRhythm(campaign: Campaign, now = new Date()): ContentItem[] {
  const eventDate = parseISO(campaign.eventDate);
  const leadDays = differenceInCalendarDays(eventDate, now);
  const rhythm = leadDays >= 10 ? LONG_RHYTHM : SHORT_RHYTHM;
  const createdAt = now.getTime();

  return rhythm
    .filter((beat) => beat.daysBefore <= Math.max(leadDays, 0) || beat.daysBefore <= 0)
    .map((beat, index) => {
      const planned = atPublishHour(addDays(eventDate, -beat.daysBefore));
      return {
        id: `content_${campaign.id}_${beat.daysBefore}_${index}`,
        campaignId: campaign.id,
        title: beat.title,
        angle: beat.angle,
        type: beat.type,
        status: "idea",
        plannedAt: formatISO(planned),
        publishedAt: null,
        projectId: null,
        createdAt,
        updatedAt: createdAt,
      };
    });
}

export function contentTypeDeliverables(type: ContentType) {
  return {
    post: ["IG Post", "Threads", "LINE", "海報", "活動回顧", "社員故事", "知識內容"].includes(type),
    carousel: type === "Carousel",
    story: ["Story", "倒數", "Q&A", "互動投票"].includes(type),
    reels: type === "Reels",
  };
}
