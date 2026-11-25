import { describe, expect, it } from "vitest";
import { refreshRequestedAtAnnotation, ValsSecret } from "./vals-secret-v1";

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

  describe("refresh", () => {
    const requested = "2026-11-25T12:00:00.000Z";

    const withRefresh = (annotation: string | undefined, lastHandledRefreshAt?: string) =>
      new ValsSecret({
        apiVersion: "digitalis.io/v1",
        kind: "ValsSecret",
        metadata: {
          name: "demo",
          namespace: "default",
          selfLink: "/apis/digitalis.io/v1/namespaces/default/valssecrets/demo",
          annotations: annotation === undefined ? {} : { [refreshRequestedAtAnnotation]: annotation },
        },
        spec: { data: {} },
        status: lastHandledRefreshAt === undefined ? undefined : { lastHandledRefreshAt },
      });

    it("names the annotation of vals-operator", () => {
      expect(refreshRequestedAtAnnotation).toBe("vals-operator.digitalis.io/refresh-requested-at");
    });

    it("returns the requested refresh from the annotation", () => {
      expect(ValsSecret.getRefreshRequestedAt(withRefresh(requested))).toBe(requested);
    });

    it.each([undefined, ""])("returns no requested refresh with the annotation %j", (annotation) => {
      expect(ValsSecret.getRefreshRequestedAt(withRefresh(annotation))).toBeUndefined();
    });

    it("is not pending without the annotation", () => {
      expect(ValsSecret.isRefreshPending(withRefresh(undefined))).toBe(false);
      expect(ValsSecret.isRefreshPending(withRefresh(undefined, requested))).toBe(false);
    });

    it("is not pending with an empty annotation, which the operator ignores", () => {
      expect(ValsSecret.isRefreshPending(withRefresh(""))).toBe(false);
    });

    it("is pending with the annotation and no status", () => {
      expect(ValsSecret.isRefreshPending(withRefresh(requested))).toBe(true);
    });

    it("is pending while the annotation differs from status.lastHandledRefreshAt", () => {
      expect(ValsSecret.isRefreshPending(withRefresh(requested, "2026-11-24T08:00:00.000Z"))).toBe(true);
    });

    it("is not pending once the operator recorded the annotation in status.lastHandledRefreshAt", () => {
      expect(ValsSecret.isRefreshPending(withRefresh(requested, requested))).toBe(false);
    });
  });
});
