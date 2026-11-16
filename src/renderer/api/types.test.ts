import { describe, expect, it } from "vitest";
import { getRolloutObjectReference } from "./types";

describe("getRolloutObjectReference", () => {
  it("refers to a Deployment, in either case of the kind", () => {
    const expected = { apiVersion: "apps/v1", kind: "Deployment", name: "app", namespace: "ns" };

    expect(getRolloutObjectReference({ kind: "Deployment", name: "app" }, "ns")).toEqual(expected);
    expect(getRolloutObjectReference({ kind: "deployment", name: "app" }, "ns")).toEqual(expected);
  });

  it("refers to a StatefulSet, in either case of the kind", () => {
    const expected = { apiVersion: "apps/v1", kind: "StatefulSet", name: "db", namespace: "ns" };

    expect(getRolloutObjectReference({ kind: "StatefulSet", name: "db" }, "ns")).toEqual(expected);
    expect(getRolloutObjectReference({ kind: "statefulset", name: "db" }, "ns")).toEqual(expected);
  });

  it("returns undefined for a kind that the operator does not restart", () => {
    expect(getRolloutObjectReference({ kind: "DaemonSet", name: "agent" }, "ns")).toBeUndefined();
  });
});
