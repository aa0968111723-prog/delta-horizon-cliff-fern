import { P as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { tt as cn } from "./studio-store-BqpaoTm7.mjs";
import { t as getAssetStorage } from "./asset-storage-CpaE1sxh.mjs";
import { W as HardDrive } from "../_libs/lucide-react.mjs";
import { v as Link } from "../_libs/@tanstack/react-router+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/storage-notice-CtwZWNSK.js
var import_jsx_runtime = require_jsx_runtime();
function BrandSubnav({ current }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "inline-flex rounded-lg bg-surface-2 p-1",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
			to: "/brand",
			className: cn("flex h-9 items-center rounded-md px-3 text-sm", current === "brand" ? "bg-surface text-fg shadow-[var(--shadow-border)]" : "text-muted"),
			children: "品牌規範"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
			to: "/assets",
			className: cn("flex h-9 items-center rounded-md px-3 text-sm", current === "assets" ? "bg-surface text-fg shadow-[var(--shadow-border)]" : "text-muted"),
			children: "素材庫"
		})]
	});
}
function StorageNotice({ className }) {
	const storage = getAssetStorage();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
		className: cn("flex items-start gap-2 rounded-xl bg-surface px-3 py-2.5 text-xs text-muted shadow-[var(--shadow-border)]", className),
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(HardDrive, { className: "mt-0.5 size-3.5 shrink-0" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [storage.label, "。檔案只存在這個瀏覽器，尚未同步到雲端；清除網站資料或換裝置不會帶過去。"] })]
	});
}
//#endregion
export { StorageNotice as n, BrandSubnav as t };
