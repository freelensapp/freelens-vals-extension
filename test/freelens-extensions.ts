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
  metadata?: { name?: string; namespace?: string; annotations?: Record<string, string> };
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

// The labels of a drawer item, as its name and the labels, unless hidden.
const DrawerItemLabels = ({ name, labels, hidden }: { name: string; labels: string[]; hidden?: boolean }) =>
  hidden ? null : React.createElement("div", { role: "group", "aria-label": name }, labels.join(" "));

// An item of a drawer, as its name and its value, unless hidden.
const DrawerItem = ({ name, hidden, children }: { name: string; hidden?: boolean; children?: React.ReactNode }) =>
  hidden ? null : React.createElement("div", { role: "group", "aria-label": name }, children);

// A date, as the text it was given; the host formats it in the user's locale and time zone.
const LocaleDate = ({ date }: { date: string }) => React.createElement("time", null, date);

// A badge, as its label, with its tooltip as the title when the tooltip is a text.
const Badge = ({ label, tooltip }: { label?: React.ReactNode; tooltip?: unknown }) =>
  React.createElement("span", { title: typeof tooltip === "string" ? tooltip : undefined }, label);

// An item of a menu, as a list item. Like the host's, it calls `onClick` also when disabled: the host keeps a disabled
// item from being clicked with CSS only.
const MenuItem = ({
  onClick,
  disabled,
  className,
  children,
}: {
  onClick?: (event: React.MouseEvent) => void;
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
}) => React.createElement("li", { role: "menuitem", "aria-disabled": disabled, className, onClick }, children);

// An icon, as its material name, with its tooltip as the label when the tooltip is a text.
const Icon = ({ material, tooltip }: { material?: string; tooltip?: unknown }) =>
  React.createElement("i", { "aria-label": typeof tooltip === "string" ? tooltip : undefined }, material);

export const Renderer = {
  Component: {
    Badge,
    BadgeBoolean,
    DrawerItem,
    DrawerItemLabels,
    Icon,
    KubeObjectAge,
    KubeObjectListLayout,
    LinkToNamespace,
    LocaleDate,
    MenuItem,
    // The host shows a notification and returns its disposer; a test spies on the function it expects.
    Notifications: {
      error: (_message: unknown) => () => {},
    },
    WithTooltip,
  },
  K8sApi: {
    // The host finds no API without a cluster; a test that needs one spies on `getApiByKind`.
    apiManager: { getApiByKind: (): undefined => undefined },
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
