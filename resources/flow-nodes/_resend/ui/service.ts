/**
 * Resend's identity on the authoring surface.
 *
 * `ui/` lands on EVERY host, so it must import nothing from `js/` — the
 * vendoring test fails the build if it does.
 */

import type { ConnectorMeta } from "../../_connector/ui/connector";

export const RESEND_SERVICE = {
  service: "resend",
  serviceTitle: "Resend",
  domain: "email",
  // No test estate. The shared field builder reads this and simply does not
  // offer "sandbox" — a choice the provider cannot honour is an invitation to
  // pick it and read an error.
  sandbox: "none",
} as const satisfies Pick<ConnectorMeta, "service" | "serviceTitle" | "domain" | "sandbox">;

export function resendMeta(
  role: ConnectorMeta["role"],
  operation: string,
  docs: string,
): ConnectorMeta {
  return { ...RESEND_SERVICE, role, operation, docs };
}
