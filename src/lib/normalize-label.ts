export function normalizeLabel(label: string): string {
  return label.trim().replace(/\s+/g, " ");
}

export function labelKey(label: string): string {
  return normalizeLabel(label).toLocaleLowerCase("fr-FR");
}
