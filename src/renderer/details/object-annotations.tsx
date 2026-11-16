import { Renderer } from "@freelensapp/extensions";
import * as MobxReact from "mobx-react";
import { useEffect, useState } from "react";

const { observer } = MobxReact;

const {
  Component: { DrawerItemLabels },
  K8sApi: { apiManager },
} = Renderer;

// The metadata of the objects only, without their data: the extension never reads the values that the operator
// resolved into a `Secret`.
const metadataOnly = "application/json;as=PartialObjectMetadataList;g=meta.k8s.io;v=v1";

export interface ObjectAnnotationsProps {
  /** The name of the drawer item. */
  title: string;
  apiVersion: string;
  kind: string;
  name: string;
  namespace: string | undefined;
  /**
   * Reads the annotations again when it changes: the `resourceVersion` of the object that writes the one shown. The
   * operator writes the object without changing its own object, so a change the operator makes alone shows only when
   * the panel opens again.
   */
  revision: string | undefined;
}

/**
 * The annotations of an object on the cluster, such as the `Secret` that the operator writes, read by name with a
 * field selector: an object that does not exist yet is an empty list, not a 404 that the console logs as an error.
 * Hidden when the object has no annotations, does not exist, or cannot be read. An `observer`, because the host
 * registers the API of a custom resource only after the cluster frame has loaded the CRDs.
 */
export const ObjectAnnotations = observer(
  ({ title, apiVersion, kind, name, namespace, revision }: ObjectAnnotationsProps) => {
    const api = apiManager.getApiByKind(kind, apiVersion);
    const [annotations, setAnnotations] = useState<string[]>([]);

    useEffect(() => {
      if (!api) {
        setAnnotations([]);
        return;
      }

      // Created in the effect, which React runs twice in StrictMode, so that the first cleanup does not abort the
      // request of the second run.
      const abortController = new AbortController();

      api
        .list(
          { namespace, reqInit: { headers: { accept: metadataOnly }, signal: abortController.signal } },
          { fieldSelector: `metadata.name=${name}` },
        )
        .then((objects) => {
          if (!abortController.signal.aborted) {
            setAnnotations(objects?.[0]?.getAnnotations(true) ?? []);
          }
        })
        .catch(() => {
          // Chromium logs the failed request, with its status, in the console.
          if (!abortController.signal.aborted) {
            setAnnotations([]);
          }
        });

      return () => abortController.abort();
    }, [api, name, namespace, revision]);

    return <DrawerItemLabels name={title} labels={annotations} hidden={!annotations.length} />;
  },
);
