import { Renderer } from "@freelensapp/extensions";

export interface ValsKubeObjectCRD extends Renderer.K8sApi.LensExtensionKubeObjectCRD {
  title: string;
}

/**
 * The rollout target of a `ValsSecret` (`RolloutTarget` of `digitalis.io/v1`) or a `DbSecret` (`DbRolloutTarget` of
 * `digitalis.io/v1beta1`): the `Deployment` or `StatefulSet` that the operator restarts when it writes the `Secret`.
 * The kind of a `DbSecret` is one of `DbRolloutKind`, the kind of a `ValsSecret` any string; the operator compares
 * both in lower case.
 */
export interface RolloutTargetReference {
  kind: string;
  name: string;
}

/**
 * The reference to the object of a rollout target, in the namespace of the object that names it, for the host's
 * details of that object, or `undefined` for a kind that the operator does not restart.
 */
export function getRolloutObjectReference(
  target: RolloutTargetReference,
  namespace: string | undefined,
): Renderer.K8sApi.ObjectReference | undefined {
  switch (target.kind.toLowerCase()) {
    case "deployment":
      return { apiVersion: "apps/v1", kind: "Deployment", name: target.name, namespace };
    case "statefulset":
      return { apiVersion: "apps/v1", kind: "StatefulSet", name: target.name, namespace };
    default:
      return undefined;
  }
}
