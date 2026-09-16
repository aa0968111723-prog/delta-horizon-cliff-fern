export type StudentPersona = {
  id: string;
  label: string;
  life: string;
  stopFor: string;
};

export const STUDENT_PERSONAS: StudentPersona[] = [
  {
    id: "freshman",
    label: "淡江大一新生",
    life: "剛到淡水，路線、社團、宿舍都還不熟，晚上很容易覺得自己一個人。",
    stopFor: "被看見、被邀請，而不是被上課。",
  },
  {
    id: "soph-senior",
    label: "大二到大四學生",
    life: "課表、報告、社團、打工疊在一起，自由但不見得比較快樂。",
    stopFor: "一個不用表演的晚上。",
  },
  {
    id: "grad",
    label: "研究生",
    life: "時間被論文切得很碎，很少被當「學生」而不是產線。",
    stopFor: "短、清楚、不必先懂禪。",
  },
  {
    id: "dorm",
    label: "住宿生",
    life: "晚上回到宿舍還是人群，想找一個不必一直講話的地方。",
    stopFor: "校園內走幾步就到的活動。",
  },
  {
    id: "commute",
    label: "通勤生",
    life: "紅樹林／淡水線來回，時間很貴，不會為了抽象理念再跑一趟。",
    stopFor: "時間地點清楚、值得特地留下來。",
  },
  {
    id: "new-tamsui",
    label: "剛到淡水生活的人",
    life: "河岸、老街、斜坡校園都還很新，想認識這裡，不想被推銷。",
    stopFor: "淡水夜晚、校園生活感。",
  },
  {
    id: "club-new",
    label: "社團新鮮人",
    life: "想加入但怕很宗教、很嚴肅、或要先懂一堆名詞。",
    stopFor: "像同學在發文，不是公告。",
  },
  {
    id: "friends",
    label: "想交朋友的人",
    life: "大學很自由，但認識人的方式常常只剩喝酒或趕報告。",
    stopFor: "可以找一個朋友一起來。",
  },
  {
    id: "stress",
    label: "課業壓力大的學生",
    life: "連休息都會有一點罪惡感。",
    stopFor: "先被理解，再看到活動。",
  },
  {
    id: "lonely",
    label: "人際困擾的人",
    life: "不一定要被修復，只是想有一個不必表現好的空間。",
    stopFor: "陪伴，而不是雞湯。",
  },
  {
    id: "lost",
    label: "對未來迷惘的人",
    life: "課可以修完，方向不一定有。",
    stopFor: "自我探索，不是職涯講座。",
  },
  {
    id: "belong",
    label: "想找歸屬感的人",
    life: "淡江很大，很容易變成過客。",
    stopFor: "穩定出現的人與地方。",
  },
  {
    id: "explore",
    label: "對自我探索有興趣的人",
    life: "願意試試靜下來，但拒絕被說教。",
    stopFor: "具體體驗：坐一下、喝杯茶、看燈。",
  },
  {
    id: "zen-new",
    label: "對禪完全不了解的人",
    life: "一看到佛學名詞就划走。",
    stopFor: "生活語言：安定、專注、喘口氣。",
  },
];

export function audienceSummary() {
  return STUDENT_PERSONAS.map((p) => `${p.label}：${p.life}`).join("\n");
}
