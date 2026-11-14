/** Transforme src/data.ts en articles Ghost (modèle de contenu documenté dans CLAUDE.md). */
import { experiences, sideProjects } from "../../src/data.ts";

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
