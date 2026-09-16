//#region node_modules/.nitro/vite/services/ssr/assets/club-CaoIGk4S.js
/**
* 淡江大學禪學社的品牌記憶預設值。
*
* 這些是可以在「品牌」頁改的預設，不是寫死的事實。AI 每次生成前會先讀這裡：
* 品牌色、龜龜、三色光、語氣、固定介紹、常用 CTA、活動類型。
*/
var CLUB_NAME = "淡江大學禪學社";
var CLUB_SHORT = "禪學社";
var CLUB_HANDLE = "@tku.zen";
var APP_TAGLINE = "淡江大學禪學社 AI 創作中控台";
/** 三色光：社團視覺核心，暖光／澄光／夜光。 */
var THREE_LIGHTS = [
	{
		id: "warm",
		label: "曦光",
		hex: "#F2A65A",
		meaning: "陪伴與溫度，用在邀請與人的畫面。"
	},
	{
		id: "clear",
		label: "澄光",
		hex: "#3F9E93",
		meaning: "安定與專注，主色，用在標題與 CTA。"
	},
	{
		id: "night",
		label: "夜光",
		hex: "#5C6BA8",
		meaning: "沉靜與自我探索，用在夜晚與情緒內容。"
	}
];
var CLUB_PALETTE = {
	ink: "#23211C",
	paper: "#F7F4ED",
	mist: "#E8E2D6",
	warm: THREE_LIGHTS[0].hex,
	clear: THREE_LIGHTS[1].hex,
	night: THREE_LIGHTS[2].hex
};
/** 龜龜：社團吉祥物。慢、穩、不催促——正好是禪要講的事。 */
var MASCOT = {
	name: "龜龜",
	role: "社團吉祥物",
	look: "圓潤的綠殼小烏龜，殼上有三道柔光，表情放鬆，動作永遠慢半拍。",
	personality: "不催促、不說教，會陪著你坐一下。可以講幹話，但不會嘲笑人。",
	usage: "適合放在輕鬆內容、限動、倒數、Q&A；正式的活動主視覺可以只留殼上的三色光。"
};
var CLUB_VOICE = "像一個學長姐坐在你旁邊講話：安靜、具體、不說教。會承認自己也會累，不保證改變人生，只邀你坐一下。";
var CLUB_DO_SAY = "坐一下、慢下來、喘口氣、認識自己、陪你、第一次來也可以、不用準備什麼";
var CLUB_DONT_SAY = "誠摯邀請、踴躍參加、洗滌心靈、療癒靈魂、生命的意義、限時名額";
var CLUB_INTRO_SHORT = "淡江大學禪學社。一週一次，找個位子坐下來，把自己整理一下。";
var CLUB_CTAS = [
	"來坐一下",
	"社課見",
	"先存起來",
	"私訊問我們",
	"報名連結在資訊欄",
	"找朋友一起來"
];
var CLUB_SLOGANS = [
	"坐下來，就是開始。",
	"慢一點，也走得到。",
	"不用準備好才能來。"
];
var CLUB_HASHTAGS = [
	"#淡江大學",
	"#淡江禪學社",
	"#淡江社團",
	"#淡水",
	"#靜心",
	"#大學生活"
];
/** 常見活動類型，Campaign 建立時直接選。 */
var EVENT_KINDS = [
	{
		id: "class",
		label: "社課",
		hint: "每週固定，最常出現的內容。"
	},
	{
		id: "tea",
		label: "茶會",
		hint: "邊喝茶邊聊，門檻最低的第一次。"
	},
	{
		id: "sit",
		label: "禪坐體驗",
		hint: "十到二十分鐘的靜坐練習。"
	},
	{
		id: "talk",
		label: "講座／分享",
		hint: "邀請講者或社員分享。"
	},
	{
		id: "outdoor",
		label: "戶外禪",
		hint: "河邊、校園散步、感官練習。"
	},
	{
		id: "camp",
		label: "營隊／共修",
		hint: "半天以上的深度活動。"
	},
	{
		id: "welcome",
		label: "迎新",
		hint: "開學招生檔期的主力。"
	},
	{
		id: "recruit",
		label: "招生",
		hint: "社博、擺攤、線上招生。"
	},
	{
		id: "film",
		label: "電影賞析",
		hint: "看片加討論，適合冬天室內。"
	},
	{
		id: "other",
		label: "其他",
		hint: "自訂活動。"
	}
];
function eventKindLabel(id) {
	return EVENT_KINDS.find((item) => item.id === id)?.label ?? "活動";
}
/** 視覺方向的預設素材，AI 產生圖片 prompt 時的共同底。 */
var VISUAL_ANCHORS = {
	mood: "明亮、有空氣感、療癒；留白多，不擁擠。",
	lighting: "自然光或夜晚的暖燈，柔和不打硬光。避免高飽和濾鏡與宗教式金光。",
	palette: "米白紙感底色，三色光（曦光／澄光／夜光）作點綴，一次最多兩個光色。",
	composition: "主體偏上或偏一側，下半留白給標題；學生感的日常物件優先。",
	subjects: "校園角落、宮燈大道、克難坡、河邊夕陽、宿舍書桌、熱飲、坐墊、光影、龜龜。",
	avoid: "蓮花、金身佛像、燒香、雲霧仙氣、宗教符號、老氣書法字、AI 感的對稱大光暈。"
};
/** 給 prompt 用的品牌段落。 */
function describeClub() {
	return [
		`社團：${CLUB_NAME}（${CLUB_HANDLE}）`,
		`語氣：${CLUB_VOICE}`,
		`可以說：${CLUB_DO_SAY}`,
		`不要說：${CLUB_DONT_SAY}`,
		`固定介紹：${CLUB_INTRO_SHORT}`,
		`吉祥物：${MASCOT.name}——${MASCOT.look} 個性：${MASCOT.personality}`,
		`三色光：${THREE_LIGHTS.map((l) => `${l.label} ${l.hex}（${l.meaning}）`).join("；")}`,
		`常用 CTA：${CLUB_CTAS.join("、")}`,
		`視覺：${VISUAL_ANCHORS.mood} 光線：${VISUAL_ANCHORS.lighting} 構圖：${VISUAL_ANCHORS.composition}`,
		`畫面可用元素：${VISUAL_ANCHORS.subjects}`,
		`畫面要避免：${VISUAL_ANCHORS.avoid}`
	].join("\n");
}
//#endregion
export { eventKindLabel as _, CLUB_HANDLE as a, CLUB_NAME as c, CLUB_SLOGANS as d, CLUB_VOICE as f, describeClub as g, VISUAL_ANCHORS as h, CLUB_DO_SAY as i, CLUB_PALETTE as l, MASCOT as m, CLUB_CTAS as n, CLUB_HASHTAGS as o, EVENT_KINDS as p, CLUB_DONT_SAY as r, CLUB_INTRO_SHORT as s, APP_TAGLINE as t, CLUB_SHORT as u };
