import { useEffect, useState } from "react";
import { experiences as staticExperiences, type Experience } from "./data";
import { technologyNames, type TechnologyTag } from "./technologies";

// Content API Ghost (headless). Sans URL + clé, ou en cas d'erreur, on retombe sur src/data.ts.
const GHOST_URL = (import.meta.env.VITE_GHOST_URL as string | undefined)?.replace(/\/$/, "");
const GHOST_KEY = import.meta.env.VITE_GHOST_CONTENT_KEY as string | undefined;

export type GhostPost = {
  slug: string;
  title: string;
  html: string | null;
  custom_excerpt: string | null;
  meta_title: string | null;
  meta_description: string | null;
  canonical_url: string | null;
  published_at: string;
  tags?: TechnologyTag[];
};

const CURRENT = /aujourd|pr[ée]sent|en cours/i;

export function listItems(html: string | null): string[] {
  return [...(html ?? "").matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)].map((m) =>
    m[1].replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&#39;/g, "'").replace(/&quot;/g, '"').trim(),
  );
}

export function mapExperience(p: GhostPost): Experience {
  const period = p.meta_title ?? String(new Date(p.published_at).getFullYear());
  return {
    id: p.slug,
    company: p.title,
    period,
    about: p.custom_excerpt ?? "",
    role: p.meta_description ?? "",
    bullets: listItems(p.html),
    stack: technologyNames(p.tags),
    current: CURRENT.test(period),
  };
}

async function fetchPosts(tagSlug: string): Promise<GhostPost[]> {
  const q = new URLSearchParams({
    key: GHOST_KEY!, filter: `tag:${tagSlug}`, include: "tags", formats: "html",
    order: "published_at desc", limit: "all",
  });
  const res = await fetch(`${GHOST_URL}/ghost/api/content/posts/?${q}`);
  if (!res.ok) throw new Error(`Ghost ${res.status}`);
  return (await res.json()).posts as GhostPost[];
}

export type CvContent = { experiences: Experience[]; source: "ghost" | "static" };
const fallback: CvContent = { experiences: staticExperiences, source: "static" };

export function useCvContent(): CvContent {
  const [content, setContent] = useState<CvContent>(fallback);
  useEffect(() => {
    if (!GHOST_URL || !GHOST_KEY) return;
    let alive = true;
    fetchPosts("hash-experience")
      .then((exp) => {
        // Ghost vide ou pas encore seedé : on garde le contenu statique.
        if (alive && exp.length) setContent({ experiences: exp.map(mapExperience), source: "ghost" });
      })
      .catch((e) => console.warn("Ghost indisponible, contenu statique utilisé :", e));
    return () => { alive = false; };
  }, []);
  return content;
}
