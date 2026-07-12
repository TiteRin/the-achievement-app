export class EmptyTaskLabelError extends Error {
  constructor() {
    super("Task label cannot be empty");
    this.name = "EmptyTaskLabelError";
  }
}

export function normalizeLabel(label: string): string {
  return label.trim().replace(/\s+/g, " ");
}

export function labelsMatch(a: string, b: string): boolean {
  return labelKey(a) === labelKey(b);
}

export function labelKey(label: string): string {
  return normalizeLabel(label).toLocaleLowerCase("fr-FR");
}
