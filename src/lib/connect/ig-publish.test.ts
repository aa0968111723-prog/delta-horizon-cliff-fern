import assert from "node:assert/strict";
import test from "node:test";
import { captionForInstagram, publicImageUrl } from "./ig-publish.ts";

test("only https public urls can go to Graph", () => {
  assert.equal(publicImageUrl("https://cdn.example.com/tea.png"), "https://cdn.example.com/tea.png");
  assert.equal(publicImageUrl("http://cdn.example.com/tea.png"), null);
  assert.equal(publicImageUrl("data:image/png;base64,abc"), null);
  assert.equal(publicImageUrl("https://127.0.0.1:8080/x.png"), null);
});

test("instagram caption is clipped without reviewer fields", () => {
  const text = captionForInstagram(`${"啊".repeat(3000)}\n帶一個朋友來就好。`);
  assert.equal(text.length, 2200);
  assert.equal("assignee" in { caption: text }, false);
});
