/**
 * Copyright (c) Freelens Authors. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */

// One session for both kinds. The session disconnects the kind cluster, sets
// up the CRDs and the test objects of examples/test, connects the cluster
// again, so that the app reads the CRDs anew, and leaves the cluster
// disconnected; it does not depend on another test file having run. No
// operator runs, so the objects have no status.

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  appReady,
  connectApp,
  disconnectKindCluster,
  installExtension,
  openDetails,
  openKindCluster,
  openListPage,
  rowCells,
  setUpCluster,
  tearDownCluster,
} from "./extension-helpers";

import type { Frame } from "playwright";

import type { AppSession } from "./extension-helpers";

describe.skipIf(!(await appReady({ cluster: true })))("ValsSecret and DbSecret views", () => {
  let session: AppSession | undefined;
  let frame: Frame;

  beforeAll(
    async () => {
      session = await connectApp();
      await disconnectKindCluster(session);
      setUpCluster();
      await installExtension(session);
      frame = await openKindCluster(session);
    },
    10 * 60 * 1000,
  );

  afterAll(
    async () => {
      let errors: string[] = [];

      try {
        // The errors first: the app refreshes the cluster while it disconnects,
        // and logs errors of its own when the refresh loses the race.
        errors = (await session?.stopCollecting()) ?? [];

        // The cluster then: the app watches the CRDs, and would log errors for
        // CRDs deleted under it.
        if (session) {
          await disconnectKindCluster(session);
        }

        await session?.close();
      } finally {
        tearDownCluster();
      }

      expect(errors).toEqual([]);
    },
    10 * 60 * 1000,
  );

  it("lists the ValsSecrets", async () => {
    const [secret, target] = await openListPage(frame, "vals-secrets", ["test", "test-target"]);

    // Name, Namespace, Secret, Data; the cells of the host around them are left out.
    expect(await rowCells(secret)).toEqual(
      expect.arrayContaining(["test", "integration-tests", "test-credentials", "3"]),
    );
    expect(await rowCells(target)).toEqual(expect.arrayContaining(["test-target", "integration-tests", "-", "1"]));
  });

  it("shows the details of a ValsSecret", async () => {
    const [row] = await openListPage(frame, "vals-secrets", ["test"]);

    expect(await openDetails(frame, row, "test", "Secret")).toBe("test-credentials");
  });

  it("lists the DbSecret", async () => {
    const [row] = await openListPage(frame, "db-secrets", ["test"]);

    // Name, Namespace, Secret, Vault Mount, Vault Role
    expect(await rowCells(row)).toEqual(
      expect.arrayContaining(["test", "integration-tests", "test-db-credentials", "database", "test-app"]),
    );
  });

  it("shows the details of a DbSecret", async () => {
    const [row] = await openListPage(frame, "db-secrets", ["test"]);

    expect(await openDetails(frame, row, "test", "Vault Mount")).toBe("database");
  });
});
