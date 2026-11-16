// @vitest-environment jsdom

import { Renderer } from "@freelensapp/extensions";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ObjectAnnotations } from "./object-annotations";

type Api = NonNullable<ReturnType<typeof Renderer.K8sApi.apiManager.getApiByKind>>;

// The part of the host's `KubeApi` that the component calls.
function mockApi(list: (...args: unknown[]) => Promise<unknown>) {
  const api = { list: vi.fn(list) };

  vi.spyOn(Renderer.K8sApi.apiManager, "getApiByKind").mockReturnValue(api as unknown as Api);

  return api;
}

const object = (annotations: string[]) => ({ getAnnotations: (filter?: boolean) => (filter ? annotations : []) });

const renderSecretAnnotations = (revision = "1") =>
  render(
    <ObjectAnnotations
      title="Secret Annotations"
      apiVersion="v1"
      kind="Secret"
      name="written"
      namespace="vals"
      revision={revision}
    />,
  );

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("ObjectAnnotations", () => {
  it("shows the annotations of the object, read by name, without its data", async () => {
    const api = mockApi(async () => [object(["vals-operator.digitalis.io/last-updated=2026-11-16T20.00.00Z"])]);

    renderSecretAnnotations();

    expect((await screen.findByRole("group", { name: "Secret Annotations" })).textContent).toBe(
      "vals-operator.digitalis.io/last-updated=2026-11-16T20.00.00Z",
    );
    expect(Renderer.K8sApi.apiManager.getApiByKind).toHaveBeenCalledWith("Secret", "v1");
    expect(api.list).toHaveBeenCalledWith(
      {
        namespace: "vals",
        reqInit: {
          headers: { accept: "application/json;as=PartialObjectMetadataList;g=meta.k8s.io;v=v1" },
          signal: expect.any(AbortSignal),
        },
      },
      { fieldSelector: "metadata.name=written" },
    );
  });

  it("is hidden when the object does not exist", async () => {
    const api = mockApi(async () => []);

    renderSecretAnnotations();

    await waitFor(() => expect(api.list).toHaveBeenCalled());
    expect(screen.queryByRole("group")).toBeNull();
  });

  it("is hidden when the object cannot be read", async () => {
    const api = mockApi(async () => {
      throw new Error("forbidden");
    });

    renderSecretAnnotations();

    await waitFor(() => expect(api.list).toHaveBeenCalled());
    expect(screen.queryByRole("group")).toBeNull();
  });

  it("is hidden when the cluster does not serve the kind", () => {
    renderSecretAnnotations();

    expect(screen.queryByRole("group")).toBeNull();
  });

  it("reads the object again when the revision changes", async () => {
    const api = mockApi(async () => [object(["a=1"])]);
    const { rerender } = renderSecretAnnotations("1");

    await screen.findByRole("group");
    rerender(
      <ObjectAnnotations
        title="Secret Annotations"
        apiVersion="v1"
        kind="Secret"
        name="written"
        namespace="vals"
        revision="2"
      />,
    );

    await waitFor(() => expect(api.list).toHaveBeenCalledTimes(2));
  });

  it("aborts the request when the panel closes", () => {
    const api = mockApi(() => new Promise(() => {}));
    const { unmount } = renderSecretAnnotations();

    unmount();

    const [[{ reqInit }]] = api.list.mock.calls as [[{ reqInit: { signal: AbortSignal } }]];

    expect(reqInit.signal.aborted).toBe(true);
  });
});
