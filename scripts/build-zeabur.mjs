#!/usr/bin/env node
/**
 * Zeabur / zbpack entry: force NITRO_PRESET=node-server so vite emits
 * `.output/server/index.mjs` instead of Vercel serverless output.
 */
import { spawnSync } from "node:child_process";

process.env.NITRO_PRESET = "node-server";
process.env.ZEABUR = process.env.ZEABUR || "1";

const result = spawnSync("npm", ["run", "build"], {
  stdio: "inherit",
  env: process.env,
});
process.exit(result.status ?? 1);
