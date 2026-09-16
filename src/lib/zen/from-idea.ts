import { todayIso } from "./season.ts";
import { applyPackToWaves, emptyCampaign, suggestWaves } from "./schedule.ts";
import type { CampaignType, ClubCampaign, CreativePack } from "./types.ts";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function addDaysIso(iso: string, days: number) {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, (m ?? 1) - 1, (d ?? 1) + days);
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`;
}

export type ParsedEventIdea = {
  name: string;
  type: CampaignType;
  date: string;
  time: string;
  location: string;
  idea: string;
};

export function parseEventIdea(idea: string, now = new Date()): ParsedEventIdea {
  const text = idea.trim();
  const today = todayIso(now);
  let type: CampaignType = "other";
  if (/茶會|喝茶|茶席|來喝茶/.test(text)) type = "tea";
  else if (/浮游|禪光|三色光|夜燈/.test(text)) type = "light";
  else if (/招生|招新|迎新/.test(text)) type = "recruit";
  else if (/社課|例會/.test(text)) type = "class";
  else if (/講座|分享會|對談/.test(text)) type = "talk";
  else if (/一日禪|靜心|坐禪/.test(text)) type = "retreat";
  else if (/回顧/.test(text)) type = "review";

  let date = today;
  const md = text.match(/(\d{1,2})\s*[\/月.]\s*(\d{1,2})/);
  if (md) {
    const tpe = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Taipei" }));
    date = `${tpe.getFullYear()}-${pad(Number(md[1]))}-${pad(Number(md[2]))}`;
  } else if (/今晚|今天/.test(text)) {
    date = today;
  } else if (/明天/.test(text)) {
    date = addDaysIso(today, 1);
  } else if (/下週|下周|下星期/.test(text)) {
    date = addDaysIso(today, 7);
  }

  let name = text
    .replace(/下週|下周|下星期|今晚|今天|明天/g, " ")
    .replace(/有一場|幫我做|請幫我|我要|我想|新的|宣傳|完整/g, " ")
    .replace(/(\d{1,2})\s*[\/月.]\s*(\d{1,2})日?/g, " ")
    .replace(/[，。,.!?！？]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (/浮游禪光/.test(text)) name = "浮游禪光";
  else if (type === "tea" && /茶會/.test(text)) {
    const leftover = name.replace(/茶會/g, "").trim();
    name = leftover.length > 6 ? name : "茶會";
  } else if (!name || name.length > 24) {
    name = type === "tea" ? "茶會" : type === "light" ? "浮游禪光" : name.slice(0, 16) || "活動";
  }
  if (type === "tea" && /茶會/.test(name) === false && name.length <= 6) name = "茶會";

  return {
    name,
    type,
    date,
    time: type === "tea" || type === "light" ? "19:30" : "19:00",
    location: "淡江大學淡水校園",
    idea: text,
  };
}

export function materializeCampaignFromPack(input: {
  idea: string;
  pack: CreativePack;
  campaigns: ClubCampaign[];
}): ClubCampaign {
  const parsed = parseEventIdea(input.idea);
  const reusable = input.campaigns.find((campaign) => {
    if (parsed.name === "浮游禪光" && campaign.name.includes("浮游禪光")) return true;
    return campaign.name === parsed.name && campaign.date === parsed.date;
  });
  const base = reusable
    ? { ...reusable, updatedAt: Date.now() }
    : emptyCampaign({
        name: input.pack.campaignName || parsed.name,
        type: parsed.type,
        date: parsed.date,
        time: parsed.time,
        location: parsed.location,
        tagline: input.pack.copy.hook,
        description: input.pack.insight,
      });
  const named: ClubCampaign = {
    ...base,
    name: reusable?.name || input.pack.campaignName || parsed.name,
    type: reusable?.type || parsed.type,
    date: reusable?.date && reusable.name.includes(parsed.name) ? reusable.date : parsed.date,
    time: reusable?.time || parsed.time,
    location: reusable?.location || parsed.location,
  };
  if (!named.waves.length) {
    named.waves = suggestWaves({ date: named.date, type: named.type, name: named.name });
  }
  return applyPackToWaves(named, input.pack);
}

export function convertStaggerDays(id: string) {
  if (id === "story") return 1;
  if (id === "threads") return 2;
  if (id === "carousel") return 3;
  if (id === "reels") return 5;
  return 0;
}
