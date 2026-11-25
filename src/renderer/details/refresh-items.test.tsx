// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { refreshRequestedAtAnnotation, ValsSecret } from "../api/vals-secret/vals-secret-v1";
import { RefreshItems } from "./refresh-items";

afterEach(() => {
  cleanup();
});

const build = (annotation?: string, status?: ValsSecret["status"]) =>
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
    status,
  });

const item = (name: string) => screen.getByRole("group", { name });

describe("RefreshItems", () => {
  it("shows - for every missing value, and no pending badge", () => {
    render(<RefreshItems object={build()} />);

    expect(item("Secret Generation").textContent).toBe("-");
    expect(item("Refresh Requested").textContent).toBe("-");
    expect(item("Last Handled Refresh").textContent).toBe("-");
    expect(screen.queryByText("Pending")).toBeNull();
  });

  it("shows the generation, and the requested and handled refresh, not pending when they are equal", () => {
    const requested = "2026-11-25T12:00:00.000Z";

    render(<RefreshItems object={build(requested, { secretGeneration: 3, lastHandledRefreshAt: requested })} />);

    expect(item("Secret Generation").textContent).toBe("3");
    expect(item("Refresh Requested").textContent).toBe(requested);
    expect(item("Last Handled Refresh").textContent).toBe(requested);
    expect(screen.queryByText("Pending")).toBeNull();
  });

  it("shows a pending badge that says why while the requested refresh differs from the handled one", () => {
    render(
      <RefreshItems object={build("2026-11-25T12:00:00.000Z", { lastHandledRefreshAt: "2026-11-24T08:00:00Z" })} />,
    );

    const badge = screen.getByText("Pending");

    expect(item("Refresh Requested").textContent).toBe("2026-11-25T12:00:00.000Z Pending");
    expect(badge.getAttribute("title")).toMatch(/vals-operator v0\.14\.0 or newer/);
  });

  it("shows a value that is not a date as its text", () => {
    render(<RefreshItems object={build("now please")} />);

    expect(item("Refresh Requested").textContent).toBe("now please Pending");
  });
});
