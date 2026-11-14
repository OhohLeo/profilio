#!/usr/bin/env node
/** Compare src/data.ts (source) avec les articles #experience / #projet vivants dans Ghost. Code retour 1 s'il y a un écart. */
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { loadEnv } from "../lib/env.mjs";
import { ghostClient } from "../lib/ghost-api.mjs";
import { buildPosts } from "../lib/posts.mjs";

loadEnv(join(dirname(fileURLToPath(import.meta.url)), "..", "..", ".env"));

const FIELDS = ["title", "custom_excerpt", "meta_title", "meta_description", "canonical_url", "html"];
const norm = (v) => (v ?? "").toString().replace(/\s+/g, " ").trim();
const client = ghostClient();
const live = new Map((await client.listPosts("tag:[hash-experience,hash-projet]")).map((p) => [p.slug, p]));
const wanted = buildPosts();
let drift = 0;

for (const w of wanted) {
  const l = live.get(w.slug);
  if (!l) { console.log(`+ absent de Ghost   ${w.slug}`); drift++; continue; }
  const diffs = FIELDS.filter((f) => norm(w[f]) !== norm(l[f]));
  const liveTags = (l.tags ?? []).map((t) => t.name).filter((n) => !n.startsWith("#")).sort().join(",");
  const wantTags = w.tags.filter((t) => !t.startsWith("#")).sort().join(",");
  if (liveTags !== wantTags) diffs.push("tags");
  if (diffs.length) { console.log(`~ différent         ${w.slug} (${diffs.join(", ")})`); drift++; }
  live.delete(w.slug);
}
for (const slug of live.keys()) console.log(`- seulement dans Ghost ${slug}`);

console.log(drift || live.size ? `\n${drift} écart(s), ${live.size} article(s) hors data.ts` : "✓ Ghost est synchronisé avec src/data.ts");
process.exit(drift || live.size ? 1 : 0);
