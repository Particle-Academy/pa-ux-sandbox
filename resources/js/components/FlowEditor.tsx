import { forwardRef, type ComponentProps } from "react";
import { FlowEditor as BaseFlowEditor, type FlowEditorApi } from "@particle-academy/fancy-flow";
import { reactFancyFieldRenderers } from "@particle-academy/fancy-flow/fields/react-fancy";

/**
 * `<FlowEditor>` with this app's field renderers already attached.
 *
 * fancy-flow renders a `type: "json"` config field as a bare textarea, on
 * purpose: it themes every surface through a `--ff-*` token layer and
 * react-fancy's primitives are hardcoded Tailwind classes that read no custom
 * properties, so the package will not import them. It offers the
 * `/fields/react-fancy` subpath instead, and a host opts in.
 *
 * This app IS a react-fancy app — every page on it is — so it opts in
 * everywhere. Wrapping rather than passing `fieldRenderers` at each of the
 * fourteen mount sites is the difference between being right now and staying
 * right: the fifteenth would have been added without it, and a JSON field
 * quietly falling back to a textarea looks like a styling choice rather than a
 * missed prop.
 *
 * A test (`FlowEditorUsesFieldRenderersTest`) fails if a page imports
 * `FlowEditor` straight from the package again.
 *
 * Every prop, and the imperative `FlowEditorApi` ref, pass straight through —
 * including `fieldRenderers`, so a page that needs its own can still override
 * or extend this default.
 */
export const FlowEditor = forwardRef<FlowEditorApi, ComponentProps<typeof BaseFlowEditor>>(
    function FlowEditor({ fieldRenderers, ...props }, ref) {
        return (
            <BaseFlowEditor
                ref={ref}
                {...props}
                fieldRenderers={{ ...reactFancyFieldRenderers, ...fieldRenderers }}
            />
        );
    },
);

export type { FlowEditorApi };
