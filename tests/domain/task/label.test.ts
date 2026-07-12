import { describe, expect, it } from "vitest";
import { normalizeLabel, labelsMatch } from "@/domain/task/label";

describe("normalizeLabel", () => {
  it("trims leading and trailing whitespace", () => {
    expect(normalizeLabel("  Boire de l'eau  ")).toBe("Boire de l'eau");
  });

  it("collapses repeated internal whitespace", () => {
    expect(normalizeLabel("Boire   de l'eau")).toBe("Boire de l'eau");
  });
});

describe("labelsMatch", () => {
  it("matches labels that only differ by case", () => {
    expect(labelsMatch("Boire de l'eau", "boire de l'eau")).toBe(true);
  });

  it("matches labels that only differ by surrounding or repeated whitespace", () => {
    expect(labelsMatch("  Boire de l'eau", "Boire   de l'eau  ")).toBe(true);
  });

  it("does not match different labels", () => {
    expect(labelsMatch("Boire de l'eau", "Faire du sport")).toBe(false);
  });
});
