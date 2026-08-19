/**
 * Telegram's identity on the authoring surface.
 *
 * `ui/` lands on EVERY host, so it must import nothing from `js/`.
 */

import type { ConnectorMeta } from "../../_connector/ui/connector";

export const TELEGRAM_SERVICE = {
  service: "telegram",
  serviceTitle: "Telegram",
  domain: "messaging",
  // Telegram's test environment is a genuinely separate account: you create a
  // new account inside it and register a new bot there. The `/test` URL segment
  // is how you reach it, but the account is what makes it separate.
  sandbox: "separate-account",
} as const satisfies Pick<ConnectorMeta, "service" | "serviceTitle" | "domain" | "sandbox">;

export function telegramMeta(
  role: ConnectorMeta["role"],
  operation: string,
  docs: string,
): ConnectorMeta {
  return { ...TELEGRAM_SERVICE, role, operation, docs };
}
