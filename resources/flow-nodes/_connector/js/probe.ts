// GENERATED from @particle-academy/fancy-connectors — src/probe.ts
// Do not edit here. Fix it in the package and re-run `php artisan flow:build`;
// a test fails the build when this copy and the package disagree.

/**
 * Dry-verify — proving the transport with a credential that cannot work.
 *
 * ## The discipline, and why it beats a fake server
 *
 * A connector written from documentation can be wrong in three ways that look
 * identical until a real credential arrives:
 *
 * 1. the URL is wrong,
 * 2. the request shape is wrong,
 * 3. the error handling never runs.
 *
 * **All three are invisible to a test with a fake server**, because a fake
 * server agrees with whatever the code does. That is the single most important
 * thing this module encodes: a green unit suite against a mock proves the code
 * is consistent with itself.
 *
 * So a probe calls the REAL API with a deliberately invalid credential and
 * requires an **auth-shaped refusal**. That proves the host resolved, the path
 * exists, the method was accepted, and a failure was recognised as a failure.
 *
 * ## What counts as a pass, precisely
 *
 * An auth-shaped refusal is `401`, `403`, or a `404` on a provider that answers
 * 404 for an unknown credential-in-the-path (a Discord webhook does exactly
 * this). The provider declares which, because guessing here would let a genuine
 * "this endpoint moved" 404 read as success — the one outcome a probe exists to
 * catch.
 *
 * ## Offline is SKIPPED, never failed
 *
 * A check that goes red on a train gets ignored, and then it is worth nothing
 * when it goes red for real. Unreachable is reported as skipped with the reason,
 * and the assertions that need no network still run.
 *
 * ## And nothing is ever sent
 *
 * Every probe is a READ. A probe that wrote something would be a send, and sends
 * are the host's to gate.
 */

import { classifyError, classifyStatus, type FailureKind } from "./delivery";

export type ProbeOutcome = "pass" | "fail" | "skip";

export type ProbeResult = {
  connector: string;
  outcome: ProbeOutcome;
  /** What happened, in the provider's own words where possible. */
  detail: string;
  status?: number;
  kind?: FailureKind;
};

export type ProbeSpec = {
  /** Which connector this probes. */
  connector: string;
  /**
   * The read-only request, fully formed, carrying a credential that cannot be
   * valid. Built by the connector so the probe exercises the connector's own URL
   * and auth placement rather than a second copy of them.
   */
  request: () => Promise<{ status: number; body: string }>;
  /**
   * Statuses that count as an auth-shaped refusal for THIS provider.
   *
   * Declared rather than assumed. Discord answers `404` for an unknown webhook
   * id, and on a provider that does not, a 404 means the endpoint moved — the
   * exact drift a probe is for.
   */
  authStatuses: number[];
  /** Why those statuses, for whoever reads a failure at 3am. */
  why: string;
};

/**
 * Run one probe.
 *
 * Never throws. A probe that threw would take the suite down with it, and the
 * suite's whole value is that it runs everywhere including on a laptop with no
 * network.
 */
export async function probe(spec: ProbeSpec): Promise<ProbeResult> {
  let response: { status: number; body: string };

  try {
    response = await spec.request();
  } catch (error) {
    const classified = classifyError(error);

    // Unreachable is a fact about the machine, not about the connector.
    if (classified.kind === "unreachable") {
      return { connector: spec.connector, outcome: "skip", detail: `offline — ${classified.detail}` };
    }

    return {
      connector: spec.connector,
      outcome: "fail",
      detail: `the request failed before any status arrived — ${classified.detail}`,
      kind: classified.kind,
    };
  }

  const { status, body } = response;

  if (spec.authStatuses.includes(status)) {
    return {
      connector: spec.connector,
      outcome: "pass",
      status,
      detail: `${status} — the provider refused an invalid credential, which proves host, path, method and error handling. ${spec.why}`,
    };
  }

  if (status < 400) {
    // A success with a credential that cannot be valid means the request is not
    // doing what it appears to. Worse than a failure, because it is green.
    return {
      connector: spec.connector,
      outcome: "fail",
      status,
      detail:
        `${status} — the provider ACCEPTED a deliberately invalid credential. Either the credential is reaching ` +
        "nothing (wrong header, wrong field) or this endpoint does not authenticate. Neither is safe to ship.",
    };
  }

  const classified = classifyStatus(status, body);

  return {
    connector: spec.connector,
    outcome: "fail",
    status,
    kind: classified.kind,
    detail:
      `${status} — expected one of ${spec.authStatuses.join(", ")}. A ${status} here usually means the endpoint ` +
      `moved or the path is wrong, which no amount of local mocking would ever have said. ${body.slice(0, 200)}`,
  };
}

export type ProbeReport = {
  results: ProbeResult[];
  passed: number;
  failed: number;
  skipped: number;
  /** True when nothing failed. Skips do not fail a report. */
  ok: boolean;
};

/** Run a set of probes and summarise. Sequential: probes hit real providers. */
export async function runProbes(specs: ProbeSpec[]): Promise<ProbeReport> {
  const results: ProbeResult[] = [];

  for (const spec of specs) results.push(await probe(spec));

  const passed = results.filter((result) => result.outcome === "pass").length;
  const failed = results.filter((result) => result.outcome === "fail").length;
  const skipped = results.filter((result) => result.outcome === "skip").length;

  return { results, passed, failed, skipped, ok: failed === 0 };
}
