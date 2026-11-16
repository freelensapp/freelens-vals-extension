import { Common, Renderer } from "@freelensapp/extensions";
import styles from "./kind-not-served.module.scss";

import type { ValsKubeObjectCRD } from "../api/types";

/** A model class of the extension. */
type KubeObjectClass = typeof Renderer.K8sApi.LensExtensionKubeObject<any, any, any> & {
  readonly kind: string;
  readonly crd: ValsKubeObjectCRD;
};

/**
 * The host's store of the model's kind, or `undefined` when the cluster does not serve it: the host's `getStore()`
 * throws when it has no API for any of the model's `crd.apiVersions`.
 *
 * `getStore()` reads the host's API registry, which is observable, and the host registers the API of a CRD only after
 * the cluster frame has loaded the CRDs. A component that calls this is an `observer`, so that it renders again once
 * the kind is served.
 */
export function getServedStore<K extends Renderer.K8sApi.KubeObject<any, any, any>>(
  kubeObjectClass: KubeObjectClass,
): Renderer.K8sApi.KubeObjectStore<K, any, any> | undefined {
  try {
    return kubeObjectClass.getStore<K>() || undefined;
  } catch {
    return undefined;
  }
}

export interface KindNotServedProps {
  extension: Renderer.LensExtension;
  kubeObjectClass: KubeObjectClass;
}

/**
 * The page of a kind that the cluster does not serve: its CRD is not installed.
 */
export function KindNotServed({ extension, kubeObjectClass }: KindNotServedProps) {
  const { kind, crd } = kubeObjectClass;
  const apiVersions = crd.apiVersions.join(", ");

  Common.logger.info(`[${extension.name}]: ${kind} is not served by the cluster (API versions: ${apiVersions})`);

  return (
    <div className={styles.unavailablePage}>
      <div className={styles.unavailableContent}>
        <h3 className={styles.unavailableTitle}>{crd.title} Not Available</h3>
        <p className={styles.unavailableMessage}>
          The <strong>{kind}</strong> CRD of vals-operator is not installed in this cluster.
        </p>
        <p className={styles.unavailableDetails}>
          API version: <code>{apiVersions}</code>
        </p>
      </div>
    </div>
  );
}
