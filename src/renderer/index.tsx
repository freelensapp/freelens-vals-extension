/**
 * Copyright (c) Freelens Authors. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */

import { Renderer } from "@freelensapp/extensions";
import { DbSecret } from "./api/db-secret/db-secret-v1beta1";
import { ValsSecret } from "./api/vals-secret/vals-secret-v1";
import { withDetailsErrorBoundary, withPageErrorBoundary } from "./components/error-boundary";
import { DbSecretDetails } from "./details/db-secret-details";
import { ValsSecretDetails } from "./details/vals-secret-details";
import { ValsIcon } from "./icons";
import { DbSecretsPage } from "./pages/db-secrets-page";
import { ValsSecretsPage } from "./pages/vals-secrets-page";

// Every page and details panel renders inside an error boundary, so that an error it throws stays in its place: the
// host has none around the details drawer, and its boundary around the cluster frame would replace the whole cluster
// view. Each registration field is mapped through its wrapper, so an entry added to it is wrapped too.
//
// The extension has no menu items: vals-operator has no action on a `ValsSecret` or a `DbSecret` for one. A field
// `kubeObjectMenuItems` added later is mapped through `withMenuItemErrorBoundary`.
export default class ValsRenderer extends Renderer.LensExtension {
  kubeObjectDetailItems: Renderer.LensExtension["kubeObjectDetailItems"] = [
    Renderer.K8sApi.detailsFor(ValsSecret, {
      priority: 10,
      Details: ValsSecretDetails,
    }),
    Renderer.K8sApi.detailsFor(DbSecret, {
      priority: 10,
      Details: DbSecretDetails,
    }),
  ].map((registration) => withDetailsErrorBoundary(this, registration));

  clusterPages: Renderer.LensExtension["clusterPages"] = [
    {
      id: "vals-secrets",
      components: {
        Page: () => <ValsSecretsPage extension={this} />,
      },
    },
    {
      id: "db-secrets",
      components: {
        Page: () => <DbSecretsPage extension={this} />,
      },
    },
  ].map((registration) => withPageErrorBoundary(this, registration));

  // One parent entry, which expands to the pages of the two kinds, and is active when one of them is.
  clusterPageMenus = [
    {
      id: "vals",
      title: "Vals",
      components: {
        Icon: ValsIcon,
      },
    },
    {
      id: "vals-secrets",
      parentId: "vals",
      title: ValsSecret.crd.title,
      target: { pageId: "vals-secrets" },
      components: {},
    },
    {
      id: "db-secrets",
      parentId: "vals",
      title: DbSecret.crd.title,
      target: { pageId: "db-secrets" },
      components: {},
    },
  ];

  customResources = [ValsSecret, DbSecret];
}
