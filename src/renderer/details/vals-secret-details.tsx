import { Renderer } from "@freelensapp/extensions";
import * as MobxReact from "mobx-react";
import { Fragment } from "react";
import { ValsSecret } from "../api/vals-secret/vals-secret-v1";
import styles from "./details.module.scss";
import { RolloutTargets } from "./rollout-targets";
import { TemplateEditor, Templates } from "./templates";

import type { Database, DataSource, Target, TargetStatus } from "../api/vals-secret/vals-secret-v1";

const { observer } = MobxReact;

const {
  Component: {
    DrawerItem,
    DrawerItemLabels,
    DrawerTitle,
    LinkToObject,
    LinkToSecret,
    LocaleDate,
    Table,
    TableCell,
    TableHead,
    TableRow,
  },
} = Renderer;

export type ValsSecretDetailsProps = Renderer.Component.KubeObjectDetailsProps<ValsSecret>;

/**
 * The sources of the data, by their `ref`. The extension reads the `ValsSecret` only, never a resolved value.
 */
function DataSources({ data }: { data: Record<string, DataSource> | undefined }) {
  const entries = Object.entries(data ?? {});

  if (!entries.length) {
    return null;
  }

  return (
    <>
      <DrawerTitle>Data</DrawerTitle>
      <Table className={styles.dataTable} selectable={false} scrollable={false}>
        <TableHead flat>
          <TableCell className={styles.key}>Key</TableCell>
          <TableCell className={styles.ref}>Ref</TableCell>
          <TableCell className={styles.encoding}>Encoding</TableCell>
        </TableHead>
        {entries.map(([key, source]) => (
          <TableRow key={key}>
            <TableCell className={styles.key}>{key}</TableCell>
            <TableCell className={styles.ref}>{source.ref}</TableCell>
            <TableCell className={styles.encoding}>{source.encoding ?? "-"}</TableCell>
          </TableRow>
        ))}
      </Table>
    </>
  );
}

function DatabaseItems({ object, database }: { object: ValsSecret; database: Database }) {
  const login = database.loginCredentials;

  return (
    <>
      <DrawerItem name="Driver">{database.driver}</DrawerItem>
      <DrawerItem name="Hosts">{database.hosts.join(", ")}</DrawerItem>
      <DrawerItem name="Port" hidden={database.port === undefined}>
        {database.port}
      </DrawerItem>
      <DrawerItem name="User Host" hidden={!database.userHost}>
        {database.userHost}
      </DrawerItem>
      <DrawerItem name="Protocol" hidden={!database.protocol}>
        {database.protocol}
      </DrawerItem>
      <DrawerItem name="TLS" hidden={!database.tls}>
        {database.tls}
      </DrawerItem>
      <DrawerItem name="Username Key" hidden={!database.usernameKey}>
        {database.usernameKey}
      </DrawerItem>
      <DrawerItem name="Password Key">{database.passwordKey}</DrawerItem>
      {login && (
        <>
          <DrawerItem name="Login Secret">
            <LinkToSecret name={login.secretName} namespace={login.namespace || object.getNs()} />
          </DrawerItem>
          <DrawerItem name="Login Username Key" hidden={!login.usernameKey}>
            {login.usernameKey}
          </DrawerItem>
          <DrawerItem name="Login Password Key">{login.passwordKey}</DrawerItem>
        </>
      )}
    </>
  );
}

function Databases({ object, databases }: { object: ValsSecret; databases: Database[] | undefined }) {
  if (!databases?.length) {
    return null;
  }

  return (
    <>
      {databases.map((database, index) => (
        // The databases have no key of their own; the list is the spec's, in its order.
        <Fragment key={index}>
          <DrawerTitle>{databases.length > 1 ? `Database ${index + 1}` : "Database"}</DrawerTitle>
          <DatabaseItems object={object} database={database} />
        </Fragment>
      ))}
    </>
  );
}

function TargetItems({ object, target }: { object: ValsSecret; target: Target | undefined }) {
  if (!target) {
    return null;
  }

  return (
    <>
      <DrawerTitle>Target</DrawerTitle>
      <DrawerItem name="API Version">{target.apiVersion}</DrawerItem>
      <DrawerItem name="Kind">{target.kind}</DrawerItem>
      <DrawerItem name="Name">{target.name || object.getName()}</DrawerItem>
      <DrawerItem name="Mode">{target.mode ?? "create"}</DrawerItem>
      <DrawerItemLabels name="Labels" labels={target.labels ?? {}} hidden={!Object.keys(target.labels ?? {}).length} />
      <DrawerItemLabels
        name="Annotations"
        labels={target.annotations ?? {}}
        hidden={!Object.keys(target.annotations ?? {}).length}
      />
      <div className={styles.templateItem}>
        <div className="DrawerItem">Template</div>
        <TemplateEditor template={target.template} />
      </div>
    </>
  );
}

function TargetStatusItems({ object, status }: { object: ValsSecret; status: TargetStatus | undefined }) {
  if (!status) {
    return null;
  }

  const objectRef = {
    apiVersion: status.apiVersion,
    kind: status.kind,
    name: status.name,
    namespace: status.namespace,
  };

  return (
    <>
      <DrawerTitle>Target Status</DrawerTitle>
      <DrawerItem name="API Version">{status.apiVersion}</DrawerItem>
      <DrawerItem name="Kind">{status.kind}</DrawerItem>
      <DrawerItem name="Name">
        <LinkToObject object={object} objectRef={objectRef} />
      </DrawerItem>
      <DrawerItem name="Namespace">{status.namespace}</DrawerItem>
      <DrawerItem name="Mode">{status.mode}</DrawerItem>
      <DrawerItem name="Hash" hidden={!status.hash}>
        {status.hash}
      </DrawerItem>
      <DrawerItem name="Last Applied" hidden={!status.lastApplied}>
        {status.lastApplied && <LocaleDate date={status.lastApplied} />}
      </DrawerItem>
    </>
  );
}

// The host shows the printer columns of the CRD, Target and Ready, and the conditions, with their reason and message in
// the tooltip, above the panel.
export const ValsSecretDetails = observer(({ object }: ValsSecretDetailsProps) => {
  const spec = object.spec;
  const secretName = ValsSecret.getSecretName(object);

  return (
    <>
      <DrawerItem name="Secret">
        {secretName ? <LinkToSecret name={secretName} namespace={object.getNs()} /> : "-"}
      </DrawerItem>
      <DrawerItem name="Secret Type" hidden={!spec?.type}>
        {spec?.type}
      </DrawerItem>
      <DrawerItem name="TTL" hidden={spec?.ttl === undefined}>
        {spec?.ttl}s
      </DrawerItem>
      <DataSources data={spec?.data} />
      <Templates templates={spec?.template} />
      <Databases object={object} databases={spec?.databases} />
      <RolloutTargets object={object} targets={spec?.rollout} />
      <TargetItems object={object} target={spec?.target} />
      <TargetStatusItems object={object} status={object.status?.target} />
    </>
  );
});
