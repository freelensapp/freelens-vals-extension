import { Renderer } from "@freelensapp/extensions";

import type { ValsKubeObjectCRD } from "../types";

// The API of `digitalis.io/v1`, from `apis/digitalis.io/v1/valssecret_types.go` and
// `config/crd/bases/digitalis.io_valssecrets.yaml` of vals-operator v0.14.0.

/** A secret to read with vals: `DataSource`. */
export interface DataSource {
  /** The vals reference, `ref+<backend>://<path>`. */
  ref: string;
  /** The encoding of the value; only `base64`. */
  encoding?: string;
}

/** The login of the operator to a database: `DatabaseLoginCredentials`. */
export interface DatabaseLoginCredentials {
  /** The `Secret` with the login. */
  secretName: string;
  /** The namespace of the `Secret`, the object's own by default. */
  namespace?: string;
  usernameKey?: string;
  passwordKey: string;
}

export type DatabaseProtocol = "native" | "tcp" | "clickhouse" | "http";

export type DatabaseTLS = "preferred" | "disable" | "require" | "skip-verify";

/** A database whose user the operator updates with the resolved password: `Database`. */
export interface Database {
  driver: string;
  loginCredentials?: DatabaseLoginCredentials;
  port?: number;
  /** The key of the resolved data with the user name. */
  usernameKey?: string;
  /** The key of the resolved data with the password. */
  passwordKey: string;
  /** MySQL only: the host part of the user. */
  userHost?: string;
  /** ClickHouse only. */
  protocol?: DatabaseProtocol;
  /** ClickHouse only. */
  tls?: DatabaseTLS;
  hosts: string[];
}

/** A `Deployment` or `StatefulSet` to restart when the `Secret` changes: `RolloutTarget`. */
export interface RolloutTarget {
  kind: string;
  name: string;
}

export type TargetMode = "create" | "patch";

/** A resource that the data is rendered into, in place of a `Secret`: `Target`. */
export interface Target {
  apiVersion: string;
  kind: string;
  /** The name of the object, the `ValsSecret`'s by default. */
  name?: string;
  /** `create` by default. */
  mode?: TargetMode;
  template: string;
  labels?: Record<string, string>;
  annotations?: Record<string, string>;
}

export interface ValsSecretSpec {
  /** The name of the `Secret`, the object's own by default. */
  name?: string;
  data: Record<string, DataSource>;
  /** Seconds between two reads of the secrets. */
  ttl?: number;
  /** The type of the `Secret`. */
  type?: string;
  databases?: Database[];
  /** Templates of the keys of the `Secret`. */
  template?: Record<string, string>;
  rollout?: RolloutTarget[];
  target?: Target;
}

/** The last apply of `spec.target`: `TargetStatus`. */
export interface TargetStatus {
  apiVersion: string;
  kind: string;
  name: string;
  namespace: string;
  mode: TargetMode;
  /** The SHA-256 of the rendered body. */
  hash?: string;
  lastApplied?: string;
}

export type ConditionStatus = "True" | "False" | "Unknown";

/** `metav1.Condition`. */
export interface Condition {
  type: string;
  status: ConditionStatus;
  observedGeneration?: number;
  lastTransitionTime: string;
  reason: string;
  message: string;
}

export interface ValsSecretStatus {
  /** Set only with `spec.target`. */
  conditions?: Condition[];
  target?: TargetStatus;
  /**
   * The generation of this `ValsSecret` last applied to its `Secret`. When the generation moves past it, the backend is
   * read again and the `Secret` updated without waiting for the TTL. Zero means not recorded yet: the TTL rule applies.
   * Not used with `spec.target`. Since vals-operator v0.13.0.
   */
  secretGeneration?: number;
  /**
   * The value of the `vals-operator.digitalis.io/refresh-requested-at` annotation last handled. While the annotation
   * holds another value, the next reconcile reads the backend again without waiting for the TTL. It is recorded only
   * after the backend was read and the `Secret` or target applied, so a failed refresh stays pending and is retried.
   * Since vals-operator v0.14.0.
   */
  lastHandledRefreshAt?: string;
}

/**
 * The annotation that requests a refresh: a new value makes vals-operator v0.14.0 or newer read the backend again on
 * the next reconcile, without waiting for the TTL (`refreshRequestedAtAnnotation` in `controllers/common.go`).
 */
export const refreshRequestedAtAnnotation = "vals-operator.digitalis.io/refresh-requested-at";

export class ValsSecret extends Renderer.K8sApi.LensExtensionKubeObject<
  Renderer.K8sApi.KubeObjectMetadata,
  ValsSecretStatus,
  // The CRD does not require the spec.
  ValsSecretSpec | undefined
> {
  declare kind: "ValsSecret";
  declare apiVersion: "digitalis.io/v1";

  static readonly kind = "ValsSecret";
  static readonly namespaced = true;
  static readonly apiBase = "/apis/digitalis.io/v1/valssecrets";

  static readonly crd: ValsKubeObjectCRD = {
    apiVersions: ["digitalis.io/v1"],
    plural: "valssecrets",
    singular: "valssecret",
    title: "Vals Secrets",
  };

  /**
   * The name of the `Secret` that the operator writes: `spec.name`, or the object's name. `undefined` with
   * `spec.target`, which renders the data into another resource.
   */
  static getSecretName(object: ValsSecret): string | undefined {
    if (object.spec?.target) {
      return undefined;
    }

    return object.spec?.name || object.getName();
  }

  /** The number of keys of `spec.data`. */
  static getDataCount(object: ValsSecret): number {
    return Object.keys(object.spec?.data ?? {}).length;
  }

  /** The value of the `refresh-requested-at` annotation, or `undefined` without it. */
  static getRefreshRequestedAt(object: ValsSecret): string | undefined {
    return object.metadata.annotations?.[refreshRequestedAtAnnotation] || undefined;
  }

  /**
   * Whether a refresh is requested and not handled yet: the `refresh-requested-at` annotation is set and differs from
   * `status.lastHandledRefreshAt`, the rule of the operator (`refreshPending` in `controllers/valssecret_controller.go`).
   */
  static isRefreshPending(object: ValsSecret): boolean {
    const requested = ValsSecret.getRefreshRequestedAt(object);

    return requested !== undefined && requested !== object.status?.lastHandledRefreshAt;
  }
}

export class ValsSecretApi extends Renderer.K8sApi.KubeApi<ValsSecret> {}
export class ValsSecretStore extends Renderer.K8sApi.KubeObjectStore<ValsSecret, ValsSecretApi> {}
