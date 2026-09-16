import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { o as objectUrlForAsset } from "./badge-CEuq6vdv.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/use-asset-urls-CHCpEvm_.js
var import_react = /* @__PURE__ */ __toESM(require_react());
function useAssetUrls(ids) {
	const list = (0, import_react.useMemo)(() => [...new Set(ids.filter(Boolean))].sort(), [ids]);
	const key = list.join("|");
	const [urls, setUrls] = (0, import_react.useState)({});
	(0, import_react.useEffect)(() => {
		let cancelled = false;
		let attempts = 0;
		const load = async () => {
			const next = {};
			await Promise.all(list.map(async (id) => {
				try {
					const url = await objectUrlForAsset(id);
					if (url) next[id] = url;
				} catch {}
			}));
			if (cancelled) return;
			setUrls(next);
			if (list.filter((id) => !next[id]).length && attempts < 10) {
				attempts += 1;
				window.setTimeout(() => {
					load();
				}, 200);
			}
		};
		load();
		return () => {
			cancelled = true;
		};
	}, [key, list]);
	return urls;
}
//#endregion
export { useAssetUrls as t };
