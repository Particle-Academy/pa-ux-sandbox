// GENERATED from @particle-academy/fancy-connectors — src/faker.ts
// Do not edit here. Fix it in the package and re-run `php artisan flow:build`;
// a test fails the build when this copy and the package disagree.

/**
 * The faker layer — every connector ships one, always.
 *
 * ## Why every connector, and not just the ones without a sandbox
 *
 * A sandbox still needs an account, a key, a network, and a provider that is
 * up. That is four ways for someone evaluating the kit to get nothing working,
 * before they have learned anything about the kit. A faker removes all four:
 * vendor a node, drop it on a canvas, press run, see a shaped result.
 *
 * It is also what makes the golden fixtures honest. Fixtures run on both
 * runtimes and are the publish gate; if they needed a network they would either
 * be skipped in CI or be flaky, and a flaky gate is one people learn to
 * re-run rather than read.
 *
 * ## Deterministic, not random
 *
 * Same inputs, same output — always. A faker that returns a fresh uuid every
 * call cannot be asserted on, so its fixtures degrade to "it did not throw",
 * which is the assertion that catches nothing. Values here are derived from a
 * seed built out of the service, the operation and the request, so two runs
 * agree and two runtimes can be compared to each other.
 *
 * The values are obviously fake ON PURPOSE — `fake_`-prefixed ids, `example.test`
 * hosts, round numbers. Nobody should ever look at a faked result and wonder
 * whether it moved real money.
 */

/** A faker: one function per service, switching on the operation. */
export type ConnectorFaker = (operation: string, request: FakeRequest) => unknown;

export type FakeRequest = {
  /** The node's resolved config. */
  config: Record<string, unknown>;
  /** The value on the incoming wire. */
  input?: unknown;
  /** Deterministic helpers, seeded from service + operation + config. */
  fake: FakeValues;
};

/**
 * Deterministic value helpers handed to a faker.
 *
 * Small on purpose. A faker's job is to return the SHAPE the provider returns —
 * the field names a downstream node will reference — not to simulate the
 * provider's business logic.
 */
export type FakeValues = {
  /** A stable id with the provider's usual prefix: `id("ch")` → `ch_fake_1a2b3c`. */
  id: (prefix: string) => string;
  /** A stable integer in `[min, max]`. */
  int: (min: number, max: number) => number;
  /** Pick a stable element of a list. */
  pick: <T>(options: readonly T[]) => T;
  /** A fixed ISO-8601 instant, offset by whole seconds. Never `Date.now()`. */
  timestamp: (offsetSeconds?: number) => string;
  /** A stable lowercase hex string of `length` characters. */
  hex: (length: number) => string;
};

/**
 * The instant every faker counts from.
 *
 * A constant rather than the clock, because a fixture asserting on `createdAt`
 * must not start failing tomorrow. Chosen to be recognisably synthetic.
 */
export const FAKE_EPOCH = "2026-01-01T00:00:00.000Z";

/** FNV-1a. Small, dependency-free, and stable across both runtimes. */
export function seedFrom(...parts: unknown[]): number {
  const text = parts.map((part) => (typeof part === "string" ? part : stableJson(part))).join("|");
  let hash = 0x811c9dc5;

  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    // 32-bit FNV prime multiply, kept in range without BigInt.
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }

  return hash >>> 0;
}

/**
 * Key order must not change a seed.
 *
 * `JSON.stringify` preserves insertion order, so `{a,b}` and `{b,a}` would hash
 * differently and the "same inputs, same output" promise would hold only for
 * objects that happened to be built in the same order — which is exactly the
 * kind of almost-true that survives review and fails in a fixture months later.
 */
function stableJson(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value) ?? "null";
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;

  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, v]) => v !== undefined)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([k, v]) => `${JSON.stringify(k)}:${stableJson(v)}`);

  return `{${entries.join(",")}}`;
}

/** Build the deterministic helpers for one faked call. */
export function fakeValues(seed: number): FakeValues {
  // A tiny xorshift, advanced per call so successive helpers differ while the
  // whole sequence stays a pure function of the seed.
  let state = seed || 0x9e3779b9;
  const next = (): number => {
    state ^= state << 13;
    state >>>= 0;
    state ^= state >>> 17;
    state ^= state << 5;
    state >>>= 0;

    return state;
  };

  const hex = (length: number): string => {
    let out = "";
    while (out.length < length) out += next().toString(16).padStart(8, "0");

    return out.slice(0, length);
  };

  return {
    hex,
    id: (prefix: string) => `${prefix}_fake_${hex(12)}`,
    int: (min: number, max: number) => min + (next() % Math.max(1, max - min + 1)),
    pick: <T>(options: readonly T[]): T => options[next() % options.length] as T,
    timestamp: (offsetSeconds = 0) =>
      new Date(Date.parse(FAKE_EPOCH) + offsetSeconds * 1000).toISOString(),
  };
}

/** Build the request handed to a faker, with helpers already seeded. */
export function fakeRequest(
  service: string,
  operation: string,
  config: Record<string, unknown>,
  input?: unknown,
): FakeRequest {
  return { config, input, fake: fakeValues(seedFrom(service, operation, config)) };
}
