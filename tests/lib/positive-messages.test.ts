import { describe, expect, it } from "vitest";
import { randomPositiveMessage } from "@/lib/positive-messages";

describe("randomPositiveMessage", () => {
  it("returns one of the given messages", () => {
    const messages = ["A", "B", "C"];
    const result = randomPositiveMessage(messages);
    expect(messages).toContain(result);
  });

  it("returns the only message when there is just one", () => {
    expect(randomPositiveMessage(["Only one"])).toBe("Only one");
  });
});
