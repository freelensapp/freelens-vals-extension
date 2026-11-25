import { Renderer } from "@freelensapp/extensions";
import { ValsSecret } from "../api/vals-secret/vals-secret-v1";

const {
  Component: { Badge, DrawerItem, LocaleDate },
} = Renderer;

// vals-operator records a refresh only after it read the backend and wrote the `Secret` or target, and an operator
// older than v0.14.0 never does.
const pendingTooltip =
  "Not handled yet: vals-operator v0.14.0 or newer reads the backend on the next reconcile and records it in " +
  "Last Handled Refresh. A failed read stays pending and is retried. An older operator never handles it.";

/**
 * A value of the `refresh-requested-at` annotation or of `status.lastHandledRefreshAt`: a date when it is one, as
 * clients write the current time in RFC 3339, and the text otherwise, since the operator takes any string.
 */
function RefreshValue({ value }: { value: string | undefined }) {
  if (!value) {
    return <>-</>;
  }

  return Number.isNaN(Date.parse(value)) ? <>{value}</> : <LocaleDate date={value} />;
}

/**
 * The generation of the object last applied to its `Secret`, and the refresh requested with the `refresh-requested-at`
 * annotation and the one the operator handled last, with a badge while the requested one is pending.
 */
export function RefreshItems({ object }: { object: ValsSecret }) {
  const status = object.status;
  const requested = ValsSecret.getRefreshRequestedAt(object);

  return (
    <>
      <DrawerItem name="Secret Generation">{status?.secretGeneration ?? "-"}</DrawerItem>
      <DrawerItem name="Refresh Requested">
        <RefreshValue value={requested} />
        {ValsSecret.isRefreshPending(object) && (
          <>
            {" "}
            <Badge label="Pending" tooltip={pendingTooltip} />
          </>
        )}
      </DrawerItem>
      <DrawerItem name="Last Handled Refresh">
        <RefreshValue value={status?.lastHandledRefreshAt} />
      </DrawerItem>
    </>
  );
}
