import { s as object, t as _enum } from "../_libs/zod.mjs";
import { a as setCookie$1, i as getCookie, t as createServerFn } from "./ssr.mjs";
import { t as createServerRpc } from "./createServerRpc-A6pJPYTF.mjs";
import { createDecipheriv, createHash } from "node:crypto";
//#region node_modules/.nitro/vite/services/ssr/assets/status-BZcDTPSH.js
var PROVIDERS = {
	drive: {
		id: "drive",
		name: "Google Drive",
		purpose: "讀社團雲端硬碟裡的歷屆照片、企劃、社課資料，變成 AI 可以搜尋的素材庫。",
		reads: [
			"活動照片",
			"影片",
			"Google Docs 企劃",
			"Google Sheets",
			"PDF 文宣",
			"Logo 與社員照片"
		],
		scopes: ["https://www.googleapis.com/auth/drive.readonly", "https://www.googleapis.com/auth/drive.metadata.readonly"],
		envKeys: {
			clientId: "GOOGLE_CLIENT_ID",
			clientSecret: "GOOGLE_CLIENT_SECRET"
		},
		authorizeUrl: "https://accounts.google.com/o/oauth2/v2/auth",
		tokenUrl: "https://oauth2.googleapis.com/token",
		docsLabel: "Google OAuth 2.0 + Drive API"
	},
	canva: {
		id: "canva",
		name: "Canva",
		purpose: "讀過去的 Canva 設計與縮圖，讓 AI 延續社團自己的版面與品牌感。",
		reads: [
			"設計清單",
			"縮圖",
			"最近使用",
			"資料夾",
			"品牌樣板"
		],
		scopes: [
			"design:meta:read",
			"design:content:read",
			"folder:read",
			"asset:read"
		],
		envKeys: {
			clientId: "CANVA_CLIENT_ID",
			clientSecret: "CANVA_CLIENT_SECRET"
		},
		authorizeUrl: "https://www.canva.com/api/oauth/authorize",
		tokenUrl: "https://api.canva.com/rest/v1/oauth/token",
		docsLabel: "Canva Connect API"
	},
	instagram: {
		id: "instagram",
		name: "Instagram",
		purpose: "讀禪學社 IG 的過去貼文與成效，形成 Instagram Content Memory。",
		reads: [
			"Profile",
			"過去貼文",
			"輪播",
			"Reels",
			"Caption",
			"互動數據",
			"Insights"
		],
		scopes: [
			"instagram_basic",
			"instagram_manage_insights",
			"pages_show_list",
			"pages_read_engagement"
		],
		envKeys: {
			clientId: "INSTAGRAM_APP_ID",
			clientSecret: "INSTAGRAM_APP_SECRET"
		},
		authorizeUrl: "https://www.facebook.com/v21.0/dialog/oauth",
		tokenUrl: "https://graph.facebook.com/v21.0/oauth/access_token",
		docsLabel: "Meta / Instagram Graph API（官方）"
	}
};
var PROVIDER_ORDER = [
	"drive",
	"canva",
	"instagram"
];
var COOKIE_PREFIX = "zen_conn_";
function cookieName(provider) {
	return `${COOKIE_PREFIX}${provider}`;
}
/**
* 加密金鑰來自平台注入的祕密。沒有專用金鑰時退回其他伺服器端祕密，
* 都沒有的話就不寫入——寧可不能連接，也不要把 token 明文放在 cookie 裡。
*/
function encryptionKey() {
	const secret = process.env.CONNECTION_ENCRYPTION_KEY ?? process.env.BETTER_AUTH_SECRET ?? process.env.AUTH_SECRET ?? null;
	if (!secret) return null;
	return createHash("sha256").update(secret).digest();
}
function decrypt(raw) {
	const key = encryptionKey();
	if (!key) return null;
	const [ivPart, tagPart, dataPart] = raw.split(".");
	if (!ivPart || !tagPart || !dataPart) return null;
	try {
		const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(ivPart, "base64url"));
		decipher.setAuthTag(Buffer.from(tagPart, "base64url"));
		return Buffer.concat([decipher.update(Buffer.from(dataPart, "base64url")), decipher.final()]).toString("utf8");
	} catch {
		return null;
	}
}
function readConnection(provider) {
	let raw;
	try {
		raw = getCookie(cookieName(provider));
	} catch {
		return null;
	}
	if (!raw) return null;
	const json = decrypt(raw);
	if (!json) return null;
	try {
		const parsed = JSON.parse(json);
		return parsed.provider === provider ? parsed : null;
	} catch {
		return null;
	}
}
function clearConnection(provider) {
	try {
		setCookie$1(cookieName(provider), "", {
			httpOnly: true,
			secure: true,
			sameSite: "lax",
			path: "/",
			maxAge: 0
		});
	} catch {}
}
/**
* 連接狀態一律在伺服器端判斷：憑證有沒有設定、有沒有已授權的 token。
* 前端只拿得到狀態與帳號名稱，永遠拿不到 token。
*/
var getConnections_createServerFn_handler = createServerRpc({
	id: "e498c792719d53262e51b191ced4639d21fb36dbb86f7760756ad6421c667a7e",
	name: "getConnections",
	filename: "src/lib/connections/status.ts"
}, (opts) => getConnections.__executeServer(opts));
var getConnections = createServerFn({ method: "POST" }).handler(getConnections_createServerFn_handler, async () => {
	return PROVIDER_ORDER.map((id) => describe(id));
});
function describe(id) {
	const spec = PROVIDERS[id];
	const configured = Boolean(process.env[spec.envKeys.clientId] && process.env[spec.envKeys.clientSecret]);
	const session = configured ? readConnection(id) : null;
	if (!configured) return {
		id,
		name: spec.name,
		purpose: spec.purpose,
		reads: spec.reads,
		state: "unconfigured",
		detail: `這個環境還沒有 ${spec.name} 的應用程式憑證，所以無法開始授權。憑證要由平台以環境變數注入，不會寫進程式碼裡。`,
		accountLabel: null,
		lastSyncedAt: null,
		docsLabel: spec.docsLabel
	};
	if (!session) return {
		id,
		name: spec.name,
		purpose: spec.purpose,
		reads: spec.reads,
		state: "needs-auth",
		detail: `按「連接」會跳到 ${spec.name} 的官方授權畫面，回來之後 token 只留在伺服器端。`,
		accountLabel: null,
		lastSyncedAt: null,
		docsLabel: spec.docsLabel
	};
	return {
		id,
		name: spec.name,
		purpose: spec.purpose,
		reads: spec.reads,
		state: "connected",
		detail: `已授權，可以讀取${spec.reads.slice(0, 3).join("、")}等內容。`,
		accountLabel: session.accountLabel,
		lastSyncedAt: session.lastSyncedAt,
		docsLabel: spec.docsLabel
	};
}
var DisconnectSchema = object({ id: _enum([
	"drive",
	"canva",
	"instagram"
]) });
/** 中斷：把伺服器端的 token 清掉。 */
var disconnectProvider_createServerFn_handler = createServerRpc({
	id: "5807f83ec5517a83cdda4f9caf8407aae1e4d4ece80ac783e19f8a665537a542",
	name: "disconnectProvider",
	filename: "src/lib/connections/status.ts"
}, (opts) => disconnectProvider.__executeServer(opts));
var disconnectProvider = createServerFn({ method: "POST" }).validator((input) => {
	if (input && typeof input === "object" && "data" in input) return DisconnectSchema.parse(input.data);
	return DisconnectSchema.parse(input);
}).handler(disconnectProvider_createServerFn_handler, async ({ data }) => {
	clearConnection(data.id);
	return { ok: true };
});
//#endregion
export { disconnectProvider_createServerFn_handler, getConnections_createServerFn_handler };
