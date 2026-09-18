import fs from "node:fs";

const path = "src/components/home/home-page.tsx";
let src = fs.readFileSync(path, "utf8");
const orig = src;

if (!src.includes("todaysWave")) {
  console.log("already patched or todaysWave not found");
  process.exit(0);
}

const next = src.replace(
  /\n  const suggestion =\s*\n    todaysWave\?\.hook \|\|\s*\n    focus\?\.painPoint \|\|\s*\n    localTodayIdeas\(\)\[0\]\?\.hook \|\|\s*\n    "第一次來，會經歷什麼？";\n/,
  "\n",
);

if (next === src) {
  throw new Error("suggestion block not matched");
}

fs.writeFileSync(path, next);
console.log("patched home-page.tsx", next.length - orig.length, "bytes delta");
