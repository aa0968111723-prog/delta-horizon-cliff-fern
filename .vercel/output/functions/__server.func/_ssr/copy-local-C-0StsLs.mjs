import { t as uid } from "./ids-D2oCDrlv.mjs";
import { c as CLUB_NAME, n as CLUB_CTAS, o as CLUB_HASHTAGS } from "./club-CaoIGk4S.mjs";
import { t as AUDIENCE_SEGMENTS } from "./audience-Bhnj2Vl6.mjs";
import { a as scanCopyIssues, n as STUDENT_REVIEW_QUESTIONS, o as semesterPhaseAt, t as HOOK_PATTERNS } from "./voice-D6qT5Et6.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/copy-local-C-0StsLs.js
var COPY_TOPICS = [
	{
		id: "event",
		label: "活動宣傳",
		hint: "時間地點要清楚。"
	},
	{
		id: "emotion",
		label: "情緒共鳴",
		hint: "只講狀態，不推活動。"
	},
	{
		id: "campus",
		label: "校園生活",
		hint: "淡水、克難坡、宿舍的日常。"
	},
	{
		id: "recruit",
		label: "招生",
		hint: "降低門檻，不要喊口號。"
	},
	{
		id: "member",
		label: "社員故事",
		hint: "真人真話最有效。"
	},
	{
		id: "zen-life",
		label: "禪生活",
		hint: "把禪講成生活練習。"
	},
	{
		id: "countdown",
		label: "倒數",
		hint: "短，一眼看完。"
	},
	{
		id: "recap",
		label: "活動回顧",
		hint: "放人的反應。"
	},
	{
		id: "knowledge",
		label: "知識內容",
		hint: "可以收藏的內容。"
	}
];
var COPY_TONES = [
	{
		id: "short",
		label: "短版",
		hint: "三句以內。"
	},
	{
		id: "normal",
		label: "一般版",
		hint: "標準長度。"
	},
	{
		id: "emotional",
		label: "感性版",
		hint: "情緒多一點，但不濫情。"
	},
	{
		id: "student",
		label: "學生版",
		hint: "像同學在講話。"
	},
	{
		id: "life",
		label: "生活版",
		hint: "從日常場景開始。"
	},
	{
		id: "humor",
		label: "幽默版",
		hint: "輕鬆一點，可以有龜龜。"
	}
];
function topicLabel(topic) {
	return COPY_TOPICS.find((t) => t.id === topic)?.label ?? "內容";
}
function toneLabel(tone) {
	return COPY_TONES.find((t) => t.id === tone)?.label ?? "一般版";
}
/** 每個語氣要有自己的第一句，不然三個版本看起來一樣。 */
var TONE_HOOK = {
	short: (pain) => pain ? `${pain}。` : "先坐一下再說。",
	normal: (pain, trigger) => pain ? `${pain}？` : trigger,
	emotional: (pain, trigger) => pain ? `有些累不是睡一覺就好——${pain}的那種。` : trigger,
	student: (pain) => pain ? `說真的，${pain}的時候最難的不是事情本身。` : "講真的，最近你有好好休息嗎？",
	life: (pain, trigger) => pain ? `走上克難坡的時候在想什麼？大概就是${pain}。` : trigger,
	humor: (pain) => pain ? `龜龜也${pain}，但牠本來就走很慢，所以看不出來。` : "龜龜今天也不想動，但牠說這叫修行。"
};
function baseTrigger(brief) {
	const seg = AUDIENCE_SEGMENTS.find((s) => brief.audienceIds.includes(s.id));
	if (seg) return seg.trigger.replace(/^「|」$/g, "");
	const index = brief.topic === "emotion" ? 0 : brief.topic === "knowledge" ? 4 : brief.topic === "campus" ? 3 : 1;
	return HOOK_PATTERNS[index].example;
}
function pickHook(brief, tone = brief.tone) {
	const pain = brief.painPoint.trim().replace(/[？?。]$/, "");
	const trigger = baseTrigger(brief);
	if (brief.topic === "countdown") return pain ? `${pain}？明天晚上有個地方可以放一下。` : "明天晚上，位子留著。";
	return TONE_HOOK[tone](pain, trigger);
}
function whenWhere(brief) {
	return [brief.schedule.trim(), brief.location.trim()].filter(Boolean).join("，");
}
function bodyFor(brief, tone) {
	const phase = semesterPhaseAt();
	const detail = brief.detail.trim();
	const where = whenWhere(brief);
	const name = brief.eventName.trim();
	const lines = [];
	if (tone === "life") lines.push(`${phase.label}了，${phase.mood}`);
	if (tone === "emotional") lines.push("不是每件事都要馬上解決，有些只需要先放下來看看。");
	if (tone === "student") lines.push("這種時候最需要的，是一段沒有人要求你做什麼的時間。");
	if (tone === "humor") lines.push("我們沒有要教你什麼，就是找個位子坐著，順便放空。");
	if (tone === "normal" && brief.painPoint.trim()) lines.push("你不是懶，只是很久沒有真的休息了。");
	if (tone === "short") return [name && where ? `${name}：${where}。` : where ? `${where}。` : "", brief.cta.trim()].filter(Boolean).join("\n") || detail.slice(0, 60) || "淡江大學禪學社。一週一次，找個位子坐下來，把自己整理一下。";
	if (detail) lines.push(detail);
	if (name && where) lines.push(`${name}：${where}。`);
	else if (where) lines.push(`${where}。`);
	if (brief.topic !== "emotion" && brief.topic !== "knowledge") lines.push("第一次來什麼都不會，完全可以。");
	if (brief.signupUrl.trim()) lines.push("報名連結放在資訊欄。");
	return lines.filter(Boolean).join("\n\n") || "淡江大學禪學社。一週一次，找個位子坐下來，把自己整理一下。";
}
function hashtagsFor(brief) {
	const extra = brief.eventName.trim().replace(/\s+/g, "");
	const tags = [...CLUB_HASHTAGS];
	if (extra) tags.splice(3, 0, `#${extra}`);
	if (brief.topic === "recruit") tags.push("#淡江招生");
	if (brief.topic === "knowledge") tags.push("#呼吸練習");
	return [...new Set(tags)].slice(0, 8);
}
/** 沒有 AI 時的本機草稿。刻意標成 mock，UI 要說清楚這不是線上模型的回覆。 */
function buildLocalCopyDraft(brief, tone) {
	return {
		id: uid("copy"),
		tone,
		hook: pickHook(brief, tone),
		body: bodyFor(brief, tone),
		cta: brief.cta.trim() || CLUB_CTAS[0],
		hashtags: hashtagsFor(brief),
		createdAt: Date.now(),
		source: "mock"
	};
}
/** 本機的學生視角檢查。用可判斷的規則回答那幾個問題。 */
function buildLocalStudentReview(text, brief) {
	const issues = scanCopyIssues(text);
	const hasWhen = Boolean(brief.schedule.trim()) && text.includes(brief.schedule.trim().slice(0, 4));
	const hasWhere = Boolean(brief.location.trim()) && text.includes(brief.location.trim().slice(0, 3));
	const hasSignup = Boolean(brief.signupUrl.trim()) || /私訊|直接來|資訊欄|報名/.test(text);
	const tooLong = text.length > 480;
	const preachy = /應該|必須|要學會|人生/.test(text);
	const items = STUDENT_REVIEW_QUESTIONS.map((question) => {
		switch (question) {
			case "我知道時間地點嗎？": return {
				question,
				verdict: hasWhen && hasWhere ? "ok" : "risk",
				note: hasWhen && hasWhere ? "時間地點都有出現。" : "時間或地點沒有寫清楚，學生看完不知道要去哪。"
			};
			case "我知道怎麼報名嗎？": return {
				question,
				verdict: hasSignup ? "ok" : "risk",
				note: hasSignup ? "有講下一步。" : "沒有講怎麼參加，補一句「直接來就好」或報名方式。"
			};
			case "是不是太長？": return {
				question,
				verdict: tooLong ? "risk" : "ok",
				note: tooLong ? "偏長，IG 上多數人只看到第三行。" : "長度可以。"
			};
			case "是不是太宗教？": return {
				question,
				verdict: issues.some((i) => i.includes("宗教")) ? "risk" : "ok",
				note: issues.find((i) => i.includes("宗教")) ?? "沒有宗教語彙。"
			};
			case "是不是太 AI？": return {
				question,
				verdict: issues.some((i) => i.includes("AI") || i.includes("破折號")) ? "risk" : "ok",
				note: issues.find((i) => i.includes("AI") || i.includes("破折號")) ?? "讀起來還算像人講話。"
			};
			case "是不是太嚴肅？": return {
				question,
				verdict: preachy ? "risk" : "ok",
				note: preachy ? "有說教感，把「應該／必須」拿掉。" : "語氣不算嚴肅。"
			};
			case "我會停下來嗎？": return {
				question,
				verdict: /[？?]/.test(text.slice(0, 40)) || text.slice(0, 20).length < 20 ? "ok" : "risk",
				note: "第一句要能讓人覺得「這在講我」。"
			};
			default: return {
				question,
				verdict: "ok",
				note: "看起來沒問題。"
			};
		}
	});
	const risks = items.filter((i) => i.verdict === "risk").length;
	return {
		score: Math.max(30, 100 - risks * 12),
		items,
		rewriteHook: pickHook(brief),
		suggestions: issues.length ? issues : ["可以再把第一句縮短一點，讓人一眼看完。"],
		createdAt: Date.now(),
		source: "mock"
	};
}
/** 本機 Reels 腳本草稿。 */
function buildLocalReels(brief) {
	const hook = pickHook(brief);
	const where = whenWhere(brief) || "社課現場";
	return {
		hook,
		cover: `紙白底＋一句「${hook}」，右下角三色光標誌。`,
		beats: [
			{
				range: "0–3 秒",
				visual: "手機螢幕滿版的訊息通知，快速滑動",
				caption: hook,
				voice: "（不用旁白，只有環境音）",
				transition: "畫面突然安靜、亮度降低",
				asset: "手機畫面錄影或宿舍書桌"
			},
			{
				range: "3–7 秒",
				visual: "從捷運站走上坡的第一人稱視角",
				caption: "每天都在移動，但沒有一段時間是自己的",
				voice: "其實你不是懶，只是很久沒有真的休息。",
				transition: "推門進教室",
				asset: "校園實拍"
			},
			{
				range: "7–12 秒",
				visual: "坐墊、窗邊光、有人坐下來的側影",
				caption: "一小時，什麼都不用做",
				voice: "不用盤腿，不用信什麼。",
				transition: "淡入",
				asset: "社課現場照或窗邊光素材"
			},
			{
				range: "12–17 秒",
				visual: "社員側臉，微笑但不對鏡頭",
				caption: "第一次來也可以",
				voice: "我第一次來的時候也覺得很尬。",
				transition: "切黑",
				asset: "社員畫面（不需露臉）"
			},
			{
				range: "17–20 秒",
				visual: "紙白底大字：時間、地點",
				caption: where,
				voice: `${brief.cta.trim() || CLUB_CTAS[0]}。`,
				transition: "停格",
				asset: `${CLUB_NAME}三色光標誌`
			}
		],
		createdAt: Date.now(),
		source: "mock"
	};
}
//#endregion
export { buildLocalStudentReview as a, buildLocalReels as i, COPY_TOPICS as n, toneLabel as o, buildLocalCopyDraft as r, topicLabel as s, COPY_TONES as t };
