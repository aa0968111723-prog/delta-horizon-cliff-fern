import { c as completeCarouselPages, f as goalLabel, n as BriefInputSchema, s as PlanJsonSchema } from "./schema-iJpgBEjq.mjs";
import { t as createServerFn } from "./ssr.mjs";
import { t as createServerRpc } from "./createServerRpc-A6pJPYTF.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/campaign-BVMsvEKT.js
function pickTemplate(goal, wantCarousel) {
	if (goal === "conversion" || goal === "traffic") return wantCarousel ? "product" : "offer";
	if (goal === "ugc") return "quote";
	return "editorial";
}
function hashTag(word) {
	const cleaned = word.replace(/[#＃\s]/g, "");
	return cleaned ? `#${cleaned}` : "";
}
function clipHeadline(text) {
	return text.split("\n").map((line) => line.trim()).filter(Boolean).slice(0, 2).map((line) => line.length > 10 ? line.slice(0, 10) : line).join("\n") || text.slice(0, 10);
}
function stripForbidden(text, words) {
	let next = text;
	for (const word of words) {
		if (!word.trim()) continue;
		next = next.split(word).join("");
	}
	return next.replace(/\s{2,}/g, " ").trim();
}
function buildMockPlan(data) {
	const name = data.eventName.trim();
	const when = data.schedule.trim() || "近期檔期";
	const where = data.location.trim() || "到店";
	const audience = data.audience.trim();
	const features = data.features.trim() || data.product.trim() || name;
	const style = data.style.trim() || data.voice || "沉靜、具體";
	const offer = data.offer.trim();
	const ctaPool = (data.preferredCtas || "").split(/[／/,，]/).map((item) => item.trim()).filter(Boolean);
	const slogan = (data.slogans || "").split(/[／/]/)[0]?.trim();
	const cta = stripForbidden(ctaPool[0] || (data.goal === "traffic" ? "查看地點" : "了解活動"), data.forbiddenWords);
	const templateId = pickTemplate(data.goal, data.wantCarousel);
	const headline = clipHeadline(name.replace(/[（(].*$/, ""));
	const hook = slogan || (offer ? `${name}，${offer}。` : `${name}，只在${when}。`);
	const concept = stripForbidden(`${name}把「${features}」講給${audience}聽。目的是${goalLabel(data.goal)}，語氣維持${style}，不靠叫賣。`, data.forbiddenWords);
	const insight = `${audience}要的是可以相信的理由，不是更大聲的促銷。把時間（${when}）與場域（${where}）講清楚，特色只留一句能被記住的。`;
	const visualTheme = data.imageStyle?.trim() || `${style}；主視覺放現場或物件，文字區留白。`;
	const visualDirection = `畫面用品牌色做底，上半主視覺、下半標題。風格：${style}。避免雜訊與浮水印。`;
	const subhead = offer || `${when} · ${where}`;
	const body = features;
	const captionCore = [
		hook,
		`${when}${where ? `，${where}` : ""}。`,
		features ? `這次看點：${features}。` : "",
		offer ? offer : "",
		slogan ? slogan : ""
	].filter(Boolean).join("\n");
	const pages = data.wantCarousel ? [
		{
			role: "cover",
			headline,
			subhead,
			body: hook,
			cta,
			visualNote: "封面：主視覺滿版或上半，標題最多兩行。",
			templateId: "product"
		},
		{
			role: "problem",
			headline: clipHeadline("為什麼現在看"),
			subhead: audience,
			body: insight,
			cta,
			visualNote: "痛點頁只留一句真正的猶豫，不要叫賣。",
			templateId: "quote"
		},
		{
			role: "detail",
			headline: clipHeadline(features.split(/[、，,]/)[0] || "活動內容"),
			subhead: when,
			body: features,
			cta,
			visualNote: "重點頁最多三件事：時間、特色、對象。",
			templateId: "editorial"
		},
		{
			role: "proof",
			headline: clipHeadline(where),
			subhead: audience,
			body: insight,
			cta,
			visualNote: "案例頁用現場、物件或一句可被相信的話。",
			templateId: "product"
		},
		{
			role: "cta",
			headline: clipHeadline(cta),
			subhead: `${when} · ${where}`,
			body: offer || "來的時候帶這則貼文即可。",
			cta,
			visualNote: "行動頁只留時間、地點、CTA。",
			templateId: "offer"
		},
		{
			role: "close",
			headline: clipHeadline(slogan || hook),
			subhead: data.brandName,
			body: offer || `${when}，${where}。`,
			cta,
			visualNote: "結尾頁一句話收束，可截圖分享。",
			templateId: "quote"
		}
	] : [{
		role: "cover",
		headline,
		subhead,
		body: features,
		cta,
		visualNote: "單張：主視覺 + 標題 + CTA，資訊不要超過三層。",
		templateId
	}];
	const storyBeats = data.wantStory ? [
		`${name}開始`,
		features.split(/[、，,]/)[0] || "現場特色",
		`${cta} · ${where}`
	] : [];
	const hashtags = [
		hashTag(data.brandName),
		hashTag(name),
		hashTag(where),
		"#到店",
		data.goal === "ugc" ? "#打卡" : "#活動"
	].filter(Boolean);
	return {
		campaignName: name,
		concept,
		insight,
		hook: stripForbidden(hook, data.forbiddenWords),
		visualTheme,
		visualDirection,
		templateId,
		colorMood: visualTheme,
		eyebrow: data.goal === "conversion" ? "LIMITED" : "EVENT",
		headline,
		subhead,
		body,
		cta,
		captions: [{
			style: "敘事",
			text: stripForbidden(captionCore, data.forbiddenWords)
		}, {
			style: "短句",
			text: stripForbidden(`${hook}\n${cta}`, data.forbiddenWords)
		}],
		hashtags,
		storyBeats,
		carouselPages: pages,
		assetNeeds: [
			{
				kind: "photo",
				title: "活動主視覺",
				detail: `能代表「${name}」的現場或物件，直式優先。`,
				required: true
			},
			{
				kind: "logo",
				title: "品牌標誌",
				detail: "透明底或淺底版本，放角落不壓主體。",
				required: true
			},
			{
				kind: "background",
				title: "留白／材質背景",
				detail: "給標題頁使用，避免雜亂桌面。",
				required: false
			},
			...data.wantStory ? [{
				kind: "people",
				title: "手部或服務瞬間",
				detail: "限動第二則用，不要擺拍網紅姿勢。",
				required: false
			}] : []
		],
		checklist: [
			"標題不超過兩行，且落在安全區內",
			"時間與地點至少在一頁出現",
			"CTA 可讀、對比足夠",
			"沒用品牌禁用詞",
			data.wantCarousel ? "輪播末頁有明確行動" : "單張資訊不超過三層",
			"Logo 沒壓到主體"
		],
		altText: `${name}的宣傳畫面，標題為「${headline.replace("\n", " ")}」，標示${when}、${where}。`,
		qaNotes: ["避免把價格或焦慮話術放進主畫面", `風格維持：${style}`],
		generatedAt: Date.now(),
		source: "mock"
	};
}
function extractJson(text) {
	const trimmed = text.trim();
	const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
	const raw = fence ? fence[1] : trimmed;
	const start = raw.indexOf("{");
	const end = raw.lastIndexOf("}");
	if (start === -1 || end === -1) throw new Error("模型未回傳 JSON");
	return JSON.parse(raw.slice(start, end + 1));
}
function toPlan(parsed, source) {
	const headline = parsed.headline || parsed.hook || parsed.campaignName;
	return {
		campaignName: parsed.campaignName || headline.replace(/\n/g, " ") || "未命名活動",
		concept: parsed.concept || parsed.insight,
		insight: parsed.insight,
		hook: parsed.hook || headline,
		visualTheme: parsed.visualTheme || parsed.colorMood,
		visualDirection: parsed.visualDirection,
		templateId: parsed.templateId,
		colorMood: parsed.colorMood || parsed.visualTheme,
		eyebrow: parsed.eyebrow,
		headline,
		subhead: parsed.subhead,
		body: parsed.body,
		cta: parsed.cta || "了解更多",
		captions: parsed.captions.length ? parsed.captions : [{
			style: "敘事",
			text: parsed.hook || parsed.concept || headline
		}],
		hashtags: parsed.hashtags.map((h) => h.startsWith("#") ? h : `#${h}`),
		storyBeats: parsed.storyBeats,
		carouselPages: parsed.carouselPages,
		assetNeeds: parsed.assetNeeds,
		checklist: parsed.checklist,
		altText: parsed.altText,
		qaNotes: parsed.qaNotes,
		generatedAt: Date.now(),
		source
	};
}
function planFromModel(text) {
	try {
		const plan = toPlan(PlanJsonSchema.parse(extractJson(text)), "live");
		if (!plan.headline && !plan.concept) return null;
		return plan;
	} catch {
		return null;
	}
}
function describeAdapter(available) {
	if (available) return {
		available: true,
		adapter: "live",
		label: "已連線 AI 企劃",
		detail: "會依品牌規範與活動需求生成結構化企劃，再套進專案與畫布。"
	};
	return {
		available: false,
		adapter: "mock",
		label: "本機企劃草案",
		detail: "目前沒有連到 AI 服務。按下生成會用本機規則寫一版可編輯、可套用的草案，不是線上模型回覆。"
	};
}
var getCampaignAiStatus_createServerFn_handler = createServerRpc({
	id: "51052173a1f06126bc3572058baa979c40dbe318b507888eb1c255646b3bd1fe",
	name: "getCampaignAiStatus",
	filename: "src/lib/ai/campaign.ts"
}, (opts) => getCampaignAiStatus.__executeServer(opts));
var getCampaignAiStatus = createServerFn({ method: "POST" }).handler(getCampaignAiStatus_createServerFn_handler, async () => {
	return describeAdapter(Boolean(process.env.XAI_API_KEY));
});
async function generateLive(data) {
	const apiKey = process.env.XAI_API_KEY;
	if (!apiKey) return {
		ok: true,
		plan: buildMockPlan(data),
		adapter: "mock"
	};
	const forbidden = data.forbiddenWords.filter(Boolean).join("、") || "無";
	const deliverables = [
		data.wantPost ? "單張貼文" : null,
		data.wantCarousel ? "輪播" : null,
		data.wantStory ? "限時動態" : null,
		data.wantReels ? "Reels 封面" : null
	].filter(Boolean).join("、");
	const prompt = `你是資深 Instagram 網宣企劃，服務台灣品牌。請只輸出 JSON，不要 markdown。

品牌：${data.brandName} ${data.handle}
語氣：${data.voice || "專業、克制"}
可說：${data.doSay || "具體、真實"}
不可說：${data.dontSay || "誇大、叫賣"}
禁用詞：${forbidden}
固定標語：${data.slogans || "無"}
常用 CTA：${data.preferredCtas || "無"}
圖片風格：${data.imageStyle || "無"}

活動名稱：${data.eventName}
時間：${data.schedule || "未填"}
地點：${data.location || "未填"}
產品／內容：${data.product || data.eventName}
優惠：${data.offer || "無"}
受眾：${data.audience}
目的：${data.goal}
特色：${data.features || "無"}
希望風格：${data.style || "無"}
需要產出：${deliverables || "單張貼文"}
補充：${data.notes || "無"}

JSON 欄位：
campaignName, concept, insight, hook, visualTheme, visualDirection,
templateId(editorial|product|offer|quote), colorMood,
eyebrow, headline, subhead, body, cta,
captions[{style,text}] 2-3 則（繁中，適合 IG，不要 emoji 堆砌，最多一個表情），
hashtags 8-12 個（含品牌名與精準詞），
storyBeats 3 則限動分鏡（若不需要限動可給空陣列），
carouselPages[{role:cover|problem|detail|proof|cta|close,headline,subhead,body,cta,visualNote,templateId}] ${data.wantCarousel ? "必須 6 頁，角色依序 cover, problem, detail, proof, cta, close" : "1 頁封面"},
assetNeeds[{kind:photo|people|background|logo|illustration,title,detail,required}],
checklist 5-8 則發布前檢查,
altText, qaNotes 2-4 則設計注意。

headline 可含換行 \\n，最多兩行，每行不超過 10 個中文。
eyebrow 用英文或短中文，不超過 22 字。
cta 2-6 字。
文案避免禁用詞，不要「限時瘋搶／錯過就沒有」。
concept 是宣傳核心概念（2-3 句）。visualTheme 是視覺主題。`;
	const res = await fetch("https://api.x.ai/v1/chat/completions", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${apiKey}`
		},
		body: JSON.stringify({
			model: "grok-4.5",
			temperature: .6,
			max_tokens: 4096,
			response_format: { type: "json_object" },
			messages: [{
				role: "system",
				content: "You are a senior Instagram campaign planner for Taiwan brands. Reply with a single JSON object only."
			}, {
				role: "user",
				content: prompt
			}]
		})
	});
	if (!res.ok) return {
		ok: false,
		error: `企劃服務暫時無法使用（${res.status}）。可改用本機草案。`,
		adapter: "live"
	};
	const plan = planFromModel((await res.json()).choices?.[0]?.message?.content ?? "");
	if (!plan) return {
		ok: false,
		error: "AI 回傳無法解析。可再試一次，或改用本機草案。",
		adapter: "live"
	};
	if (data.wantCarousel) plan.carouselPages = completeCarouselPages(plan.carouselPages, plan);
	return {
		ok: true,
		plan,
		adapter: "live"
	};
}
function parseBriefInput(input) {
	if (input && typeof input === "object" && "data" in input) {
		const inner = input.data;
		if (inner && typeof inner === "object" && "eventName" in inner) return BriefInputSchema.parse(inner);
	}
	return BriefInputSchema.parse(input);
}
var generateCampaignPlan_createServerFn_handler = createServerRpc({
	id: "33f8623ec89488020a450daf3dd1d5eaba647d90bfd212224919e7686b4ad56e",
	name: "generateCampaignPlan",
	filename: "src/lib/ai/campaign.ts"
}, (opts) => generateCampaignPlan.__executeServer(opts));
var generateCampaignPlan = createServerFn({ method: "POST" }).validator((input) => parseBriefInput(input)).handler(generateCampaignPlan_createServerFn_handler, async ({ data }) => {
	if (!Boolean(process.env.XAI_API_KEY) || data.forceMock) return {
		ok: true,
		plan: buildMockPlan(data),
		adapter: "mock"
	};
	return generateLive(data);
});
//#endregion
export { generateCampaignPlan_createServerFn_handler, getCampaignAiStatus_createServerFn_handler };
