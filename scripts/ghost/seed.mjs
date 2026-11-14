#!/usr/bin/env node
/**
 * Pousse les expériences et projets de src/data.ts dans Ghost (idempotent, par slug).
 *
 *   npm run ghost:seed -- --dry-run   # affiche les articles sans rien envoyer
 *   npm run ghost:seed                # crée ou met à jour
 *
 * Modèle de contenu (voir CLAUDE.md) :
 *   #experience : titre=entreprise, extrait=présentation, meta_title=période,
 *                 meta_description=rôle, corps=<ul> des missions, tags publics=technos
 *   #projet     : titre=nom, extrait=description, meta_title=année, canonical_url=lien, tags=technos
 */
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { loadEnv } from "../lib/env.mjs";
import { ghostClient } from "../lib/ghost-api.mjs";
import { experiences, sideProjects } from "../../src/data.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
loadEnv(join(ROOT, ".env"));

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const startYear = (period) => period.match(/\d{4}/)?.[0] ?? "2000";

export function buildPosts() {
  const exp = experiences.map((e) => ({
    slug: `cv-experience-${e.id}`,
    title: e.company,
    custom_excerpt: e.about,
    meta_title: e.duration ? `${e.period} (${e.duration})` : e.period,
    meta_description: e.role,
    html: `<ul>${e.bullets.map((b) => `<li>${esc(b)}</li>`).join("")}</ul>`,
    tags: ["#experience", ...e.stack],
    published_at: `${startYear(e.period)}-01-01T00:00:00.000Z`,
    status: "published",
  }));
  const proj = sideProjects.map((p) => ({
    slug: `cv-projet-${p.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    title: p.name,
    custom_excerpt: p.description,
    meta_title: String(p.year),
    ...(p.url ? { canonical_url: p.url } : {}),
    html: `<p>${esc(p.description)}</p>`,
    tags: ["#projet", ...p.stack],
    published_at: `${p.year}-01-01T00:00:00.000Z`,
    status: "published",
  }));
  return [...exp, ...proj];
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const posts = buildPosts();
  if (process.argv.includes("--dry-run")) {
    console.log(JSON.stringify(posts, null, 2));
    console.log(`\n${posts.length} article(s) (dry-run, rien d'envoyé)`);
  } else {
    const client = ghostClient();
    console.log(`→ Seed vers ${client.baseUrl}`);
    for (const p of posts) {
      const existing = await client.findPostBySlug(p.slug);
      if (existing) {
        await client.updatePost(existing.id, { ...p, updated_at: existing.updated_at });
        console.log(`  ~ mis à jour ${p.slug}`);
      } else {
        await client.createPost(p);
        console.log(`  + créé       ${p.slug}`);
      }
    }
  }
}
