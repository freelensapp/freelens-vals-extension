import { describe, expect, it } from "vitest";
import { DbSecret } from "./db-secret-v1beta1";

describe("DbSecret (v1beta1)", () => {
  const build = (spec: DbSecret["spec"]) =>
    new DbSecret({
      apiVersion: "digitalis.io/v1beta1",
      kind: "DbSecret",
      metadata: {
        name: "demo",
        namespace: "default",
        selfLink: "/apis/digitalis.io/v1beta1/namespaces/default/dbsecrets/demo",
      },
      spec,
    });

  const vault = { mount: "postgres", role: "app" };

  describe("getSecretName", () => {
    it("returns spec.secretName", () => {
      expect(DbSecret.getSecretName(build({ secretName: "written", vault }))).toBe("written");
    });

    it("returns the object's name without spec.secretName", () => {
      expect(DbSecret.getSecretName(build({ vault }))).toBe("demo");
    });

    it("returns the object's name without a spec", () => {
      expect(DbSecret.getSecretName(build(undefined))).toBe("demo");
    });
  });

  describe("getRenew", () => {
    it("returns spec.renew", () => {
      expect(DbSecret.getRenew(build({ vault, renew: true }))).toBe(true);
    });

    it("defaults to false", () => {
      expect(DbSecret.getRenew(build({ vault }))).toBe(false);
    });
  });
});
