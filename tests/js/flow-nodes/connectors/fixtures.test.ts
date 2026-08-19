import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { registerNodeKind, runFixtures, type FixtureFile } from "@particle-academy/fancy-flow/engine";

import { registerConnectionHost } from "../../../../resources/flow-nodes/_connector/js/connection";

import { stripePaymentIntentKind } from "../../../../resources/flow-nodes/stripe-payment-intent/ui/kind";
import { stripePaymentIntentExecutor } from "../../../../resources/flow-nodes/stripe-payment-intent/js/executor";

import { stripeWebhookTriggerKind } from "../../../../resources/flow-nodes/stripe-webhook-trigger/ui/kind";
import { stripeWebhookTriggerExecutor } from "../../../../resources/flow-nodes/stripe-webhook-trigger/js/executor";

import { resendEmailSendKind } from "../../../../resources/flow-nodes/resend-email-send/ui/kind";
import { resendEmailSendExecutor } from "../../../../resources/flow-nodes/resend-email-send/js/executor";

import { telegramUpdatesTriggerKind } from "../../../../resources/flow-nodes/telegram-updates-trigger/ui/kind";
import { telegramUpdatesTriggerExecutor } from "../../../../resources/flow-nodes/telegram-updates-trigger/js/executor";

/**
 * The connector exemplars, against their golden fixtures.
 *
 * **No network, ever.** Every case runs in `fake` mode, which is not a
 * concession the tests make — it is the mode a consumer develops in, so these
 * exercise the same code path production uses and the faker is under test
 * alongside the executor.
 *
 * The four here are chosen to be genuinely different shapes, because a pattern
 * proved against one provider is a pattern proved against nothing:
 *
 * | node | what it proves |
 * |---|---|
 * | `stripe_payment_intent` | sandbox selected by CREDENTIAL, idempotent writes |
 * | `stripe_webhook_trigger` | a webhook trigger, signature verified before anything runs |
 * | `resend_email_send` | a provider with NO sandbox — fake and live only |
 * | `telegram_updates_trigger` | a trigger that is NOT a webhook (long polling), and a sandbox that is a separate account reached through a URL segment |
 */

const NODES = [
  {
    dir: "stripe-payment-intent",
    kind: stripePaymentIntentKind,
    executor: stripePaymentIntentExecutor,
  },
  {
    dir: "stripe-webhook-trigger",
    kind: stripeWebhookTriggerKind,
    executor: stripeWebhookTriggerExecutor,
  },
  { dir: "resend-email-send", kind: resendEmailSendKind, executor: resendEmailSendExecutor },
  {
    dir: "telegram-updates-trigger",
    kind: telegramUpdatesTriggerKind,
    executor: telegramUpdatesTriggerExecutor,
  },
];

for (const node of NODES) registerNodeKind(node.kind);

const manifestFor = (dir: string) =>
  JSON.parse(
    readFileSync(resolve(process.cwd(), "resources/flow-nodes", dir, "fancy-flow.node.json"), "utf8"),
  );

afterEach(() => {
  // Fixtures run with NO host registered — that is the point of the first case
  // in each file. Leaving one installed would make a later file's "unconfigured"
  // assertions pass for the wrong reason.
  registerConnectionHost(null as never);
});

describe.each(NODES)("$dir", ({ dir, kind, executor }) => {
  const manifest = manifestFor(dir);
  const file = JSON.parse(
    readFileSync(
      resolve(process.cwd(), "resources/flow-nodes", manifest.fixtures.replace(/^nodes\//, "")),
      "utf8",
    ),
  ) as FixtureFile;

  it("declares the kind it registers", () => {
    expect(manifest.kind).toBe(kind.name);
    expect(manifest.aliases).toEqual(kind.aliases);
  });

  it("declares its connector facet, so the registry can file it under a service", () => {
    // Without this a connector is indistinguishable from a core node in the
    // listing, and the default-exclude filter silently stops working for it —
    // which looks exactly like the filter working.
    expect(manifest.connector?.service, `${dir} has no connector.service`).toBeTruthy();
    expect(["trigger", "action", "search"]).toContain(manifest.connector.role);
    expect(["credential", "base-url", "separate-account", "none"]).toContain(manifest.connector.sandbox);
  });

  it("vendors the shared connector runtime alongside itself", () => {
    // A connector node without `_connector` copies in as source that cannot
    // import anything. It installs cleanly and fails at the first build.
    expect(manifest.shared).toContain("_connector");
  });

  it("declares an output shape — the ingredients a downstream node picks from", () => {
    // The manifest's copy is what the MCP serves, so an AGENT can enumerate the
    // fields rather than guess them; the kind's copy is what the editor's
    // variable picker reads. Both, or one surface silently has nothing to offer.
    expect(manifest.outputShape?.length, `${dir} declares no outputShape`).toBeGreaterThan(0);
    expect(Array.isArray(kind.outputShape)).toBe(true);
    expect((kind.outputShape as Array<{ path: string }>).map((f) => f.path)).toEqual(
      manifest.outputShape.map((f: { path: string }) => f.path),
    );
  });

  it("offers a connection and a mode field, in that order, on every connector", () => {
    // Uniformity is the feature: an agent that has configured one connector has
    // configured all of them.
    const keys = (kind.configSchema ?? []).map((field) => field.key);
    expect(keys.slice(0, 2)).toEqual(["connection", "mode"]);
  });

  it("never offers a sandbox mode to a provider that has none", () => {
    const mode = (kind.configSchema ?? []).find((field) => field.key === "mode") as {
      options: Array<{ value: string }>;
    };
    const offered = mode.options.map((option) => option.value);

    if (manifest.connector.sandbox === "none") {
      expect(offered).not.toContain("sandbox");
    } else {
      expect(offered).toContain("sandbox");
    }
  });

  it("passes every golden fixture", async () => {
    const result = await runFixtures(file, executor);
    expect(result.failures, JSON.stringify(result.failures, null, 2)).toEqual([]);
  });
});

describe("credentials never reach the graph", () => {
  it("no connector node declares a config field that stores a secret", () => {
    // A `WorkflowSchema` is plain JSON: exported, committed, handed to agents,
    // pasted into issues. The only credential-shaped field a connector may carry
    // is `connection`, which holds an opaque non-secret id the host resolves.
    for (const node of NODES) {
      for (const field of node.kind.configSchema ?? []) {
        if (field.type !== "credential") continue;
        expect(field.key, `${node.dir} stores a credential in config`).toBe("connection");
      }

      const keys = (node.kind.configSchema ?? []).map((field) => field.key.toLowerCase());
      for (const forbidden of ["apikey", "secret", "token", "password", "secretkey"]) {
        expect(keys, `${node.dir} has a "${forbidden}" config field`).not.toContain(forbidden);
      }
    }
  });

  it("no node source contains anything shaped like a live key", () => {
    // Cheap, and it catches the one mistake that cannot be walked back: a real
    // key committed as an "example". Placeholders that LOOK real are banned for
    // the same reason — someone will copy one into a support ticket.
    const suspects = [/\bsk_live_[A-Za-z0-9]/, /\bsk_test_[A-Za-z0-9]/, /\bre_[A-Za-z0-9]{20}/, /\bxoxb-\d/];

    for (const node of NODES) {
      for (const part of ["ui/kind.ts", "js/executor.ts"]) {
        const src = readFileSync(
          resolve(process.cwd(), "resources/flow-nodes", node.dir, part),
          "utf8",
        );
        for (const suspect of suspects) {
          expect(suspect.test(src), `${node.dir}/${part} looks like it contains a key`).toBe(false);
        }
      }
    }
  });
});
