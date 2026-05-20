import type { ReactNode } from "react";

/**
 * Documentation depth for a single component page. Each entry feeds two
 * new tabs on the component detail page:
 *
 *   Examples — gallery of named, hand-curated demos (each with prose + a
 *              live render + a copyable code block)
 *   Props    — typed table of every prop the component accepts
 *
 * The detail page shows these tabs only when a doc entry exists for the
 * component slug. Components without an entry keep the existing
 * Preview / Install / Source / Dependencies set — so we can roll out
 * documentation incrementally across the 83 components.
 */

export interface ComponentDocExample {
    /** Display name for the example section. */
    name: string;
    /** One-sentence rationale shown above the render. Optional. */
    description?: string;
    /** Live JSX rendered inside the example body. */
    render: () => ReactNode;
    /** Verbatim source string for the copy-to-clipboard block below the render. */
    code: string;
}

export interface ComponentDocProp {
    name: string;
    /** TypeScript-flavored type string. Keep short — full unions truncate badly in the table. */
    type: string;
    /** Stringified default value, or `—` if none. */
    default?: string;
    /** What the prop controls. One short sentence. */
    description: string;
    /** Mark behind a small "required" chip. */
    required?: boolean;
}

export interface ComponentDoc {
    /** Optional intro prose rendered above the Examples tab. */
    intro?: ReactNode;
    examples: ComponentDocExample[];
    /** Props rendered as a table in the Props tab. */
    props: ComponentDocProp[];
    /** Optional accessibility / keyboard / data-attr notes rendered below the props table. */
    notes?: ReactNode;
}
