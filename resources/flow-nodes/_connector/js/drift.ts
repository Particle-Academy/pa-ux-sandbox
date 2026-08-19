// GENERATED from @particle-academy/fancy-connector-core — src/drift.ts
// Do not edit here. Fix it in the package and re-run `php artisan flow:build`;
// a test fails the build when this copy and the package disagree.

/**
 * API drift — being told the provider changed, rather than discovering it.
 *
 * ## The failure this addresses
 *
 * A connector's worst failure is silent. The provider changes its API and
 * nothing says so until something breaks in production — and by then the person
 * who wrote the connector has moved on, the reason it worked is gone, and the
 * first symptom is usually a 400 that reads like bad input.
 *
 * ## What the system DOES on drift: it REPORTS. It never adapts.
 *
 * This is the load-bearing decision and it is deliberate.
 *
 * A connector that reshapes itself around a changed API is worse than one that
 * fails loudly, for three reasons that compound:
 *
 * 1. **It cannot be reviewed.** The bytes that go out stop being a function of
 *    the source someone read. A host that guarantees "what was approved is what
 *    was sent" cannot make that guarantee about code that rewrote itself.
 * 2. **Its behaviour depends on WHEN it ran**, because it depends on what the
 *    spec said at that moment. Two runs of the same workflow on the same input
 *    can differ, and nothing in the run record explains why.
 * 3. **Adaptation is only ever a guess at intent.** A renamed field might be a
 *    rename or might be a different field with a similar name; a removed one
 *    might be gone or moved. Getting it wrong writes wrong data confidently.
 *
 * ## And it never changes RUNTIME behaviour either
 *
 * A drift check runs out of band — on a schedule, in CI, on demand. It does not
 * fail a call that is working. If the spec changed and the call still succeeds,
 * failing the run would be a self-inflicted outage caused by a document. The
 * only thing that changes runtime behaviour is the provider actually refusing,
 * which the error taxonomy already handles.
 *
 * So: **drift reports; the provider decides; a person acts.**
 *
 * ## Two detection strategies, because most providers publish nothing
 *
 * 1. **Specs**, where a provider publishes a machine-readable one at a stable
 *    URL. Checked against the connector's declared slice — see `ApiContract`.
 * 2. **Recorded shapes**, where it does not. A fixture of the response fields a
 *    connector reads, compared against a live response on a schedule. Field
 *    NAMES only; values are never recorded, because a recorded response from a
 *    real account is a data leak wearing a test fixture's clothes.
 *
 * The second is the fallback and is designed anyway, because it is the majority
 * case: of the providers surveyed for this package, the ones publishing a
 * maintained spec are a minority, and publishing one is not the same as
 * maintaining it — `slackapi/slack-api-specs` has not been touched since 2021.
 */

/* ── What a connector declares it depends on ─────────────────────────────── */

/**
 * One operation a connector calls.
 *
 * The `path` is the TEMPLATE, matching the provider's own documentation, so it
 * can be looked up in a spec: `/v1/charges/{charge}`, not the interpolated URL.
 */
export type ContractOperation = {
  /** Stable name, matching the connector's own operation id. */
  operation: string;
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  path: string;
  /** Request fields the connector SENDS. Drift here breaks writes. */
  sends?: string[];
  /** Response fields the connector READS. Drift here breaks reads, silently. */
  reads?: string[];
};

/**
 * Where a provider's machine-readable description lives.
 *
 * `kind` matters because "machine-readable" is not one format. AT Protocol
 * publishes **lexicons**, not OpenAPI, and a checker that assumed OpenAPI would
 * report every AT Protocol connector as unspecified — which is a different and
 * much worse answer than "specified, in another format".
 */
export type SpecSource =
  | { kind: "openapi"; url: string; note?: string }
  | { kind: "lexicon"; url: string; note?: string }
  | {
      kind: "none";
      /**
       * Why there is no spec, and what the fallback is. Required — "none" with
       * no reason is indistinguishable from "nobody looked".
       */
      note: string;
    };

/** Everything a connector declares about the API it was written against. */
export type ApiContract = {
  connector: string;
  /** Base URL the operations hang off, for a human reading the report. */
  baseUrl?: string;
  spec: SpecSource;
  operations: ContractOperation[];
  /** When a person last read the provider's documentation for this contract. */
  reviewedOn: string;
};

/* ── What a check produces ───────────────────────────────────────────────── */

export type DriftFinding = {
  /**
   * `missing-operation` — the path or method is gone. A write will start failing.
   * `missing-request-field` — something we send is no longer accepted.
   * `missing-response-field` — something we read is gone. **Silent**: the code
   *   keeps running and produces nothing, which is the dangerous one.
   * `unreadable-spec` — the spec URL moved or stopped parsing. Not drift in the
   *   API, but drift in our ability to see it, and it must not read as "clean".
   * `stale-review` — nobody has looked at this contract in a long time.
   */
  kind:
    | "missing-operation"
    | "missing-request-field"
    | "missing-response-field"
    | "unreadable-spec"
    | "stale-review";
  operation?: string;
  detail: string;
};

export type DriftReport = {
  connector: string;
  checkedAt: string;
  /** `unchecked` is a real outcome and never counts as clean. */
  outcome: "clean" | "drifted" | "unchecked";
  findings: DriftFinding[];
  /** How the check was done, so a report can be read without the code. */
  method: "openapi" | "lexicon" | "recorded-shape" | "none";
};

/* ── OpenAPI, read narrowly and on purpose ───────────────────────────────── */

/**
 * The subset of OpenAPI this needs.
 *
 * Deliberately not a full parser and deliberately not a dependency. The general
 * problem — diff two OpenAPI documents — is large, and we do not have it. We
 * have a much smaller one: *for the operations this connector actually calls,
 * do the path, the method, and the fields we send and read still exist?*
 *
 * That projection is ours by definition, it is a few dozen lines, and it does
 * not drag a schema-validation library into every consumer's tree. A full diff
 * would also report thousands of changes to parts of the API nobody here calls,
 * which is the reliable way to make a drift report unread.
 */
type OpenApiDocument = {
  paths?: Record<string, Record<string, unknown>>;
  components?: { schemas?: Record<string, unknown> };
};

/** Resolve a local `$ref`. Remote refs are not followed — see `resolveRef`. */
function resolveRef(document: OpenApiDocument, node: unknown, depth = 0): unknown {
  if (depth > 8 || node === null || typeof node !== "object") return node;

  const ref = (node as { $ref?: string }).$ref;
  if (typeof ref !== "string") return node;

  // Only same-document refs. A remote `$ref` would mean fetching arbitrary URLs
  // from a document we do not control, which is a request-forgery surface for a
  // check that runs on a schedule with nobody watching.
  if (!ref.startsWith("#/")) return node;

  let current: unknown = document;
  for (const segment of ref.slice(2).split("/")) {
    if (current === null || typeof current !== "object") return node;
    current = (current as Record<string, unknown>)[segment.replace(/~1/g, "/").replace(/~0/g, "~")];
  }

  return resolveRef(document, current, depth + 1);
}

/** Property names on a schema, following local refs and one level of composition. */
function propertiesOf(document: OpenApiDocument, schema: unknown, depth = 0): Set<string> {
  const names = new Set<string>();
  const resolved = resolveRef(document, schema, depth) as Record<string, unknown> | null;

  if (!resolved || typeof resolved !== "object" || depth > 6) return names;

  const properties = resolveRef(document, resolved.properties, depth + 1);
  if (properties && typeof properties === "object") {
    for (const key of Object.keys(properties as Record<string, unknown>)) names.add(key);
  }

  // `data` / `items` wrappers are near-universal and a connector reads through
  // them, so an envelope must not read as "the field is gone".
  for (const key of ["items", "additionalProperties"]) {
    const nested = resolved[key];
    if (nested) for (const name of propertiesOf(document, nested, depth + 1)) names.add(name);
  }

  for (const key of ["allOf", "oneOf", "anyOf"]) {
    const list = resolved[key];
    if (Array.isArray(list)) {
      for (const entry of list) for (const name of propertiesOf(document, entry, depth + 1)) names.add(name);
    }
  }

  return names;
}

function requestSchemaOf(document: OpenApiDocument, operation: Record<string, unknown>): unknown {
  const body = resolveRef(document, operation.requestBody) as
    | { content?: Record<string, { schema?: unknown }> }
    | undefined;

  if (!body?.content) return undefined;

  for (const media of Object.values(body.content)) {
    if (media?.schema) return media.schema;
  }

  return undefined;
}

function responseSchemaOf(document: OpenApiDocument, operation: Record<string, unknown>): unknown {
  const responses = resolveRef(document, operation.responses) as Record<string, unknown> | undefined;
  if (!responses) return undefined;

  for (const status of Object.keys(responses)) {
    if (!/^2\d\d$/.test(status) && status !== "default") continue;
    const response = resolveRef(document, responses[status]) as
      | { content?: Record<string, { schema?: unknown }> }
      | undefined;
    if (!response?.content) continue;

    for (const media of Object.values(response.content)) {
      if (media?.schema) return media.schema;
    }
  }

  return undefined;
}

/**
 * Check a contract against an OpenAPI document already fetched by the caller.
 *
 * The FETCH is the caller's, not this function's — so the check is a pure
 * function of two documents and can be tested against a fixture with no network,
 * and so a host chooses its own HTTP client, cache and proxy. A checker that
 * fetched would also be a checker that phones out on a schedule, which is
 * exactly the thing several hosts of this package refuse to have.
 */
export function checkAgainstOpenApi(contract: ApiContract, document: unknown): DriftReport {
  const checkedAt = new Date().toISOString();
  const findings: DriftFinding[] = [];

  if (!document || typeof document !== "object" || !(document as OpenApiDocument).paths) {
    return {
      connector: contract.connector,
      checkedAt,
      outcome: "unchecked",
      method: "openapi",
      findings: [
        {
          kind: "unreadable-spec",
          detail:
            "the document has no `paths`, so it is not an OpenAPI description we can read. Reported as UNCHECKED " +
            "rather than clean — a checker that cannot see is not a checker that saw nothing wrong.",
        },
      ],
    };
  }

  const spec = document as OpenApiDocument;

  for (const operation of contract.operations) {
    const path = spec.paths?.[operation.path];

    if (!path) {
      findings.push({
        kind: "missing-operation",
        operation: operation.operation,
        detail: `${operation.method} ${operation.path} is not in the spec at all. The path moved or was removed.`,
      });
      continue;
    }

    const method = path[operation.method.toLowerCase()] as Record<string, unknown> | undefined;

    if (!method) {
      findings.push({
        kind: "missing-operation",
        operation: operation.operation,
        detail: `${operation.path} exists but no longer accepts ${operation.method}.`,
      });
      continue;
    }

    if (operation.sends?.length) {
      const accepted = propertiesOf(spec, requestSchemaOf(spec, method));
      // An empty schema means "we could not read it", not "it accepts nothing".
      if (accepted.size > 0) {
        for (const field of operation.sends) {
          if (!accepted.has(field)) {
            findings.push({
              kind: "missing-request-field",
              operation: operation.operation,
              detail: `sends \`${field}\`, which the spec no longer lists on ${operation.method} ${operation.path}.`,
            });
          }
        }
      }
    }

    if (operation.reads?.length) {
      const returned = propertiesOf(spec, responseSchemaOf(spec, method));
      if (returned.size > 0) {
        for (const field of operation.reads) {
          if (!returned.has(field)) {
            findings.push({
              kind: "missing-response-field",
              operation: operation.operation,
              detail:
                `reads \`${field}\`, which the spec no longer returns from ${operation.method} ${operation.path}. ` +
                "This is the silent kind: the code keeps running and produces nothing.",
            });
          }
        }
      }
    }
  }

  findings.push(...staleReviewFindings(contract, checkedAt));

  return {
    connector: contract.connector,
    checkedAt,
    outcome: findings.some((finding) => finding.kind !== "stale-review") ? "drifted" : "clean",
    method: "openapi",
    findings,
  };
}

/* ── The no-spec fallback: recorded shapes ───────────────────────────────── */

/**
 * The field NAMES a connector saw in a real response, per operation.
 *
 * Names only. A recorded response body from a real account is a data leak
 * wearing a test fixture's clothes, and the thing being checked is the shape.
 */
export type RecordedShape = {
  connector: string;
  recordedOn: string;
  operations: Record<string, string[]>;
};

/**
 * The field names present in a response, flattened to dotted paths.
 *
 * Arrays collapse to their first element's shape: a response with three items
 * has one shape, and recording `items.0.id`, `items.1.id`, `items.2.id` would
 * make the fixture depend on how much data the account happened to have.
 */
export function shapeOf(value: unknown, prefix = "", depth = 0): string[] {
  if (depth > 6 || value === null || typeof value !== "object") return prefix ? [prefix] : [];

  if (Array.isArray(value)) {
    return value.length === 0 ? [`${prefix}[]`] : shapeOf(value[0], `${prefix}[]`, depth + 1);
  }

  const names: string[] = [];
  for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
    const path = prefix ? `${prefix}.${key}` : key;
    names.push(...shapeOf(nested, path, depth + 1));
  }

  return names.sort();
}

/**
 * Compare a live response's shape against what was recorded.
 *
 * **Only fields the connector READS are findings.** A provider adding fields is
 * normal and healthy; reporting it would bury the one line that matters under
 * every additive release, and a drift report nobody reads is worse than none
 * because it is evidence somebody is watching.
 */
export function checkAgainstRecordedShape(
  contract: ApiContract,
  operation: string,
  liveResponse: unknown,
): DriftReport {
  const checkedAt = new Date().toISOString();
  const declared = contract.operations.find((entry) => entry.operation === operation);
  const present = new Set(shapeOf(liveResponse));
  const findings: DriftFinding[] = [];

  for (const field of declared?.reads ?? []) {
    // A dotted path matches its own name or any array-bearing variant of it, so
    // a connector reading `data.id` still matches `data[].id`.
    const found = [...present].some((name) => name === field || name.replace(/\[\]/g, "") === field);

    if (!found) {
      findings.push({
        kind: "missing-response-field",
        operation,
        detail:
          `reads \`${field}\`, which the live response no longer carries. Present instead: ` +
          `${[...present].slice(0, 20).join(", ")}${present.size > 20 ? ", …" : ""}`,
      });
    }
  }

  findings.push(...staleReviewFindings(contract, checkedAt));

  return {
    connector: contract.connector,
    checkedAt,
    outcome: findings.some((finding) => finding.kind !== "stale-review") ? "drifted" : "clean",
    method: "recorded-shape",
    findings,
  };
}

/** How long a contract may go unreviewed before that is itself a finding. */
export const REVIEW_STALE_DAYS = 180;

function staleReviewFindings(contract: ApiContract, checkedAt: string): DriftFinding[] {
  const reviewed = Date.parse(contract.reviewedOn);
  if (!Number.isFinite(reviewed)) {
    return [{ kind: "stale-review", detail: `reviewedOn "${contract.reviewedOn}" is not a date.` }];
  }

  const days = Math.floor((Date.parse(checkedAt) - reviewed) / 86_400_000);

  return days > REVIEW_STALE_DAYS
    ? [
        {
          kind: "stale-review",
          detail:
            `nobody has read this provider's documentation in ${days} days. Not drift — an absence of looking, ` +
            "which is the state a silent break grows in.",
        },
      ]
    : [];
}

/**
 * A contract whose provider publishes nothing, checked as far as it can be.
 *
 * Reported as `unchecked` with the reason, never `clean`. Those are different
 * claims and the difference is the entire value of a report.
 */
export function unchecked(contract: ApiContract): DriftReport {
  const checkedAt = new Date().toISOString();

  return {
    connector: contract.connector,
    checkedAt,
    outcome: "unchecked",
    method: "none",
    findings: [
      {
        kind: "unreadable-spec",
        detail:
          contract.spec.kind === "none"
            ? contract.spec.note
            : "no spec document was supplied to the checker, so nothing was compared.",
      },
      ...staleReviewFindings(contract, checkedAt),
    ],
  };
}
