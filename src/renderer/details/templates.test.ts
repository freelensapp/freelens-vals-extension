import { describe, expect, it } from "vitest";
import { getEditorHeight } from "./templates";

describe("getEditorHeight", () => {
  it("gives a short template 5 lines", () => {
    expect(getEditorHeight("")).toBe(5 * 18);
    expect(getEditorHeight("a: 1\nb: 2")).toBe(5 * 18);
  });

  it("gives a template one line per line", () => {
    expect(getEditorHeight(Array(12).fill("a: 1").join("\n"))).toBe(12 * 18);
  });

  it("gives a long template 20 lines", () => {
    expect(getEditorHeight(Array(50).fill("a: 1").join("\n"))).toBe(20 * 18);
  });
});
