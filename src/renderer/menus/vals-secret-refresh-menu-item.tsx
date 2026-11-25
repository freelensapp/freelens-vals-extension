import { type Common, Renderer } from "@freelensapp/extensions";
import * as MobxReact from "mobx-react";
import { useState } from "react";
import { refreshRequestedAtAnnotation, ValsSecret } from "../api/vals-secret/vals-secret-v1";
import { getServedStore } from "../components/kind-not-served";
import styles from "./menu-items.module.scss";
import { patchObject } from "./patch-object";

import type React from "react";

const { observer } = MobxReact;

const {
  Component: { Icon, MenuItem },
} = Renderer;

export type ValsSecretRefreshMenuItemProps = Common.Types.KubeObjectMenuItemProps<ValsSecret>;

const title = "Refresh";

// vals-operator records a refresh only after it read the backend and wrote the `Secret` or target. An operator older
// than v0.14.0 never does, and a `ValsSecret` CRD older than v0.14.0 prunes `status.lastHandledRefreshAt`, so the
// request stays pending there.
const pendingTooltip =
  "Refresh requested, waiting for vals-operator v0.14.0 or newer to handle it. It stays pending with an older " +
  "operator or an older ValsSecret CRD.";

/**
 * Requests that vals-operator reads the backend of a `ValsSecret` again, without waiting for the TTL: a merge patch of
 * the `refresh-requested-at` annotation with the current time. The host renders it in the toolbar of the details
 * panel, as an icon with its tooltip, and in the menu of the list.
 *
 * Disabled while a refresh is pending, so that one click is one read of the backend: the next request is possible once
 * the operator recorded the last one in `status.lastHandledRefreshAt`. The host's `MenuItem` calls `onClick` also when
 * disabled, so the handler checks it itself. It is disabled while its patch is sent as well; the host's store takes the
 * patched object from the response, and the item then follows the annotation.
 *
 * An `observer`, because `getServedStore()` reads the host's API registry.
 */
export const ValsSecretRefreshMenuItem = observer(({ object, toolbar }: ValsSecretRefreshMenuItemProps) => {
  const [sending, setSending] = useState(false);

  if (!object) return null;

  const store = getServedStore<ValsSecret>(ValsSecret);

  if (!store) return null;

  const pending = sending || ValsSecret.isRefreshPending(object);

  const refresh = (event: React.MouseEvent) => {
    if (pending) {
      // Keeps the menu open.
      event.preventDefault();
      return;
    }

    setSending(true);
    void patchObject("refresh", object, () =>
      store.patch(
        object,
        { metadata: { annotations: { [refreshRequestedAtAnnotation]: new Date().toISOString() } } },
        "merge",
      ),
    ).finally(() => setSending(false));
  };

  return (
    <MenuItem onClick={refresh} disabled={pending} className={pending ? styles.pending : undefined}>
      <Icon
        material="refresh"
        interactive={toolbar}
        tooltip={pending ? pendingTooltip : title}
        tooltipOverrideDisabled={pending}
      />
      <span className="title">{title}</span>
    </MenuItem>
  );
});
