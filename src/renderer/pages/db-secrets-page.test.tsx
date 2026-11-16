// @vitest-environment jsdom

import { Renderer } from "@freelensapp/extensions";
import { act, cleanup, render, screen } from "@testing-library/react";
import { observable, runInAction } from "mobx";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DbSecret } from "../api/db-secret/db-secret-v1beta1";
import { DbSecretsPage } from "./db-secrets-page";

// A minimal stub extension - only `name` is read by the page.
const extension = { name: "vals-extension" } as Renderer.LensExtension;

type Store = Renderer.K8sApi.KubeObjectStore<DbSecret, Renderer.K8sApi.KubeApi<DbSecret>>;

const build = (name: string, spec: DbSecret["spec"]) =>
  new DbSecret({
    apiVersion: "digitalis.io/v1beta1",
    kind: "DbSecret",
    metadata: { name, namespace: "vals", uid: name, resourceVersion: "1", selfLink: "" },
    spec,
  });

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("DbSecretsPage", () => {
  it("shows that the kind is not served when the host has no store", () => {
    render(<DbSecretsPage extension={extension} />);

    expect(screen.getByText("DB Secrets Not Available")).toBeDefined();
    expect(screen.getByText("digitalis.io/v1beta1")).toBeDefined();
  });

  it("renders the list once the host serves the kind after the first render", () => {
    const served = observable.box(false);
    vi.spyOn(DbSecret, "getStore").mockImplementation(() => {
      if (!served.get()) {
        throw new Error("no API for DbSecret");
      }
      return { items: [] } as unknown as Store;
    });

    render(<DbSecretsPage extension={extension} />);

    expect(screen.getByText("DB Secrets Not Available")).toBeDefined();

    act(() => runInAction(() => served.set(true)));

    expect(screen.getByRole("table")).toBeDefined();
    expect(screen.queryByText("DB Secrets Not Available")).toBeNull();
  });

  it("renders the columns of each object", () => {
    const items = [
      build("named", { secretName: "written", vault: { mount: "postgres", role: "app" }, renew: true }),
      build("default", { vault: { mount: "mysql", role: "reader" } }),
    ];
    vi.spyOn(DbSecret, "getStore").mockReturnValue({ items } as unknown as Store);

    render(<DbSecretsPage extension={extension} />);

    const cells = screen.getAllByRole("row").map((row) => [...row.children].map((cell) => cell.textContent));

    // Name, Namespace, Secret, Vault Mount, Vault Role, Renew, Age
    expect(cells).toEqual([
      ["named", "vals", "written", "postgres", "app", "true", ""],
      ["default", "vals", "default", "mysql", "reader", "false", ""],
    ]);
  });
});
