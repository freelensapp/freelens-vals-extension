import { Renderer } from "@freelensapp/extensions";
import * as MobxReact from "mobx-react";
import { ValsSecret, type ValsSecretApi } from "../api/vals-secret/vals-secret-v1";
import { getServedStore, KindNotServed } from "../components/kind-not-served";
import styles from "./list-page.module.scss";

const { observer } = MobxReact;

const {
  Component: { KubeObjectAge, KubeObjectListLayout, LinkToNamespace, WithTooltip },
} = Renderer;

const sortingCallbacks = {
  name: (object: ValsSecret) => object.getName(),
  namespace: (object: ValsSecret) => object.getNs(),
  secret: (object: ValsSecret) => ValsSecret.getSecretName(object),
  data: (object: ValsSecret) => ValsSecret.getDataCount(object),
  age: (object: ValsSecret) => object.getCreationTimestamp(),
};

const renderTableHeader: { title: string; sortBy: keyof typeof sortingCallbacks; className?: string }[] = [
  { title: "Name", sortBy: "name", className: styles.name },
  { title: "Namespace", sortBy: "namespace" },
  { title: "Secret", sortBy: "secret", className: styles.secret },
  { title: "Data", sortBy: "data", className: styles.data },
  { title: "Age", sortBy: "age", className: styles.age },
];

const searchFilters = [
  (object: ValsSecret) => object.getSearchFields(),
  (object: ValsSecret) => ValsSecret.getSecretName(object),
];

export interface ValsSecretsPageProps {
  extension: Renderer.LensExtension;
}

/**
 * The list of `ValsSecret`s, or a notice when the cluster does not serve the kind. An `observer`, so that it renders
 * the list once the host has registered the API, after the cluster frame has loaded the CRDs.
 */
export const ValsSecretsPage = observer(({ extension }: ValsSecretsPageProps) => {
  const store = getServedStore<ValsSecret>(ValsSecret);

  if (!store) {
    return <KindNotServed extension={extension} kubeObjectClass={ValsSecret} />;
  }

  return (
    <KubeObjectListLayout<ValsSecret, ValsSecretApi>
      tableId={`${ValsSecret.crd.plural}Table`}
      className={styles.page}
      store={store}
      sortingCallbacks={sortingCallbacks}
      searchFilters={searchFilters}
      renderHeaderTitle={ValsSecret.crd.title}
      renderTableHeader={renderTableHeader}
      renderTableContents={(object: ValsSecret) => [
        <WithTooltip>{object.getName()}</WithTooltip>,
        <LinkToNamespace namespace={object.getNs()} />,
        <WithTooltip>{ValsSecret.getSecretName(object) ?? "-"}</WithTooltip>,
        ValsSecret.getDataCount(object),
        <KubeObjectAge object={object} key="age" />,
      ]}
    />
  );
});
