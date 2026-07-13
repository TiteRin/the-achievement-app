import { describe, expect, it } from "vitest";
import { extractTags, mergeTags, normalizeTags } from "@/domain/task/tag";

describe("extractTags", () => {
  it("extracts a single trailing tag", () => {
    expect(extractTags("Faire la vaisselle #corvées")).toEqual({
      label: "Faire la vaisselle",
      tags: ["corvées"],
    });
  });

  it("extracts multiple tags", () => {
    expect(extractTags("Développer une application #travail #code")).toEqual({
      label: "Développer une application",
      tags: ["travail", "code"],
    });
  });

  it("returns the normalized label unchanged when there are no tags", () => {
    expect(extractTags("Aller se promener")).toEqual({
      label: "Aller se promener",
      tags: [],
    });
  });

  it("extracts a tag in the middle of the text and collapses the leftover whitespace", () => {
    expect(extractTags("Faire du #sport le matin")).toEqual({
      label: "Faire du le matin",
      tags: ["sport"],
    });
  });

  it("dedupes repeated tags case-insensitively", () => {
    expect(extractTags("Lire #Lecture un livre #lecture")).toEqual({
      label: "Lire un livre",
      tags: ["lecture"],
    });
  });

  it("handles accented tag characters", () => {
    expect(extractTags("Aller se promener #santémentale")).toEqual({
      label: "Aller se promener",
      tags: ["santémentale"],
    });
  });

  it("returns an empty label when the input is only tags", () => {
    expect(extractTags("#travail #code")).toEqual({
      label: "",
      tags: ["travail", "code"],
    });
  });

  it("leaves a bare # with nothing after it as literal text", () => {
    expect(extractTags("Score : 3 # 4")).toEqual({
      label: "Score : 3 # 4",
      tags: [],
    });
  });
});

describe("normalizeTags", () => {
  it("trims and lowercases each tag", () => {
    expect(normalizeTags([" Travail ", "CODE"])).toEqual(["travail", "code"]);
  });

  it("dedupes case-insensitively while preserving first-seen order", () => {
    expect(normalizeTags(["Travail", "code", "travail"])).toEqual(["travail", "code"]);
  });

  it("returns an empty array for an empty input", () => {
    expect(normalizeTags([])).toEqual([]);
  });

  it("is idempotent on already-normalized input", () => {
    expect(normalizeTags(["travail", "code"])).toEqual(["travail", "code"]);
  });
});

describe("mergeTags", () => {
  it("unions existing and incoming tags, deduped", () => {
    expect(mergeTags(["corvées"], ["maison", "corvées"])).toEqual(["corvées", "maison"]);
  });

  it("returns just the normalized incoming tags when existing is empty", () => {
    expect(mergeTags([], ["Travail", "travail"])).toEqual(["travail"]);
  });

  it("returns the existing tags unchanged when incoming is empty", () => {
    expect(mergeTags(["corvées"], [])).toEqual(["corvées"]);
  });
});
