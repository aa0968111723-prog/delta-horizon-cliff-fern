import fs from "node:fs";

const path = "src/stores/studio-store.ts";
let src = fs.readFileSync(path, "utf8");
const orig = src;

const needed = [
  "SEED_ASSETS",
  "SEED_BRAND",
  "SEED_BRAND_ID",
  "SEED_CAMPAIGNS",
  "SEED_DRAFT_ID",
  "SEED_IG_MEMORY",
  "SEED_PROJECT_ID",
  "SEED_REMOTE_FILES",
  "SEED_SCHEDULE",
  "createSeedDraft",
  "createSeedProject",
];

if (!/from "@\/lib\/studio\/seed"/.test(src)) {
  throw new Error("seed import line not found");
}

src = src.replace(
  /import \{([^}]*)\} from "@\/lib\/studio\/seed";/,
  (_m, inner) => {
    const names = inner
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    for (const extra of needed) {
      if (!names.includes(extra)) names.push(extra);
    }
    return "import {\n  " + names.join(",\n  ") + ",\n} from \"@/lib/studio/seed\";";
  },
);

if (!src.includes("const DEFAULT_CONNECTIONS")) {
  const needle = "const STORAGE_KEY = \"tamkang-zen-studio-v1\";";
  if (!src.includes(needle)) throw new Error("STORAGE_KEY not found");
  src = src.replace(
    needle,
    needle + "\nconst DEFAULT_CONNECTIONS: { provider: string }[] = [];",
  );
}

src = src.replace(/campaigns: SEED_CAMPAIGNS,/, "campaigns: SEED_CAMPAIGNS ?? [],");
src = src.replace(/schedule: SEED_SCHEDULE,/, "schedule: SEED_SCHEDULE ?? [],");
src = src.replace(/igMemory: SEED_IG_MEMORY,/, "igMemory: SEED_IG_MEMORY ?? [],");
src = src.replace(/remoteFiles: SEED_REMOTE_FILES,/, "remoteFiles: SEED_REMOTE_FILES ?? [],");
src = src.replace(/connections: DEFAULT_CONNECTIONS,/, "connections: DEFAULT_CONNECTIONS ?? [],");
src = src.replace(/const seed = SEED_SCHEDULE\.find/g, "const seed = (SEED_SCHEDULE ?? []).find");
src = src.replace(/\(state\.campaigns \?\? SEED_CAMPAIGNS\)/g, "(state.campaigns ?? SEED_CAMPAIGNS ?? [])");
src = src.replace(/\(state\.schedule \?\? SEED_SCHEDULE\)/g, "(state.schedule ?? SEED_SCHEDULE ?? [])");

if (src === orig) {
  console.log("already patched or no changes");
  process.exit(0);
}
fs.writeFileSync(path, src);
console.log("patched studio-store.ts", src.length - orig.length, "bytes delta");
