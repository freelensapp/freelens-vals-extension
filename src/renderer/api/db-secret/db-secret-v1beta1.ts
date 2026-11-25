import { Renderer } from "@freelensapp/extensions";

import type { ValsKubeObjectCRD } from "../types";

// The API of `digitalis.io/v1beta1`, from `apis/digitalis.io/v1beta1/dbsecret_types.go` and
// `config/crd/bases/digitalis.io_dbsecrets.yaml` of vals-operator v0.14.0, unchanged since v0.12.0. The example in the
// doc comment of `DbSecretSpec` there (`secret`, `host`, `dc`) is older than the schema and not modelled.

export type DbRolloutKind = "Deployment" | "StatefulSet" | "deployment" | "statefulset";

/** A `Deployment` or `StatefulSet` to restart when the credentials change: `DbRolloutTarget`. */
export interface DbRolloutTarget {
  kind: DbRolloutKind;
  name: string;
}

/** The Vault database secrets engine that issues the credentials: `DbVaultConfig`. */
export interface DbVaultConfig {
  /** The Vault role. */
  role: string;
  /** The mount of the database secrets engine. */
  mount: string;
}

export interface DbSecretSpec {
  /** The name of the `Secret`, the object's own by default. */
  secretName?: string;
  vault: DbVaultConfig;
  /** Templates of the keys of the `Secret`. */
  template?: Record<string, string>;
  /** Whether the operator renews the lease rather than issuing new credentials. */
  renew?: boolean;
  rollout?: DbRolloutTarget[];
}

/** `DbSecretStatus` has no fields. */
export type DbSecretStatus = {};

export class DbSecret extends Renderer.K8sApi.LensExtensionKubeObject<
  Renderer.K8sApi.KubeObjectMetadata,
  DbSecretStatus,
  // The CRD does not require the spec.
  DbSecretSpec | undefined
> {
  declare kind: "DbSecret";
  declare apiVersion: "digitalis.io/v1beta1";

  static readonly kind = "DbSecret";
  static readonly namespaced = true;
  static readonly apiBase = "/apis/digitalis.io/v1beta1/dbsecrets";

  static readonly crd: ValsKubeObjectCRD = {
    apiVersions: ["digitalis.io/v1beta1"],
    plural: "dbsecrets",
    singular: "dbsecret",
    title: "DB Secrets",
  };

  /** The name of the `Secret` that the operator writes: `spec.secretName`, or the object's name. */
  static getSecretName(object: DbSecret): string {
    return object.spec?.secretName || object.getName();
  }

  static getRenew(object: DbSecret): boolean {
    return object.spec?.renew ?? false;
  }
}

export class DbSecretApi extends Renderer.K8sApi.KubeApi<DbSecret> {}
export class DbSecretStore extends Renderer.K8sApi.KubeObjectStore<DbSecret, DbSecretApi> {}
