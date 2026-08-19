// GENERATED from @particle-academy/fancy-connector-core — src/compat.ts
// Do not edit here. Fix it in the package and re-run `php artisan flow:build`;
// a test fails the build when this copy and the package disagree.

/**
 * The connector API version — what makes two release clocks safe.
 *
 * ## The problem this exists for
 *
 * The core and the connector catalogue are separate repositories, so they
 * release on separate clocks. That is deliberate: a provider changing its API is
 * a connector fix and must not wait on a core release. But it creates a hazard
 * that is worse here than in an ordinary package pair, because **connectors ship
 * as vendored source**:
 *
 * > A consumer copies a connector into their project. Six months later they
 * > upgrade the core. Their copy of the connector was written against a core two
 * > minors older, and pre-1.0 minors are allowed to break.
 *
 * Nothing in a version range catches that, because the vendored copy has no
 * manifest of its own — it is just files in someone else's repository. And the
 * failure is the quiet kind: the connector still compiles, still runs, and does
 * something subtly different.
 *
 * ## The fix: a second number that moves far more slowly
 *
 * The core's package version tracks everything — fixes, additions, internal
 * changes. `CONNECTOR_API_VERSION` tracks only one thing: **the surface a
 * connector is written against.** Adding a module, fixing a classifier, or
 * improving a message does not move it. Changing what a `Connector` must
 * implement, renaming a field a connector declares, or altering what `render`
 * returns does.
 *
 * So a core can go 0.3 → 0.9 without a single vendored connector caring, and the
 * one release that does matter announces itself in a number a connector can
 * check at import time rather than discover at run time.
 *
 * ## The support window, and why it is two rather than one
 *
 * The core accepts the current version **and the one before it**. One would mean
 * every consumer has to re-vendor every connector on the same day the core ships
 * — which nobody does, so in practice they would pin the core instead and stop
 * getting fixes. Two gives a real window: the catalogue re-issues its connectors
 * on the new version, consumers re-vendor when they next touch that connector,
 * and the old shape keeps working until the version after next.
 *
 * More than two would be a promise we cannot keep, because it means maintaining
 * a compatibility shim for a shape nobody has read in a year.
 */

/**
 * The connector surface this core implements.
 *
 * **Bump this ONLY for a change a connector's own source can see**, and say in
 * the changelog what a connector author must DO. If nothing in `connectors/`
 * would have to change, it is not a connector API change.
 */
export const CONNECTOR_API_VERSION = 1;

/**
 * Versions this core will run.
 *
 * Ordered newest first, purely so the error message reads naturally.
 */
export const SUPPORTED_CONNECTOR_API: readonly number[] = [1];

export class ConnectorApiMismatch extends Error {
  readonly connector: string;

  readonly declared: number;

  constructor(message: string, connector: string, declared: number) {
    super(message);
    this.name = "ConnectorApiMismatch";
    this.connector = connector;
    this.declared = declared;
  }
}

/**
 * Refuse a connector written against a surface this core does not implement.
 *
 * **Called at registration, not at call time.** A mismatch discovered on the
 * first real request is a mismatch discovered in production; discovered when the
 * catalogue is assembled, it is a build failure with a name attached.
 *
 * The message names the direction, because the two cases need opposite actions
 * and are trivially confused:
 *
 * - **connector NEWER than the core** → upgrade the core.
 * - **connector OLDER than the window** → re-vendor the connector.
 *
 * "Incompatible versions" sends someone to read source; naming which side is
 * behind sends them to the command.
 */
export function assertConnectorApi(connectorId: string, declared: number): void {
  if (SUPPORTED_CONNECTOR_API.includes(declared)) return;

  const supported = SUPPORTED_CONNECTOR_API.join(", ");

  throw new ConnectorApiMismatch(
    declared > CONNECTOR_API_VERSION
      ? `"${connectorId}" was written against connector API ${declared}, and this core implements ${supported}. ` +
        "The CONNECTOR is newer: upgrade @particle-academy/fancy-connector-core. Vendoring a connector ahead of " +
        "the core it needs is the one direction that cannot be made to work by trying."
      : `"${connectorId}" was written against connector API ${declared}, which is older than anything this core ` +
        `still runs (${supported}). The CONNECTOR is behind: re-vendor it — ` +
        `\`npx fancy-cli@latest add connector ${connectorId}\` — which fetches the copy written for this core. ` +
        "Nothing is adapted automatically, because guessing what a two-version-old connector meant is how a " +
        "connector quietly starts doing something else.",
    connectorId,
    declared,
  );
}

/**
 * Whether a core version satisfies a connector's declared minimum.
 *
 * Exists so a registry or a CLI can answer *before* vendoring, which is the only
 * moment the answer is cheap. Compares the numeric prefix of each dotted
 * segment, so a prerelease suffix does not make `0.4.0-rc.1` sort below `0.3.9`
 * in a way nobody expected.
 */
export function satisfiesMinimum(coreVersion: string, minimum: string): boolean {
  const parts = (value: string): number[] =>
    value
      .split(".")
      .slice(0, 3)
      .map((segment) => Number.parseInt(segment, 10) || 0);

  const [a = 0, b = 0, c = 0] = parts(coreVersion);
  const [x = 0, y = 0, z = 0] = parts(minimum);

  if (a !== x) return a > x;
  if (b !== y) return b > y;

  return c >= z;
}
