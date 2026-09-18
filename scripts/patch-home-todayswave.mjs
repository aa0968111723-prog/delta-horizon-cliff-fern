import fs from "node:fs";

const path = "src/components/home/home-page.tsx";
let src = fs.readFileSync(path, "utf8");
const orig = src;

if (!src.includes("todaysWave")) {
  console.log("already patched or no todaysWave");
  process.exit(0);
}

const block =
  /\n  const suggestion =\n    todaysWave\?\.hook \|\|\n    focus\?\.painPoint \|\|\n    localTodayIdeas\(\)\[0\]\?\.hook \|\|\n    "第一次來，會經歷什麼？";\n/;

if (!block.test(src)) {
  throw new Error("todaysWave present but suggestion block pattern mismatch");
}

src = src.replace(block, "\n");
fs.writeFileSync(path, src);
console.log("patched home-page.tsx", src.length - orig.length, "bytes delta");
