import { Renderer } from "@freelensapp/extensions";
import * as MobxReact from "mobx-react";
import { DbSecret, type DbSecretApi } from "../api/db-secret/db-secret-v1beta1";
import { getServedStore, KindNotServed } from "../components/kind-not-served";
import styles from "./list-page.module.scss";

const { observer } = MobxReact;

const {
  Component: { BadgeBoolean, KubeObjectAge, KubeObjectListLayout, LinkToNamespace, WithTooltip },
} = Renderer;

const sortingCallbacks = {
  name: (object: DbSecret) => object.getName(),
  namespace: (object: DbSecret) => object.getNs(),
  secret: (object: DbSecret) => DbSecret.getSecretName(object),
  vaultMount: (object: DbSecret) => object.spec?.vault.mount,
  vaultRole: (object: DbSecret) => object.spec?.vault.role,
  renew: (object: DbSecret) => String(DbSecret.getRenew(object)),
  age: (object: DbSecret) => object.getCreationTimestamp(),
};

const renderTableHeader: { title: string; sortBy: keyof typeof sortingCallbacks; className?: string }[] = [
  { title: "Name", sortBy: "name", className: styles.name },
  { title: "Namespace", sortBy: "namespace" },
  { title: "Secret", sortBy: "secret", className: styles.secret },
  { title: "Vault Mount", sortBy: "vaultMount", className: styles.vaultMount },
  { title: "Vault Role", sortBy: "vaultRole", className: styles.vaultRole },
  { title: "Renew", sortBy: "renew", className: styles.renew },
  { title: "Age", sortBy: "age", className: styles.age },
];

const searchFilters = [
  (object: DbSecret) => object.getSearchFields(),
  (object: DbSecret) => DbSecret.getSecretName(object),
  (object: DbSecret) => object.spec?.vault.mount,
  (object: DbSecret) => object.spec?.vault.role,
];

export interface DbSecretsPageProps {
  extension: Renderer.LensExtension;
}

/**
 * The list of `DbSecret`s, or a notice when the cluster does not serve the kind. An `observer`, so that it renders
 * the list once the host has registered the API, after the cluster frame has loaded the CRDs.
 */
export const DbSecretsPage = observer(({ extension }: DbSecretsPageProps) => {
  const store = getServedStore<DbSecret>(DbSecret);

  if (!store) {
    return <KindNotServed extension={extension} kubeObjectClass={DbSecret} />;
  }

  return (
    <KubeObjectListLayout<DbSecret, DbSecretApi>
      tableId={`${DbSecret.crd.plural}Table`}
      className={styles.page}
      store={store}
      sortingCallbacks={sortingCallbacks}
      searchFilters={searchFilters}
      renderHeaderTitle={DbSecret.crd.title}
      renderTableHeader={renderTableHeader}
      renderTableContents={(object: DbSecret) => [
        <WithTooltip>{object.getName()}</WithTooltip>,
        <LinkToNamespace namespace={object.getNs()} />,
        <WithTooltip>{DbSecret.getSecretName(object)}</WithTooltip>,
        <WithTooltip>{object.spec?.vault.mount ?? "-"}</WithTooltip>,
        <WithTooltip>{object.spec?.vault.role ?? "-"}</WithTooltip>,
        <BadgeBoolean value={DbSecret.getRenew(object)} />,
        <KubeObjectAge object={object} key="age" />,
      ]}
    />
  );
});
