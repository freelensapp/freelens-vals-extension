import { Renderer } from "@freelensapp/extensions";
import * as MobxReact from "mobx-react";
import { DbSecret } from "../api/db-secret/db-secret-v1beta1";
import { ObjectAnnotations } from "./object-annotations";
import { RolloutTargets } from "./rollout-targets";
import { Templates } from "./templates";

const { observer } = MobxReact;

const {
  Component: { BadgeBoolean, DrawerItem, LinkToSecret },
} = Renderer;

export type DbSecretDetailsProps = Renderer.Component.KubeObjectDetailsProps<DbSecret>;

// A `DbSecret` has no status. The extension reads the metadata of the `Secret` only, never the credentials in it.
export const DbSecretDetails = observer(({ object }: DbSecretDetailsProps) => {
  const spec = object.spec;

  return (
    <>
      <DrawerItem name="Secret">
        <LinkToSecret name={DbSecret.getSecretName(object)} namespace={object.getNs()} />
      </DrawerItem>
      <ObjectAnnotations
        title="Secret Annotations"
        apiVersion="v1"
        kind="Secret"
        name={DbSecret.getSecretName(object)}
        namespace={object.getNs()}
        revision={object.metadata.resourceVersion}
      />
      <DrawerItem name="Vault Mount">{spec?.vault.mount ?? "-"}</DrawerItem>
      <DrawerItem name="Vault Role">{spec?.vault.role ?? "-"}</DrawerItem>
      <DrawerItem name="Renew">
        <BadgeBoolean value={DbSecret.getRenew(object)} />
      </DrawerItem>
      <Templates templates={spec?.template} />
      <RolloutTargets object={object} targets={spec?.rollout} />
    </>
  );
});
