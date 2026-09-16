import { s as object, t as _enum } from "../_libs/zod.mjs";
import { t as createServerFn } from "./ssr.mjs";
import { C as createSsrRpc } from "./router-CCaD8IgA.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/status-CfaffkOt.js
/**
* 連接狀態一律在伺服器端判斷：憑證有沒有設定、有沒有已授權的 token。
* 前端只拿得到狀態與帳號名稱，永遠拿不到 token。
*/
var getConnections = createServerFn({ method: "POST" }).handler(createSsrRpc("e498c792719d53262e51b191ced4639d21fb36dbb86f7760756ad6421c667a7e"));
var DisconnectSchema = object({ id: _enum([
	"drive",
	"canva",
	"instagram"
]) });
/** 中斷：把伺服器端的 token 清掉。 */
var disconnectProvider = createServerFn({ method: "POST" }).validator((input) => {
	if (input && typeof input === "object" && "data" in input) return DisconnectSchema.parse(input.data);
	return DisconnectSchema.parse(input);
}).handler(createSsrRpc("5807f83ec5517a83cdda4f9caf8407aae1e4d4ece80ac783e19f8a665537a542"));
//#endregion
export { getConnections as n, disconnectProvider as t };
