// @vitest-environment jsdom

import { Renderer } from "@freelensapp/extensions";
import { act, cleanup, render, screen } from "@testing-library/react";
import { observable, runInAction } from "mobx";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ValsSecret } from "../api/vals-secret/vals-secret-v1";
import { ValsSecretsPage } from "./vals-secrets-page";

// A minimal stub extension - only `name` is read by the page.
const extension = { name: "vals-extension" } as Renderer.LensExtension;

type Store = Renderer.K8sApi.KubeObjectStore<ValsSecret, Renderer.K8sApi.KubeApi<ValsSecret>>;

const build = (name: string, spec: ValsSecret["spec"]) =>
  new ValsSecret({
    apiVersion: "digitalis.io/v1",
    kind: "ValsSecret",
    metadata: { name, namespace: "vals", uid: name, resourceVersion: "1", selfLink: "" },
    spec,
  });

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("ValsSecretsPage", () => {
  it("shows that the kind is not served when the host has no store", () => {
    render(<ValsSecretsPage extension={extension} />);

    expect(screen.getByText("Vals Secrets Not Available")).toBeDefined();
    expect(screen.getByText("digitalis.io/v1")).toBeDefined();
  });

  it("renders the list once the host serves the kind after the first render", () => {
    // The host's `getStore()` reads its observable API registry. The spy reads an
    // observable in its place, so that serving the kind is a change the page sees.
    const served = observable.box(false);
    vi.spyOn(ValsSecret, "getStore").mockImplementation(() => {
      if (!served.get()) {
        throw new Error("no API for ValsSecret");
      }
      return { items: [] } as unknown as Store;
    });

    render(<ValsSecretsPage extension={extension} />);

    expect(screen.getByText("Vals Secrets Not Available")).toBeDefined();

    act(() => runInAction(() => served.set(true)));

    expect(screen.getByRole("table")).toBeDefined();
    expect(screen.queryByText("Vals Secrets Not Available")).toBeNull();
  });

  it("renders the columns of each object", () => {
    const data = { user: { ref: "ref+vault://app#user" }, pass: { ref: "ref+vault://app#pass" } };
    const target = { apiVersion: "v1", kind: "ConfigMap", template: "data: {}" };
    const items = [
      build("secret", { name: "written", data }),
      build("target", { data: { key: { ref: "ref+echo://value" } }, target }),
    ];
    vi.spyOn(ValsSecret, "getStore").mockReturnValue({ items } as unknown as Store);

    render(<ValsSecretsPage extension={extension} />);

    const cells = screen.getAllByRole("row").map((row) => [...row.children].map((cell) => cell.textContent));

    // Name, Namespace, Secret, Data, Age
    expect(cells).toEqual([
      ["secret", "vals", "written", "2", ""],
      ["target", "vals", "-", "1", ""],
    ]);
  });
});
