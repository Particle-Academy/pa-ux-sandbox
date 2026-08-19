/**
 * Stripe's identity on the authoring surface, shared by every Stripe node.
 *
 * `ui/` lands on EVERY host — a PHP project vendors `ui/` and `php/` and never
 * `js/` — so this file must import nothing from `js/`. The vendoring test in
 * `tests/js/flow-nodes/vendoring.test.ts` fails the build if it does, because
 * that import is a dangling module the moment the node is copied for PHP.
 */

import type { ConnectorMeta } from "../../_connector/ui/connector";

/** The parts of a connector's identity that belong to the SERVICE, not the node. */
export const STRIPE_SERVICE = {
  service: "stripe",
  serviceTitle: "Stripe",
  domain: "payments",
  sandbox: "credential",
} as const satisfies Pick<ConnectorMeta, "service" | "serviceTitle" | "domain" | "sandbox">;

/** Build a Stripe node's connector metadata from the operation it performs. */
export function stripeMeta(
  role: ConnectorMeta["role"],
  operation: string,
  docs: string,
): ConnectorMeta {
  return { ...STRIPE_SERVICE, role, operation, docs };
}
