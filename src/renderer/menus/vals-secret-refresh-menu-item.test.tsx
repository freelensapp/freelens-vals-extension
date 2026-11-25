// @vitest-environment jsdom

import { Renderer } from "@freelensapp/extensions";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { refreshRequestedAtAnnotation, ValsSecret } from "../api/vals-secret/vals-secret-v1";
import { ValsSecretRefreshMenuItem } from "./vals-secret-refresh-menu-item";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

type Store = Renderer.K8sApi.KubeObjectStore<ValsSecret, Renderer.K8sApi.KubeApi<ValsSecret>>;

const requested = "2026-11-24T08:00:00.000Z";

const build = (annotation?: string, lastHandledRefreshAt?: string) =>
  new ValsSecret({
    apiVersion: "digitalis.io/v1",
    kind: "ValsSecret",
    metadata: {
      name: "test",
      namespace: "vals",
      selfLink: "/apis/digitalis.io/v1/namespaces/vals/valssecrets/test",
      annotations: annotation === undefined ? {} : { [refreshRequestedAtAnnotation]: annotation },
    },
    spec: { data: {} },
    status: lastHandledRefreshAt === undefined ? undefined : { lastHandledRefreshAt },
  });

// The store of the kind, as the host returns it when the cluster serves it.
const serveStore = (patch = vi.fn((_item: ValsSecret) => Promise.resolve(_item))) => {
  vi.spyOn(ValsSecret, "getStore").mockReturnValue({ patch } as unknown as Store);
  return patch;
};

const menuItem = () => screen.getByRole("menuitem");

describe("ValsSecretRefreshMenuItem", () => {
  it("requests a refresh with a merge patch of the refresh-requested-at annotation only", () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-11-25T12:00:00.000Z"));
    const patch = serveStore();
    const object = build();

    render(<ValsSecretRefreshMenuItem object={object} toolbar />);
    fireEvent.click(screen.getByText("Refresh"));

    expect(patch).toHaveBeenCalledExactlyOnceWith(
      object,
      { metadata: { annotations: { "vals-operator.digitalis.io/refresh-requested-at": "2026-11-25T12:00:00.000Z" } } },
      "merge",
    );
  });

  it("is enabled, with the title as the tooltip of its icon, without the annotation", () => {
    serveStore();

    render(<ValsSecretRefreshMenuItem object={build()} toolbar />);

    expect(menuItem().getAttribute("aria-disabled")).not.toBe("true");
    expect(screen.getByLabelText("Refresh").textContent).toBe("refresh");
  });

  it("is enabled when the operator recorded the annotation in status.lastHandledRefreshAt", () => {
    const patch = serveStore();

    render(<ValsSecretRefreshMenuItem object={build(requested, requested)} />);

    expect(menuItem().getAttribute("aria-disabled")).not.toBe("true");

    fireEvent.click(screen.getByText("Refresh"));

    expect(patch).toHaveBeenCalledOnce();
  });

  it.each([
    ["without a status", undefined],
    ["with an older status.lastHandledRefreshAt", "2026-11-23T08:00:00.000Z"],
  ])("is disabled while a refresh is pending, %s, says so, and does not patch", (_, lastHandledRefreshAt) => {
    const patch = serveStore();

    render(<ValsSecretRefreshMenuItem object={build(requested, lastHandledRefreshAt)} toolbar />);
    // The host's menu item calls `onClick` also when disabled.
    fireEvent.click(screen.getByText("Refresh"));

    expect(menuItem().getAttribute("aria-disabled")).toBe("true");
    expect(screen.getByLabelText(/^Refresh requested, waiting for vals-operator/)).toBeDefined();
    expect(patch).not.toHaveBeenCalled();
  });

  it("is disabled while its patch is sent, so that a second click sends no second request", async () => {
    let resolve = () => {};
    const patch = serveStore(
      vi.fn((item: ValsSecret) => new Promise<ValsSecret>((done) => (resolve = () => done(item)))),
    );

    render(<ValsSecretRefreshMenuItem object={build()} toolbar />);
    fireEvent.click(screen.getByText("Refresh"));
    fireEvent.click(screen.getByText("Refresh"));

    expect(menuItem().getAttribute("aria-disabled")).toBe("true");
    expect(patch).toHaveBeenCalledOnce();

    resolve();

    await waitFor(() => expect(menuItem().getAttribute("aria-disabled")).not.toBe("true"));
  });

  it("renders nothing when the cluster does not serve the kind", () => {
    const { container } = render(<ValsSecretRefreshMenuItem object={build()} />);

    expect(container.childElementCount).toBe(0);
  });

  it("shows a failed patch as an error notification, and leaves no unhandled rejection", async () => {
    const unhandled = vi.fn();
    process.on("unhandledRejection", unhandled);
    try {
      const error = vi.spyOn(Renderer.Component.Notifications, "error");
      serveStore(vi.fn(() => Promise.reject(new Error("forbidden"))));

      render(<ValsSecretRefreshMenuItem object={build()} />);
      fireEvent.click(screen.getByText("Refresh"));

      await vi.waitFor(() =>
        expect(error).toHaveBeenCalledExactlyOnceWith("Failed to refresh ValsSecret vals/test: forbidden"),
      );
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(unhandled).not.toHaveBeenCalled();
    } finally {
      process.off("unhandledRejection", unhandled);
    }
  });
});
