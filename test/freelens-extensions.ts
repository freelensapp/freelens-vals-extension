// Minimal stub of `@freelensapp/extensions` for unit tests.
//
// The published package is a shim that reads `Common`, `Main` and `Renderer`
// off `globalThis.FreelensExtensionApi`, which the Freelens host sets before it
// loads an extension. A Vitest process has no host, so importing the real
// package throws. `vitest.config.ts` aliases the import to this file instead.
// The package ships no mocks of its own to use in its place.
//
// Only the surface the tests exercise is stubbed here, and only at runtime: the
// tests are type-checked against the real declaration of the package. Extend it
// as your tests need more of the host API.
import React from "react";
import { vi } from "vitest";

class LensExtensionKubeObject {
  apiVersion?: string;
  kind?: string;
  metadata?: { name?: string; namespace?: string };
  spec?: unknown;
  status?: unknown;

  constructor(data: Record<string, unknown> = {}) {
    Object.assign(this, data);
  }

  // As the host's, from the metadata.
  getName() {
    return this.metadata?.name ?? "";
  }

  // An empty namespace is undefined, as the host's.
  getNs() {
    return this.metadata?.namespace || undefined;
  }

  // The host returns the store it registered for one of the class's
  // `crd.apiVersions`, and throws when there is none. Without a host there is
  // never one; a test that needs a store spies on `getStore` of its class.
  static getStore(): never {
    throw new Error(`Store for ${this.name} is not registered. Extension won't work correctly.`);
  }
}

interface KubeObjectListLayoutProps {
  store: { items: unknown[] };
  renderTableContents: (item: unknown) => React.ReactNode[];
}

// Only the part of the host's list layout where it calls back into the
// extension: it calls `renderTableContents` for every item of the store from
// its own render, a child of the page, and renders the cells, as rows and
// cells for the tests to read.
function KubeObjectListLayout({ store, renderTableContents }: KubeObjectListLayoutProps) {
  return React.createElement(
    "div",
    { role: "table" },
    store.items.map((item, index) =>
      React.createElement(
        "div",
        { key: index, role: "row" },
        renderTableContents(item).map((cell, column) =>
          React.createElement("span", { key: column, role: "cell" }, cell),
        ),
      ),
    ),
  );
}

// The cells of the list pages, as text.
const WithTooltip = ({ children }: { children?: React.ReactNode }) => React.createElement("span", null, children);
const LinkToNamespace = ({ namespace }: { namespace?: string }) => React.createElement("span", null, namespace);
const BadgeBoolean = ({ value }: { value: boolean }) => React.createElement("span", null, String(value));
const KubeObjectAge = () => null;

export const Renderer = {
  Component: {
    BadgeBoolean,
    KubeObjectAge,
    KubeObjectListLayout,
    LinkToNamespace,
    WithTooltip,
  },
  K8sApi: {
    LensExtensionKubeObject,
    KubeApi: class KubeApi {},
    KubeObjectStore: class KubeObjectStore {},
  },
};

export const Common = {
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
};
