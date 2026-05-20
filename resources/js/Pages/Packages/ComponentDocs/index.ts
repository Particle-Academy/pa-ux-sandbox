import type { ComponentDoc } from "./types";
import { actionDoc } from "./Action";

/**
 * Per-component documentation registry. When a `pkg/slug` is in here,
 * the component detail page swaps in two extra tabs: Examples (gallery
 * of named demos) and Props (typed table). Components without an entry
 * keep the existing Preview / Install / Source / Dependencies surface.
 *
 * Roll out incrementally — adding an entry here lights up the docs tabs
 * for that component automatically.
 */
const DOCS: Record<string, ComponentDoc> = {
    "react-fancy/action": actionDoc,
};

export function getComponentDoc(pkg: string, slug: string): ComponentDoc | null {
    return DOCS[`${pkg}/${slug}`] ?? null;
}

export type { ComponentDoc, ComponentDocExample, ComponentDocProp } from "./types";
