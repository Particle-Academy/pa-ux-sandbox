/**
 * Resend — the exemplar for a provider with NO sandbox.
 *
 * ## Why this shape matters enough to be an exemplar
 *
 * Roughly a third of the providers worth connecting have no test estate at all.
 * Resend, Mailchimp, Loops, Discord, Attio, Close, Help Scout, Front, Linear:
 * for every one of them, "just try it" means writing to production. Front's
 * production data is live customer email.
 *
 * A connector catalogue that only worked properly for providers with sandboxes
 * would be a catalogue you cannot evaluate for a third of what it covers. So
 * `fake` is not the fallback here — it is the primary development mode, and the
 * node's `mode` field does not offer "sandbox" at all, because offering a choice
 * the provider cannot honour is an invitation to pick it and read an error.
 *
 * Resend does publish simulator RECIPIENTS (`delivered@resend.dev`,
 * `bounced@resend.dev`, …). Those are not a sandbox: the send is real, it is
 * billed, and it counts against the quota. Modelling them as one would put a
 * live send behind a control labelled "test".
 */

import type { ServiceDescriptor } from "../../_connector/js/client";
import type { ConnectorFaker } from "../../_connector/js/faker";

const API = "https://api.resend.com";

/**
 * Resend's simulator recipients, offered as choices on the node.
 *
 * Named for what they are — live sends that land in a simulator — so nobody
 * reads them as a test estate.
 */
export const RESEND_SIMULATOR_RECIPIENTS = [
  "delivered@resend.dev",
  "bounced@resend.dev",
  "complained@resend.dev",
  "suppressed@resend.dev",
] as const;

export const resendFaker: ConnectorFaker = (operation, request) => {
  const { fake, config } = request;

  if (operation !== "email_send") {
    throw new Error(
      `resend: no fake response is defined for "${operation}". Add one to resendFaker before shipping ` +
        "a node that calls it.",
    );
  }

  return {
    id: fake.hex(8) + "-" + fake.hex(4) + "-" + fake.hex(4) + "-" + fake.hex(4) + "-" + fake.hex(12),
    from: String(config.from ?? "noreply@example.test"),
    to: toList(config.to),
    subject: String(config.subject ?? ""),
    created_at: fake.timestamp(),
    last_event: "delivered",
  };
};

function toList(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value !== "string" || value.trim() === "") return [];

  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export const RESEND: ServiceDescriptor = {
  service: "resend",
  title: "Resend",
  // The whole point of this exemplar. `sandbox: "none"` makes the shared mode
  // resolver fall through to `fake` on a local project rather than to a test
  // estate that does not exist.
  sandbox: "none",
  baseUrls: { live: API },
  requires: ["apiKey"],
  authorize: (credentials, request) => {
    request.headers.Authorization = `Bearer ${credentials.apiKey}`;
    // Not optional and not cosmetic: Resend answers 403 to a request with no
    // User-Agent, which reads exactly like a bad key and sends people to rotate
    // a credential that was fine.
    request.headers["User-Agent"] = "fancy-flow-connector";
  },
  faker: resendFaker,
};
