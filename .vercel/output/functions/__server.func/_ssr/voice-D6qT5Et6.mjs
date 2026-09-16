//#region node_modules/.nitro/vite/services/ssr/assets/voice-D6qT5Et6.js
var SEMESTER_PHASES = {
	"pre-semester": {
		id: "pre-semester",
		label: "開學前",
		mood: "還在放假但已經開始緊張，課表跟租屋剛安排好。",
		angle: "用「重新開始」的語氣，先建立期待，不急著推活動細節。"
	},
	orientation: {
		id: "orientation",
		label: "開學迎新",
		mood: "什麼都新、資訊爆量，急著找朋友跟落腳的地方。",
		angle: "說清楚「第一次來也可以」，降低門檻，強調有人陪。"
	},
	"club-fair": {
		id: "club-fair",
		label: "社團博覽會期間",
		mood: "同時被十幾個社團招手，比較誰真的適合自己。",
		angle: "不要喊招生口號，直接讓人看到社課現場長什麼樣。"
	},
	settling: {
		id: "settling",
		label: "學期穩定期",
		mood: "作息成形，開始感覺到累，但還撐得住。",
		angle: "適合生活感內容、社員故事、知識型貼文，養帳號的信任。"
	},
	midterm: {
		id: "midterm",
		label: "期中考週",
		mood: "考試與報告疊在一起，睡不夠，腦袋停不下來。",
		angle: "只給「喘口氣」的內容，不要塞活動資訊，讓人覺得被理解。"
	},
	"post-midterm": {
		id: "post-midterm",
		label: "期中後",
		mood: "剛喘過來，成績出來後有些人受挫，開始想找出口。",
		angle: "最好的活動宣傳檔期，情緒共鳴接活動邀請效果最好。"
	},
	final: {
		id: "final",
		label: "期末考週",
		mood: "全面趕工，情緒緊繃，時間完全被切碎。",
		angle: "短內容、限動為主，給五分鐘的靜心練習就夠。"
	},
	"winter-break": {
		id: "winter-break",
		label: "寒假",
		mood: "離開淡水回家，節奏鬆下來，也容易和學校斷線。",
		angle: "回顧一學期、預告下學期，維持關係而不是推活動。"
	},
	"summer-break": {
		id: "summer-break",
		label: "暑假",
		mood: "打工、實習、旅行，跟學校的連結最弱。",
		angle: "整理內容資產、社員故事、為迎新做準備。"
	}
};
/** 由日期推學期階段。台灣大學行事曆：9 月開學、1 月與 6 月期末。 */
function semesterPhaseAt(date = /* @__PURE__ */ new Date()) {
	const month = date.getMonth() + 1;
	const day = date.getDate();
	const md = month * 100 + day;
	if (md >= 815 && md <= 908) return SEMESTER_PHASES["pre-semester"];
	if (md >= 909 && md <= 921) return SEMESTER_PHASES.orientation;
	if (md >= 922 && md <= 1005) return SEMESTER_PHASES["club-fair"];
	if (md >= 1006 && md <= 1031) return SEMESTER_PHASES.settling;
	if (md >= 1101 && md <= 1120) return SEMESTER_PHASES.midterm;
	if (md >= 1121 && md <= 1215) return SEMESTER_PHASES["post-midterm"];
	if (md >= 1216 || md <= 118) return SEMESTER_PHASES.final;
	if (md >= 119 && md <= 215) return SEMESTER_PHASES["winter-break"];
	if (md >= 216 && md <= 308) return SEMESTER_PHASES["pre-semester"];
	if (md >= 309 && md <= 331) return SEMESTER_PHASES.settling;
	if (md >= 401 && md <= 420) return SEMESTER_PHASES.midterm;
	if (md >= 421 && md <= 525) return SEMESTER_PHASES["post-midterm"];
	if (md >= 526 && md <= 620) return SEMESTER_PHASES.final;
	return SEMESTER_PHASES["summer-break"];
}
/** 淡水與校園的季節感，讓畫面與文案有地方感。 */
function tamsuiContextAt(date = /* @__PURE__ */ new Date()) {
	const month = date.getMonth() + 1;
	if (month >= 3 && month <= 5) return {
		season: "春天",
		weather: "回暖但常下雨，濕氣重，傍晚天空偏灰藍。",
		campus: "宮燈大道兩側樹色轉綠，克難坡走上來會出汗。"
	};
	if (month >= 6 && month <= 8) return {
		season: "夏天",
		weather: "曬、悶熱，午後有雷雨，傍晚有海風。",
		campus: "校園人少，樹蔭與圖書館冷氣是避難所，河邊夕陽最好看。"
	};
	if (month >= 9 && month <= 11) return {
		season: "秋天",
		weather: "開始起風，早晚溫差大，天空清透。",
		campus: "開學人潮回來，宮燈大道與操場傍晚最熱鬧。"
	};
	return {
		season: "冬天",
		weather: "濕冷的雨連下好幾天，海風很大，體感比溫度更冷。",
		campus: "從捷運站走上坡很費力，室內活動與熱飲特別有吸引力。"
	};
}
/** 給 AI prompt 用的當下情境段落。 */
function describeMoment(date = /* @__PURE__ */ new Date()) {
	const phase = semesterPhaseAt(date);
	const tamsui = tamsuiContextAt(date);
	return [
		`今天：${`${date.getMonth() + 1}/${date.getDate()}`}`,
		`學期階段：${phase.label}｜學生狀態：${phase.mood}`,
		`這個階段的內容原則：${phase.angle}`,
		`淡水：${tamsui.season}，${tamsui.weather}`,
		`校園：${tamsui.campus}`
	].join("\n");
}
/**
* 禪的內容轉譯與語氣規則。
*
* 目標不是把禪變成宗教廣告，而是讓淡江學生覺得「這好像跟我的生活有關」。
* 這裡的規則會直接進 AI prompt，也用在生成後的自我檢查。
*/
/** 把宗教／佛學語彙轉成生活語彙。左邊少用，右邊優先。 */
var ZEN_TRANSLATION = [
	{
		from: "禪修",
		to: "坐下來、靜一下"
	},
	{
		from: "打坐",
		to: "找個位子坐十分鐘"
	},
	{
		from: "修行",
		to: "練習、慢慢來"
	},
	{
		from: "開悟",
		to: "重新看見自己"
	},
	{
		from: "覺察",
		to: "注意到自己現在的狀態"
	},
	{
		from: "止觀",
		to: "專注、把注意力放回來"
	},
	{
		from: "放下",
		to: "先放旁邊、不急著處理"
	},
	{
		from: "無我",
		to: "不用一直證明自己"
	},
	{
		from: "業力因果",
		to: "選擇會累積成生活"
	},
	{
		from: "法會共修",
		to: "一群人一起安靜"
	},
	{
		from: "皈依",
		to: "找到可以回去的地方"
	},
	{
		from: "身心靈成長",
		to: "認識自己"
	}
];
/** 這些詞不要在對外文案裡當主角。 */
var AVOID_WORDS = [
	"誠摯邀請",
	"敬邀",
	"歡迎踴躍參加",
	"不容錯過",
	"限時",
	"名額有限",
	"洗滌心靈",
	"淨化",
	"加持",
	"法喜充滿",
	"生命的意義",
	"宇宙能量",
	"療癒你的靈魂"
];
/** 禪 → 學生語彙。這些是文案優先使用的概念。 */
var ZEN_CONCEPTS = [
	"安定",
	"專注",
	"慢下來",
	"認識自己",
	"整理情緒",
	"陪伴",
	"自我探索",
	"生活感",
	"喘口氣",
	"重新看見自己",
	"在人際和壓力中找到空間"
];
/** 第一句 Hook 的範式。AI 要學這種開場，而不是官方邀請函。 */
var HOOK_PATTERNS = [
	{
		label: "說出他沒說出口的狀態",
		example: "最近是不是連休息都覺得有罪惡感？",
		why: "先讓人覺得「這在講我」，再進活動。"
	},
	{
		label: "把需求講小一點",
		example: "有時候我們需要的不是答案，只是一個安靜的晚上。",
		why: "不承諾改變人生，只承諾一個晚上。"
	},
	{
		label: "溫和的反問",
		example: "大學生活很自由，但你最近真的有比較快樂嗎？",
		why: "自由跟快樂的落差是共同經驗。"
	},
	{
		label: "具體場景",
		example: "從捷運站走上克難坡的那段路，你通常在想什麼？",
		why: "淡江學生每天都在走這段，畫面直接成立。"
	},
	{
		label: "降低門檻",
		example: "不用盤腿，不用信什麼，坐下來就好。",
		why: "直接回應「怕被傳教、怕做不好」。"
	},
	{
		label: "留白式陳述",
		example: "有一個地方，你不用表現得很好也可以待著。",
		why: "歸屬感比活動內容更有吸引力。"
	}
];
/** 不要再出現的開場。 */
var HOOK_ANTIPATTERNS = [
	"淡江大學禪學社誠摯邀請您參加……",
	"本社將於本週三舉辦……",
	"歡迎有興趣的同學踴躍報名！",
	"在這個紛擾的世界裡，讓我們一起……"
];
/** 避免 AI 味的寫作規則。 */
var ANTI_AI_RULES = [
	"不要每句都像金句，正常人講話會有普通的句子。",
	"不要大量破折號與排比，最多用一次。",
	"抽象詞（旅程、蛻變、內在力量）最多出現一次。",
	"不要過度勵志或保證效果，禪不負責解決人生。",
	"允許口語：其實、好像、有點、就、而已。",
	"句長要不一樣，短句可以只有四五個字。",
	"結尾不要總結全文，可以停在一個具體動作或時間地點。",
	"emoji 最多一個，或完全不用。"
];
/** 生成後的淡江學生視角自我檢查題。 */
var STUDENT_REVIEW_QUESTIONS = [
	"我會停下來嗎？",
	"我看得懂嗎？",
	"是不是太宗教？",
	"是不是太嚴肅？",
	"是不是太文青？",
	"是不是太 AI？",
	"是不是太長？",
	"我知道這活動在幹嘛嗎？",
	"我知道時間地點嗎？",
	"我會想找朋友一起來嗎？",
	"我知道怎麼報名嗎？"
];
/** 給 prompt 用的轉譯與語氣段落。 */
function describeVoiceRules() {
	return [
		"【禪的轉譯】不要一開始就用宗教或艱澀佛學名詞，優先轉成生活語彙：",
		ZEN_TRANSLATION.map((row) => `  ${row.from} → ${row.to}`).join("\n"),
		`優先使用的概念：${ZEN_CONCEPTS.join("、")}`,
		`避免詞：${AVOID_WORDS.join("、")}`,
		"",
		"【第一句 Hook】先讓學生覺得「這好像在講我」，再進活動。範例：",
		HOOK_PATTERNS.map((row) => `  ${row.label}：「${row.example}」（${row.why}）`).join("\n"),
		`絕對不要這樣開場：${HOOK_ANTIPATTERNS.map((s) => `「${s}」`).join("、")}`,
		"",
		"【避免 AI 味】",
		ANTI_AI_RULES.map((rule) => `  - ${rule}`).join("\n")
	].join("\n");
}
/** 粗略偵測 AI 味與宗教味，用在本機檢查與 UI 提示。 */
function scanCopyIssues(text) {
	const issues = [];
	const hit = AVOID_WORDS.filter((word) => text.includes(word));
	if (hit.length) issues.push(`出現要避免的詞：${hit.join("、")}`);
	if ((text.match(/—|──|--/g) ?? []).length >= 2) issues.push("破折號太多，讀起來像 AI 寫的。");
	const religious = ZEN_TRANSLATION.filter((row) => text.includes(row.from)).map((row) => row.from);
	if (religious.length >= 2) issues.push(`宗教／佛學名詞偏多：${religious.join("、")}，可以換成生活語彙。`);
	if (text.length > 520) issues.push("篇幅偏長，IG 上多數學生不會讀完。");
	if ((text.match(/\p{Extended_Pictographic}/gu) ?? []).length > 2) issues.push("emoji 太多，收斂到一個以內。");
	if (/^(淡江大學禪學社|本社)/.test(text.trim())) issues.push("開頭是社團自我介紹，改成學生會停下來的一句話。");
	return issues;
}
//#endregion
export { scanCopyIssues as a, describeVoiceRules as i, STUDENT_REVIEW_QUESTIONS as n, semesterPhaseAt as o, describeMoment as r, tamsuiContextAt as s, HOOK_PATTERNS as t };
