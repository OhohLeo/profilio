export type TechnologyTag = { name: string; slug?: string; visibility?: string };
export type MatchMode = "any" | "all";

export function technologyNames(tags: TechnologyTag[] = []): string[] {
  return tags.filter((tag) => tag.visibility !== "internal" && !tag.slug?.startsWith("hash-") && !tag.name.trim().startsWith("#"))
    .map((tag) => tag.name.trim()).filter(Boolean);
}

export function matchesTechnologies(stack: string[], selected: string[], mode: MatchMode): boolean {
  return selected.length === 0 || (mode === "all" ? selected.every((name) => stack.includes(name)) : selected.some((name) => stack.includes(name)));
}
