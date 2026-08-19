// GENERATED from @particle-academy/fancy-connector-core — src/chain.ts
// Do not edit here. Fix it in the package and re-run `php artisan flow:build`;
// a test fails the build when this copy and the package disagree.

/**
 * Posting a sequence as a CHAIN — the bug that is silent in every direction.
 *
 * ## What went wrong in the reference implementation
 *
 * A renderer split long copy into `(1/3)`, `(2/3)`, `(3/3)` and the connector
 * posted each segment **top-level**, on two providers. Numbered like a thread,
 * connected to nothing. Nothing threw; the send reported success; the numbering
 * made it look deliberate, so a reader assumes the thread exists and they missed
 * it.
 *
 * It was unreachable by any test, because the chaining lived inside a loop that
 * needed a live session. So the chain builder here **takes the post function as
 * an argument** — which is the entire reason this is a module rather than four
 * lines inside a connector.
 *
 * ## The rule it encodes, which is one line and easy to reverse
 *
 * > **`root` is fixed at the top of the chain and never moves. `parent` advances
 * > to whatever was just posted.**
 *
 * Reverse them and every message attaches to the first: a fan, not a thread —
 * and the provider's response looks identical either way, which is why this
 * needs a test rather than care.
 *
 * ## What it deliberately does NOT do
 *
 * No retry. Retry wraps ONE request (see `delivery.ts`); wrapping the chain
 * would re-post every earlier segment when a later one failed, turning a partial
 * send into a duplicated one. A partial chain is reported with what it did post,
 * so a person can see exactly where it stopped.
 */

/**
 * A reference to something already posted, as the provider identifies it.
 *
 * Opaque to this module: AT Protocol needs a uri **and** a cid, Mastodon needs
 * one status id, Telegram needs a message id and a chat. A shape naming one
 * provider's model would be wrong for the next one, so the chain carries
 * whatever the poster returned and never reads inside it.
 *
 * **`object`, not `Record<string, string | number>`** — and the difference is
 * not pedantry. An ordinary interface does not satisfy an index signature
 * unless it declares one, so `interface PostRef { uri: string; cid: string }`
 * did NOT satisfy the old constraint. The reference consumer worked around it
 * with `postChain<T & ChainRef>` plus two `as unknown as` casts, and could not
 * use `ChainOutcome<T>` in their own signatures at all — because the only other
 * fix was to add an index signature to a type used across their codebase in
 * order to satisfy a generic used in one place, which weakens the type
 * everywhere to please one call site.
 *
 * A constraint everyone casts past is not enforcing anything; it is just making
 * the casts. `object` still rejects the mistake worth rejecting — a primitive
 * as a reference — and accepts every real one.
 */
export type ChainRef = object;

export type ChainLinks<Ref extends ChainRef> = {
  /** The top of the conversation. Fixed for the whole chain. */
  root: Ref;
  /** The message immediately above this one. Advances every step. */
  parent: Ref;
};

export type ChainOutcome<Ref extends ChainRef> = {
  /** Everything that was posted, in order. */
  posted: Ref[];
  /** The failure that stopped it, if one did. */
  failed?: { index: number; error: unknown };
};

/**
 * Post `segments` as a connected chain, optionally starting inside an existing
 * conversation.
 *
 * `post` is given the text and the links for this position — `undefined` for a
 * top-level message — and returns the provider's reference to what it created.
 *
 * **Stops at the first failure and reports what it posted.** Continuing would
 * produce a thread with a hole in it, and unwinding is not available: nothing
 * here can delete a public message, and pretending otherwise would be worse than
 * the hole.
 */
export async function postChain<Ref extends ChainRef>(
  segments: string[],
  answering: ChainLinks<Ref> | undefined,
  post: (text: string, links: ChainLinks<Ref> | undefined, index: number) => Promise<Ref>,
): Promise<ChainOutcome<Ref>> {
  const posted: Ref[] = [];
  let root = answering?.root;
  let parent = answering?.parent;

  for (const [index, text] of segments.entries()) {
    let made: Ref;

    try {
      made = await post(text, root && parent ? { root, parent } : undefined, index);
    } catch (error) {
      return { posted, failed: { index, error } };
    }

    posted.push(made);
    // The first thing WE post becomes the root of our own chain — unless we are
    // already inside somebody else's, in which case theirs stays the root.
    root = root ?? made;
    parent = made;
  }

  return { posted };
}
