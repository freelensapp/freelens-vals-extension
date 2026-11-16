import { Renderer } from "@freelensapp/extensions";
import { getRolloutObjectReference, type RolloutTargetReference } from "../api/types";

const {
  Component: { DrawerItem, DrawerTitle, LinkToObject },
} = Renderer;

export interface RolloutTargetsProps {
  object: Renderer.K8sApi.KubeObject<any, any, any>;
  targets: RolloutTargetReference[] | undefined;
}

/**
 * The `Deployment`s and `StatefulSet`s that the operator restarts, each as a link to the host's details of the object
 * in the namespace of `object`.
 */
export function RolloutTargets({ object, targets }: RolloutTargetsProps) {
  if (!targets?.length) {
    return null;
  }

  return (
    <>
      <DrawerTitle>Rollout</DrawerTitle>
      {targets.map((target) => {
        const objectRef = getRolloutObjectReference(target, object.getNs());

        return (
          <DrawerItem key={`${target.kind}/${target.name}`} name={target.kind}>
            {objectRef ? <LinkToObject object={object} objectRef={objectRef} /> : target.name}
          </DrawerItem>
        );
      })}
    </>
  );
}
