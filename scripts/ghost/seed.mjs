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
import { buildPosts } from "../lib/posts.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
loadEnv(join(ROOT, ".env"));

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
