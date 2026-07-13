import { normalizeLabel } from "./label";

const TAG_PATTERN = /#([\p{L}\p{N}_-]+)/gu;

export function extractTags(input: string): { label: string; tags: string[] } {
  const rawTags: string[] = [];
  const strippedLabel = input.replace(TAG_PATTERN, (_match, tag: string) => {
    rawTags.push(tag);
    return "";
  });

  return {
    label: normalizeLabel(strippedLabel),
    tags: normalizeTags(rawTags),
  };
}

export function normalizeTags(tags: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const tag of tags) {
    const normalized = tag.trim().toLocaleLowerCase("fr-FR");
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    result.push(normalized);
  }

  return result;
}

export function mergeTags(existing: string[], incoming: string[]): string[] {
  return normalizeTags([...existing, ...incoming]);
}
