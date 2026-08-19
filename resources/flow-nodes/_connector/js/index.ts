// GENERATED from @particle-academy/fancy-connector-core — src/index.ts
// Do not edit here. Fix it in the package and re-run `php artisan flow:build`;
// a test fails the build when this copy and the package disagree.

/**
 * `@particle-academy/fancy-connectors` — the runtime under every Fancy
 * connector.
 *
 * ## What this is
 *
 * The reusable guts of talking to a third-party API: modes and estates,
 * connections, one call path, a failure taxonomy that knows the difference
 * between *it never arrived* and *nobody can tell*, deterministic fakers,
 * webhook verification, pure versioned rendering, chain posting, declared metric
 * shapes, credential-free probes, and API-drift reporting.
 *
 * ## What this is NOT, and never will be
 *
 * It does not own a gate. Approval, liveness, the approved-bytes comparison,
 * consent, second review and every journal belong to the host — because each is
 * enforced in ONE place and every connector inherits it from the dispatch path
 * rather than implementing it. `seam.ts` states this in full.
 *
 * Three consequences that are asserted by tests rather than promised in prose:
 *
 * - **Nothing here reads `process.env`.** Credentials are arguments.
 * - **Nothing here retries an ambiguous failure** on a connector that has not
 *   declared repeating a request harmless.
 * - **Nothing here phones home.** There is no telemetry, no central service, and
 *   no URL this package contacts that a connector did not name.
 */

export * from "./chain";
export * from "./compat";
export * from "./client";
export * from "./connection";
export * from "./delivery";
export * from "./drift";
export * from "./errors";
export * from "./faker";
export * from "./idempotency";
export * from "./metrics";
export * from "./mode";
export * from "./probe";
export * from "./render";
export * from "./seam";
export * from "./text";
export * from "./trigger";
export * from "./webhook";
