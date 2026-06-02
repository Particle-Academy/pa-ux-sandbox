import type { ComponentDoc } from "./types";
import { buttonDoc } from "./Button";

/**
 * `Action` is the deprecated alias of `Button`. The page keeps every example
 * (they're the same component) but leads with a deprecation note pointing at
 * Button — see [[Button]].
 */
export const actionDoc: ComponentDoc = {
    ...buttonDoc,
    intro: (
        <>
            <code>Action</code> has been renamed to <code>Button</code>. It
            remains a fully-functional alias for backward compatibility and will
            be removed in a future major version — new code should import{" "}
            <code>Button</code>. Everything below behaves identically; only the
            name changed.
        </>
    ),
};
