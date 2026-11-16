import { describe, expect, it } from "vitest";
import { ValsSecret } from "./vals-secret-v1";

// The model exposes `static` helpers only: the objects that the host hands to
// the extension are its own `KubeObject`s, without the methods of the subclass.
// `@freelensapp/extensions` is stubbed for tests (see `test/freelens-extensions.ts`).
describe("ValsSecret (v1)", () => {
  const build = (spec: ValsSecret["spec"], status?: ValsSecret["status"]) =>
    new ValsSecret({
      apiVersion: "digitalis.io/v1",
      kind: "ValsSecret",
      metadata: {
        name: "demo",
        namespace: "default",
        selfLink: "/apis/digitalis.io/v1/namespaces/default/valssecrets/demo",
      },
      spec,
      status,
    });

  const target = { apiVersion: "v1", kind: "ConfigMap", template: "data: {}" };

  describe("getSecretName", () => {
    it("returns spec.name", () => {
      expect(ValsSecret.getSecretName(build({ name: "written", data: {} }))).toBe("written");
    });

    it("returns the object's name without spec.name", () => {
      expect(ValsSecret.getSecretName(build({ data: {} }))).toBe("demo");
    });

    it("returns the object's name without a spec", () => {
      expect(ValsSecret.getSecretName(build(undefined))).toBe("demo");
    });

    it("returns undefined with spec.target, which writes no Secret", () => {
      expect(ValsSecret.getSecretName(build({ name: "written", data: {}, target }))).toBeUndefined();
    });
  });

  describe("getDataCount", () => {
    it("counts the keys of spec.data", () => {
      const data = { username: { ref: "ref+vault://a#user" }, password: { ref: "ref+vault://a#pass" } };

      expect(ValsSecret.getDataCount(build({ data }))).toBe(2);
    });

    it("returns 0 without a spec", () => {
      expect(ValsSecret.getDataCount(build(undefined))).toBe(0);
    });
  });

  describe("getReadyCondition", () => {
    const condition = (type: string, status: "True" | "False") => ({
      type,
      status,
      reason: type === "Ready" ? "Applied" : "Other",
      message: "",
      lastTransitionTime: "2026-01-01T00:00:00Z",
    });

    it("returns the Ready condition", () => {
      const object = build(
        { data: {}, target },
        { conditions: [condition("Other", "False"), condition("Ready", "True")] },
      );

      expect(ValsSecret.getReadyCondition(object)).toMatchObject({ status: "True", reason: "Applied" });
    });

    it("returns undefined without conditions, as without spec.target", () => {
      expect(ValsSecret.getReadyCondition(build({ data: {} }))).toBeUndefined();
      expect(ValsSecret.getReadyCondition(build({ data: {} }, {}))).toBeUndefined();
    });
  });

  describe("getTargetKind", () => {
    it("returns the kind of the last applied target", () => {
      const status = {
        target: { apiVersion: "v1", kind: "ConfigMap", name: "demo", namespace: "default", mode: "create" as const },
      };

      expect(ValsSecret.getTargetKind(build({ data: {}, target }, status))).toBe("ConfigMap");
    });

    it("returns undefined before the first apply", () => {
      expect(ValsSecret.getTargetKind(build({ data: {}, target }))).toBeUndefined();
    });
  });
});
