#!/usr/bin/env node
/** Sauvegarde les articles #experience / #projet de Ghost dans snapshots/ghost/posts/<slug>.json (diff lisible dans git). */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { loadEnv } from "../lib/env.mjs";
import { ghostClient } from "../lib/ghost-api.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
loadEnv(join(ROOT, ".env"));

const FIELDS = ["slug", "title", "status", "custom_excerpt", "meta_title", "meta_description", "canonical_url", "published_at", "html"];
const client = ghostClient();
const dir = join(ROOT, "snapshots", "ghost", "posts");
mkdirSync(dir, { recursive: true });

const posts = await client.listPosts("tag:[hash-experience,hash-projet]");
for (const p of posts) {
  const out = Object.fromEntries(FIELDS.map((f) => [f, p[f] ?? null]));
  out.tags = (p.tags ?? []).map((t) => t.name);
  writeFileSync(join(dir, `${p.slug}.json`), JSON.stringify(out, null, 2) + "\n");
}
console.log(`✓ ${posts.length} article(s) sauvegardés dans snapshots/ghost/posts/`);
