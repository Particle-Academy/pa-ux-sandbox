// GENERATED from @particle-academy/fancy-connector-core — src/metrics.ts
// Do not edit here. Fix it in the package and re-run `php artisan flow:build`;
// a test fails the build when this copy and the package disagree.

/**
 * Making a declared metric shape checkable against the code that produces it.
 *
 * ## The bug this exists to catch, which shipped for weeks
 *
 * Two connectors in the reference implementation declared
 * `capabilities.metrics: true` while their metric fetch returned `[]`. A pull
 * therefore did not skip them — it asked, got nothing, and reported nothing,
 * which on a dashboard is indistinguishable from *"we asked and nobody
 * engaged"*. A capability flag had quietly turned an unimplemented feature into
 * a reported zero, on the one surface whose entire job is not making claims it
 * cannot stand behind.
 *
 * A declared shape and the code that produces the numbers are the classic pair
 * that agrees on the day it is written and drifts silently after. So the mapping
 * is extracted as a **pure function per connector**, and these helpers feed it a
 * synthetic response and compare the keys it returns against the keys declared.
 * **No credentials, no network.**
 *
 * ## And the rule underneath all of it
 *
 * **Absent stays absent.** A count the provider did not send is omitted, never
 * reported as zero. A zero says "nothing happened"; an absence says "we don't
 * know". A measurement surface that confuses those is worthless, and the
 * confusion is one `?? 0` away.
 */

import type { Connector, MetricDescriptor } from "./seam";

export type ShapeMismatch = {
  connector: string;
  /** Keys the mapping produced that nothing declared. */
  undeclared: string[];
  /** Keys declared that the mapping never produces. */
  unproduced: string[];
};

/**
 * Compare a declared shape against what a mapping actually returns.
 *
 * `produced` is the output of the connector's pure response→metrics function
 * given a synthetic response with EVERY field populated. Anything the mapping
 * can emit therefore appears, and anything it cannot is caught as a declaration
 * nobody can honour.
 */
export function compareShape(
  connectorId: string,
  declared: MetricDescriptor[] | undefined,
  produced: Record<string, number>,
): ShapeMismatch | null {
  const declaredKeys = new Set((declared ?? []).map((metric) => metric.key));
  const producedKeys = new Set(Object.keys(produced));

  const undeclared = [...producedKeys].filter((key) => !declaredKeys.has(key)).sort();
  const unproduced = [...declaredKeys].filter((key) => !producedKeys.has(key)).sort();

  if (undeclared.length === 0 && unproduced.length === 0) return null;

  return { connector: connectorId, undeclared, unproduced };
}

/**
 * Every way a capability flag can outrun the code, as findings.
 *
 * Returns strings rather than throwing so a host can report all of them at once.
 * A check that stops at the first problem trains people to fix one thing and
 * re-run, which is how a list of six becomes six rounds.
 */
export function capabilityProblems(connector: Connector<never>): string[] {
  const problems: string[] = [];

  if (connector.capabilities.metrics) {
    if (!connector.metricShape || connector.metricShape.length === 0) {
      problems.push(
        `${connector.id} claims capabilities.metrics but declares no metricShape. A pull will therefore ask it, ` +
          "get nothing, and report nothing — which reads as \"nobody engaged\" rather than \"not implemented\".",
      );
    }
    if (!connector.fetchMetrics) {
      problems.push(`${connector.id} claims capabilities.metrics but has no fetchMetrics.`);
    }
  }

  if (!connector.capabilities.metrics && connector.metricShape) {
    problems.push(
      `${connector.id} declares a metricShape but capabilities.metrics is false. One of the two is wrong, and ` +
        "the shape is the more believable half.",
    );
  }

  if (connector.capabilities.feedback && !connector.fetchFeedback) {
    problems.push(`${connector.id} claims capabilities.feedback but has no fetchFeedback.`);
  }

  if (!connector.capabilities.feedback && connector.fetchFeedback) {
    problems.push(
      `${connector.id} implements fetchFeedback but does not claim the capability, so nothing will ever call it.`,
    );
  }

  for (const metric of connector.metricShape ?? []) {
    if (metric.means.trim().length < 10) {
      problems.push(`${connector.id}.${metric.key} does not say what it means.`);
    }
  }

  if (connector.delivery.idempotent && connector.delivery.why.trim().length < 10) {
    problems.push(
      `${connector.id} declares idempotent: true with no reason. That is the one claim whose failure is a public ` +
        "duplicate, so it has to name the mechanism rather than restate the flag.",
    );
  }

  if (connector.delivery.minIntervalMs > 0 && !connector.delivery.citation && connector.delivery.rateSource === "documented") {
    problems.push(
      `${connector.id} calls its rate limit "documented" but cites nothing. A number nobody can source gets quoted ` +
        "as a platform fact; label it self-imposed or cite it.",
    );
  }

  return problems;
}

/**
 * Drop keys whose value the provider did not actually send.
 *
 * The one function a connector's mapping should build on, so *absent stays
 * absent* is a property of the code rather than a habit. `0` survives; `null`,
 * `undefined` and non-numbers do not.
 */
export function reported(values: Record<string, unknown>): Record<string, number> {
  const out: Record<string, number> = {};

  for (const [key, value] of Object.entries(values)) {
    if (typeof value === "number" && Number.isFinite(value)) out[key] = value;
  }

  return out;
}
