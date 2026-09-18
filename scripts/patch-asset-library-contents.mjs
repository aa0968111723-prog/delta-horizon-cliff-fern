import fs from "node:fs";

const path = "src/components/assets/asset-library.tsx";
let src = fs.readFileSync(path, "utf8");
const orig = src;

src = src.replace(
  "const campaigns = useStudio((s) => s.campaigns);\n  const contents = useStudio((s) => s.contents);",
  "const campaigns = useStudio((s) => s.campaigns) ?? [];\n  const contents = useStudio((s) => s.contents) ?? [];",
);

src = src.replace(
  "const assets = useStudio((s) => s.assets);",
  "const assets = useStudio((s) => s.assets) ?? [];",
);

src = src.replace(
  "const remoteFiles = useStudio((s) => s.remoteFiles);",
  "const remoteFiles = useStudio((s) => s.remoteFiles) ?? [];",
);

src = src.replace(
  "collectUsedAssetIds(projects, brands, [...campaigns, ...contents])",
  "collectUsedAssetIds(projects ?? [], brands ?? [], [...(campaigns ?? []), ...(contents ?? [])])",
);

if (src === orig) {
  console.log("already patched or no changes");
  process.exit(0);
}
fs.writeFileSync(path, src);
console.log("patched asset-library.tsx", src.length - orig.length, "bytes delta");
